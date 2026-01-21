/**
 * Interview Storage Test Suite
 * 
 * Tests localStorage-based interview score persistence for coding interviews,
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
  // Mock coding evaluation result - matches CodingEvaluationResult type (1-5 scale)
  const mockCodingEvaluation = {
    overallScore: 4.2,
    verdict: "Pass" as const,
    breakdown: {
      correctness: 4.5,
      timeComplexity: 4.0,
      spaceComplexity: 3.5,
      codeQuality: 4.0,
      problemSolving: 4.0,
    },
    strengths: ["Efficient hash map approach", "Clean variable naming", "Good edge case handling"],
    improvements: ["Could add input validation", "Consider early termination optimization"],
    overallFeedback: "Strong solution demonstrating solid understanding of hash table usage.",
    complexityAnalysis: {
      time: "O(n)",
      space: "O(n)",
      isOptimal: true,
      explanation: "Single pass through array with hash map storage",
    },
    redFlagsIdentified: [],
    nextFollowUp: "Can you optimize the space complexity?",
  };

  const mockCode = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;

  const mockLanguage = "python";

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe("saveInterview (Coding)", () => {
    it("should save coding interview data to localStorage", () => {
      const questionId = "q-123";

      saveInterview(questionId, mockCodingEvaluation, mockCode, mockLanguage);

      expect(localStorageMock.setItem).toHaveBeenCalled();

      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );
      expect(savedData[questionId]).toBeDefined();
      expect(savedData[questionId].score).toBe(4.2);
      expect(savedData[questionId].code).toBe(mockCode);
      expect(savedData[questionId].language).toBe(mockLanguage);
    });

    it("should include code and language in saved record", () => {
      const questionId = "q-coding-456";

      saveInterview(questionId, mockCodingEvaluation, mockCode, mockLanguage);

      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );

      expect(savedData[questionId].code).toContain("def two_sum");
      expect(savedData[questionId].language).toBe("python");
    });

    it("should include timestamp in saved record", () => {
      const questionId = "q-456";
      const beforeSave = Date.now();

      saveInterview(questionId, mockCodingEvaluation, mockCode, mockLanguage);

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
      saveInterview(questionId, mockCodingEvaluation, "# First attempt", "python");

      // Second save with better code
      const updatedEvaluation = { ...mockCodingEvaluation, overallScore: 10 };
      saveInterview(questionId, updatedEvaluation, "# Better solution", "python");

      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[1][1]
      );

      expect(savedData[questionId].score).toBe(10);
      expect(savedData[questionId].code).toBe("# Better solution");
    });

    it("should preserve other questions when saving new one", () => {
      saveInterview("q-1", mockCodingEvaluation, "# Solution 1", "python");
      saveInterview("q-2", mockCodingEvaluation, "// Solution 2", "javascript");

      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[1][1]
      );

      expect(Object.keys(savedData)).toHaveLength(2);
      expect(savedData["q-1"]).toBeDefined();
      expect(savedData["q-2"]).toBeDefined();
      expect(savedData["q-1"].language).toBe("python");
      expect(savedData["q-2"].language).toBe("javascript");
    });

    it("should handle interview with transcript (verbal explanation)", () => {
      const questionId = "q-transcript";
      const transcript = "I used a hash map for O(1) lookup...";

      saveInterview(questionId, mockCodingEvaluation, mockCode, mockLanguage, transcript);

      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );

      expect(savedData[questionId].transcript).toBe(transcript);
      expect(savedData[questionId].code).toBe(mockCode);
    });
  });

  describe("getInterview", () => {
    it("should retrieve saved interview by question ID", () => {
      const questionId = "q-get-test";
      saveInterview(questionId, mockCodingEvaluation, mockCode, mockLanguage);

      const result = getInterview(questionId);

      expect(result).not.toBeNull();
      expect(result?.questionId).toBe(questionId);
      expect(result?.score).toBe(4.2);
      expect(result?.evaluation.overallScore).toBe(4.2);
    });

    it("should return null for non-existent question", () => {
      const result = getInterview("non-existent-id");

      expect(result).toBeNull();
    });

    it("should return full InterviewRecord structure with coding fields", () => {
      const questionId = "q-structure-test";
      saveInterview(questionId, mockCodingEvaluation, mockCode, mockLanguage);

      const result = getInterview(questionId);

      expect(result).toMatchObject({
        questionId,
        score: expect.any(Number),
        evaluation: expect.any(Object),
        code: expect.any(String),
        language: expect.any(String),
        timestamp: expect.any(Number),
      });
    });

    it("should include code and language in retrieved record", () => {
      const questionId = "q-coding-retrieve";
      saveInterview(questionId, mockCodingEvaluation, mockCode, mockLanguage);

      const result = getInterview(questionId);

      expect(result?.code).toContain("def two_sum");
      expect(result?.language).toBe("python");
    });
  });

  describe("clearInterview", () => {
    it("should remove interview by question ID", () => {
      const questionId = "q-clear-test";
      saveInterview(questionId, mockCodingEvaluation, mockCode, mockLanguage);

      // Verify it was saved
      expect(getInterview(questionId)).not.toBeNull();

      clearInterview(questionId);

      // Verify it's gone
      expect(getInterview(questionId)).toBeNull();
    });

    it("should not affect other interviews when clearing one", () => {
      saveInterview("q-keep", mockCodingEvaluation, "# Keep", "python");
      saveInterview("q-remove", mockCodingEvaluation, "# Remove", "python");

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
      saveInterview("q-1", mockCodingEvaluation, "# Code 1", "python");
      saveInterview("q-2", mockCodingEvaluation, "// Code 2", "javascript");
      saveInterview("q-3", mockCodingEvaluation, "# Code 3", "python");

      const result = getAllInterviews();

      expect(result).toHaveLength(3);
    });

    it("should sort interviews by timestamp (newest first)", async () => {
      // Save first interview
      saveInterview("q-old", mockCodingEvaluation, "# Old", "python");

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Save second interview
      saveInterview("q-new", mockCodingEvaluation, "# New", "python");

      const result = getAllInterviews();

      // Newest should be first
      expect(result[0].questionId).toBe("q-new");
    });
  });

  describe("getInterviewScore", () => {
    it("should return score for saved interview", () => {
      saveInterview("q-score-test", mockCodingEvaluation, mockCode, mockLanguage);

      const score = getInterviewScore("q-score-test");

      expect(score).toBe(4.2);
    });

    it("should return null for non-existent interview", () => {
      const score = getInterviewScore("non-existent");

      expect(score).toBeNull();
    });
  });

  describe("Data Expiration", () => {
    it("should clean up records older than 30 days on read", () => {
      const data = {
        "old-question": {
          questionId: "old-question",
          score: 5,
          evaluation: mockCodingEvaluation,
          code: "# Old code",
          language: "python",
          timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
        },
        "new-question": {
          questionId: "new-question",
          score: 8,
          evaluation: mockCodingEvaluation,
          code: "# New code",
          language: "python",
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

    it("should handle null evaluation gracefully", () => {
      const data = {
        "bad-record": {
          questionId: "bad-record",
          score: 5,
          evaluation: null,
          code: "# Some code",
          language: "python",
          timestamp: Date.now(),
        },
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(data));

      // Should not throw
      expect(() => getAllInterviews()).not.toThrow();
    });
  });

  describe("Language Support", () => {
    const languages = ["python", "javascript", "java", "cpp", "go"];

    languages.forEach((lang) => {
      it(`should correctly store and retrieve ${lang} code`, () => {
        const questionId = `q-${lang}`;
        const code = `// ${lang} solution`;

        saveInterview(questionId, mockCodingEvaluation, code, lang);

        const result = getInterview(questionId);

        expect(result?.language).toBe(lang);
        expect(result?.code).toBe(code);
      });
    });
  });

  describe("Complexity Analysis Storage", () => {
    it("should store complexity analysis from evaluation", () => {
      const questionId = "q-complexity";

      saveInterview(questionId, mockCodingEvaluation, mockCode, mockLanguage);

      const result = getInterview(questionId);

      expect(result?.evaluation.complexityAnalysis).toBeDefined();
      expect(result?.evaluation.complexityAnalysis?.time).toBe("O(n)");
      expect(result?.evaluation.complexityAnalysis?.space).toBe("O(n)");
    });
  });

  describe("Breakdown Scores", () => {
    it("should store all breakdown scores from coding evaluation", () => {
      const questionId = "q-breakdown";

      saveInterview(questionId, mockCodingEvaluation, mockCode, mockLanguage);

      const result = getInterview(questionId);

      expect(result?.evaluation.breakdown.correctness).toBe(4.5);
      expect(result?.evaluation.breakdown.timeComplexity).toBe(4.0);
      expect(result?.evaluation.breakdown.spaceComplexity).toBe(3.5);
      expect(result?.evaluation.breakdown.codeQuality).toBe(4.0);
      expect(result?.evaluation.breakdown.problemSolving).toBe(4.0);
    });
  });
});
