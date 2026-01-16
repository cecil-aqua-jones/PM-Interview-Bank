import { NextRequest, NextResponse } from "next/server";
import { sanitizeForLLM, validateLength } from "@/lib/security";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Interview preambles to make it feel natural
const PREAMBLES = [
  "Thanks for joining me today. Let's dive right into it.",
  "Great to meet you. I'm excited to hear your thoughts on this one.",
  "Alright, let's get started. Here's what I'd like you to think about.",
  "Thanks for taking the time. Let me share the question with you.",
  "Perfect, let's begin. I have an interesting scenario for you.",
];

const TRANSITIONS = [
  "Here's the question:",
  "The question is:",
  "I'd like you to consider:",
  "Here's the scenario:",
  "Think about this:",
];

const CLOSINGS = [
  "Take your time to think it through, and let me know when you're ready to share your answer.",
  "Feel free to take a moment to gather your thoughts before responding.",
  "Take a breath, structure your thinking, and share your response when ready.",
  "Think about your approach, and walk me through your answer when you're ready.",
];

function buildInterviewPrompt(question: string, category?: string): string {
  const preamble = PREAMBLES[Math.floor(Math.random() * PREAMBLES.length)];
  const transition = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
  const closing = CLOSINGS[Math.floor(Math.random() * CLOSINGS.length)];

  // Add category context if available
  const categoryContext = category
    ? ` This is a ${category.toLowerCase()} question.`
    : "";

  return `${preamble}${categoryContext} ${transition} ${question} ... ${closing}`;
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    let { question, category } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    question = sanitizeForLLM(question);
    category = typeof category === "string" ? sanitizeForLLM(category) : undefined;

    // Validate length
    const questionValidation = validateLength(question, 10, 1000);
    if (!questionValidation.valid) {
      return NextResponse.json({ error: questionValidation.error }, { status: 400 });
    }

    // Build the natural interview prompt
    const speechText = buildInterviewPrompt(question, category);

    // Call OpenAI TTS API
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: speechText,
        voice: "onyx", // Deep, professional voice good for interviews
        response_format: "mp3",
        speed: 0.95, // Slightly slower for clarity
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TTS] Error:", response.status, errorText);
      return NextResponse.json(
        { error: "Speech generation failed" },
        { status: 500 }
      );
    }

    // Return the audio as a stream
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[Speak] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
