import { SOCIAL_LINKS } from "@/lib/constants";

const { facebook, instagram, telegram, tiktok, whatsapp } = SOCIAL_LINKS;

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

export const TASK_LEVELS: TaskLevelMeta[] = [
  { level: 1, name: "Starter", subtitle: "Learn the basics & earn your first reward", pointsRequired: 50, cashReward: 5, color: "from-emerald-600 to-emerald-400" },
  { level: 2, name: "Social Spark", subtitle: "Connect on social platforms", pointsRequired: 80, cashReward: 8, color: "from-blue-600 to-blue-400" },
  { level: 3, name: "Community Player", subtitle: "Join groups & engage daily", pointsRequired: 120, cashReward: 12, color: "from-cyan-600 to-cyan-400" },
  { level: 4, name: "Content Creator", subtitle: "Share wins & create content", pointsRequired: 180, cashReward: 15, color: "from-violet-600 to-violet-400" },
  { level: 5, name: "Rising Star", subtitle: "Grow your reach & referrals", pointsRequired: 250, cashReward: 20, color: "from-purple-600 to-purple-400" },
  { level: 6, name: "Hot Hand", subtitle: "Advanced social & game tasks", pointsRequired: 350, cashReward: 28, color: "from-orange-600 to-orange-400" },
  { level: 7, name: "High Roller", subtitle: "Premium engagement missions", pointsRequired: 500, cashReward: 35, color: "from-amber-600 to-amber-400" },
  { level: 8, name: "Elite Promoter", subtitle: "Lead the community", pointsRequired: 750, cashReward: 42, color: "from-rose-600 to-rose-400" },
  { level: 9, name: "Champion", subtitle: "Master-level challenges", pointsRequired: 1000, cashReward: 48, color: "from-fuchsia-600 to-fuchsia-400" },
  { level: 10, name: "Spinora Legend", subtitle: "The ultimate task tier", pointsRequired: 1500, cashReward: 50, color: "from-yellow-500 to-amber-300" },
];

