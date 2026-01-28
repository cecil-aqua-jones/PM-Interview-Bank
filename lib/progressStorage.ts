/**
 * Progress Storage - Supabase operations for user interview progress tracking
 * 
 * Stores aggregate statistics for the progress dashboard, including:
 * - Overall counts and averages per interview type
 * - Dimension-level averages for radar chart visualization
 * - Weekly snapshots for trend tracking
 */

import { supabase } from "./supabaseClient";
import type { CodingEvaluationResult } from "./codingRubric";
import type { BehavioralEvaluationResult } from "./behavioralRubric";
import type { SystemDesignEvaluationResult } from "./systemDesignRubric";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type InterviewType = "coding" | "behavioral" | "system_design";

export type WeeklySnapshot = {
  week: string; // ISO week format: "2026-W04"
  coding: number | null;
  behavioral: number | null;
  system_design: number | null;
};

export type UserInterviewStats = {
  id: string;
  user_id: string;
  
  // Counts
  total_interviews: number;
  coding_count: number;
  behavioral_count: number;
  system_design_count: number;
  
  // Overall averages
  coding_avg_score: number | null;
  behavioral_avg_score: number | null;
  system_design_avg_score: number | null;
  
  // Coding dimensions
  coding_correctness_avg: number | null;
  coding_time_complexity_avg: number | null;
  coding_space_complexity_avg: number | null;
  coding_code_quality_avg: number | null;
  coding_problem_solving_avg: number | null;
  
  // Behavioral dimensions
  behavioral_star_structure_avg: number | null;
  behavioral_ownership_avg: number | null;
  behavioral_impact_avg: number | null;
  behavioral_leadership_avg: number | null;
  behavioral_decision_making_avg: number | null;
  behavioral_growth_mindset_avg: number | null;
  behavioral_communication_avg: number | null;
  
  // System Design dimensions
  sd_requirements_avg: number | null;
  sd_architecture_avg: number | null;
  sd_scalability_avg: number | null;
  sd_data_model_avg: number | null;
  sd_tradeoffs_avg: number | null;
  sd_reliability_avg: number | null;
  sd_communication_avg: number | null;
  
  // Trend data
  weekly_snapshots: WeeklySnapshot[];
  
  created_at: string;
  updated_at: string;
};

