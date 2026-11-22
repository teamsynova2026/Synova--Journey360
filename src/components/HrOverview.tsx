import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  Lock,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  EmployeeRecord,
  LIFECYCLE_STAGES,
  ParsedDataset,
  ScoreBreakdown,
  WorkflowStatus,
} from "../types/journey";
import {
  LIFECYCLE_STAGE_DOT_CLASSES,
  STATUS_PILL_CLASSES,
} from "../utils/statusStyles";

interface HrOverviewProps {
  dataset: ParsedDataset;
  scoresByEmpId: Record<string, ScoreBreakdown>;
  statusesByEmpId: Record<string, WorkflowStatus>;
  onViewEmployee: (employeeId: string) => void;
  onViewAuditLog: () => void;
}

const WAITING_FOR_MANAGER_STATUSES = new Set<WorkflowStatus>([
  "Employee interested",
  "Wants to talk first",
]);

export const HrOverview: React.FC<HrOverviewProps> = ({
  dataset,
  scoresByEmpId,
  statusesByEmpId,
  onViewEmployee,
  onViewAuditLog,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllEligible, setShowAllEligible] = useState(false);
  const [waitingOnlyFilter, setWaitingOnlyFilter] = useState(false);
  const [hiringPipelineOpen, setHiringPipelineOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const waitingForManagerCount = useMemo(() => {
    return dataset.eligibleEmployees.filter((emp) =>
      WAITING_FOR_MANAGER_STATUSES.has(statusesByEmpId[emp.employeeId] ?? "New")
    ).length;
  }, [dataset.eligibleEmployees, statusesByEmpId]);

  const scoredProfilesCount = useMemo(() => {
    return dataset.eligibleEmployees.filter(
      (emp) => scoresByEmpId[emp.employeeId]?.hasProfile
    ).length;
  }, [dataset.eligibleEmployees, scoresByEmpId]);

  const stageStats = useMemo(() => {
    return LIFECYCLE_STAGES.map((stage) => {
      let employeesWithData = 0;
      let totalRows = 0;
      for (const emp of dataset.allEmployees) {
        const rows = emp.evidenceByStage[stage];
        if (rows.length > 0) {
          employeesWithData++;
          totalRows += rows.length;
        }
      }
      return { stage, employeesWithData, totalRows };
    });
  }, [dataset.allEmployees]);

  // Priority cohort: anyone who has responded (status !== "New") or has a scored role profile
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dataset.eligibleEmployees.filter((emp) => {
      const score = scoresByEmpId[emp.employeeId];
      const status = statusesByEmpId[emp.employeeId] ?? "New";

      if (waitingOnlyFilter) {
        if (!WAITING_FOR_MANAGER_STATUSES.has(status)) return false;
      } else if (!showAllEligible) {
        const hasResponded = status !== "New";
        const needsAttention = Boolean(score?.hasProfile);
        if (!hasResponded && !needsAttention) return false;
      }

      if (!q) return true;
      return (
        emp.fullName.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.jobTitle.toLowerCase().includes(q) ||
        emp.careerAspiration.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      );
    });
  }, [
    dataset.eligibleEmployees,
    scoresByEmpId,
    searchQuery,
    showAllEligible,
    statusesByEmpId,
    waitingOnlyFilter,
  ]);

  return (
    <div className="space-y-8">
      {/* 3 Summary Cards */}
      <section
        aria-label="Mobility overview metrics"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white rounded-2xl p-8 shadow-[0_2px_12px_rgba(27,42,92,0.05)]">
          <p className="text-[14px] text-slate-500">Employees reviewed</p>
          <p className="mt-2 text-[28px] leading-[1.25] font-semibold text-[#1B2A5C]">
            {dataset.allEmployeesCount}
          </p>
          <p className="mt-2 text-[14px] text-slate-600">
            Joined from Master
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-[0_2px_12px_rgba(27,42,92,0.05)]">
          <p className="text-[14px] text-slate-500">Opportunities found</p>
          <p className="mt-2 text-[28px] leading-[1.25] font-semibold text-[#E5483A]">
            {dataset.eligibleEmployees.length}
          </p>
          <p className="mt-2 text-[14px] text-slate-600">
            Active &amp; open to mobility &middot;{" "}
            <span className="font-semibold text-[#1B2A5C]">
              {scoredProfilesCount}
            </span>{" "}
            scored
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-[0_2px_12px_rgba(27,42,92,0.05)]">
          <p className="text-[14px] text-slate-500">
            Waiting for joint decision
          </p>
          <p className="mt-2 text-[28px] leading-[1.25] font-semibold text-[#1B2A5C]">
            {waitingForManagerCount}
          </p>
          <p className="mt-2 text-[14px] text-slate-600">
            Employee interested or wants to talk first
          </p>
        </div>
      </section>

      {/* Eligible Employees Table */}
      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
        <div className="p-8 bg-[#E8F0FD]/75 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
              {waitingOnlyFilter
                ? "Waiting for joint decision"
                : showAllEligible
                ? `All eligible employees (${dataset.eligibleEmployees.length})`
                : "Responded or ready for attention"}
            </h2>
            <p className="text-[14px] text-slate-600 mt-1">
              {showAllEligible
                ? `Showing all ${dataset.eligibleEmployees.length} Active employees with Internal Mobility Interest and no exit record.`
                : "Showing employees who have responded or have scored role profiles."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or role..."
                aria-label="Search eligible employees"
                className="pl-9 pr-3 py-2 text-[14px] border border-slate-200 rounded-xl bg-white text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E5483A]/20 focus:border-[#E5483A] w-48"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setWaitingOnlyFilter((v) => !v);
                setShowAllEligible(false);
              }}
              className={`px-4 py-2 rounded-xl text-[14px] font-semibold border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                waitingOnlyFilter
                  ? "bg-[#E5483A] text-white border-[#E5483A] hover:bg-[#cf3c2f]"
                  : "bg-white text-[#1B2A5C] border-[#1B2A5C]/25 hover:bg-[#FDECE4]/60 hover:border-[#1B2A5C]"
              }`}
            >
              Waiting for decision ({waitingForManagerCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAllEligible((v) => !v);
                setWaitingOnlyFilter(false);
              }}
              className={`px-4 py-2 rounded-xl text-[14px] font-semibold border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                showAllEligible
                  ? "bg-[#E5483A] text-white border-[#E5483A] hover:bg-[#cf3c2f]"
                  : "bg-white text-[#1B2A5C] border-[#1B2A5C]/25 hover:bg-[#FDECE4]/60 hover:border-[#1B2A5C]"
              }`}
            >
              {showAllEligible
                ? "Show priority only"
                : `Show all ${dataset.eligibleEmployees.length}`}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-t border-b border-slate-100 bg-slate-50/50 text-[12px] font-semibold text-slate-500">
                <th className="py-4 px-8">Employee</th>
                <th className="py-4 px-4">Current Role</th>
                <th className="py-4 px-4">Target Role</th>
                <th className="py-4 px-4">Match</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-8 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[16px]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 px-8 text-center text-[14px] text-slate-500"
                  >
                    Nothing here yet — no employees match the current view.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp: EmployeeRecord) => {
                  const score = scoresByEmpId[emp.employeeId];
                  const status = statusesByEmpId[emp.employeeId] ?? "New";
                  const isDemo = emp.employeeId === "EMP008";

                  return (
                    <tr
                      key={emp.employeeId}
                      className={`transition-colors duration-150 ${
                        isDemo
                          ? "bg-[#FDECE4]/35 hover:bg-[#FDECE4]/60"
                          : "hover:bg-[#FFF8F3]"
                      }`}
                    >
                      <td className="py-4 px-8 align-middle">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#1B2A5C]">
                            {emp.fullName}
                          </span>
                          {isDemo && (
                            <span className="text-[12px] font-semibold text-[#F28C3A]">
                              &middot; Highlighted
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-slate-500 mt-0.5">
                          {emp.employeeId} &middot; {emp.department}
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle text-[14px] text-[#1E293B]">
                        {emp.jobTitle}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <div className="text-[14px] text-[#1E293B]">
                          {emp.careerAspiration}
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle">
                        {score?.hasProfile && score.matchPercent !== null ? (
                          <span className="text-[16px] font-semibold text-[#E5483A]">
                            {score.matchPercent}%
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-500">
                            No role profile yet, score not available
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap ${STATUS_PILL_CLASSES[status]}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-4 px-8 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => onViewEmployee(emp.employeeId)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-semibold border border-[#1B2A5C] bg-[#1B2A5C] text-white hover:bg-[#142047] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Collapsed "Hiring pipeline" section */}
      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
        <button
          type="button"
          onClick={() => setHiringPipelineOpen((v) => !v)}
          aria-expanded={hiringPipelineOpen}
          className="w-full p-8 bg-[#FDECE4]/65 hover:bg-[#FDECE4]/90 flex items-center justify-between gap-4 text-left transition-colors duration-150 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-[#F28C3A] shrink-0" />
            <span className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
              Hiring pipeline
            </span>
          </div>
          {hiringPipelineOpen ? (
            <ChevronDown className="w-5 h-5 text-[#1B2A5C] shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[#1B2A5C] shrink-0" />
          )}
        </button>

        {hiringPipelineOpen && (
          <div className="px-8 pb-8 pt-6 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[14px] text-slate-500">Distinct Requisition IDs</p>
                <p className="mt-1 text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
                  {dataset.recruitmentPipeline.distinctRequisitionsCount}
                </p>
              </div>
              <div>
                <p className="text-[14px] text-slate-500">Total candidate records</p>
                <p className="mt-1 text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
                  {dataset.recruitmentPipeline.totalCandidatesCount}
                </p>
              </div>
              <div>
                <p className="text-[14px] text-slate-500">Upcoming joiners</p>
                <p className="mt-1 text-[16px] font-semibold text-[#1B2A5C]">
                  {dataset.recruitmentPipeline.upcomingJoinersCount}{" "}
                  {dataset.recruitmentPipeline.upcomingJoinersCount === 1
                    ? "upcoming joiner"
                    : "upcoming joiners"}
                  {dataset.recruitmentPipeline.upcomingJoiningDates.length > 0
                    ? `, ${dataset.recruitmentPipeline.upcomingJoiningDates.join(", ")}`
                    : ""}
                </p>
              </div>
            </div>
            <p className="text-[14px] text-slate-500">
              Recruitment records describe external candidates. They are not used in any match score.
            </p>
          </div>
        )}
      </section>

      {/* Collapsed "How this works" section */}
      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
        <button
          type="button"
          onClick={() => setHowItWorksOpen((v) => !v)}
          aria-expanded={howItWorksOpen}
          className="w-full p-8 bg-[#E6F5EC]/70 hover:bg-[#E6F5EC]/95 flex items-center justify-between gap-4 text-left transition-colors duration-150 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#1B2A5C] shrink-0" />
            <span className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
              How this works
            </span>
            <span className="text-[14px] text-slate-600 hidden sm:inline">
              &middot; Lifecycle stage coverage, excluded sensitive columns &amp; signal hygiene
            </span>
          </div>
          {howItWorksOpen ? (
            <ChevronDown className="w-5 h-5 text-[#1B2A5C] shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[#1B2A5C] shrink-0" />
          )}
        </button>

        {howItWorksOpen && (
          <div className="px-8 pb-8 pt-6 border-t border-slate-100 space-y-8">
            {/* Lifecycle Coverage */}
            <div>
              <h3 className="text-[16px] font-semibold text-[#1B2A5C] mb-3">
                Employee lifecycle coverage
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {stageStats.map(({ stage, employeesWithData, totalRows }) => {
                  const hasData = totalRows > 0;
                  return (
                    <div
                      key={stage}
                      className={`rounded-xl p-3.5 border ${
                        hasData
                          ? "bg-white border-slate-200/80"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <p className="text-[14px] font-semibold text-[#1B2A5C] flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${LIFECYCLE_STAGE_DOT_CLASSES[stage]}`}
                          aria-hidden="true"
                        />
                        <span>{stage}</span>
                      </p>
                      <p
                        className={`mt-1.5 text-[12px] ${
                          hasData ? "text-[#1B2A5C] font-semibold" : "text-slate-500"
                        }`}
                      >
                        {hasData ? `${employeesWithData} employees` : "No data yet"}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {hasData ? `${totalRows} rows` : "0 rows"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data-Use & Governance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[14px] text-slate-700 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#1B2A5C]">
                    Excluded sensitive columns (never read or displayed)
                  </p>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    {dataset.excludedColumnsCount} sensitive columns are dropped at CSV ingestion: pay &amp; compensation (Current_CTC_INR, Previous_CTC_INR, Last_Increment_Percent, Annual_Bonus_INR, Training_Investment_INR, Estimated_Replacement_Cost_INR), wellbeing scores &amp; requests, absence &amp; leave trends, exit-risk indicators, engagement / eNPS scores, exit-sensitive fields (Exit Reason Category, Regrettable Exit (Y/N), Rehire Eligibility, Exit Interview Summary, Exit Type, Full &amp; Final Status), and recruitment fields (Candidate Name, Interview Feedback, Offered CTC, Offer Status, Recruiter, Recruitment Source, Selection Decision).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#1B2A5C]">
                    Source of truth &amp; signal hygiene
                  </p>
                  <ul className="mt-1 space-y-1 text-slate-600 list-disc list-inside">
                    <li>
                      <strong className="font-semibold text-[#1B2A5C]">
                        Master
                      </strong>{" "}
                      governs name, role, status, and manager.
                    </li>
                    <li>
                      Employees with an exit record are not recommended. Master and Exit records can disagree; Master is used for role and status.
                    </li>
                    <li>
                      <strong className="font-semibold text-[#1B2A5C]">
                        Signals_Log
                      </strong>{" "}
                      deduplicated by Signal ID ({dataset.rawSignalsCount} raw &rarr;{" "}
                      {dataset.dedupedSignalsCount} unique); unmastered IDs (EMP031:{" "}
                      {dataset.orphanSignalIds.length}) safely isolated.
                    </li>
                    <li>
                      All state lives strictly in memory (no localStorage).{" "}
                      <button
                        type="button"
                        onClick={onViewAuditLog}
                        className="inline-flex items-center gap-1 font-semibold text-[#E5483A] hover:underline cursor-pointer"
                      >
                        <span>View audit log</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
