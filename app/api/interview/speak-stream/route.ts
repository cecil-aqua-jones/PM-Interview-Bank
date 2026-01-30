import { NextRequest } from "next/server";
import { sanitizeForLLM, validateLength } from "@/lib/security";
import { 
  generateTTS, 
  isCartesiaConfigured, 
  CARTESIA_VOICES,
  TTS_EMOTIONS,
  getEmotionForState,
  type TTSGenerationConfig,
} from "@/lib/cartesia";
import { sanitizeForTTS } from "@/lib/questionSanitizer";
import { preprocessStandard } from "@/lib/ttsPreprocessor";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Character threshold for summarization
const LONG_QUESTION_THRESHOLD = 400;

// Natural, conversational preambles - varied to sound incredibly human
// Using filler words and natural speech patterns that sound great via TTS
const PREAMBLES = [
  "Hey, thanks for being here! So,",
  "Alright, let's jump into this one.",
  "Great to have you. Okay, so",
  "Thanks for joining. Let's see here...",
  "Okay, perfect. So here's what I've got for you.",
  "Alright, let's do this. So,",
  "Hey, great to meet you! Okay so,",
  "Alright, let's get into it.",
  "Hey! Good to see you. So,",
  "Okay cool, let's dive in.",
  "Alright, ready when you are. So,",
  "Hey there! Let's get started.",
];

// Natural transitions - very conversational with thinking cues
const TRANSITIONS = [
  "here's the problem I'd like you to work on.",
  "I'm gonna walk you through the question.",
  "let me describe what we're looking for here.",
  "here's what we've got.",
  "basically, here's the deal.",
  "so the idea is this.",
  "let me lay this out for you.",
  "here's what I need you to look at.",
];

// Short question closings - encouraging, warm, and natural
const CLOSINGS_SHORT = [
  "So yeah, take a sec to think through your approach, and whenever you're ready, just start walking me through your thinking.",
  "Take your time with this. There's no rush. Just let me know when you want to start talking through your solution.",
  "Feel free to think out loud as you work through it. I'm here to have a conversation, not to pressure you.",
  "Just think it through and start whenever you're comfortable. I'm interested in hearing how you approach this.",
  "No need to rush into it. Take a moment, and when you're ready, walk me through how you'd tackle this.",
  "You know, just take your time. Think it through and we'll chat about it whenever you're ready.",
  "So yeah, no pressure. Think about your approach and start whenever feels right.",
];

// Long question closings - guiding them naturally to read details
const CLOSINGS_LONG = [
  "Now, there's more detail in the problem description on your screen, so definitely read through that carefully. The examples especially will help. Take your time, and start coding whenever you're ready.",
  "That's the high-level idea, but the full requirements are on screen. I'd recommend going through the examples and constraints before diving in. Let me know if anything's unclear.",
  "So yeah, that's the gist. But make sure to read through the specifics on screen, especially the edge cases. Those tend to trip people up. Start whenever you're ready.",
  "The complete problem is shown there for you. Read through it, make sure you understand the constraints, and feel free to ask me any clarifying questions before you start.",
  "I know that's a lot, but it's all written out for you on screen. Take your time reading through it, and let me know if you have any questions.",
];

/**
 * Generate TTS for a single sentence with retry logic and timeout
 * Uses Cartesia Sonic-3 with emotive voice for natural, human-like speech
 */
