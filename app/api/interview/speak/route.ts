import { NextRequest, NextResponse } from "next/server";
import { sanitizeForLLM, validateLength } from "@/lib/security";
import { 
  generateTTS, 
  isCartesiaConfigured, 
  CARTESIA_VOICES,
  TTS_EMOTIONS,
  isNetworkError,
} from "@/lib/cartesia";
import { sanitizeForTTS } from "@/lib/questionSanitizer";
import { preprocessStandard } from "@/lib/ttsPreprocessor";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Character threshold for summarization
const LONG_QUESTION_THRESHOLD = 400;

// Natural, conversational preambles - varied to sound human
const PREAMBLES = [
  "Hey, thanks for being here. So,",
  "Alright, let's jump into this one.",
  "Great to have you. Okay, so",
  "Thanks for joining. Let's see here...",
  "Okay, perfect. So here's what I've got for you.",
  "Alright, let's do this. So,",
  "Hey, great to meet you. Okay so,",
  "Alright, let's get into it.",
];

// Natural transitions - more conversational
const TRANSITIONS = [
  "here's the problem I'd like you to work on.",
  "I'm gonna walk you through the question.",
  "let me describe what we're looking for here.",
  "here's what we've got.",
  "I'll lay out the problem for you.",
];

// Short question closings - encouraging and human
const CLOSINGS_SHORT = [
  "So yeah, take a sec to think through your approach, and whenever you're ready, just start walking me through your thinking.",
  "Take your time with this. There's no rush. Just let me know when you want to start talking through your solution.",
  "Feel free to think out loud as you work through it. I'm here to have a conversation, not to pressure you.",
  "Just think it through and start whenever you're comfortable. I'm interested in hearing how you approach this.",
  "No need to rush into it. Take a moment, and when you're ready, walk me through how you'd tackle this.",
];

// Long question closings - guiding them to read details
const CLOSINGS_LONG = [
  "Now, there's more detail in the problem description on your screen, so definitely read through that carefully. The examples especially will help. Take your time, and start coding whenever you're ready.",
  "That's the high-level idea, but the full requirements are on screen. I'd recommend going through the examples and constraints before diving in. Let me know if anything's unclear.",
  "So yeah, that's the gist. But make sure to read through the specifics on screen, especially the edge cases. Those tend to trip people up. Start whenever you're ready.",
  "The complete problem is shown there for you. Read through it, make sure you understand the constraints, and feel free to ask me any clarifying questions before you start.",
];

/**
 * Rewrites question content for natural spoken delivery.
 * 
 * NEVER reads the original text word-for-word. Instead:
 * - Fixes grammatical issues from Airtable source
 * - Restructures for verbal clarity
 * - Makes it casual and conversational
 * - Keeps it brief (they can read details on screen)
 * 
 * @param questionTitle - The question title (optional)
 * @param questionContent - The raw question content from Airtable
 * @param category - Question category for context
 * @param isLong - Whether the question is long (affects output length)
 */
async function naturalizeForSpeech(
  questionTitle: string | undefined,
  questionContent: string,
  category?: string,
  isLong: boolean = false
): Promise<string> {
  // Build context for GPT
  const questionContext = questionTitle 
    ? `Problem title: "${questionTitle}"\n\nProblem description:\n${questionContent}`
    : questionContent;

  // Fallback if no API key or very short content
  const getFallback = () => {
    if (questionTitle && questionContent.length < 50) {
      return `This one's called ${questionTitle}. Take a look at the details on your screen.`;
    }
    // Simple fallback - just clean it up a bit
    const shortened = questionContent.slice(0, 200);
    return questionTitle 
      ? `So this is ${questionTitle}. ${shortened}${questionContent.length > 200 ? "... check the screen for the full details." : ""}`
      : shortened;
  };
  
  if (!OPENAI_API_KEY) {
    return getFallback();
  }

  // Determine output length guidance based on question length
  const lengthGuidance = isLong 
    ? "Keep it to 2-3 sentences - just the core idea. They'll read the details on screen."
    : "Keep it to 2-4 sentences. Cover the main ask clearly.";

  try {
    const response = await fetchWithRetry(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You're a friendly tech interviewer explaining a coding problem to a candidate. Rewrite the problem in your own words for SPOKEN delivery.

CRITICAL RULES:
- NEVER read the original text word-for-word
- ALWAYS rewrite in your own casual, spoken words
- Fix any grammatical issues or awkward phrasing
- ${lengthGuidance}
- Reference that details are "on your screen" or "shown there"

SPEAKING STYLE:
- Super casual, like chatting with a friend
- Use contractions: you're, it's, that's, gonna, we've got
- Natural fillers are okay: "so basically", "you know", "right?"
- Sound genuinely interested and friendly
- Explain technical concepts simply

GOOD EXAMPLES:
"So this one's called Two Sum. Basically, you've got an array of numbers and you need to find two that add up to a target. Just return their indices - pretty straightforward."

"Alright, this is a classic - LRU Cache. You know how caches work, right? When it fills up, you kick out whatever you haven't touched in a while. The details are on your screen."

"So we've got a linked list problem here. You need to reverse it - take the nodes and flip the order around. Not too bad once you get the pointer logic down."

BAD (too robotic/word-for-word):
"Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."`,
            },
            {
              role: "user",
              content: `Rewrite this ${category ? category + " " : ""}problem for spoken delivery:\n\n${questionContext}`,
            },
          ],
          temperature: 0.85, // Slightly higher for more natural variation
          max_tokens: 250,
        }),
      },
      {
        maxRetries: 3,
        timeoutMs: 15000,
        logPrefix: "[Speak]",
      }
    );

    if (!response.ok) {
      console.warn(`[Speak] OpenAI naturalization failed with status ${response.status}, using fallback`);
      return getFallback();
    }

    const data = await response.json();
    const naturalizedText = data.choices[0]?.message?.content;
    
    if (!naturalizedText || naturalizedText.length < 20) {
      console.warn("[Speak] GPT returned empty/short response, using fallback");
      return getFallback();
    }
    
    console.log(`[Speak] Naturalized question: "${naturalizedText.slice(0, 100)}..."`);
    return naturalizedText;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Speak] Naturalization failed: ${errorMessage}, using fallback`);
    return getFallback();
  }
}

