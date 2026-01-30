import { NextRequest } from "next/server";
import { sanitizeForLLM, validateLength } from "@/lib/security";
import { 
  generateTTS, 
  isCartesiaConfigured, 
  CARTESIA_VOICES,
  getEmotionForState,
  type TTSGenerationConfig,
} from "@/lib/cartesia";
import { sanitizeForTTS } from "@/lib/questionSanitizer";
import { preprocessStandard } from "@/lib/ttsPreprocessor";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Retry configuration for OpenAI API calls
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Fetch with retry logic for transient network failures
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a retryable error (network/timeout issues)
      const isRetryable = 
        lastError.message.includes("fetch failed") ||
        lastError.message.includes("ETIMEDOUT") ||
        lastError.message.includes("ECONNRESET") ||
        lastError.message.includes("UND_ERR_CONNECT_TIMEOUT") ||
        lastError.message.includes("UND_ERR_HEADERS_TIMEOUT");
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
      console.log(`[Stream] Retry ${attempt + 1}/${maxRetries} after ${delay}ms due to: ${lastError.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

type ConversationMessage = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp?: number;
};

/**
 * Streaming conversational API endpoint with sentence-based TTS
 * 
 * Uses:
 * - OpenAI GPT for conversation generation
 * - Cartesia Sonic-3 for TTS (faster, lower latency)
 * 
 * Flow:
 * 1. Stream LLM response tokens
 * 2. Detect sentence boundaries
 * 3. Send each sentence to Cartesia TTS immediately
 * 4. Client receives sentence + audio pairs as they're ready
 * 
 * This reduces perceived latency by ~50-70% since the first sentence
 * starts playing while the LLM is still generating subsequent sentences.
 */
export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "LLM service temporarily unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!isCartesiaConfigured()) {
    return new Response(
      JSON.stringify({ error: "TTS service temporarily unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    let {
      question,
      questionTitle,
      questionContent,
      userMessage,
      conversationHistory = [],
      code = "",
      language = "python",
      evaluation = null,
      interviewState = "coding"
    } = body;

    // Support both new format (title + content) and old format
    if (!questionTitle && !question) {
      return new Response(
        JSON.stringify({ error: "Question context is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (!questionTitle && question) {
      const lines = question.split("\n");
      questionTitle = lines[0] || "Coding Problem";
      questionContent = lines.slice(1).join("\n").trim() || question;
    }

    if (!userMessage || typeof userMessage !== "string") {
      return new Response(
        JSON.stringify({ error: "User message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
      return new Response(JSON.stringify({ error: titleValidation.error }), { status: 400 });
    }
    
    const contentValidation = validateLength(questionContent, 5, 5000);
    if (!contentValidation.valid) {
      return new Response(JSON.stringify({ error: contentValidation.error }), { status: 400 });
    }

    const messageValidation = validateLength(userMessage, 2, 2000);
    if (!messageValidation.valid) {
      return new Response(JSON.stringify({ error: messageValidation.error }), { status: 400 });
    }

    // Sanitize conversation history
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

    // Build context
    const codeContext = code.trim()
      ? `\n\nCandidate's current code (${language}):\n\`\`\`${language}\n${code.slice(0, 8000)}\n\`\`\``
      : "\n\n(No code written yet)";

    const evaluationContext = evaluation
      ? `\n\nCode evaluation results:\n- Overall Score: ${evaluation.overallScore}/5\n- Feedback: ${evaluation.overallFeedback || "N/A"}`
      : "";

    const conversationContext = sanitizedHistory.length > 0
      ? "\n\nConversation so far:\n" + sanitizedHistory.map(m =>
          `${m.role === "interviewer" ? "You (Interviewer)" : "Candidate"}: ${m.content}`
        ).join("\n")
      : "";

    const systemPrompt = buildSystemPrompt(interviewState, !!evaluation);

    // For greeting state, include the full question so AI can greet AND present the question in one response
    const fullContext = interviewState === "greeting" 
      ? `The candidate has just greeted you to start the interview. They said: "${userMessage}"

INTERVIEW QUESTION TO PRESENT:
Title: "${questionTitle}"
Full Question: ${questionContent}

Greet them warmly, then naturally present this question in full. Make it conversational but ensure you read the ENTIRE question clearly.`
      : `INTERVIEW PROBLEM:
Title/Topic: "${questionTitle}"
Problem Instructions: ${questionContent}
${codeContext}
${evaluationContext}
${conversationContext}

The candidate just said: "${userMessage}"

Respond naturally as the interviewer.`;

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        // Track if controller is closed to prevent race conditions
        let isClosed = false;
        
        const safeEnqueue = (data: string) => {
          if (!isClosed) {
            try {
              controller.enqueue(encoder.encode(data));
            } catch (err) {
              // Controller was closed between check and enqueue
              console.log("[Stream] Controller closed, skipping enqueue");
            }
          }
        };
        
        const safeClose = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch (err) {
              // Already closed
            }
          }
        };
        
        try {
          // Start streaming LLM response (with retry for transient failures)
          let llmResponse: Response;
          try {
            llmResponse = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
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
                stream: true,
              }),
            });
          } catch (fetchError) {
            console.error("[Stream] Failed to connect to OpenAI after retries:", fetchError);
            safeEnqueue(`data: ${JSON.stringify({ error: "AI service temporarily unavailable. Please try again." })}\n\n`);
            safeClose();
            return;
          }

          if (!llmResponse.ok || !llmResponse.body) {
            const errorText = await llmResponse.text().catch(() => "Unknown error");
            console.error("[Stream] LLM request failed:", llmResponse.status, errorText);
            safeEnqueue(`data: ${JSON.stringify({ error: "LLM request failed" })}\n\n`);
            safeClose();
            return;
          }

          const reader = llmResponse.body.getReader();
          const decoder = new TextDecoder();
          
          let fullText = "";
          let sentenceBuffer = "";
          let sentenceIndex = 0;
          const sentenceBoundaryRegex = /[.!?]+(?:\s|$)/;
          
          // Track pending TTS requests - store results for ordered output
          // Use null to mark failed TTS so we can skip it
          const ttsResults: Map<number, { sentence: string; audio: string } | null> = new Map();
          const ttsTasks: Promise<void>[] = [];
          let nextAudioToSend = 0;
          let totalSentences = 0;
          
          // Function to send audio results in order
          const trySendOrderedAudio = () => {
            console.log(`[Stream] trySendOrderedAudio called. nextAudioToSend=${nextAudioToSend}, ttsResults keys:`, Array.from(ttsResults.keys()));
            
            while (ttsResults.has(nextAudioToSend)) {
              const result = ttsResults.get(nextAudioToSend);
              ttsResults.delete(nextAudioToSend);
              
              // If result is null or undefined, TTS failed - notify client to skip this index
              if (!result) {
                console.log(`[Stream] TTS failed for audio ${nextAudioToSend}, sending skip event`);
                // Send explicit skip event so client doesn't wait for this index
                safeEnqueue(`data: ${JSON.stringify({ 
                  type: "skip", 
                  index: nextAudioToSend
                })}\n\n`);
                nextAudioToSend++;
                continue;
              }
              
              console.log(`[Stream] Sending audio ${nextAudioToSend}: "${result.sentence.slice(0, 30)}..."`);
              safeEnqueue(`data: ${JSON.stringify({ 
                type: "audio", 
                index: nextAudioToSend,
                sentence: result.sentence,
                audio: result.audio 
              })}\n\n`);
              nextAudioToSend++;
            }
            
            console.log(`[Stream] trySendOrderedAudio done. nextAudioToSend=${nextAudioToSend}`);
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const token = parsed.choices?.[0]?.delta?.content || "";
                  
                  if (token) {
                    fullText += token;
                    sentenceBuffer += token;

                    // Send token for real-time text display
                    safeEnqueue(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);

                    // Check for sentence boundary
                    const match = sentenceBuffer.match(sentenceBoundaryRegex);
                    if (match && sentenceBuffer.trim().length > 15) {
                      const sentenceEndIndex = match.index! + match[0].length;
                      const completeSentence = sentenceBuffer.slice(0, sentenceEndIndex).trim();
                      sentenceBuffer = sentenceBuffer.slice(sentenceEndIndex);

                      // Queue TTS for this sentence (don't await - parallel processing)
                      const currentIndex = sentenceIndex++;
                      totalSentences++;
                      console.log(`[Stream] Queueing Cartesia TTS for sentence ${currentIndex}: "${completeSentence.slice(0, 30)}..."`);
                      
                      const ttsTask = generateTTSForSentence(completeSentence, currentIndex, interviewState)
                        .then(audioBase64 => {
                          console.log(`[Stream] TTS ${currentIndex} resolved: ${audioBase64 ? 'success' : 'null'}`);
                          if (isClosed) {
                            console.log(`[Stream] Stream closed, skipping result for ${currentIndex}`);
                            return;
                          }
                          
                          if (audioBase64) {
                            ttsResults.set(currentIndex, { 
                              sentence: completeSentence, 
                              audio: audioBase64 
                            });
                          } else {
                            // Mark as failed so we can skip this index
                            console.log(`[Stream] Marking sentence ${currentIndex} as failed (null)`);
                            ttsResults.set(currentIndex, null);
                          }
                          trySendOrderedAudio();
                        })
                        .catch(err => {
                          console.error(`[TTS] Catch block for sentence ${currentIndex}:`, err);
                          // Mark as failed so we can skip this index
                          if (!isClosed) {
                            console.log(`[Stream] Marking sentence ${currentIndex} as failed (error)`);
                            ttsResults.set(currentIndex, null);
                            trySendOrderedAudio();
                          }
                        });
                      
                      ttsTasks.push(ttsTask);
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON chunks
                }
              }
            }
          }

          // Handle any remaining text
          if (sentenceBuffer.trim().length > 0) {
            const currentIndex = sentenceIndex++;
            totalSentences++;
            const finalSentence = sentenceBuffer.trim();
            console.log(`[Stream] Queueing TTS for final sentence ${currentIndex}: "${finalSentence.slice(0, 30)}..."`);
            
            const ttsTask = generateTTSForSentence(finalSentence, currentIndex, interviewState)
              .then(audioBase64 => {
                console.log(`[Stream] Final TTS ${currentIndex} resolved: ${audioBase64 ? 'success' : 'null'}`);
                if (isClosed) {
                  console.log(`[Stream] Stream closed, skipping final result for ${currentIndex}`);
                  return;
                }
                
                if (audioBase64) {
                  ttsResults.set(currentIndex, { 
                    sentence: finalSentence, 
                    audio: audioBase64 
                  });
                } else {
                  // Mark as failed so we can skip this index
                  console.log(`[Stream] Marking final sentence ${currentIndex} as failed (null)`);
                  ttsResults.set(currentIndex, null);
                }
                trySendOrderedAudio();
              })
              .catch(err => {
                console.error(`[TTS] Catch block for final sentence ${currentIndex}:`, err);
                // Mark as failed so we can skip this index
                if (!isClosed) {
                  console.log(`[Stream] Marking final sentence ${currentIndex} as failed (error)`);
                  ttsResults.set(currentIndex, null);
                  trySendOrderedAudio();
                }
              });
            
            ttsTasks.push(ttsTask);
          }

          console.log(`[Stream] Waiting for ${ttsTasks.length} Cartesia TTS tasks to complete...`);
          
          // Wait for all TTS to complete
          await Promise.all(ttsTasks);
          
          console.log(`[Stream] All TTS tasks completed. Sending remaining audio...`);
          
          // Final attempt to send any remaining audio
          trySendOrderedAudio();
          
          // Safeguard: ensure all indices up to totalSentences have been sent or skipped
          // This handles edge cases where results might not have been processed
          while (nextAudioToSend < totalSentences) {
            console.log(`[Stream] Safeguard: sending skip for missing index ${nextAudioToSend}`);
            safeEnqueue(`data: ${JSON.stringify({ 
              type: "skip", 
              index: nextAudioToSend
            })}\n\n`);
            nextAudioToSend++;
          }

          // Send completion signal with full text
          safeEnqueue(`data: ${JSON.stringify({ type: "done", fullText })}\n\n`);
          
          safeClose();
        } catch (error) {
          console.error("[Stream] Error:", error);
          safeEnqueue(`data: ${JSON.stringify({ error: "Stream processing failed" })}\n\n`);
          safeClose();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Converse-Stream] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process conversation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Generate TTS audio for a sentence using Cartesia Sonic-3
 * Uses emotive voice with state-appropriate emotion for natural speech
 * Returns base64 encoded audio or null on failure
 */
