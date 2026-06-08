export interface Game {
  id: string;
  name: string;
  slug: string;
  image: string;
  provider: string;
  players: number;
  gradient: string;
  popular?: boolean;
  trending?: boolean;
  upcoming?: boolean;
  promotional?: boolean;
  topRated?: boolean;
}

export const GAMES: Game[] = [
  { id: "8", name: "Orion Stars", slug: "orion-stars", image: "/games/orion-stars.jpeg", provider: "Orion Stars", players: 25053, gradient: "from-zinc-500 via-zinc-600 to-zinc-800", popular: true, trending: true, promotional: true, topRated: true },
  { id: "7", name: "Game Vault", slug: "game-vault", image: "/games/game-vault.jpeg", provider: "Game Vault", players: 20902, gradient: "from-fuchsia-500 via-pink-600 to-purple-900", popular: true, trending: true, topRated: true },
  { id: "3", name: "Juwa", slug: "juwa", image: "/games/juwa.jpeg", provider: "Juwa", players: 20047, gradient: "from-blue-400 via-blue-600 to-indigo-900", popular: true, trending: true, promotional: true, topRated: true },
  { id: "1", name: "Fire Kirin", slug: "fire-kirin", image: "/games/fire-kirin.jpeg", provider: "Fire Kirin", players: 19426, gradient: "from-red-500 via-orange-600 to-red-900", popular: true, trending: true, promotional: true, topRated: true },
  { id: "16", name: "MR All In One", slug: "mr-all-in-one", image: "/games/mr-all-in-one.jpeg", provider: "MR All In One", players: 18200, gradient: "from-amber-400 via-orange-500 to-yellow-700", popular: true, trending: true, promotional: true },
  { id: "11", name: "Cash Machine", slug: "cash-machine", image: "/games/cash-machine.jpeg", provider: "Cash Machine", players: 17836, gradient: "from-emerald-500 via-green-600 to-teal-900", trending: true, promotional: true },
  { id: "10", name: "Cash Frenzy", slug: "cash-frenzy", image: "/games/cash-frenzy.jpeg", provider: "Cash Frenzy", players: 17783, gradient: "from-lime-500 via-green-500 to-emerald-800", trending: true, promotional: true },
  { id: "4", name: "Panda Master", slug: "panda-master", image: "/games/panda-master.jpeg", provider: "Panda Master", players: 17586, gradient: "from-pink-400 via-rose-500 to-pink-900", popular: true, trending: true },
  { id: "13", name: "Vblink", slug: "vblink", image: "/games/vblink.jpeg", provider: "Vblink", players: 17435, gradient: "from-cyan-400 via-sky-600 to-blue-900", trending: true, promotional: true },
  { id: "9", name: "Milky Way", slug: "milky-way", image: "/games/milky-way.jpeg", provider: "Milky Way", players: 17176, gradient: "from-violet-400 via-purple-600 to-indigo-900", trending: true, promotional: true, topRated: true },
  { id: "6", name: "Vegas Sweeps", slug: "vegas-sweeps", image: "/games/vegas-sweeps.jpeg", provider: "Vegas Sweeps", players: 16510, gradient: "from-yellow-400 via-amber-500 to-orange-800", popular: true, trending: true, promotional: true },
  { id: "12", name: "Mafia", slug: "mafia", image: "/games/mafia.jpeg", provider: "Mafia", players: 16449, gradient: "from-neutral-600 via-stone-700 to-neutral-900", trending: true, promotional: true },
];

export type GameTab = "all" | "popular" | "trending" | "upcoming" | "promotional" | "topRated";

export type HomeGameTab = "trending" | "all" | "promotional";

export function filterGames(tab: GameTab, search: string): Game[] {
  let list = [...GAMES].sort((a, b) => b.players - a.players);

  if (tab === "popular") list = list.filter((g) => g.popular);
  if (tab === "trending") list = list.filter((g) => g.trending);
  if (tab === "upcoming") list = list.filter((g) => g.upcoming);
  if (tab === "promotional") list = list.filter((g) => g.promotional);
  if (tab === "topRated") list = list.filter((g) => g.topRated);

  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (g) => g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)
    );
  }

  return list;
}

export function filterHomeGames(tab: HomeGameTab, search: string): Game[] {
  const map: Record<HomeGameTab, GameTab> = {
    trending: "trending",
    all: "all",
    promotional: "promotional",
  };
  return filterGames(map[tab], search);
}

export function formatPlayers(n: number) {
  return n.toLocaleString();
}
