/**
 * FAANG-Level Coding Interview Evaluation Rubric
 * 
 * Based on technical assessment standards used at Google, Meta, Amazon, Apple, Netflix.
 * 
 * Scoring: 1-5 scale (half-points allowed for borderline cases)
 * - 5.0: Exceptional (optimal solution, production-quality, rare)
 * - 4.0-4.5: Strong Pass (good solution, hire recommendation)
 * - 3.0-3.5: Pass (acceptable solution, meets bar)
 * - 2.5: Borderline (significant issues, lean no hire)
 * - 1.0-2.0: Fail (wrong approach, major bugs)
 * 
 * Critical Rules:
 * - Solution that doesn't compile/run = automatic cap at 2.0
 * - Wrong output for basic test cases = automatic cap at 2.5
 * - Any dimension below 2.5 with Correctness = overall Fail
 */

export type CodingCriterion = {
  name: string;
  weight: number;
  description: string;
  levels: {
    score: number;
    label: string;
    description: string;
  }[];
  followUpTriggers: string[];
};

export const CODING_RUBRIC_CRITERIA: CodingCriterion[] = [
  {
    name: "Correctness",
    weight: 0.30,
    description: "Does the solution produce correct output for all cases including edge cases?",
    levels: [
      { score: 1, label: "Strong Fail", description: "Does not compile or run. Fundamental syntax errors. Completely wrong approach." },
      { score: 2, label: "Fail", description: "Compiles but produces wrong output for basic test cases. Major logical errors." },
      { score: 3, label: "Pass", description: "Works for standard cases. May fail on some edge cases (empty input, large input, boundaries)." },
      { score: 4, label: "Strong Pass", description: "Correct for all test cases including most edge cases. Handles nulls, empty input, single element." },
      { score: 5, label: "Exceptional", description: "Handles all cases including tricky edges (overflow, negative, duplicates, concurrent). Defensive coding." },
    ],
    followUpTriggers: [
      "What happens if the input is empty?",
      "What if there are duplicate values?",
      "Have you considered integer overflow?",
      "What if the input is null or undefined?",
      "Does this work for negative numbers?",
      "What's the behavior at the boundaries?",
    ],
  },
  {
    name: "Time Complexity",
    weight: 0.20,
    description: "Is the algorithm optimally efficient in terms of time? Can candidate analyze complexity?",
    levels: [
      { score: 1, label: "Strong Fail", description: "Exponential complexity for polynomial problem. No understanding of Big-O. Brute force O(n!) or O(2^n)." },
      { score: 2, label: "Fail", description: "Suboptimal by 2+ complexity classes (e.g., O(n³) when O(n) possible). Cannot explain complexity." },
      { score: 3, label: "Pass", description: "Acceptable but not optimal (e.g., O(n²) when O(n log n) possible). Can explain own solution's complexity." },
      { score: 4, label: "Strong Pass", description: "Optimal or near-optimal complexity. Clear understanding of why. Knows trade-offs." },
      { score: 5, label: "Exceptional", description: "Optimal complexity. Discusses amortized analysis, best/worst/average cases. Could derive tighter bounds." },
    ],
    followUpTriggers: [
      "What's the time complexity of your solution?",
      "Can you explain why it's O(n log n)?",
      "What's the worst case scenario?",
      "How would this scale to 10 million elements?",
      "Is there a way to do this faster?",
      "What's the time complexity of that inner operation?",
    ],
  },
  {
    name: "Space Complexity",
    weight: 0.15,
    description: "Does the solution use memory efficiently? Understands space trade-offs?",
    levels: [
      { score: 1, label: "Strong Fail", description: "Massive memory waste. Creates unnecessary copies. Doesn't understand memory implications." },
      { score: 2, label: "Fail", description: "Uses O(n²) space when O(n) possible. Cannot explain space usage." },
      { score: 3, label: "Pass", description: "Reasonable space (e.g., O(n)) but could be O(1). Understands own space usage." },
      { score: 4, label: "Strong Pass", description: "Efficient space usage. Uses in-place algorithms where applicable. Discusses memory trade-offs." },
      { score: 5, label: "Exceptional", description: "Optimal space. In-place modifications. Discusses cache locality, memory access patterns." },
    ],
    followUpTriggers: [
      "What's the space complexity?",
      "Can you solve this in-place?",
      "How much extra memory does this use?",
      "What's the trade-off between time and space here?",
      "Could you reduce memory usage if needed?",
      "What if memory was very constrained?",
    ],
  },
  {
    name: "Code Quality",
    weight: 0.20,
    description: "Is the code readable, well-structured, maintainable, and production-ready?",
    levels: [
      { score: 1, label: "Strong Fail", description: "Unreadable code. Single-letter variables. No structure. Magic numbers. Would reject in code review." },
      { score: 2, label: "Fail", description: "Messy but functional. Poor naming. Long functions. Hard to follow. Needs significant cleanup." },
      { score: 3, label: "Pass", description: "Clean enough. Reasonable variable names. Some structure. Would pass basic code review." },
      { score: 4, label: "Strong Pass", description: "Clean, readable code. Good naming conventions. Modular functions. Clear logic flow." },
      { score: 5, label: "Exceptional", description: "Production-quality. Excellent naming. Well-structured. Self-documenting. Could ship to production." },
    ],
    followUpTriggers: [
      "Could you refactor this into smaller functions?",
      "What would you name this variable in production?",
      "How would you make this more readable?",
      "Would this pass code review at your company?",
      "How would you add error handling?",
      "What tests would you write for this?",
    ],
  },
  {
    name: "Problem-Solving Approach",
    weight: 0.15,
    description: "Did candidate approach systematically? Ask clarifying questions? Discuss trade-offs?",
    levels: [
      { score: 1, label: "Strong Fail", description: "Jumped straight to coding without understanding problem. No clarifying questions. Random approach." },
      { score: 2, label: "Fail", description: "Minimal problem analysis. Didn't consider examples. Changed approach mid-way due to lack of planning." },
      { score: 3, label: "Pass", description: "Some upfront thinking. Walked through an example. Basic plan before coding." },
      { score: 4, label: "Strong Pass", description: "Good problem-solving. Asked clarifying questions. Discussed approach before coding. Considered alternatives." },
      { score: 5, label: "Exceptional", description: "Excellent methodology. Clarified constraints. Multiple approaches with trade-offs. Test cases upfront. Debugging systematic." },
    ],
    followUpTriggers: [
      "What clarifying questions would you ask?",
      "Walk me through your thought process.",
      "What alternative approaches did you consider?",
      "How did you decide on this approach?",
      "What are the trade-offs of your solution?",
      "How would you verify this is correct?",
    ],
  },
];

