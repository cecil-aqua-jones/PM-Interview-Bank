/**
 * Greeting Detection Utility
 * 
 * Used to detect when a user says "hello" or similar greeting
 * to start the interview flow.
 */

// Patterns that indicate the user wants to start the interview
const GREETING_PATTERNS = [
  /^hello/i,
  /^hi\b/i,
  /^hey\b/i,
  /^good\s*(morning|afternoon|evening)/i,
  /^start/i,
  /^ready/i,
  /^let'?s\s*(go|begin|start)/i,
  /^begin/i,
  /^okay/i,
  /^ok\b/i,
  /^yes/i,
  /^yeah/i,
  /^yep/i,
  /^sure/i,
  /^greetings/i,
  /^howdy/i,
  /^what'?s\s*up/i,
  /^sup\b/i,
];

/**
 * Check if the given text contains a greeting pattern
 * indicating the user wants to start the interview
 */
export function isGreeting(text: string): boolean {
  if (!text || typeof text !== "string") {
    return false;
  }
  
  const trimmed = text.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return false;
  }
  
  return GREETING_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Extract the greeting word/phrase from the text
 * Returns null if no greeting is found
 */
export function extractGreeting(text: string): string | null {
  if (!text || typeof text !== "string") {
    return null;
  }
  
  const trimmed = text.trim();
  
  for (const pattern of GREETING_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Get the type of greeting for personalized AI response
 */
export type GreetingType = "formal" | "casual" | "eager" | "neutral";

export function getGreetingType(text: string): GreetingType {
  const trimmed = text.trim().toLowerCase();
  
  // Formal greetings
  if (/^good\s*(morning|afternoon|evening)/i.test(trimmed) || /^greetings/i.test(trimmed)) {
    return "formal";
  }
  
  // Eager/excited greetings
  if (/^let'?s\s*(go|begin|start)/i.test(trimmed) || /^ready/i.test(trimmed) || /^start/i.test(trimmed)) {
    return "eager";
  }
  
  // Casual greetings
  if (/^hey/i.test(trimmed) || /^what'?s\s*up/i.test(trimmed) || /^sup\b/i.test(trimmed) || /^howdy/i.test(trimmed)) {
    return "casual";
  }
  
  // Default neutral
  return "neutral";
}
