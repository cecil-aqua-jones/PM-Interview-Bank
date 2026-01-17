import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://productleaks.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/company/*/", // Protect paid content from crawlers
          "/_next/",
          "/success"
        ]
      },
      {
        userAgent: "GPTBot",
        disallow: "/" // Block AI training bots
      },
      {
        userAgent: "CCBot",
        disallow: "/" // Block Common Crawl
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
