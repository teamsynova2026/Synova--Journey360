import { LifecycleStage, WorkflowStatus } from "../types/journey";

export const STATUS_PILL_CLASSES: Record<WorkflowStatus, string> = {
  New: "bg-slate-100 text-slate-700",
  "Employee interested": "bg-blue-100 text-[#1B2A5C]",
  "Wants to talk first": "bg-amber-100 text-amber-900",
  "Agreed together": "bg-[#E6F5EC] text-emerald-900",
  "Plan for later": "bg-[#E8F0FD] text-sky-900",
  "Not ready yet": "bg-orange-100 text-orange-900",
  "Employee not now": "bg-slate-100 text-slate-600",
};

export const LIFECYCLE_STAGE_DOT_CLASSES: Record<LifecycleStage, string> = {
  Recruit: "bg-[#E5483A]",
  Onboard: "bg-blue-500",
  Learn: "bg-emerald-500",
  Perform: "bg-[#F28C3A]",
  Engage: "bg-purple-500",
  Grow: "bg-green-600",
  Thrive: "bg-orange-500",
};
