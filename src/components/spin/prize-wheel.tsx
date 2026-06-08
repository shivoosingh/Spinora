"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { WHEEL_PRIZES, getSpinRotation } from "@/lib/spin/prizes";
import { spinWheel } from "@/lib/actions/spin";
import { cn } from "@/lib/utils";

interface PrizeWheelProps {
  isLoggedIn: boolean;
  remainingSpins: number;
  nextFreeSpinMs: number | null;
  onSpinComplete: (remaining: number) => void;
}

function formatCountdown(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

const RIM_DOTS = 24;

export function PrizeWheel({
  isLoggedIn,
  remainingSpins,
  nextFreeSpinMs,
  onSpinComplete,
}: PrizeWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [countdown, setCountdown] = useState(nextFreeSpinMs);

  useEffect(() => {
    if (!countdown || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c && c > 1000 ? c - 1000 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const segmentAngle = 360 / WHEEL_PRIZES.length;
  const gradientStops = WHEEL_PRIZES.map((p, i) => {
    const start = i * segmentAngle;
    const end = (i + 1) * segmentAngle;
    return `${p.color} ${start}deg ${end}deg`;
  }).join(", ");

  const handleSpin = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error("Please log in to spin the wheel");
      return;
    }
    if (remainingSpins <= 0) {
      toast.error("No spins left today!");
      return;
    }
    if (spinning) return;

    setSpinning(true);

    const result = await spinWheel();

    if (result.error) {
      toast.error(result.error);
      setSpinning(false);
      return;
    }

    if (result.prize) {
      const newRotation = getSpinRotation(result.prize.index, rotation);
      setRotation(newRotation);

      setTimeout(() => {
        setSpinning(false);
        if (result.prize!.type === "luck") {
          toast.info(`${result.prize!.emoji} ${result.prize!.label} — Try again tomorrow!`);
        } else {
          toast.success(`${result.prize!.emoji} You won ${result.prize!.label}! Added to Bonus Wallet.`);
        }
        onSpinComplete(result.remainingSpins ?? 0);
        if (result.remainingSpins === 0) {
          const tomorrow = new Date();
          tomorrow.setHours(24, 0, 0, 0);
          setCountdown(tomorrow.getTime() - Date.now());
        }
      }, 5000);
    }
  }, [isLoggedIn, remainingSpins, spinning, rotation, onSpinComplete]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="prize-wheel-stage relative flex items-center justify-center">
        <div className="absolute inset-0 prize-wheel-glow rounded-full blur-3xl scale-90" />

        {/* Pointer at 12 o'clock */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 prize-wheel-pointer">
          <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-t-[30px] border-l-transparent border-r-transparent border-t-amber-400" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-amber-200" />
        </div>

        <div className="prize-wheel-outer relative w-[min(92vw,440px)] h-[min(92vw,440px)] sm:w-[520px] sm:h-[520px] lg:w-[580px] lg:h-[580px] rounded-full p-[14px] sm:p-[18px]">
          <div className="absolute inset-0 pointer-events-none z-10">
            {Array.from({ length: RIM_DOTS }).map((_, i) => (
              <span
                key={i}
                className="prize-wheel-dot absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full"
                style={{
                  transform: `rotate(${i * (360 / RIM_DOTS)}deg) translateY(calc(-1 * var(--wheel-rim-radius)))`,
                }}
              />
            ))}
          </div>

          {/* Segment dividers at boundaries */}
          <svg
            className="absolute inset-[14px] sm:inset-[18px] z-20 pointer-events-none rounded-full"
            viewBox="0 0 100 100"
          >
            {WHEEL_PRIZES.map((_, i) => {
              const boundaryAngle = (i * segmentAngle - segmentAngle / 2) * (Math.PI / 180);
              const x2 = 50 + 50 * Math.sin(boundaryAngle);
              const y2 = 50 - 50 * Math.cos(boundaryAngle);
              return (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  stroke="rgba(251, 191, 36, 0.4)"
                  strokeWidth="0.18"
                />
              );
            })}
          </svg>

          <motion.div
            className="relative w-full h-full rounded-full overflow-hidden prize-wheel-inner shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]"
            style={{
              background: `conic-gradient(from -${segmentAngle / 2}deg, ${gradientStops})`,
            }}
            animate={{ rotate: rotation }}
            transition={{ duration: 5, ease: [0.17, 0.67, 0.12, 0.99] }}
          >
            {WHEEL_PRIZES.map((prize, i) => {
              const angle = i * segmentAngle;
              return (
                <div
                  key={prize.id}
                  className="absolute left-1/2 top-1/2 z-[1]"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <div
                    className="absolute flex flex-col items-center justify-center gap-1 text-center"
                    style={{
                      transform: `translate(-50%, calc(-1 * var(--wheel-label-radius))) rotate(-${angle}deg)`,
                      width: "88px",
                    }}
                  >
                    <span className="prize-wheel-emoji text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] leading-none select-none">
                      {prize.emoji}
                    </span>
                    <span
                      className={cn(
                        "font-extrabold text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wide leading-tight",
                        prize.label === "GOOD LUCK"
                          ? "text-[9px] sm:text-[10px]"
                          : "text-[11px] sm:text-xs"
                      )}
                    >
                      {prize.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="prize-wheel-hub w-[120px] h-[88px] sm:w-[140px] sm:h-[100px] lg:w-[156px] lg:h-[110px] rounded-2xl flex flex-col items-center justify-center text-center px-3">
              {remainingSpins > 0 ? (
                <>
                  <span className="text-[10px] sm:text-xs text-amber-200/60 uppercase tracking-wider">
                    Spins left
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 prize-wheel-hub-glow">
                    {remainingSpins}
                  </span>
                </>
              ) : countdown && countdown > 0 ? (
                <>
                  <span className="text-[9px] sm:text-[10px] text-amber-200/60 leading-tight">
                    Next free spin in
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-amber-400 leading-tight mt-1 prize-wheel-hub-glow">
                    {formatCountdown(countdown)}
                  </span>
                </>
              ) : (
                <span className="text-xs sm:text-sm text-amber-400 font-semibold">No spins</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isLoggedIn ? (
        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning || remainingSpins <= 0}
          className={cn(
            "mt-10 prize-wheel-spin-btn",
            (spinning || remainingSpins <= 0) && "opacity-50 cursor-not-allowed"
          )}
        >
          {spinning ? "SPINNING..." : "SPIN NOW"}
        </button>
      ) : (
        <Link href="/login?redirect=/spin" className="mt-10 prize-wheel-spin-btn">
          LOGIN TO SPIN
        </Link>
      )}
    </div>
  );
}
