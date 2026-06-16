import { SOCIAL_LINKS } from "@/lib/constants";

const { facebook, instagram, telegram, tiktok } = SOCIAL_LINKS;

/** YouTube — optional; tasks note when channel is not live yet. */
const youtube =
  process.env.NEXT_PUBLIC_YOUTUBE_URL?.trim() ||
  "https://www.youtube.com/results?search_query=spinora+casino";

export const TASK_DAY_COUNT = 7;

export type TaskCategory =
  | "social"
  | "content"
  | "engagement"
  | "referral"
  | "deposit"
  | "game"
  | "review";

export interface TaskLevelMeta {
  level: number;
  name: string;
  subtitle: string;
  pointsRequired: number;
  cashReward: number;
  color: string;
}

export interface TaskDefinition {
  id: string;
  level: number;
  title: string;
  description: string;
  category: TaskCategory;
  points: number;
  actionLabel: string;
  actionHref: string;
  external?: boolean;
}

/** Display label — internal DB field stays `level` for compatibility. */
export function formatTaskDay(level: number): string {
  return `Day ${level}`;
}

export const TASK_LEVELS: TaskLevelMeta[] = [
  {
    level: 1,
    name: "Setup & Awareness",
    subtitle: "Get started and connect on Facebook",
    pointsRequired: 50,
    cashReward: 3,
    color: "from-emerald-600 to-emerald-400",
  },
  {
    level: 2,
    name: "Engagement Boost",
    subtitle: "Facebook & Instagram activity",
    pointsRequired: 80,
    cashReward: 3,
    color: "from-blue-600 to-blue-400",
  },
  {
    level: 3,
    name: "Community Growth",
    subtitle: "Telegram & referrals",
    pointsRequired: 120,
    cashReward: 3,
    color: "from-cyan-600 to-cyan-400",
  },
  {
    level: 4,
    name: "Content Interaction",
    subtitle: "TikTok & video platforms",
    pointsRequired: 180,
    cashReward: 3,
    color: "from-violet-600 to-violet-400",
  },
  {
    level: 5,
    name: "Premium Member Challenge",
    subtitle: "Recharge $10+ and grow your reach",
    pointsRequired: 250,
    cashReward: 3,
    color: "from-purple-600 to-purple-400",
  },
  {
    level: 6,
    name: "Referral & Activity Mission",
    subtitle: "Refer friends and stay active",
    pointsRequired: 350,
    cashReward: 3,
    color: "from-orange-600 to-orange-400",
  },
  {
    level: 7,
    name: "VIP Completion Bonus",
    subtitle: "Finish the week and claim your bonus",
    pointsRequired: 500,
    cashReward: 3,
    color: "from-amber-600 to-amber-400",
  },
];

