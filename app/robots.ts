import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/**
 * Robots.txt Configuration
 * ========================
 * - sitemap.xml: Standard sitemap for search engines
 * - llms.txt: AI-focused content file at /llms.txt (served from public/llms.txt)
 *   This follows the emerging llms.txt standard for AI crawlers
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/_next/",
          "/success",
        ],
      },
      // Explicitly allow AI search crawlers for deep indexing
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
      {
        userAgent: "Amazonbot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
      {
        userAgent: "Bytespider",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/success"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
