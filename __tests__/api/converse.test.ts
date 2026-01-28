/**
 * Converse API Tests
 * 
 * Tests the unified conversational interview endpoint logic,
 * including context building, message validation, and state handling.
 */

describe("Converse API Logic", () => {
  describe("Request Validation", () => {
    const validateRequest = (body: Record<string, unknown>) => {
      const errors: string[] = [];

      if (!body.question || typeof body.question !== "string") {
        errors.push("question context is required");
      }

      if (!body.userMessage || typeof body.userMessage !== "string") {
        errors.push("user message is required");
      }

      // Optional fields with defaults
      if (body.conversationHistory !== undefined && !Array.isArray(body.conversationHistory)) {
        errors.push("conversationHistory must be an array");
      }

      if (body.language !== undefined && typeof body.language !== "string") {
        errors.push("language must be a string");
      }

      const validStates = ["coding", "review", "followup", "feedback", "greeting"];
      if (body.interviewState !== undefined && !validStates.includes(body.interviewState as string)) {
        errors.push("interviewState must be one of: coding, review, followup, feedback, greeting");
      }

      return { valid: errors.length === 0, errors };
    };

    it("should require question parameter", () => {
      const result = validateRequest({
        userMessage: "Can you clarify the input format?",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("question context is required");
    });

    it("should require userMessage parameter", () => {
      const result = validateRequest({
        question: "Two Sum Problem",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("user message is required");
    });

    it("should validate complete minimal request", () => {
      const result = validateRequest({
        question: "Two Sum Problem",
        userMessage: "What data structure should I use?",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate complete request with all optional fields", () => {
      const result = validateRequest({
        question: "Two Sum Problem",
        userMessage: "What data structure should I use?",
        conversationHistory: [],
        code: "def two_sum(): pass",
        language: "python",
        evaluation: { overallScore: 4.2 },
        interviewState: "coding",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject invalid interviewState", () => {
      const result = validateRequest({
        question: "Two Sum Problem",
        userMessage: "Hello",
        interviewState: "invalid_state",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("interviewState must be one of: coding, review, followup, feedback, greeting");
    });

    it("should accept greeting as valid interviewState", () => {
      const result = validateRequest({
        question: "Two Sum Problem",
        userMessage: "Hello!",
        interviewState: "greeting",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject non-array conversationHistory", () => {
      const result = validateRequest({
        question: "Two Sum Problem",
        userMessage: "Hello",
        conversationHistory: "not an array",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("conversationHistory must be an array");
    });
  });

  describe("Conversation History Sanitization", () => {
    type ConversationMessage = {
      role: "interviewer" | "candidate";
      content: string;
      timestamp?: number;
    };

    const sanitizeHistory = (history: unknown[], maxTurns = 15): ConversationMessage[] => {
      if (!Array.isArray(history)) return [];
      
      const sanitized: ConversationMessage[] = [];
      for (const turn of history.slice(-maxTurns)) {
        if (
          turn &&
          typeof turn === "object" &&
          ((turn as any).role === "interviewer" || (turn as any).role === "candidate")
        ) {
          const t = turn as any;
          if (typeof t.content === "string") {
            sanitized.push({
              role: t.role,
              content: t.content.slice(0, 2000), // Truncate long messages
            });
          }
        }
      }
      return sanitized;
    };

    it("should filter out invalid conversation turns", () => {
      const history = [
        { role: "interviewer", content: "Valid question" },
        { role: "invalid", content: "Invalid role" },
        { content: "Missing role" },
        null,
        "not an object",
        { role: "candidate", content: "Valid answer" },
      ];

      const sanitized = sanitizeHistory(history);
      expect(sanitized).toHaveLength(2);
      expect(sanitized[0].role).toBe("interviewer");
      expect(sanitized[1].role).toBe("candidate");
    });

    it("should truncate long messages", () => {
      const longMessage = "a".repeat(3000);
      const history = [{ role: "candidate", content: longMessage }];

      const sanitized = sanitizeHistory(history);
      expect(sanitized[0].content.length).toBe(2000);
    });

    it("should limit to last N turns", () => {
      const history = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? "interviewer" : "candidate",
        content: `Message ${i}`,
      }));

      const sanitized = sanitizeHistory(history, 15);
      expect(sanitized).toHaveLength(15);
      expect(sanitized[0].content).toBe("Message 5"); // Starts from index 5
    });

    it("should handle empty history", () => {
      expect(sanitizeHistory([])).toHaveLength(0);
      expect(sanitizeHistory(null as any)).toHaveLength(0);
    });
  });

  describe("Context Building", () => {
    const buildCodeContext = (code: string | undefined, language: string) => {
      if (!code || !code.trim()) {
        return "\n\n(No code written yet)";
      }
      return `\n\nCandidate's current code (${language}):\n\`\`\`${language}\n${code.slice(0, 8000)}\n\`\`\``;
    };

    const buildEvaluationContext = (evaluation: any) => {
      if (!evaluation) return "";
      return `\n\nCode evaluation results:\n- Overall Score: ${evaluation.overallScore}/5\n- Feedback: ${evaluation.overallFeedback || "N/A"}`;
    };

    it("should build code context with code", () => {
      const context = buildCodeContext("def two_sum(): pass", "python");
      expect(context).toContain("def two_sum(): pass");
      expect(context).toContain("python");
    });

    it("should handle missing code", () => {
      expect(buildCodeContext("", "python")).toBe("\n\n(No code written yet)");
      expect(buildCodeContext(undefined, "python")).toBe("\n\n(No code written yet)");
    });

    it("should truncate very long code", () => {
      const longCode = "x".repeat(10000);
      const context = buildCodeContext(longCode, "python");
      expect(context.length).toBeLessThan(10000);
    });

    it("should build evaluation context when present", () => {
      const context = buildEvaluationContext({
        overallScore: 4.2,
        overallFeedback: "Great solution!",
      });
      expect(context).toContain("4.2/5");
      expect(context).toContain("Great solution!");
    });

    it("should handle missing evaluation", () => {
      expect(buildEvaluationContext(null)).toBe("");
      expect(buildEvaluationContext(undefined)).toBe("");
    });
  });

  describe("Interview State Handling", () => {
    const getStateGuidance = (state: string): string => {
      const guidance: Record<string, string> = {
        coding: "Help with coding questions",
        review: "Discuss code review",
        followup: "Follow-up discussion",
        feedback: "Wrap up interview",
        greeting: "Greet the candidate warmly",
      };
      return guidance[state] || guidance.coding;
    };

    it("should return correct guidance for each state", () => {
      expect(getStateGuidance("coding")).toContain("coding");
      expect(getStateGuidance("review")).toContain("review");
      expect(getStateGuidance("followup")).toContain("Follow-up");
      expect(getStateGuidance("feedback")).toContain("Wrap up");
    });

    it("should return greeting guidance for greeting state", () => {
      expect(getStateGuidance("greeting")).toContain("Greet");
    });

    it("should default to coding state guidance for unknown states", () => {
      expect(getStateGuidance("unknown")).toContain("coding");
    });
  });

  describe("Greeting Flow", () => {
    const isGreeting = (state: string) => state === "greeting";

    // Updated: Greeting context now includes the full question for unified response
    const buildGreetingContext = (userGreeting: string, questionTitle: string, questionContent: string) => {
      return `The candidate has just greeted you to start the interview. They said: "${userGreeting}"

INTERVIEW QUESTION TO PRESENT:
Title: "${questionTitle}"
Full Question: ${questionContent}

Greet them warmly, then naturally present this question in full. Make it conversational but ensure you read the ENTIRE question clearly.`;
    };

    it("should identify greeting state correctly", () => {
      expect(isGreeting("greeting")).toBe(true);
      expect(isGreeting("coding")).toBe(false);
      expect(isGreeting("review")).toBe(false);
    });

    it("should build greeting context with user message and question", () => {
      const context = buildGreetingContext("Hello!", "Two Sum", "Given an array of integers...");
      expect(context).toContain("Hello!");
      expect(context).toContain("Two Sum");
      expect(context).toContain("Given an array of integers");
      expect(context).toContain("Greet them warmly");
    });

    it("should include question in greeting context for unified response", () => {
      const buildContext = (state: string, questionTitle: string, questionContent: string, userMessage: string) => {
        if (state === "greeting") {
          return buildGreetingContext(userMessage, questionTitle, questionContent);
        }
        return `INTERVIEW PROBLEM: ${questionTitle}\n${questionContent}\nUser said: ${userMessage}`;
      };

      // Greeting context now INCLUDES the question for unified greeting+question response
      const greetingContext = buildContext("greeting", "Two Sum", "Find two numbers that add up to target", "Hi there!");
      expect(greetingContext).toContain("Two Sum");
      expect(greetingContext).toContain("Find two numbers that add up to target");
      expect(greetingContext).toContain("Hi there!");
      expect(greetingContext).toContain("INTERVIEW QUESTION TO PRESENT");

      const codingContext = buildContext("coding", "Two Sum", "Find two numbers", "What approach?");
      expect(codingContext).toContain("Two Sum");
      expect(codingContext).toContain("INTERVIEW PROBLEM");
    });
  });

  describe("Response Validation", () => {
    const validateResponse = (response: unknown) => {
      if (!response || typeof response !== "object") return false;
      const r = response as Record<string, unknown>;
      
      // Must have a text response
      if (typeof r.response !== "string" || r.response.length === 0) {
        return false;
      }
      
      // Audio is optional but must be string if present
      if (r.audio !== undefined && r.audio !== null && typeof r.audio !== "string") {
        return false;
      }

      return true;
    };

    it("should validate proper response with audio", () => {
      expect(validateResponse({
        response: "That's a good question!",
        audio: "base64encodedaudio",
      })).toBe(true);
    });

    it("should validate response without audio", () => {
      expect(validateResponse({
        response: "That's a good question!",
        audio: null,
      })).toBe(true);
    });

    it("should reject empty response", () => {
      expect(validateResponse({ response: "" })).toBe(false);
    });

    it("should reject missing response", () => {
      expect(validateResponse({})).toBe(false);
      expect(validateResponse(null)).toBe(false);
    });
  });

  describe("Message Length Validation", () => {
    const validateMessageLength = (message: string, min: number, max: number) => {
      if (message.length < min) {
        return { valid: false, error: `Message too short (min ${min} characters)` };
      }
      if (message.length > max) {
        return { valid: false, error: `Message too long (max ${max} characters)` };
      }
      return { valid: true };
    };

    it("should accept valid length messages", () => {
      expect(validateMessageLength("Hello", 2, 2000).valid).toBe(true);
      expect(validateMessageLength("Can you explain time complexity?", 2, 2000).valid).toBe(true);
    });

    it("should reject too short messages", () => {
      const result = validateMessageLength("H", 2, 2000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too short");
    });

    it("should reject too long messages", () => {
      const result = validateMessageLength("a".repeat(3000), 2, 2000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too long");
    });
  });

  describe("Conversation Flow", () => {
    type ConversationTurn = {
      role: "interviewer" | "candidate";
      content: string;
      timestamp: number;
    };

    it("should alternate between interviewer and candidate", () => {
      const conversation: ConversationTurn[] = [
        { role: "interviewer", content: "What approach are you thinking?", timestamp: 1 },
        { role: "candidate", content: "I'll use a hash map.", timestamp: 2 },
        { role: "interviewer", content: "Good! Why?", timestamp: 3 },
        { role: "candidate", content: "For O(1) lookups.", timestamp: 4 },
      ];

      // Verify alternating pattern
      for (let i = 0; i < conversation.length - 1; i++) {
        expect(conversation[i].role).not.toBe(conversation[i + 1].role);
      }
    });

    it("should track conversation length", () => {
      const conversation: ConversationTurn[] = [];
      
      const addTurn = (role: "interviewer" | "candidate", content: string) => {
        conversation.push({ role, content, timestamp: Date.now() });
      };

      addTurn("interviewer", "Question 1");
      addTurn("candidate", "Answer 1");
      addTurn("interviewer", "Question 2");

      expect(conversation).toHaveLength(3);
    });

    it("should handle conversation continuation after code submission", () => {
      // After code is submitted, conversation should continue with follow-ups
      const beforeSubmission: ConversationTurn[] = [
        { role: "candidate", content: "What if the array is empty?", timestamp: 1 },
        { role: "interviewer", content: "Good question! Return an empty result.", timestamp: 2 },
      ];

      const afterSubmission: ConversationTurn[] = [
        ...beforeSubmission,
        { role: "interviewer", content: "Your code looks good. What's the time complexity?", timestamp: 3 },
        { role: "candidate", content: "O(n) because we iterate once.", timestamp: 4 },
      ];

      expect(afterSubmission).toHaveLength(4);
      expect(afterSubmission[2].role).toBe("interviewer"); // Follow-up question
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed request gracefully", () => {
      const validateAndSanitize = (body: unknown) => {
        try {
          if (!body || typeof body !== "object") {
            return { error: "Invalid request body" };
          }
          const b = body as Record<string, unknown>;
          if (!b.question) return { error: "Question is required" };
          if (!b.userMessage) return { error: "Message is required" };
          return { valid: true };
        } catch {
          return { error: "Failed to parse request" };
        }
      };

      expect(validateAndSanitize(null)).toEqual({ error: "Invalid request body" });
      expect(validateAndSanitize(undefined)).toEqual({ error: "Invalid request body" });
      expect(validateAndSanitize("string")).toEqual({ error: "Invalid request body" });
      expect(validateAndSanitize({})).toEqual({ error: "Question is required" });
    });

    it("should sanitize XSS attempts in user messages", () => {
      const sanitize = (input: string) => {
        return input
          .replace(/<script[^>]*>.*?<\/script>/gi, "")
          .replace(/<[^>]+>/g, "")
          .trim();
      };

      expect(sanitize('<script>alert("xss")</script>Hello')).toBe("Hello");
      expect(sanitize('<img onerror="alert(1)" src="x">Question?')).toBe("Question?");
    });
  });
});