async function generateTTSForSentence(
  sentence: string, 
  index: number, 
  interviewState: string = "coding",
  retryCount = 0
): Promise<string | null> {
  const MAX_RETRIES = 2;
  const TTS_TIMEOUT = 15000; // 15 second timeout per request
  
  // Sanitize and preprocess for natural speech
  const sanitizedSentence = sanitizeForTTS(sentence);
  
  // Skip if sentence becomes empty after sanitization
  if (!sanitizedSentence || sanitizedSentence.trim().length < 3) {
    console.log(`[TTS] Skipping sentence ${index} - too short after sanitization`);
    return null;
  }
  
  // Preprocess for natural pauses
  const processedSentence = preprocessStandard(sanitizedSentence);
  
  // Create abort controller for timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`[TTS] Timeout for sentence ${index} after ${TTS_TIMEOUT}ms`);
    abortController.abort();
  }, TTS_TIMEOUT);
  
  try {
    // Get emotion based on interview state for natural voice inflection
    const emotion = getEmotionForState(interviewState);
    const generationConfig: TTSGenerationConfig = {
      speed: 1.0,
      emotion,
    };
    
    console.log(`[TTS] Starting Cartesia request for sentence ${index} (state: ${interviewState}, emotion: ${emotion}): "${processedSentence.slice(0, 30)}..."`);
    
    // Generate TTS using emotive voice with state-appropriate emotion
    const audioBuffer = await generateTTS(processedSentence, CARTESIA_VOICES.DEFAULT, {
      signal: abortController.signal,
      timeoutMs: TTS_TIMEOUT,
      generationConfig,
    });
    
    clearTimeout(timeoutId);
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
    
    // Retry on errors
    if (retryCount < MAX_RETRIES) {
      const delay = 500 * Math.pow(2, retryCount);
      console.log(`[TTS] Retrying sentence ${index} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateTTSForSentence(sentence, index, interviewState, retryCount + 1);
    }
    
    console.log(`[TTS] Giving up on sentence ${index} after all retries`);
    return null;
  }
}

/**
 * Build the system prompt based on interview state
 * Enhanced for natural, human-like speech output via TTS
 */
function buildSystemPrompt(state: string, hasEvaluation: boolean): string {
  // Special handling for greeting state - unified greeting + question presentation
  if (state === "greeting") {
    return `You are a warm, friendly AI interviewer starting an interview session.

YOUR TASK:
1. Start with a natural, brief greeting (1 sentence)
2. Smoothly transition to presenting the interview question
3. You MAY paraphrase the question in natural, conversational language
4. You MUST include ALL requirements, constraints, and examples from the original
5. End with an encouraging prompt

### SPEECH NATURALNESS (Critical - Your output is spoken aloud)
- Sound like you're explaining to a colleague over coffee, not reading from a script
- Use phrases like "basically what we need here is..." or "so the idea is..."
- Use contractions naturally: you're, it's, that's, we'll, don't
- Add natural fillers sparingly: "so", "you know", "basically", "actually"
- Vary your sentence length - mix short and long sentences
- NEVER sound robotic or lecture-like

EXAMPLE NATURAL DELIVERY:
"Hey, great to have you here! So, let's jump into today's problem. Basically, what we're looking at is... [explain question naturally]. You know, take your time to think it through, and feel free to ask me anything."

CRITICAL:
- Cover ALL technical requirements when paraphrasing
- Keep greeting brief (1 sentence max)
- Be warm and encouraging
- End with something like "Take your time" or "Let me know your thoughts"

DO NOT:
- Give hints about the solution
- Be overly formal or stilted
- Start every sentence the same way`;
  }

  const basePersonality = `### ROLE & OBJECTIVE
You are a senior, empathetic software engineer conducting a coding interview. Your goal is natural, fluid conversation.

### SPEECH NATURALNESS (Critical - Your output is spoken aloud)
Your responses will be converted to speech, so they MUST sound natural when spoken:

- **Contractions always**: Use you're, it's, that's, wouldn't, couldn't, we're, don't, can't
- **Natural fillers**: Sprinkle in "so", "you know", "actually", "I mean", "basically" - but sparingly
- **Varied openers**: NEVER start multiple responses the same way. Mix it up:
  - "Oh nice, that makes sense..."
  - "Mm-hm, yeah..."
  - "Right, so..."
  - "Gotcha, gotcha..."
  - "Ah, interesting..."
- **Backchanneling**: Use brief verbal nods: "I see", "Mm-hm", "Right", "Okay", "Gotcha", "Makes sense"
- **Thinking cues**: "Let me see...", "Hmm...", "So basically..."
- **Warmth signals**: When they do well, show it: "Oh nice!", "Good catch!", "Yeah exactly!"
- **Laughter when appropriate**: Use [laughter] for warmth: "Good catch! [laughter]" or "Ha, yeah, edge cases are tricky"
- **Sentence variety**: Mix short punchy ("Gotcha.") with longer flowing sentences

### CRITICAL RULES
- Keep responses to 1-3 sentences MAX (brief = more natural)
- NEVER ask more than one question at a time
- Sound like a helpful colleague chatting, not an examiner interrogating
- If they seem to trail off, use: "Go on..." or "And...?" or "Mm-hm?"
- If you cut them off: "Sorry, go ahead - I think I cut you off."

### AVOID (sounds robotic when spoken)
- Starting with "Great question!" every time
- Formal language like "Indeed" or "Certainly"
- Long explanations (they feel like lectures)
- Repeating their words back verbatim`;

  const stateGuidance: Record<string, string> = {
    coding: `

### CURRENT STATE: Coding
They're working on their solution. Be supportive but brief.
- Answer questions helpfully without giving away the algorithm
- If they share their approach: "Oh nice, yeah that makes sense" or "Mm-hm, I like that direction"
- Think out loud acknowledgment: "Mm-hm" "Right" (don't interrupt their flow)
- If stuck, gentle nudge: "What if you started by thinking about..."

Example natural responses:
- "Yeah, you can assume it's always non-empty."
- "Mm-hm, good instinct there."
- "Oh that's a good question - what do you think?"`,

    review: `

### CURRENT STATE: Review
You've reviewed their code. Be encouraging but brief - they can see the score.
- One sentence summary if asked
- "Nice work on the core logic!" or "You got the main idea"
- Don't re-read the entire evaluation`,

    followup: `

### CURRENT STATE: Follow-up Discussion
Technical discussion about their solution. Be curious and engaged.
- Ask ONE probing question at a time
- Let them finish before responding
- Use curious tone: "Mm, what made you go with a hash map here?"
- If they trail off: "And...?" or "Go on"
- It's a peer discussion, not an interrogation

Example: "Interesting - so what would happen if the input was really large?"`,

    feedback: `

### CURRENT STATE: Wrap-up
The interview is ending. Be warm and brief.
- Thank them genuinely: "Hey, thanks for working through that with me"
- One positive takeaway: "I liked how you approached the edge cases"
- Optional brief suggestion
- Keep it short - don't lecture`
  };

  return basePersonality + (stateGuidance[state] || stateGuidance.coding);
}
