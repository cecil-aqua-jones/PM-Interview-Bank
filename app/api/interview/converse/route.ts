import { NextRequest, NextResponse } from "next/server";
import { sanitizeForLLM, validateLength } from "@/lib/security";
import { 
  generateTTS, 
  isCartesiaConfigured, 
  CARTESIA_VOICES,
  getEmotionForState,
} from "@/lib/cartesia";
import { preprocessStandard } from "@/lib/ttsPreprocessor";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type ConversationMessage = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp?: number;
};

/**
 * Unified conversational API endpoint for the interview agent.
 * Handles all conversational interactions with full context awareness.
 * 
 * Uses:
 * - OpenAI GPT for conversation generation (kept for reasoning)
 * - Cartesia Sonic-3 for TTS (faster, lower latency)
 * 
 * Context includes:
 * - The original coding question/problem
 * - Current code (if any)
 * - Full conversation history
 * - Current evaluation (if submitted)
 */
export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "LLM service temporarily unavailable" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    let {
      question,           // DEPRECATED: Combined question (for backwards compat)
      questionTitle,      // The question title (e.g., "Answer Caching Strategy")
      questionContent,    // The detailed problem description/instructions
      userMessage,        // The latest user message/question
      conversationHistory = [],
      code = "",          // Current code in the editor
      language = "python",
      evaluation = null,  // Evaluation result if code has been submitted
      interviewState = "coding" // coding | review | followup | feedback
    } = body;

    // Support both new format (title + content) and old format (combined question)
    if (!questionTitle && !question) {
      return NextResponse.json(
        { error: "Question context is required" },
        { status: 400 }
      );
    }
    
    // If using old format, try to extract title from first line
    if (!questionTitle && question) {
      const lines = question.split("\n");
      questionTitle = lines[0] || "Coding Problem";
      questionContent = lines.slice(1).join("\n").trim() || question;
    }

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "User message is required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    questionTitle = sanitizeForLLM(questionTitle || "");
    questionContent = sanitizeForLLM(questionContent || "");
    userMessage = sanitizeForLLM(userMessage);
    code = code ? sanitizeForLLM(code) : "";
    language = typeof language === "string" ? sanitizeForLLM(language) : "python";

    // Validate lengths
    const titleValidation = validateLength(questionTitle, 2, 500);
    if (!titleValidation.valid) {
      return NextResponse.json({ error: titleValidation.error }, { status: 400 });
    }
    
    const contentValidation = validateLength(questionContent, 5, 5000);
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    const messageValidation = validateLength(userMessage, 2, 2000);
    if (!messageValidation.valid) {
      return NextResponse.json({ error: messageValidation.error }, { status: 400 });
    }

    // Sanitize conversation history (keep last 15 turns for context)
    const sanitizedHistory: ConversationMessage[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const turn of conversationHistory.slice(-15)) {
        if (
          turn &&
          typeof turn === "object" &&
          (turn.role === "interviewer" || turn.role === "candidate") &&
          typeof turn.content === "string"
        ) {
          sanitizedHistory.push({
            role: turn.role,
            content: sanitizeForLLM(turn.content).slice(0, 2000)
          });
        }
      }
    }

    // Build context for the LLM
    const codeContext = code.trim()
      ? `\n\nCandidate's current code (${language}):\n\`\`\`${language}\n${code.slice(0, 8000)}\n\`\`\``
      : "\n\n(No code written yet)";

    const evaluationContext = evaluation
      ? `\n\nCode evaluation results:\n- Overall Score: ${evaluation.overallScore}/5\n- Feedback: ${evaluation.overallFeedback || "N/A"}\n- Time Complexity: ${evaluation.complexityAnalysis?.time || "N/A"}\n- Space Complexity: ${evaluation.complexityAnalysis?.space || "N/A"}`
      : "";

    // Build conversation history for the LLM
    const conversationContext = sanitizedHistory.length > 0
      ? "\n\nConversation so far:\n" + sanitizedHistory.map(m =>
          `${m.role === "interviewer" ? "You (Interviewer)" : "Candidate"}: ${m.content}`
        ).join("\n")
      : "";

    // Determine the system prompt based on interview state
    const systemPrompt = buildSystemPrompt(interviewState, !!evaluation);

    // Build the user prompt with full context
    const fullContext = `INTERVIEW PROBLEM:
Title/Topic: "${questionTitle}"
Problem Instructions: ${questionContent}
${codeContext}
${evaluationContext}
${conversationContext}

The candidate just said: "${userMessage}"

Respond naturally as the interviewer. Remember: the "Title" is just the topic name (like "Answer Caching Strategy"), and the "Problem Instructions" contain the actual requirements they need to implement.`;

    // Call GPT for conversational response (kept for reasoning)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: fullContext }
        ],
        temperature: 0.8,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Converse] GPT Error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "Could you repeat that?";

    // Generate TTS using Cartesia Sonic-3 with emotive voice
    let audioBase64: string | null = null;
    if (isCartesiaConfigured()) {
      try {
        // Preprocess for natural pauses and get state-appropriate emotion
        const processedText = preprocessStandard(aiResponse);
        const emotion = getEmotionForState(interviewState);
        
        const audioBuffer = await generateTTS(processedText, CARTESIA_VOICES.DEFAULT, {
          generationConfig: {
            speed: 1.0,
            emotion,
          },
        });
        audioBase64 = Buffer.from(audioBuffer).toString("base64");
      } catch (ttsErr) {
        console.error("[Converse] Cartesia TTS Error:", ttsErr);
        // Continue without audio - text response still works
      }
    }

    return NextResponse.json({
      response: aiResponse,
      audio: audioBase64,
    });
  } catch (error) {
    console.error("[Converse] Error:", error);
    return NextResponse.json(
      { error: "Failed to process conversation" },
      { status: 500 }
    );
  }
}

