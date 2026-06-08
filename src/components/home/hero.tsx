"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SITE_NAME } from "@/lib/constants";

const ROTATING_WORDS = ["Experience", "Rewards", "Thrills", "Action", "Wins"];

const COINS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: 55 + Math.random() * 40,
  delay: Math.random() * 3,
  duration: 2.5 + Math.random() * 2,
  size: 6 + Math.random() * 8,
}));

function SlotReels() {
  return (
    <div className="slot-machine relative">
      <div className="absolute -inset-8 rounded-full bg-amber-500/20 blur-3xl slot-glow" />
      <div className="absolute inset-0 slot-light-beam" />

      {/* Playing cards behind */}
      <div className="absolute -left-8 top-4 flex -space-x-6 opacity-80 cards-float">
        {["♠", "♥", "♣"].map((suit, i) => (
          <div
            key={suit}
            className="w-14 h-20 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 border border-amber-500/30 flex flex-col items-center justify-center shadow-xl"
            style={{ transform: `rotate(${-15 + i * 12}deg)`, zIndex: i }}
          >
            <span className="text-amber-400 text-xs font-bold">A</span>
            <span className="text-amber-300 text-lg">{suit}</span>
          </div>
        ))}
      </div>

      {/* Slot body */}
      <div className="relative z-10 flex gap-1 p-3 rounded-2xl bg-gradient-to-b from-amber-600/40 to-amber-900/60 border-2 border-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.4)]">
        {["7", "7", "7"].map((num, i) => (
          <div
            key={i}
            className="slot-reel w-14 h-16 sm:w-16 sm:h-20 rounded-lg bg-gradient-to-b from-gray-900 to-black border border-amber-500/40 overflow-hidden flex items-center justify-center"
          >
            <span
              className="slot-digit text-3xl sm:text-4xl font-black text-amber-400"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {num}
            </span>
          </div>
        ))}
      </div>

      {/* Golden rings */}
      <div className="absolute -inset-4 border-2 border-amber-400/20 rounded-full slot-ring" />
      <div className="absolute -inset-8 border border-amber-400/10 rounded-full slot-ring-reverse" />
    </div>
  );
}

export function Hero() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative pb-4">
      <div className="casino-hero-banner relative w-full overflow-hidden rounded-2xl min-h-[260px] sm:min-h-[300px] lg:min-h-[340px]">
        {/* Cave / dark purple background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a2e] via-[#0d0318] to-[#1a1008]" />
        <div className="absolute inset-0 casino-hero-cave opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-transparent to-amber-900/20" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-6 items-center h-full px-6 sm:px-10 py-10 sm:py-12">
          {/* Left — text + CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-left"
          >
            <p className="text-white/90 italic text-lg sm:text-xl mb-1 font-light">
              Craving Action?
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white italic leading-tight mb-1">
              {SITE_NAME} games deliver nonstop casino
            </h1>
            <div className="h-10 sm:h-12 overflow-hidden mb-6">
              <AnimatePresence mode="wait">
                <motion.span
                  key={ROTATING_WORDS[wordIndex]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="block text-2xl sm:text-3xl lg:text-4xl font-bold italic text-amber-400"
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>

            <Link href="/spin" className="spin-now-btn inline-block">
              SPIN NOW
            </Link>
          </motion.div>

          {/* Right — slot + coins */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative flex items-center justify-center min-h-[200px] lg:min-h-[260px]"
          >
            <SlotReels />

            {/* Falling coins */}
            {COINS.map((coin) => (
              <span
                key={coin.id}
                className="falling-coin absolute rounded-full bg-gradient-to-br from-amber-300 to-amber-600 border border-amber-200/50 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                style={{
                  left: `${coin.left}%`,
                  width: coin.size,
                  height: coin.size,
                  animationDelay: `${coin.delay}s`,
                  animationDuration: `${coin.duration}s`,
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