// Simplified stats for the dashboard
export type ProgressStats = {
  totalInterviews: number;
  counts: {
    coding: number;
    behavioral: number;
    systemDesign: number;
  };
  averages: {
    coding: number | null;
    behavioral: number | null;
    systemDesign: number | null;
  };
  // Radar chart data - normalized dimensions
  radarData: {
    // Coding
    correctness: number | null;
    complexityAnalysis: number | null; // (time + space) / 2
    codeQuality: number | null;
    // Behavioral
    starStructure: number | null;
    impactResults: number | null; // impact
    leadership: number | null;
    // System Design
    architecture: number | null;
    scalability: number | null;
    tradeoffs: number | null;
  };
  // All dimension averages for detailed view
  dimensions: {
    coding: {
      correctness: number | null;
      timeComplexity: number | null;
      spaceComplexity: number | null;
      codeQuality: number | null;
      problemSolving: number | null;
    };
    behavioral: {
      starStructure: number | null;
      ownership: number | null;
      impact: number | null;
      leadership: number | null;
      decisionMaking: number | null;
      growthMindset: number | null;
      communication: number | null;
    };
    systemDesign: {
      requirements: number | null;
      architecture: number | null;
      scalability: number | null;
      dataModel: number | null;
      tradeoffs: number | null;
      reliability: number | null;
      communication: number | null;
    };
  };
  weeklySnapshots: WeeklySnapshot[];
  updatedAt: string | null;
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get current ISO week string (e.g., "2026-W04")
 */
function getCurrentWeek(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

/**
 * Calculate rolling average using incremental formula
 * new_avg = ((old_avg * old_count) + new_score) / (old_count + 1)
 */
function calculateRollingAverage(
  oldAvg: number | null,
  oldCount: number,
  newScore: number
): number {
  if (oldAvg === null || oldCount === 0) {
    return newScore;
  }
  return ((oldAvg * oldCount) + newScore) / (oldCount + 1);
}

/**
 * Transform database row to ProgressStats
 */
function transformToProgressStats(row: UserInterviewStats): ProgressStats {
  return {
    totalInterviews: row.total_interviews,
    counts: {
      coding: row.coding_count,
      behavioral: row.behavioral_count,
      systemDesign: row.system_design_count,
    },
    averages: {
      coding: row.coding_avg_score,
      behavioral: row.behavioral_avg_score,
      systemDesign: row.system_design_avg_score,
    },
    radarData: {
      // Coding dimensions for radar
      correctness: row.coding_correctness_avg,
      complexityAnalysis: row.coding_time_complexity_avg && row.coding_space_complexity_avg
        ? (row.coding_time_complexity_avg + row.coding_space_complexity_avg) / 2
        : row.coding_time_complexity_avg || row.coding_space_complexity_avg,
      codeQuality: row.coding_code_quality_avg,
      // Behavioral dimensions for radar
      starStructure: row.behavioral_star_structure_avg,
      impactResults: row.behavioral_impact_avg,
      leadership: row.behavioral_leadership_avg,
      // System Design dimensions for radar
      architecture: row.sd_architecture_avg,
      scalability: row.sd_scalability_avg,
      tradeoffs: row.sd_tradeoffs_avg,
    },
    dimensions: {
      coding: {
        correctness: row.coding_correctness_avg,
        timeComplexity: row.coding_time_complexity_avg,
        spaceComplexity: row.coding_space_complexity_avg,
        codeQuality: row.coding_code_quality_avg,
        problemSolving: row.coding_problem_solving_avg,
      },
      behavioral: {
        starStructure: row.behavioral_star_structure_avg,
        ownership: row.behavioral_ownership_avg,
        impact: row.behavioral_impact_avg,
        leadership: row.behavioral_leadership_avg,
        decisionMaking: row.behavioral_decision_making_avg,
        growthMindset: row.behavioral_growth_mindset_avg,
        communication: row.behavioral_communication_avg,
      },
      systemDesign: {
        requirements: row.sd_requirements_avg,
        architecture: row.sd_architecture_avg,
        scalability: row.sd_scalability_avg,
        dataModel: row.sd_data_model_avg,
        tradeoffs: row.sd_tradeoffs_avg,
        reliability: row.sd_reliability_avg,
        communication: row.sd_communication_avg,
      },
    },
    weeklySnapshots: row.weekly_snapshots || [],
    updatedAt: row.updated_at,
  };
}

/**
 * Create empty stats for new users
 */
function createEmptyStats(): ProgressStats {
  return {
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
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/**
 * Get progress stats for a specific user (server-side version)
 * Used by API routes with a server-side Supabase client
 */
export async function getUserProgressStatsForUser(
  client: SupabaseClient,
  userId: string
): Promise<ProgressStats | null> {
  try {
    const { data, error } = await client
      .from("user_interview_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No row found - return empty stats
        console.log("[ProgressStorage] No stats found for user, returning empty");
        return createEmptyStats();
      }
      console.error("[ProgressStorage] Error fetching stats:", error);
      return null;
    }

    console.log("[ProgressStorage] Found stats for user:", userId);
    return transformToProgressStats(data as UserInterviewStats);
  } catch (err) {
    console.error("[ProgressStorage] Unexpected error:", err);
    return null;
  }
}

/**
 * Get current user's progress stats (client-side version)
 * @deprecated Use getUserProgressStatsForUser with server-side client in API routes
 */
export async function getUserProgressStats(): Promise<ProgressStats | null> {
  if (!supabase) {
    console.warn("[ProgressStorage] Supabase not configured");
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[ProgressStorage] No authenticated user");
      return null;
    }

    const { data, error } = await supabase
      .from("user_interview_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No row found - return empty stats
        return createEmptyStats();
      }
      console.error("[ProgressStorage] Error fetching stats:", error);
      return null;
    }

    return transformToProgressStats(data as UserInterviewStats);
  } catch (err) {
    console.error("[ProgressStorage] Unexpected error:", err);
    return null;
  }
}

/**
 * Update progress stats after completing a coding interview
 */
export async function saveCodingProgress(
  evaluation: CodingEvaluationResult
): Promise<boolean> {
  if (!supabase) {
    console.warn("[ProgressStorage] Supabase not configured");
    return false;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[ProgressStorage] No authenticated user");
      return false;
    }

    // Get existing stats
    const { data: existing } = await supabase
      .from("user_interview_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const currentWeek = getCurrentWeek();
    const breakdown = evaluation.breakdown;

    if (!existing) {
      // Create new stats record
      const newStats = {
        user_id: user.id,
        total_interviews: 1,
        coding_count: 1,
        behavioral_count: 0,
        system_design_count: 0,
        coding_avg_score: evaluation.overallScore,
        coding_correctness_avg: breakdown.correctness,
        coding_time_complexity_avg: breakdown.timeComplexity,
        coding_space_complexity_avg: breakdown.spaceComplexity,
        coding_code_quality_avg: breakdown.codeQuality,
        coding_problem_solving_avg: breakdown.problemSolving,
        weekly_snapshots: [{
          week: currentWeek,
          coding: evaluation.overallScore,
          behavioral: null,
          system_design: null,
        }],
      };

      const { error } = await supabase
        .from("user_interview_stats")
        .insert(newStats);

      if (error) {
        console.error("[ProgressStorage] Error creating stats:", error);
        return false;
      }
      return true;
    }

    // Update existing stats
    const oldCount = existing.coding_count || 0;
    const updatedSnapshots = updateWeeklySnapshot(
      existing.weekly_snapshots || [],
      currentWeek,
      "coding",
      evaluation.overallScore,
      oldCount
    );

    const { error } = await supabase
      .from("user_interview_stats")
      .update({
        total_interviews: (existing.total_interviews || 0) + 1,
        coding_count: oldCount + 1,
        coding_avg_score: calculateRollingAverage(existing.coding_avg_score, oldCount, evaluation.overallScore),
        coding_correctness_avg: calculateRollingAverage(existing.coding_correctness_avg, oldCount, breakdown.correctness),
        coding_time_complexity_avg: calculateRollingAverage(existing.coding_time_complexity_avg, oldCount, breakdown.timeComplexity),
        coding_space_complexity_avg: calculateRollingAverage(existing.coding_space_complexity_avg, oldCount, breakdown.spaceComplexity),
        coding_code_quality_avg: calculateRollingAverage(existing.coding_code_quality_avg, oldCount, breakdown.codeQuality),
        coding_problem_solving_avg: calculateRollingAverage(existing.coding_problem_solving_avg, oldCount, breakdown.problemSolving),
        weekly_snapshots: updatedSnapshots,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("[ProgressStorage] Error updating stats:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[ProgressStorage] Unexpected error:", err);
    return false;
  }
}

/**
 * Update progress stats after completing a behavioral interview
 */
export async function saveBehavioralProgress(
  evaluation: BehavioralEvaluationResult
): Promise<boolean> {
  if (!supabase) {
    console.warn("[ProgressStorage] Supabase not configured");
    return false;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[ProgressStorage] No authenticated user");
      return false;
    }

    // Extract dimension scores from breakdown
    const breakdown = evaluation.breakdown;
    const dimensionScores = {
      starStructure: breakdown["STAR Structure & Story Clarity"]?.score ?? null,
      ownership: breakdown["Ownership & Personal Agency"]?.score ?? null,
      impact: breakdown["Impact & Quantified Results"]?.score ?? null,
      leadership: breakdown["Leadership & Influence"]?.score ?? null,
      decisionMaking: breakdown["Problem-Solving & Decision-Making"]?.score ?? null,
      growthMindset: breakdown["Growth Mindset & Self-Awareness"]?.score ?? null,
      communication: breakdown["Communication Clarity & Conciseness"]?.score ?? null,
    };

    // Get existing stats
    const { data: existing } = await supabase
      .from("user_interview_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const currentWeek = getCurrentWeek();

    if (!existing) {
      // Create new stats record
      const newStats = {
        user_id: user.id,
        total_interviews: 1,
        coding_count: 0,
        behavioral_count: 1,
        system_design_count: 0,
        behavioral_avg_score: evaluation.overallScore,
        behavioral_star_structure_avg: dimensionScores.starStructure,
        behavioral_ownership_avg: dimensionScores.ownership,
        behavioral_impact_avg: dimensionScores.impact,
        behavioral_leadership_avg: dimensionScores.leadership,
        behavioral_decision_making_avg: dimensionScores.decisionMaking,
        behavioral_growth_mindset_avg: dimensionScores.growthMindset,
        behavioral_communication_avg: dimensionScores.communication,
        weekly_snapshots: [{
          week: currentWeek,
          coding: null,
          behavioral: evaluation.overallScore,
          system_design: null,
        }],
      };

      const { error } = await supabase
        .from("user_interview_stats")
        .insert(newStats);

      if (error) {
        console.error("[ProgressStorage] Error creating stats:", error);
        return false;
      }
      return true;
    }

    // Update existing stats
    const oldCount = existing.behavioral_count || 0;
    const updatedSnapshots = updateWeeklySnapshot(
      existing.weekly_snapshots || [],
      currentWeek,
      "behavioral",
      evaluation.overallScore,
      oldCount
    );

    const updateData: Record<string, unknown> = {
      total_interviews: (existing.total_interviews || 0) + 1,
      behavioral_count: oldCount + 1,
      behavioral_avg_score: calculateRollingAverage(existing.behavioral_avg_score, oldCount, evaluation.overallScore),
      weekly_snapshots: updatedSnapshots,
    };

    // Only update dimension averages if we have scores
    if (dimensionScores.starStructure !== null) {
      updateData.behavioral_star_structure_avg = calculateRollingAverage(existing.behavioral_star_structure_avg, oldCount, dimensionScores.starStructure);
    }
    if (dimensionScores.ownership !== null) {
      updateData.behavioral_ownership_avg = calculateRollingAverage(existing.behavioral_ownership_avg, oldCount, dimensionScores.ownership);
    }
    if (dimensionScores.impact !== null) {
      updateData.behavioral_impact_avg = calculateRollingAverage(existing.behavioral_impact_avg, oldCount, dimensionScores.impact);
    }
    if (dimensionScores.leadership !== null) {
      updateData.behavioral_leadership_avg = calculateRollingAverage(existing.behavioral_leadership_avg, oldCount, dimensionScores.leadership);
    }
    if (dimensionScores.decisionMaking !== null) {
      updateData.behavioral_decision_making_avg = calculateRollingAverage(existing.behavioral_decision_making_avg, oldCount, dimensionScores.decisionMaking);
    }
    if (dimensionScores.growthMindset !== null) {
      updateData.behavioral_growth_mindset_avg = calculateRollingAverage(existing.behavioral_growth_mindset_avg, oldCount, dimensionScores.growthMindset);
    }
    if (dimensionScores.communication !== null) {
      updateData.behavioral_communication_avg = calculateRollingAverage(existing.behavioral_communication_avg, oldCount, dimensionScores.communication);
    }

    const { error } = await supabase
      .from("user_interview_stats")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      console.error("[ProgressStorage] Error updating stats:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[ProgressStorage] Unexpected error:", err);
    return false;
  }
}

/**
 * Update progress stats after completing a system design interview
 */
export async function saveSystemDesignProgress(
  evaluation: SystemDesignEvaluationResult
): Promise<boolean> {
  if (!supabase) {
    console.warn("[ProgressStorage] Supabase not configured");
    return false;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[ProgressStorage] No authenticated user");
      return false;
    }

    const breakdown = evaluation.breakdown;

    // Get existing stats
    const { data: existing } = await supabase
      .from("user_interview_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const currentWeek = getCurrentWeek();

    if (!existing) {
      // Create new stats record
      const newStats = {
        user_id: user.id,
        total_interviews: 1,
        coding_count: 0,
        behavioral_count: 0,
        system_design_count: 1,
        system_design_avg_score: evaluation.overallScore,
        sd_requirements_avg: breakdown.requirements,
        sd_architecture_avg: breakdown.architecture,
        sd_scalability_avg: breakdown.scalability,
        sd_data_model_avg: breakdown.dataModel,
        sd_tradeoffs_avg: breakdown.tradeoffs,
        sd_reliability_avg: breakdown.reliability,
        sd_communication_avg: breakdown.communication,
        weekly_snapshots: [{
          week: currentWeek,
          coding: null,
          behavioral: null,
          system_design: evaluation.overallScore,
        }],
      };

      const { error } = await supabase
        .from("user_interview_stats")
        .insert(newStats);

      if (error) {
        console.error("[ProgressStorage] Error creating stats:", error);
        return false;
      }
      return true;
    }

    // Update existing stats
    const oldCount = existing.system_design_count || 0;
    const updatedSnapshots = updateWeeklySnapshot(
      existing.weekly_snapshots || [],
      currentWeek,
      "system_design",
      evaluation.overallScore,
      oldCount
    );

    const { error } = await supabase
      .from("user_interview_stats")
      .update({
        total_interviews: (existing.total_interviews || 0) + 1,
        system_design_count: oldCount + 1,
        system_design_avg_score: calculateRollingAverage(existing.system_design_avg_score, oldCount, evaluation.overallScore),
        sd_requirements_avg: calculateRollingAverage(existing.sd_requirements_avg, oldCount, breakdown.requirements),
        sd_architecture_avg: calculateRollingAverage(existing.sd_architecture_avg, oldCount, breakdown.architecture),
        sd_scalability_avg: calculateRollingAverage(existing.sd_scalability_avg, oldCount, breakdown.scalability),
        sd_data_model_avg: calculateRollingAverage(existing.sd_data_model_avg, oldCount, breakdown.dataModel),
        sd_tradeoffs_avg: calculateRollingAverage(existing.sd_tradeoffs_avg, oldCount, breakdown.tradeoffs),
        sd_reliability_avg: calculateRollingAverage(existing.sd_reliability_avg, oldCount, breakdown.reliability),
        sd_communication_avg: calculateRollingAverage(existing.sd_communication_avg, oldCount, breakdown.communication),
        weekly_snapshots: updatedSnapshots,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("[ProgressStorage] Error updating stats:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[ProgressStorage] Unexpected error:", err);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVER-SIDE SAVE FUNCTIONS (for API routes)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save coding progress for a specific user (server-side version)
 */
export async function saveCodingProgressForUser(
  client: SupabaseClient,
  userId: string,
  evaluation: CodingEvaluationResult
): Promise<boolean> {
  try {
    // Get existing stats
    const { data: existing } = await client
      .from("user_interview_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    const currentWeek = getCurrentWeek();
    const breakdown = evaluation.breakdown;

    if (!existing) {
      // Create new stats record
      console.log("[ProgressStorage] Creating new stats for user:", userId);
      const newStats = {
        user_id: userId,
        total_interviews: 1,
        coding_count: 1,
        behavioral_count: 0,
        system_design_count: 0,
        coding_avg_score: evaluation.overallScore,
        coding_correctness_avg: breakdown.correctness,
        coding_time_complexity_avg: breakdown.timeComplexity,
        coding_space_complexity_avg: breakdown.spaceComplexity,
        coding_code_quality_avg: breakdown.codeQuality,
        coding_problem_solving_avg: breakdown.problemSolving,
        weekly_snapshots: [{
          week: currentWeek,
          coding: evaluation.overallScore,
          behavioral: null,
          system_design: null,
        }],
      };

      const { error } = await client
        .from("user_interview_stats")
        .insert(newStats);

      if (error) {
        console.error("[ProgressStorage] Error creating stats:", error);
        return false;
      }
      return true;
    }

    // Update existing stats
    console.log("[ProgressStorage] Updating existing stats for user:", userId);
    const oldCount = existing.coding_count || 0;
    const updatedSnapshots = updateWeeklySnapshot(
      existing.weekly_snapshots || [],
      currentWeek,
      "coding",
      evaluation.overallScore,
      oldCount
    );

    const { error } = await client
      .from("user_interview_stats")
      .update({
        total_interviews: (existing.total_interviews || 0) + 1,
        coding_count: oldCount + 1,
        coding_avg_score: calculateRollingAverage(existing.coding_avg_score, oldCount, evaluation.overallScore),
        coding_correctness_avg: calculateRollingAverage(existing.coding_correctness_avg, oldCount, breakdown.correctness),
        coding_time_complexity_avg: calculateRollingAverage(existing.coding_time_complexity_avg, oldCount, breakdown.timeComplexity),
        coding_space_complexity_avg: calculateRollingAverage(existing.coding_space_complexity_avg, oldCount, breakdown.spaceComplexity),
        coding_code_quality_avg: calculateRollingAverage(existing.coding_code_quality_avg, oldCount, breakdown.codeQuality),
        coding_problem_solving_avg: calculateRollingAverage(existing.coding_problem_solving_avg, oldCount, breakdown.problemSolving),
        weekly_snapshots: updatedSnapshots,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[ProgressStorage] Error updating stats:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[ProgressStorage] Unexpected error:", err);
    return false;
  }
}

/**
 * Save behavioral progress for a specific user (server-side version)
 */
export async function saveBehavioralProgressForUser(
  client: SupabaseClient,
  userId: string,
  evaluation: BehavioralEvaluationResult
): Promise<boolean> {
  try {
    // Extract dimension scores from breakdown
    const breakdown = evaluation.breakdown;
    const dimensionScores = {
      starStructure: breakdown["STAR Structure & Story Clarity"]?.score ?? null,
      ownership: breakdown["Ownership & Personal Agency"]?.score ?? null,
      impact: breakdown["Impact & Quantified Results"]?.score ?? null,
      leadership: breakdown["Leadership & Influence"]?.score ?? null,
      decisionMaking: breakdown["Problem-Solving & Decision-Making"]?.score ?? null,
      growthMindset: breakdown["Growth Mindset & Self-Awareness"]?.score ?? null,
      communication: breakdown["Communication Clarity & Conciseness"]?.score ?? null,
    };

    // Get existing stats
    const { data: existing } = await client
      .from("user_interview_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    const currentWeek = getCurrentWeek();

    if (!existing) {
      // Create new stats record
      console.log("[ProgressStorage] Creating new behavioral stats for user:", userId);
      const newStats = {
        user_id: userId,
        total_interviews: 1,
        coding_count: 0,
        behavioral_count: 1,
        system_design_count: 0,
        behavioral_avg_score: evaluation.overallScore,
        behavioral_star_structure_avg: dimensionScores.starStructure,
        behavioral_ownership_avg: dimensionScores.ownership,
        behavioral_impact_avg: dimensionScores.impact,
        behavioral_leadership_avg: dimensionScores.leadership,
        behavioral_decision_making_avg: dimensionScores.decisionMaking,
        behavioral_growth_mindset_avg: dimensionScores.growthMindset,
        behavioral_communication_avg: dimensionScores.communication,
        weekly_snapshots: [{
          week: currentWeek,
          coding: null,
          behavioral: evaluation.overallScore,
          system_design: null,
        }],
      };

      const { error } = await client
        .from("user_interview_stats")
        .insert(newStats);

      if (error) {
        console.error("[ProgressStorage] Error creating stats:", error);
        return false;
      }
      return true;
    }

    // Update existing stats
    console.log("[ProgressStorage] Updating existing behavioral stats for user:", userId);
    const oldCount = existing.behavioral_count || 0;
    const updatedSnapshots = updateWeeklySnapshot(
      existing.weekly_snapshots || [],
      currentWeek,
      "behavioral",
      evaluation.overallScore,
      oldCount
    );

    const updateData: Record<string, unknown> = {
      total_interviews: (existing.total_interviews || 0) + 1,
      behavioral_count: oldCount + 1,
      behavioral_avg_score: calculateRollingAverage(existing.behavioral_avg_score, oldCount, evaluation.overallScore),
      weekly_snapshots: updatedSnapshots,
    };

    // Only update dimension averages if we have scores
    if (dimensionScores.starStructure !== null) {
      updateData.behavioral_star_structure_avg = calculateRollingAverage(existing.behavioral_star_structure_avg, oldCount, dimensionScores.starStructure);
    }
    if (dimensionScores.ownership !== null) {
      updateData.behavioral_ownership_avg = calculateRollingAverage(existing.behavioral_ownership_avg, oldCount, dimensionScores.ownership);
    }
    if (dimensionScores.impact !== null) {
      updateData.behavioral_impact_avg = calculateRollingAverage(existing.behavioral_impact_avg, oldCount, dimensionScores.impact);
    }
    if (dimensionScores.leadership !== null) {
      updateData.behavioral_leadership_avg = calculateRollingAverage(existing.behavioral_leadership_avg, oldCount, dimensionScores.leadership);
    }
    if (dimensionScores.decisionMaking !== null) {
      updateData.behavioral_decision_making_avg = calculateRollingAverage(existing.behavioral_decision_making_avg, oldCount, dimensionScores.decisionMaking);
    }
    if (dimensionScores.growthMindset !== null) {
      updateData.behavioral_growth_mindset_avg = calculateRollingAverage(existing.behavioral_growth_mindset_avg, oldCount, dimensionScores.growthMindset);
    }
    if (dimensionScores.communication !== null) {
      updateData.behavioral_communication_avg = calculateRollingAverage(existing.behavioral_communication_avg, oldCount, dimensionScores.communication);
    }

    const { error } = await client
      .from("user_interview_stats")
      .update(updateData)
      .eq("user_id", userId);

    if (error) {
      console.error("[ProgressStorage] Error updating stats:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[ProgressStorage] Unexpected error:", err);
    return false;
  }
}

/**
 * Save system design progress for a specific user (server-side version)
 */
export async function saveSystemDesignProgressForUser(
  client: SupabaseClient,
  userId: string,
  evaluation: SystemDesignEvaluationResult
): Promise<boolean> {
  try {
    const breakdown = evaluation.breakdown;

    // Get existing stats
    const { data: existing } = await client
      .from("user_interview_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    const currentWeek = getCurrentWeek();

    if (!existing) {
      // Create new stats record
      console.log("[ProgressStorage] Creating new system design stats for user:", userId);
      const newStats = {
        user_id: userId,
        total_interviews: 1,
        coding_count: 0,
        behavioral_count: 0,
        system_design_count: 1,
        system_design_avg_score: evaluation.overallScore,
        sd_requirements_avg: breakdown.requirements,
        sd_architecture_avg: breakdown.architecture,
        sd_scalability_avg: breakdown.scalability,
        sd_data_model_avg: breakdown.dataModel,
        sd_tradeoffs_avg: breakdown.tradeoffs,
        sd_reliability_avg: breakdown.reliability,
        sd_communication_avg: breakdown.communication,
        weekly_snapshots: [{
          week: currentWeek,
          coding: null,
          behavioral: null,
          system_design: evaluation.overallScore,
        }],
      };

      const { error } = await client
        .from("user_interview_stats")
        .insert(newStats);

      if (error) {
        console.error("[ProgressStorage] Error creating stats:", error);
        return false;
      }
      return true;
    }

    // Update existing stats
    console.log("[ProgressStorage] Updating existing system design stats for user:", userId);
    const oldCount = existing.system_design_count || 0;
    const updatedSnapshots = updateWeeklySnapshot(
      existing.weekly_snapshots || [],
      currentWeek,
      "system_design",
      evaluation.overallScore,
      oldCount
    );

    const { error } = await client
      .from("user_interview_stats")
      .update({
        total_interviews: (existing.total_interviews || 0) + 1,
        system_design_count: oldCount + 1,
        system_design_avg_score: calculateRollingAverage(existing.system_design_avg_score, oldCount, evaluation.overallScore),
        sd_requirements_avg: calculateRollingAverage(existing.sd_requirements_avg, oldCount, breakdown.requirements),
        sd_architecture_avg: calculateRollingAverage(existing.sd_architecture_avg, oldCount, breakdown.architecture),
        sd_scalability_avg: calculateRollingAverage(existing.sd_scalability_avg, oldCount, breakdown.scalability),
        sd_data_model_avg: calculateRollingAverage(existing.sd_data_model_avg, oldCount, breakdown.dataModel),
        sd_tradeoffs_avg: calculateRollingAverage(existing.sd_tradeoffs_avg, oldCount, breakdown.tradeoffs),
        sd_reliability_avg: calculateRollingAverage(existing.sd_reliability_avg, oldCount, breakdown.reliability),
        sd_communication_avg: calculateRollingAverage(existing.sd_communication_avg, oldCount, breakdown.communication),
        weekly_snapshots: updatedSnapshots,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[ProgressStorage] Error updating stats:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[ProgressStorage] Unexpected error:", err);
    return false;
  }
}

/**
 * Update weekly snapshot with new score
 * Keeps last 12 weeks of data
 */
function updateWeeklySnapshot(
  snapshots: WeeklySnapshot[],
  currentWeek: string,
  type: InterviewType,
  newScore: number,
  previousCount: number
): WeeklySnapshot[] {
  const updated = [...snapshots];
  
  // Find existing snapshot for current week
  const existingIndex = updated.findIndex(s => s.week === currentWeek);
  
  if (existingIndex >= 0) {
    // Update existing week - calculate running average for this week
    const existing = updated[existingIndex];
    const oldWeekScore = type === "coding" ? existing.coding 
      : type === "behavioral" ? existing.behavioral 
      : existing.system_design;
    
    // Simple average for the week (could track per-week counts for more accuracy)
    const newWeekScore = oldWeekScore !== null 
      ? (oldWeekScore + newScore) / 2 
      : newScore;
    
    updated[existingIndex] = {
      ...existing,
      [type]: newWeekScore,
    };
  } else {
    // Add new week entry
    updated.push({
      week: currentWeek,
      coding: type === "coding" ? newScore : null,
      behavioral: type === "behavioral" ? newScore : null,
      system_design: type === "system_design" ? newScore : null,
    });
  }
  
  // Sort by week (newest first) and keep last 12 weeks
  updated.sort((a, b) => b.week.localeCompare(a.week));
  return updated.slice(0, 12);
}

/**
 * Calculate strengths and weaknesses from stats
 */
export function calculateStrengthsAndWeaknesses(stats: ProgressStats): {
  strengths: { dimension: string; score: number; category: string }[];
  weaknesses: { dimension: string; score: number; category: string }[];
} {
  const allDimensions: { dimension: string; score: number | null; category: string }[] = [
    // Coding
    { dimension: "Correctness", score: stats.dimensions.coding.correctness, category: "Coding" },
    { dimension: "Time Complexity", score: stats.dimensions.coding.timeComplexity, category: "Coding" },
    { dimension: "Space Complexity", score: stats.dimensions.coding.spaceComplexity, category: "Coding" },
    { dimension: "Code Quality", score: stats.dimensions.coding.codeQuality, category: "Coding" },
    { dimension: "Problem Solving", score: stats.dimensions.coding.problemSolving, category: "Coding" },
    // Behavioral
    { dimension: "STAR Structure", score: stats.dimensions.behavioral.starStructure, category: "Behavioral" },
    { dimension: "Ownership", score: stats.dimensions.behavioral.ownership, category: "Behavioral" },
    { dimension: "Impact & Results", score: stats.dimensions.behavioral.impact, category: "Behavioral" },
    { dimension: "Leadership", score: stats.dimensions.behavioral.leadership, category: "Behavioral" },
    { dimension: "Decision Making", score: stats.dimensions.behavioral.decisionMaking, category: "Behavioral" },
    { dimension: "Growth Mindset", score: stats.dimensions.behavioral.growthMindset, category: "Behavioral" },
    { dimension: "Communication", score: stats.dimensions.behavioral.communication, category: "Behavioral" },
    // System Design
    { dimension: "Requirements", score: stats.dimensions.systemDesign.requirements, category: "System Design" },
    { dimension: "Architecture", score: stats.dimensions.systemDesign.architecture, category: "System Design" },
    { dimension: "Scalability", score: stats.dimensions.systemDesign.scalability, category: "System Design" },
    { dimension: "Data Model", score: stats.dimensions.systemDesign.dataModel, category: "System Design" },
    { dimension: "Trade-offs", score: stats.dimensions.systemDesign.tradeoffs, category: "System Design" },
    { dimension: "Reliability", score: stats.dimensions.systemDesign.reliability, category: "System Design" },
  ];

  // Filter out null scores and sort
  const validDimensions = allDimensions
    .filter((d): d is { dimension: string; score: number; category: string } => d.score !== null)
    .sort((a, b) => b.score - a.score);

  return {
    strengths: validDimensions.slice(0, 3),
    weaknesses: validDimensions.slice(-3).reverse(),
  };
}

/**
 * Get verdict badge for a score
 */
export function getVerdictForScore(score: number | null): {
  verdict: string;
  color: "green" | "amber" | "red" | "gray";
} {
  if (score === null) {
    return { verdict: "No data", color: "gray" };
  }
  if (score >= 4.5) {
    return { verdict: "Strong Pass", color: "green" };
  }
  if (score >= 3.5) {
    return { verdict: "Pass", color: "green" };
  }
  if (score >= 2.5) {
    return { verdict: "Borderline", color: "amber" };
  }
  return { verdict: "Needs Work", color: "red" };
}