export const TASK_DEFINITIONS: TaskDefinition[] = [
  // Day 1 — Setup & Awareness
  {
    id: "D1-01",
    level: 1,
    title: "Log in to Spinora",
    description: "Sign in and open your dashboard today.",
    category: "engagement",
    points: 8,
    actionLabel: "Open Dashboard",
    actionHref: "/dashboard",
  },
  {
    id: "D1-02",
    level: 1,
    title: "Write a review",
    description: "Leave honest feedback on the Reviews page.",
    category: "review",
    points: 10,
    actionLabel: "Write Review",
    actionHref: "/dashboard/reviews",
  },
  {
    id: "D1-03",
    level: 1,
    title: "Follow us on Facebook",
    description: "Follow the official Spinora Facebook page.",
    category: "social",
    points: 8,
    actionLabel: "Follow Facebook",
    actionHref: facebook,
    external: true,
  },
  {
    id: "D1-04",
    level: 1,
    title: "Like our latest Facebook post",
    description: "Like the most recent post on our Facebook page.",
    category: "social",
    points: 8,
    actionLabel: "Open Facebook",
    actionHref: facebook,
    external: true,
  },
  {
    id: "D1-05",
    level: 1,
    title: "Share a post to 3 Facebook groups",
    description: "Share one Spinora post into three Facebook groups (no spam).",
    category: "social",
    points: 8,
    actionLabel: "Share Post",
    actionHref: facebook,
    external: true,
  },
  {
    id: "D1-06",
    level: 1,
    title: "Post a Facebook story mentioning us",
    description: "Post a Facebook story and tag or mention Spinora.",
    category: "social",
    points: 8,
    actionLabel: "Post Story",
    actionHref: facebook,
    external: true,
  },

  // Day 2 — Engagement Boost
  {
    id: "D2-01",
    level: 2,
    title: "Log in to Spinora",
    description: "Open your dashboard for Day 2.",
    category: "engagement",
    points: 12,
    actionLabel: "Open Dashboard",
    actionHref: "/dashboard",
  },
  {
    id: "D2-02",
    level: 2,
    title: "Engage with a Facebook post",
    description: "Watch or react to one of our Facebook posts.",
    category: "social",
    points: 14,
    actionLabel: "Open Facebook",
    actionHref: facebook,
    external: true,
  },
  {
    id: "D2-03",
    level: 2,
    title: "Comment on a Facebook post",
    description: "Leave a genuine comment on our latest Facebook post.",
    category: "social",
    points: 14,
    actionLabel: "Comment Now",
    actionHref: facebook,
    external: true,
  },
  {
    id: "D2-04",
    level: 2,
    title: "Follow us on Instagram",
    description: "Follow @spinora09 on Instagram.",
    category: "social",
    points: 14,
    actionLabel: "Follow Instagram",
    actionHref: instagram,
    external: true,
  },
  {
    id: "D2-05",
    level: 2,
    title: "Like 3 Instagram posts",
    description: "Like three recent posts on our Instagram page.",
    category: "social",
    points: 14,
    actionLabel: "Open Instagram",
    actionHref: instagram,
    external: true,
  },
  {
    id: "D2-06",
    level: 2,
    title: "Share an Instagram story mentioning us",
    description: "Share an Instagram story and mention Spinora.",
    category: "social",
    points: 12,
    actionLabel: "Share Story",
    actionHref: instagram,
    external: true,
  },

  // Day 3 — Community Growth
  {
    id: "D3-01",
    level: 3,
    title: "Log in to Spinora",
    description: "Open your dashboard for Day 3.",
    category: "engagement",
    points: 20,
    actionLabel: "Open Dashboard",
    actionHref: "/dashboard",
  },
  {
    id: "D3-02",
    level: 3,
    title: "Join our Telegram channel",
    description: "Join the official Spinora Telegram community.",
    category: "social",
    points: 25,
    actionLabel: "Join Telegram",
    actionHref: telegram,
    external: true,
  },
  {
    id: "D3-03",
    level: 3,
    title: 'Say "Hello" in Telegram',
    description: "Send a hello message in the Telegram group or chat.",
    category: "engagement",
    points: 25,
    actionLabel: "Open Telegram",
    actionHref: telegram,
    external: true,
  },
  {
    id: "D3-04",
    level: 3,
    title: "Share referral link with 3 friends",
    description: "Send your referral link to three friends.",
    category: "referral",
    points: 25,
    actionLabel: "Copy Referral Link",
    actionHref: "/dashboard/referrals",
  },
  {
    id: "D3-05",
    level: 3,
    title: "Tag 2 friends on a Facebook post",
    description: "Tag two friends on a Spinora post (optional — keep it friendly, no spam).",
    category: "social",
    points: 25,
    actionLabel: "Tag Friends",
    actionHref: facebook,
    external: true,
  },

  // Day 4 — Content Interaction
  {
    id: "D4-01",
    level: 4,
    title: "Log in to Spinora",
    description: "Open your dashboard for Day 4.",
    category: "engagement",
    points: 28,
    actionLabel: "Open Dashboard",
    actionHref: "/dashboard",
  },
  {
    id: "D4-02",
    level: 4,
    title: "Watch a TikTok video",
    description: "Watch one video on our TikTok page.",
    category: "content",
    points: 30,
    actionLabel: "Open TikTok",
    actionHref: tiktok,
    external: true,
  },
  {
    id: "D4-03",
    level: 4,
    title: "Like 2 TikTok videos",
    description: "Like two videos on @spinora09 TikTok.",
    category: "social",
    points: 30,
    actionLabel: "Open TikTok",
    actionHref: tiktok,
    external: true,
  },
  {
    id: "D4-04",
    level: 4,
    title: "Share a TikTok video link",
    description: "Share one of our TikTok videos with a friend or on your story.",
    category: "content",
    points: 30,
    actionLabel: "Share TikTok",
    actionHref: tiktok,
    external: true,
  },
  {
    id: "D4-05",
    level: 4,
    title: "Comment on a YouTube video",
    description: "Leave a comment on our YouTube channel if available, or on our latest Facebook video post.",
    category: "social",
    points: 32,
    actionLabel: "Open YouTube",
    actionHref: youtube,
    external: true,
  },
  {
    id: "D4-06",
    level: 4,
    title: "Subscribe on YouTube",
    description: "Subscribe to Spinora on YouTube when the channel is available.",
    category: "social",
    points: 30,
    actionLabel: "Subscribe",
    actionHref: youtube,
    external: true,
  },

  // Day 5 — Premium Member Challenge
  {
    id: "D5-01",
    level: 5,
    title: "Log in to Spinora",
    description: "Open your dashboard for Day 5.",
    category: "engagement",
    points: 40,
    actionLabel: "Open Dashboard",
    actionHref: "/dashboard",
  },
  {
    id: "D5-02",
    level: 5,
    title: "Recharge $10 or more",
    description: "Submit a deposit of at least $10 through Deposit.",
    category: "deposit",
    points: 45,
    actionLabel: "Make Deposit",
    actionHref: "/dashboard/deposit",
  },
  {
    id: "D5-03",
    level: 5,
    title: "Confirm recharge in dashboard",
    description: "Check Deposits and confirm your $10+ recharge shows as submitted or approved.",
    category: "deposit",
    points: 40,
    actionLabel: "View Deposits",
    actionHref: "/dashboard/deposits",
  },
  {
    id: "D5-04",
    level: 5,
    title: "Share a Facebook post to your timeline",
    description: "Share one Spinora post on your Facebook timeline.",
    category: "social",
    points: 42,
    actionLabel: "Share on Facebook",
    actionHref: facebook,
    external: true,
  },
  {
    id: "D5-05",
    level: 5,
    title: "Invite 2 friends with your referral link",
    description: "Share your referral link with two friends.",
    category: "referral",
    points: 42,
    actionLabel: "Refer Friends",
    actionHref: "/dashboard/referrals",
  },
  {
    id: "D5-06",
    level: 5,
    title: "Like & comment on 2 social posts",
    description: "Like and comment on two recent Spinora posts on Facebook or Instagram.",
    category: "social",
    points: 41,
    actionLabel: "Open Instagram",
    actionHref: instagram,
    external: true,
  },

  // Day 6 — Referral & Activity Mission
  {
    id: "D6-01",
    level: 6,
    title: "Log in to Spinora",
    description: "Open your dashboard for Day 6.",
    category: "engagement",
    points: 55,
    actionLabel: "Open Dashboard",
    actionHref: "/dashboard",
  },
  {
    id: "D6-02",
    level: 6,
    title: "Refer 1 new user who creates an account",
    description: "A friend signs up using your referral link.",
    category: "referral",
    points: 60,
    actionLabel: "Refer Now",
    actionHref: "/dashboard/referrals",
  },
  {
    id: "D6-03",
    level: 6,
    title: "Complete 3 spins or game sessions",
    description: "Use Daily Spin or play on any game page three times.",
    category: "game",
    points: 58,
    actionLabel: "Daily Spin",
    actionHref: "/spin",
  },
  {
    id: "D6-04",
    level: 6,
    title: "Stay active on the site for 5 minutes",
    description: "Browse games, dashboard, or messages for at least five minutes today.",
    category: "engagement",
    points: 57,
    actionLabel: "Browse Games",
    actionHref: "/#games",
  },
  {
    id: "D6-05",
    level: 6,
    title: "Share referral link in 2 communities",
    description: "Share your link in two appropriate groups (Telegram, Facebook, etc.) — no spam.",
    category: "referral",
    points: 60,
    actionLabel: "Share Link",
    actionHref: telegram,
    external: true,
  },
  {
    id: "D6-06",
    level: 6,
    title: "Comment on latest Facebook or Instagram post",
    description: "Leave a comment on our newest Facebook or Instagram post.",
    category: "social",
    points: 60,
    actionLabel: "Comment Now",
    actionHref: facebook,
    external: true,
  },

  // Day 7 — VIP Completion Bonus
  {
    id: "D7-01",
    level: 7,
    title: "Log in to Spinora",
    description: "Open your dashboard for the final day.",
    category: "engagement",
    points: 80,
    actionLabel: "Open Dashboard",
    actionHref: "/dashboard",
  },
  {
    id: "D7-02",
    level: 7,
    title: "Second recharge of $10+ (optional bonus)",
    description: "Optional extra — make another $10+ deposit for VIP completion credit.",
    category: "deposit",
    points: 85,
    actionLabel: "Make Deposit",
    actionHref: "/dashboard/deposit",
  },
  {
    id: "D7-03",
    level: 7,
    title: "Share referral link with 5 people",
    description: "Send your referral link to five friends or contacts.",
    category: "referral",
    points: 85,
    actionLabel: "Share Referral",
    actionHref: "/dashboard/referrals",
  },
  {
    id: "D7-04",
    level: 7,
    title: "Complete your daily check-in",
    description: "Visit the dashboard and review your wallet, tasks, and messages.",
    category: "engagement",
    points: 82,
    actionLabel: "Check In",
    actionHref: "/dashboard",
  },
  {
    id: "D7-05",
    level: 7,
    title: "Submit final review or feedback",
    description: "Update or submit your final honest review on the Reviews page.",
    category: "review",
    points: 84,
    actionLabel: "Write Review",
    actionHref: "/dashboard/reviews",
  },
  {
    id: "D7-06",
    level: 7,
    title: "Stay active in Telegram",
    description: "Say hi or engage in the Spinora Telegram community.",
    category: "social",
    points: 84,
    actionLabel: "Open Telegram",
    actionHref: telegram,
    external: true,
  },
];

