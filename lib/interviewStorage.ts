"use client";

import { CodingEvaluationResult } from "./codingRubric";
import { BehavioralEvaluationResult } from "./behavioralRubric";
import { SystemDesignEvaluationResult } from "./systemDesignRubric";
import { QuestionType } from "./types";

const STORAGE_KEY = "interview_scores";
const MAX_AGE_DAYS = 30;

// Base interview record fields
type BaseInterviewRecord = {
  questionId: string;
  score: number;
  timestamp: number;
  transcript?: string;
};

// Coding interview record
export type CodingInterviewRecord = BaseInterviewRecord & {
  type: "coding";
  evaluation: CodingEvaluationResult;
  code: string;
  language: string;
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[];
};

// Behavioral interview record
export type BehavioralInterviewRecord = BaseInterviewRecord & {
  type: "behavioral";
  evaluation: BehavioralEvaluationResult;
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[];
};

// System design interview record
export type SystemDesignInterviewRecord = BaseInterviewRecord & {
  type: "system_design";
  evaluation: SystemDesignEvaluationResult;
  diagramDescription?: string;
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[];
};

// Union type for all interview records
export type InterviewRecord = CodingInterviewRecord | BehavioralInterviewRecord | SystemDesignInterviewRecord;

type StorageData = {
  [questionId: string]: InterviewRecord;
};

function getStorage(): StorageData {
  if (typeof window === "undefined") return {};

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};

    const parsed = JSON.parse(data) as StorageData;

    // Clean up old entries
    const now = Date.now();
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const cleaned: StorageData = {};

    for (const [id, record] of Object.entries(parsed)) {
      if (now - record.timestamp < maxAge) {
        cleaned[id] = record;
      }
    }

    // Save cleaned data if anything was removed
    if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch (error) {
    console.error("[InterviewStorage] Error reading storage:", error);
    return {};
  }
}

function setStorage(data: StorageData): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("[InterviewStorage] Error writing storage:", error);
  }
}

/**
 * Save a coding interview result
 */
export function saveCodingInterview(
  questionId: string,
  evaluation: CodingEvaluationResult,
  code: string,
  language: string,
  transcript?: string,
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[]
): void {
  const data = getStorage();

  data[questionId] = {
    type: "coding",
    questionId,
    score: evaluation.overallScore,
    evaluation,
    code,
    language,
    transcript,
    conversationHistory,
    timestamp: Date.now(),
  };

  setStorage(data);
}

/**
 * Save a behavioral interview result
 */
export function saveBehavioralInterview(
  questionId: string,
  evaluation: BehavioralEvaluationResult,
  transcript: string,
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[]
): void {
  const data = getStorage();

  data[questionId] = {
    type: "behavioral",
    questionId,
    score: evaluation.overallScore,
    evaluation,
    transcript,
    conversationHistory,
    timestamp: Date.now(),
  };

  setStorage(data);
}

/**
 * Legacy save function for backwards compatibility
 * @deprecated Use saveCodingInterview or saveBehavioralInterview instead
 */
export function saveInterview(
  questionId: string,
  evaluation: CodingEvaluationResult,
  code: string,
  language: string,
  transcript?: string,
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[]
): void {
  saveCodingInterview(questionId, evaluation, code, language, transcript, conversationHistory);
}

export function getInterview(questionId: string): InterviewRecord | null {
  const data = getStorage();
  return data[questionId] ?? null;
}

export function getCodingInterview(questionId: string): CodingInterviewRecord | null {
  const record = getInterview(questionId);
  if (record && record.type === "coding") {
    return record as CodingInterviewRecord;
  }
  // Handle legacy records without type field
  if (record && !("type" in record) && "code" in record) {
    // Legacy record - cast and add type
    const legacyRecord = record as unknown as Omit<CodingInterviewRecord, "type">;
    return { ...legacyRecord, type: "coding" as const };
  }
  return null;
}

export function getBehavioralInterview(questionId: string): BehavioralInterviewRecord | null {
  const record = getInterview(questionId);
  if (record && record.type === "behavioral") {
    return record as BehavioralInterviewRecord;
  }
  return null;
}

/**
 * Save a system design interview result
 */
export function saveSystemDesignInterview(
  questionId: string,
  evaluation: SystemDesignEvaluationResult,
  transcript: string,
  diagramDescription?: string,
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[]
): void {
  const data = getStorage();

  data[questionId] = {
    type: "system_design",
    questionId,
    score: evaluation.overallScore,
    evaluation,
    transcript,
    diagramDescription,
    conversationHistory,
    timestamp: Date.now(),
  };

  setStorage(data);
}

export function getSystemDesignInterview(questionId: string): SystemDesignInterviewRecord | null {
  const record = getInterview(questionId);
  if (record && record.type === "system_design") {
    return record as SystemDesignInterviewRecord;
  }
  return null;
}

export function clearInterview(questionId: string): void {
  const data = getStorage();
  delete data[questionId];
  setStorage(data);
}

export function getAllInterviews(): InterviewRecord[] {
  const data = getStorage();
  return Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
}

export function getInterviewsByType(type: QuestionType): InterviewRecord[] {
  return getAllInterviews().filter(r => r.type === type);
}

export function getInterviewScore(questionId: string): number | null {
  const record = getInterview(questionId);
  return record?.score ?? null;
}
