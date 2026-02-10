import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Leaderboards",
  description:
    "Track daily and monthly rankings across all Ammar Times puzzle games.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
      "max-image-preview": "none",
      "max-video-preview": 0,
    },
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
