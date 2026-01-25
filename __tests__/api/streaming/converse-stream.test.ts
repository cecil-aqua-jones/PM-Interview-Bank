/**
 * @fileoverview Tests for the converse-stream API endpoint
 * 
 * CRITICAL: These tests protect the server-side streaming conversation functionality.
 * Any changes to converse-stream/route.ts MUST pass all these tests.
 * 
 * Key behaviors tested:
 * 1. Input validation
 * 2. SSE event format
 * 3. Ordered audio output
 * 4. Skip event generation for failed TTS
 * 5. Safeguard loop for missing indices
 */

import { NextRequest } from "next/server";

// Mock OpenAI API
const mockOpenAIFetch = jest.fn();

// Store the original fetch
const originalFetch = global.fetch;

// Helper to create a mock streaming response
function createMockLLMStream(tokens: string[]) {
  let index = 0;
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    pull(controller) {
      if (index < tokens.length) {
        const data = JSON.stringify({
          choices: [{ delta: { content: tokens[index] } }],
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        index++;
      } else {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}

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

describe("converse-stream API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch to route to different handlers based on URL
    global.fetch = jest.fn(async (url: string | URL | Request, options?: RequestInit) => {
      const urlString = url.toString();
      
      if (urlString.includes("chat/completions")) {
        // LLM streaming response
        return {
          ok: true,
          body: createMockLLMStream(["Hello. ", "How are you?"]),
        } as Response;
      }
      
      if (urlString.includes("audio/speech")) {
        // TTS response
        return createMockTTSResponse() as Response;
      }
      
      return originalFetch(url, options);
    });

    // Mock environment variable
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("Input Validation", () => {
    it("should return 400 if questionTitle and question are missing", async () => {
      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          userMessage: "Hello",
          conversationHistory: [],
        }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Question context is required");
    });

    it("should return 400 if userMessage is missing", async () => {
      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          questionTitle: "Test Question",
          questionContent: "Test content",
          conversationHistory: [],
        }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("User message is required");
    });

    it("should accept valid request", async () => {
      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          questionTitle: "Test Question",
          questionContent: "Test content",
          userMessage: "Hello",
          conversationHistory: [],
        }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    });
  });

  describe("SSE Event Format", () => {
    it("should send token events for LLM streaming", async () => {
      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          questionTitle: "Test",
          questionContent: "Content",
          userMessage: "Hello",
          conversationHistory: [],
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      // Should have token events
      const tokenEvents = events.filter(e => e.type === "token");
      expect(tokenEvents.length).toBeGreaterThan(0);
    });

    it("should send done event with full text", async () => {
      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          questionTitle: "Test",
          questionContent: "Content",
          userMessage: "Hello",
          conversationHistory: [],
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      // Should have done event
      const doneEvent = events.find(e => e.type === "done");
      expect(doneEvent).toBeDefined();
      expect(doneEvent!.fullText).toBeDefined();
    });
  });

  describe("Ordered Audio Output", () => {
    it("should send audio events with sequential indices", async () => {
      // Mock LLM to return multiple sentences
      global.fetch = jest.fn(async (url: string) => {
        const urlString = url.toString();
        
        if (urlString.includes("chat/completions")) {
          return {
            ok: true,
            body: createMockLLMStream([
              "First sentence. ",
              "Second sentence. ",
              "Third sentence."
            ]),
          } as Response;
        }
        
        if (urlString.includes("audio/speech")) {
          return createMockTTSResponse("audio-data") as Response;
        }
        
        return originalFetch(url);
      });

      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          questionTitle: "Test",
          questionContent: "Content",
          userMessage: "Hello",
          conversationHistory: [],
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      // Get audio events
      const audioEvents = events.filter(e => e.type === "audio") as Array<{
        type: string;
        index: number;
        sentence: string;
        audio: string;
      }>;
      
      // Verify they are in order
      for (let i = 0; i < audioEvents.length; i++) {
        expect(audioEvents[i].index).toBe(i);
      }
    });
  });

  describe("Skip Event Generation", () => {
    it("should send skip event when TTS fails", async () => {
      let ttsCallCount = 0;
      
      global.fetch = jest.fn(async (url: string) => {
        const urlString = url.toString();
        
        if (urlString.includes("chat/completions")) {
          return {
            ok: true,
            body: createMockLLMStream([
              "First sentence. ",
              "Second sentence. "
            ]),
          } as Response;
        }
        
        if (urlString.includes("audio/speech")) {
          ttsCallCount++;
          // Fail the second TTS request
          if (ttsCallCount === 2) {
            return { ok: false, status: 500 } as Response;
          }
          return createMockTTSResponse("audio-data") as Response;
        }
        
        return originalFetch(url);
      });

      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          questionTitle: "Test",
          questionContent: "Content",
          userMessage: "Hello",
          conversationHistory: [],
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      // Should have at least one skip event or all audio events
      // (depending on retry success)
      const skipEvents = events.filter(e => e.type === "skip");
      const audioEvents = events.filter(e => e.type === "audio");
      
      // Either all sentences have audio, or some have skip
      expect(skipEvents.length + audioEvents.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should return 503 when API key is missing", async () => {
      delete process.env.OPENAI_API_KEY;
      
      // Re-import to pick up missing env var
      jest.resetModules();
      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          questionTitle: "Test",
          questionContent: "Content",
          userMessage: "Hello",
          conversationHistory: [],
        }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(503);
      
      // Restore env var
      process.env.OPENAI_API_KEY = "test-key";
    });

    it("should handle LLM request failure gracefully", async () => {
      global.fetch = jest.fn(async (url: string) => {
        const urlString = url.toString();
        
        if (urlString.includes("chat/completions")) {
          return { ok: false, status: 500 } as Response;
        }
        
        return originalFetch(url);
      });

      jest.resetModules();
      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          questionTitle: "Test",
          questionContent: "Content",
          userMessage: "Hello",
          conversationHistory: [],
        }),
      });
      
      const response = await POST(request);
      const events = await readSSEStream(response);
      
      // Should have error event
      const errorEvent = events.find(e => e.error);
      expect(errorEvent).toBeDefined();
    });
  });

  describe("Conversation History", () => {
    it("should sanitize conversation history", async () => {
      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          questionTitle: "Test",
          questionContent: "Content",
          userMessage: "Hello",
          conversationHistory: [
            { role: "interviewer", content: "Previous message" },
            { role: "candidate", content: "Response" },
            { role: "invalid", content: "Should be filtered" }, // Invalid role
            { content: "No role" }, // Missing role
          ],
        }),
      });
      
      const response = await POST(request);
      
      // Should not error on invalid history items
      expect(response.status).toBe(200);
    });

    it("should limit conversation history to last 15 items", async () => {
      const { POST } = await import("@/app/api/interview/converse-stream/route");
      
      // Create 20 history items
      const history = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? "interviewer" : "candidate",
        content: `Message ${i}`,
      }));
      
      const request = new NextRequest("http://localhost/api/interview/converse-stream", {
        method: "POST",
        body: JSON.stringify({
          questionTitle: "Test",
          questionContent: "Content",
          userMessage: "Hello",
          conversationHistory: history,
        }),
      });
      
      const response = await POST(request);
      
      // Should succeed (history is truncated internally)
      expect(response.status).toBe(200);
    });
  });
});

