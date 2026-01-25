# Streaming Audio Architecture

> **CRITICAL**: This document describes the core audio streaming system for the interview feature.
> Any changes to the files described here MUST be thoroughly tested to ensure no regression.
> The audio streaming system is foundational to the user experience.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Responsibilities](#component-responsibilities)
4. [Critical Design Decisions](#critical-design-decisions)
5. [SSE Protocol](#sse-protocol)
6. [Error Handling & Recovery](#error-handling--recovery)
7. [Testing Requirements](#testing-requirements)
8. [Common Pitfalls](#common-pitfalls)

---

## System Overview

The interview feature uses a **sentence-based streaming TTS** system that provides real-time audio
playback during AI interviewer responses. This reduces perceived latency by 50-70% compared to
generating all audio before playback.

### Two Streaming Paths

| Path | Purpose | Server Endpoint | Client Hook |
|------|---------|-----------------|-------------|
| **Speak Stream** | Initial question reading | `/api/interview/speak-stream` | `useStreamingSpeech` |
| **Converse Stream** | Conversation responses | `/api/interview/converse-stream` | `useStreamingConversation` |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT SIDE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐         ┌─────────────────────────┐            │
│  │ useStreamingSpeech  │         │ useStreamingConversation │            │
│  └─────────┬───────────┘         └───────────┬─────────────┘            │
│            │                                  │                          │
│            │  SSE Connection                  │  SSE Connection          │
│            │  (with line buffering)           │  (with line buffering)   │
│            ▼                                  ▼                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                    Audio Queue System                        │        │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │        │
│  │  │ Audio 0 │→ │ Audio 1 │→ │ Audio 2 │→ │ Audio N │ → Play  │        │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │        │
│  │                                                              │        │
│  │  Features:                                                   │        │
│  │  • Ordered playback (waits for index N before playing)      │        │
│  │  • Skip handling (server-marked or timeout-based)           │        │
│  │  • 2-second timeout for missing chunks                      │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP POST (SSE)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVER SIDE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │              Streaming API Endpoints                         │        │
│  │  /api/interview/speak-stream                                 │        │
│  │  /api/interview/converse-stream                              │        │
│  └─────────────────────────────────────────────────────────────┘        │
│            │                                                             │
│            │  1. Parse request                                           │
│            │  2. Stream LLM response (converse) or split text (speak)   │
│            │  3. Detect sentence boundaries                              │
│            │  4. Generate TTS in parallel                                │
│            ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │              TTS Generation (Parallel)                       │        │
│  │                                                              │        │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │        │
│  │  │  TTS 0  │  │  TTS 1  │  │  TTS 2  │  │  TTS N  │         │        │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘         │        │
│  │       │            │            │            │               │        │
│  │       ▼            ▼            ▼            ▼               │        │
│  │  ┌─────────────────────────────────────────────────┐        │        │
│  │  │         Ordered Results Map                      │        │        │
│  │  │  { 0: audio, 1: null, 2: audio, 3: audio }      │        │        │
│  │  └─────────────────────────────────────────────────┘        │        │
│  │                      │                                       │        │
│  │                      ▼                                       │        │
│  │  ┌─────────────────────────────────────────────────┐        │        │
│  │  │    trySendOrderedAudio()                         │        │        │
│  │  │    Sends audio/skip events in order              │        │        │
│  │  └─────────────────────────────────────────────────┘        │        │
│  │                                                              │        │
│  │  Features:                                                   │        │
│  │  • 8-second timeout per TTS request                         │        │
│  │  • 2 retries with exponential backoff                       │        │
│  │  • Explicit skip events for failed TTS                      │        │
│  │  • Safeguard loop ensures all indices accounted for         │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ TTS API
                                    ▼
                        ┌─────────────────────┐
                        │   OpenAI TTS API    │
                        │   (tts-1 model)     │
                        └─────────────────────┘
```

---

## Component Responsibilities

### Server-Side Components

#### `/api/interview/speak-stream/route.ts`
- **Purpose**: Streams TTS for initial question reading
- **Input**: Question title, content, category
- **Output**: SSE stream with `info`, `audio`, `skip`, `done` events
- **Key Features**:
  - Summarizes long questions using GPT
  - Splits text into sentences
  - Generates TTS in parallel
  - Sends results in order with skip events for failures

#### `/api/interview/converse-stream/route.ts`
- **Purpose**: Streams LLM response with concurrent TTS
- **Input**: Question context, user message, conversation history
- **Output**: SSE stream with `token`, `audio`, `skip`, `done` events
- **Key Features**:
  - Streams LLM tokens in real-time
  - Detects sentence boundaries during streaming
  - Generates TTS for each sentence immediately
  - Maintains ordered output despite parallel TTS

### Client-Side Components

#### `lib/hooks/useStreamingSpeech.ts`
- **Purpose**: Manages initial question audio playback
- **Key Features**:
  - SSE line buffering (CRITICAL for large audio chunks)
  - Ordered playback queue
  - Server-marked skip handling
  - 2-second timeout for missing chunks
  - Progress tracking

#### `lib/hooks/useStreamingConversation.ts`
- **Purpose**: Manages conversation response streaming
- **Key Features**:
  - SSE line buffering (CRITICAL for large audio chunks)
  - Real-time text display via tokens
  - Ordered audio playback
  - Skip handling (server and timeout-based)

---

## Critical Design Decisions

### 1. SSE Line Buffering (CRITICAL)

**Problem**: Large base64-encoded audio chunks can span multiple TCP packets.

**Solution**: Buffer incomplete lines across read() calls:

```typescript
let buffer = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";  // Keep incomplete line
  
  for (const line of lines) { ... }
}
```

**NEVER** remove this buffering pattern.

### 2. Ordered Audio Playback

**Problem**: TTS requests complete in random order.

**Solution**: Use index-based ordering:
- Server: `ttsResults.set(index, audio)` → `trySendOrderedAudio()`
- Client: `nextExpectedIndexRef` tracks what index to play next

### 3. Skip Events

**Problem**: TTS can fail, leaving the client waiting forever.

**Solution**: Two-tier skip system:
1. **Server-side**: Explicit `type: "skip"` events for failed TTS
2. **Client-side**: 2-second timeout if server skip is missed

### 4. Retry Logic

**Problem**: TTS API can be flaky (rate limits, server errors).

**Solution**: 
- 2 retries per request
- Exponential backoff (500ms, 1000ms)
- 8-second hard timeout

---

## SSE Protocol

### Event Types

| Event | Direction | Purpose |
|-------|-----------|---------|
| `info` | Server→Client | Initial metadata (total sentences) |
| `token` | Server→Client | LLM streaming token (converse only) |
| `audio` | Server→Client | Base64 audio with index |
| `skip` | Server→Client | TTS failed for index |
| `done` | Server→Client | Stream complete |
| `error` | Server→Client | Error occurred |

### Event Formats

```typescript
// Info event (speak-stream)
{ type: "info", totalSentences: 4, fullText: "..." }

// Token event (converse-stream only)
{ type: "token", content: "Hello" }

// Audio event
{ type: "audio", index: 0, sentence: "Hello world.", audio: "base64..." }

// Skip event
{ type: "skip", index: 1 }

// Done event
{ type: "done", fullText: "Complete response text" }

// Error event
{ error: "Error message" }
```

---

## Error Handling & Recovery

### Server-Side

1. **TTS Timeout (8s)**: Abort request, retry up to 2 times
2. **TTS HTTP Error**: Retry on 429/5xx, give up on 4xx
3. **TTS Network Error**: Retry with exponential backoff
4. **All Retries Failed**: Store `null` in results, send `skip` event
5. **Safeguard Loop**: After Promise.all, ensure all indices accounted for

### Client-Side

1. **Server Skip Event**: Mark index in `skippedIndicesRef`, advance playback
2. **Missing Index Timeout (2s)**: Skip to next available index
3. **Audio Playback Error**: Log error, continue to next
4. **Network Error**: Display error state, allow retry

---

## Testing Requirements

### Unit Tests Required

1. **SSE Line Buffering**
   - Test chunked data spanning multiple reads
   - Test large base64 payloads split across chunks
   - Test normal single-chunk messages

2. **Ordered Playback**
   - Test out-of-order arrival
   - Test in-order arrival
   - Test mixed with skips

3. **Skip Handling**
   - Test server-sent skip events
   - Test timeout-based skipping
   - Test mixed audio and skips

4. **TTS Retry Logic**
   - Test successful retry after failure
   - Test max retries exhausted
   - Test timeout handling

### Integration Tests Required

1. **Full Stream Flow**
   - Start stream, receive all events, verify order
   - Test with simulated TTS failures
   - Test client abort mid-stream

---

## Common Pitfalls

### DO NOT:

1. ❌ Remove SSE line buffering - causes lost audio chunks
2. ❌ Process events without checking index order - causes wrong playback order
3. ❌ Skip the safeguard loop - causes hanging clients
4. ❌ Remove skip events - causes infinite waits
5. ❌ Process buffer without `lines.pop()` - corrupts multi-chunk messages
6. ❌ Use `chunk.split("\n")` directly - loses buffered data

### DO:

1. ✅ Always buffer incomplete SSE lines
2. ✅ Send skip events for ALL failed TTS
3. ✅ Use index-based ordering for playback
4. ✅ Implement both server and client-side skip handling
5. ✅ Add safeguard loops after Promise.all
6. ✅ Log extensively for debugging

---

## File Inventory

| File | Purpose | Critical? |
|------|---------|-----------|
| `lib/hooks/useStreamingConversation.ts` | Conversation audio streaming | **YES** |
| `lib/hooks/useStreamingSpeech.ts` | Question audio streaming | **YES** |
| `app/api/interview/converse-stream/route.ts` | Conversation API | **YES** |
| `app/api/interview/speak-stream/route.ts` | Question API | **YES** |

---

## Change Checklist

Before modifying any streaming audio component:

- [ ] Read this architecture document
- [ ] Understand the SSE line buffering requirement
- [ ] Run all existing tests
- [ ] Add tests for new functionality
- [ ] Verify audio plays in correct order
- [ ] Test with slow network (throttled DevTools)
- [ ] Test TTS failure scenarios
- [ ] Update this document if architecture changes

---

*Last Updated: January 2026*
*Authors: Engineering Team*
