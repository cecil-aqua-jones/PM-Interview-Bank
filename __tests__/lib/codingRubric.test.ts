/**
 * Coding Rubric Tests
 * 
 * Tests the evaluation rubric for coding interview responses,
 * including prompt generation and validation.
 */

import {
  CODING_RUBRIC,
  buildCodingEvaluationPrompt,
  validateCodingEvaluation,
  CodingEvaluationResult,
} from "../../lib/codingRubric";

describe("CodingRubric", () => {
  describe("CODING_RUBRIC Structure", () => {
    it("should have criteria array with all required types", () => {
      const requiredCriteria = [
        "Correctness",
        "Time Complexity",
        "Space Complexity",
        "Code Quality",
        "Edge Case Handling",
      ];

      const criteriaNames = CODING_RUBRIC.criteria.map((c) => c.name);
      requiredCriteria.forEach((criteria) => {
        expect(criteriaNames).toContain(criteria);
      });
    });

    it("should have weights that sum to 1", () => {
      const totalWeight = CODING_RUBRIC.criteria.reduce(
        (sum, criteria) => sum + criteria.weight,
        0
      );

      expect(totalWeight).toBeCloseTo(1);
    });

    it("should have valid weight values (positive numbers)", () => {
      CODING_RUBRIC.criteria.forEach((criteria) => {
        expect(criteria.weight).toBeGreaterThan(0);
        expect(typeof criteria.weight).toBe("number");
      });
    });

    it("should have descriptions and levels for each criterion", () => {
      CODING_RUBRIC.criteria.forEach((criteria) => {
        expect(criteria.description).toBeDefined();
        expect(typeof criteria.description).toBe("string");
        expect(criteria.description.length).toBeGreaterThan(0);

        expect(criteria.levels).toBeDefined();
        expect(Object.keys(criteria.levels).length).toBeGreaterThan(0);
      });
    });

    it("should have multiple levels for each criterion", () => {
      CODING_RUBRIC.criteria.forEach((criteria) => {
        const levels = Object.keys(criteria.levels);
        // Should have multiple levels (poor, fair, good, excellent)
        expect(levels.length).toBeGreaterThanOrEqual(3);
      });
    });

    it("should have difficulty multipliers", () => {
      expect(CODING_RUBRIC.difficultyMultipliers).toBeDefined();
      expect(CODING_RUBRIC.difficultyMultipliers.Easy).toBeDefined();
      expect(CODING_RUBRIC.difficultyMultipliers.Medium).toBeDefined();
      expect(CODING_RUBRIC.difficultyMultipliers.Hard).toBeDefined();
    });

    it("should have score descriptions for 1-10", () => {
      expect(CODING_RUBRIC.scoreDescriptions).toBeDefined();
      for (let i = 1; i <= 10; i++) {
        expect(CODING_RUBRIC.scoreDescriptions[i]).toBeDefined();
        expect(typeof CODING_RUBRIC.scoreDescriptions[i]).toBe("string");
      }
    });

    it("should have follow-up questions", () => {
      expect(CODING_RUBRIC.followUpQuestions).toBeDefined();
      expect(Array.isArray(CODING_RUBRIC.followUpQuestions)).toBe(true);
      expect(CODING_RUBRIC.followUpQuestions.length).toBeGreaterThan(0);
    });
  });

  describe("buildCodingEvaluationPrompt", () => {
    const sampleQuestion = "Given an array of integers, return indices of two numbers that add up to target.";
    const sampleCode = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;
    const sampleLanguage = "python";
    const sampleTranscript = "I used a hash map for O(1) lookup.";

    it("should include the question in the prompt", () => {
      const prompt = buildCodingEvaluationPrompt(
        sampleQuestion,
        sampleCode,
        sampleLanguage,
        sampleTranscript
      );

      expect(prompt).toContain(sampleQuestion);
    });

    it("should include the submitted code in the prompt", () => {
      const prompt = buildCodingEvaluationPrompt(
        sampleQuestion,
        sampleCode,
        sampleLanguage,
        sampleTranscript
      );

      expect(prompt).toContain("def two_sum");
      expect(prompt).toContain("seen = {}");
    });

    it("should include the programming language", () => {
      const prompt = buildCodingEvaluationPrompt(
        sampleQuestion,
        sampleCode,
        sampleLanguage,
        sampleTranscript
      );

      expect(prompt.toLowerCase()).toContain("python");
    });

    it("should include all rubric criteria", () => {
      const prompt = buildCodingEvaluationPrompt(
        sampleQuestion,
        sampleCode,
        sampleLanguage,
        sampleTranscript
      );

      expect(prompt.toLowerCase()).toContain("correctness");
      expect(prompt.toLowerCase()).toContain("time complexity");
      expect(prompt.toLowerCase()).toContain("space complexity");
      expect(prompt.toLowerCase()).toContain("code quality");
      expect(prompt.toLowerCase()).toContain("edge case");
    });

    it("should include difficulty when provided", () => {
      const prompt = buildCodingEvaluationPrompt(
        sampleQuestion,
        sampleCode,
        sampleLanguage,
        sampleTranscript,
        "Medium"
      );

      expect(prompt).toContain("Medium");
    });

    it("should include expected complexity when provided", () => {
      const expectedComplexity = { time: "O(n)", space: "O(n)" };
      const prompt = buildCodingEvaluationPrompt(
        sampleQuestion,
        sampleCode,
        sampleLanguage,
        sampleTranscript,
        undefined,
        expectedComplexity
      );

      expect(prompt).toContain("O(n)");
    });

    it("should include transcript in prompt", () => {
      const prompt = buildCodingEvaluationPrompt(
        sampleQuestion,
        sampleCode,
        sampleLanguage,
        sampleTranscript
      );

      expect(prompt).toContain(sampleTranscript);
    });

    it("should handle empty transcript", () => {
      const prompt = buildCodingEvaluationPrompt(
        sampleQuestion,
        sampleCode,
        sampleLanguage,
        ""
      );

      expect(prompt).toContain("No verbal explanation provided");
    });

    it("should request JSON response format", () => {
      const prompt = buildCodingEvaluationPrompt(
        sampleQuestion,
        sampleCode,
        sampleLanguage,
        sampleTranscript
      );

      expect(prompt.toLowerCase()).toContain("json");
    });
  });

  describe("validateCodingEvaluation", () => {
    const validEvaluation: CodingEvaluationResult = {
      overallScore: 8,
      breakdown: {
        correctness: 9,
        timeComplexity: 8,
        spaceComplexity: 7,
        codeQuality: 8,
        edgeCases: 8,
      },
      strengths: ["Efficient hash map approach", "Clean variable names"],
      improvements: ["Could add input validation", "Consider negative numbers"],
      overallFeedback: "Strong solution with good time complexity.",
      complexityAnalysis: {
        time: "O(n)",
        space: "O(n)",
        explanation: "Single pass through array with hash map storage",
      },
    };

    it("should return true for valid evaluation", () => {
      expect(validateCodingEvaluation(validEvaluation)).toBe(true);
    });

    it("should return false for missing overallScore", () => {
      const invalid = { ...validEvaluation, overallScore: undefined };
      expect(validateCodingEvaluation(invalid as any)).toBe(false);
    });

    it("should return false for non-numeric overallScore", () => {
      const invalid = { ...validEvaluation, overallScore: "8" as any };
      expect(validateCodingEvaluation(invalid)).toBe(false);
    });

    it("should return false for out-of-range overallScore", () => {
      expect(validateCodingEvaluation({ ...validEvaluation, overallScore: 11 })).toBe(false);
      expect(validateCodingEvaluation({ ...validEvaluation, overallScore: 0 })).toBe(false);
    });

    it("should return false for missing breakdown", () => {
      const invalid = { ...validEvaluation, breakdown: undefined };
      expect(validateCodingEvaluation(invalid as any)).toBe(false);
    });

    it("should return false for missing strengths array", () => {
      const invalid = { ...validEvaluation, strengths: undefined };
      expect(validateCodingEvaluation(invalid as any)).toBe(false);
    });

    it("should return false for non-array strengths", () => {
      const invalid = { ...validEvaluation, strengths: "good" as any };
      expect(validateCodingEvaluation(invalid)).toBe(false);
    });

    it("should return false for missing improvements array", () => {
      const invalid = { ...validEvaluation, improvements: undefined };
      expect(validateCodingEvaluation(invalid as any)).toBe(false);
    });

    it("should return false for missing overallFeedback", () => {
      const invalid = { ...validEvaluation, overallFeedback: undefined };
      expect(validateCodingEvaluation(invalid as any)).toBe(false);
    });

    it("should return false for missing complexityAnalysis", () => {
      const invalid = { ...validEvaluation, complexityAnalysis: undefined };
      expect(validateCodingEvaluation(invalid as any)).toBe(false);
    });

    it("should handle null input", () => {
      expect(validateCodingEvaluation(null as any)).toBe(false);
    });

    it("should handle undefined input", () => {
      expect(validateCodingEvaluation(undefined as any)).toBe(false);
    });
  });

  describe("Scoring Logic", () => {
    it("should have Correctness as the highest weighted criterion", () => {
      const sorted = [...CODING_RUBRIC.criteria].sort((a, b) => b.weight - a.weight);
      expect(sorted[0].name).toBe("Correctness");
    });

    it("should have reasonable weights distribution", () => {
      // Correctness should be significant (>= 25% = 0.25)
      const correctness = CODING_RUBRIC.criteria.find((c) => c.name === "Correctness");
      expect(correctness?.weight).toBeGreaterThanOrEqual(0.25);
      
      // No single criterion should dominate (< 50% = 0.50)
      CODING_RUBRIC.criteria.forEach((criteria) => {
        expect(criteria.weight).toBeLessThan(0.50);
      });
    });

    it("should calculate weighted score correctly", () => {
      // Example calculation using the actual rubric weights
      const scores = {
        "Correctness": 10,
        "Time Complexity": 5,
        "Space Complexity": 5,
        "Code Quality": 5,
        "Edge Case Handling": 5,
      };

      let weightedScore = 0;
      for (const criteria of CODING_RUBRIC.criteria) {
        weightedScore += (scores[criteria.name as keyof typeof scores] || 0) * criteria.weight;
      }

      // Correctness: 10 * 0.30 = 3.0
      // Time: 5 * 0.20 = 1.0
      // Space: 5 * 0.15 = 0.75
      // Code Quality: 5 * 0.20 = 1.0
      // Edge Cases: 5 * 0.15 = 0.75
      // Total: 6.5
      expect(weightedScore).toBeCloseTo(6.5);
    });
  });
});
