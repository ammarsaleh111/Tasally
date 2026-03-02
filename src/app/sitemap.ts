import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { MONTH_KEYS } from "@/data/all-data/manifest";

export const runtime = "edge";

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
  { path: "/themes", changeFrequency: "weekly", priority: 0.7 },
  { path: "/faq", changeFrequency: "weekly", priority: 0.84 },
  { path: "/how-to-play", changeFrequency: "weekly", priority: 0.8 },
  { path: "/word-games", changeFrequency: "weekly", priority: 0.75 },
  { path: "/daily-puzzle-games", changeFrequency: "weekly", priority: 0.88 },
  { path: "/puzzle-games", changeFrequency: "weekly", priority: 0.75 },
  { path: "/daily-puzzle-archive", changeFrequency: "daily", priority: 0.7 },
  { path: "/about-tasally", changeFrequency: "weekly", priority: 0.88 },
  { path: "/what-is-tasally", changeFrequency: "weekly", priority: 0.86 },
  { path: "/tasally-games", changeFrequency: "weekly", priority: 0.9 },
  { path: "/تسالي", changeFrequency: "weekly", priority: 0.9 },
  { path: "/العاب-تسالي", changeFrequency: "weekly", priority: 0.9 },
  { path: "/العاب-ذكاء-يومية", changeFrequency: "weekly", priority: 0.88 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const archiveMonthEntries: typeof entries = MONTH_KEYS.map((month) => ({
    path: `/daily-puzzle-archive?month=${month}`,
    changeFrequency: "monthly" as const,
    priority: 0.64,
    images: undefined,
  }));

  return [...entries, ...archiveMonthEntries].map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
    ...(entry.images && {
      images: entry.images.map((img) => absoluteUrl(img)),
    }),
  }));
}
