import { NextRequest, NextResponse } from "next/server";
import { buildFollowUpPrompt, CodingEvaluationResult } from "@/lib/codingRubric";
import { sanitizeForLLM, validateLength } from "@/lib/security";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type ConversationTurn = {
  role: "interviewer" | "candidate";
  content: string;
};

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    let { 
      question, 
      code, 
      language = "python",
      conversationHistory = [],
      previousEvaluation,
      clarifications = []
    } = body;

    // Validate required fields
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    question = sanitizeForLLM(question);
    code = sanitizeForLLM(code);
    language = typeof language === "string" ? sanitizeForLLM(language) : "python";

    // Sanitize conversation history
    const sanitizedHistory: ConversationTurn[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const turn of conversationHistory.slice(-10)) { // Limit to last 10 turns
        if (
          turn && 
          typeof turn === "object" &&
          (turn.role === "interviewer" || turn.role === "candidate") &&
          typeof turn.content === "string"
        ) {
          sanitizedHistory.push({
            role: turn.role,
            content: sanitizeForLLM(turn.content).slice(0, 2000)
          });
        }
      }
    }

    // Validate lengths
    const questionValidation = validateLength(question, 10, 2000);
    if (!questionValidation.valid) {
      return NextResponse.json({ error: questionValidation.error }, { status: 400 });
    }

    const codeValidation = validateLength(code, 10, 15000);
    if (!codeValidation.valid) {
      return NextResponse.json({ error: codeValidation.error }, { status: 400 });
    }

    // Validate previous evaluation if provided
    let validatedEvaluation: CodingEvaluationResult | undefined;
    if (previousEvaluation && typeof previousEvaluation === "object") {
      // Basic validation - just check for required fields
      if (
        typeof previousEvaluation.overallScore === "number" &&
        previousEvaluation.complexityAnalysis &&
        typeof previousEvaluation.complexityAnalysis.time === "string" &&
        typeof previousEvaluation.complexityAnalysis.space === "string"
      ) {
        validatedEvaluation = previousEvaluation as CodingEvaluationResult;
      }
    }

    // Build the follow-up prompt
    const prompt = buildFollowUpPrompt(
      question,
      code,
      language,
      sanitizedHistory,
      validatedEvaluation
    );

    // Call GPT-4o-mini for faster follow-up generation
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
            content: `You are a friendly senior engineer at a FAANG company conducting a coding interview. Your style:

- Talk like a real person having a conversation, not reading from a script
- Use natural language: "So I'm curious...", "What if...", "Help me understand..."
- Be genuinely interested in their thinking, not trying to trip them up
- Use contractions (you've, that's, wouldn't)
- Keep follow-ups SHORT - one question at a time, 1-2 sentences max
- It's okay to acknowledge good parts before probing: "Nice approach here. What about..."
- Sound like a colleague, not an interrogator

Example good follow-up: "I like that you went with a hash map here. What's the trade-off you're making with that choice?"

Example bad follow-up: "Please explain the time complexity of your solution and how it would scale with larger inputs."`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8, // Higher temperature for more natural variation
        max_tokens: 150, // Keep responses concise
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GPT] Follow-up error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate follow-up" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const followUpQuestion = data.choices[0]?.message?.content?.trim();

    if (!followUpQuestion) {
      return NextResponse.json(
        { error: "No follow-up generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      followUpQuestion,
      turnCount: sanitizedHistory.length + 1
    });
  } catch (error) {
    console.error("[FollowUp] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate follow-up question" },
      { status: 500 }
    );
  }
}
