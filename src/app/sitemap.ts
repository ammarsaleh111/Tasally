import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const entries: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  images?: string[];
}> = [
  { path: "/", changeFrequency: "daily", priority: 1, images: ["/opengraph-image"] },
  { path: "/games", changeFrequency: "daily", priority: 0.95 },
  { path: "/games/wordle", changeFrequency: "daily", priority: 0.9 },
  { path: "/games/connections", changeFrequency: "daily", priority: 0.9 },
  { path: "/games/crossword", changeFrequency: "daily", priority: 0.9 },
  { path: "/games/numbers", changeFrequency: "daily", priority: 0.85 },
  { path: "/games/trivia", changeFrequency: "daily", priority: 0.85 },
  { path: "/games/strands", changeFrequency: "daily", priority: 0.85 },
  { path: "/games/spelling", changeFrequency: "daily", priority: 0.85 },
  { path: "/games/waffle", changeFrequency: "daily", priority: 0.85 },
  { path: "/games/combinations", changeFrequency: "daily", priority: 0.85 },
  { path: "/leaderboard", changeFrequency: "daily", priority: 0.7 },
  { path: "/themes", changeFrequency: "weekly", priority: 0.7 },
  { path: "/how-to-play", changeFrequency: "weekly", priority: 0.8 },
  { path: "/word-games", changeFrequency: "weekly", priority: 0.75 },
  { path: "/puzzle-games", changeFrequency: "weekly", priority: 0.75 },
  { path: "/daily-puzzle-archive", changeFrequency: "daily", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return entries.map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
    ...(entry.images && {
      images: entry.images.map((img) => absoluteUrl(img)),
    }),
  }));
}
