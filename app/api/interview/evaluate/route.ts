import { NextRequest, NextResponse } from "next/server";
import { 
  buildCodingEvaluationPrompt, 
  CodingEvaluationResult, 
  validateCodingEvaluation 
} from "@/lib/codingRubric";
import { sanitizeForLLM, validateLength } from "@/lib/security";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
      transcript = "",
      difficulty,
      expectedComplexity,
      conversationHistory = []  // NEW: Include interview conversation
    } = body;

    // Validate required fields
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!code || code.trim().length < 10) {
      return NextResponse.json(
        { error: "Code submission is required (minimum 10 characters)" },
        { status: 400 }
      );
    }

    // Sanitize inputs to prevent prompt injection
    question = sanitizeForLLM(question);
    code = sanitizeForLLM(code);
    transcript = transcript ? sanitizeForLLM(transcript) : "";
    language = typeof language === "string" ? sanitizeForLLM(language) : "python";
    difficulty = typeof difficulty === "string" ? sanitizeForLLM(difficulty) : undefined;

    // Sanitize expected complexity
    if (expectedComplexity && typeof expectedComplexity === "object") {
      expectedComplexity = {
        time: expectedComplexity.time ? sanitizeForLLM(String(expectedComplexity.time)) : undefined,
        space: expectedComplexity.space ? sanitizeForLLM(String(expectedComplexity.space)) : undefined
      };
    } else {
      expectedComplexity = undefined;
    }

    // Sanitize conversation history - only accept valid roles, reject invalid entries
    let sanitizedHistory: { role: "interviewer" | "candidate"; content: string }[] = [];
    if (Array.isArray(conversationHistory)) {
      // Take last 20 turns max to keep prompt reasonable
      for (const turn of conversationHistory.slice(-20)) {
        // Only include entries with valid roles (consistent with followup/converse endpoints)
        if (
          turn &&
          typeof turn === "object" &&
          (turn.role === "interviewer" || turn.role === "candidate") &&
          typeof turn.content === "string" &&
          turn.content.trim().length > 0
        ) {
          sanitizedHistory.push({
            role: turn.role,
            content: sanitizeForLLM(turn.content).slice(0, 1000)
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

    if (transcript) {
      const transcriptValidation = validateLength(transcript, 0, 10000);
      if (!transcriptValidation.valid) {
        return NextResponse.json({ error: transcriptValidation.error }, { status: 400 });
      }
    }

    // Build the evaluation prompt with conversation history
    const prompt = buildCodingEvaluationPrompt(
      question,
      code,
      language,
      transcript,
      difficulty,
      expectedComplexity,
      sanitizedHistory  // NEW: Pass conversation history
    );

    // Call GPT-4o for better code analysis
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert coding interviewer at a top tech company (Google, Meta, OpenAI, Anthropic level). Always respond with valid JSON only, no markdown formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for consistent scoring
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GPT] Error:", response.status, errorText);
      return NextResponse.json(
        { error: "Evaluation failed" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No evaluation generated" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let evaluation: CodingEvaluationResult;
    try {
      // Remove potential markdown code blocks
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      evaluation = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[Evaluate] JSON parse error:", parseError, content);
      return NextResponse.json(
        { error: "Failed to parse evaluation" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!validateCodingEvaluation(evaluation)) {
      console.error("[Evaluate] Invalid response structure:", evaluation);
      return NextResponse.json(
        { error: "Invalid evaluation format" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      evaluation,
      code,
      language,
      transcript
    });
  } catch (error) {
    console.error("[Evaluate] Error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate response" },
      { status: 500 }
    );
  }
}
