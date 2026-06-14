"use client";

import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/lib/games";
import { useInView } from "@/lib/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface CompactGameCardProps {
  game: Game;
  variant?: "slider" | "grid";
  className?: string;
  /** First visible row — load image immediately (no wait for scroll) */
  eager?: boolean;
}

export function CompactGameCard({
  game,
  variant = "grid",
  className,
  eager = false,
}: CompactGameCardProps) {
  const { ref, inView } = useInView("800px", eager);
  const showImage = eager || inView;
  const href = `/games/${game.slug}`;

  const inner = (
    <>
      {showImage ? (
        <Image
          src={game.image}
          alt={game.name}
          fill
          priority={eager}
          loading={eager ? "eager" : "lazy"}
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes={
            variant === "slider"
              ? "148px"
              : "(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
          }
        />
      ) : (
        <div className="absolute inset-0 bg-white/[0.06] animate-pulse" aria-hidden />
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 px-2 pb-2.5 pt-10 text-center bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <p className="text-[11px] sm:text-xs font-bold text-white leading-tight line-clamp-2">
          {game.name}
        </p>
        <p className="text-[9px] sm:text-[10px] text-white/80 mt-0.5 group-hover:text-orange-300 transition-colors">
          {game.upcoming ? "Coming Soon" : "Play Now"}
        </p>
      </div>

      {game.upcoming && (
        <span className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md bg-blue-500/90 text-[9px] font-bold text-white">
          SOON
        </span>
      )}
    </>
  );

  const classNames = cn(
    "group relative block rounded-2xl overflow-hidden text-left",
    "border border-white/10 hover:border-orange-400/40 transition-colors",
    variant === "slider"
      ? "game-slider-card w-[128px] sm:w-[148px] aspect-[3/4] shrink-0"
      : "game-card w-full aspect-[3/4]",
    className
  );

  return (
    <div ref={ref} className={classNames}>
      <Link
        href={href}
        className="absolute inset-0 z-20"
        aria-label={game.upcoming ? `${game.name} — coming soon` : `View ${game.name}`}
        onPointerDown={variant === "slider" ? (e) => e.stopPropagation() : undefined}
        draggable={false}
      >
        <span className="sr-only">{game.name}</span>
      </Link>
      {inner}
    </div>
  );
}
