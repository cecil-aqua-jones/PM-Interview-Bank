import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Company, Question, CodeExample } from "./types";
import { quickSanitize, isIncomplete, hasUnformattedCode, formatForDisplay } from "./questionSanitizer";
import { TARGET_COMPANIES, assignCompanyToQuestion, findTargetCompany } from "./companyMapping";

// Production-only: These environment variables MUST be set
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_QUESTIONS_TABLE = process.env.AIRTABLE_QUESTIONS_TABLE || "Questions";

// Log configuration status on module load (helps debug deployment issues)
console.log("[Airtable] Config check:", {
  hasApiKey: !!AIRTABLE_API_KEY,
  hasBaseId: !!AIRTABLE_BASE_ID,
  tableName: AIRTABLE_QUESTIONS_TABLE,
});

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
  } else if (fields.Frequency !== undefined || fields.Freq !== undefined) {
    // Map frequency to difficulty: 1-3 = Easy, 4-6 = Medium, 7+ = Hard
    // Support both "Frequency" and "Freq" field names
    // Use !== undefined to handle frequency value of 0 correctly
    const freq = Number(fields.Frequency ?? fields.Freq);
    if (freq >= 7) difficultyLabel = "Hard";
    else if (freq >= 4) difficultyLabel = "Medium";
    else difficultyLabel = "Easy";
  }

  // Get raw content
  const rawTitle = fields.Question ?? fields.Title ?? "Untitled";
  const rawPrompt = fields.Content ?? fields.Description ?? fields.Question ?? "";
  
  // Apply quick sanitization to clean up formatting
  const sanitizedPrompt = quickSanitize(rawPrompt);
  const sanitizedTitle = rawTitle.trim();
  
  // Check if this question needs AI enhancement (incomplete or has unformatted code)
  const needsAIEnhancement = isIncomplete(rawPrompt) || hasUnformattedCode(sanitizedPrompt);
  
  return {
    id: record.id,
    title: sanitizedTitle,
    prompt: sanitizedPrompt,
    tags,
    difficultyLabel,
    difficultyScore: (fields.Frequency !== undefined || fields.Freq !== undefined) ? Number(fields.Frequency ?? fields.Freq) : undefined,
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
    } : undefined,
    // Flag for questions that may need AI enhancement
    needsAIEnhancement,
  };
};

// Core fetch function (not cached - wrapped by caching layers)
const fetchAllQuestionsCore = async (): Promise<Question[]> => {
  // Production: Require Airtable configuration - no fallbacks
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    const errorMsg = `[Airtable] FATAL: Missing required environment variables. API_KEY: ${!!AIRTABLE_API_KEY}, BASE_ID: ${!!AIRTABLE_BASE_ID}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  console.log("[Airtable] Fetching all questions from Airtable...");
  
  const allQuestions: Question[] = [];
  let offset: string | undefined;
  let pageCount = 0;

  // Paginate through all records
  do {
    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_QUESTIONS_TABLE)}`
    );
    if (offset) {
      url.searchParams.set("offset", offset);
    }

    pageCount++;
    console.log(`[Airtable] Fetching page ${pageCount}...`);
    
    const data = await airtableFetch(url.toString());
    const pageQuestions = data.records.map(toQuestion);
    allQuestions.push(...pageQuestions);
    console.log(`[Airtable] Page ${pageCount}: Got ${pageQuestions.length} records (total: ${allQuestions.length})`);
    
    offset = data.offset;
  } while (offset);

  // Filter out questions that don't have both a title and content
  const validQuestions = allQuestions.filter(q => 
    q.title && 
    q.title !== "Untitled" && 
    q.prompt && 
    q.prompt.trim().length > 0
  );

  console.log(`[Airtable] COMPLETE: Loaded ${validQuestions.length} valid questions (filtered from ${allQuestions.length} total)`);
  return validQuestions;
};

// Cross-request cache using Next.js unstable_cache
// This caches the Airtable data across ALL requests for 60 seconds
// Prevents multiple simultaneous requests from each hitting Airtable
const fetchAllQuestionsCached = unstable_cache(
  fetchAllQuestionsCore,
  ["airtable-questions"], // Cache key
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ["questions"], // Tag for on-demand revalidation if needed
  }
);

// Fetch all questions and derive companies from them
// Uses React cache for deduplication within a single request
// AND unstable_cache for cross-request caching
const fetchAllQuestions = cache(async (): Promise<Question[]> => {
  return fetchAllQuestionsCached();
});

// Return only the 13 target companies with question counts based on mapping
export const getCompanies = cache(async (): Promise<Company[]> => {
  const questions = await fetchAllQuestions();
  
  // Count questions per target company using the mapping
  const companyCounts = new Map<string, number>();
  TARGET_COMPANIES.forEach(c => companyCounts.set(c.slug, 0));

  for (const q of questions) {
    const assigned = assignCompanyToQuestion(q);
    companyCounts.set(assigned.slug, (companyCounts.get(assigned.slug) || 0) + 1);
  }

  const companies = TARGET_COMPANIES.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    questionCount: companyCounts.get(c.slug) || 0
  }));

  console.log(`[Airtable] Mapped ${questions.length} questions across ${companies.length} target companies`);
  return companies;
});

export const getCompanyBySlug = cache(
  async (slug: string): Promise<Company | null> => {
    // First check if it's one of our target companies
    const targetCompany = findTargetCompany(slug);
    if (!targetCompany) {
      return null;
    }
    
    // Get the full company data with question count
    const companies = await getCompanies();
    return companies.find((c) => c.slug === slug) ?? null;
  }
);

export const getQuestionsByCompany = cache(
  async (companySlug?: string): Promise<Question[]> => {
    const questions = await fetchAllQuestions();

    if (companySlug) {
      // Filter questions using the mapping function
      return questions.filter((q) => {
        const assigned = assignCompanyToQuestion(q);
        return assigned.slug === companySlug;
      }).map(q => {
        // Update the question's company fields to reflect the mapped company
        const assigned = assignCompanyToQuestion(q);
        return {
          ...q,
          companySlug: assigned.slug,
          companyName: assigned.name,
        };
      });
    }

    // When returning all questions, also update their company assignments
    return questions.map(q => {
      const assigned = assignCompanyToQuestion(q);
      return {
        ...q,
        companySlug: assigned.slug,
        companyName: assigned.name,
      };
    });
  }
);
