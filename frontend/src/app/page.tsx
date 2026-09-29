"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquareQuote,
  Sparkles,
  GitBranch,
  BrainCircuit,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Tag,
  Loader2,
  Calendar,
} from "lucide-react";

interface DashboardMetrics {
  total_memories: number;
  total_feedback: number;
  total_decisions: number;
  active_themes_count: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  active_themes: string[];
  recent_feedback: Array<{
    id?: string;
    text: string;
    source?: string;
    date?: string;
    theme?: string;
  }>;
  recent_decisions: Array<{
    id?: string;
    text: string;
    theme?: string;
    reason?: string;
    date?: string;
  }>;
  bank_id: string;
  ai_model: string;
}

interface InsightsPreview {
  summary?: string;
  emerging_issues?: Array<{ issue: string; evidence: string }>;
  improving_issues?: Array<{ issue: string; evidence: string }>;
}

export default function DashboardPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [insightsPreview, setInsightsPreview] = useState<InsightsPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [dashRes, insRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/dashboard`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${apiUrl}/api/insights`).then((r) => (r.ok ? r.json() : null)),
        ]);

        if (dashRes.status === "fulfilled" && dashRes.value) {
          setDashboardData(dashRes.value);
        }
        if (insRes.status === "fulfilled" && insRes.value?.insights) {
          setInsightsPreview(insRes.value.insights);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [apiUrl]);

  return (
    <div className="space-y-8">
      {/* Hero / Overview Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-400/20">
            <Database className="w-3.5 h-3.5" />
            Hindsight Persistent Memory Activated
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            User Feedback Synthesizer
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Continuous customer feedback is retained into persistent Hindsight memory, synthesized by Groq into actionable product insights, and connected to historical decisions to interpret future feedback in context.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/feedback"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <MessageSquareQuote className="w-4 h-4" />
              <span>Ingest Feedback</span>
            </Link>
            <Link
              href="/ask-memory"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Ask Persistent Memory</span>
            </Link>
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Synthesized Insights</span>
            </Link>
          </div>
        </div>

        {/* Stack Specs */}
        <div className="mt-8 pt-6 border-t border-indigo-800/50 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-800/50 flex items-center justify-center text-indigo-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-indigo-300 font-medium uppercase tracking-wider">Hindsight Bank</p>
              <p className="text-xs font-semibold text-white truncate max-w-[140px]">
                {dashboardData?.bank_id || "feedback-synthesizer"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-800/50 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-indigo-300 font-medium uppercase tracking-wider">AI Reasoning</p>
              <p className="text-xs font-semibold text-white">Groq OSS-120B</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-800/50 flex items-center justify-center text-indigo-300">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-indigo-300 font-medium uppercase tracking-wider">Backend API</p>
              <p className="text-xs font-semibold text-white">FastAPI v0.1.0</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-800/50 flex items-center justify-center text-indigo-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-indigo-300 font-medium uppercase tracking-wider">Memory Mode</p>
              <p className="text-xs font-semibold text-emerald-400">Persistent Cloud</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/feedback"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Feedback
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : dashboardData?.metrics?.total_feedback ?? 0}
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium flex items-center gap-1">
            <span>View feedback feed</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        <Link
          href="/decisions"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Product Decisions
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : dashboardData?.metrics?.total_decisions ?? 0}
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium flex items-center gap-1">
            <span>Review decisions</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        <Link
          href="/insights"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Themes
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : dashboardData?.metrics?.active_themes_count ?? 0}
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium flex items-center gap-1">
            <span>See cluster synthesis</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        <Link
          href="/ask-memory"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Memory Units
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : dashboardData?.metrics?.total_memories ?? 0}
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium flex items-center gap-1">
            <span>Query historical bank</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>
      </div>

      {/* Main Content Grid: Recent Feedback vs Recent Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Recent Feedback Feed */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Recent Remembered Feedback
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest customer inputs stored in Hindsight persistent memory
              </p>
            </div>
            <Link
              href="/feedback"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Add / View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            </div>
          ) : (!dashboardData?.recent_feedback || dashboardData.recent_feedback.length === 0) ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No feedback remembered yet. Ingest feedback to start learning.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recent_feedback.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                >
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                    &ldquo;{item.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                    {item.theme && (
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        {item.theme}
                      </span>
                    )}
                    {item.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {item.date.split("T")[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Product Decisions */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Recent Product Decisions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Strategic actions linked to user evidence in persistent memory
              </p>
            </div>
            <Link
              href="/decisions"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Record / View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            </div>
          ) : (!dashboardData?.recent_decisions || dashboardData.recent_decisions.length === 0) ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No decisions recorded yet. Record a decision to track product impact.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recent_decisions.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-semibold">
                      {item.text}
                    </p>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0">
                      decision
                    </span>
                  </div>
                  {item.reason && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-500">Why: </span>
                      {item.reason}
                    </p>
                  )}
                  {item.theme && (
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      Theme: {item.theme}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Synthesis Highlights: Emerging vs Improving */}
      {insightsPreview && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Live Memory Synthesis Highlights
            </h2>
            <Link
              href="/insights"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Full Synthesis Page</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emerging */}
            <div className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Emerging Friction</span>
              </div>
              {(!insightsPreview.emerging_issues || insightsPreview.emerging_issues.length === 0) ? (
                <p className="text-[11px] text-slate-500 italic">No emerging complaints detected.</p>
              ) : (
                <div className="space-y-1.5">
                  {insightsPreview.emerging_issues.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      &bull; {item.issue}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Improving */}
            <div className="p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Improving Issues</span>
              </div>
              {(!insightsPreview.improving_issues || insightsPreview.improving_issues.length === 0) ? (
                <p className="text-[11px] text-slate-500 italic">No resolved issues identified yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {insightsPreview.improving_issues.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      &bull; {item.issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
