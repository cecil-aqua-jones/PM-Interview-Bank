/**
 * TTS Preprocessor for Natural Speech
 * 
 * Adds SSML tags to text for more natural, human-like speech output.
 * Includes pauses at natural break points and handles special content.
 * 
 * Cartesia Sonic-3 SSML Support:
 * - <break time="Xms"/> or <break time="Xs"/> for pauses
 * - <speed ratio="X"/> for speed changes (0.6-1.5)
 * - <volume ratio="X"/> for volume changes (0.5-2.0)
 * - <emotion value="X"/> for emotion changes
 * - <spell>text</spell> for spelling out characters
 * - [laughter] for natural laughs
 */

/**
 * Pause durations in milliseconds for different contexts
 */
const PAUSE_DURATIONS = {
  SENTENCE_END: 350,      // After period, question mark, exclamation
  CLAUSE_BREAK: 200,      // After commas in longer clauses
  DASH_PAUSE: 250,        // Before/after em-dashes
  COLON_PAUSE: 300,       // After colons
  SEMICOLON_PAUSE: 280,   // After semicolons
  LIST_ITEM: 150,         // Between list items
  EMPHASIS_BEFORE: 100,   // Before emphasized words
  TECHNICAL_TERM: 120,    // Before technical terms
  SHORT_PAUSE: 80,        // Brief micro-pause
} as const;

/**
 * Technical terms that benefit from a brief pause before them
 * This helps listeners parse technical content more easily
 */
const TECHNICAL_TERMS = [
  'algorithm', 'complexity', 'hash map', 'hash table', 'binary search',
  'linked list', 'tree', 'graph', 'array', 'stack', 'queue',
  'recursion', 'iteration', 'dynamic programming', 'memoization',
  'time complexity', 'space complexity', 'Big O', 'O of n',
  'API', 'database', 'cache', 'server', 'client',
  'function', 'method', 'class', 'object', 'interface',
  'null', 'undefined', 'boolean', 'integer', 'string',
];

/**
 * Preprocess text for natural TTS output with SSML tags
 * Adds pauses at natural break points for more human-like speech
 * 
 * @param text - The text to preprocess
 * @param options - Preprocessing options
 * @returns Text with SSML tags for natural pauses
 */
export function preprocessForTTS(
  text: string,
  options: PreprocessOptions = {}
): string {
  const {
    addSentencePauses = true,
    addClausePauses = true,
    addTechnicalPauses = false, // Off by default - can make speech too slow
    preserveExistingSSML = true,
  } = options;

  let result = text;

  // Don't process if text already has SSML tags (unless we want to add more)
  if (!preserveExistingSSML && hasSSMLTags(result)) {
    return result;
  }

  // Add pauses after sentence endings (. ! ?)
  if (addSentencePauses) {
    result = addSentenceEndPauses(result);
  }

  // Add pauses at clause breaks (commas in longer clauses)
  if (addClausePauses) {
    result = addClauseBreakPauses(result);
  }

  // Add brief pauses before technical terms
  if (addTechnicalPauses) {
    result = addTechnicalTermPauses(result);
  }

  // Add pauses around dashes and other punctuation
  result = addPunctuationPauses(result);

  return result;
}

/**
 * Check if text already contains SSML tags
 */
function hasSSMLTags(text: string): boolean {
  return /<(break|speed|volume|emotion|spell)\s/i.test(text);
}

/**
 * Add pauses after sentence-ending punctuation
 */
function addSentenceEndPauses(text: string): string {
  // Match sentence endings followed by space and capital letter (new sentence)
  // Don't add break at the very end of text
  return text.replace(
    /([.!?]+)(\s+)(?=[A-Z])/g,
    `$1<break time="${PAUSE_DURATIONS.SENTENCE_END}ms"/>$2`
  );
}

/**
 * Add pauses after commas in longer clauses
 * Only adds pauses if the clause before the comma is substantial (>20 chars)
 */
