import { NextRequest, NextResponse } from "next/server";
import { sanitizeForLLM, validateLength } from "@/lib/security";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * API endpoint for handling clarifying questions from candidates
 * Returns both text and optional audio response
 */
export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    let { question, clarifyingQuestion, previousClarifications = [] } = body;

    if (!question || !clarifyingQuestion) {
      return NextResponse.json(
        { error: "Question and clarifying question are required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    question = sanitizeForLLM(question);
    clarifyingQuestion = sanitizeForLLM(clarifyingQuestion);
    
    // Validate lengths
    const questionValidation = validateLength(question, 10, 5000);
    if (!questionValidation.valid) {
      return NextResponse.json({ error: questionValidation.error }, { status: 400 });
    }

    const clarifyValidation = validateLength(clarifyingQuestion, 5, 500);
    if (!clarifyValidation.valid) {
      return NextResponse.json({ error: clarifyValidation.error }, { status: 400 });
    }

    // Build context from previous clarifications
    const previousContext = previousClarifications
      .slice(-3) // Only keep last 3 clarifications
      .map((c: { question: string; answer: string }) => 
        `Candidate asked: "${c.question}"\nYou answered: "${c.answer}"`
      )
      .join("\n\n");

    // Generate clarification response using GPT
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You're a friendly senior engineer chatting with a candidate before they start coding. They're asking clarifying questions - which is great, that's exactly what we want to see.

Your style:
- Talk like a real person: "Good question!", "Yeah, so...", "That's a fair point"
- Use contractions: you're, it's, won't, that'll
- Keep it SHORT - 1-2 sentences is perfect, never more than 3
- Be warm and supportive, like you actually want them to succeed
- If they ask about the algorithm: smile and say something like "That's the fun part - I'll let you figure that out!"

When they ask about:
- Edge cases: "Good thinking. Feel free to ask me about specific cases, or just state your assumptions as you go."
- Input size: Give concrete numbers like "Assume we're looking at maybe 10,000 elements max"
- Return format: Be specific - "Yeah, just return the indices as a list"
- Something in the problem: "Actually, check the problem description - it's covered there!"

Sound like a helpful colleague, not a formal interviewer.`,
          },
          {
            role: "user",
            content: `Problem:
${question}

${previousContext ? `Previous Q&A:\n${previousContext}\n\n` : ""}They asked: "${clarifyingQuestion}"`,
          },
        ],
        temperature: 0.8,
        max_tokens: 120,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Clarify] GPT Error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const answerText = data.choices[0]?.message?.content || "I'm sorry, could you rephrase that question?";

    // Generate TTS for the response with natural, human-like voice
    const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1-hd", // HD for more natural voice
        input: answerText,
        voice: "alloy", // Warm, conversational voice
        response_format: "mp3",
        speed: 1.0, // Natural pace
      }),
    });

    let audioBase64: string | null = null;
    if (ttsResponse.ok) {
      const audioBuffer = await ttsResponse.arrayBuffer();
      audioBase64 = Buffer.from(audioBuffer).toString("base64");
    }

    return NextResponse.json({
      answer: answerText,
      audio: audioBase64, // Base64 encoded MP3, or null if TTS failed
    });
  } catch (error) {
    console.error("[Clarify] Error:", error);
    return NextResponse.json(
      { error: "Failed to process clarifying question" },
      { status: 500 }
    );
  }
}
