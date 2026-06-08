"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "How do I request a game account on Spinora?",
    a: "Create a free account, go to your dashboard, select a game from our library, and submit a request. Our team processes accounts within 24 hours.",
  },
  {
    q: "What games are available?",
    a: "We support 13+ popular platforms including Fire Kirin, Juwa, Panda Master, Orion Stars, Game Vault, Vegas Sweeps, Ultra Panda, and more.",
  },
  {
    q: "How does the VIP program work?",
    a: "Earn VIP points through game requests and referrals. Unlock Bronze, Silver, Gold, and Platinum tiers with increasing benefits and support priority.",
  },
  {
    q: "Is live chat support available 24/7?",
    a: "Yes! Use the floating chat widget on any page or visit your dashboard messages for real-time support from our team.",
  },
  {
    q: "How do referrals work?",
    a: "Share your unique referral link. When friends sign up, you earn 100 VIP points per referral. Higher VIP tiers earn bigger referral bonuses.",
  },
  {
    q: "How do I cash out or redeem rewards?",
    a: "VIP points and rewards are tracked in your dashboard. Contact support via live chat for redemption details and account assistance.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-muted-foreground">Have any questions? We&apos;ve got answers.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="font-semibold text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-primary flex-shrink-0 transition-transform",
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
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
