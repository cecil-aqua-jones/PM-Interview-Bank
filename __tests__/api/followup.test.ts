/**
 * Follow-up API Tests
 * 
 * Tests the follow-up question generation endpoint logic,
 * including conversation history management and prompt generation.
 */

describe("Follow-up API Logic", () => {
  describe("Request Validation", () => {
    const validateRequest = (body: Record<string, unknown>) => {
      const errors: string[] = [];

      if (!body.question || typeof body.question !== "string") {
        errors.push("question is required and must be a string");
      }

      if (!body.code || typeof body.code !== "string") {
        errors.push("code is required and must be a string");
      }

      if (!body.language || typeof body.language !== "string") {
        errors.push("language is required and must be a string");
      }

      if (!body.evaluation || typeof body.evaluation !== "object") {
        errors.push("evaluation is required and must be an object");
      }

      if (!Array.isArray(body.conversationHistory)) {
        errors.push("conversationHistory is required and must be an array");
      }

      return { valid: errors.length === 0, errors };
    };

    it("should require question parameter", () => {
      const result = validateRequest({
        code: "code",
        language: "python",
        evaluation: {},
        conversationHistory: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("question is required and must be a string");
    });

    it("should require code parameter", () => {
      const result = validateRequest({
        question: "Two Sum",
        language: "python",
        evaluation: {},
        conversationHistory: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("code is required and must be a string");
    });

    it("should require language parameter", () => {
      const result = validateRequest({
        question: "Two Sum",
        code: "def solution(): pass",
        evaluation: {},
        conversationHistory: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("language is required and must be a string");
    });

    it("should require evaluation parameter", () => {
      const result = validateRequest({
        question: "Two Sum",
        code: "def solution(): pass",
        language: "python",
        conversationHistory: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("evaluation is required and must be an object");
    });

    it("should require conversationHistory parameter", () => {
      const result = validateRequest({
        question: "Two Sum",
        code: "def solution(): pass",
        language: "python",
        evaluation: {},
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "conversationHistory is required and must be an array"
      );
    });

    it("should validate complete request", () => {
      const result = validateRequest({
        question: "Two Sum",
        code: "def solution(): pass",
        language: "python",
        evaluation: { overallScore: 8 },
        conversationHistory: [],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Conversation History", () => {
    type ConversationTurn = {
      role: "interviewer" | "candidate";
      content: string;
    };

    it("should track conversation turns", () => {
      const history: ConversationTurn[] = [
        { role: "interviewer", content: "Can you explain your approach?" },
        { role: "candidate", content: "I used a hash map for O(1) lookup." },
        { role: "interviewer", content: "What about edge cases?" },
        { role: "candidate", content: "I handle empty arrays and duplicates." },
      ];

      expect(history).toHaveLength(4);
      expect(history.filter((t) => t.role === "interviewer")).toHaveLength(2);
      expect(history.filter((t) => t.role === "candidate")).toHaveLength(2);
    });

    it("should maintain conversation order", () => {
      const history: ConversationTurn[] = [];

      history.push({ role: "interviewer", content: "Question 1" });
      history.push({ role: "candidate", content: "Answer 1" });
      history.push({ role: "interviewer", content: "Question 2" });
      history.push({ role: "candidate", content: "Answer 2" });

      expect(history[0].role).toBe("interviewer");
      expect(history[1].role).toBe("candidate");
      expect(history[2].role).toBe("interviewer");
      expect(history[3].role).toBe("candidate");
    });

    it("should handle empty conversation history", () => {
      const history: ConversationTurn[] = [];
      expect(history).toHaveLength(0);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("Prompt Generation", () => {
    const buildFollowUpPrompt = (params: {
      question: string;
      code: string;
      language: string;
      evaluation: { overallScore: number; breakdown: Record<string, any> };
      conversationHistory: Array<{ role: string; content: string }>;
    }) => {
      const { question, code, language, evaluation, conversationHistory } = params;

      let prompt = `You are a FAANG coding interviewer conducting a follow-up discussion.

Question: ${question}

Candidate's ${language} solution:
\`\`\`${language}
${code}
\`\`\`

Initial evaluation score: ${evaluation.overallScore}/10

`;

      if (conversationHistory.length > 0) {
        prompt += "Conversation so far:\n";
        for (const turn of conversationHistory) {
          prompt += `${turn.role === "interviewer" ? "Interviewer" : "Candidate"}: ${turn.content}\n`;
        }
        prompt += "\n";
      }

      prompt += `Generate a probing follow-up question about the candidate's solution.
Focus on one of: time/space complexity analysis, edge cases, alternative approaches, or code optimization.
Keep the question concise (1-2 sentences).`;

      return prompt;
    };

    it("should include the original question", () => {
      const prompt = buildFollowUpPrompt({
        question: "Two Sum",
        code: "def solution(): pass",
        language: "python",
        evaluation: { overallScore: 8, breakdown: {} },
        conversationHistory: [],
      });

      expect(prompt).toContain("Two Sum");
    });

    it("should include the code", () => {
      const code = "def two_sum(nums, target): return []";
      const prompt = buildFollowUpPrompt({
        question: "Two Sum",
        code,
        language: "python",
        evaluation: { overallScore: 8, breakdown: {} },
        conversationHistory: [],
      });

      expect(prompt).toContain("def two_sum");
    });

    it("should include the language", () => {
      const prompt = buildFollowUpPrompt({
        question: "Two Sum",
        code: "def solution(): pass",
        language: "python",
        evaluation: { overallScore: 8, breakdown: {} },
        conversationHistory: [],
      });

      expect(prompt).toContain("python");
    });

    it("should include the evaluation score", () => {
      const prompt = buildFollowUpPrompt({
        question: "Two Sum",
        code: "def solution(): pass",
        language: "python",
        evaluation: { overallScore: 7, breakdown: {} },
        conversationHistory: [],
      });

      expect(prompt).toContain("7/10");
    });

    it("should include conversation history", () => {
      const prompt = buildFollowUpPrompt({
        question: "Two Sum",
        code: "def solution(): pass",
        language: "python",
        evaluation: { overallScore: 8, breakdown: {} },
        conversationHistory: [
          { role: "interviewer", content: "Why did you choose a hash map?" },
          { role: "candidate", content: "For O(1) lookups." },
        ],
      });

      expect(prompt).toContain("Why did you choose a hash map?");
      expect(prompt).toContain("For O(1) lookups");
    });

    it("should handle empty conversation history", () => {
      const prompt = buildFollowUpPrompt({
        question: "Two Sum",
        code: "def solution(): pass",
        language: "python",
        evaluation: { overallScore: 8, breakdown: {} },
        conversationHistory: [],
      });

      expect(prompt).not.toContain("Conversation so far:");
    });
  });

  describe("Follow-up Question Categories", () => {
    const categorizeQuestion = (question: string) => {
      const lowerQ = question.toLowerCase();
      if (lowerQ.includes("time") || lowerQ.includes("space") || lowerQ.includes("complexity")) {
        return "complexity";
      }
      if (lowerQ.includes("edge") || lowerQ.includes("corner") || lowerQ.includes("boundary")) {
        return "edge_cases";
      }
      if (lowerQ.includes("alternative") || lowerQ.includes("other approach") || lowerQ.includes("different way")) {
        return "alternatives";
      }
      if (lowerQ.includes("optimi") || lowerQ.includes("improve") || lowerQ.includes("faster")) {
        return "optimization";
      }
      return "general";
    };

    it("should identify complexity questions", () => {
      expect(categorizeQuestion("What is the time complexity of your solution?")).toBe("complexity");
      expect(categorizeQuestion("Can you analyze the space complexity?")).toBe("complexity");
    });

    it("should identify edge case questions", () => {
      expect(categorizeQuestion("How does your solution handle edge cases?")).toBe("edge_cases");
      expect(categorizeQuestion("What about corner cases like empty arrays?")).toBe("edge_cases");
    });

    it("should identify alternative approach questions", () => {
      expect(categorizeQuestion("Is there an alternative approach?")).toBe("alternatives");
      expect(categorizeQuestion("Can you think of a different way to solve this?")).toBe("alternatives");
    });

    it("should identify optimization questions", () => {
      expect(categorizeQuestion("How could you optimize this further?")).toBe("optimization");
      expect(categorizeQuestion("Can you make this faster?")).toBe("optimization");
    });

    it("should default to general for uncategorized questions", () => {
      expect(categorizeQuestion("Can you explain your approach?")).toBe("general");
      expect(categorizeQuestion("Why did you choose this data structure?")).toBe("general");
    });
  });

  describe("Follow-up Count Limit", () => {
    const MAX_FOLLOWUPS = 3;

    const shouldContinueFollowUp = (currentCount: number) => {
      return currentCount < MAX_FOLLOWUPS;
    };

    it("should allow follow-ups below limit", () => {
      expect(shouldContinueFollowUp(0)).toBe(true);
      expect(shouldContinueFollowUp(1)).toBe(true);
      expect(shouldContinueFollowUp(2)).toBe(true);
    });

    it("should stop follow-ups at limit", () => {
      expect(shouldContinueFollowUp(3)).toBe(false);
      expect(shouldContinueFollowUp(4)).toBe(false);
    });
  });

  describe("Response Validation", () => {
    const validateFollowUpResponse = (response: unknown) => {
      if (!response || typeof response !== "object") return false;
      const r = response as Record<string, unknown>;
      return (
        typeof r.followUpQuestion === "string" &&
        r.followUpQuestion.length > 0 &&
        r.followUpQuestion.length < 500
      );
    };

    it("should validate proper follow-up response", () => {
      expect(
        validateFollowUpResponse({
          followUpQuestion: "Can you explain the time complexity?",
        })
      ).toBe(true);
    });

    it("should reject empty follow-up question", () => {
      expect(validateFollowUpResponse({ followUpQuestion: "" })).toBe(false);
    });

    it("should reject missing follow-up question", () => {
      expect(validateFollowUpResponse({})).toBe(false);
      expect(validateFollowUpResponse(null)).toBe(false);
    });

    it("should reject excessively long follow-up question", () => {
      expect(
        validateFollowUpResponse({
          followUpQuestion: "a".repeat(600),
        })
      ).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed conversation history", () => {
      const sanitizeHistory = (history: unknown[]) => {
        if (!Array.isArray(history)) return [];
        return history.filter(
          (turn) =>
            turn &&
            typeof turn === "object" &&
            typeof (turn as any).role === "string" &&
            typeof (turn as any).content === "string" &&
            ["interviewer", "candidate"].includes((turn as any).role)
        );
      };

      const malformed = [
        { role: "interviewer", content: "Valid" },
        { role: "invalid_role", content: "Invalid" },
        { content: "Missing role" },
        null,
        "string instead of object",
      ];

      const sanitized = sanitizeHistory(malformed);
      expect(sanitized).toHaveLength(1);
      expect(sanitized[0].content).toBe("Valid");
    });

    it("should sanitize follow-up question content", () => {
      const sanitizeQuestion = (question: string) => {
        return question
          .replace(/<script[^>]*>.*?<\/script>/gi, "")
          .replace(/<[^>]+>/g, "")
          .trim();
      };

      const maliciousInput = '<script>alert("xss")</script>Can you explain?';
      expect(sanitizeQuestion(maliciousInput)).toBe("Can you explain?");
    });
  });
});
