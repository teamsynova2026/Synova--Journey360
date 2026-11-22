import { useCallback, useMemo, useRef, useState } from "react";
import { AuditLogView } from "./components/AuditLogView";
import { EmployeeView } from "./components/EmployeeView";
import { HrDetailView } from "./components/HrDetailView";
import { HrOverview } from "./components/HrOverview";
import { ManagerView } from "./components/ManagerView";
import { SignInDemo } from "./components/SignInDemo";
import { Journey360Logo, SynovaLogo } from "./components/SynovaLogo";
import { loadJourneyDataset } from "./engine/csvParser";
import {
  buildTemplateNarrative,
  fetchNarrativeWithFallback,
} from "./engine/narrativeTemplates";
import { calculateMatchScore } from "./engine/skillsAndScoring";
import {
  AppTab,
  AuditLogEntry,
  EmployeeChoice,
  EmployeeResponse,
  ManagerSupportChoice,
  NarrativeContent,
  ScoreBreakdown,
  WorkflowStatus,
} from "./types/journey";
import { formatAuditTimestamp } from "./utils/dateFormat";

type HrScreen = "overview" | "detail" | "audit";

function mapEmployeeChoiceToStatus(choice: EmployeeChoice): WorkflowStatus {
  if (choice === "I'm interested") return "Employee interested";
  if (choice === "Let's talk first") return "Wants to talk first";
  return "Employee not now";
}

function mapManagerSupportToStatus(
  choice: ManagerSupportChoice,
  employeeChoice?: EmployeeChoice
): WorkflowStatus {
  if (
    choice === "Agree to move forward" &&
    (employeeChoice === "I'm interested" ||
      employeeChoice === "Let's talk first")
  ) {
    return "Agreed together";
  }
  if (choice === "Plan for later") return "Plan for later";
  return "Not ready yet";
}

function formatTimestamp(date: Date = new Date()): string {
  return formatAuditTimestamp(date);
}

