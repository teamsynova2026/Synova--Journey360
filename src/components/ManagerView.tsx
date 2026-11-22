import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  EmployeeRecord,
  EmployeeResponse,
  ManagerSupportChoice,
  NarrativeContent,
  ScoreBreakdown,
  WorkflowStatus,
} from "../types/journey";
import { STATUS_PILL_CLASSES } from "../utils/statusStyles";
import { MatchRing } from "./MatchRing";

interface ManagerViewProps {
  screen: "list" | "detail";
  teamEmployees: EmployeeRecord[];
  selectedEmployee?: EmployeeRecord;
  breakdown?: ScoreBreakdown;
  status: WorkflowStatus;
  employeeResponse?: EmployeeResponse;
  employeeResponsesByEmpId: Record<string, EmployeeResponse>;
  statusesByEmpId: Record<string, WorkflowStatus>;
  lastSupportReason?: string;
  narrative: NarrativeContent;
  isGeneratingNarrative: boolean;
  onOpenEmployee: (employeeId: string) => void;
  onBackToList: () => void;
  onGenerateGeminiNarrative: () => void;
  onSubmitSupport: (
    employeeId: string,
    choice: ManagerSupportChoice,
    reason: string
  ) => void;
}

const SUPPORT_OPTIONS: ManagerSupportChoice[] = [
  "Agree to move forward",
  "Plan for later",
  "Not ready yet",
];

