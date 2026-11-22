import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Lock } from "lucide-react";
import {
  EmployeeChoice,
  EmployeeRecord,
  EmployeeResponse,
  ScoreBreakdown,
} from "../types/journey";
import { MatchRing } from "./MatchRing";

interface EmployeeViewProps {
  employee: EmployeeRecord;
  breakdown: ScoreBreakdown;
  untickedInferredSkills: string[];
  employeeResponse?: EmployeeResponse;
  onSaveEmployeeResponse: (
    employeeId: string,
    choice: EmployeeChoice,
    note: string
  ) => void;
  onToggleInferredSkill: (
    employeeId: string,
    skillName: string,
    currentlyTicked: boolean
  ) => void;
}

interface EmployeeEvidenceLine {
  id: string;
  text: string;
  source: string;
  date?: string;
}

function buildEmployeeEvidenceLines(
  employee: EmployeeRecord
): EmployeeEvidenceLine[] {
  const lines: EmployeeEvidenceLine[] = [];

  if (employee.nextCareerDiscussionDate) {
    lines.push({
      id: "growth-discussion",
      text: `Career aspiration is ${employee.careerAspiration}; next career discussion is scheduled.`,
      source: "Growth",
      date: employee.nextCareerDiscussionDate,
    });
  } else if (employee.careerAspiration) {
    lines.push({
      id: "growth-aspiration",
      text: `Career aspiration listed as ${employee.careerAspiration} (mobility interest: ${employee.internalMobilityInterest}).`,
      source: "Growth",
      date: employee.lastPromotionDate || undefined,
    });
  }

  if (employee.courseProgram) {
    lines.push({
      id: "learning-course",
      text: `${employee.courseProgram} — status: ${employee.learningStatus || "Recorded"}${
        employee.assessmentScore ? ` (${employee.assessmentScore}% assessment)` : ""
      }.`,
      source: "Learning",
      date: employee.trainingCompletionDate || employee.trainingStartDate || undefined,
    });
  }

  if (employee.skillsAcquired) {
    lines.push({
      id: "perform-skills",
      text: `Stated skills on record: ${employee.skillsAcquired}.`,
      source: "Performance",
      date: employee.appraisalPeriod || undefined,
    });
  } else if (employee.keyStrengths) {
    lines.push({
      id: "perform-strengths",
      text: `Key strengths noted on review: ${employee.keyStrengths}.`,
      source: "Performance",
      date: employee.appraisalPeriod || undefined,
    });
  }

  return lines.slice(0, 3);
}

const CHOICE_OPTIONS: EmployeeChoice[] = [
  "I'm interested",
  "Let's talk first",
  "Not now",
];

