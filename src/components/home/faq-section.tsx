"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { HomeSection } from "@/components/home/home-section";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "How do I request a game account on Spinora?",
    a: "Create a free account, browse games on the homepage, click any game card to submit a request. Our team processes accounts within 24 hours.",
  },
  {
    q: "What games are available?",
    a: "We support 12+ popular platforms including Fire Kirin, Juwa, Panda Master, Orion Stars, Game Vault, Vegas Sweeps, and more.",
  },
  {
    q: "How does the VIP program work?",
    a: "Earn VIP points through game requests and referrals. Unlock Bronze, Silver, Gold, and Platinum tiers with increasing benefits.",
  },
  {
    q: "Is live chat support available 24/7?",
    a: "Yes! Use the floating chat widget on any page or visit Messages in your account for real-time support.",
  },
  {
    q: "How do referrals work?",
    a: "Share your unique referral link. When friends sign up, you earn 10 VIP points per referral.",
  },
  {
    q: "How do I cash out or redeem rewards?",
    a: "VIP points and rewards are tracked in your dashboard. Contact support via live chat for redemption details.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <HomeSection tinted>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-muted-foreground text-sm">Have any questions? We&apos;ve got answers.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-[#1e1e1e] border border-white/5">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-orange-400 flex-shrink-0 transition-transform",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="px-4 sm:px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </HomeSection>
  );
}
