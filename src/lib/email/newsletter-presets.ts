import { SITE_URL } from "@/lib/constants";

import type { SimpleNewsletterInput } from "@/lib/email/newsletter-form";

export type NewsletterPreset = {
  id: string;
  label: string;
  description: string;
  values: Omit<SimpleNewsletterInput, "segment" | "name">;
};

const PROMO = `${SITE_URL}/promotions`;
const DEPOSIT = `${SITE_URL}/dashboard/deposit`;
const SPIN = `${SITE_URL}/spin`;
const VIP = `${SITE_URL}/dashboard/vip`;
const REFERRALS = `${SITE_URL}/dashboard/referrals`;
const LEADERBOARD = `${SITE_URL}/leaderboard`;
const GAMES = `${SITE_URL}/games/juwa`;

/** Ready-made promo templates — pick one, tweak if needed, send. */
export const NEWSLETTER_PRESETS: NewsletterPreset[] = [
  {
    id: "welcome-50",
    label: "50% welcome bonus",
    description: "First deposit offer for new players",
    values: {
      template_id: "welcome-50",
      subject: "Your 50% welcome bonus is ready at Spinora",
      eyebrow: "New player offer",
      heading: "Get 50% extra on your first deposit",
      subhead: "Every game. No code. Credited automatically.",
      message:
        "New Spinora players get 50% extra credits on their first deposit — Fire Kirin, Juwa, Game Vault and all 12 games included.\n\nFund your wallet, load any game, and play in minutes.",
      cta_label: "Claim welcome bonus",
      cta_href: DEPOSIT,
      stat1_value: "50%",
      stat1_label: "First deposit",
      stat2_value: "12",
      stat2_label: "Games",
      stat3_value: "2 min",
      stat3_label: "Avg credit",
    },
  },
  {
    id: "reload-weekend",
    label: "Weekend reload bonus",
    description: "10–15% reload based on VIP tier",
    values: {
      template_id: "reload-weekend",
      subject: "Weekend reload bonus — extra credits on every deposit",
      eyebrow: "This weekend only",
      heading: "Stack extra credits this weekend",
      subhead: "Reload bonuses scale with your VIP tier — up to 15% at Elite.",
      message:
        "Every deposit this weekend earns a reload bonus on top of your usual credits. Higher VIP tiers get a bigger percentage automatically — nothing to claim manually.\n\nLoad your wallet and jump back into your favorite fish table or slot.",
      cta_label: "Deposit now",
      cta_href: DEPOSIT,
      stat1_value: "10–15%",
      stat1_label: "Reload bonus",
      stat2_value: "VIP",
      stat2_label: "Tier based",
      stat3_value: "Instant",
      stat3_label: "Wallet credit",
    },
  },
  {
    id: "happy-hour",
    label: "Happy hour +20%",
    description: "Limited-time deposit boost",
    values: {
      template_id: "happy-hour",
      subject: "Happy hour: +20% extra on deposits right now",
      eyebrow: "Limited time",
      heading: "Happy hour is live",
      subhead: "+20% extra on every deposit for the next few hours.",
      message:
        "For a short window, every Spinora deposit gets an extra 20% on top of your normal bonus. Load credits now and hit Fire Kirin, Juwa, Orion Stars or any game in the lineup.",
      cta_label: "Grab happy hour bonus",
      cta_href: DEPOSIT,
      stat1_value: "+20%",
      stat1_label: "Extra today",
      stat2_value: "Ltd",
      stat2_label: "Time only",
      stat3_value: "12",
      stat3_label: "Games",
    },
  },
  {
    id: "daily-spin",
    label: "Free daily spin",
    description: "Remind players to claim their spin",
    values: {
      template_id: "daily-spin",
      subject: "Your free daily spin is waiting",
      eyebrow: "Daily reward",
      heading: "Spin the wheel — it's free today",
      subhead: "One spin every 24 hours. Resets at midnight.",
      message:
        "Open your Spinora dashboard for today's free spin. Land bonus coins, XP boosts and more — it costs nothing and resets daily.\n\nDon't break your streak: log in and spin before the day ends.",
      cta_label: "Spin now",
      cta_href: SPIN,
      stat1_value: "Free",
      stat1_label: "Daily spin",
      stat2_value: "24h",
      stat2_label: "Reset",
      stat3_value: "Bonus",
      stat3_label: "Coins & XP",
    },
  },
  {
    id: "refer-friends",
    label: "Refer & earn",
    description: "Referral program push",
    values: {
      template_id: "refer-friends",
      subject: "Invite friends — you both earn bonus credits",
      eyebrow: "Referral program",
      heading: "Share Spinora, earn together",
      subhead: "Unlimited invites. Automatic credit when they deposit.",
      message:
        "Share your personal referral link. When a friend signs up and makes their first deposit, you both get bonus credits — no codes and no cap on how many friends you invite.\n\nYour link is ready in the dashboard.",
      cta_label: "Get my referral link",
      cta_href: REFERRALS,
      stat1_value: "Both",
      stat1_label: "Earn bonus",
      stat2_value: "∞",
      stat2_label: "Invites",
      stat3_value: "Auto",
      stat3_label: "Credit",
    },
  },
  {
    id: "vip-climb",
    label: "VIP tier boost",
    description: "Encourage VIP progression",
    values: {
      template_id: "vip-climb",
      subject: "You're closer to your next VIP tier",
      eyebrow: "VIP rewards",
      heading: "Climb VIP — multiply every reward",
      subhead: "Silver through Elite. Up to 2× coins at the top tier.",
      message:
        "Every claim and deposit earns XP toward your next VIP tier. Higher tiers multiply coin rewards and unlock bigger reload bonuses plus priority support.\n\nCheck your progress and see what's left to unlock.",
      cta_label: "View VIP progress",
      cta_href: VIP,
      stat1_value: "5",
      stat1_label: "VIP tiers",
      stat2_value: "2×",
      stat2_label: "Elite mult",
      stat3_value: "24/7",
      stat3_label: "Support",
    },
  },
  {
    id: "trending-juwa",
    label: "Juwa trending",
    description: "Game spotlight — Juwa",
    values: {
      template_id: "trending-juwa",
      subject: "Juwa is trending on Spinora right now",
      eyebrow: "Player favorite",
      heading: "Juwa is on fire this week",
      subhead: "Fast fish table action with chain combos and boss battles.",
      message:
        "Juwa is one of the most-played games on Spinora right now. Create your account in one click, load credits from your wallet, and jump in — plus your reload bonus applies on every deposit.",
      cta_label: "Play Juwa now",
      cta_href: GAMES,
      stat1_value: "Hot",
      stat1_label: "This week",
      stat2_value: "1-click",
      stat2_label: "Account",
      stat3_value: "Fish",
      stat3_label: "Table",
    },
  },
  {
    id: "leaderboard",
    label: "Leaderboard prizes",
    description: "Weekly competition push",
    values: {
      template_id: "leaderboard",
      subject: "Weekly leaderboard prizes are live",
      eyebrow: "Weekly competition",
      heading: "Climb the board, win bonus credits",
      subhead: "Top players earn extra credits every week.",
      message:
        "The Spinora weekly leaderboard resets soon and bonus credits go to the top ranks. Every coin you earn counts — check where you stand and push for a higher spot before the week ends.",
      cta_label: "View leaderboard",
      cta_href: LEADERBOARD,
      stat1_value: "Top 10",
      stat1_label: "Paid out",
      stat2_value: "Weekly",
      stat2_label: "Reset",
      stat3_value: "Live",
      stat3_label: "Rankings",
    },
  },
  {
    id: "win-back",
    label: "We miss you",
    description: "Re-engage inactive players",
    values: {
      template_id: "win-back",
      subject: "We saved your seat — bonus waiting when you return",
      eyebrow: "Come back",
      heading: "Your table is still here",
      subhead: "Reload bonus waiting on your next deposit.",
      message:
        "It's been a while since your last session. Log back in this week — your VIP progress is exactly where you left it, and a reload bonus applies on your next deposit.\n\nFire Kirin, Juwa and the full game lineup are ready when you are.",
      cta_label: "Return to Spinora",
      cta_href: PROMO,
      stat1_value: "VIP",
      stat1_label: "Progress kept",
      stat2_value: "Reload",
      stat2_label: "Bonus",
      stat3_value: "12",
      stat3_label: "Games",
    },
  },
  {
    id: "custom",
    label: "Blank — write your own",
    description: "Start from scratch",
    values: {
      template_id: "custom",
      subject: "",
      eyebrow: "Spinora",
      heading: "",
      subhead: "",
      message: "",
      cta_label: "Play now",
      cta_href: PROMO,
      stat1_value: "",
      stat1_label: "",
      stat2_value: "",
      stat2_label: "",
      stat3_value: "",
      stat3_label: "",
    },
  },
];

export function getNewsletterPreset(id: string): NewsletterPreset | undefined {
  return NEWSLETTER_PRESETS.find((p) => p.id === id);
}

export function presetToSimpleForm(
  presetId: string,
  segment: "all" | "test" = "test"
): SimpleNewsletterInput {
  const preset = getNewsletterPreset(presetId) ?? NEWSLETTER_PRESETS[0];
  return {
    ...preset.values,
    name: preset.label,
    segment,
  };
}

export function emptySimpleForm(segment: "all" | "test" = "test"): SimpleNewsletterInput {
  return presetToSimpleForm("welcome-50", segment);
}
