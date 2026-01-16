/**
 * PM Rubric Test Suite
 * 
 * Tests the PM evaluation rubric configuration and prompt generation
 * to ensure consistent and accurate interview assessment.
 */

import { PM_RUBRIC, buildEvaluationPrompt, EvaluationResult } from "@/lib/pmRubric";

describe("PM Rubric", () => {
  describe("Rubric Configuration", () => {
    it("should have exactly 5 evaluation criteria", () => {
      expect(PM_RUBRIC.criteria).toHaveLength(5);
    });

    it("should have criteria weights that sum to 1.0", () => {
      const totalWeight = PM_RUBRIC.criteria.reduce(
        (sum, criterion) => sum + criterion.weight,
        0
      );
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it("should have all required criteria names", () => {
      const criteriaNames = PM_RUBRIC.criteria.map((c) => c.name);
      
      expect(criteriaNames).toContain("Structure");
      expect(criteriaNames).toContain("Product Thinking");
      expect(criteriaNames).toContain("Metrics & Data");
      expect(criteriaNames).toContain("Communication");
      expect(criteriaNames).toContain("Execution Mindset");
    });

    it("should have 4 levels (poor, fair, good, excellent) for each criterion", () => {
      PM_RUBRIC.criteria.forEach((criterion) => {
        expect(criterion.levels).toHaveProperty("poor");
        expect(criterion.levels).toHaveProperty("fair");
        expect(criterion.levels).toHaveProperty("good");
        expect(criterion.levels).toHaveProperty("excellent");
      });
    });

    it("should have Product Thinking as the highest weighted criterion", () => {
      const productThinking = PM_RUBRIC.criteria.find(
        (c) => c.name === "Product Thinking"
      );
      const maxWeight = Math.max(...PM_RUBRIC.criteria.map((c) => c.weight));
      
      expect(productThinking?.weight).toBe(maxWeight);
      expect(productThinking?.weight).toBe(0.3);
    });
  });

  describe("Difficulty Multipliers", () => {
    it("should have multipliers for all difficulty levels", () => {
      expect(PM_RUBRIC.difficultyMultipliers).toHaveProperty("easy");
      expect(PM_RUBRIC.difficultyMultipliers).toHaveProperty("medium");
      expect(PM_RUBRIC.difficultyMultipliers).toHaveProperty("hard");
      expect(PM_RUBRIC.difficultyMultipliers).toHaveProperty("frequent");
    });

    it("should apply higher bar for easy questions (multiplier > 1)", () => {
      expect(PM_RUBRIC.difficultyMultipliers.easy).toBeGreaterThan(1);
    });

    it("should apply leniency for hard questions (multiplier < 1)", () => {
      expect(PM_RUBRIC.difficultyMultipliers.hard).toBeLessThan(1);
    });

    it("should have neutral multiplier for medium difficulty", () => {
      expect(PM_RUBRIC.difficultyMultipliers.medium).toBe(1.0);
    });
  });

  describe("Score Descriptions", () => {
    it("should have descriptions for scores 1-10", () => {
      for (let score = 1; score <= 10; score++) {
        expect(PM_RUBRIC.scoreDescriptions[score]).toBeDefined();
        expect(typeof PM_RUBRIC.scoreDescriptions[score]).toBe("string");
      }
    });

    it("should have progressively positive descriptions", () => {
      // Low scores should indicate need for improvement
      expect(PM_RUBRIC.scoreDescriptions[1].toLowerCase()).toMatch(/improvement|below/);
      expect(PM_RUBRIC.scoreDescriptions[2].toLowerCase()).toMatch(/below|improvement/);
      
      // High scores should be positive
      expect(PM_RUBRIC.scoreDescriptions[9].toLowerCase()).toMatch(/outstanding|exceptional/);
      expect(PM_RUBRIC.scoreDescriptions[10].toLowerCase()).toMatch(/exceptional|top/);
    });
  });
});

describe("buildEvaluationPrompt", () => {
  const sampleQuestion = "Design a feature to improve user engagement on LinkedIn.";
  const sampleTranscript = `
    I would approach this by first understanding the user segments.
    For LinkedIn, we have job seekers, recruiters, and professionals networking.
    I'd focus on increasing daily active usage through better content recommendations.
    Success metrics would include DAU/MAU ratio and time spent on platform.
  `;

  it("should include the question in the prompt", () => {
    const prompt = buildEvaluationPrompt(sampleQuestion, sampleTranscript, []);
    
    expect(prompt).toContain(sampleQuestion);
  });

  it("should include the candidate transcript", () => {
    const prompt = buildEvaluationPrompt(sampleQuestion, sampleTranscript, []);
    
    expect(prompt).toContain("user segments");
    expect(prompt).toContain("DAU/MAU ratio");
  });

  it("should include difficulty when provided", () => {
    const prompt = buildEvaluationPrompt(
      sampleQuestion,
      sampleTranscript,
      [],
      "hard"
    );
    
    expect(prompt).toContain("Question difficulty: hard");
  });

  it("should not include difficulty line when not provided", () => {
    const prompt = buildEvaluationPrompt(sampleQuestion, sampleTranscript, []);
    
    expect(prompt).not.toContain("Question difficulty:");
  });

  it("should include tags when provided", () => {
    const tags = ["Product Sense", "Strategy", "Metrics"];
    const prompt = buildEvaluationPrompt(
      sampleQuestion,
      sampleTranscript,
      tags
    );
    
    expect(prompt).toContain("Question categories: Product Sense, Strategy, Metrics");
  });

  it("should include all evaluation criteria with weights", () => {
    const prompt = buildEvaluationPrompt(sampleQuestion, sampleTranscript, []);
    
    expect(prompt).toContain("Structure");
    expect(prompt).toContain("20%");
    expect(prompt).toContain("Product Thinking");
    expect(prompt).toContain("30%");
    expect(prompt).toContain("Metrics & Data");
    expect(prompt).toContain("Communication");
    expect(prompt).toContain("15%");
    expect(prompt).toContain("Execution");
  });

  it("should specify JSON response format", () => {
    const prompt = buildEvaluationPrompt(sampleQuestion, sampleTranscript, []);
    
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("overallScore");
    expect(prompt).toContain("breakdown");
    expect(prompt).toContain("strengths");
    expect(prompt).toContain("improvements");
    expect(prompt).toContain("overallFeedback");
  });

  it("should mention consideration for spoken response quirks", () => {
    const prompt = buildEvaluationPrompt(sampleQuestion, sampleTranscript, []);
    
    expect(prompt).toContain("spoken response");
    expect(prompt).toMatch(/filler words|repetition/);
  });

  it("should provide score calibration guidance", () => {
    const prompt = buildEvaluationPrompt(sampleQuestion, sampleTranscript, []);
    
    expect(prompt).toContain("5-6 is average");
    expect(prompt).toContain("7+ is strong");
    expect(prompt).toContain("8+ is exceptional");
  });
});

describe("EvaluationResult Type", () => {
  it("should accept valid evaluation result objects", () => {
    const validResult: EvaluationResult = {
      overallScore: 7,
      breakdown: {
        structure: 7,
        productThinking: 8,
        metrics: 6,
        communication: 7,
        execution: 7,
      },
      strengths: ["Clear framework", "Strong user focus"],
      improvements: ["Add more metrics", "Consider edge cases"],
      overallFeedback: "Good response with strong product thinking.",
    };

    // Type check - if this compiles, the type is correct
    expect(validResult.overallScore).toBe(7);
    expect(validResult.breakdown.productThinking).toBe(8);
    expect(validResult.strengths).toHaveLength(2);
  });
});
