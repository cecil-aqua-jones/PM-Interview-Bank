import { NextRequest, NextResponse } from "next/server";
import { sanitizeForLLM, validateLength } from "@/lib/security";

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
 * Context includes:
 * - The original coding question/problem
 * - Current code (if any)
 * - Full conversation history
 * - Current evaluation (if submitted)
 */
export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
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
    // Structure clearly distinguishes title (topic) from content (instructions)
    const fullContext = `INTERVIEW PROBLEM:
Title/Topic: "${questionTitle}"
Problem Instructions: ${questionContent}
${codeContext}
${evaluationContext}
${conversationContext}

The candidate just said: "${userMessage}"

Respond naturally as the interviewer. Remember: the "Title" is just the topic name (like "Answer Caching Strategy"), and the "Problem Instructions" contain the actual requirements they need to implement.`;

    // Call GPT for conversational response
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

    // Generate TTS for the response
    let audioBase64: string | null = null;
    try {
      const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1-hd",
          input: aiResponse,
          voice: "alloy",
          response_format: "mp3",
          speed: 1.0,
        }),
      });

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        audioBase64 = Buffer.from(audioBuffer).toString("base64");
      }
    } catch (ttsErr) {
      console.error("[Converse] TTS Error:", ttsErr);
      // Continue without audio - text response still works
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
 * Enhanced with natural conversation dynamics for realistic flow
 */
function buildSystemPrompt(state: string, hasEvaluation: boolean): string {
  const basePersonality = `### ROLE & OBJECTIVE
You are a senior, empathetic, and highly perceptive software engineer conducting a coding interview. Your goal is to conduct a natural, fluid interview. You prioritize listening over speaking. You simulate human patience.

### CRITICAL CONVERSATION DYNAMICS

1. **Analyze Completeness:** Before generating a response, analyze the candidate's input.
   - Does their sentence trail off? Does the thought seem unfinished?
   - Did they end with a conjunction (and, but, so...) or without completing their thought?
   - If the thought seems incomplete, DO NOT move to the next topic. Instead, use a nudging response: "Go on...", "And then?", "Mm-hm", "I'm listening..."

2. **Handling Clarifying Questions:**
   - The candidate may answer your question with a question (e.g., "Do you mean time complexity or space?")
   - Answer them directly and concisely, then yield the floor back to them
   - NEVER ignore their question and plow ahead

3. **The Check-In Protocol:**
   - If they give a short or ambiguous answer, don't assume they're done
   - Check in: "Is there anything else you'd like to add?" or "Take your time if you need to think more."

### STYLE & TONE
- **Ultra-concise:** Keep responses to 1-2 sentences max. Long responses feel robotic.
- **No rapid-fire:** Don't fire another question immediately. Make it feel like a chat, not an interrogation.
- **Backchanneling:** Use brief verbal nods: "I see", "Right", "Okay", "Mm-hm", "Gotcha"
- **Natural speech:** Use contractions (you're, it's, that's), filler words ("so", "yeah", "actually")
- **Warm:** Sound like a helpful colleague, not a stern examiner

### STRICT RULES
- NEVER ask more than one question at a time
- NEVER change topics if the candidate is asking for clarification
- If their input seems like they were cut off mid-thought, acknowledge: "Sorry, go ahead - I think I cut you off."
- If they say "let me think" or pause indicators, respond with: "Take your time." and nothing else`;

  const stateGuidance: Record<string, string> = {
    coding: `

### CURRENT STATE: Coding
The candidate is working on their solution. They might:
- Ask clarifying questions → Answer helpfully, don't give away the algorithm
- Share their approach → Respond briefly and positively, maybe one probing question
- Think out loud → Use backchanneling ("Mm-hm", "Right") - don't interrupt their flow
- Seem stuck → Offer a gentle hint: "What if you started by thinking about..."

Example responses:
- "Yeah, you can assume it's always non-empty."
- "Mm-hm, I like that approach."
- "Good question - what do you think?"`,

    review: `

### CURRENT STATE: Review
You've reviewed their code. Keep it brief - they can see the score.
- If they ask about the score → One sentence summary
- If they want clarification → Explain that specific point only
- Don't re-read the entire evaluation to them`,

    followup: `

### CURRENT STATE: Follow-up Discussion
You're having a technical discussion about their solution.
- Ask ONE probing question at a time
- Let them finish their full thought before responding
- If they seem to trail off: "And...?" or "Go on"
- It's a peer discussion, not an interrogation

Example: "What made you go with a hash map here?"`,

    feedback: `

### CURRENT STATE: Wrap-up
The interview is ending. Be warm and brief.
- Thank them for their time
- One positive takeaway
- One suggestion for improvement (if appropriate)
- Keep it short - don't lecture`
  };

  const contextNote = hasEvaluation
    ? "\n\nContext: Their code has been evaluated. You have access to the results."
    : "\n\nContext: They haven't submitted code for evaluation yet.";

  return basePersonality + (stateGuidance[state] || stateGuidance.coding) + contextNote;
}