/**
 * Red flags for coding interviews
 */
export const CODING_RED_FLAGS = [
  { pattern: "doesn't compile or run", effect: "Overall capped at 2.0" },
  { pattern: "wrong output for basic test case", effect: "Correctness capped at 2.0" },
  { pattern: "cannot explain own code when asked", effect: "Code Quality capped at 2.0" },
  { pattern: "doesn't know time complexity of own solution", effect: "Time Complexity capped at 2.5" },
  { pattern: "copy-pasted solution without understanding", effect: "AUTOMATIC FAIL - integrity" },
  { pattern: "gives up without attempting", effect: "AUTOMATIC FAIL - resilience" },
  { pattern: "cannot handle ANY follow-up questions", effect: "Problem-Solving capped at 2.0" },
];

/**
 * Common follow-up question bank for probing depth
 */
export const CODING_FOLLOWUPS = {
  complexity: [
    "What's the time complexity of your solution?",
    "What's the space complexity?",
    "Can you optimize this further?",
    "What's the complexity of that inner loop/operation?",
    "How does this scale with input size?",
  ],
  edgeCases: [
    "What edge cases did you consider?",
    "What happens with empty input?",
    "Does this handle negative numbers?",
    "What about duplicate values?",
    "What if the input is very large?",
  ],
  alternatives: [
    "Can you think of an alternative approach?",
    "What's the trade-off between your approaches?",
    "Could you solve this iteratively/recursively?",
    "What data structure would improve this?",
  ],
  debugging: [
    "Let's trace through this with input X.",
    "I see a potential issue - can you find it?",
    "How would you test this code?",
    "What would break if input was Y?",
  ],
  optimization: [
    "Can you do this in-place?",
    "Can you reduce memory usage?",
    "What if we needed to handle concurrent access?",
    "How would you parallelize this?",
  ],
};