function addClauseBreakPauses(text: string): string {
  // Split into potential clauses and process
  const parts = text.split(/,\s*/);
  
  if (parts.length <= 1) return text;
  
  let result = '';
  for (let i = 0; i < parts.length; i++) {
    result += parts[i];
    
    // Add pause after comma if this part is substantial
    if (i < parts.length - 1) {
      const pauseDuration = parts[i].length > 20 
        ? PAUSE_DURATIONS.CLAUSE_BREAK 
        : PAUSE_DURATIONS.SHORT_PAUSE;
      
      // Only add break for substantial clauses, otherwise just comma and space
      if (parts[i].length > 15) {
        result += `,<break time="${pauseDuration}ms"/> `;
      } else {
        result += ', ';
      }
    }
  }
  
  return result;
}

/**
 * Add brief pauses before technical terms for clarity
 */
function addTechnicalTermPauses(text: string): string {
  let result = text;
  
  for (const term of TECHNICAL_TERMS) {
    // Case-insensitive match with word boundary
    const regex = new RegExp(`(\\s)(${escapeRegex(term)})\\b`, 'gi');
    result = result.replace(
      regex,
      `$1<break time="${PAUSE_DURATIONS.TECHNICAL_TERM}ms"/>$2`
    );
  }
  
  return result;
}

/**
 * Add pauses around dashes, colons, semicolons
 */
function addPunctuationPauses(text: string): string {
  let result = text;
  
  // Em-dash or double-dash (indicates a parenthetical or dramatic pause)
  result = result.replace(
    /\s*[-–—]{1,2}\s*/g,
    `<break time="${PAUSE_DURATIONS.DASH_PAUSE}ms"/> `
  );
  
  // Colon (usually introduces something)
  result = result.replace(
    /:\s+/g,
    `:<break time="${PAUSE_DURATIONS.COLON_PAUSE}ms"/> `
  );
  
  // Semicolon (longer pause than comma)
  result = result.replace(
    /;\s*/g,
    `;<break time="${PAUSE_DURATIONS.SEMICOLON_PAUSE}ms"/> `
  );
  
  return result;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Options for TTS preprocessing
 */
export interface PreprocessOptions {
  /** Add pauses after sentence endings (default: true) */
  addSentencePauses?: boolean;
  /** Add pauses at clause breaks after commas (default: true) */
  addClausePauses?: boolean;
  /** Add pauses before technical terms (default: false) */
  addTechnicalPauses?: boolean;
  /** Preserve existing SSML tags in text (default: true) */
  preserveExistingSSML?: boolean;
}

/**
 * Light preprocessing - minimal pauses for shorter responses
 * Use for backchanneling and brief acknowledgments
 */
export function preprocessLight(text: string): string {
  return preprocessForTTS(text, {
    addSentencePauses: true,
    addClausePauses: false,
    addTechnicalPauses: false,
  });
}

/**
 * Standard preprocessing - balanced pauses for conversational speech
 * Use for most interview responses
 */
export function preprocessStandard(text: string): string {
  return preprocessForTTS(text, {
    addSentencePauses: true,
    addClausePauses: true,
    addTechnicalPauses: false,
  });
}

/**
 * Full preprocessing - all pauses for technical explanations
 * Use for reading questions or giving detailed feedback
 */
export function preprocessFull(text: string): string {
  return preprocessForTTS(text, {
    addSentencePauses: true,
    addClausePauses: true,
    addTechnicalPauses: true,
  });
}

/**
 * Add a natural thinking pause to text
 * Useful for making the AI seem like it's considering the response
 */
export function addThinkingPause(text: string, durationMs: number = 400): string {
  return `<break time="${durationMs}ms"/>${text}`;
}

/**
 * Wrap text with emotion SSML tag
 */
export function withEmotion(text: string, emotion: string): string {
  return `<emotion value="${emotion}"/>${text}`;
}

/**
 * Add speed control to text
 */
export function withSpeed(text: string, speedRatio: number): string {
  // Clamp to valid range
  const speed = Math.max(0.6, Math.min(1.5, speedRatio));
  return `<speed ratio="${speed}"/>${text}`;
}

/**
 * Spell out text (useful for IDs, codes, etc.)
 */
export function spellOut(text: string): string {
  return `<spell>${text}</spell>`;
}
