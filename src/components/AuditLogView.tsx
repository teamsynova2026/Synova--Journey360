import React, { useMemo, useState } from "react";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { AppTab, AuditLogEntry } from "../types/journey";

interface AuditLogViewProps {
  entries: AuditLogEntry[];
  onBack: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  entries,
  onBack,
}) => {
  const [tabFilter, setTabFilter] = useState<"All" | AppTab>("All");

  const filteredEntries = useMemo(() => {
    if (tabFilter === "All") return entries;
    return entries.filter((item) => item.tab === tabFilter);
  }, [tabFilter, entries]);

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold border border-[#1B2A5C]/25 bg-white text-[#1B2A5C] hover:bg-[#FDECE4]/60 hover:border-[#1B2A5C] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <section className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(27,42,92,0.05)] overflow-hidden">
        <div className="p-8 bg-[#E8F0FD]/75 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-[#1B2A5C] mt-1 shrink-0" />
            <div>
              <h1 className="text-[28px] leading-[1.25] font-semibold text-[#1B2A5C]">
                In-memory audit log
              </h1>
              <p className="text-[14px] text-slate-600 mt-1">
                Every My growth, My team, and Company overview view, inferred skill toggle, and joint decision is recorded in memory for this session.
              </p>
            </div>
          </div>

          <div className="inline-flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {(["All", "My growth", "My team", "Company overview"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTabFilter(tab)}
                  className={`px-4 py-2 text-[14px] font-semibold rounded-xl border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    tabFilter === tab
                      ? "bg-[#E5483A] text-white border-[#E5483A] hover:bg-[#cf3c2f]"
                      : "bg-white text-[#1B2A5C] border-[#1B2A5C]/25 hover:bg-[#FDECE4]/50 hover:border-[#1B2A5C]"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[12px] font-semibold text-slate-500">
                <th className="py-4 px-8">Time</th>
                <th className="py-4 px-4">Who</th>
                <th className="py-4 px-4">Action</th>
                <th className="py-4 px-4">Employee</th>
                <th className="py-4 px-8">Reason / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[16px]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 px-8 text-center text-[14px] text-slate-500"
                  >
                    Nothing here yet — activity in this session will show up here.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-[#FFF8F3] transition-colors duration-150"
                  >
                    <td className="py-4 px-8 text-[12px] text-slate-500 whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    <td className="py-4 px-4 text-[14px] whitespace-nowrap">
                      <span className="font-semibold text-[#1B2A5C]">
                        {entry.actorName}
                      </span>{" "}
                      <span className="text-[12px] text-slate-500">
                        ({entry.tab})
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[14px] font-semibold text-[#E5483A]">
                      {entry.action}
                    </td>
                    <td className="py-4 px-4 text-[14px] text-[#1E293B] whitespace-nowrap">
                      {entry.employeeName}{" "}
                      <span className="text-[12px] text-slate-500">
                        ({entry.employeeId})
                      </span>
                    </td>
                    <td className="py-4 px-8 text-[14px] text-slate-700">
                      {entry.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
