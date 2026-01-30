/**
 * SEO Utility Library
 * ===================
 * Centralized functions for generating structured data (JSON-LD) schemas.
 * Implements Schema.org vocabulary for rich search results.
 */

import { SITE_URL } from "./constants";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface CourseInfo {
  name: string;
  description: string;
  provider?: string;
  url?: string;
}

export interface ProductInfo {
  name: string;
  description: string;
  image?: string;
  price: number;
  priceCurrency?: string;
  availability?: string;
}

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

export interface ReviewInfo {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate Organization schema for the company
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: "Apex Interviewer",
    url: SITE_URL,
    logo: `${SITE_URL}/ai-owl-mascot.png`,
    description:
      "AI-powered mock interview platform for tech professionals preparing for product management, software engineering, and system design roles.",
    sameAs: [
      // Add social media URLs when available
      // "https://twitter.com/apexinterviewer",
      // "https://linkedin.com/company/apexinterviewer",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@apexinterviewer.com",
      contactType: "customer service",
    },
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Apex Interviewer",
    url: SITE_URL,
    description:
      "Practice coding, system design, and behavioral interviews with AI-powered mock interviews",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/dashboard?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Product schema with pricing
 */
export function generateProductSchema(
  product: ProductInfo,
  review?: ReviewInfo
) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image || `${SITE_URL}/og-image.png`,
    brand: {
      "@type": "Brand",
      name: "Apex Interviewer",
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.priceCurrency || "USD",
      availability:
        product.availability || "https://schema.org/InStock",
      url: `${SITE_URL}/login`,
      seller: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
  };

  if (review) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: review.ratingValue,
      reviewCount: review.reviewCount,
      bestRating: review.bestRating || 5,
      worstRating: review.worstRating || 1,
    };
  }

  return schema;
}

/**
 * Generate Course schema for educational content
 */
export function generateCourseSchema(course: CourseInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: course.provider || "Apex Interviewer",
      url: SITE_URL,
    },
    url: course.url || SITE_URL,
    courseMode: "online",
    isAccessibleForFree: false,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT1H",
    },
  };
}

/**
 * Generate HowTo schema for process explanation
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: HowToStep[],
  totalTime?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    totalTime: totalTime || "PT30M",
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  };
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(
  name: string,
  description: string,
  url: string,
  type: "WebPage" | "AboutPage" | "ContactPage" | "FAQPage" = "WebPage"
) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name,
    description,
    url,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

/**
 * Generate SiteNavigationElement schema for sitelinks
 */
export function generateSiteNavigationSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "SiteNavigationElement",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

/**
 * Generate SoftwareApplication schema
 */
export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Apex Interviewer",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: 75,
      highPrice: 500,
      priceCurrency: "USD",
      offerCount: 2,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: 4.8,
      ratingCount: 150,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Combine multiple schemas into a graph format
 */
export function combineSchemas(schemas: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": schemas.map((schema) => {
      // Remove @context from individual schemas when combining
      const { "@context": _, ...rest } = schema as Record<string, unknown>;
      return rest;
    }),
  };
}

/**
 * Generate default homepage schemas
 */
export function generateHomepageSchemas() {
  return [
    generateOrganizationSchema(),
    generateWebSiteSchema(),
    generateBreadcrumbSchema([
      { name: "Home", url: SITE_URL },
    ]),
  ];
}
