# Tech Context

## Stack

- Next.js (App Router)
- React 18
- TypeScript
- CSS (global styles)

## Voice AI Services

- **TTS**: Cartesia Sonic-3 (WebSocket streaming, PCM s16le → WAV)
- **STT**: Cartesia ink-whisper (WebSocket for real-time, REST for batch)
- **LLM**: OpenAI GPT-4o-mini (conversation generation)

## Key Environment Variables

- `CARTESIA_API_KEY` - Cartesia voice AI services
- `OPENAI_API_KEY` - LLM for conversation/summarization
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase backend
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase auth

## Constraints

- Keep files under 500 lines when possible.
