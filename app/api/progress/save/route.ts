/**
 * POST /api/progress/save
 * 
 * Saves a completed interview result to the user's progress statistics.
 * Called after each interview evaluation is complete.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  saveCodingProgress,
  saveBehavioralProgress,
  saveSystemDesignProgress,
} from "@/lib/progressStorage";
import type { CodingEvaluationResult } from "@/lib/codingRubric";
import type { BehavioralEvaluationResult } from "@/lib/behavioralRubric";
import type { SystemDesignEvaluationResult } from "@/lib/systemDesignRubric";

type InterviewType = "coding" | "behavioral" | "system_design";

type RequestBody = {
  type: InterviewType;
  evaluation: CodingEvaluationResult | BehavioralEvaluationResult | SystemDesignEvaluationResult;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody;
    const { type, evaluation } = body;

    // Validate request
    if (!type || !evaluation) {
      return NextResponse.json(
        { error: "Missing required fields: type and evaluation" },
        { status: 400 }
      );
    }

    if (!["coding", "behavioral", "system_design"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid interview type. Must be: coding, behavioral, or system_design" },
        { status: 400 }
      );
    }

    if (typeof evaluation.overallScore !== "number") {
      return NextResponse.json(
        { error: "Invalid evaluation: missing overallScore" },
        { status: 400 }
      );
    }

    // Save progress based on type
    let success = false;

    switch (type) {
      case "coding":
        success = await saveCodingProgress(evaluation as CodingEvaluationResult);
        break;
      case "behavioral":
        success = await saveBehavioralProgress(evaluation as BehavioralEvaluationResult);
        break;
      case "system_design":
        success = await saveSystemDesignProgress(evaluation as SystemDesignEvaluationResult);
        break;
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to save progress. User may not be authenticated." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Progress/Save] Error:", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