export const EmployeeView: React.FC<EmployeeViewProps> = ({
  employee,
  breakdown,
  untickedInferredSkills,
  employeeResponse,
  onSaveEmployeeResponse,
  onToggleInferredSkill,
}) => {
  const untickedSet = new Set(untickedInferredSkills);
  const [noteDraft, setNoteDraft] = useState(employeeResponse?.note ?? "");
  const [savedBanner, setSavedBanner] = useState(Boolean(employeeResponse));
  const [showCalculation, setShowCalculation] = useState(false);

  const evidenceLines = useMemo(
    () => buildEmployeeEvidenceLines(employee),
    [employee]
  );

  useEffect(() => {
    setNoteDraft(employeeResponse?.note ?? "");
    setSavedBanner(Boolean(employeeResponse));
  }, [employee.employeeId, employeeResponse]);

  const handleChoose = (choice: EmployeeChoice) => {
    onSaveEmployeeResponse(employee.employeeId, choice, noteDraft);
    setSavedBanner(true);
  };

  const handleUpdateNote = () => {
    if (!employeeResponse) return;
    onSaveEmployeeResponse(
      employee.employeeId,
      employeeResponse.choice,
      noteDraft
    );
    setSavedBanner(true);
  };

  const noteChangedSinceSave =
    Boolean(employeeResponse) && noteDraft !== (employeeResponse?.note ?? "");

  return (
    <div className="space-y-8">
      {/* 1. Score Card */}
      <section className="bg-white rounded-2xl p-8 shadow-[0_2px_12px_rgba(27,42,92,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-[28px] leading-[1.25] font-semibold text-[#1B2A5C]">
              Hi {employee.firstName}
            </h1>

            <p className="text-[16px] text-slate-600 leading-relaxed">
              AI suggests{" "}
              <strong className="font-semibold text-[#1B2A5C]">
                {employee.careerAspiration}
              </strong>{" "}
              based on your Growth profile. You and your manager decide together whether to explore this move, and HR is here to support you.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-slate-500 pt-1">
              <span>
                Current role:{" "}
                <strong className="font-semibold text-[#1B2A5C]">
                  {employee.jobTitle}
                </strong>
              </span>
              {employee.managerName && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span>Manager: {employee.managerName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <MatchRing percent={breakdown.matchPercent} size={120} />
          </div>
        </div>
      </section>

      {/* 2. Why We Suggest This */}
      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
        <div className="px-8 py-6 bg-[#E8F0FD]/75 border-b border-slate-100">
          <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
            Why we suggest this
          </h2>
        </div>

        <div className="px-8 py-6">
          {evidenceLines.length === 0 ? (
            <p className="text-[14px] text-slate-500">Nothing here yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {evidenceLines.map((line) => (
                <li
                  key={line.id}
                  className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2"
                >
                  <span className="text-[16px] text-[#1E293B]">{line.text}</span>
                  <span className="text-[12px] text-slate-500 whitespace-nowrap shrink-0">
                    {line.source}
                    {line.date ? ` · ${line.date}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 3. Employee Choice Card */}
      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
        <div className="px-8 py-6 bg-[#FDECE4]/75 border-b border-slate-100">
          <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
            Is this a path you want to explore?
          </h2>
          <p className="text-[14px] text-slate-600 mt-1">
            AI suggests. Employee and manager decide together. HR supports.
          </p>
        </div>

        <div className="p-8 space-y-5">
          <div>
            <label
              htmlFor="employee-manager-note"
              className="block text-[14px] font-semibold text-[#1B2A5C] mb-2"
            >
              Anything you want your manager to know?
            </label>
            <textarea
              id="employee-manager-note"
              rows={2}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder={`Optional note for ${employee.managerName || "your manager"}...`}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[16px] text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E5483A]/20 focus:border-[#E5483A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {CHOICE_OPTIONS.map((choice) => {
              const isSelected = employeeResponse?.choice === choice;
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleChoose(choice)}
                  className={`px-4 py-2 rounded-xl text-[14px] font-semibold border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-[#E5483A] text-white border-[#E5483A] hover:bg-[#cf3c2f]"
                      : "bg-white text-[#1B2A5C] border-[#1B2A5C]/25 hover:bg-[#FDECE4]/50 hover:border-[#1B2A5C]"
                  }`}
                >
                  {choice}
                </button>
              );
            })}

            {noteChangedSinceSave && (
              <button
                type="button"
                onClick={handleUpdateNote}
                className="px-4 py-2 rounded-xl text-[14px] font-semibold border border-[#1B2A5C] bg-[#1B2A5C] text-white hover:bg-[#142047] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Save updated note
              </button>
            )}
          </div>

          {savedBanner && employeeResponse && (
            <div className="rounded-xl bg-[#E6F5EC] px-4 py-3 text-[14px] text-emerald-900 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong className="font-semibold">Your response was saved</strong>{" "}
                  ({employeeResponse.choice})
                </span>
              </div>
              <span className="text-[12px] text-emerald-800">
                Pick another option or update your note anytime.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 4. Skills List with Tick Boxes + Skills to Build */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Skills Checklist */}
        <section className="lg:col-span-7 bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
          <div className="px-8 py-6 bg-[#E6F5EC]/75 border-b border-slate-100">
            <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
              Confirm your skills
            </h2>
            <p className="text-[14px] text-slate-600 mt-1">
              Stated skills are locked. Untick any inferred skill that does not apply to update your match score live.
            </p>
          </div>

          <div className="px-8 py-6">
            {employee.extractedSkills.length === 0 ? (
              <p className="text-[14px] text-slate-500 py-2">
                Nothing here yet. No mapped skills were found in your records.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {employee.extractedSkills.map((skill) => {
                  const isStated = skill.tag === "Stated";
                  const isChecked = isStated || !untickedSet.has(skill.name);
                  const profileItem = breakdown.matchedSkills.find(
                    (m) => m.skill === skill.name
                  );

                  return (
                    <label
                      key={skill.name}
                      className={`flex items-start justify-between gap-4 py-4 first:pt-2 last:pb-2 ${
                        isStated ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isStated}
                          onChange={() => {
                            if (!isStated) {
                              onToggleInferredSkill(
                                employee.employeeId,
                                skill.name,
                                isChecked
                              );
                            }
                          }}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#E5483A] text-[#E5483A] focus:ring-[#E5483A] disabled:opacity-60"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[16px] font-semibold ${
                                isChecked
                                  ? "text-[#1B2A5C]"
                                  : "text-slate-400 line-through"
                              }`}
                            >
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
                            {profileItem && (
                              <span className="text-[12px] text-slate-500">
                                Weight {profileItem.weight}
                              </span>
                            )}
                          </div>
                          <p className="text-[14px] text-slate-500 mt-1">
                            {skill.sources.join(" · ")}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 mt-1">
                        {isStated ? (
                          <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Locked</span>
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-500">
                            {isChecked ? "Confirmed" : "Unticked"}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Skills to Build */}
        <section className="lg:col-span-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden h-fit">
          <div className="px-8 py-6 bg-[#FDECE4]/75 border-b border-slate-100">
            <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
              Skills to build
            </h2>
            <p className="text-[14px] text-slate-600 mt-1">
              Areas for {employee.careerAspiration} not yet matched from your completed courses or profile.
            </p>
          </div>

          <div className="px-8 py-6">
            {breakdown.hasProfile ? (
              breakdown.missingSkills.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {breakdown.missingSkills.map((m) => (
                    <li key={m.skill} className="py-3.5 first:pt-1 last:pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[16px] font-semibold text-[#1B2A5C]">
                            {m.skill}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-amber-100 text-amber-900 whitespace-nowrap">
                            Gap
                          </span>
                        </div>
                        <span className="text-[12px] text-slate-500 whitespace-nowrap shrink-0">
                          Weight {m.weight}
                        </span>
                      </div>
                      {m.reason && (
                        <p className="text-[14px] text-slate-600 mt-1">
                          {m.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-slate-500">
                  Nothing here yet — all target profile skills are held.
                </p>
              )
            ) : (
              <p className="text-[14px] text-slate-500">
                No role profile yet, score not available for {employee.careerAspiration}.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* 5. Collapsed "How is this calculated?" */}
      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCalculation((v) => !v)}
          aria-expanded={showCalculation}
          className="w-full p-8 bg-[#E8F0FD]/70 hover:bg-[#E8F0FD]/95 flex items-center justify-between gap-4 text-left transition-colors duration-150 cursor-pointer"
        >
          <span className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
            How is this calculated?
          </span>
          {showCalculation ? (
            <ChevronDown className="w-5 h-5 text-[#1B2A5C] shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[#1B2A5C] shrink-0" />
          )}
        </button>

        {showCalculation && (
          <div className="px-8 pb-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-[16px] font-semibold text-[#1B2A5C] mb-3">
                Deterministic match score formula
              </h3>
              {breakdown.hasProfile ? (
                <div className="space-y-2.5 text-[14px]">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">
                      70% &times; ({breakdown.heldWeight}/{breakdown.totalWeight} skill weight)
                    </span>
                    <span className="font-semibold text-[#1B2A5C]">
                      {breakdown.skillComponent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">
                      20% &times; {breakdown.potentialScore} ({breakdown.potentialLabel})
                    </span>
                    <span className="font-semibold text-[#1B2A5C]">
                      {breakdown.potentialComponent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">
                      10% &times; ({breakdown.performanceRating}/5 &times; 100)
                    </span>
                    <span className="font-semibold text-[#1B2A5C]">
                      {breakdown.performanceComponent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-semibold text-[#1B2A5C]">
                      Total (rounded)
                    </span>
                    <span className="text-[16px] font-semibold text-[#E5483A]">
                      {breakdown.matchPercent}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[14px] text-slate-500">
                  No role profile yet, score not available.
                </p>
              )}
            </div>

            <div className="space-y-4 text-[14px] text-[#1E293B]">
              <h3 className="text-[16px] font-semibold text-[#1B2A5C]">
                Development plan &amp; sample notes
              </h3>

              {!employee.developmentPlan &&
              !employee.learningFeedback &&
              !employee.stayInterviewNotes ? (
                <p className="text-[14px] text-slate-500">Nothing here yet.</p>
              ) : (
                <>
                  {employee.developmentPlan && (
                    <div>
                      <span className="font-semibold text-[#1B2A5C]">
                        Development plan:
                      </span>{" "}
                      {employee.developmentPlan}{" "}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] text-slate-500 bg-slate-100">
                        Sample text
                      </span>
                    </div>
                  )}

                  {employee.learningFeedback && (
                    <div>
                      <span className="font-semibold text-[#1B2A5C]">
                        Learning feedback ({employee.courseProgram}):
                      </span>{" "}
                      {employee.learningFeedback}{" "}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] text-slate-500 bg-slate-100">
                        Sample text
                      </span>
                    </div>
                  )}

                  {employee.stayInterviewNotes && (
                    <div>
                      <span className="font-semibold text-[#1B2A5C]">
                        Stay interview notes:
                      </span>{" "}
                      {employee.stayInterviewNotes}{" "}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] text-slate-500 bg-slate-100">
                        Sample text
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
