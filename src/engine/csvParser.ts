import {
  EMPLOYEE_ENGAGEMENT_CSV,
  EMPLOYEE_MASTER_CSV,
  EXIT_THRIVE_CSV,
  GROWTH_CSV,
  LEARNING_DEVELOPMENT_CSV,
  PERFORMANCE_APPRAISAL_CSV,
  RECRUITMENT_CSV,
  SIGNALS_LOG_CSV,
} from "../data/csvRaw";
import {
  EmployeeRecord,
  EngagementActionInfo,
  LIFECYCLE_STAGES,
  LifecycleEvidenceRow,
  LifecycleStage,
  ParsedDataset,
} from "../types/journey";
import { formatDisplayDate } from "../utils/dateFormat";
import { extractSkillsAndCourseGaps } from "./skillsAndScoring";

// Strictly excluded columns: NEVER read, stored, or displayed
export const EXCLUDED_SENSITIVE_COLUMNS = new Set([
  "Current_CTC_INR",
  "Previous_CTC_INR",
  "Last_Increment_Percent",
  "Annual_Bonus_INR",
  "Training_Investment_INR",
  "Estimated_Replacement_Cost_INR",
  "Engagement Score",
  "eNPS",
  "Engagement_Score_100",
  "Engagement_Trend",
  "Wellbeing_Score_100",
  "Wellbeing_Trend",
  "Wellbeing/Support Request",
  "Absence_Days_12M",
  "Leave_Trend",
  "Exit_Risk_Indicator",
  "Exit Reason Category",
  "Regrettable Exit (Y/N)",
  "Rehire Eligibility",
  "Exit Interview Summary",
  "Exit Type",
  "Full & Final Status",
  "Candidate Name",
  "Interview Feedback",
  "Offered CTC (₹)",
  "Offer Status",
  "Recruiter",
  "Recruitment Source",
  "Selection Decision",
]);

function parseCsvRows(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  const normalized = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < normalized.length && normalized[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (ch === "\n") {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += ch;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];
  const headers = rows[0];
  const records: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0] === "") continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      // Privacy guard: never read or retain excluded sensitive columns
      if (EXCLUDED_SENSITIVE_COLUMNS.has(header)) {
        continue;
      }
      obj[header] = row[c] ?? "";
    }
    records.push(obj);
  }

  return records;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

// Reference current date aligned with workspace date (20-Nov-2026)
const REFERENCE_TODAY = new Date(2026, 10, 20);

function parseDdMmmYyyy(dateStr: string): Date | null {
  const match = dateStr.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = MONTH_MAP[match[2].toLowerCase()];
  const year = Number(match[3]);
  if (month === undefined || Number.isNaN(day) || Number.isNaN(year)) return null;
  return new Date(year, month, day);
}

function normalizeSourceLabel(rawSource: string): string {
  const lower = rawSource.trim().toLowerCase();
  if (lower.includes("master")) return "Master";
  if (lower.includes("growth")) return "Growth";
  if (lower.includes("learn")) return "Learning";
  if (lower.includes("perform")) return "Performance";
  if (lower.includes("engage")) return "Engagement";
  if (lower.includes("onboard")) return "Onboarding";
  return rawSource.trim() || "Master";
}

function formatIsoDateShort(raw: string): string {
  return formatDisplayDate(raw);
}

function normalizeStage(rawStage: string): LifecycleStage {
  const lower = rawStage.trim().toLowerCase();
  if (lower === "recruit") return "Recruit";
  if (lower === "onboard" || lower === "onboarding") return "Onboard";
  if (lower === "learn" || lower === "learning") return "Learn";
  if (lower === "perform" || lower === "performance") return "Perform";
  if (lower === "engage" || lower === "engagement") return "Engage";
  if (lower === "grow" || lower === "growth") return "Grow";
  if (lower === "thrive") return "Thrive";
  return "Grow";
}

function parseIsoOrDdMmmYyyy(dateStr: string): Date | null {
  const ddMmm = parseDdMmmYyyy(dateStr);
  if (ddMmm) return ddMmm;
  const isoMatch = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (!isoMatch) return null;
  const year = Number(isoMatch[1]);
  const month = Number(isoMatch[2]) - 1;
  const day = Number(isoMatch[3]);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  return new Date(year, month, day);
}

