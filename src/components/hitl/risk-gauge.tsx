"use client";

import { motion } from "framer-motion";

interface RiskGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

export function RiskGauge({ score, size = 120, label = "Risque" }: RiskGaugeProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const color = normalizedScore < 30 ? "#22c55e" : normalizedScore < 60 ? "#f59e0b" : "#ef4444";
  const bgColor = normalizedScore < 30 ? "bg-green-500/10" : normalizedScore < 60 ? "bg-amber-500/10" : "bg-red-500/10";
  const textColor = normalizedScore < 30 ? "text-green-600 dark:text-green-400" : normalizedScore < 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  const levelText = normalizedScore < 30 ? "Faible" : normalizedScore < 60 ? "Modere" : "Eleve";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative rounded-full p-2 ${bgColor}`}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${textColor}`}>{normalizedScore}</span>
          <span className="text-xs text-muted-foreground">{levelText}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
