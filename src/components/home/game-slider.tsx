"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAMES } from "@/lib/games";
import { CompactGameCard } from "@/components/home/compact-game-card";
import { cn } from "@/lib/utils";

export function GameSlider() {
  const items = [...GAMES, ...GAMES];
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const dragMoved = useRef(0);
  const [paused, setPaused] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);

  const loopScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (half <= 0) return;
    if (el.scrollLeft >= half) {
      el.scrollLeft -= half;
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft += half;
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || paused) return;

    let raf = 0;
    const tick = () => {
      el.scrollLeft += 0.6;
      loopScroll();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [paused, loopScroll]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;

    isDragging.current = true;
    dragMoved.current = 0;
    dragStartX.current = e.clientX;
    dragScrollLeft.current = el.scrollLeft;
    setPaused(true);
    setIsGrabbing(true);
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current || !scrollRef.current) return;
    const dx = e.clientX - dragStartX.current;
    dragMoved.current = Math.max(dragMoved.current, Math.abs(dx));
    scrollRef.current.scrollLeft = dragScrollLeft.current - dx;
    loopScroll();
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current || !scrollRef.current) return;
    isDragging.current = false;
    setIsGrabbing(false);
    scrollRef.current.releasePointerCapture(e.pointerId);
    loopScroll();
    window.setTimeout(() => setPaused(false), 1500);
  }

  function blockClickIfDragged(e: React.MouseEvent) {
    if (dragMoved.current > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return (
    <section className="game-slider-wrap py-1" aria-label="Featured games slider">
      <div
        ref={scrollRef}
        className={cn(
          "game-slider-scroll flex gap-3 sm:gap-4 overflow-x-auto select-none",
          isGrabbing ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          if (!isDragging.current) setPaused(false);
        }}
        onClickCapture={blockClickIfDragged}
      >
        {items.map((game, i) => (
          <CompactGameCard key={`${game.id}-${i}`} game={game} variant="slider" />
        ))}
      </div>
    </section>
  );
}
