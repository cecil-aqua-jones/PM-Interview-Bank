export type Company = {
  id: string;
  name: string;
  slug: string;
  questionCount?: number;
};

export type CodeExample = {
  input: string;
  output: string;
  explanation?: string;
};

export type Question = {
  id: string;
  title: string;
  prompt: string;
  tags: string[];
  difficultyLabel?: "Easy" | "Medium" | "Hard" | string;
  difficultyScore?: number;
  companySlug?: string;
  companyName?: string;
  lastVerified?: string;
  // Coding-specific fields
  language?: string;
  starterCode?: string;
  constraints?: string[];
  examples?: CodeExample[];
  hints?: string[];
  expectedComplexity?: {
    time?: string;
    space?: string;
  };
  // Flag indicating this question may have incomplete/poorly formatted content
  // and could benefit from AI enhancement
  needsAIEnhancement?: boolean;
};

// Question type classification - 3 distinct interview formats
export type QuestionType = "coding" | "behavioral" | "system_design";

// Tags that indicate system design questions (checked FIRST - highest priority)
const SYSTEM_DESIGN_TAGS = [
  "system design",
  "design system",
  "architecture",
  "distributed system",
  "distributed systems",
  "scalability",
  "high availability",
  "load balancing",
  "microservices",
  "api design",
  "database design",
  "design a",
  "design an",
  "how would you design",
  "build a system",
  "scale",
  "infrastructure",
];

// Tags that indicate behavioral/communication questions
const BEHAVIORAL_TAGS = [
  "behavioral",
  "behaviour",
  "leadership",
  "teamwork",
  "conflict",
  "communication",
  "product sense",
  "product design",
  "estimation",
  "strategy",
  "prioritization",
  "stakeholder",
  "cross-functional",
  "culture fit",
  "values",
  "motivation",
  "experience",
  "tell me about",
  "describe a time",
  "how would you handle",
  "why do you",
];

// Tags that indicate coding questions
const CODING_TAGS = [
  "coding",
  "algorithm",
  "algorithms",
  "data structure",
  "data structures",
  "arrays",
  "strings",
  "linked list",
  "trees",
  "graphs",
  "dynamic programming",
  "dp",
  "recursion",
  "sorting",
  "searching",
  "binary search",
  "hash",
  "hashmap",
  "stack",
  "queue",
  "heap",
  "greedy",
  "backtracking",
  "bit manipulation",
  "math",
  "two pointers",
  "sliding window",
  "bfs",
  "dfs",
  "trie",
  "union find",
  "implementation",
  "sql query",
  "write a function",
  "implement",
];

/**
 * Determines the question type based on tags and content
 * Priority: Coding (if strong indicators) > System Design > Behavioral > Default (coding)
 * 
 * NOTE: We check coding FIRST if there are strong coding indicators, because
 * questions like "Design a HashMap" or "Design a LRU Cache" are coding problems,
 * not system design interviews.
 */
