"use client";

import { useRef, useState } from "react";
import { GAMES } from "@/lib/games";
import { CompactGameCard } from "@/components/home/compact-game-card";
import { cn } from "@/lib/utils";

export function GameSlider() {
  const items = [...GAMES, ...GAMES];
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pauseBriefly() {
    setPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setPaused(false), 2500);
  }

  return (
    <section
      className={cn("game-slider-wrap py-1", paused && "is-paused")}
      aria-label="Featured games slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={pauseBriefly}
    >
      <div className="overflow-hidden">
        <div className="game-slider-track flex gap-3 sm:gap-4">
          {items.map((game, i) => (
            <CompactGameCard key={`${game.id}-${i}`} game={game} variant="slider" />
          ))}
        </div>
      </div>
    </section>
  );
}
