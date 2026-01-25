# System Patterns

## Architectural Decisions
- Next.js App Router with a route group for authenticated app UI.
- Server components fetch from Airtable via server-side helpers with cache.

## Interview Agent Architecture
- **Unified Conversation Flow**: Single `/api/interview/converse-stream` endpoint handles all conversational interactions
- **Two Interview Types (Same UX)**:
  - **Coding Interviews**: `InterviewPanel.tsx` - includes code editor + conversation
  - **Behavioral Interviews**: `BehavioralInterviewPanel.tsx` - conversation-only with STAR method evaluation
  - Both use identical streaming audio and hands-free conversation patterns
- **Context Awareness**: Every LLM call includes:
  - Original question/problem (title + content separately)
  - Current code in editor (coding) or conversation history (behavioral)
  - Full conversation history (last 15 turns)
  - Evaluation results (if code submitted / response evaluated)
  - Current interview state (coding/review/followup/feedback or listening/followup/feedback)
- **Audio Queue System**: Prevents simultaneous audio playback using a sequential queue
- **State Machines**:
  - Coding: speaking → coding → processing → review → followup → feedback
  - Behavioral: speaking → listening → followup → feedback
- **Voice Recording**: Uses MediaRecorder API with WebM format, transcribed via OpenAI Whisper
- **TTS**: OpenAI TTS-1 with "alloy" voice for natural conversational responses

## Hands-Free Conversation Flow (Both Interview Types)
- **Auto-Listen**: After AI audio ends, system auto-starts listening after 800ms delay
- **Silence Detection**: 1.5s of silence triggers pause, user can continue or message auto-sends
- **Continuation Window**: 3.5s to continue speaking before message is sent
- **Sentence Completeness**: `isCompleteSentence()` detects incomplete thoughts and extends wait time by 2s
- **Interrupt Support**: User can tap to interrupt AI speaking at any time
- **Recording States**: idle → listening → recording → paused → processing → idle

---

## ⚠️ CRITICAL: Streaming Audio Architecture

> **WARNING**: The streaming audio system is foundational to the interview experience.
> Any changes to the files listed below MUST be thoroughly tested.
> See `lib/hooks/STREAMING_AUDIO_ARCHITECTURE.md` for full documentation.

### Overview
The interview feature uses **sentence-based streaming TTS** that reduces perceived latency by 50-70%.
Audio is generated per-sentence in parallel and played in order.

### Critical Files (DO NOT MODIFY WITHOUT TESTING)

| File | Purpose |
|------|---------|
| `lib/hooks/useStreamingConversation.ts` | Client hook for conversation audio |
| `lib/hooks/useStreamingSpeech.ts` | Client hook for initial question audio |
| `app/api/interview/converse-stream/route.ts` | Server API for conversation streaming |
| `app/api/interview/speak-stream/route.ts` | Server API for question streaming |
| `app/dashboard/components/InterviewPanel.tsx` | Coding interview UI (uses streaming hooks) |
| `app/dashboard/components/BehavioralInterviewPanel.tsx` | Behavioral interview UI (uses streaming hooks) |

### Key Design Patterns

#### 1. SSE Line Buffering (CRITICAL BUG FIX)
Large base64 audio chunks can span multiple TCP packets. The client MUST buffer incomplete lines:

```typescript
let buffer = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";  // CRITICAL: Keep incomplete line
  
  for (const line of lines) { /* process */ }
}
```

**NEVER remove this buffering pattern** - it prevents silent loss of audio chunks.

#### 2. Ordered Audio Playback
- Server stores TTS results in Map with sentence index
- `trySendOrderedAudio()` sends results in sequential order
- Client tracks `nextExpectedIndexRef` and only plays matching index

#### 3. Two-Tier Skip Handling
1. **Server-side**: Explicit `type: "skip"` events when TTS fails
2. **Client-side**: 2-second timeout fallback if server skip is missed

#### 4. TTS Retry Logic
- 2 retries with exponential backoff (500ms, 1000ms)
- 8-second hard timeout per request
- Retries on: 429 (rate limit), 5xx (server errors), network failures
- No retry on: 4xx client errors (except 429)

#### 5. Safeguard Loop
Server ensures all indices are accounted for before closing stream:

```typescript
while (nextAudioToSend < totalSentences) {
  safeEnqueue({ type: "skip", index: nextAudioToSend });
  nextAudioToSend++;
}
```

### SSE Event Protocol

| Event | Purpose |
|-------|---------|
| `info` | Initial metadata (total sentences) |
| `token` | LLM streaming token (converse only) |
| `audio` | Base64 audio with index and sentence |
| `skip` | TTS failed for this index |
| `done` | Stream complete |

### Test Coverage
- `__tests__/lib/streaming/useStreamingConversation.test.ts`
- `__tests__/lib/streaming/useStreamingSpeech.test.ts`
- `__tests__/api/streaming/converse-stream.test.ts`
- `__tests__/api/streaming/speak-stream.test.ts`

### Change Checklist
Before modifying streaming audio:
- [ ] Read `lib/hooks/STREAMING_AUDIO_ARCHITECTURE.md`
- [ ] Run all streaming tests: `npm test -- --testPathPattern=streaming`
- [ ] Test with slow network (DevTools throttling)
- [ ] Test with simulated TTS failures
- [ ] Verify audio plays in correct order
