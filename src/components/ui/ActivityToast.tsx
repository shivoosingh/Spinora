"use client";

import { useState, useEffect } from "react";

const ACTIVITIES = [
  { emoji: "🎮", user: "Alex M.", action: "just requested Fire Kirin account" },
  { emoji: "🏆", user: "Diana L.", action: "reached Gold VIP" },
  { emoji: "💰", user: "Chris P.", action: "earned +100 referral pts" },
  { emoji: "🎰", user: "Emma W.", action: "set up Juwa account" },
  { emoji: "💎", user: "Ryan B.", action: "upgraded to Platinum VIP" },
  { emoji: "🎁", user: "Marco T.", action: "claimed $50 bonus" },
];

export function ActivityToast() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState<"in" | "out">("in");

  useEffect(() => {
    const cycle = setInterval(() => {
      setAnimating("out");
      setTimeout(() => {
        setIndex((i) => (i + 1) % ACTIVITIES.length);
        setAnimating("in");
        setVisible(true);
      }, 400);
    }, 4000);

    return () => clearInterval(cycle);
  }, []);

  if (!visible) return null;

  const activity = ACTIVITIES[index];

  return (
    <div
      className={`activity-toast fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-500/30 shadow-xl max-w-xs sm:max-w-sm ${
        animating === "in" ? "toast-animate-in" : "toast-animate-out"
      }`}
      style={{ background: "rgba(13,3,24,0.92)", backdropFilter: "blur(12px)" }}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center text-lg">
        {activity.emoji}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white truncate">{activity.user}</p>
        <p className="text-xs text-gray-400 truncate">{activity.action}</p>
      </div>
    </div>
  );
}
