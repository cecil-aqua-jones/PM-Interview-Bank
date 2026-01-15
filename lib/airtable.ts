import { cache } from "react";
import { mockCompanies, mockQuestions } from "./mockData";
import { Company, Question } from "./types";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_COMPANIES_TABLE =
  process.env.AIRTABLE_COMPANIES_TABLE || "Companies";
const AIRTABLE_QUESTIONS_TABLE =
  process.env.AIRTABLE_QUESTIONS_TABLE || "Questions";

const hasAirtableConfig = Boolean(AIRTABLE_API_KEY && AIRTABLE_BASE_ID);

const airtableFetch = async (path: string) => {
  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`
    },
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Airtable request failed: ${response.status}`);
  }

  return response.json();
};

const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((tag) => typeof tag === "string");
  }
  if (typeof value === "string") {
    return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
};

const toCompany = (record: any): Company => ({
  id: record.id,
  name: record.fields?.Name ?? "Unknown",
  slug: record.fields?.Slug ?? "unknown",
  questionCount: record.fields?.QuestionCount
});

const toQuestion = (record: any): Question => ({
  id: record.id,
  title: record.fields?.Title ?? "Untitled",
  prompt: record.fields?.Prompt ?? "",
  tags: normalizeTags(record.fields?.Tags),
  difficultyLabel: record.fields?.DifficultyLabel,
  difficultyScore: record.fields?.DifficultyScore,
  companySlug: record.fields?.CompanySlug,
  requirements: normalizeTags(record.fields?.Requirements)
});

export const getCompanies = cache(async (): Promise<Company[]> => {
  if (!hasAirtableConfig) {
    return mockCompanies;
  }

  const url = new URL(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_COMPANIES_TABLE}`
  );

  const data = await airtableFetch(url.toString());
  return data.records.map(toCompany);
});

export const getCompanyBySlug = cache(
  async (slug: string): Promise<Company | null> => {
    if (!hasAirtableConfig) {
      return mockCompanies.find((company) => company.slug === slug) ?? null;
    }

    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_COMPANIES_TABLE}`
    );
    url.searchParams.set("filterByFormula", `{Slug}='${slug}'`);

    const data = await airtableFetch(url.toString());
    if (!data.records.length) {
      return null;
    }

    return toCompany(data.records[0]);
  }
);

export const getQuestionsByCompany = cache(
  async (companySlug?: string): Promise<Question[]> => {
    if (!hasAirtableConfig) {
      return companySlug
        ? mockQuestions.filter((question) => question.companySlug === companySlug)
        : mockQuestions;
    }

    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_QUESTIONS_TABLE}`
    );

    if (companySlug) {
      url.searchParams.set("filterByFormula", `{CompanySlug}='${companySlug}'`);
    }

    const data = await airtableFetch(url.toString());
    return data.records.map(toQuestion);
  }
);
