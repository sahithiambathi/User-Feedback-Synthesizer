"use client";

import { useState } from "react";
import {
  BrainCircuit,
  Search,
  ArrowRight,
  Database,
  Sparkles,
  Loader2,
  Bookmark,
  Calendar,
  Tag,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface MemorySnippet {
  id?: string;
  text: string;
  type?: string;
  context?: string;
  metadata?: Record<string, any>;
  scores?: {
    final?: number;
    semantic?: number;
    reranker?: number;
    keyword?: number;
  };
}

interface AskResponse {
  status: string;
  answer: string;
  memories_used: MemorySnippet[];
}

export default function AskMemoryPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [answerData, setAnswerData] = useState<AskResponse | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<string>("");
  const [showAllMemories, setShowAllMemories] = useState(false);

  // Suggested demo questions
  const suggestedQuestions = [
    "Did our checkout improvement actually work?",
    "What were the biggest complaints recently?",
    "Have users complained about checkout before?",
    "What did we change about checkout?",
    "Did the coupon change appear to help?",
    "What issues are becoming more common?",
    "What feedback is similar to the navigation complaint?",
  ];

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim() || q.trim().length < 3) return;

    setIsAsking(true);
    setErrorMsg(null);
    setActiveQuestion(q.trim());
    setAnswerData(null);

    try {
      const res = await fetch(`${apiUrl}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Query failed with status ${res.status}`);
      }

      const data: AskResponse = await res.json();
      setAnswerData(data);
    } catch (err: any) {
      console.error("Ask Memory error:", err);
      setErrorMsg(err.message || "Failed to query persistent memory.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ask Persistent Memory
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Query historical feedback context and past product decisions stored in Hindsight persistent memory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Database className="w-3.5 h-3.5" />
            Hindsight Grounded
          </span>
        </div>
      </div>

      {/* Query Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="relative flex items-center"
        >
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about historical feedback trends, past decisions, or feature impact..."
            className="w-full pl-12 pr-32 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={isAsking || question.trim().length < 3}
            className="absolute right-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {isAsking ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Recalling...</span>
              </>
            ) : (
              <>
                <span>Ask Memory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Suggested Demo Question Chips */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Suggested Hackathon Demo Questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(q);
                  handleAsk(q);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading State */}
      {isAsking && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Recalling historical feedback and decisions from Hindsight...
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Groq is synthesizing a response grounded exclusively in your persistent memories.
            </p>
          </div>
        </div>
      )}

      {/* Answer & Memories Display */}
      {answerData && !isAsking && (
        <div className="space-y-8">
          {/* AI Grounded Synthesis */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Grounded Memory Answer</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Model: <code className="font-mono font-semibold">Groq OSS-120B</code></span>
                <span>&middot;</span>
                <span>Evidence: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{answerData.memories_used?.length || 0} memories</strong></span>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Query: &ldquo;{activeQuestion}&rdquo;
            </div>

            <div className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
              {answerData.answer}
            </div>
          </div>

          {/* Memories Used Section (Hindsight Demonstration) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Memories Used as Evidence
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  The AI answer is strictly grounded in these {answerData.memories_used?.length || 0} units recalled from Hindsight bank.
                </p>
              </div>

              {answerData.memories_used?.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllMemories(!showAllMemories)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>{showAllMemories ? "Show Less" : `Show All (${answerData.memories_used.length})`}</span>
                  {showAllMemories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {(!answerData.memories_used || answerData.memories_used.length === 0) ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4">
                No memories were recalled for this question.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {(showAllMemories ? answerData.memories_used : answerData.memories_used.slice(0, 4)).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800">
                          {item.type || "memory"}
                        </span>

                        {item.scores?.semantic && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            Relevance: {(item.scores.semantic * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        &ldquo;{item.text}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400">
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

                      {item.id && (
                        <span className="ml-auto font-mono text-[9px] text-slate-400 truncate max-w-[120px]" title={item.id}>
                          id: {item.id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initial Empty State guidance */}
      {!answerData && !isAsking && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-white/40 dark:bg-slate-900/40 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Ask Questions Grounded in Persistent Memory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Unlike standard AI chatbots with zero memory, this engine recalls historical complaints, product actions taken, and tests whether changes solved past friction.
          </p>
        </div>
      )}
    </div>
  );
}