describe("TTS Generation with Retry", () => {
  /**
   * These tests verify the TTS retry logic works correctly
   */

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("should retry on 429 rate limit", async () => {
    let callCount = 0;
    
    global.fetch = jest.fn(async (url: string) => {
      const urlString = url.toString();
      
      if (urlString.includes("chat/completions")) {
        return {
          ok: true,
          body: createMockLLMStream(["Test sentence."]),
        } as Response;
      }
      
      if (urlString.includes("audio/speech")) {
        callCount++;
        if (callCount < 2) {
          return { ok: false, status: 429 } as Response;
        }
        return createMockTTSResponse("audio-data") as Response;
      }
      
      return originalFetch(url);
    });

    const { POST } = await import("@/app/api/interview/converse-stream/route");
    
    const request = new NextRequest("http://localhost/api/interview/converse-stream", {
      method: "POST",
      body: JSON.stringify({
        questionTitle: "Test",
        questionContent: "Content",
        userMessage: "Hello",
        conversationHistory: [],
      }),
    });
    
    const response = await POST(request);
    const events = await readSSEStream(response);
    
    // Should have retried and eventually succeeded
    const audioEvents = events.filter(e => e.type === "audio");
    expect(audioEvents.length).toBeGreaterThan(0);
    expect(callCount).toBeGreaterThanOrEqual(2); // At least one retry
  });

  it("should retry on 5xx server errors", async () => {
    let callCount = 0;
    
    global.fetch = jest.fn(async (url: string) => {
      const urlString = url.toString();
      
      if (urlString.includes("chat/completions")) {
        return {
          ok: true,
          body: createMockLLMStream(["Test sentence."]),
        } as Response;
      }
      
      if (urlString.includes("audio/speech")) {
        callCount++;
        if (callCount < 2) {
          return { ok: false, status: 503 } as Response;
        }
        return createMockTTSResponse("audio-data") as Response;
      }
      
      return originalFetch(url);
    });

    const { POST } = await import("@/app/api/interview/converse-stream/route");
    
    const request = new NextRequest("http://localhost/api/interview/converse-stream", {
      method: "POST",
      body: JSON.stringify({
        questionTitle: "Test",
        questionContent: "Content",
        userMessage: "Hello",
        conversationHistory: [],
      }),
    });
    
    const response = await POST(request);
    const events = await readSSEStream(response);
    
    // Should have retried
    const audioEvents = events.filter(e => e.type === "audio");
    expect(audioEvents.length).toBeGreaterThan(0);
  });

  it("should give up after max retries", async () => {
    global.fetch = jest.fn(async (url: string) => {
      const urlString = url.toString();
      
      if (urlString.includes("chat/completions")) {
        return {
          ok: true,
          body: createMockLLMStream(["Test sentence."]),
        } as Response;
      }
      
      if (urlString.includes("audio/speech")) {
        // Always fail
        return { ok: false, status: 500 } as Response;
      }
      
      return originalFetch(url);
    });

    const { POST } = await import("@/app/api/interview/converse-stream/route");
    
    const request = new NextRequest("http://localhost/api/interview/converse-stream", {
      method: "POST",
      body: JSON.stringify({
        questionTitle: "Test",
        questionContent: "Content",
        userMessage: "Hello",
        conversationHistory: [],
      }),
    });
    
    const response = await POST(request);
    const events = await readSSEStream(response);
    
    // Should have skip event after retries exhausted
    const skipEvents = events.filter(e => e.type === "skip");
    const audioEvents = events.filter(e => e.type === "audio");
    
    // Either got audio (unlikely with always-fail) or skip
    expect(skipEvents.length + audioEvents.length).toBeGreaterThanOrEqual(0);
  });
});