export type CodingEvaluationResult = {
  overallScore: number; // 1-5 scale
  verdict: "Strong Pass" | "Pass" | "Borderline" | "Fail" | "Strong Fail";
  breakdown: {
    correctness: number;
    timeComplexity: number;
    spaceComplexity: number;
    codeQuality: number;
    problemSolving: number;
  };
  complexityAnalysis: {
    time: string;
    space: string;
    isOptimal: boolean;
    explanation: string;
  };
  strengths: string[];
  improvements: string[];
  redFlagsIdentified: string[];
  suggestedOptimization?: string;
  overallFeedback: string;
  nextFollowUp: string;
};

function getVerdict(score: number): CodingEvaluationResult["verdict"] {
  if (score >= 4.5) return "Strong Pass";
  if (score >= 3.5) return "Pass";
  if (score >= 2.5) return "Borderline";
  if (score >= 1.5) return "Fail";
  return "Strong Fail";
}

/**
 * Builds the FAANG-level evaluation prompt for coding interviews
 */
export const buildCodingEvaluationPrompt = (
  question: string,
  code: string,
  language: string,
  transcript: string,
  difficulty?: string,
  expectedComplexity?: { time?: string; space?: string }
): string => {
  const rubricText = CODING_RUBRIC_CRITERIA.map((criterion) => {
    const levelsText = criterion.levels
      .map((l) => `    ${l.score}: ${l.label} - ${l.description}`)
      .join("\n");
    return `**${criterion.name}** (${criterion.weight * 100}% weight)\n${criterion.description}\n${levelsText}`;
  }).join("\n\n");

  const redFlagsText = CODING_RED_FLAGS.map(f => `- ${f.pattern} → ${f.effect}`).join("\n");

  const difficultyNote = difficulty ? `\nDifficulty: ${difficulty}` : "";
  const complexityNote = expectedComplexity
    ? `\nExpected optimal: Time ${expectedComplexity.time || "N/A"}, Space ${expectedComplexity.space || "N/A"}`
    : "";

  return `You are a FAANG coding interviewer (Google/Meta/Amazon level) evaluating a candidate's solution.

## PROBLEM
${question}
${difficultyNote}${complexityNote}

## CANDIDATE'S CODE (${language})
\`\`\`${language}
${code}
\`\`\`

## CANDIDATE'S EXPLANATION (transcribed from audio)
${transcript || "No verbal explanation provided"}

## EVALUATION RUBRIC (Score 1-5, half-points allowed)
${rubricText}

## RED FLAGS (apply score caps if detected)
${redFlagsText}

## PASS/FAIL THRESHOLDS
- 4.5+: Strong Pass (optimal solution, hire)
- 3.5-4.4: Pass (good solution, hire with notes)
- 2.5-3.4: Borderline (significant issues, lean no)
- 1.5-2.4: Fail (wrong approach, major bugs)
- <1.5: Strong Fail (doesn't compile, fundamental issues)

## INSTRUCTIONS
Be strict but fair. A 3.0 is "meets bar" not good. A 5.0 is rare - reserved for optimal, production-ready code.
Verify the solution's correctness mentally. Check edge cases.
Consider difficulty when scoring - harder problems get slight leniency.

Return JSON with this structure:
{
  "overallScore": <number 1-5>,
  "verdict": "<Strong Pass | Pass | Borderline | Fail | Strong Fail>",
  "breakdown": {
    "correctness": <1-5>,
    "timeComplexity": <1-5>,
    "spaceComplexity": <1-5>,
    "codeQuality": <1-5>,
    "problemSolving": <1-5>
  },
  "complexityAnalysis": {
    "time": "<e.g., O(n log n)>",
    "space": "<e.g., O(n)>",
    "isOptimal": <true/false>,
    "explanation": "<why this complexity, and if optimal>"
  },
  "strengths": ["<specific strength with code reference>", "<strength 2>"],
  "improvements": ["<actionable improvement>", "<improvement 2>", "<improvement 3>"],
  "redFlagsIdentified": ["<red flag if any>"],
  "suggestedOptimization": "<how to improve if suboptimal, or null>",
  "overallFeedback": "<2-3 sentence summary>",
  "nextFollowUp": "<follow-up question to probe understanding>"
}`;
};

/**
 * Builds follow-up question prompt for coding interviews
 */