export const ManagerView: React.FC<ManagerViewProps> = ({
  screen,
  teamEmployees,
  selectedEmployee,
  breakdown,
  status,
  employeeResponse,
  employeeResponsesByEmpId,
  statusesByEmpId,
  lastSupportReason,
  narrative,
  isGeneratingNarrative,
  onOpenEmployee,
  onBackToList,
  onGenerateGeminiNarrative,
  onSubmitSupport,
}) => {
  const [supportChoice, setSupportChoice] =
    useState<ManagerSupportChoice>("Agree to move forward");
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [moreSuggestionsOpen, setMoreSuggestionsOpen] = useState(false);

  const selectedEmployeeId = selectedEmployee?.employeeId ?? "";

  useEffect(() => {
    setReason("");
    setValidationError("");
    setSubmittedMessage("");
  }, [selectedEmployeeId, screen]);

  const canManagerRespond =
    employeeResponse?.choice === "I'm interested" ||
    employeeResponse?.choice === "Let's talk first";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError(
        "Please describe the next step or timing you can offer before submitting."
      );
      return;
    }
    setValidationError("");
    onSubmitSupport(selectedEmployee.employeeId, supportChoice, trimmed);
    setSubmittedMessage(
      `"${supportChoice}" recorded for ${selectedEmployee.fullName} and logged to the Audit Log.`
    );
    setReason("");
  };

  const engagementAction = selectedEmployee?.engagementAction;

  if (screen === "list" || !selectedEmployee || !breakdown) {
    return (
      <div className="space-y-8">
        <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
          <div className="p-8 bg-[#E8F0FD]/75 border-b border-slate-100">
            <h1 className="text-[28px] leading-[1.25] font-semibold text-[#1B2A5C]">
              Your eligible direct reports
            </h1>
            <p className="text-[14px] text-slate-600 mt-1.5">
              Select a team member to review their response, conversation questions, and decide together on next steps.
            </p>
          </div>

          {teamEmployees.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-[14px]">
              Nothing here yet. No eligible direct reports found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[12px] font-semibold text-slate-500">
                    <th className="py-4 px-8">Name</th>
                    <th className="py-4 px-4">Target role</th>
                    <th className="py-4 px-4">Employee response</th>
                    <th className="py-4 px-8 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[16px]">
                  {teamEmployees.map((emp) => {
                    const resp = employeeResponsesByEmpId[emp.employeeId];
                    const rowStatus = statusesByEmpId[emp.employeeId] ?? "New";
                    return (
                      <tr
                        key={emp.employeeId}
                        onClick={() => onOpenEmployee(emp.employeeId)}
                        className="hover:bg-[#FFF8F3] transition-colors duration-150 cursor-pointer"
                      >
                        <td className="py-4 px-8 align-middle">
                          <div className="font-semibold text-[#1B2A5C]">
                            {emp.fullName}
                          </div>
                          <div className="text-[12px] text-slate-500 mt-0.5">
                            {emp.employeeId} &middot; {emp.jobTitle}
                          </div>
                        </td>
                        <td className="py-4 px-4 align-middle text-[14px] text-[#1E293B]">
                          {emp.careerAspiration}
                        </td>
                        <td className="py-4 px-4 align-middle">
                          {resp ? (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap ${STATUS_PILL_CLASSES[rowStatus]}`}
                            >
                              {resp.choice}
                            </span>
                          ) : (
                            <span className="text-[14px] text-slate-500">
                              No response yet
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-8 align-middle text-right">
                          <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#1B2A5C]">
                            <span>Open</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={onBackToList}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold border border-[#1B2A5C]/25 bg-white text-[#1B2A5C] hover:bg-[#FDECE4]/60 hover:border-[#1B2A5C] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to my team</span>
        </button>
      </div>

      {/* Candidate Header + Employee's Response at Top */}
      <section className="bg-white rounded-2xl p-8 shadow-[0_2px_12px_rgba(27,42,92,0.05)] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[12px] text-slate-500">
                {selectedEmployee.employeeId}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap ${STATUS_PILL_CLASSES[status]}`}
              >
                {status}
              </span>
            </div>

            <h1 className="text-[28px] leading-[1.25] font-semibold text-[#1B2A5C]">
              {selectedEmployee.fullName} &rarr; {selectedEmployee.careerAspiration}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-slate-600">
              <span>Current role: {selectedEmployee.jobTitle}</span>
              <span aria-hidden="true">&middot;</span>
              <span>
                Next career discussion:{" "}
                <span className="text-[12px] text-slate-500">
                  {selectedEmployee.nextCareerDiscussionDate || "Not scheduled"}
                </span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <MatchRing percent={breakdown.matchPercent} size={108} />
          </div>
        </div>

        {/* Employee's Response & Note */}
        <div className="pt-5 border-t border-slate-100">
          {employeeResponse ? (
            <div className="rounded-xl bg-[#E8F0FD]/75 p-4 text-[14px] space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[#1B2A5C]">
                  Employee response:{" "}
                  <span className="text-[#E5483A]">{employeeResponse.choice}</span>
                </p>
                <span className="text-[12px] text-slate-500">
                  Saved {employeeResponse.updatedAt}
                </span>
              </div>
              <p className="text-[#1E293B]">
                <span className="font-semibold text-[#1B2A5C]">Employee note:</span>{" "}
                {employeeResponse.note.trim()
                  ? `"${employeeResponse.note.trim()}"`
                  : "Nothing here yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 text-[14px] text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                <strong className="font-semibold text-slate-800">
                  Employee response:
                </strong>{" "}
                Waiting for {selectedEmployee.firstName} to respond on their Employee screen.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Main 2-Column Workspace: 3 Conversation Questions + Support Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: 3 Conversation Questions */}
        <section className="lg:col-span-7 bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
          <div className="px-8 py-6 bg-[#E8F0FD]/75 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1B2A5C] shrink-0" />
              <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
                Conversation guide (3 questions)
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[12px] text-slate-600">
                {narrative.source === "gemini"
                  ? "Gemini (gemini-4-hydrogen)"
                  : "Evidence template"}
              </span>
              <button
                type="button"
                onClick={onGenerateGeminiNarrative}
                disabled={isGeneratingNarrative}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-semibold border border-[#1B2A5C]/25 bg-white text-[#1B2A5C] hover:border-[#1B2A5C] hover:bg-[#FFF8F3] disabled:opacity-50 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F28C3A]" />
                <span>
                  {isGeneratingNarrative ? "Refreshing..." : "Refresh with Gemini"}
                </span>
              </button>
            </div>
          </div>

          <div className="p-8">
            {narrative.conversationQuestions.length === 0 ? (
              <p className="text-[14px] text-slate-500">Nothing here yet.</p>
            ) : (
              <ol className="divide-y divide-slate-100">
                {narrative.conversationQuestions.map((question, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-[16px] text-[#1E293B] py-4 first:pt-1 last:pb-1"
                  >
                    <span className="text-[14px] font-semibold text-[#E5483A] mt-0.5 shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{question}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        {/* Right: Joint Decision */}
        <section className="lg:col-span-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden h-fit">
          <div className="px-8 py-6 bg-[#FDECE4]/75 border-b border-slate-100">
            <h2 className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
              Joint decision
            </h2>
            <p className="text-[14px] text-slate-600 mt-1">
              AI suggests. Employee and manager decide together. HR supports.
            </p>
          </div>

          <div className="p-8">
            {!employeeResponse ? (
              <div className="rounded-xl bg-slate-50 p-4 text-[14px] text-slate-600">
                Waiting for the employee&apos;s response
              </div>
            ) : employeeResponse.choice === "Not now" ? (
              <div className="rounded-xl bg-slate-50 p-4 text-[14px] text-slate-600">
                The employee chose not to explore this now
              </div>
            ) : canManagerRespond ? (
              <>
                {lastSupportReason && (
                  <div className="mb-5 rounded-xl bg-slate-50 p-4 text-[14px] space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1B2A5C]">
                        Current status:
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap ${STATUS_PILL_CLASSES[status]}`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Last note: &ldquo;{lastSupportReason}&rdquo;
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-2.5">
                    {SUPPORT_OPTIONS.map((opt) => {
                      const active = supportChoice === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSupportChoice(opt)}
                          className={`px-4 py-2 rounded-xl text-[14px] font-semibold border text-left transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                            active
                              ? "bg-[#E5483A] text-white border-[#E5483A] hover:bg-[#cf3c2f]"
                              : "bg-white text-[#1B2A5C] border-[#1B2A5C]/25 hover:bg-[#FDECE4]/50 hover:border-[#1B2A5C]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label
                      htmlFor="manager-support-reason"
                      className="block text-[14px] font-semibold text-[#1B2A5C] mb-1.5"
                    >
                      Decision rationale <span className="text-[#E5483A]">*</span>
                    </label>
                    <textarea
                      id="manager-support-reason"
                      rows={3}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        if (validationError) setValidationError("");
                      }}
                      placeholder="Describe the next step or timing you can offer"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[16px] text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E5483A]/20 focus:border-[#E5483A]"
                    />
                    {validationError && (
                      <p className="mt-1.5 text-[12px] font-semibold text-[#E5483A]">
                        {validationError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-xl text-[14px] font-semibold border border-[#1B2A5C] bg-[#1B2A5C] text-white hover:bg-[#142047] transition-colors duration-150 cursor-pointer"
                  >
                    Submit
                  </button>

                  {submittedMessage && (
                    <div className="rounded-xl bg-[#E6F5EC] p-3.5 text-[14px] text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{submittedMessage}</span>
                    </div>
                  )}
                </form>
              </>
            ) : null}
          </div>
        </section>
      </div>

      {/* Collapsed "More suggestions" Section */}
      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
        <button
          type="button"
          onClick={() => setMoreSuggestionsOpen((v) => !v)}
          aria-expanded={moreSuggestionsOpen}
          className="w-full p-8 bg-[#E6F5EC]/70 hover:bg-[#E6F5EC]/95 flex items-center justify-between gap-4 text-left transition-colors duration-150 cursor-pointer"
        >
          <span className="text-[20px] leading-[1.35] font-semibold text-[#1B2A5C]">
            More suggestions
          </span>
          {moreSuggestionsOpen ? (
            <ChevronDown className="w-5 h-5 text-[#1B2A5C] shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[#1B2A5C] shrink-0" />
          )}
        </button>

        {moreSuggestionsOpen && (
          <div className="px-8 pb-8 pt-6 border-t border-slate-100 space-y-5">
            {narrative.whyRecommendation && (
              <p className="text-[14px] text-[#1E293B] bg-[#E8F0FD]/65 rounded-xl p-4">
                <strong className="font-semibold text-[#1B2A5C]">
                  Why this path is suggested:
                </strong>{" "}
                {narrative.whyRecommendation}
              </p>
            )}

            {engagementAction && engagementAction.isOpenOrOverdue && (
              <div className="rounded-xl bg-amber-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-[#F28C3A] shrink-0" />
                    <span className="text-[14px] font-semibold text-amber-950">
                      Engagement action ({engagementAction.status}
                      {engagementAction.isOverdue ? " · Overdue" : ""})
                    </span>
                  </div>
                  <span className="text-[12px] text-slate-500">
                    Due: {engagementAction.dueDate}
                  </span>
                </div>
                <p className="mt-1.5 text-[14px] font-semibold text-amber-950">
                  {engagementAction.action}
                </p>
                <p className="mt-1 text-[12px] text-amber-800">
                  Owner: {engagementAction.owner}
                  {selectedEmployee.stayInterviewNotes && (
                    <>
                      {" "}
                      &middot; Stay interview note: &ldquo;
                      {selectedEmployee.stayInterviewNotes}&rdquo;{" "}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-[12px] text-slate-700">
                        Sample text
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}

            {narrative.suggestedActions.length === 0 ? (
              <p className="text-[14px] text-slate-500">Nothing here yet.</p>
            ) : (
              <ul className="space-y-2.5 text-[14px] text-[#1E293B]">
                {narrative.suggestedActions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 py-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F28C3A] mt-0.5 shrink-0" />
                    <span>
                      {act}
                      {act.includes("Sample text") ||
                      act.includes("Development plan") ? (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] text-slate-500 bg-slate-100">
                          Sample text
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {selectedEmployee.managerFeedbackSummary && (
              <div className="pt-3 border-t border-slate-100 text-[14px] text-slate-600">
                <span className="font-semibold text-[#1B2A5C]">
                  Manager feedback summary:
                </span>{" "}
                {selectedEmployee.managerFeedbackSummary}{" "}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] text-slate-500 bg-slate-100">
                  Sample text
                </span>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
