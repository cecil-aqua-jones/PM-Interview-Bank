"use client";

import { EvaluationResult } from "./pmRubric";

const STORAGE_KEY = "pm_interview_scores";
const MAX_AGE_DAYS = 30;

export type InterviewRecord = {
  questionId: string;
  score: number;
  evaluation: EvaluationResult;
  transcript: string;
  timestamp: number;
};

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

export function saveInterview(
  questionId: string,
  evaluation: EvaluationResult,
  transcript: string
): void {
  const data = getStorage();

  data[questionId] = {
    questionId,
    score: evaluation.overallScore,
    evaluation,
    transcript,
    timestamp: Date.now(),
  };

  setStorage(data);
}

export function getInterview(questionId: string): InterviewRecord | null {
  const data = getStorage();
  return data[questionId] ?? null;
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

export function getInterviewScore(questionId: string): number | null {
  const record = getInterview(questionId);
  return record?.score ?? null;
}
