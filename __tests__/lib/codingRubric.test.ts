/**
 * Coding Rubric Tests
 * 
 * Tests the evaluation rubric for coding interview responses,
 * including prompt generation and validation.
 */

import {
  CODING_RUBRIC,
  CODING_RUBRIC_CRITERIA,
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
        "Problem-Solving Approach",
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
        expect(criteria.levels.length).toBeGreaterThan(0);
      });
    });

    it("should have multiple levels for each criterion", () => {
      CODING_RUBRIC.criteria.forEach((criteria) => {
        // Should have 5 levels (1-5 scale)
        expect(criteria.levels.length).toBe(5);
      });
    });

    it("should have follow-up questions", () => {
      expect(CODING_RUBRIC.followUpQuestions).toBeDefined();
      expect(Array.isArray(CODING_RUBRIC.followUpQuestions)).toBe(true);
      expect(CODING_RUBRIC.followUpQuestions.length).toBeGreaterThan(0);
    });

    it("should have followUpTriggers for each criterion", () => {
      CODING_RUBRIC_CRITERIA.forEach((criteria) => {
        expect(criteria.followUpTriggers).toBeDefined();
        expect(Array.isArray(criteria.followUpTriggers)).toBe(true);
        expect(criteria.followUpTriggers.length).toBeGreaterThan(0);
      });
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
      expect(prompt.toLowerCase()).toContain("problem-solving");
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

      expect(prompt).toContain("No initial verbal explanation provided");
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

    it("should include conversation history when provided", () => {
      const conversationHistory = [
        { role: "interviewer" as const, content: "Can you explain your approach?" },
        { role: "candidate" as const, content: "I'm using a hash map for O(1) lookups." },
      ];
      const prompt = buildCodingEvaluationPrompt(
        sampleQuestion,
        sampleCode,
        sampleLanguage,
        sampleTranscript,
        undefined, // difficulty
        undefined, // expectedComplexity
        conversationHistory
      );

      expect(prompt).toContain("CONVERSATION DURING INTERVIEW");
      expect(prompt).toContain("Can you explain your approach?");
      expect(prompt).toContain("I'm using a hash map");
    });
  });

  describe("validateCodingEvaluation", () => {
    const validEvaluation: CodingEvaluationResult = {
      overallScore: 4,
      verdict: "Strong Pass",
      breakdown: {
        correctness: 4.5,
        timeComplexity: 4,
        spaceComplexity: 3.5,
        codeQuality: 4,
        problemSolving: 4,
      },
      strengths: ["Efficient hash map approach", "Clean variable names"],
      improvements: ["Could add input validation", "Consider negative numbers"],
      overallFeedback: "Strong solution with good time complexity.",
      complexityAnalysis: {
        time: "O(n)",
        space: "O(n)",
        isOptimal: true,
        explanation: "Single pass through array with hash map storage",
      },
    };

    it("should return true for valid evaluation", () => {
      expect(validateCodingEvaluation(validEvaluation)).toBe(true);
    });

    it("should return false for missing overallScore", () => {
      const invalid = { ...validEvaluation, overallScore: undefined };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for non-numeric overallScore", () => {
      const invalid = { ...validEvaluation, overallScore: "4" };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for out-of-range overallScore", () => {
      expect(validateCodingEvaluation({ ...validEvaluation, overallScore: 6 })).toBe(false);
      expect(validateCodingEvaluation({ ...validEvaluation, overallScore: 0 })).toBe(false);
    });

    it("should return false for missing verdict", () => {
      const invalid = { ...validEvaluation, verdict: undefined };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for invalid verdict", () => {
      const invalid = { ...validEvaluation, verdict: "Invalid Verdict" };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for missing breakdown", () => {
      const invalid = { ...validEvaluation, breakdown: undefined };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for missing breakdown fields", () => {
      const invalid = { 
        ...validEvaluation, 
        breakdown: { ...validEvaluation.breakdown, problemSolving: undefined } 
      };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for breakdown scores below 1", () => {
      const invalid = { 
        ...validEvaluation, 
        breakdown: { ...validEvaluation.breakdown, correctness: 0 } 
      };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for breakdown scores above 5", () => {
      const invalid = { 
        ...validEvaluation, 
        breakdown: { ...validEvaluation.breakdown, timeComplexity: 6 } 
      };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for negative breakdown scores", () => {
      const invalid = { 
        ...validEvaluation, 
        breakdown: { ...validEvaluation.breakdown, codeQuality: -1 } 
      };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for missing strengths array", () => {
      const invalid = { ...validEvaluation, strengths: undefined };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for non-array strengths", () => {
      const invalid = { ...validEvaluation, strengths: "good" };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for missing improvements array", () => {
      const invalid = { ...validEvaluation, improvements: undefined };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for missing overallFeedback", () => {
      const invalid = { ...validEvaluation, overallFeedback: undefined };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for missing complexityAnalysis", () => {
      const invalid = { ...validEvaluation, complexityAnalysis: undefined };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for incomplete complexityAnalysis", () => {
      const invalid = { 
        ...validEvaluation, 
        complexityAnalysis: { time: "O(n)" } // missing space, isOptimal, and explanation
      };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for missing isOptimal in complexityAnalysis", () => {
      const invalid = { 
        ...validEvaluation, 
        complexityAnalysis: { 
          time: "O(n)", 
          space: "O(n)", 
          explanation: "Single pass" 
          // missing isOptimal boolean
        }
      };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should return false for non-boolean isOptimal", () => {
      const invalid = { 
        ...validEvaluation, 
        complexityAnalysis: { 
          time: "O(n)", 
          space: "O(n)", 
          isOptimal: "yes", // should be boolean, not string
          explanation: "Single pass" 
        }
      };
      expect(validateCodingEvaluation(invalid as unknown)).toBe(false);
    });

    it("should handle null input", () => {
      expect(validateCodingEvaluation(null)).toBe(false);
    });

    it("should handle undefined input", () => {
      expect(validateCodingEvaluation(undefined)).toBe(false);
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
      // Example calculation using the actual rubric weights (1-5 scale)
      const scores: Record<string, number> = {
        "Correctness": 5,           // 5 * 0.30 = 1.50
        "Time Complexity": 4,       // 4 * 0.20 = 0.80
        "Space Complexity": 3,      // 3 * 0.15 = 0.45
        "Code Quality": 4,          // 4 * 0.20 = 0.80
        "Problem-Solving Approach": 3, // 3 * 0.15 = 0.45
      };

      let weightedScore = 0;
      for (const criteria of CODING_RUBRIC.criteria) {
        weightedScore += (scores[criteria.name] || 0) * criteria.weight;
      }

      // Total: 1.50 + 0.80 + 0.45 + 0.80 + 0.45 = 4.0
      expect(weightedScore).toBeCloseTo(4.0);
    });
  });
});
