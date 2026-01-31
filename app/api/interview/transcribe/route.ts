import { NextRequest, NextResponse } from "next/server";
import { 
  isCartesiaConfigured, 
  transcribeAudio, 
  isSupportedAudioFormat,
  ServiceUnavailableError,
  isNetworkError,
} from "@/lib/cartesia";

// Allowed audio MIME types (Cartesia supports many formats)
const ALLOWED_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/webm;codecs=opus",
  "audio/x-m4a",
];

export async function POST(request: NextRequest) {
  console.log("[Transcribe] === New request ===");
  
  if (!isCartesiaConfigured()) {
    console.log("[Transcribe] Cartesia not configured");
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      console.log("[Transcribe] No audio file in request");
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log(`[Transcribe] Received file: name=${audioFile.name}, type=${audioFile.type}, size=${audioFile.size}`);

    // Validate file type - be more permissive
    const baseMimeType = audioFile.type.split(";")[0].toLowerCase();
    const isValidType = ALLOWED_AUDIO_TYPES.some(t => 
      t === baseMimeType || t.startsWith(baseMimeType) || baseMimeType.startsWith(t.split(";")[0])
    );
    
    if (!isValidType && audioFile.type) {
      console.log(`[Transcribe] Invalid type: ${audioFile.type}`);
      return NextResponse.json(
        { error: `Invalid audio format: ${audioFile.type}. Supported: webm, mp4, mp3, wav, ogg, flac` },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Check for minimum file size
    if (audioFile.size < 500) {
      console.log(`[Transcribe] File too small: ${audioFile.size} bytes`);
      return NextResponse.json(
        { error: "Audio file too small. Please record a longer response." },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer for Cartesia
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Verify buffer is valid
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      console.log(`[Transcribe] Empty buffer`);
      return NextResponse.json(
        { error: "Audio buffer is empty" },
        { status: 400 }
      );
    }

    console.log(`[Transcribe] Buffer ready: ${audioBuffer.byteLength} bytes`);
    
    const transcript = await transcribeAudio(audioBuffer, audioFile.type || "audio/webm");
    console.log(`[Transcribe] Success: "${transcript.slice(0, 80)}${transcript.length > 80 ? '...' : ''}"`);

    return NextResponse.json({
      transcript,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Transcribe] Error:", errorMessage);
    
    // Return 503 for service unavailability (network errors, timeouts)
    if (error instanceof ServiceUnavailableError || isNetworkError(error as Error)) {
      return NextResponse.json(
        { error: "Transcription service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to process audio: ${errorMessage}` },
      { status: 500 }
    );
  }
}
