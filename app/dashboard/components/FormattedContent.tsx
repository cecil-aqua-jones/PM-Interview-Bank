"use client";

import styles from "../app.module.css";

type ContentBlock = {
  type: "text" | "code";
  content: string;
};

/**
 * Improved content parser that detects code/diagram blocks by identifying PROSE
 * and treating non-prose as code when it appears in code-like context.
 */
function parseContent(text: string): ContentBlock[] {
  const lines = text.split("\n");
  const blocks: ContentBlock[] = [];
  
  // First pass: classify each line
  const lineTypes: ("prose" | "code" | "empty")[] = lines.map(line => {
    const trimmed = line.trim();
    
    if (trimmed === "") return "empty";
    
    // Definite prose indicators:
    // - Starts with capital letter and has multiple words with proper sentence structure
    // - Contains common prose patterns
    const isProse = (
      // Sentence that starts with capital and has 5+ words
      (/^[A-Z][a-z]/.test(trimmed) && trimmed.split(/\s+/).length >= 5) ||
      // Contains prose punctuation patterns
      /[.!?]\s+[A-Z]/.test(trimmed) ||
      // Ends with sentence punctuation and has multiple words
      (/[.!?:]\s*$/.test(trimmed) && trimmed.split(/\s+/).length >= 4) ||
      // Common prose starters
      /^(Then|So|In this|We |The |This |If |When |For |To |Note|However|Also|Finally|First|Next|After|Before|Now|Here|There|It |You |Your |A |An )/i.test(trimmed)
    );
    
    if (isProse) return "prose";
    
    // Definite code indicators:
    const isCode = (
      // Indented (2+ spaces)
      /^(\s{2,}|\t)/.test(line) ||
      // ASCII art characters
      /^[\s]*[-|+\\\/\[\]]+[\s]*$/.test(trimmed) ||
      /[-]{3,}/.test(trimmed) ||
      // Single letters/short tokens (tree nodes)
      /^[XYNM]\s*$/.test(trimmed) ||
      /^[XYNM]\s+[XYNM](\s+[XYNM])*\s*$/.test(trimmed) ||
      // Variable comparisons
      /^[A-Z]\d*\s*[<>=!]+\s*\d+/.test(trimmed) ||
      // Multiple pipes or dashes
      /\|.*\|/.test(trimmed) ||
      // Code-like short lines (less than 4 words, has operators)
      (trimmed.split(/\s+/).length <= 3 && /[<>=|+\-\/\\]/.test(trimmed))
    );
    
    if (isCode) return "code";
    
    // Ambiguous - will be resolved by context
    // Short lines (1-3 words) near code are likely code
    if (trimmed.split(/\s+/).length <= 3) {
      return "code"; // Default short lines to code, can be overridden
    }
    
    return "prose";
  });
  
  // Second pass: merge consecutive code/empty lines that form diagrams
  // and group prose together
  let currentBlock: ContentBlock | null = null;
  let inCodeRegion = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const type = lineTypes[i];
    
    // Look ahead/behind to determine if empty lines belong to code
    const prevType = i > 0 ? lineTypes[i - 1] : "prose";
    const nextType = i < lines.length - 1 ? lineTypes[i + 1] : "prose";
    
    let effectiveType: "prose" | "code";
    
    if (type === "empty") {
      // Empty lines belong to code if surrounded by code
      if (prevType === "code" || nextType === "code" || inCodeRegion) {
        effectiveType = "code";
      } else {
        effectiveType = "prose";
      }
    } else if (type === "code") {
      effectiveType = "code";
      inCodeRegion = true;
    } else {
      effectiveType = "prose";
      inCodeRegion = false;
    }
    
    // Add to appropriate block
    if (effectiveType === "code") {
      if (!currentBlock || currentBlock.type !== "code") {
        if (currentBlock && currentBlock.content.trim()) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: "code", content: line };
      } else {
        currentBlock.content += "\n" + line;
      }
    } else {
      if (!currentBlock || currentBlock.type !== "text") {
        if (currentBlock && currentBlock.content.trim()) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: "text", content: line };
      } else {
        currentBlock.content += "\n" + line;
      }
    }
  }
  
  if (currentBlock && currentBlock.content.trim()) {
    blocks.push(currentBlock);
  }
  
  // Clean up blocks
  return blocks
    .map(block => ({
      ...block,
      content: block.content.trim()
    }))
    .filter(block => block.content.length > 0);
}

type FormattedContentProps = {
  content: string;
};

export default function FormattedContent({ content }: FormattedContentProps) {
  const blocks = parseContent(content);

  return (
    <div className={styles.formattedContent}>
      {blocks.map((block, index) => {
        if (block.type === "code") {
          return (
            <div key={index} className={styles.codeBlock}>
              <pre className={styles.codeBlockPre}>
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }
        
        return (
          <p key={index} className={styles.textBlock}>
            {block.content}
          </p>
        );
      })}
    </div>
  );
}
