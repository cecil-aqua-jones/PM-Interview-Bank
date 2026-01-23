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
      question,        // DEPRECATED: Combined question (for backwards compat)
      questionTitle,   // The question title (e.g., "Answer Caching Strategy")
      questionContent, // The detailed problem description
      code, 
      language = "python",
      conversationHistory = [],
      previousEvaluation,
      clarifications = []
    } = body;

    // Support both new format (title + content) and old format (combined question)
    if (!questionTitle && !question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }
    
    // If using old format, use it directly (questionTitle stays undefined)
    if (!questionTitle && question) {
      questionContent = question;
    }

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // Sanitize inputs BEFORE building structured question to prevent prompt injection
    // Preserve undefined for questionTitle to indicate "not provided"
    if (questionTitle) {
      questionTitle = sanitizeForLLM(questionTitle);
    }
    questionContent = questionContent ? sanitizeForLLM(questionContent) : "";
    code = sanitizeForLLM(code);
    language = typeof language === "string" ? sanitizeForLLM(language) : "python";
    
    // Build structured question for context AFTER sanitization
    const structuredQuestion = questionTitle 
      ? `Topic: "${questionTitle}"\n\nProblem: ${questionContent}`
      : questionContent;

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
    const contentValidation = validateLength(questionContent, 5, 5000);
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
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

    // Build the follow-up prompt using structured question
    const prompt = buildFollowUpPrompt(
      structuredQuestion,
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
            content: `You are a senior, empathetic engineer conducting a technical interview. You prioritize listening and natural conversation flow.

### CONVERSATION RULES
- Ask ONE question only. Never two questions in one response.
- Keep it to 1-2 sentences max. Long questions feel robotic.
- Use natural language: "So I'm curious...", "What about...", "Help me understand..."
- Use contractions (you've, that's, wouldn't)
- Sound like a peer, not an interrogator

### PACING
- Don't rapid-fire. Let there be conversational space.
- If acknowledging something good, keep it brief: "Nice. What about X?"
- Backchanneling is okay: "I see", "Gotcha", "Right"

### EXAMPLES
Good: "What made you choose a hash map here?"
Good: "Nice approach. What's the trade-off?"
Bad: "Please explain the time complexity of your solution and how it would scale with larger inputs and also discuss any edge cases."

Generate ONE natural follow-up question.`,
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
