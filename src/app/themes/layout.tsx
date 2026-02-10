import type { Metadata } from "next";
import type { ReactNode } from "react";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Theme Settings",
  description:
    "Explore seasonal themes, visual styles, and event skins in Ammar Times.",
  alternates: {
    canonical: "/themes",
  },
  openGraph: {
    title: "Themes | Ammar Times",
    description:
      "Customize game appearance with seasonal styles and event themes.",
    url: absoluteUrl("/themes"),
  },
  twitter: {
    title: "Themes | Ammar Times",
    description:
      "Customize game appearance with seasonal styles and event themes.",
  },
};

export default function ThemesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
