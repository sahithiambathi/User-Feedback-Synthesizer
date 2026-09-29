"use client";

import { useEffect, useState } from "react";
import { Server, Database, Sparkles, AlertCircle } from "lucide-react";

interface SystemStatus {
  groq_configured: boolean;
  groq_model: string;
  hindsight_configured: boolean;
  hindsight_bank_id: string;
}

export default function Header() {
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [backendVersion, setBackendVersion] = useState<string>("");
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    // Check health
    fetch(`${apiUrl}/api/health`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Backend not responding");
      })
      .then((data) => {
        setBackendStatus("connected");
        setBackendVersion(data.version || "0.1.0");
      })
      .catch(() => {
        setBackendStatus("disconnected");
      });

    // Check system status
    fetch(`${apiUrl}/api/status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSysStatus(data);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
          User Feedback Synthesizer
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
          Persistent feedback memory &middot; Groq intelligence &middot; Contextual product decisions
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs bg-slate-50/60 dark:bg-slate-800/40">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-400 font-medium hidden md:inline">API:</span>
          {backendStatus === "checking" && (
            <span className="text-amber-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Checking
            </span>
          )}
          {backendStatus === "connected" && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Online {backendVersion ? `v${backendVersion}` : ""}
            </span>
          )}
          {backendStatus === "disconnected" && (
            <span className="text-rose-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-500" />
              Offline
            </span>
          )}
        </div>

        {/* Hindsight Bank Badge */}
        {sysStatus?.hindsight_configured && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
            <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Bank: <code className="font-mono text-[11px] font-semibold">{sysStatus.hindsight_bank_id}</code></span>
          </div>
        )}

        {/* Groq Model Badge */}
        {sysStatus?.groq_configured && (
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="font-mono text-[11px] font-semibold">Groq OSS-120B</span>
          </div>
        )}
      </div>
    </header>
  );
}
