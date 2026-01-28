/**
 * GET /api/progress
 * 
 * Returns the authenticated user's interview progress statistics
 * for the progress dashboard.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getUserProgressStatsForUser, type ProgressStats } from "@/lib/progressStorage";

// Empty stats structure for unauthenticated users or no data
const EMPTY_STATS: ProgressStats = {
  totalInterviews: 0,
  counts: { coding: 0, behavioral: 0, systemDesign: 0 },
  averages: { coding: null, behavioral: null, systemDesign: null },
  radarData: {
    correctness: null,
    complexityAnalysis: null,
    codeQuality: null,
    starStructure: null,
    impactResults: null,
    leadership: null,
    architecture: null,
    scalability: null,
    tradeoffs: null,
  },
  dimensions: {
    coding: {
      correctness: null,
      timeComplexity: null,
      spaceComplexity: null,
      codeQuality: null,
      problemSolving: null,
    },
    behavioral: {
      starStructure: null,
      ownership: null,
      impact: null,
      leadership: null,
      decisionMaking: null,
      growthMindset: null,
      communication: null,
    },
    systemDesign: {
      requirements: null,
      architecture: null,
      scalability: null,
      dataModel: null,
      tradeoffs: null,
      reliability: null,
      communication: null,
    },
  },
  weeklySnapshots: [],
  updatedAt: null,
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Debug: Log all cookies
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));
    console.log("[API/Progress] Auth cookies found:", authCookies.map(c => c.name));
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[API/Progress] Missing Supabase environment variables");
      return NextResponse.json(EMPTY_STATS);
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
    const { data, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("[API/Progress] Auth error:", authError.message);
      return NextResponse.json(EMPTY_STATS);
    }
    
    const user = data?.user;
    if (!user) {
      console.log("[API/Progress] No authenticated user");
      return NextResponse.json(EMPTY_STATS);
    }
    
    console.log("[API/Progress] Fetching stats for user:", user.id);
    
    // Fetch stats using the server-side client
    const stats = await getUserProgressStatsForUser(supabase, user.id);
    
    if (stats === null) {
      console.log("[API/Progress] Stats returned null, using empty");
      return NextResponse.json(EMPTY_STATS);
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API/Progress] Unexpected error:", error instanceof Error ? error.message : error);
    // Return empty stats instead of 500 error to allow the page to render
    return NextResponse.json(EMPTY_STATS);
  }
}
