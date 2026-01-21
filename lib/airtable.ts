import { cache } from "react";
import { mockCompanies, mockQuestions } from "./mockData";
import { Company, Question, CodeExample } from "./types";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_QUESTIONS_TABLE =
  process.env.AIRTABLE_QUESTIONS_TABLE || "Questions";

const hasAirtableConfig = Boolean(AIRTABLE_API_KEY && AIRTABLE_BASE_ID);

const airtableFetch = async (path: string) => {
  console.log("[Airtable] Fetching:", path);

  try {
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
  } catch (error) {
    console.error("[Airtable] Fetch error:", error);
    throw error;
  }
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

const parseExamples = (value: unknown): CodeExample[] | undefined => {
  if (!value) return undefined;

  // If it's already an array of objects
  if (Array.isArray(value)) {
    return value.map(ex => ({
      input: String(ex.input ?? ""),
      output: String(ex.output ?? ""),
      explanation: ex.explanation ? String(ex.explanation) : undefined
    }));
  }

  // If it's a JSON string
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(ex => ({
          input: String(ex.input ?? ""),
          output: String(ex.output ?? ""),
          explanation: ex.explanation ? String(ex.explanation) : undefined
        }));
      }
    } catch {
      // Not valid JSON, try parsing as formatted text
      // Format: "Input: ...\nOutput: ...\n---"
      const examples: CodeExample[] = [];
      const blocks = value.split("---").filter(Boolean);
      for (const block of blocks) {
        // Use [\s\S]+? to match across newlines (multi-line inputs/outputs)
        const inputMatch = block.match(/Input:\s*([\s\S]+?)(?=Output:|$)/i);
        const outputMatch = block.match(/Output:\s*([\s\S]+?)(?=Explanation:|$)/i);
        const explanationMatch = block.match(/Explanation:\s*([\s\S]+?)$/i);
        if (inputMatch && outputMatch) {
          examples.push({
            input: inputMatch[1].trim(),
            output: outputMatch[1].trim(),
            explanation: explanationMatch ? explanationMatch[1].trim() : undefined
          });
        }
      }
      return examples.length > 0 ? examples : undefined;
    }
  }

  return undefined;
};

const parseConstraints = (value: unknown): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    // Split by newlines or semicolons
    return value.split(/[\n;]/).map(c => c.trim()).filter(Boolean);
  }
  return undefined;
};

const parseHints = (value: unknown): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    return value.split(/[\n,]/).map(h => h.trim()).filter(Boolean);
  }
  return undefined;
};

// Map your Airtable fields to our Question type
const toQuestion = (record: any): Question => {
  const fields = record.fields ?? {};

  // Build tags from "Asked during" field (e.g., "system design, coding, onsite")
  const tags: string[] = [];
  if (fields["Asked during"]) {
    tags.push(...normalizeTags(fields["Asked during"]));
  }
  // Also support Category/Subcategory if present
  if (fields.Category) tags.push(...normalizeTags(fields.Category));
  if (fields.Subcategory) tags.push(...normalizeTags(fields.Subcategory));

  // Map difficulty from AI estimate or Frequency
  let difficultyLabel: string | undefined;
  const aiDifficulty = fields["AI Difficulty Estimate"];
  if (aiDifficulty && typeof aiDifficulty === "object" && aiDifficulty.value) {
    difficultyLabel = String(aiDifficulty.value);
  } else if (fields.Difficulty) {
    difficultyLabel = fields.Difficulty;
  } else if (fields.Frequency) {
    // Map frequency to difficulty: 1-3 = Easy, 4-6 = Medium, 7+ = Hard
    const freq = Number(fields.Frequency);
    if (freq >= 7) difficultyLabel = "Hard";
    else if (freq >= 4) difficultyLabel = "Medium";
    else difficultyLabel = "Easy";
  }

  return {
    id: record.id,
    title: fields.Question ?? fields.Title ?? "Untitled",
    prompt: fields.Content ?? fields.Description ?? fields.Question ?? "",
    tags,
    difficultyLabel,
    difficultyScore: fields.Frequency ? Number(fields.Frequency) : undefined,
    companySlug: fields.Company ? toSlug(fields.Company) : undefined,
    companyName: fields.Company,
    lastVerified: fields["Last Reported"] ?? fields["Last Updated"],
    // Coding-specific fields (optional)
    language: fields.Language,
    starterCode: fields["Starter Code"] ?? fields.StarterCode,
    constraints: parseConstraints(fields.Constraints),
    examples: parseExamples(fields.Examples),
    hints: parseHints(fields.Hints),
    expectedComplexity: (fields.TimeComplexity || fields["Time Complexity"] || fields.SpaceComplexity || fields["Space Complexity"]) ? {
      time: fields.TimeComplexity ?? fields["Time Complexity"],
      space: fields.SpaceComplexity ?? fields["Space Complexity"]
    } : undefined
  };
};

// Fetch all questions and derive companies from them
const fetchAllQuestions = cache(async (): Promise<Question[]> => {
  if (!hasAirtableConfig) {
    console.log("[Airtable] No config, using mock data");
    return mockQuestions;
  }

  try {
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

    // Filter out questions that don't have both a title and content
    const validQuestions = allQuestions.filter(q => 
      q.title && 
      q.title !== "Untitled" && 
      q.prompt && 
      q.prompt.trim().length > 0
    );

    console.log(`[Airtable] Loaded ${validQuestions.length} valid questions (filtered from ${allQuestions.length})`);
    return validQuestions;
  } catch (error) {
    console.error("[Airtable] Failed to fetch, falling back to mock data:", error);
    return mockQuestions;
  }
});

// Derive companies from questions (no separate Companies table needed)
export const getCompanies = cache(async (): Promise<Company[]> => {
  const questions = await fetchAllQuestions();

  // If we got mock questions, return mock companies
  if (questions === mockQuestions) {
    return mockCompanies;
  }
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
