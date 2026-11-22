import {
  CourseGap,
  EmployeeRecord,
  ExtractedSkill,
  MatchedSkillItem,
  MissingSkillItem,
  RoleProfileSkill,
  ScoreBreakdown,
  SkillTag,
} from "../types/journey";

export const ROLE_PROFILES: Record<string, RoleProfileSkill[]> = {
  "Marketing Manager": [
    { skill: "Digital Marketing", weight: 2 },
    { skill: "Marketing Analytics", weight: 3 },
    { skill: "Power BI", weight: 1 },
    { skill: "Analytical Thinking", weight: 2 },
    { skill: "Brand Strategy", weight: 2 },
    { skill: "Stakeholder Management", weight: 2 },
    { skill: "Team Leadership", weight: 3 },
  ],
  "Sales Manager": [
    { skill: "Consultative Selling", weight: 3 },
    { skill: "Stakeholder Management", weight: 2 },
    { skill: "Team Leadership", weight: 3 },
    { skill: "Forecasting", weight: 2 },
    { skill: "Coaching", weight: 2 },
  ],
  "Data Architect": [
    { skill: "SQL", weight: 3 },
    { skill: "Data Modeling", weight: 3 },
    { skill: "ETL", weight: 2 },
    { skill: "Cloud", weight: 2 },
    { skill: "Python", weight: 1 },
  ],
  "QA Lead": [
    { skill: "Test Automation", weight: 3 },
    { skill: "Team Leadership", weight: 3 },
    { skill: "Process Improvement", weight: 2 },
    { skill: "Stakeholder Management", weight: 1 },
  ],
  "Engineering Manager": [
    { skill: "Team Leadership", weight: 3 },
    { skill: "Cloud", weight: 2 },
    { skill: "Project Management", weight: 2 },
    { skill: "Stakeholder Management", weight: 2 },
  ],
  "HR Business Partner": [
    { skill: "Stakeholder Management", weight: 3 },
    { skill: "Coaching", weight: 2 },
    { skill: "HR Analytics", weight: 2 },
    { skill: "Collaboration", weight: 1 },
  ],
};

interface KeywordRule {
  pattern: RegExp;
  canonicalSkill: string;
}

const KEYWORD_MAP: KeywordRule[] = [
  { pattern: /\bdigital marketing\b/i, canonicalSkill: "Digital Marketing" },
  { pattern: /\bmarketing analytics\b/i, canonicalSkill: "Marketing Analytics" },
  { pattern: /\banalytical thinking\b/i, canonicalSkill: "Analytical Thinking" },
  { pattern: /\bpower bi\b/i, canonicalSkill: "Power BI" },
  { pattern: /\badvanced sql\b|\bsql\b/i, canonicalSkill: "SQL" },
  { pattern: /\bautomation testing\b|\badvanced test automation\b|\btest automation\b/i, canonicalSkill: "Test Automation" },
  { pattern: /\bconsultative selling\b/i, canonicalSkill: "Consultative Selling" },
  { pattern: /\bcollaboration\b/i, canonicalSkill: "Collaboration" },
  { pattern: /\bstakeholder management\b/i, canonicalSkill: "Stakeholder Management" },
  { pattern: /\bproject management\b|\bproject planning\b/i, canonicalSkill: "Project Management" },
  { pattern: /\bcloud\b/i, canonicalSkill: "Cloud" },
  { pattern: /\bpython\b/i, canonicalSkill: "Python" },
  { pattern: /\bprocess improvement\b/i, canonicalSkill: "Process Improvement" },
  { pattern: /\bbrand strategy\b/i, canonicalSkill: "Brand Strategy" },
  { pattern: /\bcoaching\b/i, canonicalSkill: "Coaching" },
  { pattern: /\bhr analytics\b/i, canonicalSkill: "HR Analytics" },
  { pattern: /\bdata modeling\b/i, canonicalSkill: "Data Modeling" },
  { pattern: /\betl\b/i, canonicalSkill: "ETL" },
  { pattern: /\bforecasting\b/i, canonicalSkill: "Forecasting" },
];

export function mapTextToSkill(text: string): string | null {
  const cleaned = text.trim();
  if (!cleaned) return null;
  for (const rule of KEYWORD_MAP) {
    if (rule.pattern.test(cleaned)) {
      return rule.canonicalSkill;
    }
  }
  return null;
}

