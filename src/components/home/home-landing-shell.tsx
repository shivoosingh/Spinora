"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { HomeSidebar, SIDEBAR_LINKS } from "@/components/home/home-sidebar";
import { DeferredWalletCardLoader } from "@/components/wallet/deferred-wallet-card-loader";
import { AppShell } from "@/components/layout/app-shell";
import { GameCard } from "@/components/home/game-card";
import { PublicReviewsSection } from "@/components/home/public-reviews-section";
import {
  filterGames,
  filterHomeGames,
  GAMES,
  type GameTab,
  type HomeGameTab,
} from "@/lib/games";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { LazyWhenVisible } from "@/components/ui/lazy-when-visible";

function SectionPlaceholder() {
  return <div className="h-32 rounded-xl bg-white/[0.03] animate-pulse" aria-hidden />;
}

const GameSlider = dynamic(
  () => import("@/components/home/game-slider").then((m) => m.GameSlider),
  { loading: () => <SectionPlaceholder /> }
);
const HowItWorks = dynamic(
  () => import("@/components/home/how-it-works").then((m) => m.HowItWorks),
  { loading: () => <SectionPlaceholder /> }
);
const VipPreview = dynamic(
  () => import("@/components/home/vip-preview").then((m) => m.VipPreview),
  { loading: () => <SectionPlaceholder /> }
);
const ReferralPreview = dynamic(
  () => import("@/components/home/referral-preview").then((m) => m.ReferralPreview),
  { loading: () => <SectionPlaceholder /> }
);
const ActivityFeed = dynamic(
  () => import("@/components/home/activity-feed").then((m) => m.ActivityFeed),
  { loading: () => <SectionPlaceholder /> }
);
const FaqSection = dynamic(
  () => import("@/components/home/faq-section").then((m) => m.FaqSection),
  { loading: () => <SectionPlaceholder /> }
);
const ActivityToast = dynamic(
  () => import("@/components/ui/ActivityToast").then((m) => m.ActivityToast),
  { ssr: false, loading: () => null }
);

function DeferredActivityToast() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 8000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;
  return <ActivityToast />;
}

const MAIN_TABS: { id: HomeGameTab; label: string }[] = [
  { id: "trending", label: "Most Trending Games" },
  { id: "all", label: "All" },
  { id: "promotional", label: "Promotional Games" },
];

interface HomeLandingShellProps {
  /** Server-resolved login state — sidebar account links paint immediately. */
  initialLoggedIn?: boolean;
  /** Server-rendered hero for fast LCP on mobile */
  hero?: ReactNode;
  /** Optional CMS-driven sections (FAQs, reviews, guides) from the database */
  cmsSections?: ReactNode;
}

export function HomeLandingShell({
  initialLoggedIn = false,
  hero,
  cmsSections,
}: HomeLandingShellProps) {
  const router = useRouter();
  const [sidebarTab, setSidebarTab] = useState<GameTab>("all");
  const [mainTab, setMainTab] = useState<HomeGameTab>("trending");
  const [search, setSearch] = useState("");
  const [useSidebarFilter, setUseSidebarFilter] = useState(false);
  const gamesRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const displayGames = useSidebarFilter
    ? filterGames(sidebarTab, search)
    : filterHomeGames(mainTab, search);

  function handleSidebarTab(tab: GameTab) {
    setSidebarTab(tab);
    setUseSidebarFilter(true);
    gamesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleMainTab(tab: HomeGameTab) {
    setMainTab(tab);
    setUseSidebarFilter(false);
  }

  function focusSearch() {
    gamesRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => searchRef.current?.focus(), 400);
  }

  function handleHeaderSearch() {
    if (window.location.pathname !== "/") {
      router.push("/#games");
      return;
    }
    focusSearch();
  }

  return (
    <AppShell
      onSearchClick={handleHeaderSearch}
      sidebar={
        <HomeSidebar
          initialLoggedIn={initialLoggedIn}
          activeTab={sidebarTab}
          onTabChange={handleSidebarTab}
          onSearchClick={handleHeaderSearch}
          walletSlot={initialLoggedIn ? <DeferredWalletCardLoader /> : undefined}
        />
      }
    >
      <div className="space-y-8">
        {hero}
        <LazyWhenVisible rootMargin="150px" placeholder={<SectionPlaceholder />}>
          <GameSlider />
        </LazyWhenVisible>

        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {SIDEBAR_LINKS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSidebarTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-colors",
                useSidebarFilter && sidebarTab === id
                  ? "bg-white/10 border-orange-500/50 text-white"
                  : "bg-[#1e1e1e] border-white/5 text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label.replace(" Games", "")}
            </button>
          ))}
        </div>

        <section ref={gamesRef} id="games" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex gap-6 border-b border-white/10 overflow-x-auto scrollbar-hide">
              {MAIN_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleMainTab(t.id)}
                  className={cn(
                    "pb-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                    !useSidebarFilter && mainTab === t.id
                      ? "text-white"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  {t.label}
                  {!useSidebarFilter && mainTab === t.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search games..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#1e1e1e] border-white/10 h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {displayGames.length > 0 ? (
              displayGames.map((game, index) => (
                <GameCard key={game.id} game={game} eager={index < 4} />
              ))
            ) : (
              <p className="col-span-full text-center py-12 text-muted-foreground">
                No games found.
              </p>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {displayGames.length} of {GAMES.length} games
          </p>
        </section>

        <LazyWhenVisible placeholder={<SectionPlaceholder />}>
          <HowItWorks />
        </LazyWhenVisible>
        <LazyWhenVisible placeholder={<SectionPlaceholder />}>
          <VipPreview />
        </LazyWhenVisible>
        <LazyWhenVisible placeholder={<SectionPlaceholder />}>
          <ReferralPreview />
        </LazyWhenVisible>
        <LazyWhenVisible placeholder={<SectionPlaceholder />}>
          <ActivityFeed />
        </LazyWhenVisible>
        <LazyWhenVisible placeholder={<SectionPlaceholder />}>
          {cmsSections ?? (
            <>
              <PublicReviewsSection />
              <FaqSection />
            </>
          )}
        </LazyWhenVisible>
      </div>

      <DeferredActivityToast />
    </AppShell>
  );
}
