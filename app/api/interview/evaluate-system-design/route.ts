import { NextRequest, NextResponse } from "next/server";
import { 
  buildSystemDesignEvaluationPrompt, 
  SystemDesignEvaluationResult, 
  validateSystemDesignEvaluation 
} from "@/lib/systemDesignRubric";
import { sanitizeForLLM, validateLength } from "@/lib/security";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    let { question, transcript, diagramDescription, targetLevel } = body;

    // Validate required fields
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!transcript || transcript.trim().length < 50) {
      return NextResponse.json(
        { error: "Design explanation is required (minimum 50 characters)" },
        { status: 400 }
      );
    }

    // Sanitize inputs to prevent prompt injection
    question = sanitizeForLLM(question);
    transcript = sanitizeForLLM(transcript);
    diagramDescription = diagramDescription ? sanitizeForLLM(diagramDescription) : undefined;
    targetLevel = typeof targetLevel === "string" ? sanitizeForLLM(targetLevel) : undefined;

    // Validate lengths
    const questionValidation = validateLength(question, 10, 2000);
    if (!questionValidation.valid) {
      return NextResponse.json({ error: questionValidation.error }, { status: 400 });
    }

    const transcriptValidation = validateLength(transcript, 50, 15000);
    if (!transcriptValidation.valid) {
      return NextResponse.json({ error: transcriptValidation.error }, { status: 400 });
    }

    // Build the evaluation prompt
    const prompt = buildSystemDesignEvaluationPrompt(
      question,
      transcript,
      diagramDescription,
      targetLevel
    );

    // Call GPT-4o for nuanced system design evaluation
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
              "You are an expert system design interviewer at a FAANG company (staff+ level). Always respond with valid JSON only, no markdown formatting. Be strict but fair in your evaluation.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[System Design Evaluate] OpenAI error:", error);
      return NextResponse.json(
        { error: "Failed to evaluate response" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[System Design Evaluate] No content in response");
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let evaluation: SystemDesignEvaluationResult;
    try {
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      evaluation = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[System Design Evaluate] Parse error:", parseError, content);
      return NextResponse.json(
        { error: "Failed to parse evaluation" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!validateSystemDesignEvaluation(evaluation)) {
      console.error("[System Design Evaluate] Invalid response structure:", evaluation);
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
    console.error("[System Design Evaluate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