export const TASK_DEFINITIONS: TaskDefinition[] = [
  // Level 1 — Starter (50 pts)
  { id: "L1-01", level: 1, title: "Log in & visit dashboard", description: "Open your Spinora dashboard today.", category: "engagement", points: 5, actionLabel: "Open Dashboard", actionHref: "/dashboard" },
  { id: "L1-02", level: 1, title: "Write a Spinora review", description: "Leave a star rating and comment on the Reviews page.", category: "review", points: 15, actionLabel: "Write Review", actionHref: "/dashboard/reviews" },
  { id: "L1-03", level: 1, title: "Share your referral link", description: "Copy and share your unique referral link with a friend.", category: "referral", points: 10, actionLabel: "Refer Now", actionHref: "/dashboard/referrals" },
  { id: "L1-04", level: 1, title: "Share a Spinora post", description: "Share any Spinora post to your Facebook or Instagram story.", category: "social", points: 10, actionLabel: "Share Post", actionHref: facebook, external: true },
  { id: "L1-05", level: 1, title: "Comment on official post", description: "Comment on the latest Spinora Facebook or Instagram post.", category: "social", points: 10, actionLabel: "Comment Now", actionHref: instagram, external: true },

  // Level 2 — Social Spark (80 pts)
  { id: "L2-01", level: 2, title: "Follow Spinora on Instagram", description: "Follow @spinora09 and turn on post notifications.", category: "social", points: 10, actionLabel: "Follow Now", actionHref: instagram, external: true },
  { id: "L2-02", level: 2, title: "Join Telegram channel", description: "Join the official Spinora Telegram group.", category: "social", points: 15, actionLabel: "Join Telegram", actionHref: telegram, external: true },
  { id: "L2-03", level: 2, title: "Like the Spinora Facebook page", description: "Like and follow the Spinora Facebook page.", category: "social", points: 15, actionLabel: "Like Page", actionHref: facebook, external: true },
  { id: "L2-04", level: 2, title: "Tag 3 friends on a post", description: "Tag 3 friends in the comments of any Spinora post.", category: "social", points: 20, actionLabel: "Tag Friends", actionHref: facebook, external: true },
  { id: "L2-05", level: 2, title: "Send a message to support", description: "Say hello to our team in Messages.", category: "engagement", points: 20, actionLabel: "Open Messages", actionHref: "/dashboard/messages" },

  // Level 3 — Community Player (120 pts)
  { id: "L3-01", level: 3, title: "Join Spinora Facebook group", description: "Join the Spinora community on Facebook and introduce yourself.", category: "social", points: 20, actionLabel: "Join Group", actionHref: facebook, external: true },
  { id: "L3-02", level: 3, title: "Post in community chat", description: "Share a greeting or win in the Spinora Telegram group.", category: "engagement", points: 25, actionLabel: "Open Telegram", actionHref: telegram, external: true },
  { id: "L3-03", level: 3, title: "Share promo to your story", description: "Share today's Spinora promo to your Instagram or Facebook story.", category: "content", points: 25, actionLabel: "Share Story", actionHref: instagram, external: true },
  { id: "L3-04", level: 3, title: "Request a game account", description: "Submit a game account request from your dashboard.", category: "game", points: 25, actionLabel: "Request Game", actionHref: "/dashboard/requests" },
  { id: "L3-05", level: 3, title: "Spin the daily wheel", description: "Complete your free daily spin.", category: "game", points: 25, actionLabel: "Spin Now", actionHref: "/spin" },

  // Level 4 — Content Creator (180 pts)
  { id: "L4-01", level: 4, title: "Post a win screenshot", description: "Share your win screenshot in the Spinora Telegram group.", category: "content", points: 35, actionLabel: "Share Win", actionHref: telegram, external: true },
  { id: "L4-02", level: 4, title: "Write a 3-sentence review", description: "Update your review with at least 3 sentences about your experience.", category: "review", points: 35, actionLabel: "Update Review", actionHref: "/dashboard/reviews" },
  { id: "L4-03", level: 4, title: "Share referral on WhatsApp", description: "Forward your referral link to 3 WhatsApp contacts.", category: "referral", points: 35, actionLabel: "Share on WhatsApp", actionHref: whatsapp, external: true },
  { id: "L4-04", level: 4, title: "React to 5 Spinora posts", description: "React to 5 different Spinora posts on any platform.", category: "social", points: 35, actionLabel: "React Now", actionHref: instagram, external: true },
  { id: "L4-05", level: 4, title: "Check VIP progress", description: "Visit VIP Status and review your tier progress.", category: "engagement", points: 40, actionLabel: "View VIP", actionHref: "/dashboard/vip" },

  // Level 5 — Rising Star (250 pts)
  { id: "L5-01", level: 5, title: "Invite a friend to join", description: "Get a friend to sign up using your referral link.", category: "referral", points: 50, actionLabel: "Refer Now", actionHref: "/dashboard/referrals" },
  { id: "L5-02", level: 5, title: "Share Spinora on TikTok", description: "Post or share Spinora content on TikTok with #Spinora.", category: "content", points: 50, actionLabel: "Open TikTok", actionHref: tiktok, external: true },
  { id: "L5-03", level: 5, title: "Comment on 3 group posts", description: "Leave helpful comments on 3 posts in the Spinora group.", category: "social", points: 50, actionLabel: "Comment Now", actionHref: telegram, external: true },
  { id: "L5-04", level: 5, title: "Make a deposit request", description: "Message support to make your first deposit.", category: "deposit", points: 50, actionLabel: "Deposit Now", actionHref: "/dashboard/messages" },
  { id: "L5-05", level: 5, title: "Play 3 different games", description: "Request or play sessions on 3 different games.", category: "game", points: 50, actionLabel: "Browse Games", actionHref: "/#games" },

  // Level 6 — Hot Hand (350 pts)
  { id: "L6-01", level: 6, title: "Share win to Instagram story", description: "Post your Spinora win on your Instagram story.", category: "content", points: 60, actionLabel: "Share Story", actionHref: instagram, external: true },
  { id: "L6-02", level: 6, title: "Forward promo to 5 contacts", description: "Forward today's Spinora promo to 5 Telegram or WhatsApp contacts.", category: "social", points: 70, actionLabel: "Forward Promo", actionHref: telegram, external: true },
  { id: "L6-03", level: 6, title: "Get 1 referral signup", description: "A new player signs up using your referral link.", category: "referral", points: 80, actionLabel: "Refer Now", actionHref: "/dashboard/referrals" },
  { id: "L6-04", level: 6, title: "Write a game tip in group", description: "Post a useful game strategy tip in the community group.", category: "content", points: 70, actionLabel: "Post Tip", actionHref: telegram, external: true },
  { id: "L6-05", level: 6, title: "7-day login streak", description: "Log in to Spinora for 7 consecutive days.", category: "engagement", points: 70, actionLabel: "Open Dashboard", actionHref: "/dashboard" },

  // Level 7 — High Roller (500 pts)
  { id: "L7-01", level: 7, title: "Share referral in 3 groups", description: "Post your referral link in 3 different social groups.", category: "referral", points: 100, actionLabel: "Share Link", actionHref: "/dashboard/referrals" },
  { id: "L7-02", level: 7, title: "Create a Spinora story post", description: "Make a personal story about why you play Spinora.", category: "content", points: 100, actionLabel: "Create Story", actionHref: instagram, external: true },
  { id: "L7-03", level: 7, title: "Invite 5 friends to group", description: "Invite 5 friends to join the Spinora Telegram group.", category: "social", points: 100, actionLabel: "Invite Friends", actionHref: telegram, external: true },
  { id: "L7-04", level: 7, title: "Deposit & play session", description: "Make a deposit and play a game session.", category: "deposit", points: 100, actionLabel: "Deposit Now", actionHref: "/dashboard/messages" },
  { id: "L7-05", level: 7, title: "Team pick review upgrade", description: "Update your review after reaching a new VIP tier.", category: "review", points: 100, actionLabel: "Update Review", actionHref: "/dashboard/reviews" },

  // Level 8 — Elite Promoter (750 pts)
  { id: "L8-01", level: 8, title: "Share on 5 platforms", description: "Share Spinora on Facebook, Instagram, Telegram, WhatsApp, and TikTok.", category: "social", points: 150, actionLabel: "Share Now", actionHref: facebook, external: true },
  { id: "L8-02", level: 8, title: "Get 3 referral signups", description: "Three new players register via your referral link.", category: "referral", points: 150, actionLabel: "Refer Now", actionHref: "/dashboard/referrals" },
  { id: "L8-03", level: 8, title: "Post a video review", description: "Record a 15–30 second video review of Spinora.", category: "content", points: 150, actionLabel: "Upload Proof", actionHref: "/dashboard/tasks" },
  { id: "L8-04", level: 8, title: "Write a group strategy post", description: "Post a detailed game strategy (5+ sentences) in the group.", category: "content", points: 150, actionLabel: "Post Strategy", actionHref: telegram, external: true },
  { id: "L8-05", level: 8, title: "Cashout request", description: "Message support about a cashout or withdrawal.", category: "deposit", points: 150, actionLabel: "Cashout Now", actionHref: "/dashboard/messages" },

  // Level 9 — Champion (1000 pts)
  { id: "L9-01", level: 9, title: "Recruit an active player", description: "Refer someone who deposits and plays.", category: "referral", points: 200, actionLabel: "Refer Now", actionHref: "/dashboard/referrals" },
  { id: "L9-02", level: 9, title: "Create Spinora Reel/TikTok", description: "Create a short video about Spinora (15+ seconds).", category: "content", points: 200, actionLabel: "Open TikTok", actionHref: tiktok, external: true },
  { id: "L9-03", level: 9, title: "Share in 10 groups", description: "Share Spinora in 10 different groups in one week.", category: "social", points: 200, actionLabel: "Share Now", actionHref: telegram, external: true },
  { id: "L9-04", level: 9, title: "30-day activity streak", description: "Stay active on Spinora for 30 consecutive days.", category: "engagement", points: 200, actionLabel: "Open Dashboard", actionHref: "/dashboard" },
  { id: "L9-05", level: 9, title: "Help a new player", description: "Answer a newcomer's question in Messages or group chat.", category: "engagement", points: 200, actionLabel: "Open Messages", actionHref: "/dashboard/messages" },

  // Level 10 — Spinora Legend (1500 pts)
  { id: "L10-01", level: 10, title: "Get 5 referral signups", description: "Five total players signed up from your referral efforts.", category: "referral", points: 300, actionLabel: "Refer Now", actionHref: "/dashboard/referrals" },
  { id: "L10-02", level: 10, title: "Featured content creator", description: "Create content that gets reposted or featured by Spinora.", category: "content", points: 300, actionLabel: "Submit Proof", actionHref: "/dashboard/tasks" },
  { id: "L10-03", level: 10, title: "Community leader post", description: "Write a 200+ word story about your Spinora journey.", category: "content", points: 300, actionLabel: "Post Story", actionHref: telegram, external: true },
  { id: "L10-04", level: 10, title: "Cross-platform ambassador", description: "Post Spinora on Facebook, Instagram, Telegram, and TikTok in one day.", category: "social", points: 300, actionLabel: "Share Everywhere", actionHref: instagram, external: true },
  { id: "L10-05", level: 10, title: "Legend status review", description: "Write a detailed 10-sentence review covering games, support & VIP.", category: "review", points: 300, actionLabel: "Write Review", actionHref: "/dashboard/reviews" },
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

export const TASK_FAQ = [
  {
    q: "How do daily tasks work?",
    a: "Complete one level per day. Finish every task in a level and get admin approval, then press Claim Reward to add the cash to your Bonus wallet. The next level unlocks 24 hours after you claim.",
  },
  {
    q: "Why is my task pending?",
    a: "An admin verifies your proof within 24 hours. VIP players may get faster review. Make sure your proof shows your Spinora username.",
  },
  {
    q: "Why can't I open the next level yet?",
    a: "Levels are one per day. After you claim a level's reward, the next level stays locked for 24 hours so you can come back tomorrow.",
  },
  {
    q: "What proof should I submit?",
    a: "Screenshots, links, or a short note describing what you did. For social tasks, include your username visible in the screenshot.",
  },
  {
    q: "When do I get paid?",
    a: "Once every task in a level is approved, a Claim Reward button appears. Press it and the cash is added to your Bonus wallet instantly.",
  },
];
