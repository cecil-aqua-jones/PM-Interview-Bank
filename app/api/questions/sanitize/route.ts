import { NextRequest, NextResponse } from "next/server";
import { sanitizeWithAI, quickSanitize, formatForDisplay } from "@/lib/questionSanitizer";
import { Question } from "@/lib/types";

/**
 * POST /api/questions/sanitize
 * 
 * Sanitizes question content to fix incomplete or poorly formatted content.
 * Optionally uses AI to detect and format code blocks.
 * 
 * Body:
 * - question: { id, title, prompt, ... } - The question to sanitize
 * - useAI: boolean (default: false) - Whether to use AI for enhanced sanitization
 * 
 * Returns:
 * - title: sanitized title
 * - prompt: sanitized prompt content
 * - wasModified: boolean indicating if changes were made
 * - changes: array of changes made (if AI was used)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, useAI = false } = body;

    if (!question || !question.prompt) {
      return NextResponse.json(
        { error: "Question with prompt is required" },
        { status: 400 }
      );
    }

    // Validate question structure
    const q: Question = {
      id: question.id || "temp",
      title: question.title || "Untitled",
      prompt: question.prompt,
      tags: question.tags || [],
    };

    if (useAI) {
      // Full AI sanitization
      const result = await sanitizeWithAI(q);
      return NextResponse.json({
        title: result.title,
        prompt: result.prompt,
        wasModified: result.wasModified,
        changes: result.changes,
      });
    } else {
      // Quick sanitization (no AI)
      const sanitizedPrompt = quickSanitize(q.prompt);
      const sanitizedTitle = q.title.trim();
      
      return NextResponse.json({
        title: sanitizedTitle,
        prompt: sanitizedPrompt,
        wasModified: sanitizedPrompt !== q.prompt || sanitizedTitle !== q.title,
        changes: sanitizedPrompt !== q.prompt ? ["Applied basic formatting fixes"] : [],
      });
    }
  } catch (error) {
    console.error("[Sanitize API] Error:", error);
    return NextResponse.json(
      { error: "Failed to sanitize question" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/questions/sanitize?content=...
 * 
 * Quick format content for display (no AI, client-safe)
 * Useful for formatting content on-the-fly
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const content = searchParams.get("content");

  if (!content) {
    return NextResponse.json(
      { error: "Content parameter is required" },
      { status: 400 }
    );
  }

  const formatted = formatForDisplay(content);
  
  return NextResponse.json({
    content: formatted,
    wasModified: formatted !== content,
  });
}
