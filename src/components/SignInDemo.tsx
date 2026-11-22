import React, { useMemo, useState } from "react";
import { EmployeeRecord } from "../types/journey";
import { Journey360Logo, SynovaLogo } from "./SynovaLogo";

interface SignInDemoProps {
  activeEmployees: EmployeeRecord[];
  initialEmployeeId?: string;
  onSignIn: (employeeId: string) => void;
}

export const SignInDemo: React.FC<SignInDemoProps> = ({
  activeEmployees,
  initialEmployeeId,
  onSignIn,
}) => {
  const sortedEmployees = useMemo(
    () =>
      [...activeEmployees].sort((a, b) =>
        a.fullName.localeCompare(b.fullName)
      ),
    [activeEmployees]
  );

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    () =>
      initialEmployeeId &&
      sortedEmployees.some((e) => e.employeeId === initialEmployeeId)
        ? initialEmployeeId
        : sortedEmployees.find((e) => e.employeeId === "EMP008")?.employeeId ??
          sortedEmployees[0]?.employeeId ??
          ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployeeId) {
      onSignIn(selectedEmployeeId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FDECE4] via-[#FFF8F3] to-[#E8F0FD] text-[#1E293B]">
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 sm:p-10 shadow-[0_4px_24px_rgba(27,42,92,0.08)] space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <SynovaLogo variant="signin" />
            </div>
            <h1 className="flex justify-center">
              <Journey360Logo variant="signin" />
            </h1>
            <p className="text-[16px] text-slate-600">
              AI suggests. Employee and manager decide together. HR supports.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div>
              <label
                htmlFor="demo-user-select"
                className="block text-[14px] font-semibold text-[#1B2A5C] mb-2"
              >
                Demo only: sign in as
              </label>
              <select
                id="demo-user-select"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[16px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#E5483A]/25 focus:border-[#E5483A]"
              >
                {sortedEmployees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2.5 rounded-xl text-[14px] font-semibold bg-[#1B2A5C] text-white hover:bg-[#142047] transition-colors duration-150 cursor-pointer"
            >
              Sign in
            </button>
          </form>

          <p className="text-center text-[12px] text-slate-500 leading-relaxed pt-1">
            Demo only. In a real company you sign in with your work account and your access is detected automatically.
          </p>
        </div>
      </main>

      <footer className="bg-white border-t border-[#1B2A5C]/10 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <SynovaLogo variant="footer" />
            <span className="font-semibold text-[#1B2A5C]">Team Synova</span>
            <span aria-hidden="true">&middot;</span>
            <span>Journey360 &middot; AI suggests. Employee and manager decide together. HR supports.</span>
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FDECE4] text-xs font-medium text-[#1B2A5C]">
            Synthetic demo data
          </span>
        </div>
      </footer>
    </div>
  );
};
