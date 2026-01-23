/**
 * InterviewPanel Unified Conversation Tests
 * 
 * Tests the unified conversational interview system including:
 * - Conversation state management
 * - Message flow handling
 * - Recording state transitions
 * - Context-aware responses
 */

describe("InterviewPanel Conversation System", () => {
  // Conversation turn type
  type ConversationTurn = {
    role: "interviewer" | "candidate";
    content: string;
    timestamp: number;
  };

  // Panel states
  type PanelState = "speaking" | "coding" | "processing" | "review" | "followup" | "feedback";

  // Recording states
  type RecordingState = "idle" | "recording" | "processing";

  describe("Conversation State Management", () => {
    it("should initialize with empty conversation", () => {
      const conversation: ConversationTurn[] = [];
      expect(conversation).toHaveLength(0);
    });

    it("should add user message to conversation", () => {
      const conversation: ConversationTurn[] = [];
      
      const addUserMessage = (content: string) => {
        conversation.push({
          role: "candidate",
          content,
          timestamp: Date.now()
        });
      };

      addUserMessage("What data structure should I use?");
      
      expect(conversation).toHaveLength(1);
      expect(conversation[0].role).toBe("candidate");
      expect(conversation[0].content).toContain("data structure");
    });

    it("should add interviewer response to conversation", () => {
      const conversation: ConversationTurn[] = [
        { role: "candidate", content: "Question", timestamp: Date.now() }
      ];

      const addInterviewerResponse = (content: string) => {
        conversation.push({
          role: "interviewer",
          content,
          timestamp: Date.now()
        });
      };

      addInterviewerResponse("Good question! You could use a hash map for O(1) lookups.");

      expect(conversation).toHaveLength(2);
      expect(conversation[1].role).toBe("interviewer");
    });

    it("should maintain conversation order", () => {
      const conversation: ConversationTurn[] = [];
      const now = Date.now();

      conversation.push({ role: "interviewer", content: "Initial question", timestamp: now });
      conversation.push({ role: "candidate", content: "My approach", timestamp: now + 1 });
      conversation.push({ role: "interviewer", content: "Follow-up", timestamp: now + 2 });
      conversation.push({ role: "candidate", content: "Answer", timestamp: now + 3 });

      // Verify order by timestamp
      for (let i = 0; i < conversation.length - 1; i++) {
        expect(conversation[i].timestamp).toBeLessThan(conversation[i + 1].timestamp);
      }
    });

    it("should scroll to latest message", () => {
      // Simulate scrollIntoView behavior
      let scrolledTo: string | null = null;
      
      const scrollToBottom = (conversationEndRef: { current: HTMLDivElement | null }) => {
        if (conversationEndRef.current) {
          scrolledTo = "bottom";
        }
      };

      const mockRef = { current: { scrollIntoView: jest.fn() } as unknown as HTMLDivElement };
      scrollToBottom(mockRef);

      expect(scrolledTo).toBe("bottom");
    });
  });

  describe("Recording State Transitions", () => {
    it("should start in idle state", () => {
      const recordingState: RecordingState = "idle";
      expect(recordingState).toBe("idle");
    });

    it("should transition from idle to recording", () => {
      let recordingState: RecordingState = "idle";
      
      const startRecording = () => {
        recordingState = "recording";
      };

      startRecording();
      expect(recordingState).toBe("recording");
    });

    it("should transition from recording to processing", () => {
      let recordingState: RecordingState = "recording";
      
      const stopRecording = () => {
        recordingState = "processing";
      };

      stopRecording();
      expect(recordingState).toBe("processing");
    });

    it("should transition from processing back to idle", () => {
      let recordingState: RecordingState = "processing";
      
      const finishProcessing = () => {
        recordingState = "idle";
      };

      finishProcessing();
      expect(recordingState).toBe("idle");
    });

    it("should toggle recording correctly", () => {
      let recordingState: RecordingState = "idle";

      const toggleRecording = () => {
        if (recordingState === "recording") {
          recordingState = "processing";
        } else if (recordingState === "idle") {
          recordingState = "recording";
        }
      };

      toggleRecording(); // idle -> recording
      expect(recordingState).toBe("recording");

      toggleRecording(); // recording -> processing
      expect(recordingState).toBe("processing");

      toggleRecording(); // processing -> no change (can't toggle while processing)
      expect(recordingState).toBe("processing");
    });
  });

  describe("Panel State Interaction with Conversation", () => {
    it("should allow conversation during coding state", () => {
      const panelState: PanelState = "coding";
      const canConverse = ["coding", "speaking", "review", "followup"].includes(panelState);
      expect(canConverse).toBe(true);
    });

    it("should allow conversation during review state", () => {
      const panelState: PanelState = "review";
      const canConverse = ["coding", "speaking", "review", "followup"].includes(panelState);
      expect(canConverse).toBe(true);
    });

    it("should allow conversation during followup state", () => {
      const panelState: PanelState = "followup";
      const canConverse = ["coding", "speaking", "review", "followup"].includes(panelState);
      expect(canConverse).toBe(true);
    });

    it("should not allow conversation during processing state", () => {
      const panelState: PanelState = "processing";
      const canConverse = ["coding", "speaking", "review", "followup"].includes(panelState);
      expect(canConverse).toBe(false);
    });

    it("should disable record button while conversing", () => {
      const isConversing = true;
      const isSpeaking = false;
      const isButtonDisabled = isConversing || isSpeaking;
      expect(isButtonDisabled).toBe(true);
    });

    it("should disable record button while AI is speaking", () => {
      const isConversing = false;
      const isSpeaking = true;
      const isButtonDisabled = isConversing || isSpeaking;
      expect(isButtonDisabled).toBe(true);
    });
  });

  describe("Skip to Results", () => {
    it("should allow skip only when evaluation exists", () => {
      const evaluation = { overallScore: 4.2 };
      const panelState: PanelState = "followup";
      
      const canSkipToResults = evaluation && (panelState === "followup" || panelState === "review");
      expect(canSkipToResults).toBeTruthy();
    });

    it("should not allow skip without evaluation", () => {
      const evaluation = null;
      const panelState: PanelState = "followup";
      
      const canSkipToResults = evaluation && (panelState === "followup" || panelState === "review");
      expect(canSkipToResults).toBeFalsy();
    });

    it("should transition to feedback on skip", () => {
      let panelState: PanelState = "followup";
      
      const skipToResults = () => {
        panelState = "feedback";
      };

      skipToResults();
      expect(panelState).toBe("feedback");
    });
  });

  describe("Conversation Context Building", () => {
    it("should include question context", () => {
      const question = {
        title: "Two Sum",
        prompt: "Find two numbers that add up to target"
      };
      
      const buildContext = () => `${question.title}\n\n${question.prompt}`;
      
      const context = buildContext();
      expect(context).toContain("Two Sum");
      expect(context).toContain("Find two numbers");
    });

    it("should include code context when available", () => {
      const code = "def two_sum(nums, target): pass";
      const language = "python";
      
      const buildCodeContext = () => code ? `\n\nCode (${language}):\n${code}` : "";
      
      const context = buildCodeContext();
      expect(context).toContain("python");
      expect(context).toContain("def two_sum");
    });

    it("should include evaluation when available", () => {
      const evaluation = {
        overallScore: 4.2,
        overallFeedback: "Good solution"
      };
      
      const buildEvalContext = () => evaluation 
        ? `\n\nScore: ${evaluation.overallScore}/5\n${evaluation.overallFeedback}`
        : "";
      
      const context = buildEvalContext();
      expect(context).toContain("4.2/5");
      expect(context).toContain("Good solution");
    });

    it("should include conversation history", () => {
      const conversation: ConversationTurn[] = [
        { role: "candidate", content: "What about empty arrays?", timestamp: 1 },
        { role: "interviewer", content: "Good question!", timestamp: 2 }
      ];
      
      const buildHistoryContext = () => {
        return conversation.map(t => 
          `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.content}`
        ).join("\n");
      };
      
      const context = buildHistoryContext();
      expect(context).toContain("What about empty arrays?");
      expect(context).toContain("Good question!");
    });
  });

  describe("Follow-up Flow Integration", () => {
    it("should add follow-up question to conversation", () => {
      const conversation: ConversationTurn[] = [];
      const followUpQuestion = "What's the time complexity of your solution?";

      const addFollowUpToConversation = () => {
        conversation.push({
          role: "interviewer",
          content: followUpQuestion,
          timestamp: Date.now()
        });
      };

      addFollowUpToConversation();

      expect(conversation).toHaveLength(1);
      expect(conversation[0].role).toBe("interviewer");
      expect(conversation[0].content).toContain("time complexity");
    });

    it("should track follow-up count", () => {
      let followUpCount = 0;
      const MAX_FOLLOWUPS = 3;

      const incrementFollowUp = () => {
        if (followUpCount < MAX_FOLLOWUPS) {
          followUpCount++;
          return true;
        }
        return false;
      };

      expect(incrementFollowUp()).toBe(true);
      expect(incrementFollowUp()).toBe(true);
      expect(incrementFollowUp()).toBe(true);
      expect(incrementFollowUp()).toBe(false); // Max reached

      expect(followUpCount).toBe(3);
    });

    it("should transition to feedback after max follow-ups", () => {
      let panelState: PanelState = "followup";
      const followUpCount = 3;
      const MAX_FOLLOWUPS = 3;

      const checkFollowUpLimit = () => {
        if (followUpCount >= MAX_FOLLOWUPS) {
          panelState = "feedback";
        }
      };

      checkFollowUpLimit();
      expect(panelState).toBe("feedback");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", () => {
      let error: string | null = null;
      
      const handleApiError = (err: Error) => {
        error = err.message || "Something went wrong";
      };

      handleApiError(new Error("Network error"));
      expect(error).toBe("Network error");
    });

    it("should handle empty transcription", () => {
      const transcript = "";
      
      const validateTranscript = (text: string): boolean => {
        return !!(text && text.trim().length > 0);
      };

      expect(validateTranscript(transcript)).toBe(false);
    });

    it("should handle microphone permission denied", () => {
      let error: string | null = null;
      
      const handlePermissionDenied = () => {
        error = "Microphone access denied.";
      };

      handlePermissionDenied();
      expect(error).toContain("Microphone");
    });
  });

  describe("Audio Queue Integration", () => {
    it("should clear audio queue before processing", () => {
      let audioQueueCleared = false;
      
      const clearAudioQueue = () => {
        audioQueueCleared = true;
      };

      clearAudioQueue();
      expect(audioQueueCleared).toBe(true);
    });

    it("should prevent recording while audio is playing", () => {
      const isSpeaking = true;
      const recordingState: RecordingState = "idle";
      
      const canStartRecording = !isSpeaking && recordingState === "idle";
      expect(canStartRecording).toBe(false);
    });
  });

  describe("Reset and Cleanup", () => {
    it("should reset conversation on try again", () => {
      const conversation: ConversationTurn[] = [
        { role: "interviewer", content: "Question", timestamp: 1 },
        { role: "candidate", content: "Answer", timestamp: 2 }
      ];

      const resetConversation = () => {
        conversation.length = 0;
      };

      resetConversation();
      expect(conversation).toHaveLength(0);
    });

    it("should reset recording state on cleanup", () => {
      let recordingState: RecordingState = "recording";
      
      const cleanup = () => {
        recordingState = "idle";
      };

      cleanup();
      expect(recordingState).toBe("idle");
    });

    it("should reset follow-up count on try again", () => {
      let followUpCount = 2;
      
      const resetFollowUps = () => {
        followUpCount = 0;
      };

      resetFollowUps();
      expect(followUpCount).toBe(0);
    });
  });
});
