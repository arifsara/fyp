"use client";

import { useState } from "react";
import {
  ScanFace,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sun,
  Moon,
  Sparkles,
  ShoppingBag,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Recommendation {
  morning_routine: string[];
  night_routine: string[];
  products: string[];
}

interface Condition {
  label: string;
  display: string;
  score: number;
  rank: number;
}

interface SkinResultsCardProps {
  conditions: Condition[];
  recommendations?: Recommendation;
  analysisId?: number;
  createdAt?: string;
  compact?: boolean;
}

// Condition metadata: icon color, severity tier, tip
const CONDITION_META: Record<
  string,
  { color: string; barColor: string; severity: "high" | "medium" | "low" }
> = {
  "visible acne": {
    color: "text-rose-500",
    barColor: "from-rose-400 to-rose-600",
    severity: "high",
  },
  "oily shine": {
    color: "text-amber-500",
    barColor: "from-amber-400 to-amber-600",
    severity: "medium",
  },
  "dry flaky skin": {
    color: "text-blue-400",
    barColor: "from-blue-400 to-blue-600",
    severity: "medium",
  },
  "redness or irritation": {
    color: "text-red-400",
    barColor: "from-red-400 to-red-500",
    severity: "high",
  },
  "dark spots or hyperpigmentation": {
    color: "text-purple-500",
    barColor: "from-purple-400 to-purple-600",
    severity: "medium",
  },
  "uneven texture": {
    color: "text-orange-400",
    barColor: "from-orange-400 to-orange-500",
    severity: "low",
  },
  "visible pores": {
    color: "text-teal-500",
    barColor: "from-teal-400 to-teal-600",
    severity: "low",
  },
  "under-eye dark circles": {
    color: "text-indigo-500",
    barColor: "from-indigo-400 to-indigo-600",
    severity: "medium",
  },
  "scalp flaking or dandruff": {
    color: "text-yellow-500",
    barColor: "from-yellow-400 to-yellow-600",
    severity: "high",
  },
  "scalp redness": {
    color: "text-red-500",
    barColor: "from-red-400 to-red-600",
    severity: "medium",
  },
  "greasy scalp": {
    color: "text-lime-500",
    barColor: "from-lime-400 to-lime-600",
    severity: "low",
  },
};

const SEVERITY_LABELS = {
  high: { label: "Needs Attention", icon: AlertCircle, color: "text-rose-500" },
  medium: { label: "Monitor Closely", icon: TrendingUp, color: "text-amber-500" },
  low: { label: "Mild", icon: CheckCircle2, color: "text-emerald-500" },
};

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SkinResultsCard({
  conditions,
  recommendations,
  analysisId,
  createdAt,
  compact = false,
}: SkinResultsCardProps) {
  const [showPlan, setShowPlan] = useState(false);

  if (!conditions || conditions.length === 0) return null;

  // Normalize scores for bar widths relative to the top score
  const topScore = conditions[0]?.score ?? 1;

  return (
    <div className="space-y-6">
      {/* 1. Main Analysis Card (Conditions) */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <ScanFace className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Skin Condition Analysis</p>
              {createdAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" /> {formatDate(createdAt)}
                </p>
              )}
            </div>
          </div>
          {analysisId && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              #{analysisId}
            </span>
          )}
        </div>

        {/* Conditions list */}
        <div className="p-6 space-y-4">
          {conditions.map((cond, i) => {
            const meta = CONDITION_META[cond.label] ?? {
              color: "text-primary",
              barColor: "from-primary to-primary",
              severity: "low" as const,
            };
            const sev = SEVERITY_LABELS[meta.severity];
            const SevIcon = sev.icon;
            const barWidth = Math.round((cond.score / topScore) * 100);
            const pct = Math.round(cond.score * 100);

            return (
              <div
                key={cond.label}
                className={`space-y-2 ${compact && i >= 3 ? "hidden" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {cond.display}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-xs font-medium ${sev.color}`}
                    >
                      <SevIcon className="h-3 w-3" />
                      {sev.label}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${meta.color}`}>
                    {pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${meta.barColor} transition-all duration-700`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* History Mode: View Plan Toggle */}
          {compact && recommendations && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold rounded-xl gap-2 h-9 border-primary/20 text-primary hover:bg-primary/5 shadow-none"
                onClick={() => setShowPlan(!showPlan)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {showPlan ? "Hide AI Routine" : "View Detailed Routine"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. AI Recommendation Sections (Show if not compact OR if showPlan is true) */}
      {((!compact && recommendations) || (showPlan && recommendations)) && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-700">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-foreground">Detailed AI Skincare Plan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Routine */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Sun className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-amber-900">Morning Routine</h4>
              </div>
              <ul className="space-y-3">
                {recommendations.morning_routine.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-amber-800">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-200/50 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Night Routine */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Moon className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-indigo-900">Night Routine</h4>
              </div>
              <ul className="space-y-3">
                {recommendations.night_routine.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-indigo-800">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-200/50 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Product Recommendations */}
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-emerald-900">Recommended Actives & Products</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendations.products.map((product, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 bg-white border border-emerald-100 rounded-xl text-sm font-medium text-emerald-800 flex items-center gap-2 shadow-sm"
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  {product}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
