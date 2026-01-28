import { NextRequest, NextResponse } from "next/server";
import { 
  buildBehavioralEvaluationPrompt, 
  BehavioralEvaluationResult, 
  validateBehavioralEvaluation 
} from "@/lib/behavioralRubric";
import { sanitizeForLLM, validateLength } from "@/lib/security";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type ConversationTurn = {
  role: "interviewer" | "candidate";
  content: string;
};

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    let { question, transcript, conversationHistory, tags = [], difficulty } = body;

    // Validate required fields
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!transcript || transcript.trim().length < 20) {
      return NextResponse.json(
        { error: "Response transcript is required (minimum 20 characters)" },
        { status: 400 }
      );
    }

    // Sanitize inputs to prevent prompt injection
    question = sanitizeForLLM(question);
    transcript = sanitizeForLLM(transcript);
    difficulty = typeof difficulty === "string" ? sanitizeForLLM(difficulty) : undefined;
    tags = Array.isArray(tags) 
      ? tags.slice(0, 10).map((t: unknown) => typeof t === "string" ? sanitizeForLLM(t) : "").filter(Boolean)
      : [];

    // Sanitize conversation history if provided
    let sanitizedHistory: ConversationTurn[] = [];
    if (Array.isArray(conversationHistory)) {
      sanitizedHistory = conversationHistory
        .slice(0, 20) // Limit to last 20 turns
        .filter((turn: unknown): turn is ConversationTurn => 
          typeof turn === "object" && 
          turn !== null &&
          "role" in turn &&
          "content" in turn &&
          (turn.role === "interviewer" || turn.role === "candidate") &&
          typeof turn.content === "string"
        )
        .map(turn => ({
          role: turn.role,
          content: sanitizeForLLM(turn.content).slice(0, 2000)
        }));
    }

    // Validate lengths
    const questionValidation = validateLength(question, 10, 2000);
    if (!questionValidation.valid) {
      return NextResponse.json({ error: questionValidation.error }, { status: 400 });
    }

    const transcriptValidation = validateLength(transcript, 20, 10000);
    if (!transcriptValidation.valid) {
      return NextResponse.json({ error: transcriptValidation.error }, { status: 400 });
    }

    // Build conversation context if available
    let conversationContext = "";
    if (sanitizedHistory.length > 1) {
      conversationContext = "\n\nFULL CONVERSATION TRANSCRIPT:\n" + 
        sanitizedHistory.map(turn => 
          `${turn.role === "interviewer" ? "Interviewer" : "Candidate"}: ${turn.content}`
        ).join("\n\n");
    }

    // Build the evaluation prompt with conversation context
    const prompt = buildBehavioralEvaluationPrompt(question, transcript, tags, difficulty) + conversationContext;

    // Call GPT-4o for nuanced behavioral evaluation
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
              "You are an expert behavioral interviewer at a top tech company (Google, Meta, OpenAI, Anthropic level). Always respond with valid JSON only, no markdown formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Behavioral Evaluate] OpenAI error:", error);
      return NextResponse.json(
        { error: "Failed to evaluate response" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[Behavioral Evaluate] No content in response");
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let evaluation: BehavioralEvaluationResult;
    try {
      // Remove potential markdown code blocks
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      evaluation = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[Behavioral Evaluate] Parse error:", parseError, content);
      return NextResponse.json(
        { error: "Failed to parse evaluation" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!validateBehavioralEvaluation(evaluation)) {
      console.error("[Behavioral Evaluate] Invalid response structure:", evaluation);
      return NextResponse.json(
        { error: "Invalid evaluation format" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      evaluation,
      transcript
    });
  } catch (error) {
    console.error("[Behavioral Evaluate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
