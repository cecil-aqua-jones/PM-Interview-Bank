# Progress

## Completed

- [x] Initialized memory bank.
- [x] Landing page build.
- [x] End-to-end PRD with social proof strategy.
- [x] Next.js landing page implementation.
- [x] Updated landing page copy with origin story section.
- [x] Added PM-specific module terminology and expanded origin story.
- [x] Built app shell UI with sidebar, cards, and detail view.
- [x] Added Supabase auth screen and Airtable data wiring.
- [x] Added interactive search, filters, selection, and stats in app UI.
- [x] Added multi-select tags, saved filters, and URL-synced state.
- [x] **Voice AI Migration: Deepgram → Cartesia (January 2026)**
  - Created `lib/cartesia.ts` with TTS/STT configuration
  - Updated all API routes (transcribe, speak, speak-stream, converse-stream, converse, clarify, voice-agent)
  - Updated client hooks (useProgressiveTranscription, useStreamingSpeech)
  - Removed Deepgram SDK and deprecated files
  - Updated middleware CSP for Cartesia domains

## Pending

- [ ] Connect purchase flow and analytics if required.
- [ ] Update `.env.example` with CARTESIA_API_KEY