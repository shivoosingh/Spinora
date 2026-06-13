import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, DAILY_SPIN_ENABLED } from "@/lib/constants";

/** Server-rendered hero — paints immediately for mobile LCP (no client JS). */
export function HeroStatic() {
  return (
    <section className="relative pb-4" aria-label="Welcome">
      <div className="casino-hero-banner relative w-full overflow-hidden rounded-2xl min-h-[260px] sm:min-h-[300px] lg:min-h-[340px]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a2e] via-[#0d0318] to-[#1a1008]" />
        <div className="absolute inset-0 casino-hero-cave opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-transparent to-amber-900/20" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-6 items-center h-full px-6 sm:px-10 py-10 sm:py-12">
          <div className="text-left">
            <p className="text-white/90 italic text-lg sm:text-xl mb-1 font-light">
              Craving Action?
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white italic leading-tight mb-1">
              {SITE_NAME} games deliver nonstop casino
            </h1>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold italic text-amber-400 mb-6">
              Experience
            </p>
            {DAILY_SPIN_ENABLED ? (
              <Link href="/spin" className="spin-now-btn inline-block">
                SPIN NOW
              </Link>
            ) : (
              <Link
                href="/spin"
                className="inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-6 py-3 text-sm font-bold text-purple-200 hover:bg-purple-500/20 transition-colors"
              >
                Daily Spin — Coming Soon
              </Link>
            )}
          </div>

          <div className="relative flex items-center justify-center min-h-[200px] lg:min-h-[260px]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-amber-500/15 blur-3xl slot-glow" />
            </div>
            <Link
              href="/spin"
              className="relative block w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] lg:w-[200px] lg:h-[200px] shrink-0"
              aria-label={`${SITE_NAME} — Spin now`}
            >
              <Image
                src="/logo.webp"
                alt={SITE_NAME}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 640px) 140px, 200px"
                className="rounded-full object-cover shadow-[0_0_40px_rgba(251,191,36,0.45)]"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
