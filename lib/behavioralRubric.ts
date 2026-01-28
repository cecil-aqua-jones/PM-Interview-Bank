/**
 * Top Tech-Level Behavioral Interview Evaluation Rubric
 * 
 * Based on industry-standard behavioral assessment frameworks used at
 * Google, Meta, Amazon, Apple, Microsoft, OpenAI, Anthropic, and other top tech companies.
 * 
 * Scoring: 1-5 scale (half-points allowed for borderline cases)
 * - 5.0: Exceptional (VP-level story, rare)
 * - 4.0-4.5: Strong Pass (ready for top tech)
 * - 3.0-3.5: Pass (meets bar, minor polish needed)
 * - 2.5: Borderline (significant prep needed)
 * - 1.0-2.0: Fail (major gaps)
 * 
 * Critical Rule: Any dimension below 3.0 = automatic overall Fail
 */

export type BehavioralCriterion = {
  name: string;
  weight: number;
  description: string;
  levels: {
    score: number;
    label: string;
    description: string;
  }[];
  followUpTriggers: string[];
  feedbackTemplates: {
    low: string;
    mid: string;
    high: string;
  };
};

export const BEHAVIORAL_RUBRIC: BehavioralCriterion[] = [
  {
    name: "STAR Structure & Story Clarity",
    weight: 0.15,
    description: "Delivers well-structured, coherent narrative using Situation-Task-Action-Result framework",
    levels: [
      { score: 1, label: "Strong Fail", description: "No discernible structure. Rambling, incoherent. Cannot identify STAR components. Jumps randomly between topics." },
      { score: 2, label: "Fail", description: "Partial structure with major gaps. Missing one or more STAR components. Story is confusing. Excessive tangents." },
      { score: 3, label: "Pass", description: "Clear STAR structure present. All components addressed. Logical and followable. Appropriate length (2-3 minutes)." },
      { score: 4, label: "Strong Pass", description: "Excellent structure with smooth transitions. Balanced time (60-70% on Action). Engaging narrative arc." },
      { score: 5, label: "Exceptional", description: "Masterful storytelling. Perfect pacing. Compelling, memorable narrative. Could teach this framework to others." },
    ],
    followUpTriggers: [
      "Can you walk me through that situation again, focusing specifically on what YOU did?",
      "I want to make sure I understand - what was the specific outcome?",
      "Let me pause you there - what was the context for this situation?",
      "You mentioned several actions - which one had the biggest impact?",
    ],
    feedbackTemplates: {
      low: "Your response lacked clear structure. Practice the STAR framework: Situation (15-20 sec), Task (10-15 sec), Action (90-120 sec), Result (20-30 sec). Record yourself and listen back.",
      mid: "You followed STAR structure but could improve. Practice tightening your Situation to under 30 seconds and expanding your Action section with more specific details.",
      high: "Excellent story structure. Your narrative flowed naturally with compelling details. The way you paced your response made it engaging and memorable.",
    },
  },
  {
    name: "Ownership & Personal Agency",
    weight: 0.20,
    description: "Demonstrates genuine ownership and individual contribution. Uses 'I' not 'we'. Takes responsibility.",
    levels: [
      { score: 1, label: "Strong Fail", description: "No personal ownership. Uses 'we' exclusively. Cannot articulate individual contribution. Passive observer." },
      { score: 2, label: "Fail", description: "Minimal ownership. Vague about personal role. Credits team without explaining own contribution. Avoids responsibility." },
      { score: 3, label: "Pass", description: "Clear personal ownership. Uses 'I' appropriately. Articulates specific individual contributions. Takes responsibility for successes and failures." },
      { score: 4, label: "Strong Pass", description: "Strong ownership mentality. Proactively took charge beyond expected scope. Demonstrates bias for action. Owns mistakes openly." },
      { score: 5, label: "Exceptional", description: "Exceptional ownership. Took initiative without being asked. Influenced beyond their role. Founder-like mentality." },
    ],
    followUpTriggers: [
      "You mentioned 'we' decided to do X - what was YOUR specific role in that decision?",
      "If you had to identify YOUR single biggest contribution, what would it be?",
      "What would have happened differently if you hadn't been involved?",
      "Was there a point where you disagreed with the team? What did you do?",
      "What mistakes did YOU make, and how did you handle them?",
    ],
    feedbackTemplates: {
      low: "You used 'we' throughout without clarifying your specific role. Interviewers need to understand YOUR contribution. Reframe stories: 'I was responsible for X', 'My specific contribution was Y'.",
      mid: "You showed ownership but could be more specific. Clarify exactly what decisions YOU made vs. the team. Practice distinguishing your unique contribution from team efforts.",
      high: "Excellent demonstration of ownership. You clearly articulated your role and took responsibility for outcomes. Your willingness to own mistakes showed maturity.",
    },
  },
  {
    name: "Impact & Quantified Results",
    weight: 0.20,
    description: "Demonstrates measurable business impact. Thinks in metrics. Connects work to business outcomes.",
    levels: [
      { score: 1, label: "Strong Fail", description: "No measurable impact stated. Cannot quantify outcomes. Results vague or nonexistent. No connection to business value." },
      { score: 2, label: "Fail", description: "Weak metrics. Uses qualifiers like 'improved' or 'helped' without numbers. Cannot explain business impact. Metrics seem fabricated." },
      { score: 3, label: "Pass", description: "Clear quantified results. Provides specific metrics (percentages, dollars, time saved). Connects to business value. Results credible." },
      { score: 4, label: "Strong Pass", description: "Strong impact with context. Multiple metrics provided. Explains significance of numbers. Shows understanding of broader business impact." },
      { score: 5, label: "Exceptional", description: "Exceptional, verified impact. Major business outcomes with specific metrics. Can explain measurement methodology. Impact influenced organizational strategy." },
    ],
    followUpTriggers: [
      "Can you put a number on that impact?",
      "How did you measure that success?",
      "What was the baseline before your involvement?",
      "How does that result compare to what was expected?",
      "What was the dollar value or business impact?",
      "How did this affect the company's key metrics or OKRs?",
    ],
    feedbackTemplates: {
      low: "Your answer lacked quantified results. Every story needs metrics: revenue impact, percentage improvements, time saved, users affected. Use reasonable estimates if exact numbers unavailable.",
      mid: "You provided some metrics but they lacked context. Explain: How was this measured? What was the baseline? Why does this number matter? Compare to alternatives.",
      high: "Excellent use of quantified results. Your metrics clearly demonstrated business value. The way you connected actions to outcomes showed strong business acumen.",
    },
  },
  {
    name: "Leadership & Influence",
    weight: 0.15,
    description: "Ability to lead, influence, and drive outcomes even without formal authority. Rallies others. Navigates complexity.",
    levels: [
      { score: 1, label: "Strong Fail", description: "No leadership demonstrated. Waited for direction. Did not influence others. Operated only within narrow boundaries." },
      { score: 2, label: "Fail", description: "Minimal leadership. Only led when assigned. Struggled to influence peers. Did not navigate organizational challenges." },
      { score: 3, label: "Pass", description: "Adequate leadership. Can lead small initiatives. Some ability to influence peers. Navigates straightforward organizational situations." },
      { score: 4, label: "Strong Pass", description: "Strong leadership. Influences without authority. Rallies cross-functional teams. Navigates complex organizational dynamics effectively." },
      { score: 5, label: "Exceptional", description: "Exceptional leadership. Naturally becomes point person. Influences executives and peers across functions. Builds coalitions effortlessly." },
    ],
    followUpTriggers: [
      "How did you get others on board with your idea?",
      "What resistance did you face, and how did you overcome it?",
      "How did you influence stakeholders who didn't report to you?",
      "What would have happened if you hadn't taken the lead?",
      "How did you handle disagreement within the team?",
    ],
    feedbackTemplates: {
      low: "Your story didn't demonstrate leadership or influence. Top tech companies look for people who drive outcomes regardless of title. Find examples where you rallied others or influenced without authority.",
      mid: "You showed some leadership but could demonstrate more influence. Focus on stories where you convinced skeptics, built coalitions, or led through complexity.",
      high: "Excellent demonstration of leadership. You showed ability to influence without authority and navigate organizational complexity. Your approach to building alignment was impressive.",
    },
  },
  {
    name: "Problem-Solving & Decision-Making",
    weight: 0.10,
    description: "Approaches problems systematically. Makes sound decisions under uncertainty. Considers alternatives and trade-offs.",
    levels: [
      { score: 1, label: "Strong Fail", description: "No problem-solving demonstrated. Waited for solutions from others. Could not articulate decision-making process." },
      { score: 2, label: "Fail", description: "Basic problem-solving. Ad-hoc approach. Did not consider alternatives. Cannot explain reasoning behind decisions." },
      { score: 3, label: "Pass", description: "Adequate problem-solving. Systematic approach. Considered alternatives. Can explain trade-offs in decisions." },
      { score: 4, label: "Strong Pass", description: "Strong problem-solving. Data-driven approach. Thoroughly evaluated options. Made decisions under uncertainty with clear reasoning." },
      { score: 5, label: "Exceptional", description: "Exceptional problem-solving. Innovative approaches. Anticipated second-order effects. Decisions became templates for organization." },
    ],
    followUpTriggers: [
      "What other options did you consider?",
      "How did you decide between those alternatives?",
      "What data did you use to make that decision?",
      "What would you have done if your first approach failed?",
      "What was the biggest uncertainty, and how did you handle it?",
    ],
    feedbackTemplates: {
      low: "Your story lacked a clear problem-solving approach. Top tech companies want systematic thinkers. Practice articulating: What was the problem? What options did you consider? Why did you choose your approach?",
      mid: "You showed problem-solving but could go deeper on your reasoning. Explain the trade-offs you considered and why you rejected alternatives.",
      high: "Excellent problem-solving demonstration. Your systematic approach and clear reasoning showed strong decision-making skills. The way you handled uncertainty was particularly impressive.",
    },
  },
  {
    name: "Growth Mindset & Self-Awareness",
    weight: 0.10,
    description: "Demonstrates continuous improvement. Honest self-assessment. Learns from failures. Shows vulnerability.",
    levels: [
      { score: 1, label: "Strong Fail", description: "No self-awareness. Blames others for failures. Cannot identify weaknesses. Defensive when questioned." },
      { score: 2, label: "Fail", description: "Limited self-awareness. Generic lessons learned. Avoids discussing failures. Superficial reflection." },
      { score: 3, label: "Pass", description: "Adequate self-awareness. Discusses failures honestly. Identifies specific lessons. Shows growth over time." },
      { score: 4, label: "Strong Pass", description: "Strong self-awareness. Proactively discusses mistakes and learnings. Demonstrates clear growth. Applies lessons to new situations." },
      { score: 5, label: "Exceptional", description: "Exceptional self-awareness. Deep, honest reflection on failures. Transformed failures into significant growth. Helps others learn from their experience." },
    ],
    followUpTriggers: [
      "What's the biggest mistake you made in this project?",
      "What would you do differently if you could do it again?",
      "What feedback have you received that was hard to hear but valuable?",
      "How have you changed your approach based on past failures?",
      "Tell me about a time you were wrong about something important.",
    ],
    feedbackTemplates: {
      low: "You struggled to discuss failures or learnings authentically. Top tech companies look for self-awareness. Prepare 2-3 genuine failure stories where you made a real mistake, took responsibility, learned, and applied that learning.",
      mid: "You showed some self-awareness but your reflection was surface-level. Go deeper: What specifically did you learn? How did it change your approach? Give an example of applying that lesson later.",
      high: "Excellent self-awareness and growth mindset. Your honest reflection on failures and the specific way you applied learnings demonstrated maturity and continuous improvement.",
    },
  },
  {
    name: "Communication Clarity & Conciseness",
    weight: 0.10,
    description: "Clear, concise verbal communication. Respects interviewer's time. Appropriate detail. Engages the listener.",
    levels: [
      { score: 1, label: "Strong Fail", description: "Very poor communication. Incoherent or extremely long-winded. Cannot stay on topic. Difficult to understand." },
      { score: 2, label: "Fail", description: "Weak communication. Rambles or provides insufficient detail. Frequently off-topic. Unclear explanations." },
      { score: 3, label: "Pass", description: "Adequate communication. Generally clear and on-topic. Appropriate length. Answers the question asked." },
      { score: 4, label: "Strong Pass", description: "Strong communication. Crisp, clear responses. Good balance of detail and brevity. Engages the interviewer effectively." },
      { score: 5, label: "Exceptional", description: "Exceptional communication. Articulate and compelling. Perfect calibration of detail. Executive-level presentation skills." },
    ],
    followUpTriggers: [
      "Can you summarize that in 30 seconds?",
      "What's the key takeaway you want me to remember?",
      "Can you get to the main point?",
      "Can you explain that more simply?",
    ],
    feedbackTemplates: {
      low: "Your communication needs significant work. Answers were too long/unclear/off-topic. Practice the 2-3 minute rule. Record yourself, listen back, cut anything that doesn't support your main point.",
      mid: "Your communication was adequate but could be sharper. Practice summarizing stories in 30-second, 1-minute, and 2-minute versions to improve calibration.",
      high: "Excellent communication throughout. Your answers were crisp and well-calibrated. You showed strong executive communication skills.",
    },
  },
];

