/**
 * Types and Constants Tests
 * 
 * Tests for type definitions, supported languages,
 * and default starter code templates.
 */

import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_STARTER_CODE,
  Question,
  CodeExample,
  Company,
} from "../../lib/types";

describe("Supported Languages", () => {
  it("should include all major programming languages", () => {
    const languageIds = SUPPORTED_LANGUAGES.map((lang) => lang.id);

    expect(languageIds).toContain("python");
    expect(languageIds).toContain("javascript");
    expect(languageIds).toContain("java");
    expect(languageIds).toContain("cpp");
    expect(languageIds).toContain("go");
  });

  it("should have human-readable labels", () => {
    const python = SUPPORTED_LANGUAGES.find((l) => l.id === "python");
    const cpp = SUPPORTED_LANGUAGES.find((l) => l.id === "cpp");

    expect(python?.label).toBe("Python");
    expect(cpp?.label).toBe("C++");
  });

  it("should have correct file extensions", () => {
    const extensions = SUPPORTED_LANGUAGES.map((l) => l.extension);

    expect(extensions).toContain(".py");
    expect(extensions).toContain(".js");
    expect(extensions).toContain(".java");
    expect(extensions).toContain(".cpp");
    expect(extensions).toContain(".go");
  });

  it("should have at least 5 supported languages", () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(5);
  });

  it("should have unique IDs", () => {
    const ids = SUPPORTED_LANGUAGES.map((l) => l.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });
});

describe("Default Starter Code", () => {
  it("should have starter code for all supported languages", () => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(DEFAULT_STARTER_CODE[lang.id]).toBeDefined();
      expect(typeof DEFAULT_STARTER_CODE[lang.id]).toBe("string");
      expect(DEFAULT_STARTER_CODE[lang.id].length).toBeGreaterThan(0);
    });
  });

  describe("Python Starter Code", () => {
    it("should define a function", () => {
      expect(DEFAULT_STARTER_CODE.python).toContain("def solution");
    });

    it("should include a comment placeholder", () => {
      expect(DEFAULT_STARTER_CODE.python).toContain("# Your code here");
    });

    it("should include pass statement", () => {
      expect(DEFAULT_STARTER_CODE.python).toContain("pass");
    });
  });

  describe("JavaScript Starter Code", () => {
    it("should define a function", () => {
      expect(DEFAULT_STARTER_CODE.javascript).toContain("function solution");
    });

    it("should include a comment placeholder", () => {
      expect(DEFAULT_STARTER_CODE.javascript).toContain("// Your code here");
    });
  });

  describe("Java Starter Code", () => {
    it("should define a class", () => {
      expect(DEFAULT_STARTER_CODE.java).toContain("class Solution");
    });

    it("should define a public method", () => {
      expect(DEFAULT_STARTER_CODE.java).toContain("public");
    });
  });

  describe("C++ Starter Code", () => {
    it("should define a class", () => {
      expect(DEFAULT_STARTER_CODE.cpp).toContain("class Solution");
    });

    it("should include public access specifier", () => {
      expect(DEFAULT_STARTER_CODE.cpp).toContain("public:");
    });

    it("should use vector type", () => {
      expect(DEFAULT_STARTER_CODE.cpp).toContain("vector");
    });
  });

  describe("Go Starter Code", () => {
    it("should define a func", () => {
      expect(DEFAULT_STARTER_CODE.go).toContain("func solution");
    });

    it("should use slice type for arrays", () => {
      expect(DEFAULT_STARTER_CODE.go).toContain("[]int");
    });
  });
});

describe("Question Type", () => {
  it("should allow creation of valid Question objects", () => {
    const question: Question = {
      id: "rec123",
      title: "Two Sum",
      prompt: "Given an array of integers...",
      tags: ["Array", "Hash Table"],
      difficultyLabel: "Easy",
      companySlug: "google",
      companyName: "Google",
    };

    expect(question.id).toBe("rec123");
    expect(question.title).toBe("Two Sum");
    expect(question.tags).toHaveLength(2);
  });

  it("should support optional coding-specific fields", () => {
    const question: Question = {
      id: "rec456",
      title: "LRU Cache",
      prompt: "Design and implement an LRU cache",
      tags: ["Design", "Hash Table"],
      difficultyLabel: "Medium",
      starterCode: "class LRUCache:",
      constraints: ["1 <= capacity <= 3000"],
      examples: [{ input: "[[1,1]]", output: "null" }],
      hints: ["Use a hash map with doubly linked list"],
      expectedComplexity: { time: "O(1)", space: "O(capacity)" },
    };

    expect(question.starterCode).toBeDefined();
    expect(question.constraints).toHaveLength(1);
    expect(question.examples).toHaveLength(1);
    expect(question.hints).toHaveLength(1);
    expect(question.expectedComplexity?.time).toBe("O(1)");
  });

  it("should allow undefined optional fields", () => {
    const question: Question = {
      id: "rec789",
      title: "Simple Question",
      prompt: "Just a simple question",
      tags: [],
    };

    expect(question.difficultyLabel).toBeUndefined();
    expect(question.starterCode).toBeUndefined();
    expect(question.constraints).toBeUndefined();
    expect(question.expectedComplexity).toBeUndefined();
  });
});

describe("CodeExample Type", () => {
  it("should require input and output", () => {
    const example: CodeExample = {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
    };

    expect(example.input).toBeDefined();
    expect(example.output).toBeDefined();
  });

  it("should allow optional explanation", () => {
    const exampleWithExplanation: CodeExample = {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    };

    const exampleWithoutExplanation: CodeExample = {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
    };

    expect(exampleWithExplanation.explanation).toBeDefined();
    expect(exampleWithoutExplanation.explanation).toBeUndefined();
  });
});

describe("Company Type", () => {
  it("should require id, name, and slug", () => {
    const company: Company = {
      id: "google",
      name: "Google",
      slug: "google",
    };

    expect(company.id).toBe("google");
    expect(company.name).toBe("Google");
    expect(company.slug).toBe("google");
  });

  it("should allow optional questionCount", () => {
    const companyWithCount: Company = {
      id: "meta",
      name: "Meta",
      slug: "meta",
      questionCount: 150,
    };

    const companyWithoutCount: Company = {
      id: "amazon",
      name: "Amazon",
      slug: "amazon",
    };

    expect(companyWithCount.questionCount).toBe(150);
    expect(companyWithoutCount.questionCount).toBeUndefined();
  });
});

describe("Type Guards and Validation", () => {
  it("should validate SupportedLanguage type", () => {
    const isValidLanguage = (lang: string): lang is SupportedLanguage => {
      return SUPPORTED_LANGUAGES.some((l) => l.id === lang);
    };

    expect(isValidLanguage("python")).toBe(true);
    expect(isValidLanguage("javascript")).toBe(true);
    expect(isValidLanguage("ruby")).toBe(false);
    expect(isValidLanguage("")).toBe(false);
  });

  it("should get default starter code for any supported language", () => {
    const getStarterCode = (lang: SupportedLanguage): string => {
      return DEFAULT_STARTER_CODE[lang];
    };

    expect(getStarterCode("python")).toContain("def");
    expect(getStarterCode("java")).toContain("class");
    expect(getStarterCode("go")).toContain("func");
  });
});
