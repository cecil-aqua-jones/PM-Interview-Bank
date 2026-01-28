/**
 * Company Mapping Module
 * 
 * Redistributes all questions across 13 target companies using:
 * 1. Category-based mapping for specialized topics (AI/ML -> AI companies, etc.)
 * 2. Even distribution for behavioral questions across all companies
 * 3. Even distribution for generic coding questions
 */

import { Question, getQuestionType } from "./types";

// The 13 target companies
export const TARGET_COMPANIES = [
  { id: "google", name: "Google", slug: "google" },
  { id: "meta", name: "Meta", slug: "meta" },
  { id: "apple", name: "Apple", slug: "apple" },
  { id: "microsoft", name: "Microsoft", slug: "microsoft" },
  { id: "netflix", name: "Netflix", slug: "netflix" },
  { id: "tiktok", name: "TikTok", slug: "tiktok" },
  { id: "uber", name: "Uber", slug: "uber" },
  { id: "amazon", name: "Amazon", slug: "amazon" },
  { id: "openai", name: "OpenAI", slug: "openai" },
  { id: "anthropic", name: "Anthropic", slug: "anthropic" },
  { id: "perplexity", name: "Perplexity", slug: "perplexity" },
  { id: "xai", name: "xAI", slug: "xai" },
  { id: "oracle", name: "Oracle", slug: "oracle" },
] as const;

export type TargetCompany = typeof TARGET_COMPANIES[number];

// Tag-to-company mapping for category-based distribution
// Each tag maps to an array of company slugs that are thematically relevant
const TAG_COMPANY_MAP: Record<string, string[]> = {
  // AI/ML/LLM Topics → AI frontier companies
  "machine learning": ["openai", "anthropic", "perplexity", "xai"],
  "ml": ["openai", "anthropic", "perplexity", "xai"],
  "ai": ["openai", "anthropic", "perplexity", "xai"],
  "llm": ["openai", "anthropic", "perplexity", "xai"],
  "neural network": ["openai", "anthropic"],
  "deep learning": ["openai", "anthropic"],
  "nlp": ["openai", "anthropic", "perplexity"],
  "natural language": ["openai", "anthropic", "perplexity"],
  "transformer": ["openai", "anthropic"],
  "gpt": ["openai"],
  "language model": ["openai", "anthropic", "perplexity"],
  
  // Infrastructure/Scale Topics → Big tech
  "distributed systems": ["google", "amazon", "meta"],
  "distributed": ["google", "amazon", "meta"],
  "scalability": ["google", "amazon", "meta"],
  "load balancing": ["google", "amazon"],
  "microservices": ["amazon", "google", "uber"],
  "kubernetes": ["google", "amazon"],
  "docker": ["google", "amazon", "microsoft"],
  "cdn": ["amazon", "netflix", "meta"],
  "caching": ["google", "amazon", "meta"],
  
  // Mobile/Consumer Topics → Consumer-focused companies
  "mobile": ["apple", "tiktok", "meta"],
  "ios": ["apple"],
  "swift": ["apple"],
  "android": ["google", "meta"],
  "streaming": ["netflix", "tiktok"],
  "video": ["netflix", "tiktok", "meta"],
  "media": ["netflix", "tiktok", "meta"],
  "consumer": ["apple", "meta", "netflix"],
  
  // Enterprise/Cloud Topics → Enterprise companies
  "enterprise": ["microsoft", "oracle"],
  "cloud": ["amazon", "microsoft", "google"],
  "azure": ["microsoft"],
  "aws": ["amazon"],
  "gcp": ["google"],
  "database": ["oracle", "amazon", "google"],
  "sql": ["oracle", "microsoft"],
  "nosql": ["amazon", "google"],
  "security": ["microsoft", "google"],
  "authentication": ["microsoft", "google", "meta"],
  "encryption": ["microsoft", "google"],
  
  // Transportation/Logistics → Uber
  "geolocation": ["uber", "google"],
  "maps": ["uber", "google", "apple"],
  "routing": ["uber", "google"],
  "location": ["uber", "google", "apple"],
  "ride": ["uber"],
  "delivery": ["uber", "amazon"],
  "logistics": ["uber", "amazon"],
  
  // Social/Feed Topics → Social companies
  "social": ["meta", "tiktok"],
  "feed": ["meta", "tiktok"],
  "recommendation": ["netflix", "tiktok", "meta"],
  "content": ["meta", "tiktok", "netflix"],
  "news feed": ["meta", "tiktok"],
  "timeline": ["meta", "tiktok"],
  "messaging": ["meta", "apple", "microsoft"],
  "chat": ["meta", "microsoft"],
  
  // E-commerce → Amazon
  "ecommerce": ["amazon"],
  "e-commerce": ["amazon"],
  "shopping": ["amazon"],
  "inventory": ["amazon", "oracle"],
  "payment": ["amazon", "apple"],
  "checkout": ["amazon"],
  
  // Search/Information Retrieval
  "search": ["google", "perplexity", "amazon"],
  "indexing": ["google", "perplexity"],
  "ranking": ["google", "perplexity", "netflix"],
  
  // Data/Analytics
  "analytics": ["google", "meta", "oracle"],
  "data pipeline": ["google", "amazon", "meta"],
  "etl": ["google", "amazon", "oracle"],
  "data warehouse": ["google", "amazon", "oracle"],
  "big data": ["google", "amazon", "meta"],
};

/**
 * Simple deterministic hash function for strings
 * Used to consistently assign questions to companies
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Assigns a company to a question based on:
 * 1. Question type (behavioral = even distribution)
 * 2. Tag-based mapping for specialized topics
 * 3. Default even distribution for generic questions
 */
export function assignCompanyToQuestion(question: Question): { slug: string; name: string } {
  const questionType = getQuestionType(question);
  const tagsLower = question.tags.map(t => t.toLowerCase());
  const questionHash = simpleHash(question.id);
  
  // 1. For behavioral questions: distribute evenly across all companies
  // This ensures every company has behavioral interview content
  if (questionType === "behavioral") {
    const index = questionHash % TARGET_COMPANIES.length;
    return {
      slug: TARGET_COMPANIES[index].slug,
      name: TARGET_COMPANIES[index].name,
    };
  }
  
  // 2. Check for tag-based mapping (for system design and specialized coding)
  for (const tag of tagsLower) {
    // Check each key in the map
    for (const [mapKey, candidates] of Object.entries(TAG_COMPANY_MAP)) {
      if (tag.includes(mapKey) || mapKey.includes(tag)) {
        // Found a match - pick a company from candidates deterministically
        const candidateIndex = questionHash % candidates.length;
        const selectedSlug = candidates[candidateIndex];
        const company = TARGET_COMPANIES.find(c => c.slug === selectedSlug);
        if (company) {
          return {
            slug: company.slug,
            name: company.name,
          };
        }
      }
    }
  }
  
  // 3. Default: distribute evenly across all companies
  // This handles generic coding questions
  const index = questionHash % TARGET_COMPANIES.length;
  return {
    slug: TARGET_COMPANIES[index].slug,
    name: TARGET_COMPANIES[index].name,
  };
}

/**
 * Gets all target companies with their slugs
 */
export function getTargetCompanySlugs(): string[] {
  return TARGET_COMPANIES.map(c => c.slug);
}

/**
 * Finds a target company by slug
 */
export function findTargetCompany(slug: string): TargetCompany | undefined {
  return TARGET_COMPANIES.find(c => c.slug === slug);
}
