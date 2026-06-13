export const SITE_NAME = "Spinora";

/** Set to true when the daily spin wheel is ready for players. */
export const DAILY_SPIN_ENABLED = false;

/** VIP points awarded per successful referral */
export const REFERRAL_REWARD_POINTS = 10;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://spinoracasinos.com";
export const SITE_DESCRIPTION =
  "Premium gaming support and account platform. Request game accounts, VIP rewards, live chat support, and exclusive promotions.";

export const VIP_TIERS = [
  {
    id: "bronze",
    name: "Bronze",
    minPoints: 0,
    color: "from-amber-700 to-amber-500",
    benefits: ["Basic support", "5% referral bonus", "Weekly promotions"],
  },
  {
    id: "silver",
    name: "Silver",
    minPoints: 500,
    color: "from-slate-400 to-slate-300",
    benefits: ["Priority support", "10% referral bonus", "Exclusive games access"],
  },
  {
    id: "gold",
    name: "Gold",
    minPoints: 2000,
    color: "from-yellow-500 to-amber-400",
    benefits: ["24/7 VIP support", "15% referral bonus", "Early access to promotions"],
  },
  {
    id: "platinum",
    name: "Platinum",
    minPoints: 5000,
    color: "from-purple-400 to-cyan-400",
    benefits: ["Dedicated account manager", "25% referral bonus", "Custom rewards"],
  },
] as const;

export const REQUEST_STATUSES = [
  "pending",
  "processing",
  "completed",
  "rejected",
] as const;

export const PUBLIC_ROUTES = [
  { path: "/", priority: 1.0 },
  { path: "/promotions", priority: 0.9 },
  { path: "/vip", priority: 0.9 },
  { path: "/about", priority: 0.8 },
  { path: "/support", priority: 0.8 },
  { path: "/spin", priority: 0.85 },
  { path: "/login", priority: 0.5 },
  { path: "/register", priority: 0.5 },
] as const;

/** Official Spinora social profile URLs — used in footer, tasks, and share buttons */
export const SOCIAL_LINKS = {
  telegram:
    process.env.NEXT_PUBLIC_TELEGRAM_URL ||
    "https://t.me/+Y80HSM0UiZw5ODdh",
  facebook:
    process.env.NEXT_PUBLIC_FACEBOOK_URL ||
    "https://www.facebook.com/share/19ea1cSC5W/",
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
    "https://www.instagram.com/spinora09?igsh=MXhtM3gxZmRlNnR5Zw==",
  tiktok:
    process.env.NEXT_PUBLIC_TIKTOK_URL ||
    "https://www.tiktok.com/@spinora09",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/1234567890",
} as const;
