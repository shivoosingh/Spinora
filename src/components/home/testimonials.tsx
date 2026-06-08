"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { HomeSection } from "@/components/home/home-section";

const testimonials = [
  {
    name: "Marcus T.",
    tier: "Gold VIP",
    text: "Spinora made getting my game accounts so easy. The live chat support is incredibly fast and helpful.",
    rating: 5,
  },
  {
    name: "Sarah K.",
    tier: "Platinum VIP",
    text: "Best gaming support platform I've used. VIP rewards are generous and the referral program is a game changer.",
    rating: 5,
  },
  {
    name: "James R.",
    tier: "Silver VIP",
    text: "Quick account setup, great selection of games, and the dashboard makes tracking everything simple.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <HomeSection>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">
          What Our <span className="gradient-text">Players Say</span>
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl p-5 bg-[#1e1e1e] border border-white/5"
          >
            <div className="flex gap-1 mb-3">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
            <div>
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-xs text-orange-400">{t.tier}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </HomeSection>
  );
}