/**
 * Build the system prompt based on the current interview state
 * Enhanced for natural, human-like speech output via TTS
 */
function buildSystemPrompt(state: string, hasEvaluation: boolean): string {
  const basePersonality = `### ROLE & OBJECTIVE
You are a senior, empathetic software engineer conducting a coding interview. Your goal is natural, fluid conversation that sounds human when spoken aloud.

### SPEECH NATURALNESS (Critical - Your output is spoken aloud)
Your responses will be converted to speech via TTS. They MUST sound natural:

- **Contractions always**: Use you're, it's, that's, wouldn't, couldn't, we're, don't, can't
- **Natural fillers**: Sprinkle in "so", "you know", "actually", "I mean", "basically" - sparingly
- **Varied openers**: NEVER start multiple responses the same way. Mix it up:
  - "Oh nice, that makes sense..."
  - "Mm-hm, yeah..."
  - "Right, so..."
  - "Gotcha, gotcha..."
  - "Ah, interesting..."
- **Backchanneling**: Brief verbal nods: "I see", "Mm-hm", "Right", "Okay", "Gotcha", "Makes sense"
- **Thinking cues**: "Let me see...", "Hmm...", "So basically..."
- **Warmth signals**: When they do well: "Oh nice!", "Good catch!", "Yeah exactly!"
- **Laughter for warmth**: Use [laughter] naturally: "Good catch! [laughter]" or "Ha, yeah exactly"
- **Sentence variety**: Mix short punchy ("Gotcha.") with longer flowing sentences

### CRITICAL CONVERSATION DYNAMICS

1. **Analyze Completeness:** Before responding, check if their thought is complete.
   - If incomplete, nudge: "Go on...", "And then?", "Mm-hm", "I'm listening..."

2. **Handling Clarifying Questions:**
   - If they ask a question, answer directly and concisely
   - NEVER ignore their question

3. **The Check-In Protocol:**
   - Short or ambiguous answer? Check in: "Anything else?" or "Take your time"

### STRICT RULES
- Keep responses to 1-2 sentences max (brief = more natural when spoken)
- NEVER ask more than one question at a time
- Sound like a helpful colleague, not an examiner
- If you cut them off: "Sorry, go ahead - I think I cut you off."
- If they say "let me think": "Take your time." and nothing else

### AVOID (sounds robotic when spoken)
- Starting with "Great question!" every time
- Formal language like "Indeed" or "Certainly"
- Long explanations or lectures`;

  const stateGuidance: Record<string, string> = {
    coding: `

### CURRENT STATE: Coding
They're working on their solution. Be supportive but brief.
- Clarifying questions → Answer helpfully, don't give away the algorithm
- Share approach → "Oh nice, yeah that makes sense" or "Mm-hm, I like that"
- Think out loud → Backchanneling ("Mm-hm", "Right") - don't interrupt
- Stuck → Gentle nudge: "What if you started by thinking about..."

Example natural responses:
- "Yeah, you can assume it's always non-empty."
- "Mm-hm, good instinct there."
- "Oh that's a good question - what do you think?"`,

    review: `

### CURRENT STATE: Review
You've reviewed their code. Be encouraging and brief - they can see the score.
- "Nice work on that!" or "You got the main idea"
- Don't re-read the entire evaluation`,

    followup: `

### CURRENT STATE: Follow-up Discussion
Technical discussion about their solution. Be curious.
- Ask ONE probing question at a time
- Let them finish before responding
- Curious tone: "Mm, what made you go with a hash map here?"
- If they trail off: "And...?" or "Go on"

Example: "Interesting - so what would happen if the input was really large?"`,

    feedback: `

### CURRENT STATE: Wrap-up
Interview ending. Be warm and brief.
- "Hey, thanks for working through that with me"
- One positive takeaway
- Keep it short - don't lecture`
  };

  const contextNote = hasEvaluation
    ? "\n\nContext: Their code has been evaluated. You have access to the results."
    : "\n\nContext: They haven't submitted code for evaluation yet.";

  return basePersonality + (stateGuidance[state] || stateGuidance.coding) + contextNote;
}