/**
 * Red flags that trigger automatic score caps or failure
 */
export const BEHAVIORAL_RED_FLAGS = [
  { pattern: "blames others without taking responsibility", effect: "Ownership capped at 2.0" },
  { pattern: "speaks only in generalities, no specific examples", effect: "All dimensions capped at 2.5" },
  { pattern: "badmouths previous employer/manager/colleagues", effect: "Leadership capped at 2.0, culture fit flag" },
  { pattern: "claims no weaknesses or failures", effect: "Growth Mindset capped at 2.0" },
  { pattern: "only uses 'we', cannot explain own contribution", effect: "Ownership capped at 2.5" },
  { pattern: "answers exceed 5 minutes without substance", effect: "Communication capped at 2.5" },
  { pattern: "fabricates or exaggerates metrics (inconsistency)", effect: "AUTOMATIC FAIL - integrity" },
  { pattern: "dismissive of interviewer questions", effect: "AUTOMATIC FAIL - culture fit" },
  { pattern: "takes credit for others' work when probed", effect: "AUTOMATIC FAIL - integrity" },
];

/**
 * Amazon Leadership Principles mapping for LP-focused interviews
 */
export const LEADERSHIP_PRINCIPLES = {
  customerObsession: "Started with customer, worked backwards. Earned trust. Prioritized customer over short-term metrics.",
  ownership: "Acted on behalf of entire company. Never said 'that's not my job'. Thought long-term.",
  inventAndSimplify: "Innovated, invented, found ways to simplify. Looked externally for new ideas.",
  areRightALot: "Strong judgment and good instincts. Sought diverse perspectives. Disconfirmed beliefs.",
  learnAndBeCurious: "Never stopped learning. Curious about new possibilities. Explored them.",
  hireAndDevelopBest: "Raised the bar. Recognized talent. Developed leaders.",
  insistOnHighestStandards: "Relentlessly high standards. Drove quality. Ensured defects didn't get sent down.",
  thinkBig: "Created bold direction that inspired. Thought differently to serve customers.",
  biasForAction: "Speed matters. Took calculated risks. Valued action over analysis paralysis.",
  frugality: "Accomplished more with less. Constraints bred resourcefulness.",
  earnTrust: "Listened attentively, spoke candidly. Benchmarked against the best.",
  diveDeep: "Stayed connected to details. Audited frequently. Skeptical when metrics differed from anecdotes.",
  haveBackbone: "Respectfully challenged decisions. Didn't compromise for social cohesion. Committed fully once decided.",
  deliverResults: "Focused on key inputs. Delivered with quality and timeliness. Rose to the occasion.",
};

