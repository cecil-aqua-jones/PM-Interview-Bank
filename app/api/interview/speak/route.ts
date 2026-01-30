import { NextRequest, NextResponse } from "next/server";
import { sanitizeForLLM, validateLength } from "@/lib/security";
import { 
  generateTTS, 
  isCartesiaConfigured, 
  CARTESIA_VOICES,
  TTS_EMOTIONS,
} from "@/lib/cartesia";
import { sanitizeForTTS } from "@/lib/questionSanitizer";
import { preprocessStandard } from "@/lib/ttsPreprocessor";

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
 * Uses GPT to create a natural, human summary of a long question
 * Still uses OpenAI for LLM summarization
 */
async function summarizeQuestion(question: string, category?: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    // Fallback to first 300 chars if no OpenAI key
    return question.slice(0, 300) + (question.length > 300 ? "..." : "");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
          content: `You are a friendly, senior software engineer having a conversation with an interview candidate. 
Your task is to verbally summarize a coding problem naturally, like you're explaining it to a colleague.

Speaking style:
- Talk like a real person, not a robot. Use contractions (you're, it's, we're)
- Keep it to 2-3 sentences max - they can read the details
- Be warm and supportive, but not over-the-top
- Use casual language: "basically", "so", "pretty much", "you know"
- Focus on what they need to DO, not every constraint
- Sound like you're actually interested in the problem

Example: "Basically, you've got an array of numbers and you need to find two that add up to a target sum. Pretty common one—just return the indices of those two numbers."

Another example: "So this one's about designing an LRU cache. You know, least recently used? When it fills up, you kick out whatever you haven't touched in a while. Classic systems design problem."`,
        },
        {
          role: "user",
          content: `Summarize this ${category ? category + " " : ""}problem conversationally:\n\n${question}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    // Fallback to first 300 chars if summarization fails
    return question.slice(0, 300) + (question.length > 300 ? "..." : "");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || question.slice(0, 300);
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

    // Determine if this is a long question that needs summarization
    const isLongQuestion = questionContent.length > LONG_QUESTION_THRESHOLD && !forceFullRead;
    
    let spokenQuestion = questionContent;
    
    if (isLongQuestion) {
      // Summarize long questions using GPT, including title for context
      const fullContext = questionTitle 
        ? `Topic: "${questionTitle}"\n\nInstructions: ${questionContent}`
        : questionContent;
      spokenQuestion = await summarizeQuestion(fullContext, category);
    } else if (questionTitle && questionContent.length > 0) {
      // For short questions with a title, introduce the topic
      spokenQuestion = `This problem is called "${questionTitle}". ${questionContent}`;
    } else if (questionTitle) {
      // Title only - just speak the title
      spokenQuestion = `This problem is called "${questionTitle}". Take a look at the details on your screen.`;
    }

    // Build the natural interview prompt
    const speechText = buildInterviewPrompt(spokenQuestion, isLongQuestion, category);

    // Preprocess for natural pauses
    const processedText = preprocessStandard(speechText);
    
    console.log(`[Speak] Generating TTS for ${processedText.length} chars with Cartesia Sonic-3 (Tessa voice)`);

    // Generate TTS using emotive voice with enthusiastic tone for greetings
    const audioBuffer = await generateTTS(processedText, CARTESIA_VOICES.DEFAULT, {
      generationConfig: {
        speed: 1.0,
        emotion: TTS_EMOTIONS.ENTHUSIASTIC,
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
    console.error("[Speak] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