export function loadJourneyDataset(): ParsedDataset {
  const masterRows = parseCsvRows(EMPLOYEE_MASTER_CSV);
  const growthRows = parseCsvRows(GROWTH_CSV);
  const learningRows = parseCsvRows(LEARNING_DEVELOPMENT_CSV);
  const perfRows = parseCsvRows(PERFORMANCE_APPRAISAL_CSV);
  const engagementRows = parseCsvRows(EMPLOYEE_ENGAGEMENT_CSV);
  const exitRows = parseCsvRows(EXIT_THRIVE_CSV);
  const recruitmentRows = parseCsvRows(RECRUITMENT_CSV);
  const rawSignalRows = parseCsvRows(SIGNALS_LOG_CSV);

  const growthById = new Map<string, Record<string, string>>(
    growthRows.map((r) => [r["Employee ID"], r])
  );
  const learningById = new Map<string, Record<string, string>>(
    learningRows.map((r) => [r["Employee ID"], r])
  );
  const perfById = new Map<string, Record<string, string>>(
    perfRows.map((r) => [r["Employee_ID"], r])
  );
  const engagementById = new Map<string, Record<string, string>>(
    engagementRows.map((r) => [r["Employee ID"], r])
  );
  const exitById = new Map<string, Record<string, string>>(
    exitRows.map((r) => [r["Employee ID"], r])
  );

  const masterIds = new Set(masterRows.map((r) => r["Employee ID"]));

  // Dedupe Signals_Log by Signal ID and isolate orphan employee IDs safely
  const seenSignalIds = new Set<string>();
  const signalsByEmpId = new Map<string, LifecycleEvidenceRow[]>();
  const orphanSignalIds: string[] = [];

  for (const row of rawSignalRows) {
    const signalId = row["Signal ID"];
    if (!signalId || seenSignalIds.has(signalId)) {
      continue;
    }
    seenSignalIds.add(signalId);

    const empId = row["Employee ID"];
    if (!empId || !masterIds.has(empId)) {
      orphanSignalIds.push(signalId);
      continue;
    }

    const stage = normalizeStage(row["Stage"] || "Grow");
    const list = signalsByEmpId.get(empId) ?? [];
    // Collapse identical sentence+stage entries from repeated pipeline runs while keeping unique signal ID
    const sentence = row["Evidence"] || row["Signal Type"] || "";
    const duplicateSentence = list.find(
      (item) => item.stage === stage && item.sentence === sentence
    );
    if (!duplicateSentence) {
      list.push({
        id: signalId,
        stage,
        sentence,
        sourceTab: normalizeSourceLabel(row["Source Tab"] || "Growth"),
        date: formatIsoDateShort(row["Logged At"] || ""),
        isSignalLog: true,
        fieldLabel: row["Signal Type"] || undefined,
      });
      signalsByEmpId.set(empId, list);
    }
  }

  const allEmployees: EmployeeRecord[] = masterRows.map((m) => {
    const employeeId = m["Employee ID"];
    const g = growthById.get(employeeId) ?? {};
    const l = learningById.get(employeeId) ?? {};
    const p = perfById.get(employeeId) ?? {};
    const e = engagementById.get(employeeId) ?? {};
    const exitRow = exitById.get(employeeId);
    const hasExitRecord = Boolean(exitRow);

    const fullName = m["Full Name"] || employeeId;
    const firstName = fullName.split(" ")[0] || fullName;
    const jobTitle = m["Job Title"] || "";
    const employmentStatus = m["Employment Status"] || "";
    const performanceJobRole = p["Job_Role"] || null;
    const recordsDisagree = Boolean(
      performanceJobRole &&
        performanceJobRole.trim().toLowerCase() !== jobTitle.trim().toLowerCase()
    );

    const internalMobilityInterest = g["Internal Mobility Interest"] || "No";
    const isEligible =
      !hasExitRecord &&
      employmentStatus.trim().toLowerCase() === "active" &&
      (internalMobilityInterest.trim().toLowerCase() === "yes" ||
        internalMobilityInterest.trim().toLowerCase() === "open to discussion");

    const { extractedSkills, inProgressOrNotStartedCourses } =
      extractSkillsAndCourseGaps({
        jobTitle,
        team: m["Team"] || "",
        courseProgram: l["Course/Program"] || "",
        learningStatus: l["Learning Status"] || "",
        skillsAcquired: p["Skills_Acquired"] || "",
        keyStrengths: p["Key_Strengths"] || "",
      });

    // Engagement action check (Open or Overdue)
    let engagementAction: EngagementActionInfo | null = null;
    if (e["Engagement Action"]) {
      const status = e["Action Status"] || "Open";
      const dueDateStr = e["Action Due Date"] || "";
      const parsedDue = parseDdMmmYyyy(dueDateStr);
      const isClosed =
        status.trim().toLowerCase() === "closed" ||
        status.trim().toLowerCase() === "completed";
      const isOverdue = Boolean(!isClosed && parsedDue && parsedDue < REFERENCE_TODAY);
      const isOpenOrOverdue = status.trim().toLowerCase() === "open" || isOverdue;
      engagementAction = {
        action: e["Engagement Action"],
        owner: e["Action Owner"] || "Unassigned",
        dueDate: formatDisplayDate(dueDateStr),
        status,
        isOpenOrOverdue,
        isOverdue,
      };
    }

    const evidenceByStage: Record<LifecycleStage, LifecycleEvidenceRow[]> = {
      Recruit: [],
      Onboard: [],
      Learn: [],
      Perform: [],
      Engage: [],
      Grow: [],
      Thrive: [],
    };

    // Add Signals_Log entries
    const empSignals = signalsByEmpId.get(employeeId) ?? [];
    for (const sig of empSignals) {
      evidenceByStage[sig.stage].push(sig);
    }

    // Onboard fallback/context from Master Date of Joining if no Onboard signal present
    if (evidenceByStage.Onboard.length === 0 && m["Date of Joining"]) {
      evidenceByStage.Onboard.push({
        id: `${employeeId}-onboard-master`,
        stage: "Onboard",
        sentence: `Joined ${formatDisplayDate(m["Date of Joining"])} in ${m["Team"]} (${m["Work Mode"]}).`,
        sourceTab: "Master",
        date: formatDisplayDate(m["Date of Joining"]),
      });
    }

    // Learn evidence from Learning_Development
    if (l["Course/Program"]) {
      const courseDesc = `${l["Course/Program"]} (${l["Training Provider"]}) — Status: ${l["Learning Status"]}${
        l["Assessment Score"] ? ` · Assessment: ${l["Assessment Score"]}%` : ""
      }${l["Certification"] ? ` · Certification: ${l["Certification"]}` : ""}.`;
      evidenceByStage.Learn.push({
        id: `${employeeId}-learn-course`,
        stage: "Learn",
        sentence: courseDesc,
        sourceTab: "Learning",
        date: formatDisplayDate(
          l["Training Completion Date"] || l["Training Start Date"] || ""
        ),
        fieldLabel: `Learning Need: ${l["Learning Needs"]}`,
      });
    }
    if (l["Learning Feedback"]) {
      evidenceByStage.Learn.push({
        id: `${employeeId}-learn-feedback`,
        stage: "Learn",
        sentence: l["Learning Feedback"],
        sourceTab: "Learning",
        date: formatDisplayDate(
          l["Training Completion Date"] || l["Training Start Date"] || ""
        ),
        isSampleText: true,
        fieldLabel: "Learning Feedback",
      });
    }

    // Perform evidence from Performance_Appraisal (non-sensitive only)
    const rating = Number(p["Performance_Rating_5"] || 0);
    if (p["Appraisal_Period"]) {
      evidenceByStage.Perform.push({
        id: `${employeeId}-perform-rating`,
        stage: "Perform",
        sentence: `Performance rating ${rating}/5 (${p["Performance_Trend"]} trend), Goal achievement ${p["Goal_Achievement_Percent"]}%, Promotion readiness: ${p["Promotion_Readiness"]}.`,
        sourceTab: "Performance",
        date: p["Appraisal_Period"],
        fieldLabel: "Appraisal Summary",
      });
    }
    if (p["Key_Strengths"] || p["Skills_Acquired"]) {
      evidenceByStage.Perform.push({
        id: `${employeeId}-perform-skills`,
        stage: "Perform",
        sentence: `Key strengths: ${p["Key_Strengths"] || "—"}. Skills acquired: ${
          p["Skills_Acquired"] || "—"
        }. Development area: ${p["Development_Areas"] || "—"}.`,
        sourceTab: "Performance",
        date: p["Appraisal_Period"] || "",
        fieldLabel: "Strengths & Skills",
      });
    }
    if (p["Manager_Feedback_Summary"]) {
      evidenceByStage.Perform.push({
        id: `${employeeId}-perform-feedback`,
        stage: "Perform",
        sentence: p["Manager_Feedback_Summary"],
        sourceTab: "Performance",
        date: p["Appraisal_Period"] || "",
        isSampleText: true,
        fieldLabel: "Manager Feedback Summary",
      });
    }

    // Engage evidence from Employee_Engagement (non-sensitive only)
    if (e["Stay Interview Notes"]) {
      evidenceByStage.Engage.push({
        id: `${employeeId}-engage-stay`,
        stage: "Engage",
        sentence: e["Stay Interview Notes"],
        sourceTab: "Engagement",
        date: formatDisplayDate(
          e["Stay Interview Date"] || e["Engagement Survey Date"] || ""
        ),
        isSampleText: true,
        fieldLabel: "Stay Interview Notes",
      });
    }
    if (engagementAction) {
      evidenceByStage.Engage.push({
        id: `${employeeId}-engage-action`,
        stage: "Engage",
        sentence: `Action: ${engagementAction.action} (Owner: ${engagementAction.owner}, Due: ${engagementAction.dueDate}, Status: ${engagementAction.status}${
          engagementAction.isOverdue ? " — Overdue" : ""
        }).`,
        sourceTab: "Engagement",
        date: engagementAction.dueDate,
        fieldLabel: "Engagement Action",
      });
    }
    if (e["Recognition Received"] === "Yes") {
      const recDate = formatDisplayDate(e["Recognition Date"] || "");
      evidenceByStage.Engage.push({
        id: `${employeeId}-engage-recognition`,
        stage: "Engage",
        sentence: `Peer/manager recognition received on ${recDate}.`,
        sourceTab: "Engagement",
        date: recDate,
        fieldLabel: "Recognition",
      });
    }

    // Grow evidence from Growth
    if (g["Career Aspiration"]) {
      evidenceByStage.Grow.push({
        id: `${employeeId}-grow-aspiration`,
        stage: "Grow",
        sentence: `Aspires to ${g["Career Aspiration"]} (${g["Career Path"]} path) · Potential: ${g["Potential Rating"]} · Mobility interest: ${g["Internal Mobility Interest"]} · Mentor: ${g["Mentor"]}.`,
        sourceTab: "Growth",
        date: formatDisplayDate(g["Next Career Discussion Date"] || ""),
        fieldLabel: "Career & Potential",
      });
    }
    if (g["Development Plan"]) {
      evidenceByStage.Grow.push({
        id: `${employeeId}-grow-plan`,
        stage: "Grow",
        sentence: g["Development Plan"],
        sourceTab: "Growth",
        date: formatDisplayDate(g["Next Career Discussion Date"] || ""),
        isSampleText: true,
        fieldLabel: "Development Plan",
      });
    }

    // Thrive evidence from Exit_Thrive (only Exit process and Alumni follow-up)
    if (exitRow) {
      const closureStatus = exitRow["Exit Closure Status"] || "In Progress";
      const followUpDate = formatDisplayDate(
        exitRow["Alumni/Thrive Follow-up Date"] || ""
      );
      evidenceByStage.Thrive = [
        {
          id: `${employeeId}-thrive-closure`,
          stage: "Thrive",
          sentence: `Exit process: ${closureStatus}`,
          sourceTab: "Exit_Thrive",
          date: "",
        },
        {
          id: `${employeeId}-thrive-alumni`,
          stage: "Thrive",
          sentence: `Alumni follow-up: ${followUpDate || "Not scheduled"}`,
          sourceTab: "Exit_Thrive",
          date: "",
        },
      ];
    } else {
      evidenceByStage.Thrive = [];
    }

    // Ensure every stage array exists cleanly
    for (const stage of LIFECYCLE_STAGES) {
      if (!evidenceByStage[stage]) {
        evidenceByStage[stage] = [];
      }
    }

    return {
      employeeId,
      fullName,
      firstName,
      workEmail: m["Work Email"] || "",
      location: m["Location"] || "",
      businessUnit: m["Business Unit"] || "",
      department: m["Department"] || "",
      team: m["Team"] || "",
      jobTitle,
      gradeBand: m["Grade/Band"] || "",
      employmentType: m["Employment Type"] || "",
      managerId: m["Manager ID"] || "",
      managerName: m["Manager Name"] || "",
      hrbp: m["HRBP"] || "",
      workMode: m["Work Mode"] || "",
      employmentStatus,
      dateOfJoining: formatDisplayDate(m["Date of Joining"] || ""),

      performanceJobRole,
      recordsDisagree,

      careerAspiration: g["Career Aspiration"] || "",
      careerPath: g["Career Path"] || "",
      potentialRating: g["Potential Rating"] || "",
      talentPool: g["Talent Pool"] || "",
      successionCriticality: g["Succession Criticality"] || "",
      successorIdentified: g["Successor Identified"] || "",
      developmentPlan: g["Development Plan"] || "",
      mentor: g["Mentor"] || "",
      internalMobilityInterest: internalMobilityInterest,
      lastPromotionDate: formatDisplayDate(g["Last Promotion Date"] || ""),
      nextCareerDiscussionDate: formatDisplayDate(
        g["Next Career Discussion Date"] || ""
      ),

      learningNeeds: l["Learning Needs"] || "",
      learningPlan: l["Learning Plan"] || "",
      courseProgram: l["Course/Program"] || "",
      trainingProvider: l["Training Provider"] || "",
      trainingStartDate: formatDisplayDate(l["Training Start Date"] || ""),
      trainingCompletionDate: formatDisplayDate(
        l["Training Completion Date"] || ""
      ),
      learningStatus: l["Learning Status"] || "",
      assessmentScore: l["Assessment Score"] || "",
      certification: l["Certification"] || "",
      trainingHours: l["Training Hours"] || "",
      learningFeedback: l["Learning Feedback"] || "",
      skillGapStatus: l["Skill Gap Status"] || "",

      appraisalPeriod: p["Appraisal_Period"] || "",
      performanceRating5: rating,
      goalAchievementPercent: p["Goal_Achievement_Percent"] || "",
      performanceTrend: p["Performance_Trend"] || "",
      keyStrengths: p["Key_Strengths"] || "",
      developmentAreas: p["Development_Areas"] || "",
      managerFeedbackSummary: p["Manager_Feedback_Summary"] || "",
      skillsAcquired: p["Skills_Acquired"] || "",
      promotionReadiness: p["Promotion_Readiness"] || "",

      engagementSurveyDate: formatDisplayDate(
        e["Engagement Survey Date"] || ""
      ),
      recognitionReceived: e["Recognition Received"] || "",
      recognitionDate: formatDisplayDate(e["Recognition Date"] || ""),
      stayInterviewDate: formatDisplayDate(e["Stay Interview Date"] || ""),
      stayInterviewNotes: e["Stay Interview Notes"] || "",
      engagementAction,

      hasExitRecord,
      isEligible,
      extractedSkills,
      inProgressOrNotStartedCourses,
      evidenceByStage,
    };
  });

  // Sort eligible employees with EMP008 (Anaya Gupta) first as the highlighted demo case,
  // followed by employees with scored role profiles, then remaining eligible employees by ID.
  const eligibleEmployees = allEmployees
    .filter((emp) => emp.isEligible)
    .sort((a, b) => {
      if (a.employeeId === "EMP008") return -1;
      if (b.employeeId === "EMP008") return 1;
      return a.employeeId.localeCompare(b.employeeId);
    });

  // Compute anonymous Recruitment pipeline metrics safely (never joins into scores or existing employees' Recruit stage)
  const requisitionIds = new Set<string>();
  const upcomingJoiners: { ts: number; formattedDate: string }[] = [];

  for (const r of recruitmentRows) {
    const reqId = (r["Requisition ID"] || "").trim();
    if (reqId) {
      requisitionIds.add(reqId);
    }

    const joiningRaw = (r["Joining Date"] || "").trim();
    if (joiningRaw) {
      const parsedJoining = parseIsoOrDdMmmYyyy(joiningRaw);
      if (parsedJoining && parsedJoining > REFERENCE_TODAY) {
        upcomingJoiners.push({
          ts: parsedJoining.getTime(),
          formattedDate: formatDisplayDate(joiningRaw),
        });
      }
    }
  }

  upcomingJoiners.sort((a, b) => a.ts - b.ts);

  return {
    allEmployeesCount: allEmployees.length,
    eligibleEmployees,
    allEmployees,
    dedupedSignalsCount: seenSignalIds.size,
    rawSignalsCount: rawSignalRows.length,
    orphanSignalIds,
    excludedColumnsCount: EXCLUDED_SENSITIVE_COLUMNS.size,
    recruitmentPipeline: {
      distinctRequisitionsCount: requisitionIds.size,
      totalCandidatesCount: recruitmentRows.length,
      upcomingJoinersCount: upcomingJoiners.length,
      upcomingJoiningDates: upcomingJoiners.map((u) => u.formattedDate),
    },
  };
}
