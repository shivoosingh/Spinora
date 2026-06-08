"use client";

import { GAMES } from "@/lib/games";
import { CompactGameCard } from "@/components/home/compact-game-card";

export function GameSlider() {
  const items = [...GAMES, ...GAMES];

  return (
    <section className="game-slider-wrap overflow-hidden py-1" aria-label="Featured games slider">
      <div className="game-slider-track flex gap-3 sm:gap-4 w-max">
        {items.map((game, i) => (
          <CompactGameCard key={`${game.id}-${i}`} game={game} variant="slider" />
        ))}
      </div>
    </section>
  );
}