async function generateTTSForSentence(sentence: string, index: number, retryCount = 0): Promise<string | null> {
  const MAX_RETRIES = 2;
  const TTS_TIMEOUT = 15000; // 15 second timeout per request
  
  // Create abort controller for timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`[TTS] Timeout for sentence ${index} after ${TTS_TIMEOUT}ms`);
    abortController.abort();
  }, TTS_TIMEOUT);
  
  try {
    // Preprocess text for natural pauses
    const processedSentence = preprocessStandard(sentence);
    
    console.log(`[TTS] Starting Cartesia request for sentence ${index}: "${sentence.slice(0, 30)}..."`);
    
    // Generate TTS using emotive voice with enthusiastic tone for greetings
    const generationConfig: TTSGenerationConfig = {
      speed: 1.0,
      emotion: index === 0 ? TTS_EMOTIONS.ENTHUSIASTIC : TTS_EMOTIONS.CONTENT,
    };
    
    const audioBuffer = await generateTTS(processedSentence, CARTESIA_VOICES.DEFAULT, {
      signal: abortController.signal,
      timeoutMs: TTS_TIMEOUT,
      generationConfig,
    });
    
    clearTimeout(timeoutId);
    console.log(`[TTS] Success for sentence ${index}, got ${audioBuffer.byteLength} bytes`);
    
    // Convert to base64 for streaming
    return Buffer.from(audioBuffer).toString("base64");
  } catch (error) {
    clearTimeout(timeoutId);
    
    const isAborted = error instanceof Error && error.name === "AbortError";
    if (isAborted) {
      console.error(`[TTS] Timeout/aborted for sentence ${index}`);
    } else {
      console.error(`[TTS] Error for sentence ${index}:`, error);
    }
    
    // Retry on errors
    if (retryCount < MAX_RETRIES) {
      const delay = 500 * Math.pow(2, retryCount);
      console.log(`[TTS] Retrying sentence ${index} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateTTSForSentence(sentence, index, retryCount + 1);
    }
    
    console.log(`[TTS] Giving up on sentence ${index} after all retries`);
    return null;
  }
}

/**
 * Uses GPT to create a natural, human-like paraphrase of a long question
 * The AI can rephrase freely while ensuring all requirements are communicated
 */
async function summarizeQuestion(question: string, category?: string): Promise<string> {
  if (!OPENAI_API_KEY) {
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
          content: `You are a warm, friendly senior engineer explaining a coding problem to a colleague over coffee.

YOUR TASK:
Paraphrase this problem naturally in your own words. You're speaking out loud, so it needs to sound human.

CRITICAL RULES:
1. You MAY paraphrase freely - use your own words, don't read verbatim
2. You MUST include ALL key requirements (input format, output format, constraints that matter)
3. Keep it to 2-4 sentences - they can read the full details on screen
4. Focus on WHAT they need to do, not every edge case

SPEAKING STYLE (your output is spoken via TTS):
- Use contractions naturally: you're, it's, we're, that's, don't, won't
- Add natural fillers: "basically", "so", "pretty much", "you know"
- Vary sentence length - mix short with medium
- Sound engaged and interested, not bored
- Think like you're chatting, not lecturing

GOOD EXAMPLES:
- "Basically, you've got an array of numbers and you need to find two that add up to a target. Pretty common one—just return their indices."
- "So this one's about strings. You're given two of them and you need to figure out if one's an anagram of the other. You know, same letters, different order."
- "Okay so this is a tree problem. You've got a binary tree and you need to find its maximum depth. Pretty straightforward traversal stuff."

AVOID:
- Starting with "In this problem..." (sounds robotic)
- Formal language like "Furthermore" or "Additionally"
- Listing every single constraint
- Sounding like you're reading documentation`,
        },
        {
          role: "user",
          content: `Paraphrase this ${category ? category + " " : ""}problem naturally:\n\n${question}`,
        },
      ],
      temperature: 0.85,
      max_tokens: 250,
    }),
  });

  if (!response.ok) {
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

  return `${preamble}${categoryContext}${transition} ${question}. ${closing}`;
}

/**
 * Split text into sentences for streaming
 */
function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  const regex = /[^.!?]*[.!?]+(?:\s|$)/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length > 10) {
      sentences.push(sentence);
    }
  }
  
  // Handle any remaining text without sentence-ending punctuation
  const lastIndex = text.lastIndexOf(sentences[sentences.length - 1] || "");
  if (lastIndex >= 0) {
    const remaining = text.slice(lastIndex + (sentences[sentences.length - 1]?.length || 0)).trim();
    if (remaining.length > 10) {
      sentences.push(remaining);
    }
  }
  
  return sentences.length > 0 ? sentences : [text];
}

/**
 * Streaming speak endpoint - splits question into sentences and streams TTS
 * Uses Cartesia Sonic-3 for fast, low-latency TTS
 * 
 * This dramatically reduces time-to-first-audio by:
 * 1. Starting TTS for the first sentence immediately
 * 2. Generating TTS for subsequent sentences in parallel
 * 3. Streaming audio to the client as each sentence is ready
 */