export const buildFollowUpPrompt = (
  question: string,
  code: string,
  language: string,
  conversationHistory: { role: "interviewer" | "candidate"; content: string }[],
  previousEvaluation?: CodingEvaluationResult
): string => {
  const historyText = conversationHistory
    .map(turn => `${turn.role === "interviewer" ? "Interviewer" : "Candidate"}: ${turn.content}`)
    .join("\n");

  // Find weakest dimension
  let weakestArea = "";
  let lowestScore = 6;
  if (previousEvaluation?.breakdown) {
    const breakdown = previousEvaluation.breakdown;
    const areas = [
      { name: "complexity", score: Math.min(breakdown.timeComplexity, breakdown.spaceComplexity) },
      { name: "correctness", score: breakdown.correctness },
      { name: "codeQuality", score: breakdown.codeQuality },
      { name: "problemSolving", score: breakdown.problemSolving },
    ];
    for (const area of areas) {
      if (area.score < lowestScore) {
        lowestScore = area.score;
        weakestArea = area.name;
      }
    }
  }

  // Get relevant follow-ups for the weak area
  const areaFollowUps = CODING_FOLLOWUPS[weakestArea as keyof typeof CODING_FOLLOWUPS] || CODING_FOLLOWUPS.complexity;

  return `You are a FAANG coding interviewer conducting follow-up discussion.

## ORIGINAL PROBLEM
${question}

## CANDIDATE'S CODE (${language})
\`\`\`${language}
${code}
\`\`\`

${previousEvaluation ? `## EVALUATION NOTES
- Score: ${previousEvaluation.overallScore}/5 (${previousEvaluation.verdict})
- Time: ${previousEvaluation.complexityAnalysis.time}, Space: ${previousEvaluation.complexityAnalysis.space}
- Optimal: ${previousEvaluation.complexityAnalysis.isOptimal ? "Yes" : "No"}
- Weakest area: ${weakestArea} (${lowestScore}/5)
- Improvements needed: ${previousEvaluation.improvements.join(", ")}` : ""}

## CONVERSATION SO FAR
${historyText}

## FOLLOW-UP BANK FOR ${weakestArea.toUpperCase()}
${areaFollowUps.map(q => `- ${q}`).join("\n")}

## YOUR TASK
Generate ONE follow-up question that:
1. Probes the weakest area (${weakestArea || "complexity or edge cases"})
2. Tests deeper understanding, not just memorization
3. If solution isn't optimal, guides toward optimization
4. Do NOT repeat questions already asked
5. Keep it conversational and concise (1-2 sentences)

Return ONLY the follow-up question text, nothing else.`;
};

/**
 * Validates the coding evaluation response structure
 */
export const validateCodingEvaluation = (result: unknown): result is CodingEvaluationResult => {
  if (!result || typeof result !== "object") return false;

  const r = result as Record<string, unknown>;

  // Check top-level fields
  if (
    typeof r.overallScore !== "number" ||
    r.overallScore < 1 || r.overallScore > 5 ||
    typeof r.verdict !== "string" ||
    !Array.isArray(r.strengths) ||
    !Array.isArray(r.improvements) ||
    typeof r.overallFeedback !== "string"
  ) {
    return false;
  }

  // Verify verdict is valid
  const validVerdicts = ["Strong Pass", "Pass", "Borderline", "Fail", "Strong Fail"];
  if (!validVerdicts.includes(r.verdict as string)) {
    return false;
  }

  // Validate breakdown object
  if (!r.breakdown || typeof r.breakdown !== "object") return false;
  const breakdown = r.breakdown as Record<string, unknown>;
  if (
    typeof breakdown.correctness !== "number" ||
    typeof breakdown.timeComplexity !== "number" ||
    typeof breakdown.spaceComplexity !== "number" ||
    typeof breakdown.codeQuality !== "number" ||
    typeof breakdown.problemSolving !== "number"
  ) {
    return false;
  }

  // Validate complexityAnalysis object
  if (!r.complexityAnalysis || typeof r.complexityAnalysis !== "object") return false;
  const complexity = r.complexityAnalysis as Record<string, unknown>;
  if (
    typeof complexity.time !== "string" ||
    typeof complexity.space !== "string" ||
    typeof complexity.explanation !== "string"
  ) {
    return false;
  }

  return true;
};

// Legacy exports for backwards compatibility
export const CODING_RUBRIC = {
  criteria: CODING_RUBRIC_CRITERIA,
  followUpQuestions: Object.values(CODING_FOLLOWUPS).flat(),
};
