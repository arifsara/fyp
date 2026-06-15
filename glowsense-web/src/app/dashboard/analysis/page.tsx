"use client";
import { API_URL } from "@/lib/api";
import Image from "next/image";

import { useState, useEffect } from "react";
import { ScanFace, History, ChevronDown, ChevronUp, AlertTriangle, Wifi, CheckCircle } from "lucide-react";
import SkinAnalysisUploader from "@/components/skin/SkinAnalysisUploader";
import SkinResultsCard from "@/components/skin/SkinResultsCard";

interface Recommendation {
  morning_routine: string[];
  night_routine: string[];
  products: (string | { active_ingredient: string; brand_product: string })[];
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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? API_URL;

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
    <div className="relative min-h-[calc(100vh-80px)] font-sans">
      {/* Background Override for Analysis Page */}
      <div className="fixed inset-0 z-[-1] bg-background">
        <Image 
          src="/Kylie Skin products.jpg" 
          alt="Analysis Background" 
          fill 
          priority 
          className="object-cover object-center opacity-15"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      <div className="max-w-4xl mx-auto px-6 section-padding space-y-8 md:space-y-10">

        {/* Page Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-section font-bold text-foreground flex items-center gap-3">
              <ScanFace className="h-8 w-8 text-primary" />
              AI Skin Analysis
            </h1>
            <p className="text-body-fluid text-secondary-foreground mt-2 font-light">
              Upload a close-up photo to detect your top skin concerns using clinical-grade AI.
            </p>
          </div>

          {/* ML Service Status Badge */}
          <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full glass-card border border-primary/20 shadow-sm">
            {mlStatus === "ready" && (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">AI Model Ready</span>
              </>
            )}
            {mlStatus === "down" && (
              <>
                <Wifi className="h-4 w-4 text-rose-500" />
                <span className="text-rose-500 font-semibold">ML Service Offline</span>
              </>
            )}
            {mlStatus === "unknown" && (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-muted-foreground font-medium">Checking…</span>
              </>
            )}
          </div>
        </div>

        {/* ML Service Warning */}
        {mlStatus === "down" && (
          <div className="flex items-start gap-3 p-5 rounded-2xl border border-rose-200 bg-rose-50 text-sm text-rose-700 shadow-sm">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-base">DermLIP ML service is not running.</p>
              <p className="text-sm mt-1 text-rose-600 font-medium">
                Start it with: <code className="bg-rose-100/80 px-1.5 py-0.5 rounded text-rose-800">python c:\FYP\Derm1M\skin_api.py</code>
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-3 p-5 rounded-2xl border border-amber-200 bg-amber-50/80 text-sm text-amber-700 shadow-sm">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <span className="font-medium text-base">{error}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="glass-card overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-2 w-full bg-gradient-to-r from-primary via-primary-dark to-primary" />

          <div className="p-8 space-y-8">
            {/* How it works strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {[
                { step: "1", label: "Upload Photo", desc: "Clear, well-lit skin photo" },
                { step: "2", label: "AI Analysis", desc: "DermLIP scans your skin" },
                { step: "3", label: "Get Results", desc: "Top conditions + tips" },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl bg-white/40 p-4 space-y-2 border border-primary/10 transition-transform hover:-translate-y-1">
                  <div className="h-8 w-8 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center mx-auto shadow-inner">
                    {s.step}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="text-xs text-secondary-foreground font-medium">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Uploader */}
            <div className="pt-2">
              <SkinAnalysisUploader onResult={handleResult} onError={handleError} />
            </div>
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
        <div className="glass-card overflow-hidden transition-all duration-300">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="w-full flex items-center justify-between px-8 py-5 hover:bg-white/40 transition-colors"
            id="skin-history-toggle"
          >
            <div className="flex items-center gap-3 text-base font-semibold text-foreground">
              <History className="h-5 w-5 text-primary" />
              Past Analyses
            </div>
            {historyOpen ? (
              <ChevronUp className="h-5 w-5 text-secondary-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-secondary-foreground" />
            )}
          </button>

          {historyOpen && (
            <div className="border-t border-primary/10 px-8 py-6 space-y-5 bg-white/20">
              {historyLoading && (
                <div className="flex items-center gap-2 text-sm text-secondary-foreground py-4 justify-center font-medium">
                  <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Loading history…
                </div>
              )}

              {!historyLoading && history.length === 0 && (
                <p className="text-sm text-secondary-foreground text-center py-4 font-medium bg-white/40 rounded-xl p-4">
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
        <p className="text-xs text-secondary-foreground text-center px-6 font-medium bg-white/50 py-3 rounded-full border border-primary/10 inline-block w-full">
          DermLIP is an AI research model and does not provide medical diagnoses.
          Results are for informational purposes only. Consult a dermatologist for
          professional advice.
        </p>
      </div>
    </div>
  );
}
