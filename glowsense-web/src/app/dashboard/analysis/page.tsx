"use client";

import { useState, useEffect } from "react";
import { ScanFace, History, ChevronDown, ChevronUp, AlertTriangle, Wifi, CheckCircle } from "lucide-react";
import SkinAnalysisUploader from "@/components/skin/SkinAnalysisUploader";
import SkinResultsCard from "@/components/skin/SkinResultsCard";

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

interface AnalysisResult {
  analysis_id: number;
  conditions: Condition[];
  recommendations?: Recommendation;
  created_at: string;
}

interface HistoryEntry {
  analysis_id: number;
  conditions: Condition[];
  recommendations?: Recommendation;
  created_at: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function AnalysisPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [mlStatus, setMlStatus] = useState<"unknown" | "ready" | "down">("unknown");

  // Check ML service health on mount
  useEffect(() => {
    const check = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${BACKEND_URL}/skin/health`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMlStatus(res.ok ? "ready" : "down");
      } catch {
        setMlStatus("down");
      }
    };
    check();
  }, []);

  // Load history when panel opens
  useEffect(() => {
    if (!historyOpen) return;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BACKEND_URL}/skin/history?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load history");
        const data = await res.json();
        
        // Parse results from DB format
        const parsedHistory = data.analyses.map((a: any) => {
          // If backend returns 'conditions' and 'recommendations' separately at root, use them.
          // In my current routes.py, history endpoint returns results as:
          // result.append({ "analysis_id": a.id, "conditions": conditions, ... })
          // But I updated my routes.py to store final_results = { "conditions": ..., "recommendations": ... }
          // Let's ensure we parse correctly regardless of whether it's the new or old format.
          const conds = a.conditions || [];
          const recs = a.recommendations || undefined;
          
          return {
            analysis_id: a.analysis_id,
            conditions: conds,
            recommendations: recs,
            created_at: a.created_at
          };
        });
        
        setHistory(parsedHistory);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    load();
  }, [historyOpen]);

  const handleResult = (r: AnalysisResult) => {
    setResult(r);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleError = (msg: string) => {
    setError(msg);
    setResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">

      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ScanFace className="h-6 w-6 text-primary" />
            AI Skin Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a close-up photo to detect your top skin concerns using DermLIP.
          </p>
        </div>

        {/* ML Service Status Badge */}
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border">
          {mlStatus === "ready" && (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-medium">AI Model Ready</span>
            </>
          )}
          {mlStatus === "down" && (
            <>
              <Wifi className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-rose-500 font-medium">ML Service Offline</span>
            </>
          )}
          {mlStatus === "unknown" && (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-muted-foreground">Checking…</span>
            </>
          )}
        </div>
      </div>

      {/* ML Service Warning */}
      {mlStatus === "down" && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">DermLIP ML service is not running.</p>
            <p className="text-xs mt-0.5 text-rose-600">
              Start it with: <code className="bg-rose-100 px-1 rounded">python c:\FYP\Derm1M\skin_api.py</code>
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />

        <div className="p-6 space-y-6">
          {/* How it works strip */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { step: "1", label: "Upload Photo", desc: "Clear, well-lit skin photo" },
              { step: "2", label: "AI Analysis", desc: "DermLIP scans your skin" },
              { step: "3", label: "Get Results", desc: "Top conditions + tips" },
            ].map((s) => (
              <div key={s.step} className="rounded-xl bg-muted/50 p-3 space-y-1">
                <div className="h-7 w-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mx-auto">
                  {s.step}
                </div>
                <p className="text-xs font-semibold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Uploader */}
          <SkinAnalysisUploader onResult={handleResult} onError={handleError} />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SkinResultsCard
            conditions={result.conditions}
            recommendations={result.recommendations}
            analysisId={result.analysis_id}
            createdAt={result.created_at}
          />
        </div>
      )}

      {/* Analysis History */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setHistoryOpen((o) => !o)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
          id="skin-history-toggle"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <History className="h-4 w-4 text-primary" />
            Past Analyses
          </div>
          {historyOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {historyOpen && (
          <div className="border-t border-border px-6 py-4 space-y-4">
            {historyLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Loading history…
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No past analyses yet. Run your first scan above!
              </p>
            )}

            {!historyLoading &&
              history.map((entry) => (
                <div key={entry.analysis_id} className="animate-in fade-in duration-300">
                  <SkinResultsCard
                    conditions={entry.conditions}
                    recommendations={entry.recommendations}
                    analysisId={entry.analysis_id}
                    createdAt={entry.created_at}
                    compact
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center px-6">
        DermLIP is an AI research model and does not provide medical diagnoses.
        Results are for informational purposes only. Consult a dermatologist for
        professional advice.
      </p>
    </div>
  );
}
