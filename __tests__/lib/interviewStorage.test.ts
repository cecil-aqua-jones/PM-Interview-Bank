/**
 * Interview Storage Test Suite
 * 
 * Tests localStorage-based interview score persistence,
 * including data expiration, retrieval, and cleanup.
 */

import {
  saveInterview,
  getInterview,
  clearInterview,
  getAllInterviews,
  getInterviewScore,
  InterviewRecord,
} from "@/lib/interviewStorage";
import { EvaluationResult } from "@/lib/pmRubric";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((i: number) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Interview Storage", () => {
  const mockEvaluation: EvaluationResult = {
    overallScore: 7,
    breakdown: {
      structure: 7,
      productThinking: 8,
      metrics: 6,
      communication: 7,
      execution: 7,
    },
    strengths: ["Good structure", "Clear communication"],
    improvements: ["Add more metrics", "Consider edge cases"],
    overallFeedback: "Solid response with good product thinking.",
  };

  const mockTranscript = "This is my answer to the product question...";

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe("saveInterview", () => {
    it("should save interview data to localStorage", () => {
      const questionId = "q-123";
      
      saveInterview(questionId, mockEvaluation, mockTranscript);
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );
      expect(savedData[questionId]).toBeDefined();
      expect(savedData[questionId].score).toBe(7);
      expect(savedData[questionId].transcript).toBe(mockTranscript);
    });

    it("should include timestamp in saved record", () => {
      const questionId = "q-456";
      const beforeSave = Date.now();
      
      saveInterview(questionId, mockEvaluation, mockTranscript);
      
      const afterSave = Date.now();
      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );
      
      expect(savedData[questionId].timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(savedData[questionId].timestamp).toBeLessThanOrEqual(afterSave);
    });

    it("should overwrite existing record for same question", () => {
      const questionId = "q-789";
      
      // First save
      saveInterview(questionId, mockEvaluation, "First answer");
      
      // Second save with different evaluation
      const updatedEvaluation = { ...mockEvaluation, overallScore: 9 };
      saveInterview(questionId, updatedEvaluation, "Better answer");
      
      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[1][1]
      );
      
      expect(savedData[questionId].score).toBe(9);
      expect(savedData[questionId].transcript).toBe("Better answer");
    });

    it("should preserve other questions when saving new one", () => {
      saveInterview("q-1", mockEvaluation, "Answer 1");
      saveInterview("q-2", mockEvaluation, "Answer 2");
      
      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[1][1]
      );
      
      expect(Object.keys(savedData)).toHaveLength(2);
      expect(savedData["q-1"]).toBeDefined();
      expect(savedData["q-2"]).toBeDefined();
    });
  });

  describe("getInterview", () => {
    it("should retrieve saved interview by question ID", () => {
      const questionId = "q-get-test";
      saveInterview(questionId, mockEvaluation, mockTranscript);
      
      const result = getInterview(questionId);
      
      expect(result).not.toBeNull();
      expect(result?.questionId).toBe(questionId);
      expect(result?.score).toBe(7);
      expect(result?.evaluation.overallScore).toBe(7);
    });

    it("should return null for non-existent question", () => {
      const result = getInterview("non-existent-id");
      
      expect(result).toBeNull();
    });

    it("should return full InterviewRecord structure", () => {
      const questionId = "q-structure-test";
      saveInterview(questionId, mockEvaluation, mockTranscript);
      
      const result = getInterview(questionId);
      
      expect(result).toMatchObject({
        questionId,
        score: expect.any(Number),
        evaluation: expect.any(Object),
        transcript: expect.any(String),
        timestamp: expect.any(Number),
      });
    });
  });

  describe("clearInterview", () => {
    it("should remove interview by question ID", () => {
      const questionId = "q-clear-test";
      saveInterview(questionId, mockEvaluation, mockTranscript);
      
      // Verify it was saved
      expect(getInterview(questionId)).not.toBeNull();
      
      clearInterview(questionId);
      
      // Verify it's gone
      expect(getInterview(questionId)).toBeNull();
    });

    it("should not affect other interviews when clearing one", () => {
      saveInterview("q-keep", mockEvaluation, "Keep this");
      saveInterview("q-remove", mockEvaluation, "Remove this");
      
      clearInterview("q-remove");
      
      expect(getInterview("q-keep")).not.toBeNull();
      expect(getInterview("q-remove")).toBeNull();
    });

    it("should handle clearing non-existent interview gracefully", () => {
      expect(() => clearInterview("non-existent")).not.toThrow();
    });
  });

  describe("getAllInterviews", () => {
    it("should return empty array when no interviews saved", () => {
      const result = getAllInterviews();
      
      expect(result).toEqual([]);
    });

    it("should return all saved interviews", () => {
      saveInterview("q-1", mockEvaluation, "Answer 1");
      saveInterview("q-2", mockEvaluation, "Answer 2");
      saveInterview("q-3", mockEvaluation, "Answer 3");
      
      const result = getAllInterviews();
      
      expect(result).toHaveLength(3);
    });

    it("should sort interviews by timestamp (newest first)", () => {
      // Save in order
      saveInterview("q-old", mockEvaluation, "Old");
      
      // Advance time simulation
      jest.advanceTimersByTime(1000);
      saveInterview("q-new", mockEvaluation, "New");
      
      const result = getAllInterviews();
      
      // Newest should be first
      expect(result[0].questionId).toBe("q-new");
    });
  });

  describe("getInterviewScore", () => {
    it("should return score for saved interview", () => {
      saveInterview("q-score-test", mockEvaluation, mockTranscript);
      
      const score = getInterviewScore("q-score-test");
      
      expect(score).toBe(7);
    });

    it("should return null for non-existent interview", () => {
      const score = getInterviewScore("non-existent");
      
      expect(score).toBeNull();
    });
  });

  describe("Data Expiration", () => {
    it("should clean up records older than 30 days on read", () => {
      // This test would require mocking Date.now()
      // For now, we verify the cleanup logic exists in the implementation
      const data = {
        "old-question": {
          questionId: "old-question",
          score: 5,
          evaluation: mockEvaluation,
          transcript: "Old",
          timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
        },
        "new-question": {
          questionId: "new-question",
          score: 7,
          evaluation: mockEvaluation,
          transcript: "New",
          timestamp: Date.now(), // Now
        },
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(data));
      
      const result = getAllInterviews();
      
      // Old record should be filtered out
      expect(result.find((r) => r.questionId === "old-question")).toBeUndefined();
      expect(result.find((r) => r.questionId === "new-question")).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle localStorage errors gracefully on read", () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error("Storage error");
      });
      
      const result = getAllInterviews();
      
      expect(result).toEqual([]);
    });

    it("should handle invalid JSON in localStorage", () => {
      localStorageMock.getItem.mockReturnValueOnce("invalid json{{{");
      
      const result = getAllInterviews();
      
      expect(result).toEqual([]);
    });
  });
});
