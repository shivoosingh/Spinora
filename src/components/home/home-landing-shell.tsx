"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { GameSlider } from "@/components/home/game-slider";
import { HomeSidebar, SIDEBAR_LINKS } from "@/components/home/home-sidebar";
import { WalletCardLoader } from "@/components/wallet/wallet-card-loader";
import { HomeHeader } from "@/components/home/home-header";
import { GameCard } from "@/components/home/game-card";
import { MarqueeTicker } from "@/components/ui/MarqueeTicker";
import { HowItWorks } from "@/components/home/how-it-works";
import { VipPreview } from "@/components/home/vip-preview";
import { ReferralPreview } from "@/components/home/referral-preview";
import { ActivityFeed } from "@/components/home/activity-feed";
import { Testimonials } from "@/components/home/testimonials";
import { FaqSection } from "@/components/home/faq-section";
import { Footer } from "@/components/layout/footer";
import { ActivityToast } from "@/components/ui/ActivityToast";
import { CookieConsent } from "@/components/ui/cookie-consent";
import {
  filterGames,
  filterHomeGames,
  GAMES,
  type GameTab,
  type HomeGameTab,
} from "@/lib/games";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAIN_TABS: { id: HomeGameTab; label: string }[] = [
  { id: "trending", label: "Most Trending Games" },
  { id: "all", label: "All" },
  { id: "promotional", label: "Promotional Games" },
];

export function HomeLandingShell() {
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

  return (
    <div className="min-h-screen bg-[#121212] text-foreground">
      <HomeHeader onSearchClick={focusSearch} />
      <MarqueeTicker />

      <div className="flex max-w-[1600px] mx-auto gap-6 px-4 sm:px-6 py-6">
        <HomeSidebar
          activeTab={sidebarTab}
          onTabChange={handleSidebarTab}
          onSearchClick={focusSearch}
          walletSlot={<WalletCardLoader />}
        />

        <main className="flex-1 min-w-0 space-y-8">
          <Hero />

          <GameSlider />

          {/* Mobile explore nav */}
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

          {/* Game section — Casinoze style */}
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
                      <motion.span
                        layoutId="game-tab-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                      />
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

            <AnimatePresence mode="wait">
              <motion.div
                key={`${useSidebarFilter ? sidebarTab : mainTab}-${search}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
              >
                {displayGames.length > 0 ? (
                  displayGames.map((game) => <GameCard key={game.id} game={game} />)
                ) : (
                  <p className="col-span-full text-center py-12 text-muted-foreground">
                    No games found.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            <p className="text-center text-xs text-muted-foreground mt-6">
              {displayGames.length} of {GAMES.length} games
            </p>
          </section>

          <HowItWorks />
          <VipPreview />
          <ReferralPreview />
          <ActivityFeed />
          <Testimonials />
          <FaqSection />
        </main>
      </div>

      <Footer fullWidth />

      <ActivityToast />
      <CookieConsent />
    </div>
  );
}
