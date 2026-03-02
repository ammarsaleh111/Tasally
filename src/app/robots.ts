import type { MetadataRoute } from "next";
import { isProductionDeploy, siteUrl } from "@/lib/seo";

export const runtime = "edge";

export default function robots(): MetadataRoute.Robots {
  if (!isProductionDeploy) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/login",
          "/profile",
          "/groups",
          "/groups/",
          "/badges",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
