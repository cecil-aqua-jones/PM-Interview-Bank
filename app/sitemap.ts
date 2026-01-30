import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/**
 * Sitemap Generation
 * ==================
 * Generates sitemap.xml for search engine crawlers.
 * Only includes public, indexable pages.
 * 
 * Protected routes (dashboard, company pages) are excluded
 * as they require authentication.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Public pages only - protected routes are excluded
  const pages: MetadataRoute.Sitemap = [
    // Homepage - highest priority
    {
      url: SITE_URL,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // Login page - important for SEO
    {
      url: `${SITE_URL}/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Legal pages
    {
      url: `${SITE_URL}/privacy`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Section anchors for better crawling
    {
      url: `${SITE_URL}/#how-it-works`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/#features`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/#pricing`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/#proof`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/#companies`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Note: Dashboard and company pages are protected behind authentication
  // and are intentionally excluded from the sitemap.
  // They are also blocked in robots.txt for crawlers.

  return pages;
}
