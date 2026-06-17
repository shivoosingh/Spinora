export interface Game {
  id: string;
  name: string;
  slug: string;
  image: string;
  provider: string;
  category: string;
  downloadUrl: string;
  /** SEO description — used in meta tags and game landing page */
  bio: string;
  players: number;
  gradient: string;
  popular?: boolean;
  trending?: boolean;
  upcoming?: boolean;
  promotional?: boolean;
  topRated?: boolean;
}

/** Shared bonus & load rules shown on every game landing page */
export const GAME_BONUS_RULES = {
  firstTimeBonus: 50,
  regularBonus: 10,
  minDeposit: 5,
  maxDeposit: 500,
  /** Deposit wallet load → deposit redeem wallet */
  redeemMin: 3,
  redeemMax: 8,
} as const;

/** Bonus wallet load → bonus redeem wallet */
export const GAME_BONUS_REDEEM_RULES = {
  redeemMin: 7,
  redeemMax: 15,
} as const;

export const UPCOMING_GAME_MESSAGE =
  "This game is not available at the moment. Please check back soon!";

export const GAMES: Game[] = [
  {
    id: "8",
    name: "Orion Stars",
    slug: "orion-stars",
    image: "/games/orion-stars.webp",
    provider: "Orion Stars",
    category: "Arcade",
    downloadUrl: "http://start.orionstars.vip:8580/",
    bio: "Orion Stars is a top-rated arcade and fish game platform with fast deposits, daily bonuses, and big win potential. Create your Spinora account, download Orion Stars, and start playing slots, fish shooters, and classic arcade titles with 24/7 support.",
    players: 25053,
    gradient: "from-zinc-500 via-zinc-600 to-zinc-800",
    upcoming: true,
  },
  {
    id: "7",
    name: "Game Vault",
    slug: "game-vault",
    image: "/games/game-vault.webp",
    provider: "Game Vault",
    category: "Vault",
    downloadUrl: "https://download.gamevault999.com/",
    bio: "Game Vault delivers a secure vault-style gaming experience with hundreds of slots, keno, and fish games. Spinora players get a 50% first-time bonus, quick account setup, and reliable cashouts on one of the most trusted platforms in the industry.",
    players: 20902,
    gradient: "from-fuchsia-500 via-pink-600 to-purple-900",
    popular: true,
    trending: true,
    topRated: true,
  },
  {
    id: "3",
    name: "Juwa",
    slug: "juwa",
    image: "/games/juwa.webp",
    provider: "Juwa",
    category: "Casino",
    downloadUrl: "https://dl.juwa777.com/",
    bio: "Juwa is a popular mobile casino app packed with slots, fish games, and table-style action. Request your Juwa account through Spinora for fast approval, deposit bonuses, and VIP rewards while you play your favorite Juwa titles anytime.",
    players: 20047,
    gradient: "from-blue-400 via-blue-600 to-indigo-900",
    popular: true,
    trending: true,
    promotional: true,
    topRated: true,
  },
  {
    id: "1",
    name: "Fire Kirin",
    slug: "fire-kirin",
    image: "/games/fire-kirin.webp",
    provider: "Fire Kirin",
    category: "Fish Game",
    downloadUrl: "http://start.firekirin.xyz:8580/",
    bio: "Fire Kirin is the legendary fish shooting game loved by players nationwide. Spinora makes it easy to get your Fire Kirin account, claim your welcome bonus, and dive into action-packed fish tables with explosive jackpots and non-stop excitement.",
    players: 19426,
    gradient: "from-red-500 via-orange-600 to-red-900",
    upcoming: true,
  },
  {
    id: "16",
    name: "MR All In One",
    slug: "mr-all-in-one",
    image: "/games/mr-all-in-one.webp",
    provider: "MR All In One",
    category: "All-In-One",
    downloadUrl: "https://www.mrallinone777.com/",
    bio: "MR All In One combines multiple game styles in one powerful app — slots, fish, keno, and more. Spinora players enjoy one-stop access with fast deposits from $5, generous bonuses, and a single account for all your favorite MR All In One games.",
    players: 18200,
    gradient: "from-amber-400 via-orange-500 to-yellow-700",
    popular: true,
    trending: true,
    promotional: true,
  },
  {
    id: "11",
    name: "Cash Machine",
    slug: "cash-machine",
    image: "/games/cash-machine.webp",
    provider: "Cash Machine",
    category: "Slots",
    downloadUrl: "https://www.cashmachine777.com/",
    bio: "Cash Machine is a high-energy slots platform built for players who love big spins and fast payouts. Get your account through Spinora, load from $5 to $500, and enjoy regular reload bonuses plus a 50% first-time deposit match.",
    players: 17836,
    gradient: "from-emerald-500 via-green-600 to-teal-900",
    trending: true,
    promotional: true,
  },
  {
    id: "10",
    name: "Cash Frenzy",
    slug: "cash-frenzy",
    image: "/games/cash-frenzy.webp",
    provider: "Cash Frenzy",
    category: "Slots",
    downloadUrl: "https://www.cashfrenzy777.com/",
    bio: "Cash Frenzy brings non-stop slot action with vibrant graphics, daily promos, and rewarding gameplay. Spinora members can request a Cash Frenzy account in minutes, download the app, and start spinning with welcome bonuses and VIP perks.",
    players: 17783,
    gradient: "from-lime-500 via-green-500 to-emerald-800",
    trending: true,
    promotional: true,
  },
  {
    id: "4",
    name: "Panda Master",
    slug: "panda-master",
    image: "/games/panda-master.webp",
    provider: "Panda Master",
    category: "Fish Game",
    downloadUrl: "https://pandamaster.vip:8888/index.html",
    bio: "Panda Master is a fan-favorite fish game app featuring colorful underwater battles and massive coin rewards. Create your account on Spinora, download Panda Master, and join thousands of players hunting jackpots on every table.",
    players: 17586,
    gradient: "from-pink-400 via-rose-500 to-pink-900",
    upcoming: true,
  },
  {
    id: "13",
    name: "Vblink",
    slug: "vblink",
    image: "/games/vblink.webp",
    provider: "Vblink",
    category: "Arcade",
    downloadUrl: "https://www.vblink777.club/",
    bio: "Vblink offers a sleek arcade gaming experience with fish games, slots, and classic casino favorites. Spinora provides fast Vblink account creation, deposit bonuses, and dedicated support so you can focus on winning.",
    players: 17435,
    gradient: "from-cyan-400 via-sky-600 to-blue-900",
    upcoming: true,
  },
  {
    id: "9",
    name: "Milky Way",
    slug: "milky-way",
    image: "/games/milky-way.webp",
    provider: "Milky Way",
    category: "Space",
    downloadUrl: "https://milkywayapp.xyz/",
    bio: "Milky Way takes you on a cosmic gaming adventure with space-themed slots and fish games. Request your Milky Way account through Spinora for a 50% first-time bonus, flexible $5–$500 loads, and 3x–8x redeem rules.",
    players: 17176,
    gradient: "from-violet-400 via-purple-600 to-indigo-900",
    upcoming: true,
  },
  {
    id: "6",
    name: "Vegas Sweeps",
    slug: "vegas-sweeps",
    image: "/games/vegas-sweeps.webp",
    provider: "Vegas Sweeps",
    category: "Sweepstakes",
    downloadUrl: "https://vegassweepsonline.com/",
    bio: "Vegas Sweeps brings the Las Vegas sweepstakes experience to your phone with slots, keno, and fish games. Spinora players get quick account setup, welcome bonuses, and smooth cashouts on one of the hottest sweepstakes platforms.",
    players: 16510,
    gradient: "from-yellow-400 via-amber-500 to-orange-800",
    popular: true,
    trending: true,
    promotional: true,
  },
  {
    id: "14",
    name: "Ultrapanda",
    slug: "ultrapanda",
    image: "/games/ultrapanda.webp",
    provider: "Ultrapanda",
    category: "Fish Game",
    downloadUrl: "https://www.ultrapanda.mobi/",
    bio: "Ultrapanda is a vibrant fish and slots platform featuring the beloved panda mascot and action-packed gameplay. Download Ultrapanda through Spinora, create your account, and enjoy welcome bonuses with fast deposits and 24/7 player support.",
    players: 16320,
    gradient: "from-red-400 via-rose-500 to-pink-800",
    upcoming: true,
  },
  {
    id: "15",
    name: "Gameroom",
    slug: "gameroom",
    image: "/games/gameroom.webp",
    provider: "Gameroom",
    category: "Arcade",
    downloadUrl: "https://www.gameroom777.com/m",
    bio: "Gameroom Online is a classic Vegas-style arcade platform with slots, fish games, and keno under one roof. Spinora makes it easy to join Gameroom with a 50% first-time bonus, $5 minimum deposits, and quick account approval.",
    players: 15890,
    gradient: "from-indigo-500 via-violet-600 to-purple-900",
    trending: true,
    promotional: true,
  },
  {
    id: "12",
    name: "Mafia",
    slug: "mafia",
    image: "/games/mafia.webp",
    provider: "Mafia",
    category: "Slots",
    downloadUrl: "https://www.mafia77777.com/m",
    bio: "Mafia Online delivers a bold, mob-themed slots and arcade experience with high-stakes action and daily rewards. Get your Mafia account through Spinora, download the app, and claim your 50% welcome bonus with deposits from $5 to $500.",
    players: 15640,
    gradient: "from-neutral-600 via-stone-700 to-neutral-900",
    trending: true,
    promotional: true,
  },
];

