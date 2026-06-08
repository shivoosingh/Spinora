"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Game } from "@/lib/games";
import { createClient } from "@/lib/supabase/client";
import { createGameRequestBySlug } from "@/lib/actions/game-requests";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CompactGameCardProps {
  game: Game;
  variant?: "slider" | "grid";
  className?: string;
}

export function CompactGameCard({ game, variant = "grid", className }: CompactGameCardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (game.upcoming) {
      toast.info(`${game.name} is coming soon!`);
      return;
    }

    setLoading(true);

    const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/dashboard/requests?game=${game.slug}`)}`
      );
      setLoading(false);
      return;
    }

    const result = await createGameRequestBySlug(game.slug);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Request submitted for ${game.name}!`);
      router.push("/dashboard/requests");
    }

    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={`Request account for ${game.name}`}
      className={cn(
        "group relative block rounded-2xl overflow-hidden text-left",
        "border border-white/10 hover:border-orange-400/40 transition-colors",
        "disabled:opacity-70 disabled:cursor-wait",
        variant === "slider"
          ? "game-slider-card w-[128px] sm:w-[148px] aspect-[3/4] shrink-0"
          : "game-card w-full aspect-[3/4]",
        className
      )}
    >
      <Image
        src={game.image}
        alt={game.name}
        fill
        priority={false}
        className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
        sizes={variant === "slider" ? "148px" : "(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"}
      />

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 px-2 pb-2.5 pt-10 text-center bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <p className="text-[11px] sm:text-xs font-bold text-white leading-tight line-clamp-2">
          {game.name}
        </p>
        <p className="text-[9px] sm:text-[10px] text-white/80 mt-0.5 group-hover:text-orange-300 transition-colors">
          {game.upcoming ? "Coming Soon" : "Request Account"}
        </p>
      </div>

      {game.upcoming && (
        <span className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md bg-blue-500/90 text-[9px] font-bold text-white">
          SOON
        </span>
      )}
    </button>
  );
}
