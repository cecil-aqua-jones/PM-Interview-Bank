import { MetadataRoute } from "next";
import { getCompanies } from "@/lib/airtable";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.apexinterviewer.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${siteUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9
    }
  ];

  // Dynamic company pages
  let companyPages: MetadataRoute.Sitemap = [];
  
  try {
    const companies = await getCompanies();
    companyPages = companies.map((company) => ({
      url: `${siteUrl}/dashboard/company/${company.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8
    }));
  } catch (error) {
    console.error("[Sitemap] Error fetching companies:", error);
  }

  return [...staticPages, ...companyPages];
}
