"use client";

import { useEffect, useState } from "react";
import {
  GitBranch,
  Send,
  Loader2,
  Database,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  FileText,
  BookmarkCheck,
} from "lucide-react";

interface DecisionItem {
  id?: string;
  text: string;
  type?: string;
  theme?: string;
  reason?: string;
  date?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export default function DecisionsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Form State
  const [decisionText, setDecisionText] = useState("");
  const [theme, setTheme] = useState("");
  const [reason, setReason] = useState("");
  const [decisionDate, setDecisionDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<any | null>(null);

  // Feed State
  const [decisionsList, setDecisionsList] = useState<DecisionItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDecisions = async (query?: string) => {
    try {
      setIsLoadingFeed(true);
      const endpoint = query && query.trim()
        ? `${apiUrl}/api/decisions?query=${encodeURIComponent(query.trim())}`
        : `${apiUrl}/api/decisions`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`Failed to load decisions (status ${res.status})`);
      }
      const data = await res.json();
      setDecisionsList(data.decisions || []);
    } catch (err: any) {
      console.error("Error loading decisions:", err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  const handleApplyDemoPreset = () => {
    setDecisionText("Move the coupon field to the checkout header.");
    setTheme("Checkout friction");
    setReason("Users repeatedly reported difficulty finding coupons.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionText.trim() || decisionText.trim().length < 3) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setLastSaved(null);

    try {
      const res = await fetch(`${apiUrl}/api/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decisionText.trim(),
          theme: theme.trim(),
          reason: reason.trim(),
          date: decisionDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to record decision (status ${res.status})`);
      }

      const data = await res.json();
      setLastSaved(data);
      setDecisionText("");
      setTheme("");
      setReason("");

      // Refresh list from Hindsight
      await loadDecisions();
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "Failed to record decision into persistent memory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Product Decisions & Actions
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record roadmap changes and solutions &middot; Stored into Hindsight so future feedback is analyzed in context.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
            <Database className="w-3.5 h-3.5" />
            Tag: <code className="font-mono font-bold">decision</code>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Decision Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Record Product Decision
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Commit a product action to persistent memory to close the feedback loop.
            </p>

            {/* Quick Demo Preset Button */}
            <div className="mb-4 p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                  Demo Story Preset
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Fill with: &ldquo;Move coupon field to header&rdquo;
                </p>
              </div>
              <button
                type="button"
                onClick={handleApplyDemoPreset}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                Use Preset
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Decision / Action Taken *
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  placeholder="e.g. Move the coupon field to the checkout header."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Related Theme / Area
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Checkout friction"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rationale / Problem Addressed
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Users repeatedly reported difficulty finding coupons."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={decisionDate}
                  onChange={(e) => setDecisionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || decisionText.trim().length < 3}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Retaining Decision in Hindsight...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Save Decision into Memory</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Last Saved Confirmation */}
          {lastSaved && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Decision Successfully Retained</span>
              </div>
              <p className="text-xs font-medium">
                &ldquo;{lastSaved.decision?.decision}&rdquo;
              </p>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center justify-between pt-1 border-t border-emerald-200/60 dark:border-emerald-900/50">
                <span>Bank: <code className="font-mono font-bold">feedback-synthesizer</code></span>
                <span>Tag: <code className="font-mono font-bold">decision</code></span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Remembered Decisions Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Remembered Product Decisions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stored in Hindsight bank &middot; {decisionsList.length} decisions recalled
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadDecisions(searchQuery)}
                disabled={isLoadingFeed}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFeed ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="mt-4 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadDecisions(searchQuery);
                    }
                  }}
                  placeholder="Search decisions: e.g. 'coupon', 'checkout', 'drawer'..."
                  className="w-full pl-9 pr-24 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => loadDecisions(searchQuery)}
                  className="absolute right-1.5 top-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-[11px] font-semibold text-white transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Decisions List */}
            {isLoadingFeed ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs">Recalling decisions from Hindsight memory...</p>
              </div>
            ) : decisionsList.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6">
                <GitBranch className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No decisions recorded yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Record a product change using the form or apply the demo preset above.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
                {decisionsList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-900 dark:text-slate-100 font-semibold leading-snug">
                        {item.text}
                      </p>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                        decision
                      </span>
                    </div>

                    {item.metadata?.reason && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">Rationale: </span>
                        {item.metadata.reason}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {item.metadata?.theme && (
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                          <Tag className="w-3 h-3" />
                          {item.metadata.theme}
                        </span>
                      )}

                      {item.metadata?.date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.metadata.date}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