export type GameTab = "all" | "popular" | "trending" | "upcoming" | "promotional" | "topRated";

export type HomeGameTab = "trending" | "all" | "promotional";

export function getGameBySlug(slug: string): Game | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export function getOtherGames(slug: string, limit = 6): Game[] {
  return GAMES.filter((g) => g.slug !== slug && !g.upcoming)
    .sort((a, b) => b.players - a.players)
    .slice(0, limit);
}

export function filterGames(tab: GameTab, search: string): Game[] {
  let list = [...GAMES];

  if (tab === "all") {
    // Every game — live first, then coming soon (cards show SOON badge via game.upcoming).
    list.sort((a, b) => {
      if (Boolean(a.upcoming) !== Boolean(b.upcoming)) {
        return a.upcoming ? 1 : -1;
      }
      return b.players - a.players;
    });
  } else if (tab === "upcoming") {
    list = list.filter((g) => g.upcoming).sort((a, b) => b.players - a.players);
  } else {
    list = list.filter((g) => !g.upcoming).sort((a, b) => b.players - a.players);
    if (tab === "popular") list = list.filter((g) => g.popular);
    if (tab === "topRated") list = list.filter((g) => g.topRated);
    // trending & promotional tabs list every live game
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.provider.toLowerCase().includes(q) ||
        g.bio.toLowerCase().includes(q)
    );
  }

  return list;
}

export function filterHomeGames(tab: HomeGameTab, search: string): Game[] {
  // Home trending & promotional tabs show every live game (non-upcoming).
  if (tab === "trending" || tab === "promotional") {
    let list = GAMES.filter((g) => !g.upcoming).sort((a, b) => b.players - a.players);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.provider.toLowerCase().includes(q) ||
          g.bio.toLowerCase().includes(q)
      );
    }
    return list;
  }
  return filterGames("all", search);
}

export function formatPlayers(n: number) {
  return n.toLocaleString();
}