function buildInterviewPrompt(question: string, isLong: boolean, category?: string): string {
  const preamble = PREAMBLES[Math.floor(Math.random() * PREAMBLES.length)];
  const transition = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
  const closings = isLong ? CLOSINGS_LONG : CLOSINGS_SHORT;
  const closing = closings[Math.floor(Math.random() * closings.length)];

  // Add category context naturally if available
  let categoryContext = "";
  if (category) {
    const cat = category.toLowerCase();
    if (cat.includes("array") || cat.includes("string")) {
      categoryContext = " This one's more of a data structure problem. ";
    } else if (cat.includes("dynamic") || cat.includes("dp")) {
      categoryContext = " This is a DP question, so think about breaking it down. ";
    } else if (cat.includes("tree") || cat.includes("graph")) {
      categoryContext = " This one involves some graph traversal. ";
    } else if (cat.includes("system")) {
      categoryContext = " This is more of a system design question. ";
    }
  }

  // Build with natural pauses (commas create micro-pauses in TTS)
  return `${preamble}${categoryContext}${transition} ${question}. ${closing}`;
}

export async function POST(request: NextRequest) {
  if (!isCartesiaConfigured()) {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    let { 
      question,        // DEPRECATED: Combined question (for backwards compat)
      questionTitle,   // The question title (e.g., "Answer Caching Strategy")
      questionContent, // The detailed problem description
      category, 
      forceFullRead 
    } = body;

    // Support both new format (title + content) and old format (combined question)
    if (!questionTitle && !questionContent && !question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }
    
    // If using old format, use it directly
    if (!questionTitle && !questionContent && question) {
      questionContent = question;
    }

    // Sanitize inputs for security
    if (questionTitle) {
      questionTitle = sanitizeForLLM(questionTitle);
    }
    questionContent = questionContent ? sanitizeForLLM(questionContent) : "";
    category = typeof category === "string" ? sanitizeForLLM(category) : undefined;

    // Sanitize for TTS - remove markdown, code blocks, and formatting artifacts
    if (questionTitle) {
      questionTitle = sanitizeForTTS(questionTitle);
    }
    if (questionContent) {
      questionContent = sanitizeForTTS(questionContent);
    }

    // Validate length
    const minLength = questionTitle ? 0 : 10;
    const contentValidation = validateLength(questionContent, minLength, 5000);
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }
    
    // If we have neither title nor sufficient content, return error
    if (!questionTitle && questionContent.length < 10) {
      return NextResponse.json({ error: "Question content is too short" }, { status: 400 });
    }

    // Determine if this is a long question (affects naturalization output length)
    const isLongQuestion = questionContent.length > LONG_QUESTION_THRESHOLD && !forceFullRead;
    
    // ALWAYS naturalize the question for speech clarity
    // This rewrites the content in casual, spoken language - never reads word-for-word
    const spokenQuestion = await naturalizeForSpeech(
      questionTitle,
      questionContent,
      category,
      isLongQuestion
    );

    // Build the natural interview prompt with preamble and closing
    const speechText = buildInterviewPrompt(spokenQuestion, isLongQuestion, category);

    // Preprocess for natural pauses
    const processedText = preprocessStandard(speechText);
    
    console.log(`[Speak] Generating TTS for ${processedText.length} chars with Cartesia Sonic-3 (Tessa voice)`);

    // Generate TTS with friendly tone and slightly slower pace for natural delivery
    const audioBuffer = await generateTTS(processedText, CARTESIA_VOICES.DEFAULT, {
      generationConfig: {
        speed: 0.95,  // Slightly slower for more natural pacing
        emotion: TTS_EMOTIONS.FRIENDLY,  // Friendly tone for question content
      },
    });

    console.log(`[Speak] Generated ${audioBuffer.byteLength} bytes of audio`);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Speak] Error:", errorMessage);
    
    // Check if it's a network/service availability issue (including WebSocket errors)
    const isServiceUnavailable = error instanceof Error && isNetworkError(error);
    
    if (isServiceUnavailable) {
      console.log("[Speak] Returning 503 - service unavailable (network error detected)");
      return NextResponse.json(
        { error: "Speech service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }
    
    console.log("[Speak] Returning 500 - internal error");
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
