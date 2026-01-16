import { NextRequest, NextResponse } from "next/server";
import { isValidAudioFile } from "@/lib/security";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Allowed audio MIME types
const ALLOWED_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm;codecs=opus",
];

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const mimeType = audioFile.type.split(";")[0];
    if (!ALLOWED_AUDIO_TYPES.some(t => t.startsWith(mimeType))) {
      return NextResponse.json(
        { error: "Invalid audio format. Supported: webm, mp4, mp3, wav, ogg" },
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

    // Check for minimum file size (likely empty or corrupted)
    if (audioFile.size < 1000) {
      return NextResponse.json(
        { error: "Audio file too small. Please record a longer response." },
        { status: 400 }
      );
    }

    // Prepare form data for Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append("file", audioFile, "audio.webm");
    whisperFormData.append("model", "whisper-1");
    whisperFormData.append("language", "en");

    // Call OpenAI Whisper API
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: whisperFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Whisper] Error:", response.status, errorText);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      transcript: data.text,
    });
  } catch (error) {
    console.error("[Transcribe] Error:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}
