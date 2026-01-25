import { NextRequest } from "next/server";
import { sanitizeForLLM, validateLength } from "@/lib/security";

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
 * Generate TTS for a single sentence with retry logic and timeout
 */
async function generateTTSForSentence(sentence: string, index: number, retryCount = 0): Promise<string | null> {
  const MAX_RETRIES = 2;
  const TTS_TIMEOUT = 8000; // 8 second timeout per request
  
  // Create abort controller for timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`[TTS] Timeout for sentence ${index} after ${TTS_TIMEOUT}ms`);
    abortController.abort();
  }, TTS_TIMEOUT);
  
  try {
    console.log(`[TTS] Starting request for sentence ${index}: "${sentence.slice(0, 30)}..."`);
    
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1", // Use faster model for streaming
        input: sentence,
        voice: "alloy",
        response_format: "mp3",
        speed: 1.0,
      }),
      signal: abortController.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      console.error(`[TTS] Failed for sentence ${index}: HTTP ${status}`);
      
      // Retry on rate limit (429) or server errors (5xx)
      if ((status === 429 || status >= 500) && retryCount < MAX_RETRIES) {
        const delay = 500 * Math.pow(2, retryCount);
        console.log(`[TTS] Retrying sentence ${index} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateTTSForSentence(sentence, index, retryCount + 1);
      }
      
      console.log(`[TTS] Giving up on sentence ${index} after HTTP ${status}`);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`[TTS] Success for sentence ${index}, got ${audioBuffer.byteLength} bytes`);
    return Buffer.from(audioBuffer).toString("base64");
  } catch (error) {
    clearTimeout(timeoutId);
    
    const isAborted = error instanceof Error && error.name === "AbortError";
    if (isAborted) {
      console.error(`[TTS] Timeout/aborted for sentence ${index}`);
    } else {
      console.error(`[TTS] Error for sentence ${index}:`, error);
    }
    
    // Retry on network errors (but not on intentional abort due to timeout)
    if (!isAborted && retryCount < MAX_RETRIES) {
      const delay = 500 * Math.pow(2, retryCount);
      console.log(`[TTS] Retrying sentence ${index} after error in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateTTSForSentence(sentence, index, retryCount + 1);
    }
    
    // For timeouts, try one more time with fresh request
    if (isAborted && retryCount < MAX_RETRIES) {
      const delay = 200;
      console.log(`[TTS] Retrying sentence ${index} after timeout (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateTTSForSentence(sentence, index, retryCount + 1);
    }
    
    console.log(`[TTS] Giving up on sentence ${index} after all retries`);
    return null;
  }
}

/**
 * Uses GPT to create a natural, human summary of a long question
 */
async function summarizeQuestion(question: string, category?: string): Promise<string> {
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

Example: "Basically, you've got an array of numbers and you need to find two that add up to a target sum. Pretty common one—just return the indices of those two numbers."`,
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
  // Split on sentence-ending punctuation followed by space or end
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
 * 
 * This dramatically reduces time-to-first-audio by:
 * 1. Starting TTS for the first sentence immediately
 * 2. Generating TTS for subsequent sentences in parallel
 * 3. Streaming audio to the client as each sentence is ready
 */
export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
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

    // Sanitize inputs
    if (questionTitle) {
      questionTitle = sanitizeForLLM(questionTitle);
    }
    questionContent = questionContent ? sanitizeForLLM(questionContent) : "";
    category = typeof category === "string" ? sanitizeForLLM(category) : undefined;

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
    
    console.log(`[Speak-Stream] Processing ${sentences.length} sentences`);

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

          // Generate TTS for all sentences in parallel
          const ttsPromises = sentences.map(async (sentence, index) => {
            const audio = await generateTTSForSentence(sentence, index);
            if (!isClosed) {
              console.log(`[Speak-Stream] TTS ${index} resolved: ${audio ? 'success' : 'null'}`);
              ttsResults.set(index, audio); // Store null for failed TTS
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
