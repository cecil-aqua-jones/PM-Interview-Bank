// PM Interview Evaluation Rubric
// Used by GPT to evaluate candidate responses

export const PM_RUBRIC = {
  criteria: [
    {
      name: "Structure",
      weight: 0.2,
      description:
        "Clear framework, logical flow, STAR/CIRCLES method when applicable",
      levels: {
        poor: "Rambling, no clear structure, jumps between points",
        fair: "Some structure but inconsistent, missing key elements",
        good: "Clear framework with logical progression",
        excellent:
          "Exceptional structure, easy to follow, comprehensive coverage",
      },
    },
    {
      name: "Product Thinking",
      weight: 0.3,
      description:
        "User focus, problem framing, market awareness, feature prioritization",
      levels: {
        poor: "No user focus, solution-first thinking, ignores constraints",
        fair: "Some user consideration but shallow, generic solutions",
        good: "Strong user empathy, clear problem framing, thoughtful tradeoffs",
        excellent:
          "Deep user insight, creative solutions, considers ecosystem impact",
      },
    },
    {
      name: "Metrics & Data",
      weight: 0.2,
      description:
        "Success measurement, data-driven reasoning, experiment design",
      levels: {
        poor: "No metrics mentioned, purely qualitative reasoning",
        fair: "Generic metrics (MAU, revenue), no measurement strategy",
        good: "Specific relevant metrics, clear success criteria",
        excellent:
          "Comprehensive measurement framework, considers leading/lagging indicators",
      },
    },
    {
      name: "Communication",
      weight: 0.15,
      description: "Clarity, conciseness, confidence, handles ambiguity well",
      levels: {
        poor: "Unclear, overly verbose, doesn't address the question",
        fair: "Understandable but wordy, some tangents",
        good: "Clear and concise, addresses key points",
        excellent:
          "Crisp communication, confident delivery, great signal-to-noise",
      },
    },
    {
      name: "Execution Mindset",
      weight: 0.15,
      description:
        "Feasibility awareness, technical understanding, stakeholder management",
      levels: {
        poor: "Ignores implementation, unrealistic scope",
        fair: "Some awareness of constraints but hand-wavy",
        good: "Realistic approach, considers dependencies and risks",
        excellent:
          "Strong execution plan, proactive risk mitigation, cross-functional thinking",
      },
    },
  ],

  difficultyMultipliers: {
    easy: 1.1, // Slight boost for easy questions (higher bar)
    medium: 1.0,
    hard: 0.9, // Slight leniency for hard questions
    frequent: 1.0,
  } as Record<string, number>,

  scoreDescriptions: {
    1: "Needs significant improvement",
    2: "Below expectations",
    3: "Meets minimum bar",
    4: "Meets expectations",
    5: "Solid performance",
    6: "Above average",
    7: "Strong performance",
    8: "Excellent",
    9: "Outstanding",
    10: "Exceptional - top tier",
  } as Record<number, string>,
};

export const buildEvaluationPrompt = (
  question: string,
  transcript: string,
  tags: string[],
  difficulty?: string
): string => {
  const difficultyNote = difficulty
    ? `\nQuestion difficulty: ${difficulty}`
    : "";
  const tagsNote = tags.length > 0 ? `\nQuestion categories: ${tags.join(", ")}` : "";

  return `You are an expert PM interviewer at a top tech company (Google, Meta, Amazon level). 
Evaluate this candidate's response to a Product Management interview question.

## Question
${question}
${difficultyNote}${tagsNote}

## Candidate's Response (transcribed from voice)
${transcript}

## Evaluation Rubric
Score each dimension from 1-10:

1. **Structure** (20%): Clear framework, logical flow, STAR/CIRCLES method when applicable
2. **Product Thinking** (30%): User focus, problem framing, market awareness, prioritization
3. **Metrics & Data** (20%): Success measurement, data-driven reasoning, experiment design
4. **Communication** (15%): Clarity, conciseness, confidence
5. **Execution Mindset** (15%): Feasibility, technical awareness, stakeholder thinking

## Response Format
Return a JSON object with this exact structure:
{
  "overallScore": <number 1-10>,
  "breakdown": {
    "structure": <number 1-10>,
    "productThinking": <number 1-10>,
    "metrics": <number 1-10>,
    "communication": <number 1-10>,
    "execution": <number 1-10>
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "overallFeedback": "<2-3 sentence summary of performance and key advice>"
}

Be constructive but honest. A score of 5-6 is average, 7+ is strong, 8+ is exceptional.
Consider this is from spoken response (may have filler words, slight repetition).`;
};

export type EvaluationResult = {
  overallScore: number;
  breakdown: {
    structure: number;
    productThinking: number;
    metrics: number;
    communication: number;
    execution: number;
  };
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
};
