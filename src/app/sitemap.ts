import type { MetadataRoute } from "next";
import { SITE_URL, PUBLIC_ROUTES } from "@/lib/constants";
import { GAMES } from "@/lib/games";
import { getGameSitemapPriority } from "@/lib/seo/game-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.path === "/" ? ("daily" as const) : ("weekly" as const),
    priority: route.priority,
  }));

  const gameRoutes = GAMES.filter((g) => !g.upcoming).map((game) => ({
    url: `${SITE_URL}/games/${game.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: getGameSitemapPriority(game),
  }));

  return [...staticRoutes, ...gameRoutes];
}
