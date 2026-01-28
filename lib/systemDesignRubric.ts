/**
 * Top Tech-Level System Design Interview Evaluation Rubric
 * 
 * Based on technical assessment standards used at Google, Meta, Amazon, Apple, Microsoft,
 * OpenAI, Anthropic, and other top tech companies for senior/staff engineer system design interviews.
 * 
 * Scoring: 1-5 scale (half-points allowed for borderline cases)
 * - 5.0: Exceptional (senior staff/principal level design, rare)
 * - 4.0-4.5: Strong Pass (senior engineer level, hire)
 * - 3.0-3.5: Pass (meets bar for level, hire)
 * - 2.5: Borderline (significant gaps, lean no)
 * - 1.0-2.0: Fail (fundamental gaps in design thinking)
 * 
 * Critical Rules:
 * - Cannot gather requirements = capped at 2.5
 * - No high-level design / architecture = capped at 2.0
 * - Cannot scale beyond single server = capped at 2.5 for senior roles
 */

export type SystemDesignCriterion = {
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

export const SYSTEM_DESIGN_CRITERIA: SystemDesignCriterion[] = [
  {
    name: "Requirements Gathering & Scope",
    weight: 0.15,
    description: "Asks clarifying questions. Defines functional and non-functional requirements. Scopes appropriately.",
    levels: [
      { score: 1, label: "Strong Fail", description: "Jumps straight to design. No clarifying questions. Doesn't understand the problem." },
      { score: 2, label: "Fail", description: "Minimal questions. Misses key requirements. Scope too narrow or too broad." },
      { score: 3, label: "Pass", description: "Asks relevant questions. Identifies core features. Reasonable scope for timeframe." },
      { score: 4, label: "Strong Pass", description: "Thorough requirements. Functional + non-functional (latency, scale). Prioritizes features. Clear scope." },
      { score: 5, label: "Exceptional", description: "Expert scoping. Identifies hidden requirements. Considers edge cases upfront. Perfect use of time." },
    ],
    followUpTriggers: [
      "What are the most important requirements we should focus on?",
      "What scale are we designing for?",
      "What are the latency requirements?",
      "What consistency guarantees do we need?",
      "Who are the users and how will they interact?",
      "What features are out of scope for this discussion?",
    ],
  },
  {
    name: "High-Level Architecture",
    weight: 0.20,
    description: "Presents clear system architecture. Identifies major components. Explains data flow.",
    levels: [
      { score: 1, label: "Strong Fail", description: "No coherent architecture. Cannot draw basic system diagram. Missing fundamental components." },
      { score: 2, label: "Fail", description: "Incomplete architecture. Major components missing. Data flow unclear. Single-server mindset." },
      { score: 3, label: "Pass", description: "Reasonable architecture. Core components present (API, DB, cache). Basic data flow explained." },
      { score: 4, label: "Strong Pass", description: "Well-thought architecture. All major components. Clear separation of concerns. Sensible tech choices." },
      { score: 5, label: "Exceptional", description: "Elegant architecture. Industry-standard patterns. Explains why each component exists. Considers alternatives." },
    ],
    followUpTriggers: [
      "Can you draw the high-level architecture?",
      "Walk me through a typical request flow.",
      "Why did you choose this component?",
      "What alternatives did you consider?",
      "How do these services communicate?",
      "Where does the data live?",
    ],
  },
  {
    name: "Scalability & Performance",
    weight: 0.20,
    description: "Designs for scale. Addresses bottlenecks. Uses caching, sharding, replication appropriately.",
    levels: [
      { score: 1, label: "Strong Fail", description: "No scalability consideration. Single-server design. Cannot identify bottlenecks." },
      { score: 2, label: "Fail", description: "Mentions scaling but no concrete strategy. Doesn't understand horizontal vs vertical scaling." },
      { score: 3, label: "Pass", description: "Basic scaling strategies. Identifies main bottlenecks. Uses caching and load balancing." },
      { score: 4, label: "Strong Pass", description: "Strong scaling design. Database sharding. CDN. Read replicas. Async processing. Capacity estimates." },
      { score: 5, label: "Exceptional", description: "Expert-level scaling. Global distribution. Multi-region. Detailed capacity planning. Performance optimization." },
    ],
    followUpTriggers: [
      "How would you scale this to 100x traffic?",
      "What's the bottleneck in this design?",
      "How would you handle a traffic spike?",
      "What's your caching strategy?",
      "How would you shard the database?",
      "What's the expected latency?",
    ],
  },
  {
    name: "Data Model & Storage",
    weight: 0.15,
    description: "Appropriate database choices. Sensible schema design. Understands SQL vs NoSQL trade-offs.",
    levels: [
      { score: 1, label: "Strong Fail", description: "No data model. Wrong database choice with no understanding. Cannot design basic schema." },
      { score: 2, label: "Fail", description: "Basic data model but missing key entities. Doesn't justify database choice." },
      { score: 3, label: "Pass", description: "Reasonable data model. Appropriate database selection. Basic understanding of trade-offs." },
      { score: 4, label: "Strong Pass", description: "Well-designed schema. Correct database for use case. Understands SQL/NoSQL trade-offs. Indexing strategy." },
      { score: 5, label: "Exceptional", description: "Expert data modeling. Multi-database approach where needed. Partitioning strategy. Data lifecycle management." },
    ],
    followUpTriggers: [
      "Why did you choose SQL/NoSQL?",
      "What's your database schema?",
      "How would you query this data?",
      "What indexes would you create?",
      "How would you handle data growth?",
      "What's the consistency model?",
    ],
  },
  {
    name: "Trade-off Analysis",
    weight: 0.15,
    description: "Discusses trade-offs explicitly. Understands CAP theorem. Justifies decisions.",
    levels: [
      { score: 1, label: "Strong Fail", description: "No awareness of trade-offs. Claims solution has no downsides. Cannot discuss CAP." },
      { score: 2, label: "Fail", description: "Minimal trade-off awareness. Vague about downsides. Doesn't justify choices." },
      { score: 3, label: "Pass", description: "Identifies main trade-offs. Basic CAP understanding. Justifies major decisions." },
      { score: 4, label: "Strong Pass", description: "Thorough trade-off analysis. Consistency vs availability. Latency vs throughput. Clear reasoning." },
      { score: 5, label: "Exceptional", description: "Expert trade-off discussion. Nuanced CAP analysis. Discusses real-world implications. Industry examples." },
    ],
    followUpTriggers: [
      "What's the main trade-off in your design?",
      "How does CAP theorem apply here?",
      "What would you sacrifice for lower latency?",
      "What are the downsides of this approach?",
      "How would you handle network partitions?",
      "What's the consistency vs availability balance?",
    ],
  },
  {
    name: "Reliability & Fault Tolerance",
    weight: 0.10,
    description: "Designs for failure. Redundancy. Graceful degradation. Monitoring and alerting.",
    levels: [
      { score: 1, label: "Strong Fail", description: "No failure consideration. Single points of failure everywhere. No redundancy." },
      { score: 2, label: "Fail", description: "Acknowledges failures but no concrete solutions. SPOFs remain." },
      { score: 3, label: "Pass", description: "Basic fault tolerance. Redundant databases. Load balancer failover. Some monitoring." },
      { score: 4, label: "Strong Pass", description: "Strong fault tolerance. Circuit breakers. Retry logic. Graceful degradation. Comprehensive monitoring." },
      { score: 5, label: "Exceptional", description: "Expert reliability design. Chaos engineering mindset. Multi-region failover. SLA-driven design." },
    ],
    followUpTriggers: [
      "What happens if this service goes down?",
      "Where are the single points of failure?",
      "How would you detect failures?",
      "What's your disaster recovery plan?",
      "How do you ensure data durability?",
      "What's the expected uptime/SLA?",
    ],
  },
  {
    name: "Communication & Clarity",
    weight: 0.05,
    description: "Explains design clearly. Draws helpful diagrams. Engages with interviewer. Uses time well.",
    levels: [
      { score: 1, label: "Strong Fail", description: "Cannot explain design. No diagrams. Disorganized. Wastes time on irrelevant details." },
      { score: 2, label: "Fail", description: "Explanation unclear. Messy diagrams. Doesn't engage. Poor time management." },
      { score: 3, label: "Pass", description: "Clear explanation. Basic diagrams. Responds to feedback. Reasonable pacing." },
      { score: 4, label: "Strong Pass", description: "Very clear communication. Clean diagrams. Collaborative. Excellent time management." },
      { score: 5, label: "Exceptional", description: "Exceptional clarity. Teaches while designing. Whiteboard mastery. Perfect pacing." },
    ],
    followUpTriggers: [
      "Can you summarize your design in 30 seconds?",
      "Draw a diagram of the architecture.",
      "Walk me through the data flow.",
      "What's the most important part of this design?",
    ],
  },
];

/**
 * Red flags for system design interviews
 */
export const SYSTEM_DESIGN_RED_FLAGS = [
  { pattern: "no clarifying questions, jumps to design", effect: "Requirements capped at 2.5" },
  { pattern: "single-server design for large-scale problem", effect: "Scalability capped at 2.0" },
  { pattern: "cannot draw basic architecture diagram", effect: "Architecture capped at 2.0" },
  { pattern: "wrong database choice with no understanding", effect: "Data Model capped at 2.5" },
  { pattern: "claims design has no downsides", effect: "Trade-offs capped at 2.0" },
  { pattern: "no consideration of failure scenarios", effect: "Reliability capped at 2.5" },
  { pattern: "cannot explain own design when asked", effect: "Communication capped at 2.0" },
];

/**
 * Common system design patterns to recognize
 */
export const SYSTEM_DESIGN_PATTERNS = {
  caching: ["Redis", "Memcached", "CDN", "browser cache", "write-through", "write-back", "cache invalidation"],
  loadBalancing: ["round-robin", "least connections", "consistent hashing", "L4 vs L7", "health checks"],
  databases: ["SQL", "NoSQL", "document store", "key-value", "graph", "time-series", "sharding", "replication"],
  messaging: ["Kafka", "RabbitMQ", "SQS", "pub/sub", "event-driven", "async processing"],
  consistency: ["strong consistency", "eventual consistency", "CAP theorem", "ACID", "BASE", "quorum"],
  reliability: ["circuit breaker", "retry", "timeout", "bulkhead", "failover", "redundancy"],
};

export type SystemDesignEvaluationResult = {
  overallScore: number; // 1-5 scale
  verdict: "Strong Pass" | "Pass" | "Borderline" | "Fail" | "Strong Fail";
  breakdown: {
    requirements: number;
    architecture: number;
    scalability: number;
    dataModel: number;
    tradeoffs: number;
    reliability: number;
    communication: number;
  };
  designHighlights: {
    keyComponents: string[];
    scalingStrategy: string;
    dataStorage: string;
    mainTradeoff: string;
  };
  strengths: string[];
  improvements: string[];
  redFlagsIdentified: string[];
  missedConsiderations: string[];
  overallFeedback: string;
  suggestedDeepDive: string;
};

/**
 * Builds the top tech-level evaluation prompt for system design interviews
 */
export function buildSystemDesignEvaluationPrompt(
  question: string,
  transcript: string,
  diagramDescription?: string,
  targetLevel?: string
): string {
  const rubricText = SYSTEM_DESIGN_CRITERIA.map((criterion) => {
    const levelsText = criterion.levels
      .map((l) => `    ${l.score}: ${l.label} - ${l.description}`)
      .join("\n");
    return `**${criterion.name}** (${criterion.weight * 100}% weight)\n${criterion.description}\n${levelsText}`;
  }).join("\n\n");

  const redFlagsText = SYSTEM_DESIGN_RED_FLAGS.map(f => `- ${f.pattern} → ${f.effect}`).join("\n");

  return `You are a top tech system design interviewer (Google/Meta/Amazon/OpenAI staff+ level) evaluating a candidate.

## DESIGN PROBLEM
${question}
${targetLevel ? `\nTarget Level: ${targetLevel}` : ""}

## CANDIDATE'S DESIGN (transcribed from verbal explanation)
${transcript}
${diagramDescription ? `\n## DIAGRAM DESCRIPTION\n${diagramDescription}` : ""}

## EVALUATION RUBRIC (Score 1-5, half-points allowed)
${rubricText}

## RED FLAGS (apply score caps if detected)
${redFlagsText}

## PASS/FAIL THRESHOLDS
- 4.5+: Strong Pass (staff+ level design, exceptional)
- 3.5-4.4: Pass (senior level, hire)
- 2.5-3.4: Borderline (gaps for level, lean no)
- 1.5-2.4: Fail (significant gaps)
- <1.5: Strong Fail (fundamental issues)

## INSTRUCTIONS
Be calibrated for the target level. A 3.0 is "meets bar" not impressive.
Check for real understanding vs buzzword dropping.
Verify trade-off awareness and scalability thinking.

Return JSON:
{
  "overallScore": <number 1-5>,
  "verdict": "<Strong Pass | Pass | Borderline | Fail | Strong Fail>",
  "breakdown": {
    "requirements": <1-5>,
    "architecture": <1-5>,
    "scalability": <1-5>,
    "dataModel": <1-5>,
    "tradeoffs": <1-5>,
    "reliability": <1-5>,
    "communication": <1-5>
  },
  "designHighlights": {
    "keyComponents": ["<component 1>", "<component 2>"],
    "scalingStrategy": "<how they plan to scale>",
    "dataStorage": "<database choices>",
    "mainTradeoff": "<primary trade-off acknowledged>"
  },
  "strengths": ["<specific strength>", "<strength 2>"],
  "improvements": ["<what they missed>", "<improvement 2>", "<improvement 3>"],
  "redFlagsIdentified": ["<red flag if any>"],
  "missedConsiderations": ["<topic they should have addressed>"],
  "overallFeedback": "<2-3 sentence summary>",
  "suggestedDeepDive": "<area to probe further>"
}`;
}

/**
 * Builds follow-up question prompt for system design
 */
export function buildSystemDesignFollowUpPrompt(
  question: string,
  conversationHistory: { role: "interviewer" | "candidate"; content: string }[],
  evaluation?: SystemDesignEvaluationResult
): string {
  const historyText = conversationHistory
    .map(turn => `${turn.role === "interviewer" ? "Interviewer" : "Candidate"}: ${turn.content}`)
    .join("\n");

  // Find weakest area
  let weakestArea = "";
  let lowestScore = 6;
  if (evaluation?.breakdown) {
    const breakdown = evaluation.breakdown;
    const areas = Object.entries(breakdown) as [string, number][];
    for (const [name, score] of areas) {
      if (score < lowestScore) {
        lowestScore = score;
        weakestArea = name;
      }
    }
  }

  const criterion = SYSTEM_DESIGN_CRITERIA.find(c => 
    c.name.toLowerCase().includes(weakestArea.replace(/([A-Z])/g, ' $1').toLowerCase().trim())
  );
  const triggerSuggestions = criterion?.followUpTriggers || [];

  return `You are a top tech system design interviewer conducting follow-up discussion.

## ORIGINAL PROBLEM
${question}

## CONVERSATION SO FAR
${historyText}

${evaluation ? `## EVALUATION NOTES
- Score: ${evaluation.overallScore}/5 (${evaluation.verdict})
- Weakest area: ${weakestArea} (${lowestScore}/5)
- Missing: ${evaluation.missedConsiderations.join(", ")}
- Improvements: ${evaluation.improvements.join(", ")}` : ""}

## FOLLOW-UP TRIGGERS FOR ${weakestArea.toUpperCase()}
${triggerSuggestions.map(t => `- ${t}`).join("\n")}

## YOUR TASK
Generate ONE follow-up question that:
1. Probes the weakest area or a missed consideration
2. Tests depth of understanding (not just buzzwords)
3. Pushes toward more concrete details
4. Do NOT repeat questions already asked
5. Keep it conversational (1-2 sentences)

Return ONLY the follow-up question text, nothing else.`;
}

/**
 * Validates system design evaluation response
 */
export function validateSystemDesignEvaluation(result: unknown): result is SystemDesignEvaluationResult {
  if (!result || typeof result !== "object") return false;

  const r = result as Record<string, unknown>;

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

  const validVerdicts = ["Strong Pass", "Pass", "Borderline", "Fail", "Strong Fail"];
  if (!validVerdicts.includes(r.verdict as string)) return false;

  if (!r.breakdown || typeof r.breakdown !== "object") return false;
  const breakdown = r.breakdown as Record<string, unknown>;
  const requiredFields = ["requirements", "architecture", "scalability", "dataModel", "tradeoffs", "reliability", "communication"];
  for (const field of requiredFields) {
    if (typeof breakdown[field] !== "number") return false;
  }

  return true;
}
