import React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  EmployeeRecord,
  LIFECYCLE_STAGES,
  NarrativeContent,
  ScoreBreakdown,
  WorkflowStatus,
} from "../types/journey";
import {
  LIFECYCLE_STAGE_DOT_CLASSES,
  STATUS_PILL_CLASSES,
} from "../utils/statusStyles";
import { MatchRing } from "./MatchRing";

interface HrDetailViewProps {
  employee: EmployeeRecord;
  breakdown: ScoreBreakdown;
  status: WorkflowStatus;
  untickedInferredSkills: string[];
  narrative: NarrativeContent;
  isGeneratingNarrative: boolean;
  onGenerateGeminiNarrative: () => void;
  onBackToOverview: () => void;
  onViewAuditLog: () => void;
}

export const HrDetailView: React.FC<HrDetailViewProps> = ({
  employee,
  breakdown,
  status,
  untickedInferredSkills,
  narrative,
  isGeneratingNarrative,
  onGenerateGeminiNarrative,
  onBackToOverview,
  onViewAuditLog,
}) => {
  const untickedSet = new Set(untickedInferredSkills);

  // Additional extracted skills that aren't in the target role profile
  const matchedSkillNames = new Set(
    breakdown.matchedSkills.map((m) => m.skill)
  );
  const additionalHeldSkills = employee.extractedSkills.filter(
    (s) => !matchedSkillNames.has(s.name)
  );

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToOverview}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold border border-[#1B2A5C]/25 bg-white text-[#1B2A5C] hover:bg-[#FDECE4]/60 hover:border-[#1B2A5C] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to HR Overview</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onViewAuditLog}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-semibold border border-[#1B2A5C]/25 bg-white text-[#1B2A5C] hover:bg-[#FDECE4]/60 hover:border-[#1B2A5C] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>View audit log</span>
          </button>
        </div>
      </div>

      {/* Employee Header Card */}
      <section className="bg-white rounded-2xl p-8 shadow-[0_2px_12px_rgba(27,42,92,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] leading-[1.25] font-semibold text-[#1B2A5C]">
                {employee.fullName}
              </h1>
              <span className="text-[12px] text-slate-500">
                {employee.employeeId}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap ${STATUS_PILL_CLASSES[status]}`}
              >
                {status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-slate-600">
              <span>
                <strong className="font-semibold text-slate-800">
                  Current role (Master):
                </strong>{" "}
                {employee.jobTitle}
              </span>
              {employee.recordsDisagree && (
                <span className="text-[12px] text-slate-500">
                  (Job title differs in Performance: &ldquo;{employee.performanceJobRole}&rdquo;)
                </span>
              )}
              <span aria-hidden="true">&middot;</span>
              <span>
                <strong className="font-semibold text-slate-800">
                  Target role:
                </strong>{" "}
                {employee.careerAspiration}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-slate-500">
              <span>
                {employee.department} / {employee.team}
              </span>
              {employee.managerName && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span>Manager: {employee.managerName}</span>
                </>
              )}
              <span aria-hidden="true">&middot;</span>
              <span>
                {employee.location} ({employee.workMode})
              </span>
              <span aria-hidden="true">&middot;</span>
              <span>Mobility: {employee.internalMobilityInterest}</span>
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <MatchRing percent={breakdown.matchPercent} size={116} />
          </div>
        </div>
      </section>

      {/* Score Formula Breakdown & Skills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formula Breakdown */}
        <section className="lg:col-span-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden flex flex-col">
          <div className="px-8 py-6 bg-[#E8F0FD]/75 border-b border-slate-100">
            <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
              Match score breakdown
            </h2>
            <p className="text-[14px] text-slate-600 mt-1">
              Deterministic formula only — no AI is used for the score.
            </p>
          </div>

          <div className="p-8 flex-1 flex flex-col justify-between">
            {breakdown.hasProfile ? (
              <div className="space-y-3 text-[14px]">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-[#1B2A5C]">
                      70% &times; Skill weights held
                    </p>
                    <p className="text-[12px] text-slate-500">
                      70% &times; ({breakdown.heldWeight} / {breakdown.totalWeight})
                    </p>
                  </div>
                  <span className="font-semibold text-[#1B2A5C]">
                    {breakdown.skillComponent.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-[#1B2A5C]">
                      20% &times; Potential rating
                    </p>
                    <p className="text-[12px] text-slate-500">
                      20% &times; {breakdown.potentialScore} ({breakdown.potentialLabel})
                    </p>
                  </div>
                  <span className="font-semibold text-[#1B2A5C]">
                    {breakdown.potentialComponent.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <p className="font-semibold text-[#1B2A5C]">
                      10% &times; Performance rating
                    </p>
                    <p className="text-[12px] text-slate-500">
                      10% &times; ({breakdown.performanceRating} / 5 &times; 100)
                    </p>
                  </div>
                  <span className="font-semibold text-[#1B2A5C]">
                    {breakdown.performanceComponent.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-semibold text-[#1B2A5C]">
                      Total match score (rounded)
                    </p>
                    <p className="text-[12px] text-slate-500">
                      Exact sum: {breakdown.rawTotal.toFixed(2)}%
                    </p>
                  </div>
                  <span className="text-[20px] font-semibold text-[#E5483A]">
                    {breakdown.matchPercent}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-[14px] text-slate-700">
                <p className="font-semibold text-[#1B2A5C]">
                  No role profile yet, score not available
                </p>
                <p className="mt-1 text-slate-600">
                  Role profiles are defined for Marketing Manager, Sales Manager, Data Architect, QA Lead, Engineering Manager, and HR Business Partner. Potential ({employee.potentialRating}) and Performance ({employee.performanceRating5}/5) remain visible below.
                </p>
              </div>
            )}

            {untickedInferredSkills.length > 0 && (
              <p className="mt-4 text-[12px] text-amber-800">
                Employee unticked {untickedInferredSkills.length} inferred skill(s) in Employee View; score recalculated live.
              </p>
            )}
          </div>
        </section>

        {/* Held Skills & Gaps */}
        <section className="lg:col-span-7 bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
          <div className="px-8 py-6 bg-[#E6F5EC]/75 border-b border-slate-100">
            <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
              Skills alignment for {employee.careerAspiration}
            </h2>
            <p className="text-[14px] text-slate-600 mt-1">
              Extracted by fixed keyword rules. Stated = Skills_Acquired or Completed course; Inferred = Job Title, Team, or Key_Strengths.
            </p>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Held Skills */}
            <div>
              <h3 className="text-[16px] font-semibold text-[#1B2A5C] flex items-center gap-1.5 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Held skills</span>
              </h3>

              <div className="space-y-3">
                {breakdown.hasProfile ? (
                  breakdown.matchedSkills.length > 0 ? (
                    breakdown.matchedSkills.map((item) => {
                      const isStated = item.tag === "Stated";
                      return (
                        <div
                          key={item.skill}
                          className={`rounded-xl p-3.5 ${
                            item.active
                              ? "bg-[#E6F5EC]/60"
                              : "bg-slate-50 opacity-75"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[14px] font-semibold ${
                                  item.active
                                    ? "text-[#1B2A5C]"
                                    : "text-slate-500 line-through"
                                }`}
                              >
                                {item.skill}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${
                                  isStated
                                    ? "bg-[#E6F5EC] text-emerald-900"
                                    : "bg-[#E8F0FD] text-[#1B2A5C]"
                                }`}
                              >
                                {item.tag}
                              </span>
                            </div>
                            <span className="text-[12px] text-slate-500 whitespace-nowrap shrink-0">
                              Weight {item.weight}
                            </span>
                          </div>
                          <p className="text-[12px] text-slate-500 mt-1">
                            {item.sources.join(" · ")}
                          </p>
                          {!item.active && (
                            <p className="text-[12px] text-amber-800 mt-1 font-semibold">
                              Unticked by employee
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[14px] text-slate-500">
                      Nothing here yet — no target-profile skills matched.
                    </p>
                  )
                ) : employee.extractedSkills.length > 0 ? (
                  employee.extractedSkills.map((skill) => {
                    const isStated = skill.tag === "Stated";
                    const isUnticked =
                      skill.tag === "Inferred" && untickedSet.has(skill.name);
                    return (
                      <div
                        key={skill.name}
                        className={`rounded-xl p-3.5 ${
                          isUnticked
                            ? "bg-slate-50 opacity-75"
                            : "bg-[#E6F5EC]/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[14px] font-semibold text-[#1B2A5C]">
                            {skill.name}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${
                              isStated
                                ? "bg-[#E6F5EC] text-emerald-900"
                                : "bg-[#E8F0FD] text-[#1B2A5C]"
                            }`}
                          >
                            {skill.tag}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-500 mt-1">
                          {skill.sources.join(" · ")}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[14px] text-slate-500">
                    Nothing here yet — no extracted skills matched.
                  </p>
                )}

                {breakdown.hasProfile && additionalHeldSkills.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[12px] font-semibold text-slate-500 mb-1.5">
                      Other held skills (outside target profile):
                    </p>
                    {additionalHeldSkills.map((s) => (
                      <div
                        key={s.name}
                        className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600 py-1"
                      >
                        <span className="font-semibold text-[#1B2A5C]">
                          {s.name}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${
                            s.tag === "Stated"
                              ? "bg-[#E6F5EC] text-emerald-900"
                              : "bg-[#E8F0FD] text-[#1B2A5C]"
                          }`}
                        >
                          {s.tag}
                        </span>
                        <span className="text-slate-500">{s.sources[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Skill Gaps */}
            <div>
              <h3 className="text-[16px] font-semibold text-[#1B2A5C] flex items-center gap-1.5 mb-3">
                <Clock className="w-4 h-4 text-[#F28C3A] shrink-0" />
                <span>Skill &amp; learning gaps</span>
              </h3>

              <div className="space-y-3">
                {breakdown.hasProfile ? (
                  breakdown.missingSkills.length > 0 ? (
                    breakdown.missingSkills.map((gap) => (
                      <div
                        key={gap.skill}
                        className="rounded-xl bg-amber-50/70 p-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[14px] font-semibold text-amber-950">
                              {gap.skill}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-amber-100 text-amber-900 whitespace-nowrap">
                              Gap
                            </span>
                          </div>
                          <span className="text-[12px] text-slate-500 whitespace-nowrap shrink-0">
                            Weight {gap.weight}
                          </span>
                        </div>
                        {gap.reason && (
                          <p className="text-[12px] text-slate-600 mt-1">
                            Course status: {gap.reason}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[14px] text-slate-500">
                      Nothing here yet — all target profile skills are held.
                    </p>
                  )
                ) : (
                  <>
                    {employee.inProgressOrNotStartedCourses.length > 0 ? (
                      employee.inProgressOrNotStartedCourses.map((c) => (
                        <div
                          key={c.courseName}
                          className="rounded-xl bg-amber-50/70 p-3.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[14px] font-semibold text-amber-950">
                              {c.courseName}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-amber-100 text-amber-900 whitespace-nowrap">
                              Gap
                            </span>
                          </div>
                          <p className="text-[12px] text-slate-600 mt-1">
                            Course {c.status} — counts as gap until Completed
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[14px] text-slate-500">
                        {employee.developmentAreas
                          ? `Development area noted: ${employee.developmentAreas}`
                          : "Nothing here yet."}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Why This Recommendation */}
      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
        <div className="px-8 py-6 bg-[#FDECE4]/75 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F28C3A] shrink-0" />
            <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
              Why this recommendation
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[12px] text-slate-600">
              Source:{" "}
              <strong className="font-semibold text-[#1B2A5C]">
                {narrative.source === "gemini"
                  ? "Gemini (gemini-4-hydrogen)"
                  : "Evidence template"}
              </strong>
            </span>
            <button
              type="button"
              onClick={onGenerateGeminiNarrative}
              disabled={isGeneratingNarrative}
              className="px-4 py-2 rounded-xl text-[14px] font-semibold border border-[#1B2A5C]/25 bg-white text-[#1B2A5C] hover:border-[#1B2A5C] hover:bg-[#FFF8F3] disabled:opacity-50 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isGeneratingNarrative ? "Generating..." : "Refresh with Gemini"}
            </button>
          </div>
        </div>

        <div className="p-8">
          <p className="text-[16px] text-[#1E293B] leading-relaxed">
            {narrative.whyRecommendation || "Nothing here yet."}
          </p>

          {narrative.errorNote && (
            <p className="mt-2 text-[12px] text-slate-500">
              Note: {narrative.errorNote}
            </p>
          )}
        </div>
      </section>

      {/* Lifecycle Signals & Evidence List (All 7 Stages) */}
      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
        <div className="px-8 py-6 bg-[#E8F0FD]/75 border-b border-slate-100">
          <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
            Signals across lifecycle stages
          </h2>
          <p className="text-[14px] text-slate-600 mt-1">
            Every stage is shown in order. Stages without records show &ldquo;No data yet&rdquo;. Templated text columns are marked &ldquo;Sample text&rdquo;.
          </p>
        </div>

        <div className="px-8 py-5 divide-y divide-slate-100">
          {LIFECYCLE_STAGES.map((stage) => {
            const rows = employee.evidenceByStage[stage];
            return (
              <div key={stage} className="py-4 first:pt-2 last:pb-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-2">
                    <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1B2A5C]">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${LIFECYCLE_STAGE_DOT_CLASSES[stage]}`}
                        aria-hidden="true"
                      />
                      <span>{stage}</span>
                    </span>
                  </div>

                  <div className="md:col-span-10">
                    {rows.length === 0 ? (
                      <p className="text-[14px] text-slate-500">No data yet</p>
                    ) : (
                      <div className="space-y-2.5">
                        {rows.map((row) => (
                          <div
                            key={row.id}
                            className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-[14px]"
                          >
                            <div className="text-[#1E293B]">
                              {row.fieldLabel && (
                                <span className="font-semibold text-[#1B2A5C] mr-1.5">
                                  {row.fieldLabel}:
                                </span>
                              )}
                              <span>{row.sentence}</span>
                              {row.isSampleText && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] text-slate-500 bg-slate-100">
                                  Sample text
                                </span>
                              )}
                            </div>

                            <div className="text-[12px] text-slate-500 whitespace-nowrap shrink-0">
                              {row.sourceTab}
                              {row.date
                                ? ` · ${
                                    row.isSignalLog ? `logged ${row.date}` : row.date
                                  }`
                                : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
