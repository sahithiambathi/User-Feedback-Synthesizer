"use client";

import { useEffect, useState } from "react";
import {
  MessageSquareQuote,
  Send,
  Loader2,
  Sparkles,
  Database,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  User,
  ShieldCheck,
} from "lucide-react";

interface AnalysisData {
  theme: string;
  sentiment: string;
  severity: string;
  summary: string;
}

interface FeedbackMemory {
  id?: string;
  text: string;
  type?: string;
  source?: string;
  date?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  scores?: {
    final?: number;
    semantic?: number;
    reranker?: number;
  };
}

export default function FeedbackPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Form State
  const [feedbackText, setFeedbackText] = useState("");
  const [source, setSource] = useState("customer");
  const [feedbackDate, setFeedbackDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisData | null>(null);
  const [latestMemoryResult, setLatestMemoryResult] = useState<any | null>(null);

  // Feed State
  const [feedbackList, setFeedbackList] = useState<FeedbackMemory[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Demo presets matching the hackathon demo story
  const demoSnippets = [
    { label: "1. Confusing checkout", text: "Checkout is confusing." },
    { label: "2. Coupon missing", text: "I couldn't find the coupon field." },
    { label: "3. Too many steps", text: "There are too many steps in checkout." },
    { label: "4. Checkout easier (Later)", text: "Checkout is much easier now." },
    { label: "5. Found coupon (Later)", text: "Finally found the coupon immediately." },
    { label: "6. Mobile payment (Later)", text: "Mobile payment is still confusing." },
  ];

  // Fetch feedback memories
  const loadFeedback = async (query?: string) => {
    try {
      if (query && query.trim()) {
        setIsSearching(true);
      } else {
        setIsLoadingFeed(true);
      }
      setSubmitError(null);

      const endpoint = query && query.trim()
        ? `${apiUrl}/api/feedback?query=${encodeURIComponent(query.trim())}`
        : `${apiUrl}/api/feedback`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`Failed to fetch feedback (status ${res.status})`);
      }
      const data = await res.json();
      setFeedbackList(data.feedback || []);
    } catch (err: any) {
      console.error("Error loading feedback:", err);
    } finally {
      setIsLoadingFeed(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || feedbackText.trim().length < 3) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setLatestAnalysis(null);
    setLatestMemoryResult(null);

    try {
      const res = await fetch(`${apiUrl}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: feedbackText.trim(),
          source: source,
          date: feedbackDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Submission failed with status ${res.status}`);
      }

      const data = await res.json();
      setLatestAnalysis(data.analysis);
      setLatestMemoryResult(data.memory);
      setFeedbackText("");

      // Refresh list to show newly retained memory
      await loadFeedback();
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "Failed to process feedback with AI and memory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    const s = sentiment?.toLowerCase();
    if (s === "positive") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          Positive
        </span>
      );
    }
    if (s === "negative") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          Negative
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        Neutral
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const sev = severity?.toLowerCase();
    if (sev === "high") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          High Severity
        </span>
      );
    }
    if (sev === "medium") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          Medium Severity
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
        Low Severity
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Feedback Feed & Memory Ingestion
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submit customer feedback &middot; Groq analyzes sentiment & theme &middot; Hindsight retains persistent memory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
            <Database className="w-3.5 h-3.5" />
            Bank: feedback-synthesizer
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Real-time Analysis */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              New Feedback Ingestion
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter customer complaints, interview quotes, or feature requests.
            </p>

            {/* Demo Presets Bar */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Quick Demo Presets:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {demoSnippets.map((snippet, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFeedbackText(snippet.text)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    {snippet.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Feedback Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="e.g. Checkout is confusing, I couldn't find the coupon field."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Source Channel
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="support_ticket">Support Ticket</option>
                    <option value="user_interview">User Interview</option>
                    <option value="survey">Survey</option>
                    <option value="app_review">App Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Received
                  </label>
                  <input
                    type="date"
                    value={feedbackDate}
                    onChange={(e) => setFeedbackDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || feedbackText.trim().length < 3}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Retaining in Hindsight...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit & Remember Feedback</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Real-time AI Analysis Card */}
          {latestAnalysis && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/30 dark:to-slate-900 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Groq AI Analysis & Synthesis</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Retained in Hindsight
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                  Theme: {latestAnalysis.theme}
                </span>
                {getSentimentBadge(latestAnalysis.sentiment)}
                {getSeverityBadge(latestAnalysis.severity)}
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  AI Summary
                </p>
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  {latestAnalysis.summary}
                </p>
              </div>

              {latestMemoryResult && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                  <span>Hindsight Bank: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{latestMemoryResult.bank_id}</code></span>
                  <span>Items Retained: {latestMemoryResult.items_count || 1}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Remembered Feedback Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Remembered Feedback Memories
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stored directly in Hindsight persistent bank &middot; {feedbackList.length} items recalled
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadFeedback(searchQuery)}
                disabled={isLoadingFeed || isSearching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFeed ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Semantic Search Box */}
            <div className="mt-4 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadFeedback(searchQuery);
                    }
                  }}
                  placeholder="Semantic recall query: e.g. 'checkout', 'coupon', 'navigation'..."
                  className="w-full pl-9 pr-24 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => loadFeedback(searchQuery)}
                  className="absolute right-1.5 top-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-[11px] font-semibold text-white transition-colors"
                >
                  Recall
                </button>
              </div>
            </div>

            {/* Feedback List */}
            {isLoadingFeed ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs">Recalling feedback from Hindsight persistent memory...</p>
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6">
                <MessageSquareQuote className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No feedback memories found
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Submit a customer comment using the form on the left or click one of the quick demo presets.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {feedbackList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-2.5"
                  >
                    <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-snug">
                      {item.text}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                      {item.metadata?.theme && (
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                          <Tag className="w-3 h-3" />
                          {item.metadata.theme}
                        </span>
                      )}

                      {item.source && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.source}
                        </span>
                      )}

                      {item.date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.date.split("T")[0]}
                        </span>
                      )}

                      <span className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                        {item.type || "feedback"}
                      </span>
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