export const TASK_FAQ = [
  {
    q: "How do daily tasks work?",
    a: "Complete one day at a time across our 7-day plan. Finish every task in a day and get admin approval, then press Claim Reward to add the cash to your Bonus wallet. The next day unlocks 24 hours after you claim.",
  },
  {
    q: "Why is my task pending?",
    a: "An admin verifies your proof within 24 hours. VIP players may get faster review. Make sure your proof shows your Spinora username.",
  },
  {
    q: "Why can't I open the next day yet?",
    a: "Days unlock one at a time. After you claim a day's reward, the next day stays locked for 24 hours so you can come back tomorrow.",
  },
  {
    q: "What proof should I submit?",
    a: "A screenshot is required for every task. For social tasks, make sure your Spinora username is visible in the image. You can add an optional note with extra details.",
  },
  {
    q: "When do I get paid?",
    a: "Once every task in a day is approved, a Claim Reward button appears. Press it and the cash is added to your Bonus wallet instantly.",
  },
];

export function getTasksForLevel(level: number): TaskDefinition[] {
  return TASK_DEFINITIONS.filter((t) => t.level === level);
}

export function getTaskById(id: string): TaskDefinition | undefined {
  return TASK_DEFINITIONS.find((t) => t.id === id);
}

export function getLevelMeta(level: number): TaskLevelMeta | undefined {
  return TASK_LEVELS.find((l) => l.level === level);
}
