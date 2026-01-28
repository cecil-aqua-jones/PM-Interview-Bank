# Active Context

## Current Focus

- Hands-free conversational interview experience
- Streaming audio reliability and documentation
- **Cartesia Integration** (Full migration from Deepgram)

## Recent Changes (Session - January 2026)

### Voice AI Migration: Deepgram → Cartesia (COMPLETE)

Fully migrated from Deepgram to Cartesia for all voice AI capabilities:

**New Core Library**: `lib/cartesia.ts`

- TTS: Cartesia Sonic-3 model with Katie voice (warm, professional)
- STT: Cartesia ink-whisper model (~200ms latency)
- WebSocket-based streaming for both TTS and STT
- WAV header generation for playable audio output

**Updated API Routes**:

- `/api/interview/transcribe` - Cartesia batch STT REST API
- `/api/interview/speak` - Cartesia Sonic-3 TTS via WebSocket
- `/api/interview/speak-stream` - Streaming TTS with sentence splitting
- `/api/interview/converse-stream` - Streaming conversation with TTS
- `/api/interview/converse` - Non-streaming conversation with TTS
- `/api/interview/clarify` - Clarifying questions with TTS
- `/api/interview/voice-agent` - Returns Cartesia WebSocket config

**Updated Client Hooks**:

- `useProgressiveTranscription.ts` - Real-time STT via Cartesia WebSocket
- `useStreamingSpeech.ts` - Streaming TTS playback (comment update only)

**Environment Variable Change**:

- Removed: `DEEPGRAM_API_KEY`
- Added: `CARTESIA_API_KEY`

**Package Changes**:

- Removed: `@deepgram/sdk`
- No Cartesia SDK needed (using REST/WebSocket directly)

**Deleted Files**:

- `lib/deepgram.ts`
- `lib/hooks/useDeepgramVoiceAgent.ts`

### Streaming Audio Bug Fixes (CRITICAL)

- **SSE Line Buffering Fix**: Added proper line buffering to both `useStreamingConversation.ts` and `useStreamingSpeech.ts` to handle large base64 audio chunks that span multiple TCP packets. This was causing audio sentences to be silently dropped.
- **Skip Event System**: Implemented two-tier skip handling:
  1. Server sends explicit `type: "skip"` events when TTS generation fails
  2. Client has 2-second timeout fallback for missing indices
- **TTS Retry Logic**: Added retry mechanism with:
  - 2 retries with exponential backoff (500ms, 1000ms)
  - 8-second hard timeout per TTS request
  - Retries on 429/5xx errors
- **Safeguard Loop**: Server ensures all sentence indices are accounted for before closing stream

### Documentation & Testing

- **Architecture Documentation**: Created `lib/hooks/STREAMING_AUDIO_ARCHITECTURE.md` with comprehensive system documentation
- **Test Suite**: Added comprehensive tests in `__tests__/lib/streaming/` and `__tests__/api/streaming/`:
  - `useStreamingConversation.test.ts` - Client hook tests
  - `useStreamingSpeech.test.ts` - Client hook tests
  - `converse-stream.test.ts` - API endpoint tests
  - `speak-stream.test.ts` - API endpoint tests
- **Memory Bank Update**: Updated `03-systemPatterns.md` with streaming audio patterns and warnings

### Behavioral Interview Panel Enhancement

- **Full Hands-Free Support**: `BehavioralInterviewPanel.tsx` now matches the coding interview experience:
  - Uses `useStreamingConversation` for streaming follow-up responses
  - Uses `useStreamingSpeech` for initial question audio
  - Auto-listen mode activates after AI finishes speaking
  - Silence detection (1.5s) with continuation window (3.5s)
  - Sentence completeness checking extends wait time for incomplete thoughts
  - Tap-to-interrupt functionality during AI speech
  - Passive status indicators instead of manual buttons
- **Unified Conversation Flow**: Both coding and behavioral interviews now share the same smooth, natural conversation experience

### Previous Changes

- **Hands-Free Mode**: Removed "Speak to Interviewer" button - system auto-listens after AI finishes speaking
- **Natural Conversation Flow**: Enhanced system prompt with conversation dynamics
- **Sentence Completeness Check**: `isCompleteSentence()` function detects incomplete thoughts
- **Audio Timing**: Adjusted silence detection (1.5s) and continuation window (3.5s)
- **Auto-Listen**: After AI audio ends, system auto-starts listening after 800ms delay

## Critical Files (Protected by Tests)

- `lib/hooks/useStreamingConversation.ts`
- `lib/hooks/useStreamingSpeech.ts`
- `app/api/interview/converse-stream/route.ts`
- `app/api/interview/speak-stream/route.ts`
- `app/dashboard/components/BehavioralInterviewPanel.tsx`
- `app/dashboard/components/InterviewPanel.tsx`

## Next Steps

- Run full test suite: `npm test -- --testPathPattern=streaming`
- Monitor for any remaining audio issues in production
- Consider adding text input option alongside voice for accessibility
- System Design interviews (currently "Coming Soon") can use the same patterns when implemented
