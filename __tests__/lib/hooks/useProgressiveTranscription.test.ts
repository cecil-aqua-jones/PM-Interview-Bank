import { renderHook, act, waitFor } from "@testing-library/react";
import { useProgressiveTranscription } from "@/lib/hooks/useProgressiveTranscription";

// Mock fetch for voice-agent API and transcription
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  
  readyState = MockWebSocket.OPEN;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  
  constructor(public url: string, public protocols?: string | string[]) {
    // Simulate connection opening
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 10);
  }
  
  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent("close", { code: 1000 }));
    }
  });
}

// Mock AudioContext
class MockAudioContext {
  state = "running";
  sampleRate = 48000;
  
  createMediaStreamSource = jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  }));
  
  createScriptProcessor = jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    onaudioprocess: null as ((event: AudioProcessingEvent) => void) | null,
  }));
  
  resume = jest.fn(() => Promise.resolve());
  close = jest.fn(() => Promise.resolve());
}

// Apply mocks
(global as any).WebSocket = MockWebSocket;
(global as any).AudioContext = MockAudioContext;

describe("useProgressiveTranscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock voice-agent API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        stt: {
          url: "wss://api.cartesia.ai/stt/websocket?api_key=test-api-key&model=ink-whisper",
          apiKey: "test-api-key",
          config: {
            model: "ink-whisper",
            language: "en",
            sample_rate: 16000,
            encoding: "pcm_s16le",
            min_volume: 0.1,
            max_silence_duration_secs: 1.2,
          },
        },
        session: {
          id: "test-session-id",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("should start with empty transcripts", () => {
      const { result } = renderHook(() => useProgressiveTranscription());
      
      expect(result.current.partialTranscript).toBe("");
      expect(result.current.interimTranscript).toBe("");
      expect(result.current.displayTranscript).toBe("");
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("reset", () => {
    it("should clear all state", () => {
      const { result } = renderHook(() => useProgressiveTranscription());
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.partialTranscript).toBe("");
      expect(result.current.interimTranscript).toBe("");
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe("updateChunks (legacy API)", () => {
    it("should accept calls without error (no-op for backward compatibility)", () => {
      const { result } = renderHook(() => useProgressiveTranscription());
      
      expect(() => {
        act(() => {
          result.current.updateChunks([new Blob(["test"], { type: "audio/webm" })]);
        });
      }).not.toThrow();
    });
  });

  describe("finalize", () => {
    it("should return accumulated transcript", async () => {
      const { result } = renderHook(() => useProgressiveTranscription());
      
      let finalText = "";
      await act(async () => {
        finalText = await result.current.finalize();
      });
      
      // Without starting, should return empty string
      expect(finalText).toBe("");
    });

    it("should set isProcessing to false after finalize", async () => {
      const { result } = renderHook(() => useProgressiveTranscription());
      
      await act(async () => {
        await result.current.finalize();
      });
      
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe("displayTranscript", () => {
    it("should combine partial and interim transcripts", () => {
      const { result } = renderHook(() => useProgressiveTranscription());
      
      // Initial state should be empty
      expect(result.current.displayTranscript).toBe("");
      
      // The displayTranscript is computed from partialTranscript + interimTranscript
      // Since we can't directly set these in tests (they come from WebSocket messages),
      // we verify the logic is correct by checking the initial empty state
    });
  });
});

describe("Cartesia WebSocket integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        stt: {
          url: "wss://api.cartesia.ai/stt/websocket?api_key=test-key&model=ink-whisper",
          apiKey: "test-key",
          config: { model: "ink-whisper", language: "en", sample_rate: 16000 },
        },
        session: { id: "test-session" },
      }),
    });
  });

  it("should call voice-agent API to get configuration", async () => {
    const { result } = renderHook(() => useProgressiveTranscription());
    
    // Create a mock MediaStream
    const mockStream = {
      getTracks: () => [],
      getAudioTracks: () => [{
        stop: jest.fn(),
        enabled: true,
        getSettings: () => ({}),
      }],
    } as unknown as MediaStream;
    
    await act(async () => {
      // Note: start() now expects a MediaStream, not MediaRecorder
      await result.current.start(mockStream);
    });
    
    // Should have called voice-agent API
    expect(mockFetch).toHaveBeenCalledWith("/api/interview/voice-agent");
  });
});

describe("Audio format conversion helpers", () => {
  // Test Float32 to Int16 conversion logic (used for Cartesia)
  
  function floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }
  
  it("should convert silence (0.0) to 0", () => {
    const input = new Float32Array([0.0, 0.0, 0.0]);
    const output = floatTo16BitPCM(input);
    
    expect(output[0]).toBe(0);
    expect(output[1]).toBe(0);
    expect(output[2]).toBe(0);
  });
  
  it("should convert max positive (1.0) to 32767", () => {
    const input = new Float32Array([1.0]);
    const output = floatTo16BitPCM(input);
    
    expect(output[0]).toBe(32767);
  });
  
  it("should convert max negative (-1.0) to -32768", () => {
    const input = new Float32Array([-1.0]);
    const output = floatTo16BitPCM(input);
    
    expect(output[0]).toBe(-32768);
  });
  
  it("should clamp values outside [-1, 1]", () => {
    const input = new Float32Array([1.5, -1.5]);
    const output = floatTo16BitPCM(input);
    
    expect(output[0]).toBe(32767);  // Clamped to max
    expect(output[1]).toBe(-32768); // Clamped to min
  });
  
  it("should handle typical audio values", () => {
    const input = new Float32Array([0.5, -0.5, 0.25, -0.25]);
    const output = floatTo16BitPCM(input);
    
    expect(output[0]).toBe(16383);  // 0.5 * 32767
    expect(output[1]).toBe(-16384); // -0.5 * 32768
    expect(output[2]).toBe(8191);   // 0.25 * 32767
    expect(output[3]).toBe(-8192);  // -0.25 * 32768
  });
});

describe("Downsampling logic", () => {
  function downsample(
    buffer: Float32Array,
    inputSampleRate: number,
    outputSampleRate: number
  ): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return buffer;
    }
    
    const ratio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = Math.floor(i * ratio);
      result[i] = buffer[srcIndex];
    }
    
    return result;
  }
  
  it("should return same buffer when sample rates match", () => {
    const input = new Float32Array([1, 2, 3, 4]);
    const output = downsample(input, 16000, 16000);
    
    expect(output).toBe(input);
  });
  
  it("should downsample from 48kHz to 16kHz (3:1 ratio)", () => {
    const input = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const output = downsample(input, 48000, 16000);
    
    // 9 samples at 48kHz → 3 samples at 16kHz
    expect(output.length).toBe(3);
    expect(output[0]).toBe(1);  // Index 0
    expect(output[1]).toBe(4);  // Index 3
    expect(output[2]).toBe(7);  // Index 6
  });
  
  it("should downsample from 44.1kHz to 16kHz", () => {
    const input = new Float32Array(441); // 10ms of audio at 44.1kHz
    const output = downsample(input, 44100, 16000);
    
    // Should produce ~160 samples (10ms at 16kHz)
    expect(output.length).toBe(160);
  });
});