export default function App() {
  const dataset = useMemo(() => loadJourneyDataset(), []);

  const activeEmployees = useMemo(
    () =>
      dataset.allEmployees.filter(
        (emp) => emp.employmentStatus.trim().toLowerCase() === "active"
      ),
    [dataset.allEmployees]
  );

  // Null means user is on the Sign-in screen
  const [signedInUserId, setSignedInUserId] = useState<string | null>(null);
  const [lastSignedInUserId, setLastSignedInUserId] = useState<string>(
    () =>
      activeEmployees.find((e) => e.employeeId === "EMP008")?.employeeId ??
      activeEmployees[0]?.employeeId ??
      ""
  );

  const [activeTab, setActiveTab] = useState<AppTab>("My growth");
  const [hrScreen, setHrScreen] = useState<HrScreen>("overview");
  const [lastHrNonAuditScreen, setLastHrNonAuditScreen] = useState<
    "overview" | "detail"
  >("overview");
  const [managerScreen, setManagerScreen] = useState<"list" | "detail">("list");

  const [selectedHrEmpId, setSelectedHrEmpId] = useState<string>(() => {
    const demo = dataset.eligibleEmployees.find(
      (e) => e.employeeId === "EMP008"
    );
    return demo?.employeeId ?? dataset.eligibleEmployees[0]?.employeeId ?? "";
  });

  const [selectedManagerEmpId, setSelectedManagerEmpId] = useState<string>("");

  const signedInUser = useMemo(
    () =>
      signedInUserId
        ? activeEmployees.find((e) => e.employeeId === signedInUserId) ?? null
        : null,
    [activeEmployees, signedInUserId]
  );

  // Access derived directly from Employee_Master data
  const hasMyTeamTab = useMemo(() => {
    if (!signedInUser) return false;
    return dataset.allEmployees.some(
      (emp) => emp.managerId === signedInUser.employeeId
    );
  }, [dataset.allEmployees, signedInUser]);

  const hasCompanyOverviewTab = useMemo(() => {
    if (!signedInUser) return false;
    return signedInUser.department.trim().toLowerCase() === "human resources";
  }, [signedInUser]);

  const availableTabs = useMemo<AppTab[]>(() => {
    const tabs: AppTab[] = ["My growth"];
    if (hasMyTeamTab) tabs.push("My team");
    if (hasCompanyOverviewTab) tabs.push("Company overview");
    return tabs;
  }, [hasCompanyOverviewTab, hasMyTeamTab]);

  // Eligible direct reports for the signed-in manager
  const managerTeamEmployees = useMemo(() => {
    if (!signedInUser) return [];
    return dataset.eligibleEmployees.filter(
      (emp) => emp.managerId === signedInUser.employeeId
    );
  }, [dataset.eligibleEmployees, signedInUser]);

  // Every employee starts with status "New"
  const [statusesByEmpId, setStatusesByEmpId] = useState<
    Record<string, WorkflowStatus>
  >(() => {
    const initial: Record<string, WorkflowStatus> = {};
    for (const emp of dataset.eligibleEmployees) {
      initial[emp.employeeId] = "New";
    }
    return initial;
  });

  const [employeeResponsesByEmpId, setEmployeeResponsesByEmpId] = useState<
    Record<string, EmployeeResponse>
  >({});

  const [supportReasonsByEmpId, setSupportReasonsByEmpId] = useState<
    Record<string, string>
  >({});

  const [untickedInferredByEmpId, setUntickedInferredByEmpId] = useState<
    Record<string, string[]>
  >({});

  const [geminiNarrativesByEmpId, setGeminiNarrativesByEmpId] = useState<
    Record<string, NarrativeContent>
  >({});
  const [generatingForEmpId, setGeneratingForEmpId] = useState<string | null>(
    null
  );

  const entryCounterRef = useRef(0);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  const appendAudit = useCallback(
    (
      actorName: string,
      tab: AppTab,
      action: string,
      employeeId: string,
      employeeName: string,
      reason: string
    ) => {
      const nextId = `audit-${++entryCounterRef.current}`;
      const newEntry: AuditLogEntry = {
        id: nextId,
        timestamp: formatTimestamp(),
        actorName,
        tab,
        action,
        employeeId,
        employeeName,
        reason,
      };
      setAuditLog((prev) => [newEntry, ...prev]);
    },
    []
  );

  // Live deterministic score breakdowns for all eligible employees
  const scoresByEmpId = useMemo(() => {
    const map: Record<string, ScoreBreakdown> = {};
    for (const emp of dataset.eligibleEmployees) {
      map[emp.employeeId] = calculateMatchScore(
        emp,
        untickedInferredByEmpId[emp.employeeId] ?? []
      );
    }
    return map;
  }, [dataset.eligibleEmployees, untickedInferredByEmpId]);

  const selectedHrEmployee = useMemo(() => {
    return (
      dataset.eligibleEmployees.find((e) => e.employeeId === selectedHrEmpId) ??
      dataset.eligibleEmployees[0]
    );
  }, [dataset.eligibleEmployees, selectedHrEmpId]);

  const selectedManagerEmployee = useMemo(() => {
    return (
      managerTeamEmployees.find((e) => e.employeeId === selectedManagerEmpId) ??
      managerTeamEmployees[0]
    );
  }, [managerTeamEmployees, selectedManagerEmpId]);

  const activeFocusEmployee =
    activeTab === "My team"
      ? selectedManagerEmployee
      : activeTab === "My growth"
      ? signedInUser?.isEligible
        ? signedInUser
        : undefined
      : selectedHrEmployee;

  const activeFocusBreakdown = activeFocusEmployee
    ? scoresByEmpId[activeFocusEmployee.employeeId]
    : undefined;

  const activeNarrative = useMemo(() => {
    if (!activeFocusEmployee || !activeFocusBreakdown) {
      return {
        source: "template" as const,
        whyRecommendation: "",
        conversationQuestions: [],
        suggestedActions: [],
      };
    }
    return (
      geminiNarrativesByEmpId[activeFocusEmployee.employeeId] ??
      buildTemplateNarrative(activeFocusEmployee, activeFocusBreakdown)
    );
  }, [activeFocusBreakdown, activeFocusEmployee, geminiNarrativesByEmpId]);

  const handleGenerateGeminiNarrative = useCallback(async () => {
    if (!activeFocusEmployee || !activeFocusBreakdown) return;
    setGeneratingForEmpId(activeFocusEmployee.employeeId);
    const result = await fetchNarrativeWithFallback(
      activeFocusEmployee,
      activeFocusBreakdown
    );
    setGeminiNarrativesByEmpId((prev) => ({
      ...prev,
      [activeFocusEmployee.employeeId]: result,
    }));
    setGeneratingForEmpId(null);
  }, [activeFocusBreakdown, activeFocusEmployee]);

  const handleSignIn = (employeeId: string) => {
    const user = activeEmployees.find((e) => e.employeeId === employeeId);
    if (!user) return;
    setSignedInUserId(employeeId);
    setLastSignedInUserId(employeeId);
    setActiveTab("My growth");
    setHrScreen("overview");
    setLastHrNonAuditScreen("overview");
    setManagerScreen("list");

    const firstDirectReport = dataset.eligibleEmployees.find(
      (e) => e.managerId === user.employeeId
    );
    setSelectedManagerEmpId(firstDirectReport?.employeeId ?? "");

    appendAudit(
      user.fullName,
      "My growth",
      "Signed in",
      user.employeeId,
      user.fullName,
      user.isEligible
        ? `Signed in as ${user.fullName} and opened My growth.`
        : `Signed in as ${user.fullName} (no growth suggestion right now).`
    );
  };

  const handleSwitchUser = () => {
    setSignedInUserId(null);
  };

  const handleSelectTab = (tab: AppTab) => {
    if (!signedInUser) return;
    setActiveTab(tab);
    if (tab === "My growth") {
      appendAudit(
        signedInUser.fullName,
        "My growth",
        "Viewed My growth",
        signedInUser.employeeId,
        signedInUser.fullName,
        signedInUser.isEligible
          ? `Opened My growth for ${signedInUser.fullName}.`
          : `Opened My growth for ${signedInUser.fullName} (not eligible).`
      );
    } else if (tab === "My team") {
      setManagerScreen("list");
      appendAudit(
        signedInUser.fullName,
        "My team",
        "Viewed Direct Reports",
        "TEAM",
        "Direct Reports",
        `Opened My team (${managerTeamEmployees.length} eligible direct reports).`
      );
    } else if (tab === "Company overview") {
      setHrScreen("overview");
      setLastHrNonAuditScreen("overview");
      appendAudit(
        signedInUser.fullName,
        "Company overview",
        "Viewed Company Overview",
        "ALL",
        "Eligible Cohort",
        `Opened Company overview (${dataset.eligibleEmployees.length} eligible employees).`
      );
    }
  };

  const handleHrNav = (screen: "overview" | "detail" | "audit") => {
    if (!signedInUser) return;
    if (screen !== "audit") {
      setLastHrNonAuditScreen(screen);
    }
    setActiveTab("Company overview");
    setHrScreen(screen);
    if (screen === "overview") {
      appendAudit(
        signedInUser.fullName,
        "Company overview",
        "Viewed Company Overview",
        "ALL",
        "Eligible Cohort",
        "Navigated to Company overview"
      );
    } else if (screen === "audit") {
      appendAudit(
        signedInUser.fullName,
        "Company overview",
        "Viewed Audit Log",
        "ALL",
        "Session Log",
        "Opened Audit Log"
      );
    }
  };

  const handleViewEmployeeInHr = (employeeId: string) => {
    if (!signedInUser) return;
    const emp = dataset.eligibleEmployees.find(
      (e) => e.employeeId === employeeId
    );
    setSelectedHrEmpId(employeeId);
    setLastHrNonAuditScreen("detail");
    setHrScreen("detail");
    if (emp) {
      appendAudit(
        signedInUser.fullName,
        "Company overview",
        "Viewed Employee Profile",
        emp.employeeId,
        emp.fullName,
        `Inspected match breakdown and lifecycle evidence for ${emp.careerAspiration}`
      );
    }
  };

  const handleOpenManagerEmployee = (employeeId: string) => {
    if (!signedInUser) return;
    const emp = managerTeamEmployees.find((e) => e.employeeId === employeeId);
    setSelectedManagerEmpId(employeeId);
    setManagerScreen("detail");
    if (emp) {
      appendAudit(
        signedInUser.fullName,
        "My team",
        "Viewed Team Member",
        emp.employeeId,
        emp.fullName,
        `Opened ${emp.fullName} detail page for ${emp.careerAspiration} joint decision`
      );
    }
  };

  const handleSaveEmployeeResponse = (
    employeeId: string,
    choice: EmployeeChoice,
    note: string
  ) => {
    if (!signedInUser) return;
    const emp = dataset.eligibleEmployees.find(
      (e) => e.employeeId === employeeId
    );
    const nextStatus = mapEmployeeChoiceToStatus(choice);
    const updatedAt = formatTimestamp();

    setEmployeeResponsesByEmpId((prev) => ({
      ...prev,
      [employeeId]: {
        choice,
        note,
        updatedAt,
      },
    }));

    setStatusesByEmpId((prev) => ({
      ...prev,
      [employeeId]: nextStatus,
    }));

    if (emp) {
      const trimmedNote = note.trim();
      appendAudit(
        signedInUser.fullName,
        "My growth",
        `Response: ${nextStatus}`,
        emp.employeeId,
        emp.fullName,
        trimmedNote
          ? `Selected "${choice}" · Note: "${trimmedNote}"`
          : `Selected "${choice}" (no note added)`
      );
    }
  };

  const handleSubmitManagerSupport = (
    employeeId: string,
    choice: ManagerSupportChoice,
    reason: string
  ) => {
    if (!signedInUser) return;
    const emp = dataset.eligibleEmployees.find(
      (e) => e.employeeId === employeeId
    );
    const employeeChoice = employeeResponsesByEmpId[employeeId]?.choice;
    const nextStatus = mapManagerSupportToStatus(choice, employeeChoice);

    setStatusesByEmpId((prev) => ({
      ...prev,
      [employeeId]: nextStatus,
    }));
    setSupportReasonsByEmpId((prev) => ({
      ...prev,
      [employeeId]: reason,
    }));

    if (emp) {
      appendAudit(
        signedInUser.fullName,
        "My team",
        `Decision: ${nextStatus}`,
        emp.employeeId,
        emp.fullName,
        `${choice} · ${reason}`
      );
    }
  };

  const handleToggleInferredSkill = (
    employeeId: string,
    skillName: string,
    currentlyTicked: boolean
  ) => {
    if (!signedInUser) return;
    const emp = dataset.eligibleEmployees.find(
      (e) => e.employeeId === employeeId
    );
    setUntickedInferredByEmpId((prev) => {
      const current = prev[employeeId] ?? [];
      const next = currentlyTicked
        ? [...new Set([...current, skillName])]
        : current.filter((s) => s !== skillName);
      return {
        ...prev,
        [employeeId]: next,
      };
    });

    if (emp) {
      appendAudit(
        signedInUser.fullName,
        "My growth",
        currentlyTicked
          ? `Unticked Inferred Skill: ${skillName}`
          : `Re-confirmed Inferred Skill: ${skillName}`,
        emp.employeeId,
        emp.fullName,
        currentlyTicked
          ? `Employee unticked inferred skill "${skillName}"; deterministic score recalculated live.`
          : `Employee re-checked inferred skill "${skillName}"; deterministic score recalculated live.`
      );
    }
  };

  // First screen: Sign-in
  if (!signedInUser) {
    return (
      <SignInDemo
        activeEmployees={activeEmployees}
        initialEmployeeId={lastSignedInUserId}
        onSignIn={handleSignIn}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#1E293B]">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[#1B2A5C]/10 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <SynovaLogo variant="header" />
              <span
                aria-hidden="true"
                className="h-6 w-px bg-[#1B2A5C]/20 shrink-0"
              />
              <Journey360Logo variant="header" />
            </div>

            <nav aria-label="Primary navigation" className="flex items-center gap-2">
              {availableTabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleSelectTab(tab)}
                    className={`px-3.5 py-2 rounded-xl text-[14px] font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#E5483A] text-white"
                        : "text-[#1B2A5C] hover:bg-[#FDECE4]/60"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[14px] font-medium text-[#1B2A5C] whitespace-nowrap">
              Signed in as {signedInUser.fullName}
            </span>
            <button
              type="button"
              onClick={handleSwitchUser}
              className="px-4 py-2 rounded-xl text-[14px] font-semibold border border-[#1B2A5C]/25 bg-white text-[#1B2A5C] hover:bg-[#FDECE4]/60 hover:border-[#1B2A5C] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Switch user
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === "My growth" &&
          (signedInUser.isEligible && scoresByEmpId[signedInUser.employeeId] ? (
            <EmployeeView
              employee={signedInUser}
              breakdown={scoresByEmpId[signedInUser.employeeId]}
              untickedInferredSkills={
                untickedInferredByEmpId[signedInUser.employeeId] ?? []
              }
              employeeResponse={
                employeeResponsesByEmpId[signedInUser.employeeId]
              }
              onSaveEmployeeResponse={handleSaveEmployeeResponse}
              onToggleInferredSkill={handleToggleInferredSkill}
            />
          ) : (
            <section className="bg-white rounded-2xl p-8 shadow-[0_2px_12px_rgba(27,42,92,0.05)]">
              <p className="text-[16px] font-medium text-[#1B2A5C]">
                No growth suggestion for you right now.
              </p>
            </section>
          ))}

        {activeTab === "My team" && hasMyTeamTab && (
          <ManagerView
            screen={managerScreen}
            teamEmployees={managerTeamEmployees}
            selectedEmployee={selectedManagerEmployee}
            breakdown={
              selectedManagerEmployee
                ? scoresByEmpId[selectedManagerEmployee.employeeId]
                : undefined
            }
            status={
              selectedManagerEmployee
                ? statusesByEmpId[selectedManagerEmployee.employeeId] ?? "New"
                : "New"
            }
            employeeResponse={
              selectedManagerEmployee
                ? employeeResponsesByEmpId[selectedManagerEmployee.employeeId]
                : undefined
            }
            employeeResponsesByEmpId={employeeResponsesByEmpId}
            statusesByEmpId={statusesByEmpId}
            lastSupportReason={
              selectedManagerEmployee
                ? supportReasonsByEmpId[selectedManagerEmployee.employeeId]
                : undefined
            }
            narrative={activeNarrative}
            isGeneratingNarrative={
              selectedManagerEmployee
                ? generatingForEmpId === selectedManagerEmployee.employeeId
                : false
            }
            onOpenEmployee={handleOpenManagerEmployee}
            onBackToList={() => setManagerScreen("list")}
            onGenerateGeminiNarrative={handleGenerateGeminiNarrative}
            onSubmitSupport={handleSubmitManagerSupport}
          />
        )}

        {activeTab === "Company overview" &&
          hasCompanyOverviewTab &&
          hrScreen === "overview" && (
            <HrOverview
              dataset={dataset}
              scoresByEmpId={scoresByEmpId}
              statusesByEmpId={statusesByEmpId}
              onViewEmployee={handleViewEmployeeInHr}
              onViewAuditLog={() => handleHrNav("audit")}
            />
          )}

        {activeTab === "Company overview" &&
          hasCompanyOverviewTab &&
          hrScreen === "detail" &&
          selectedHrEmployee &&
          scoresByEmpId[selectedHrEmployee.employeeId] && (
            <HrDetailView
              employee={selectedHrEmployee}
              breakdown={scoresByEmpId[selectedHrEmployee.employeeId]}
              status={statusesByEmpId[selectedHrEmployee.employeeId] ?? "New"}
              untickedInferredSkills={
                untickedInferredByEmpId[selectedHrEmployee.employeeId] ?? []
              }
              narrative={activeNarrative}
              isGeneratingNarrative={
                generatingForEmpId === selectedHrEmployee.employeeId
              }
              onGenerateGeminiNarrative={handleGenerateGeminiNarrative}
              onBackToOverview={() => handleHrNav("overview")}
              onViewAuditLog={() => handleHrNav("audit")}
            />
          )}

        {activeTab === "Company overview" &&
          hasCompanyOverviewTab &&
          hrScreen === "audit" && (
            <AuditLogView
              entries={auditLog}
              onBack={() => handleHrNav(lastHrNonAuditScreen)}
            />
          )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#1B2A5C]/10 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <SynovaLogo variant="footer" />
            <span className="font-semibold text-[#1B2A5C]">Team Synova</span>
            <span aria-hidden="true">&middot;</span>
            <span>
              Journey360 &middot; AI suggests. Employee and manager decide together. HR supports.
            </span>
          </div>
          <div className="flex items-center gap-4">
            {hasCompanyOverviewTab && (
              <button
                type="button"
                onClick={() => handleHrNav("audit")}
                className="text-xs text-[#1B2A5C]/80 hover:text-[#E5483A] underline underline-offset-2 transition-colors duration-150 cursor-pointer"
              >
                Audit log
              </button>
            )}
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FDECE4] text-xs font-medium text-[#1B2A5C]">
              Synthetic demo data
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