export function getQuestionType(question: Question): QuestionType {
  const tagsLower = question.tags.map(t => t.toLowerCase());
  const promptLower = question.prompt.toLowerCase();
  const titleLower = question.title.toLowerCase();
  
  // Check for CODING indicators
  const hasCodingTag = tagsLower.some(tag => 
    CODING_TAGS.some(codingTag => tag.includes(codingTag))
  );
  
  const hasStrongCodeIndicators = 
    promptLower.includes("write a function") ||
    promptLower.includes("implement a function") ||
    promptLower.includes("return the") ||
    promptLower.includes("given an array") ||
    promptLower.includes("given a string") ||
    promptLower.includes("given a linked list") ||
    promptLower.includes("input:") ||
    promptLower.includes("output:") ||
    promptLower.includes("example 1:") ||
    promptLower.includes("constraints:") ||
    promptLower.includes("time complexity") ||
    promptLower.includes("space complexity") ||
    promptLower.includes("o(n)") ||
    promptLower.includes("o(1)") ||
    promptLower.includes("o(log n)") ||
    question.starterCode !== undefined ||
    question.examples !== undefined ||
    question.constraints !== undefined;
  
  // 1. If there are STRONG coding indicators, it's definitely coding
  // This prevents "Design a HashMap" from being classified as system design
  if (hasCodingTag || hasStrongCodeIndicators) {
    return "coding";
  }
  
  // 2. Check for SYSTEM DESIGN
  const hasSystemDesignTag = tagsLower.some(tag => 
    SYSTEM_DESIGN_TAGS.some(sdTag => tag.includes(sdTag))
  );
  
  // System design indicators
  // NOTE: We already filtered out coding problems above, so generic "Design a/an"
  // patterns are now safe to include here. "Design a HashMap" already returned "coding"
  // due to coding indicators, so "Design a Chat Application" will correctly be system design.
  const hasSystemDesignIndicators = 
    titleLower.includes("system design") ||
    titleLower.includes("design a ") ||           // "Design a Chat Application" (space prevents "Design a")
    titleLower.includes("design an ") ||          // "Design an Elevator System"
    titleLower.includes("how would you design") || // "How would you design a URL shortener?"
    promptLower.includes("design a system") ||
    promptLower.includes("design a service") ||
    promptLower.includes("design a platform") ||
    promptLower.includes("design a distributed") ||
    promptLower.includes("how would you design") ||
    promptLower.includes("how would you architect") ||
    promptLower.includes("architect a system") ||
    promptLower.includes("architect a service") ||
    promptLower.includes("load balancing") ||
    promptLower.includes("microservice") ||
    promptLower.includes("api gateway") ||
    promptLower.includes("database schema for") ||
    promptLower.includes("millions of users") ||
    promptLower.includes("billions of") ||
    promptLower.includes("high availability") ||
    promptLower.includes("fault tolerance") ||
    promptLower.includes("horizontal scaling") ||
    promptLower.includes("vertical scaling") ||
    promptLower.includes("cap theorem") ||
    promptLower.includes("eventual consistency");
  
  if (hasSystemDesignTag || hasSystemDesignIndicators) {
    return "system_design";
  }
  
  // 3. Check for BEHAVIORAL indicators
  const hasBehavioralTag = tagsLower.some(tag => 
    BEHAVIORAL_TAGS.some(behavioralTag => tag.includes(behavioralTag))
  );
  
  const hasBehavioralContent =
    titleLower.startsWith("tell me about") ||
    titleLower.startsWith("describe") ||
    titleLower.startsWith("how would you") ||
    titleLower.startsWith("why") ||
    titleLower.startsWith("what is your") ||
    promptLower.includes("tell me about a time") ||
    promptLower.includes("describe a situation") ||
    promptLower.includes("give an example of");
  
  if (hasBehavioralTag || hasBehavioralContent) {
    return "behavioral";
  }
  
  // Default to coding for FAANG interview context
  return "coding";
}

export type SupportedLanguage = "python" | "javascript" | "java" | "cpp" | "go";

export const SUPPORTED_LANGUAGES: { id: SupportedLanguage; label: string; extension: string }[] = [
  { id: "python", label: "Python", extension: ".py" },
  { id: "javascript", label: "JavaScript", extension: ".js" },
  { id: "java", label: "Java", extension: ".java" },
  { id: "cpp", label: "C++", extension: ".cpp" },
  { id: "go", label: "Go", extension: ".go" },
];

export const DEFAULT_STARTER_CODE: Record<SupportedLanguage, string> = {
  python: `def solution(nums):
    # Your code here
    pass`,
  javascript: `function solution(nums) {
    // Your code here
}`,
  java: `class Solution {
    public int[] solution(int[] nums) {
        // Your code here
        return new int[]{};
    }
}`,
  cpp: `class Solution {
public:
    vector<int> solution(vector<int>& nums) {
        // Your code here
        return {};
    }
};`,
  go: `func solution(nums []int) []int {
    // Your code here
    return []int{}
}`,
};
