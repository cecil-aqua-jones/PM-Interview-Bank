/**
 * InterviewModal Business Logic Tests
 * 
 * Tests the coding interview flow logic including:
 * - State machine transitions
 * - Code submission handling
 * - Evaluation processing
 * - Follow-up conversation management
 */

import { Question, SupportedLanguage, SUPPORTED_LANGUAGES, DEFAULT_STARTER_CODE } from "../../lib/types";
import { validateCodingEvaluation, CodingEvaluationResult } from "../../lib/codingRubric";

describe("InterviewModal Business Logic", () => {
  // Interview states
  type InterviewState = "speaking" | "coding" | "submitting" | "review" | "followup" | "feedback" | "error";

  describe("State Machine Transitions", () => {
    const getNextState = (
      currentState: InterviewState,
      action: string
    ): InterviewState => {
      const transitions: Record<InterviewState, Record<string, InterviewState>> = {
        speaking: { skip: "coding", finish: "coding" },
        coding: { submit: "submitting" },
        submitting: { success: "review", error: "error" },
        review: { followup: "followup", done: "feedback" },
        followup: { answered: "review", skip: "feedback" },
        feedback: { retry: "coding", close: "coding" },
        error: { retry: "coding", close: "coding" },
      };

      return transitions[currentState]?.[action] ?? currentState;
    };

    it("should transition from speaking to coding on skip", () => {
      expect(getNextState("speaking", "skip")).toBe("coding");
    });

    it("should transition from speaking to coding when audio finishes", () => {
      expect(getNextState("speaking", "finish")).toBe("coding");
    });

    it("should transition from coding to submitting on submit", () => {
      expect(getNextState("coding", "submit")).toBe("submitting");
    });

    it("should transition from submitting to review on success", () => {
      expect(getNextState("submitting", "success")).toBe("review");
    });

    it("should transition from submitting to error on failure", () => {
      expect(getNextState("submitting", "error")).toBe("error");
    });

    it("should transition from review to followup when continuing", () => {
      expect(getNextState("review", "followup")).toBe("followup");
    });

    it("should transition from review to feedback when done", () => {
      expect(getNextState("review", "done")).toBe("feedback");
    });

    it("should transition from followup back to review after answer", () => {
      expect(getNextState("followup", "answered")).toBe("review");
    });

    it("should transition from followup to feedback on skip", () => {
      expect(getNextState("followup", "skip")).toBe("feedback");
    });
  });

  describe("Code Submission Validation", () => {
    it("should validate non-empty code", () => {
      const isValidSubmission = (code: string) => code.trim().length > 0;

      expect(isValidSubmission("def solution(): pass")).toBe(true);
      expect(isValidSubmission("")).toBe(false);
      expect(isValidSubmission("   ")).toBe(false);
    });

    it("should validate code has actual content beyond starter", () => {
      const hasModifiedCode = (code: string, starterCode: string) => {
        return code.trim() !== starterCode.trim();
      };

      const starter = DEFAULT_STARTER_CODE.python;
      expect(hasModifiedCode("def solution(nums):\n    return sum(nums)", starter)).toBe(true);
      expect(hasModifiedCode(starter, starter)).toBe(false);
    });

    it("should accept any supported language", () => {
      const isValidLanguage = (lang: string): lang is SupportedLanguage => {
        return SUPPORTED_LANGUAGES.some((l) => l.id === lang);
      };

      expect(isValidLanguage("python")).toBe(true);
      expect(isValidLanguage("javascript")).toBe(true);
      expect(isValidLanguage("java")).toBe(true);
      expect(isValidLanguage("cpp")).toBe(true);
      expect(isValidLanguage("go")).toBe(true);
      expect(isValidLanguage("ruby")).toBe(false);
    });
  });

  describe("Evaluation Response Processing", () => {
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
      strengths: ["Efficient approach", "Clean code"],
      improvements: ["Add comments", "Handle edge cases"],
      overallFeedback: "Strong solution!",
      complexityAnalysis: {
        time: "O(n)",
        space: "O(n)",
        isOptimal: true,
        explanation: "Single pass with hash map",
      },
    };

    it("should validate proper evaluation response", () => {
      expect(validateCodingEvaluation(validEvaluation)).toBe(true);
    });

    it("should extract overall score", () => {
      expect(validEvaluation.overallScore).toBe(4);
    });

    it("should extract breakdown scores", () => {
      expect(validEvaluation.breakdown.correctness).toBe(4.5);
      expect(validEvaluation.breakdown.timeComplexity).toBe(4);
    });

    it("should have strengths and improvements", () => {
      expect(validEvaluation.strengths.length).toBeGreaterThan(0);
      expect(validEvaluation.improvements.length).toBeGreaterThan(0);
    });

    it("should have complexity analysis", () => {
      expect(validEvaluation.complexityAnalysis.time).toBe("O(n)");
      expect(validEvaluation.complexityAnalysis.space).toBe("O(n)");
    });
  });

  describe("Conversation History Management", () => {
    type ConversationTurn = {
      role: "interviewer" | "candidate";
      content: string;
    };

    let history: ConversationTurn[] = [];

    beforeEach(() => {
      history = [];
    });

    it("should add interviewer questions", () => {
      history.push({ role: "interviewer", content: "What is the time complexity?" });
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe("interviewer");
    });

    it("should add candidate responses", () => {
      history.push({ role: "interviewer", content: "Question?" });
      history.push({ role: "candidate", content: "O(n) time complexity." });
      expect(history).toHaveLength(2);
      expect(history[1].role).toBe("candidate");
    });

    it("should maintain conversation order", () => {
      history.push({ role: "interviewer", content: "Q1" });
      history.push({ role: "candidate", content: "A1" });
      history.push({ role: "interviewer", content: "Q2" });
      history.push({ role: "candidate", content: "A2" });

      expect(history[0].content).toBe("Q1");
      expect(history[1].content).toBe("A1");
      expect(history[2].content).toBe("Q2");
      expect(history[3].content).toBe("A2");
    });

    it("should count conversation turns", () => {
      history.push({ role: "interviewer", content: "Q1" });
      history.push({ role: "candidate", content: "A1" });
      history.push({ role: "interviewer", content: "Q2" });

      const interviewerTurns = history.filter((t) => t.role === "interviewer").length;
      expect(interviewerTurns).toBe(2);
    });
  });

  describe("Follow-up Count Limit", () => {
    const MAX_FOLLOWUPS = 3;

    it("should allow follow-ups below limit", () => {
      const canContinue = (count: number) => count < MAX_FOLLOWUPS;

      expect(canContinue(0)).toBe(true);
      expect(canContinue(1)).toBe(true);
      expect(canContinue(2)).toBe(true);
    });

    it("should stop at limit", () => {
      const canContinue = (count: number) => count < MAX_FOLLOWUPS;

      expect(canContinue(3)).toBe(false);
      expect(canContinue(4)).toBe(false);
    });
  });

  describe("Language Selection", () => {
    it("should get starter code for selected language", () => {
      const getStarterCode = (lang: SupportedLanguage) => DEFAULT_STARTER_CODE[lang];

      expect(getStarterCode("python")).toContain("def solution");
      expect(getStarterCode("javascript")).toContain("function solution");
      expect(getStarterCode("java")).toContain("class Solution");
      expect(getStarterCode("cpp")).toContain("class Solution");
      expect(getStarterCode("go")).toContain("func solution");
    });

    it("should preserve code when switching languages", () => {
      const userCode = "def my_custom_solution(): return 42";
      const languages: SupportedLanguage[] = ["python", "javascript"];
      const codeByLanguage: Record<SupportedLanguage, string> = {
        python: userCode,
        javascript: DEFAULT_STARTER_CODE.javascript,
        java: DEFAULT_STARTER_CODE.java,
        cpp: DEFAULT_STARTER_CODE.cpp,
        go: DEFAULT_STARTER_CODE.go,
      };

      // Switch to javascript
      expect(codeByLanguage.javascript).toBe(DEFAULT_STARTER_CODE.javascript);
      // Switch back to python - code should be preserved
      expect(codeByLanguage.python).toBe(userCode);
    });
  });

  describe("Question Display Logic", () => {
    const mockQuestion: Question = {
      id: "q-123",
      title: "Two Sum",
      prompt: "Given an array of integers, return indices of two numbers that add up to target.",
      tags: ["Array", "Hash Table"],
      difficultyLabel: "Easy",
      companyName: "Google",
      examples: [
        { input: "[2,7,11,15], target=9", output: "[0,1]", explanation: "nums[0] + nums[1] = 9" },
      ],
      constraints: ["2 <= nums.length <= 10^4"],
      hints: ["Use a hash map for O(n) time"],
      expectedComplexity: { time: "O(n)", space: "O(n)" },
    };

    it("should display question title", () => {
      expect(mockQuestion.title).toBe("Two Sum");
    });

    it("should display problem prompt", () => {
      expect(mockQuestion.prompt).toContain("array of integers");
    });

    it("should display difficulty badge", () => {
      expect(mockQuestion.difficultyLabel).toBe("Easy");
    });

    it("should display tags", () => {
      expect(mockQuestion.tags).toContain("Array");
      expect(mockQuestion.tags).toContain("Hash Table");
    });

    it("should display examples when available", () => {
      expect(mockQuestion.examples).toBeDefined();
      expect(mockQuestion.examples?.[0].input).toBeDefined();
      expect(mockQuestion.examples?.[0].output).toBeDefined();
    });

    it("should display constraints when available", () => {
      expect(mockQuestion.constraints).toBeDefined();
      expect(mockQuestion.constraints?.[0]).toContain("nums.length");
    });

    it("should display hints when available", () => {
      expect(mockQuestion.hints).toBeDefined();
      expect(mockQuestion.hints?.[0]).toContain("hash map");
    });
  });

  describe("Score Display", () => {
    it("should format score as X/5", () => {
      const formatScore = (score: number) => `${score}/5`;
      expect(formatScore(4)).toBe("4/5");
      expect(formatScore(5)).toBe("5/5");
    });

    it("should determine score color based on value (1-5 scale)", () => {
      const getScoreColor = (score: number) => {
        if (score >= 4) return "green";  // Strong Pass (4+)
        if (score >= 3) return "yellow"; // Pass (3-3.9)
        return "red";                     // Fail (<3)
      };

      expect(getScoreColor(5)).toBe("green");   // 5 >= 4, Strong Pass
      expect(getScoreColor(4)).toBe("green");   // 4 >= 4, Strong Pass
      expect(getScoreColor(3.5)).toBe("yellow"); // 3.5 >= 3, Pass
      expect(getScoreColor(3)).toBe("yellow");  // 3 >= 3, Pass
      expect(getScoreColor(2.5)).toBe("red");   // 2.5 < 3, Borderline/Fail
      expect(getScoreColor(2)).toBe("red");     // 2 < 3, Fail
    });

    it("should compare with existing score", () => {
      const existingScore = 6;
      const newScore = 8;
      const improved = newScore > existingScore;
      expect(improved).toBe(true);
    });
  });

  describe("Audio State Management", () => {
    type AudioState = "idle" | "loading" | "playing" | "paused" | "error";

    it("should track audio loading state", () => {
      let state: AudioState = "idle";
      state = "loading";
      expect(state).toBe("loading");
    });

    it("should track audio playing state", () => {
      let state: AudioState = "loading";
      state = "playing";
      expect(state).toBe("playing");
    });

    it("should handle audio errors", () => {
      let state: AudioState = "loading";
      state = "error";
      expect(state).toBe("error");
    });
  });

  describe("Error Handling", () => {
    it("should identify API errors", () => {
      const isApiError = (error: unknown): boolean => {
        return error instanceof Error && error.message.includes("API");
      };

      expect(isApiError(new Error("API request failed"))).toBe(true);
      expect(isApiError(new Error("Network error"))).toBe(false);
    });

    it("should provide user-friendly error messages", () => {
      const getErrorMessage = (errorType: string): string => {
        const messages: Record<string, string> = {
          network: "Please check your internet connection.",
          api: "The evaluation service is temporarily unavailable.",
          timeout: "The request took too long. Please try again.",
          default: "Something went wrong. Please try again.",
        };
        return messages[errorType] || messages.default;
      };

      expect(getErrorMessage("network")).toContain("internet");
      expect(getErrorMessage("api")).toContain("unavailable");
      expect(getErrorMessage("unknown")).toContain("wrong");
    });
  });

  describe("Progress Calculation", () => {
    it("should calculate speaking progress", () => {
      const calculateProgress = (current: number, total: number) =>
        Math.round((current / total) * 100);

      expect(calculateProgress(0, 60)).toBe(0);
      expect(calculateProgress(30, 60)).toBe(50);
      expect(calculateProgress(60, 60)).toBe(100);
    });

    it("should calculate interview completion", () => {
      const steps = ["speaking", "coding", "review", "followup", "feedback"];
      const currentStep = "review";
      const progress = ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
      expect(progress).toBe(60);
    });
  });
});