export type BehavioralEvaluationResult = {
  overallScore: number; // 1-5 scale
  verdict: "Strong Pass" | "Pass" | "Borderline" | "Fail" | "Strong Fail";
  breakdown: {
    [criterionName: string]: {
      score: number;
      weight: number;
      feedback: string;
    };
  };
  strengths: string[];
  improvements: string[];
  redFlagsIdentified: string[];
  leadershipPrinciplesShown: string[];
  suggestedFollowUp: string;
  overallFeedback: string; // Changed from 'summary' for consistency with other rubrics
  storyBankRecommendations?: string;
};

function getVerdict(score: number, hasRedFlag: boolean): BehavioralEvaluationResult["verdict"] {
  if (hasRedFlag) return "Fail";
  if (score >= 4.5) return "Strong Pass";
  if (score >= 3.5) return "Pass";
  if (score >= 2.5) return "Borderline";
  if (score >= 1.5) return "Fail";
  return "Strong Fail";
}

/**
 * Builds the top tech-level evaluation prompt for behavioral interviews
 */
export function buildBehavioralEvaluationPrompt(
  question: string,
  transcript: string,
  tags: string[] = [],
  difficulty?: string
): string {
  const rubricText = BEHAVIORAL_RUBRIC.map((criterion) => {
    const levelsText = criterion.levels
      .map((l) => `    ${l.score}: ${l.label} - ${l.description}`)
      .join("\n");
    return `**${criterion.name}** (${criterion.weight * 100}% weight)\n${criterion.description}\n${levelsText}`;
  }).join("\n\n");

  const redFlagsText = BEHAVIORAL_RED_FLAGS.map(f => `- ${f.pattern} → ${f.effect}`).join("\n");

  return `You are a top tech behavioral interviewer (Google/Meta/Amazon/OpenAI level) evaluating a candidate.

## INTERVIEW QUESTION
${question}
${tags.length > 0 ? `\nTags: ${tags.join(", ")}` : ""}
${difficulty ? `\nDifficulty: ${difficulty}` : ""}

## CANDIDATE'S RESPONSE (transcribed from audio)
${transcript}

## EVALUATION RUBRIC (Score 1-5, half-points allowed)
${rubricText}

## RED FLAGS (apply score caps if detected)
${redFlagsText}

## PASS/FAIL THRESHOLDS
- 4.5+: Strong Pass (exceptional, ready for top tech)
- 3.5-4.4: Pass (strong, minor polish needed)
- 2.5-3.4: Borderline (significant preparation needed)
- 1.5-2.4: Fail (major gaps to address)
- <1.5: Strong Fail (fundamental issues)
- ANY dimension below 3.0 = automatic Fail

## INSTRUCTIONS
Be strict. A 3.0 is "meets expectations", not good. A 5.0 should be rare - reserved for stories that would impress a VP at Google, OpenAI, or similar.
Cite specific quotes from the transcript. Make feedback actionable.

Return a JSON object with this exact structure:
{
  "overallScore": <number 1-5>,
  "verdict": "<Strong Pass | Pass | Borderline | Fail | Strong Fail>",
  "breakdown": {
    "STAR Structure & Story Clarity": { "score": <1-5>, "weight": 0.15, "feedback": "<specific feedback with quotes>" },
    "Ownership & Personal Agency": { "score": <1-5>, "weight": 0.20, "feedback": "<specific feedback>" },
    "Impact & Quantified Results": { "score": <1-5>, "weight": 0.20, "feedback": "<specific feedback>" },
    "Leadership & Influence": { "score": <1-5>, "weight": 0.15, "feedback": "<specific feedback>" },
    "Problem-Solving & Decision-Making": { "score": <1-5>, "weight": 0.10, "feedback": "<specific feedback>" },
    "Growth Mindset & Self-Awareness": { "score": <1-5>, "weight": 0.10, "feedback": "<specific feedback>" },
    "Communication Clarity & Conciseness": { "score": <1-5>, "weight": 0.10, "feedback": "<specific feedback>" }
  },
  "strengths": ["<strength 1 with specific quote>", "<strength 2>"],
  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>", "<improvement 3>"],
  "redFlagsIdentified": ["<red flag if any, or empty array>"],
  "leadershipPrinciplesShown": ["<LP name>", "<LP name>"],
  "suggestedFollowUp": "<follow-up question to probe weakness>",
  "overallFeedback": "<2-3 sentence overall assessment>",
  "storyBankRecommendations": "<suggest what stories to develop>"
}`;
}