export function extractSkillsAndCourseGaps(params: {
  jobTitle: string;
  team: string;
  courseProgram: string;
  learningStatus: string;
  skillsAcquired: string;
  keyStrengths: string;
}): {
  extractedSkills: ExtractedSkill[];
  inProgressOrNotStartedCourses: CourseGap[];
} {
  const skillMap = new Map<string, { tag: SkillTag; sources: string[] }>();

  const addSkill = (name: string, tag: SkillTag, source: string) => {
    const existing = skillMap.get(name);
    if (!existing) {
      skillMap.set(name, { tag, sources: [source] });
    } else {
      // Stated overrides Inferred if both exist
      if (tag === "Stated") {
        existing.tag = "Stated";
      }
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
    }
  };

  // 1. Inferred from Master Team & Job Title
  const teamSkill = mapTextToSkill(params.team);
  if (teamSkill) {
    addSkill(teamSkill, "Inferred", `Team: ${params.team} (Master)`);
  }

  const titleSkill = mapTextToSkill(params.jobTitle);
  if (titleSkill) {
    addSkill(titleSkill, "Inferred", `Job Title: ${params.jobTitle} (Master)`);
  } else if (/\b(manager|lead)\b/i.test(params.jobTitle)) {
    addSkill("Team Leadership", "Inferred", `Job Title: ${params.jobTitle} (Master)`);
  }

  // 2. Stated from Completed courses; In Progress / Not Started count as gaps
  const inProgressOrNotStartedCourses: CourseGap[] = [];
  if (params.courseProgram.trim()) {
    const status = params.learningStatus.trim();
    const mappedCourseSkill = mapTextToSkill(params.courseProgram);
    if (status.toLowerCase() === "completed") {
      if (mappedCourseSkill) {
        addSkill(
          mappedCourseSkill,
          "Stated",
          `Completed course: ${params.courseProgram} (Learning)`
        );
      } else {
        addSkill(
          params.courseProgram.trim(),
          "Stated",
          `Completed course: ${params.courseProgram} (Learning)`
        );
      }
    } else {
      inProgressOrNotStartedCourses.push({
        courseName: params.courseProgram.trim(),
        mappedSkill: mappedCourseSkill,
        status: status || "Not Started",
      });
    }
  }

  // 3. Stated from Skills_Acquired (Performance)
  if (params.skillsAcquired.trim()) {
    const parts = params.skillsAcquired
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const part of parts) {
      const mapped = mapTextToSkill(part);
      addSkill(
        mapped ?? part,
        "Stated",
        `Skills Acquired: ${part} (Performance)`
      );
    }
  }

  // 4. Inferred from Key_Strengths (Performance)
  if (params.keyStrengths.trim()) {
    const parts = params.keyStrengths
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const part of parts) {
      const mapped = mapTextToSkill(part);
      addSkill(
        mapped ?? part,
        "Inferred",
        `Key Strengths: ${part} (Performance)`
      );
    }
  }

  const extractedSkills: ExtractedSkill[] = Array.from(skillMap.entries()).map(
    ([name, info]) => ({
      name,
      tag: info.tag,
      sources: info.sources,
    })
  );

  return { extractedSkills, inProgressOrNotStartedCourses };
}

export function getPotentialScore(potentialRating: string): number {
  const normalized = potentialRating.trim().toLowerCase();
  if (normalized === "high") return 100;
  if (normalized === "moderate") return 60;
  if (normalized === "emerging") return 30;
  return 0;
}

export function calculateMatchScore(
  employee: EmployeeRecord,
  untickedInferredSkills: string[] = []
): ScoreBreakdown {
  const targetRole = employee.careerAspiration;
  const profile = ROLE_PROFILES[targetRole];

  if (!profile) {
    return {
      hasProfile: false,
      targetRole,
      totalWeight: 0,
      heldWeight: 0,
      skillComponent: 0,
      potentialLabel: employee.potentialRating,
      potentialScore: getPotentialScore(employee.potentialRating),
      potentialComponent: 0,
      performanceRating: employee.performanceRating5,
      performanceComponent: 0,
      rawTotal: 0,
      matchPercent: null,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const untickedSet = new Set(untickedInferredSkills);
  const skillLookup = new Map<string, ExtractedSkill>(
    employee.extractedSkills.map((s) => [s.name, s])
  );

  const matchedSkills: MatchedSkillItem[] = [];
  const missingSkills: MissingSkillItem[] = [];

  let totalWeight = 0;
  let heldWeight = 0;

  for (const req of profile) {
    totalWeight += req.weight;
    const held = skillLookup.get(req.skill);
    if (held) {
      const isUnticked = held.tag === "Inferred" && untickedSet.has(held.name);
      const active = !isUnticked;
      if (active) {
        heldWeight += req.weight;
      }
      matchedSkills.push({
        skill: req.skill,
        weight: req.weight,
        tag: held.tag,
        sources: held.sources,
        active,
      });
    } else {
      const pendingCourse = employee.inProgressOrNotStartedCourses.find(
        (c) => c.mappedSkill === req.skill
      );
      missingSkills.push({
        skill: req.skill,
        weight: req.weight,
        reason: pendingCourse
          ? `${pendingCourse.courseName} (${pendingCourse.status})`
          : undefined,
      });
    }
  }

  const skillRatio = totalWeight > 0 ? heldWeight / totalWeight : 0;
  const skillComponent = 70 * skillRatio;

  const potentialScore = getPotentialScore(employee.potentialRating);
  const potentialComponent = 0.2 * potentialScore;

  const performanceRating = employee.performanceRating5;
  const perfScore = (performanceRating / 5) * 100;
  const performanceComponent = 0.1 * perfScore;

  const rawTotal = skillComponent + potentialComponent + performanceComponent;
  const matchPercent = Math.round(rawTotal);

  return {
    hasProfile: true,
    targetRole,
    totalWeight,
    heldWeight,
    skillComponent,
    potentialLabel: employee.potentialRating,
    potentialScore,
    potentialComponent,
    performanceRating,
    performanceComponent,
    rawTotal,
    matchPercent,
    matchedSkills,
    missingSkills,
  };
}
