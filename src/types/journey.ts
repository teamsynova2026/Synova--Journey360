export type LifecycleStage =
  | "Recruit"
  | "Onboard"
  | "Learn"
  | "Perform"
  | "Engage"
  | "Grow"
  | "Thrive";

export const LIFECYCLE_STAGES: LifecycleStage[] = [
  "Recruit",
  "Onboard",
  "Learn",
  "Perform",
  "Engage",
  "Grow",
  "Thrive",
];

export type SkillTag = "Stated" | "Inferred";

export interface ExtractedSkill {
  name: string;
  tag: SkillTag;
  sources: string[];
}

export interface CourseGap {
  courseName: string;
  mappedSkill: string | null;
  status: string;
}

export interface RoleProfileSkill {
  skill: string;
  weight: number;
}

export type WorkflowStatus =
  | "New"
  | "Employee interested"
  | "Wants to talk first"
  | "Employee not now"
  | "Agreed together"
  | "Plan for later"
  | "Not ready yet";

export type EmployeeChoice = "I'm interested" | "Let's talk first" | "Not now";

export interface EmployeeResponse {
  choice: EmployeeChoice;
  note: string;
  updatedAt: string;
}

export type ManagerSupportChoice =
  | "Agree to move forward"
  | "Plan for later"
  | "Not ready yet";

export type AppTab = "My growth" | "My team" | "Company overview";

export interface LifecycleEvidenceRow {
  id: string;
  stage: LifecycleStage;
  sentence: string;
  sourceTab: string;
  date: string;
  isSampleText?: boolean;
  isSignalLog?: boolean;
  fieldLabel?: string;
}

export interface EngagementActionInfo {
  action: string;
  owner: string;
  dueDate: string;
  status: string;
  isOpenOrOverdue: boolean;
  isOverdue: boolean;
}

export interface EmployeeRecord {
  employeeId: string;
  fullName: string;
  firstName: string;
  workEmail: string;
  location: string;
  businessUnit: string;
  department: string;
  team: string;
  jobTitle: string;
  gradeBand: string;
  employmentType: string;
  managerId: string;
  managerName: string;
  hrbp: string;
  workMode: string;
  employmentStatus: string;
  dateOfJoining: string;

  // Discrepancy check against Performance tab
  performanceJobRole: string | null;
  recordsDisagree: boolean;

  // Growth fields (non-sensitive)
  careerAspiration: string;
  careerPath: string;
  potentialRating: "High" | "Moderate" | "Emerging" | string;
  talentPool: string;
  successionCriticality: string;
  successorIdentified: string;
  developmentPlan: string; // Sample text
  mentor: string;
  internalMobilityInterest: string;
  lastPromotionDate: string;
  nextCareerDiscussionDate: string;

  // Learning fields (non-sensitive)
  learningNeeds: string;
  learningPlan: string;
  courseProgram: string;
  trainingProvider: string;
  trainingStartDate: string;
  trainingCompletionDate: string;
  learningStatus: string;
  assessmentScore: string;
  certification: string;
  trainingHours: string;
  learningFeedback: string; // Sample text
  skillGapStatus: string;

  // Performance fields (non-sensitive only; NO pay/wellbeing/absence/exit-risk/engagement score)
  appraisalPeriod: string;
  performanceRating5: number;
  goalAchievementPercent: string;
  performanceTrend: string;
  keyStrengths: string;
  developmentAreas: string;
  managerFeedbackSummary: string; // Sample text
  skillsAcquired: string;
  promotionReadiness: string;

  // Engagement fields (non-sensitive only; NO engagement score, eNPS, or wellbeing request)
  engagementSurveyDate: string;
  recognitionReceived: string;
  recognitionDate: string;
  stayInterviewDate: string;
  stayInterviewNotes: string; // Sample text
  engagementAction: EngagementActionInfo | null;

  // Derived fields
  hasExitRecord: boolean;
  isEligible: boolean;
  extractedSkills: ExtractedSkill[];
  inProgressOrNotStartedCourses: CourseGap[];
  evidenceByStage: Record<LifecycleStage, LifecycleEvidenceRow[]>;
}

export interface MatchedSkillItem {
  skill: string;
  weight: number;
  tag: SkillTag;
  sources: string[];
  active: boolean;
}

export interface MissingSkillItem {
  skill: string;
  weight: number;
  reason?: string;
}

export interface ScoreBreakdown {
  hasProfile: boolean;
  targetRole: string;
  totalWeight: number;
  heldWeight: number;
  skillComponent: number;
  potentialLabel: string;
  potentialScore: number;
  potentialComponent: number;
  performanceRating: number;
  performanceComponent: number;
  rawTotal: number;
  matchPercent: number | null;
  matchedSkills: MatchedSkillItem[];
  missingSkills: MissingSkillItem[];
}

export interface NarrativeContent {
  source: "gemini" | "template";
  whyRecommendation: string;
  conversationQuestions: string[];
  suggestedActions: string[];
  errorNote?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  tab: AppTab;
  action: string;
  employeeId: string;
  employeeName: string;
  reason: string;
}

export interface RecruitmentPipelineSummary {
  distinctRequisitionsCount: number;
  totalCandidatesCount: number;
  upcomingJoinersCount: number;
  upcomingJoiningDates: string[];
}

export interface ParsedDataset {
  allEmployeesCount: number;
  eligibleEmployees: EmployeeRecord[];
  allEmployees: EmployeeRecord[];
  dedupedSignalsCount: number;
  rawSignalsCount: number;
  orphanSignalIds: string[];
  excludedColumnsCount: number;
  recruitmentPipeline: RecruitmentPipelineSummary;
}
