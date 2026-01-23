# System Patterns

## Architectural Decisions
- Next.js App Router with a route group for authenticated app UI.
- Server components fetch from Airtable via server-side helpers with cache.

## Interview Agent Architecture
- **Unified Conversation Flow**: Single `/api/interview/converse` endpoint handles all conversational interactions
- **Context Awareness**: Every LLM call includes:
  - Original question/problem (title + content separately)
  - Current code in editor
  - Full conversation history (last 15 turns)
  - Evaluation results (if code submitted)
  - Current interview state (coding/review/followup/feedback)
- **Audio Queue System**: Prevents simultaneous audio playback using a sequential queue
- **State Machine**: Interview panel follows states: speaking → coding → processing → review → followup → feedback
- **Voice Recording**: Uses MediaRecorder API with WebM format, transcribed via OpenAI Whisper
- **TTS**: OpenAI TTS-1-HD with "alloy" voice for natural conversational responses

## Hands-Free Conversation Flow
- **Auto-Listen**: After AI audio ends, system auto-starts listening after 800ms delay
- **Silence Detection**: 1.5s of silence triggers pause, user can continue or message auto-sends
- **Continuation Window**: 3.5s to continue speaking before message is sent
- **Sentence Completeness**: `isCompleteSentence()` detects incomplete thoughts and extends wait time by 2s
- **Interrupt Support**: User can tap to interrupt AI speaking at any time
- **Recording States**: idle → listening → recording → paused → processing → idle
