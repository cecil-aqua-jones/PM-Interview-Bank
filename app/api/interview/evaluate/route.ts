import { NextRequest, NextResponse } from "next/server";
import { buildEvaluationPrompt, EvaluationResult } from "@/lib/pmRubric";

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
    const { question, transcript, tags = [], difficulty } = body;

    if (!question || !transcript) {
      return NextResponse.json(
        { error: "Question and transcript are required" },
        { status: 400 }
      );
    }

    // Build the evaluation prompt
    const prompt = buildEvaluationPrompt(question, transcript, tags, difficulty);

    // Call GPT-4o-mini for cost efficiency
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
            content:
              "You are an expert PM interviewer. Always respond with valid JSON only, no markdown formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent scoring
        max_tokens: 1000,
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
    let evaluation: EvaluationResult;
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
    if (
      typeof evaluation.overallScore !== "number" ||
      !evaluation.breakdown ||
      !Array.isArray(evaluation.strengths) ||
      !Array.isArray(evaluation.improvements)
    ) {
      console.error("[Evaluate] Invalid response structure:", evaluation);
      return NextResponse.json(
        { error: "Invalid evaluation format" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      evaluation,
      transcript, // Return transcript for storage
    });
  } catch (error) {
    console.error("[Evaluate] Error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate response" },
      { status: 500 }
    );
  }
}
