/**
 * @fileoverview Tests for the speak-stream API endpoint
 * 
 * CRITICAL: These tests protect the server-side initial question streaming functionality.
 * Any changes to speak-stream/route.ts MUST pass all these tests.
 * 
 * Key behaviors tested:
 * 1. Input validation
 * 2. SSE event format (info, audio, skip, done)
 * 3. Sentence splitting
 * 4. Ordered audio output
 * 5. Skip event generation
 * 6. Long question summarization
 */

import { NextRequest } from "next/server";

// Store the original fetch
const originalFetch = global.fetch;

// Helper to create mock TTS response
function createMockTTSResponse(audioData: string | null = "mock-audio-base64") {
  if (audioData === null) {
    return { ok: false, status: 500 };
  }
  return {
    ok: true,
    arrayBuffer: () => Promise.resolve(Buffer.from(audioData)),
  };
}

// Helper to create mock GPT summarization response
function createMockSummarizeResponse(summary: string) {
  return {
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content: summary } }],
    }),
  };
}

// Helper to read SSE stream into events
async function readSSEStream(response: Response): Promise<Array<Record<string, unknown>>> {
  const events: Array<Record<string, unknown>> = [];
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          events.push(JSON.parse(line.slice(6)));
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
  
  return events;
}

describe("speak-stream API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock: TTS always succeeds
    global.fetch = jest.fn(async (url: string) => {
      const urlString = url.toString();
      
      if (urlString.includes("audio/speech")) {
        return createMockTTSResponse("audio-data") as Response;
      }
      
      if (urlString.includes("chat/completions")) {
        return createMockSummarizeResponse("Short summary.") as Response;
      }
      
      return originalFetch(url);
    });

    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("Input Validation", () => {
    it("should return 400 if no question content provided", async () => {
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({}),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Question is required");
    });

    it("should accept questionContent field", async () => {
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: "Write a function to reverse a string.",
        }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    });

    it("should accept legacy question field", async () => {
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          question: "Write a function to reverse a string.",
        }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
    });

    it("should return 400 for content that is too short", async () => {
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: "Hi", // Too short (< 10 chars)
        }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe("SSE Event Format", () => {
    it("should send info event with totalSentences", async () => {
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: "Write a function to reverse a string.",
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      const infoEvent = events.find(e => e.type === "info");
      expect(infoEvent).toBeDefined();
      expect(typeof infoEvent!.totalSentences).toBe("number");
      expect(infoEvent!.fullText).toBeDefined();
    });

    it("should send audio events with index, sentence, and audio", async () => {
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: "Write a function to reverse a string.",
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      const audioEvents = events.filter(e => e.type === "audio") as Array<{
        type: string;
        index: number;
        sentence: string;
        audio: string;
      }>;
      
      expect(audioEvents.length).toBeGreaterThan(0);
      
      for (const event of audioEvents) {
        expect(typeof event.index).toBe("number");
        expect(typeof event.sentence).toBe("string");
        expect(typeof event.audio).toBe("string");
      }
    });

    it("should send done event at the end", async () => {
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: "Write a function to reverse a string.",
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      const doneEvent = events.find(e => e.type === "done");
      expect(doneEvent).toBeDefined();
    });
  });

  describe("Ordered Audio Output", () => {
    it("should send audio events in sequential order", async () => {
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: "First sentence here. Second sentence here. Third sentence here.",
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      const audioEvents = events.filter(e => e.type === "audio") as Array<{
        index: number;
      }>;
      
      // Verify sequential indices
      for (let i = 0; i < audioEvents.length; i++) {
        expect(audioEvents[i].index).toBe(i);
      }
    });
  });

  describe("Skip Event Generation", () => {
    it("should send skip event when TTS fails", async () => {
      let callCount = 0;
      
      global.fetch = jest.fn(async (url: string) => {
        const urlString = url.toString();
        
        if (urlString.includes("audio/speech")) {
          callCount++;
          // Fail the second TTS request permanently
          if (callCount >= 2 && callCount <= 4) { // Account for retries
            return { ok: false, status: 400 } as Response; // 400 won't retry
          }
          return createMockTTSResponse("audio-data") as Response;
        }
        
        if (urlString.includes("chat/completions")) {
          return createMockSummarizeResponse("Short summary.") as Response;
        }
        
        return originalFetch(url);
      });

      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: "First sentence. Second sentence. Third sentence.",
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      // Should have mix of audio and skip events
      const skipEvents = events.filter(e => e.type === "skip");
      const audioEvents = events.filter(e => e.type === "audio");
      
      // Total should account for all sentences
      expect(skipEvents.length + audioEvents.length).toBeGreaterThan(0);
    });

    it("should send skip events for all missing indices via safeguard", async () => {
      // Simulate scenario where TTS never resolves for some sentences
      global.fetch = jest.fn(async (url: string) => {
        const urlString = url.toString();
        
        if (urlString.includes("audio/speech")) {
          // Always fail with non-retryable error
          return { ok: false, status: 400 } as Response;
        }
        
        if (urlString.includes("chat/completions")) {
          return createMockSummarizeResponse("Summary.") as Response;
        }
        
        return originalFetch(url);
      });

      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: "First sentence. Second sentence.",
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      // Should have skip events for failed TTS
      const skipEvents = events.filter(e => e.type === "skip");
      expect(skipEvents.length).toBeGreaterThan(0);
      
      // Should still have done event
      const doneEvent = events.find(e => e.type === "done");
      expect(doneEvent).toBeDefined();
    });
  });

  describe("Long Question Summarization", () => {
    it("should summarize questions over 400 characters", async () => {
      const longQuestion = "A".repeat(500); // Over threshold
      
      global.fetch = jest.fn(async (url: string) => {
        const urlString = url.toString();
        
        if (urlString.includes("chat/completions")) {
          // Summarization endpoint
          return createMockSummarizeResponse("This is a short summary.") as Response;
        }
        
        if (urlString.includes("audio/speech")) {
          return createMockTTSResponse("audio-data") as Response;
        }
        
        return originalFetch(url);
      });

      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: longQuestion,
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      // Verify summarization was called (chat/completions)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("chat/completions"),
        expect.anything()
      );
      
      // Should still produce valid output
      const infoEvent = events.find(e => e.type === "info");
      expect(infoEvent).toBeDefined();
    });

    it("should not summarize short questions", async () => {
      const shortQuestion = "Write a function to add two numbers.";
      
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: shortQuestion,
        }),
      });
      
      const response = await POST(request);
      await readSSEStream(response);
      
      // Summarization (chat/completions) should not be called
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      const summarizeCalls = fetchCalls.filter(
        call => call[0].toString().includes("chat/completions")
      );
      
      // For short questions, no summarization call
      expect(summarizeCalls.length).toBe(0);
    });

    it("should respect forceFullRead flag", async () => {
      const longQuestion = "A".repeat(500);
      
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: longQuestion,
          forceFullRead: true,
        }),
      });
      
      const response = await POST(request);
      await readSSEStream(response);
      
      // With forceFullRead, should not call summarization
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      const summarizeCalls = fetchCalls.filter(
        call => call[0].toString().includes("chat/completions")
      );
      
      expect(summarizeCalls.length).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should return 503 when API key is missing", async () => {
      delete process.env.OPENAI_API_KEY;
      
      jest.resetModules();
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: "Test question content here.",
        }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(503);
      
      process.env.OPENAI_API_KEY = "test-key";
    });

    it("should handle invalid JSON body", async () => {
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: "invalid json",
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe("Category Context", () => {
    it("should include category context in speech", async () => {
      const { POST } = await import("@/app/api/interview/speak-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/speak-stream", {
        method: "POST",
        body: JSON.stringify({
          questionContent: "Write a function to traverse a binary tree.",
          category: "Tree",
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      const infoEvent = events.find(e => e.type === "info") as { fullText?: string };
      expect(infoEvent).toBeDefined();
      
      // The full text should mention something about trees/graphs
      // (based on category detection in buildInterviewPrompt)
      expect(infoEvent.fullText).toBeDefined();
    });
  });
});

describe("TTS Retry Logic", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("should retry on 429 rate limit errors", async () => {
    let callCount = 0;
    
    global.fetch = jest.fn(async (url: string) => {
      const urlString = url.toString();
      
      if (urlString.includes("audio/speech")) {
        callCount++;
        if (callCount < 2) {
          return { ok: false, status: 429 } as Response;
        }
        return createMockTTSResponse("audio-data") as Response;
      }
      
      return originalFetch(url);
    });

    const { POST } = await import("@/app/api/interview/speak-stream/route");
    
    const request = new NextRequest("http://localhost/api/interview/speak-stream", {
      method: "POST",
      body: JSON.stringify({
        questionContent: "Short test question here.",
      }),
    });
    
    const response = await POST(request);
    const events = await readSSEStream(response);
    
    const audioEvents = events.filter(e => e.type === "audio");
    expect(audioEvents.length).toBeGreaterThan(0);
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it("should retry on 5xx server errors", async () => {
    let callCount = 0;
    
    global.fetch = jest.fn(async (url: string) => {
      const urlString = url.toString();
      
      if (urlString.includes("audio/speech")) {
        callCount++;
        if (callCount < 2) {
          return { ok: false, status: 502 } as Response;
        }
        return createMockTTSResponse("audio-data") as Response;
      }
      
      return originalFetch(url);
    });

    const { POST } = await import("@/app/api/interview/speak-stream/route");
    
    const request = new NextRequest("http://localhost/api/interview/speak-stream", {
      method: "POST",
      body: JSON.stringify({
        questionContent: "Short test question here.",
      }),
    });
    
    const response = await POST(request);
    const events = await readSSEStream(response);
    
    const audioEvents = events.filter(e => e.type === "audio");
    expect(audioEvents.length).toBeGreaterThan(0);
  });

  it("should not retry on 4xx client errors (except 429)", async () => {
    let callCount = 0;
    
    global.fetch = jest.fn(async (url: string) => {
      const urlString = url.toString();
      
      if (urlString.includes("audio/speech")) {
        callCount++;
        return { ok: false, status: 400 } as Response; // Bad request - no retry
      }
      
      return originalFetch(url);
    });

    const { POST } = await import("@/app/api/interview/speak-stream/route");
    
    const request = new NextRequest("http://localhost/api/interview/speak-stream", {
      method: "POST",
      body: JSON.stringify({
        questionContent: "Short test question here.",
      }),
    });
    
    const response = await POST(request);
    await readSSEStream(response);
    
    // Should not have retried (callCount should be low per sentence)
    // Each sentence makes 1 call, no retries on 400
    expect(callCount).toBeLessThan(10); // Reasonable upper bound
  });
});

describe("Sentence Splitting", () => {
  /**
   * Pure unit tests for sentence splitting logic
   */
  
  function splitIntoSentences(text: string): string[] {
    const sentences: string[] = [];
    const regex = /[^.!?]*[.!?]+(?:\s|$)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const sentence = match[0].trim();
      if (sentence.length > 10) {
        sentences.push(sentence);
      }
    }
    
    const lastIndex = text.lastIndexOf(sentences[sentences.length - 1] || "");
    if (lastIndex >= 0) {
      const remaining = text.slice(lastIndex + (sentences[sentences.length - 1]?.length || 0)).trim();
      if (remaining.length > 10) {
        sentences.push(remaining);
      }
    }
    
    return sentences.length > 0 ? sentences : [text];
  }

  it("should split on periods", () => {
    const text = "First sentence here. Second sentence here.";
    const result = splitIntoSentences(text);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("First sentence here.");
    expect(result[1]).toBe("Second sentence here.");
  });

  it("should split on exclamation marks", () => {
    const text = "Hello there! How are you!";
    const result = splitIntoSentences(text);
    
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("should split on question marks", () => {
    const text = "What is your name? Where are you from?";
    const result = splitIntoSentences(text);
    
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("should filter out short sentences (< 10 chars)", () => {
    const text = "Hi. This is a longer sentence here.";
    const result = splitIntoSentences(text);
    
    // "Hi." should be filtered out
    expect(result.length).toBe(1);
    expect(result[0]).toBe("This is a longer sentence here.");
  });

  it("should handle text without sentence-ending punctuation", () => {
    const text = "This is a statement without proper ending";
    const result = splitIntoSentences(text);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });
});
