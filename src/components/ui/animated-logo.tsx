"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

const LETTERS = [
  { char: "S", accent: false },
  { char: "P", accent: false },
  { char: "I", accent: false },
  { char: "N", accent: false },
  { char: "O", accent: true },
  { char: "R", accent: true },
  { char: "A", accent: true },
];

const LETTER_DELAY = 0.1;

interface AnimatedLogoProps {
  showImage?: boolean;
  imageSize?: number;
  textClassName?: string;
  className?: string;
  href?: string;
}

function LogoText({
  textClassName,
  replayKey,
}: {
  textClassName?: string;
  replayKey: number;
}) {
  return (
    <span
      key={replayKey}
      className={cn(
        "inline-flex overflow-hidden font-black tracking-tight select-none",
        textClassName
      )}
      aria-label={SITE_NAME}
    >
      {LETTERS.map((letter, i) => (
        <motion.span
          key={`${replayKey}-${letter.char}-${i}`}
          className={cn(
            "inline-block",
            letter.accent ? "animated-logo-letter-ora" : "text-white"
          )}
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: i * LETTER_DELAY,
            duration: 0.55,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {letter.char}
        </motion.span>
      ))}
    </span>
  );
}

export function AnimatedLogo({
  showImage = true,
  imageSize = 36,
  textClassName,
  className,
  href = "/",
}: AnimatedLogoProps) {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <Link
      href={href}
      className={cn(
        "animated-logo group inline-flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden",
        className
      )}
      onMouseEnter={() => setReplayKey((k) => k + 1)}
    >
      {showImage && (
        <Image
          src="/logo.jpeg"
          alt={SITE_NAME}
          width={imageSize}
          height={imageSize}
          className="rounded-lg shrink-0"
          priority
        />
      )}
      <LogoText textClassName={textClassName} replayKey={replayKey} />
    </Link>
  );
}

export function AnimatedLogoText({
  textClassName,
  className,
}: {
  textClassName?: string;
  className?: string;
}) {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <span
      className={cn("animated-logo inline-flex overflow-hidden", className)}
      onMouseEnter={() => setReplayKey((k) => k + 1)}
    >
      <LogoText textClassName={textClassName} replayKey={replayKey} />
    </span>
  );
}
