import { NextRequest, NextResponse } from "next/server";
import { 
  isCartesiaConfigured, 
  getCartesiaApiKey,
  LIVE_STT_CONFIG, 
  TTS_CONFIG,
  CARTESIA_VOICES,
  CARTESIA_VERSION,
  CARTESIA_WS_URLS
} from "@/lib/cartesia";

/**
 * Voice Agent Configuration Endpoint
 * 
 * Returns configuration and auth for client-side Cartesia connections.
 * The client connects directly to Cartesia's WebSocket API for lowest latency.
 * 
 * This endpoint provides:
 * 1. WebSocket URL with authentication for Live STT (ink-whisper)
 * 2. TTS configuration for streaming audio generation (sonic-3)
 * 3. Session configuration for the voice agent
 */
export async function GET(request: NextRequest) {
  if (!isCartesiaConfigured()) {
    return NextResponse.json(
      { error: "Voice agent service not configured" },
      { status: 503 }
    );
  }

  try {
    const apiKey = getCartesiaApiKey();
    
    // Build the WebSocket URL with all STT parameters for Cartesia
    const sttParams = new URLSearchParams({
      api_key: apiKey,
      cartesia_version: CARTESIA_VERSION,
      model: LIVE_STT_CONFIG.model,
      language: LIVE_STT_CONFIG.language,
      encoding: LIVE_STT_CONFIG.encoding,
      sample_rate: String(LIVE_STT_CONFIG.sample_rate),
      min_volume: String(LIVE_STT_CONFIG.min_volume),
      max_silence_duration_secs: String(LIVE_STT_CONFIG.max_silence_duration_secs),
    });
    
    // Build the TTS WebSocket URL
    const ttsParams = new URLSearchParams({
      api_key: apiKey,
      cartesia_version: CARTESIA_VERSION,
    });

    // Return configuration for client-side connection
    return NextResponse.json({
      // WebSocket URL for Live STT (ink-whisper)
      stt: {
        url: `${CARTESIA_WS_URLS.STT}?${sttParams.toString()}`,
        apiKey: apiKey, // Client needs this for WebSocket auth
        config: LIVE_STT_CONFIG,
      },
      // WebSocket URL for TTS (sonic-3)
      tts: {
        url: `${CARTESIA_WS_URLS.TTS}?${ttsParams.toString()}`,
        voice: CARTESIA_VOICES.KATIE,
        config: TTS_CONFIG,
        apiKey: apiKey,
      },
      // Session metadata
      session: {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        // Token expires in 1 hour
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("[Voice-Agent] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize voice agent" },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for server-side operations
 * Used for operations that need server-side processing
 */
export async function POST(request: NextRequest) {
  if (!isCartesiaConfigured()) {
    return NextResponse.json(
      { error: "Voice agent service not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;
    const apiKey = getCartesiaApiKey();

    switch (action) {
      case "refresh_token":
        // Generate a new session token
        return NextResponse.json({
          session: {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          },
        });

      case "get_tts_config":
        // Return TTS configuration for Cartesia
        return NextResponse.json({
          tts: {
            url: CARTESIA_WS_URLS.TTS,
            voice: CARTESIA_VOICES.KATIE,
            config: TTS_CONFIG,
            apiKey: apiKey,
          },
        });
        
      case "get_stt_config":
        // Return STT configuration for Cartesia
        return NextResponse.json({
          stt: {
            url: CARTESIA_WS_URLS.STT,
            config: LIVE_STT_CONFIG,
            apiKey: apiKey,
          },
        });

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Voice-Agent] POST Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
