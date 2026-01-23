# Active Context

## Current Focus
- Hands-free conversational interview experience

## Recent Changes (Session)
- **Hands-Free Mode**: Removed "Speak to Interviewer" button - system auto-listens after AI finishes speaking
- **Natural Conversation Flow**: Enhanced system prompt with conversation dynamics:
  - Analyzes if user's thought is complete before responding
  - Uses nudging responses ("Go on...", "Mm-hm") for incomplete thoughts
  - Check-in protocol for ambiguous answers
  - Ultra-concise responses (1-2 sentences max)
- **Sentence Completeness Check**: `isCompleteSentence()` function detects incomplete thoughts and extends wait time
- **Audio Timing**: Adjusted silence detection (1.5s) and continuation window (3.5s) for natural pauses
- **Auto-Listen**: After AI audio ends and queue is empty, system automatically starts listening after 800ms delay
- **UI States**: Simplified to show passive status indicators instead of buttons
  - "Listening..." when recording
  - "Waiting..." when idle
  - "Tap to interrupt" when AI is speaking

## Next Steps
- Test and validate hands-free conversation flow end-to-end
- Consider adding text input option alongside voice for accessibility
- Validate copy accuracy and any required legal disclaimers