/**
 * Builds follow-up question prompt using top tech interview triggers
 */
export function buildBehavioralFollowUpPrompt(
  originalQuestion: string,
  conversationHistory: { role: "interviewer" | "candidate"; content: string }[],
  evaluation?: BehavioralEvaluationResult
): string {
  const historyText = conversationHistory
    .map((turn) => `${turn.role === "interviewer" ? "Interviewer" : "Candidate"}: ${turn.content}`)
    .join("\n\n");

  // Find weakest dimension for targeted follow-up
  let weakestDimension = "";
  let lowestScore = 6;
  if (evaluation?.breakdown) {
    for (const [name, data] of Object.entries(evaluation.breakdown)) {
      if (data.score < lowestScore) {
        lowestScore = data.score;
        weakestDimension = name;
      }
    }
  }

  const dimensionTriggers = BEHAVIORAL_RUBRIC.find(c => c.name === weakestDimension)?.followUpTriggers || [];
  const triggerSuggestions = dimensionTriggers.length > 0 
    ? `\nSuggested triggers for ${weakestDimension}:\n${dimensionTriggers.map(t => `- ${t}`).join("\n")}`
    : "";

  return `You are a top tech behavioral interviewer conducting a follow-up.

## ORIGINAL QUESTION
${originalQuestion}

## CONVERSATION SO FAR
${historyText}

${evaluation ? `## EVALUATION NOTES
- Overall: ${evaluation.overallScore}/5 (${evaluation.verdict})
- Weakest area: ${weakestDimension} (${lowestScore}/5)
- Strengths: ${evaluation.strengths.join(", ")}
- Areas to probe: ${evaluation.improvements.join(", ")}
${evaluation.redFlagsIdentified.length > 0 ? `- Red flags: ${evaluation.redFlagsIdentified.join(", ")}` : ""}
${triggerSuggestions}` : ""}

## FOLLOW-UP TRIGGERS TO USE
- Candidate uses 'we' without clarifying role → "What was YOUR specific contribution?"
- Vague impact statement → "Can you quantify that result?"
- Missing failure/learning → "What would you do differently?"
- Unclear decision-making → "What other options did you consider?"
- No mention of obstacles → "What was the biggest challenge?"
- Story seems too smooth → "What pushback did you receive?"

## YOUR TASK
Generate ONE natural follow-up question that:
1. Probes the weakest dimension (${weakestDimension || "any area needing depth"})
2. Asks for more specific details or metrics
3. Explores decision-making or alternative approaches
4. Tests authenticity if story seems rehearsed
5. Maintains conversational, supportive tone

Return ONLY the follow-up question text, nothing else.`;
}

/**
 * Validates the behavioral evaluation response structure
 */
export function validateBehavioralEvaluation(evaluation: unknown): evaluation is BehavioralEvaluationResult {
  if (!evaluation || typeof evaluation !== "object") return false;
  
  const e = evaluation as BehavioralEvaluationResult;
  
  // Check required fields
  if (
    typeof e.overallScore !== "number" ||
    e.overallScore < 1 || e.overallScore > 5 ||
    typeof e.verdict !== "string" ||
    typeof e.breakdown !== "object" ||
    !Array.isArray(e.strengths) ||
    !Array.isArray(e.improvements) ||
    typeof e.overallFeedback !== "string"
  ) {
    return false;
  }

  // Verify verdict is valid
  const validVerdicts = ["Strong Pass", "Pass", "Borderline", "Fail", "Strong Fail"];
  if (!validVerdicts.includes(e.verdict)) {
    return false;
  }

  return true;
}
