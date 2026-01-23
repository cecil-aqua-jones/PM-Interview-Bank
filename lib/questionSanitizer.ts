/**
 * Question Content Sanitizer
 * 
 * Improves incomplete or poorly formatted question content from Airtable.
 * Uses AI to detect and format code blocks, fix truncated content, and
 * ensure questions are complete and readable.
 */

import { Question } from "./types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Common patterns that indicate incomplete content
const INCOMPLETE_PATTERNS = [
  /\.{3,}$/,                          // Ends with ...
  /\.\.\s*$/,                          // Ends with .. 
  /\[truncated\]/i,                    // Explicit truncation marker
  /\[continued\]/i,                    // Continuation marker
  /etc\.?\s*$/i,                       // Ends with "etc"
  /and so on\.?\s*$/i,                 // Ends with "and so on"
  /\.\s*\.\s*$/,                       // Spaced dots at end
  /<incomplete>/i,                     // Explicit incomplete marker
];

// Patterns that suggest unformatted code
const CODE_INDICATORS = [
  /def\s+\w+\s*\(/,                    // Python function
  /function\s+\w+\s*\(/,               // JavaScript function
  /class\s+\w+/,                       // Class definition
  /const\s+\w+\s*=/,                   // JS const
  /let\s+\w+\s*=/,                     // JS let
  /var\s+\w+\s*=/,                     // JS var
  /public\s+(static\s+)?void/,         // Java method
  /import\s+[\w.]+/,                   // Import statement
  /from\s+\w+\s+import/,               // Python import
  /\breturn\s+[\w\[\]{}]+;/,           // Return statement
  /for\s*\(\s*\w+/,                    // For loop
  /while\s*\(/,                        // While loop
  /if\s*\([^)]+\)\s*{/,                // If statement with brace
  /=>\s*{/,                            // Arrow function
  /\[\s*\d+\s*\]/,                     // Array indexing
  /\w+\s*\[\s*:\s*\]/,                 // Python slicing
  /print\s*\(/,                        // Print statement
  /console\.log\s*\(/,                 // Console log
  /System\.out\.print/,                // Java print
];

// Check if content appears incomplete
export function isIncomplete(content: string): boolean {
  if (!content || content.trim().length < 50) return true;
  
  return INCOMPLETE_PATTERNS.some(pattern => pattern.test(content.trim()));
}

// Check if content has unformatted code blocks
export function hasUnformattedCode(content: string): boolean {
  // If already has proper code blocks, check for code outside them
  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');
  
  return CODE_INDICATORS.some(pattern => pattern.test(withoutCodeBlocks));
}

// Quick sanitization without AI (for performance)
export function quickSanitize(content: string): string {
  if (!content) return content;
  
  let sanitized = content;
  
  // Fix common formatting issues
  sanitized = sanitized
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Fix multiple consecutive newlines (max 2)
    .replace(/\n{3,}/g, '\n\n')
    // Fix spaces before punctuation
    .replace(/\s+([.,;:!?])/g, '$1')
    // Trim whitespace
    .trim();
  
  // Try to auto-detect and wrap obvious code blocks
  sanitized = autoWrapCodeBlocks(sanitized);
  
  return sanitized;
}

// Attempt to wrap obvious code blocks in markdown
function autoWrapCodeBlocks(content: string): string {
  // Skip if already has code blocks
  if (/```/.test(content)) return content;
  
  const lines = content.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let detectedLanguage = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Detect start of code block
    const isCodeLine = isLikelyCodeLine(trimmedLine);
    
    if (isCodeLine && !inCodeBlock) {
      inCodeBlock = true;
      detectedLanguage = detectLanguage(trimmedLine);
      codeBlockLines = [line];
    } else if (inCodeBlock) {
      // Check if this line continues the code block
      if (isCodeLine || trimmedLine === '' || /^[{}()\[\];]$/.test(trimmedLine)) {
        codeBlockLines.push(line);
      } else {
        // End of code block
        if (codeBlockLines.length >= 2) {
          result.push(`\`\`\`${detectedLanguage}`);
          result.push(...codeBlockLines);
          result.push('```');
        } else {
          // Too short, just add as is
          result.push(...codeBlockLines);
        }
        result.push(line);
        inCodeBlock = false;
        codeBlockLines = [];
      }
    } else {
      result.push(line);
    }
  }
  
  // Handle trailing code block
  if (inCodeBlock && codeBlockLines.length >= 2) {
    result.push(`\`\`\`${detectedLanguage}`);
    result.push(...codeBlockLines);
    result.push('```');
  } else if (codeBlockLines.length > 0) {
    result.push(...codeBlockLines);
  }
  
  return result.join('\n');
}

// Check if a line looks like code
function isLikelyCodeLine(line: string): boolean {
  if (!line) return false;
  
  // Strong code indicators
  const strongIndicators = [
    /^(def|class|function|const|let|var|import|from|return|if|for|while|public|private)\s/,
    /^(async|await|export|module)\s/,
    /^\s*(def|class|function)\s+\w+/,
    /=>\s*[{(]/,
    /\)\s*{$/,
    /^\s*[{}]\s*$/,
    /^\s*return\s/,
    /console\.(log|error|warn)/,
    /print\s*\(/,
    /^#\s*(include|define|pragma)/,
  ];
  
  return strongIndicators.some(pattern => pattern.test(line));
}

// Detect programming language from code
function detectLanguage(code: string): string {
  if (/\bdef\s+\w+\s*\(|print\s*\(|from\s+\w+\s+import/.test(code)) return 'python';
  if (/\bfunction\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|=>/.test(code)) return 'javascript';
  if (/public\s+(static\s+)?void|System\.out/.test(code)) return 'java';
  if (/func\s+\w+|:=|package\s+main/.test(code)) return 'go';
  if (/fn\s+\w+|let\s+mut|impl\s+/.test(code)) return 'rust';
  if (/#include|std::/.test(code)) return 'cpp';
  return '';
}

/**
 * AI-powered question sanitization
 * Uses GPT to improve incomplete content and format code blocks
 */
export async function sanitizeWithAI(question: Question): Promise<{
  title: string;
  prompt: string;
  wasModified: boolean;
  changes: string[];
}> {
  const changes: string[] = [];
  let wasModified = false;
  
  // Start with quick sanitization
  let sanitizedPrompt = quickSanitize(question.prompt);
  let sanitizedTitle = question.title.trim();
  
  // Check if AI enhancement is needed
  const needsAI = isIncomplete(question.prompt) || hasUnformattedCode(sanitizedPrompt);
  
  if (!needsAI || !OPENAI_API_KEY) {
    // Return quick-sanitized version
    if (sanitizedPrompt !== question.prompt) {
      wasModified = true;
      changes.push("Applied basic formatting fixes");
    }
    return { title: sanitizedTitle, prompt: sanitizedPrompt, wasModified, changes };
  }
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Use gpt-4o-mini for lowest cost ($0.00015/1K input, $0.0006/1K output)
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Fix coding interview questions. Return JSON: {"title":"fixed title","prompt":"fixed content","changes":["change1"]}

Rules:
- Complete truncated content logically
- Wrap code in \`\`\`language blocks
- Fix formatting, preserve meaning
- Be conservative - minimal changes`
          },
          {
            role: "user",
            content: `Title: ${question.title}\n\nContent:\n${question.prompt}${isIncomplete(question.prompt) ? "\n[TRUNCATED]" : ""}${hasUnformattedCode(sanitizedPrompt) ? "\n[HAS CODE]" : ""}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error("[Sanitizer] AI request failed:", response.status);
      return { title: sanitizedTitle, prompt: sanitizedPrompt, wasModified: false, changes: [] };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return { title: sanitizedTitle, prompt: sanitizedPrompt, wasModified: false, changes: [] };
    }

    // Parse AI response
    try {
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      const result = JSON.parse(cleanContent);
      
      return {
        title: result.title || sanitizedTitle,
        prompt: result.prompt || sanitizedPrompt,
        wasModified: true,
        changes: result.changes || ["AI-enhanced formatting"],
      };
    } catch (parseError) {
      console.error("[Sanitizer] Failed to parse AI response:", parseError);
      return { title: sanitizedTitle, prompt: sanitizedPrompt, wasModified: false, changes: [] };
    }
  } catch (error) {
    console.error("[Sanitizer] AI sanitization error:", error);
    return { title: sanitizedTitle, prompt: sanitizedPrompt, wasModified: false, changes: [] };
  }
}

/**
 * Batch sanitize multiple questions
 * Uses parallel processing for efficiency
 */
export async function batchSanitize(
  questions: Question[],
  options: { useAI?: boolean; maxConcurrent?: number } = {}
): Promise<Map<string, { title: string; prompt: string; wasModified: boolean }>> {
  const { useAI = false, maxConcurrent = 5 } = options;
  const results = new Map<string, { title: string; prompt: string; wasModified: boolean }>();
  
  if (!useAI) {
    // Quick sanitize all questions (fast, synchronous)
    for (const q of questions) {
      const sanitizedPrompt = quickSanitize(q.prompt);
      results.set(q.id, {
        title: q.title.trim(),
        prompt: sanitizedPrompt,
        wasModified: sanitizedPrompt !== q.prompt,
      });
    }
    return results;
  }
  
  // AI sanitization with concurrency limit
  const chunks: Question[][] = [];
  for (let i = 0; i < questions.length; i += maxConcurrent) {
    chunks.push(questions.slice(i, i + maxConcurrent));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (q) => {
      const result = await sanitizeWithAI(q);
      results.set(q.id, {
        title: result.title,
        prompt: result.prompt,
        wasModified: result.wasModified,
      });
    });
    
    await Promise.all(promises);
  }
  
  return results;
}

/**
 * Format content for display with proper code highlighting
 * This is a client-safe version that doesn't use AI
 */
export function formatForDisplay(content: string): string {
  if (!content) return content;
  
  let formatted = quickSanitize(content);
  
  // Ensure inline code is properly formatted
  // Pattern: backticks around code-like words that aren't already in backticks
  formatted = formatted.replace(
    /(?<!`)\b(null|undefined|true|false|None|True|False|nil)\b(?!`)/g,
    '`$1`'
  );
  
  // Format common method/function references
  formatted = formatted.replace(
    /(?<!`)\b(\w+)\(\)(?!`)/g,
    '`$1()`'
  );
  
  // Format O(n) complexity notation
  formatted = formatted.replace(
    /(?<!`)\bO\([^)]+\)(?!`)/g,
    match => `\`${match}\``
  );
  
  return formatted;
}
