/**
 * POST /api/progress/save
 * 
 * Saves a completed interview result to the user's progress statistics.
 * Called after each interview evaluation is complete.
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  saveCodingProgressForUser,
  saveBehavioralProgressForUser,
  saveSystemDesignProgressForUser,
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

    const cookieStore = await cookies();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[API/Progress/Save] Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    
    // Create server-side Supabase client using @supabase/ssr
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // This can be ignored in Server Components
          }
        },
      },
    });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("[API/Progress/Save] Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.log("[API/Progress/Save] No authenticated user");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    console.log("[API/Progress/Save] Saving", type, "progress for user:", user.id);

    // Save progress based on type
    let success = false;

    switch (type) {
      case "coding":
        success = await saveCodingProgressForUser(supabase, user.id, evaluation as CodingEvaluationResult);
        break;
      case "behavioral":
        success = await saveBehavioralProgressForUser(supabase, user.id, evaluation as BehavioralEvaluationResult);
        break;
      case "system_design":
        success = await saveSystemDesignProgressForUser(supabase, user.id, evaluation as SystemDesignEvaluationResult);
        break;
    }

    if (!success) {
      console.error("[API/Progress/Save] Failed to save progress for user:", user.id);
      return NextResponse.json(
        { error: "Failed to save progress to database" },
        { status: 500 }
      );
    }

    console.log("[API/Progress/Save] Successfully saved", type, "progress");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/Progress/Save] Error:", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
