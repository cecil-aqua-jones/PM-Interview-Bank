/**
 * GET /api/progress
 * 
 * Returns the authenticated user's interview progress statistics
 * for the progress dashboard.
 */

import { NextResponse } from "next/server";
import { getUserProgressStats } from "@/lib/progressStorage";

export async function GET() {
  try {
    const stats = await getUserProgressStats();
    
    if (stats === null) {
      // Return empty stats structure if user not authenticated or no data
      return NextResponse.json({
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
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API/Progress] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress stats" },
      { status: 500 }
    );
  }
}
