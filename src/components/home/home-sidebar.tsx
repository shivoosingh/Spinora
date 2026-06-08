"use client";

import Link from "next/link";
import {
  LayoutGrid,
  Clock,
  Star,
  TrendingUp,
  Award,
  Search,
  Crown,
  Sparkles,
} from "lucide-react";
import type { GameTab } from "@/lib/games";
import { cn } from "@/lib/utils";

const SIDEBAR_LINKS: { id: GameTab; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Games", icon: LayoutGrid },
  { id: "upcoming", label: "Upcoming Games", icon: Clock },
  { id: "popular", label: "Popular Games", icon: Star },
  { id: "trending", label: "Trending Games", icon: TrendingUp },
  { id: "topRated", label: "Top Rated Games", icon: Award },
];

interface HomeSidebarProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
  onSearchClick: () => void;
  walletSlot?: React.ReactNode;
}

export function HomeSidebar({ activeTab, onTabChange, onSearchClick, walletSlot }: HomeSidebarProps) {
  return (
    <aside className="hidden lg:flex w-64 xl:w-72 flex-col gap-4 shrink-0">
      {walletSlot}

      <button
        type="button"
        onClick={onSearchClick}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 font-bold text-sm hover:from-orange-400 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/20"
      >
        <Search className="h-4 w-4" />
        Search Games
      </button>

      <div className="glass rounded-xl p-4 border border-white/5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Explore Games
        </p>
        <nav className="space-y-1">
          {SIDEBAR_LINKS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                activeTab === id
                  ? "bg-white/10 text-white font-medium"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="rounded-xl p-4 bg-gradient-to-br from-purple-700/80 to-purple-950 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="h-5 w-5 text-amber-400" />
          <h3 className="font-semibold text-sm text-white">Unlock Premium Access</h3>
        </div>
        <p className="text-xs text-purple-200/70 mb-3">
          Experience VIP perks, bigger wins, and exclusive features.
        </p>
        <Link
          href="/login"
          className="block text-center py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors border border-white/10"
        >
          Login & Access All
        </Link>
      </div>

      <div className="rounded-xl p-4 bg-gradient-to-br from-purple-600/60 to-indigo-950 border border-purple-400/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-amber-300" />
          <h3 className="font-semibold text-sm text-white">New Here?</h3>
        </div>
        <p className="text-xs text-purple-200/70 mb-3">Claim your free account & daily spin!</p>
        <Link
          href="/register"
          className="block text-center py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Sign Up
        </Link>
      </div>
    </aside>
  );
}

export { SIDEBAR_LINKS };