export async function POST(request: NextRequest) {
  if (!isCartesiaConfigured()) {
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    let { 
      question,
      questionTitle,
      questionContent,
      category, 
      forceFullRead 
    } = body;

    // Support both new format (title + content) and old format
    if (!questionTitle && !questionContent && !question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
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
    const contentValidation = validateLength(questionContent, 10, 5000);
    if (!contentValidation.valid) {
      return new Response(
        JSON.stringify({ error: contentValidation.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine if this is a long question that needs summarization
    const isLongQuestion = questionContent.length > LONG_QUESTION_THRESHOLD && !forceFullRead;
    
    let spokenQuestion = questionContent;
    
    if (isLongQuestion) {
      const fullContext = questionTitle 
        ? `Topic: "${questionTitle}"\n\nInstructions: ${questionContent}`
        : questionContent;
      spokenQuestion = await summarizeQuestion(fullContext, category);
    } else if (questionTitle) {
      spokenQuestion = `This problem is called "${questionTitle}". ${questionContent}`;
    }

    // Build the natural interview prompt
    const speechText = buildInterviewPrompt(spokenQuestion, isLongQuestion, category);
    
    // Split into sentences for streaming
    const sentences = splitIntoSentences(speechText);
    
    console.log(`[Speak-Stream] Processing ${sentences.length} sentences with Cartesia Sonic-3`);

    // Create streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        
        const safeEnqueue = (data: string) => {
          if (!isClosed) {
            try {
              controller.enqueue(encoder.encode(data));
            } catch {
              console.log("[Speak-Stream] Controller closed");
            }
          }
        };
        
        const safeClose = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {
              // Already closed
            }
          }
        };

        try {
          // Send initial info
          safeEnqueue(`data: ${JSON.stringify({ 
            type: "info", 
            totalSentences: sentences.length,
            fullText: speechText 
          })}\n\n`);

          // Track TTS results for ordered output - null means TTS failed
          const ttsResults: Map<number, string | null> = new Map();
          let nextAudioToSend = 0;
          const totalSentences = sentences.length;
          
          const trySendOrderedAudio = () => {
            console.log(`[Speak-Stream] trySendOrderedAudio: nextAudioToSend=${nextAudioToSend}, results keys:`, Array.from(ttsResults.keys()));
            
            while (ttsResults.has(nextAudioToSend)) {
              const audio = ttsResults.get(nextAudioToSend);
              ttsResults.delete(nextAudioToSend);
              
              if (audio) {
                console.log(`[Speak-Stream] Sending audio ${nextAudioToSend}`);
                safeEnqueue(`data: ${JSON.stringify({ 
                  type: "audio", 
                  index: nextAudioToSend,
                  sentence: sentences[nextAudioToSend],
                  audio 
                })}\n\n`);
              } else {
                // TTS failed - send skip event so client doesn't wait
                console.log(`[Speak-Stream] Sending skip for failed TTS ${nextAudioToSend}`);
                safeEnqueue(`data: ${JSON.stringify({ 
                  type: "skip", 
                  index: nextAudioToSend
                })}\n\n`);
              }
              nextAudioToSend++;
            }
          };

          // Generate TTS for all sentences in parallel using Cartesia
          const ttsPromises = sentences.map(async (sentence, index) => {
            const audio = await generateTTSForSentence(sentence, index);
            if (!isClosed) {
              console.log(`[Speak-Stream] TTS ${index} resolved: ${audio ? 'success' : 'null'}`);
              ttsResults.set(index, audio);
              trySendOrderedAudio();
            }
          });

          await Promise.all(ttsPromises);
          
          console.log(`[Speak-Stream] All TTS complete, sending remaining...`);
          
          // Final check - send any remaining
          trySendOrderedAudio();
          
          // Safeguard: ensure all indices have been sent or skipped
          while (nextAudioToSend < totalSentences) {
            console.log(`[Speak-Stream] Safeguard: sending skip for missing index ${nextAudioToSend}`);
            safeEnqueue(`data: ${JSON.stringify({ 
              type: "skip", 
              index: nextAudioToSend
            })}\n\n`);
            nextAudioToSend++;
          }
          
          safeEnqueue(`data: ${JSON.stringify({ type: "done" })}\n\n`);
          safeClose();
        } catch (error) {
          console.error("[Speak-Stream] Error:", error);
          safeEnqueue(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
          safeClose();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Speak-Stream] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate speech" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
