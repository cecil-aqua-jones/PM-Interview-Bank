import { cache } from "react";
import { mockCompanies, mockQuestions } from "./mockData";
import { Company, Question } from "./types";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_QUESTIONS_TABLE =
  process.env.AIRTABLE_QUESTIONS_TABLE || "Questions";

const hasAirtableConfig = Boolean(AIRTABLE_API_KEY && AIRTABLE_BASE_ID);

const airtableFetch = async (path: string) => {
  console.log("[Airtable] Fetching:", path);

  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`
    },
    // Use Next.js revalidation (ISR) - revalidate every 60 seconds
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Airtable] Error response:", response.status, errorBody);
    throw new Error(`Airtable request failed: ${response.status} - ${errorBody}`);
  }

  return response.json();
};

const toSlug = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((tag) => typeof tag === "string");
  }
  if (typeof value === "string") {
    return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
};

// Map your Airtable fields to our Question type
const toQuestion = (record: any): Question => {
  const fields = record.fields ?? {};
  const category = fields.Category;
  const subcategory = fields.Subcategory;
  
  // Combine Category + Subcategory into tags
  const tags: string[] = [];
  if (category) tags.push(...normalizeTags(category));
  if (subcategory) tags.push(...normalizeTags(subcategory));

  return {
    id: record.id,
    title: fields.Question ?? "Untitled",
    prompt: fields.Question ?? "", // Using Question as both title and prompt
    tags,
    difficultyLabel: fields["Frequent?"] ? "Frequent" : undefined,
    companySlug: fields.Company ? toSlug(fields.Company) : undefined,
    companyName: fields.Company,
    lastVerified: fields["Last verified"]
  };
};

// Fetch all questions and derive companies from them
const fetchAllQuestions = cache(async (): Promise<Question[]> => {
  if (!hasAirtableConfig) {
    return mockQuestions;
  }

  const allQuestions: Question[] = [];
  let offset: string | undefined;

  // Paginate through all records
  do {
    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_QUESTIONS_TABLE}`
    );
    if (offset) {
      url.searchParams.set("offset", offset);
    }

    const data = await airtableFetch(url.toString());
    allQuestions.push(...data.records.map(toQuestion));
    offset = data.offset;
  } while (offset);

  return allQuestions;
});

// Derive companies from questions (no separate Companies table needed)
export const getCompanies = cache(async (): Promise<Company[]> => {
  if (!hasAirtableConfig) {
    return mockCompanies;
  }

  const questions = await fetchAllQuestions();
  const companyMap = new Map<string, { name: string; count: number }>();

  for (const q of questions) {
    if (q.companySlug && q.companyName) {
      const existing = companyMap.get(q.companySlug);
      if (existing) {
        existing.count++;
      } else {
        companyMap.set(q.companySlug, { name: q.companyName, count: 1 });
      }
    }
  }

  return Array.from(companyMap.entries())
    .map(([slug, { name, count }]) => ({
      id: slug,
      name,
      slug,
      questionCount: count
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

export const getCompanyBySlug = cache(
  async (slug: string): Promise<Company | null> => {
    const companies = await getCompanies();
    return companies.find((c) => c.slug === slug) ?? null;
  }
);

export const getQuestionsByCompany = cache(
  async (companySlug?: string): Promise<Question[]> => {
    const questions = await fetchAllQuestions();

    if (companySlug) {
      return questions.filter((q) => q.companySlug === companySlug);
    }

    return questions;
  }
);
