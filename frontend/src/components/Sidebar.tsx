"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareQuote,
  Sparkles,
  GitBranch,
  BrainCircuit,
  Layers,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview & key metrics",
  },
  {
    name: "Feedback",
    href: "/feedback",
    icon: MessageSquareQuote,
    description: "Raw & grouped feedback",
  },
  {
    name: "Insights",
    href: "/insights",
    icon: Sparkles,
    description: "Synthesized patterns & pain points",
  },
  {
    name: "Decisions",
    href: "/decisions",
    icon: GitBranch,
    description: "Product actions & trade-offs",
  },
  {
    name: "Ask Memory",
    href: "/ask-memory",
    icon: BrainCircuit,
    description: "Query persistent Hindsight memory",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
            Feedback Synthesizer
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            AI & Memory Engine
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                }`}
              />
              <div className="flex-1">
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System Status / Info Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
            <span>Stack Status</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Ready
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
            <p>Next.js &middot; FastAPI</p>
            <p>Groq &middot; Hindsight</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
