import React from "react";

interface MatchRingProps {
  percent: number | null;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const MatchRing: React.FC<MatchRingProps> = ({
  percent,
  size = 120,
  strokeWidth = 10,
  label = "Match",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-label={
        percent !== null ? `${label}: ${percent}%` : "No role profile score"
      }
    >
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FDECE4"
          strokeWidth={strokeWidth}
        />
        {percent !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5483A"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {percent !== null ? (
          <>
            <span className="text-[28px] font-semibold text-[#1B2A5C] leading-none">
              {percent}%
            </span>
            <span className="text-[12px] font-normal text-slate-500 mt-1">
              {label}
            </span>
          </>
        ) : (
          <span className="text-[12px] font-normal text-slate-500 px-2 leading-tight">
            No profile
          </span>
        )}
      </div>
    </div>
  );
};
