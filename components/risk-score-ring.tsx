"use client";

interface RiskScoreRingProps {
  score: number;
  size?: number;
}

function scoreColor(score: number): string {
  if (score < 30) return "#16a34a";
  if (score < 60) return "#d97706";
  return "#dc2626";
}

export function RiskScoreRing({ score, size = 80 }: RiskScoreRingProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color, lineHeight: 1 }}>
          {score}
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-3)" }}>
          /100
        </span>
      </div>
    </div>
  );
}
