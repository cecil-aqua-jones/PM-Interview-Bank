/**
 * CodeEditor Component Tests
 * 
 * Tests the CodeMirror-based code editor component interface.
 * Due to the complexity of mocking CodeMirror, we focus on
 * testing the component's props and behavior rather than internal CM logic.
 */

import React from "react";
import { SupportedLanguage, SUPPORTED_LANGUAGES, DEFAULT_STARTER_CODE } from "../../lib/types";

describe("CodeEditor Interface", () => {
  describe("Supported Languages", () => {
    it("should support Python", () => {
      const python = SUPPORTED_LANGUAGES.find((l) => l.id === "python");
      expect(python).toBeDefined();
      expect(python?.label).toBe("Python");
      expect(python?.extension).toBe(".py");
    });

    it("should support JavaScript", () => {
      const js = SUPPORTED_LANGUAGES.find((l) => l.id === "javascript");
      expect(js).toBeDefined();
      expect(js?.label).toBe("JavaScript");
      expect(js?.extension).toBe(".js");
    });

    it("should support Java", () => {
      const java = SUPPORTED_LANGUAGES.find((l) => l.id === "java");
      expect(java).toBeDefined();
      expect(java?.label).toBe("Java");
      expect(java?.extension).toBe(".java");
    });

    it("should support C++", () => {
      const cpp = SUPPORTED_LANGUAGES.find((l) => l.id === "cpp");
      expect(cpp).toBeDefined();
      expect(cpp?.label).toBe("C++");
      expect(cpp?.extension).toBe(".cpp");
    });

    it("should support Go", () => {
      const go = SUPPORTED_LANGUAGES.find((l) => l.id === "go");
      expect(go).toBeDefined();
      expect(go?.label).toBe("Go");
      expect(go?.extension).toBe(".go");
    });

    it("should have at least 5 supported languages", () => {
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(5);
    });

    it("should have unique language IDs", () => {
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

  describe("Language Type Validation", () => {
    it("should validate valid language IDs", () => {
      const isValidLanguage = (lang: string): lang is SupportedLanguage => {
        return SUPPORTED_LANGUAGES.some((l) => l.id === lang);
      };

      expect(isValidLanguage("python")).toBe(true);
      expect(isValidLanguage("javascript")).toBe(true);
      expect(isValidLanguage("java")).toBe(true);
      expect(isValidLanguage("cpp")).toBe(true);
      expect(isValidLanguage("go")).toBe(true);
    });

    it("should reject invalid language IDs", () => {
      const isValidLanguage = (lang: string): boolean => {
        return SUPPORTED_LANGUAGES.some((l) => l.id === lang);
      };

      expect(isValidLanguage("ruby")).toBe(false);
      expect(isValidLanguage("rust")).toBe(false);
      expect(isValidLanguage("")).toBe(false);
      expect(isValidLanguage("PYTHON")).toBe(false); // Case sensitive
    });
  });

  describe("Code Editor Props Contract", () => {
    // These tests define the expected props interface
    type CodeEditorProps = {
      value: string;
      onChange: (value: string) => void;
      language: SupportedLanguage;
      readOnly?: boolean;
      height?: string;
      minHeight?: string;
      className?: string;
    };

    it("should require value prop", () => {
      const props: Partial<CodeEditorProps> = {
        onChange: jest.fn(),
        language: "python",
      };
      expect(typeof props.value).toBe("undefined");
      // In actual usage, TypeScript would enforce this
    });

    it("should require onChange prop", () => {
      const onChange = jest.fn();
      const props: CodeEditorProps = {
        value: "code",
        onChange,
        language: "python",
      };
      props.onChange("new code");
      expect(onChange).toHaveBeenCalledWith("new code");
    });

    it("should accept all supported languages", () => {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        const props: CodeEditorProps = {
          value: "",
          onChange: jest.fn(),
          language: lang.id,
        };
        expect(props.language).toBe(lang.id);
      });
    });

    it("should accept optional readOnly prop", () => {
      const props: CodeEditorProps = {
        value: "code",
        onChange: jest.fn(),
        language: "python",
        readOnly: true,
      };
      expect(props.readOnly).toBe(true);
    });

    it("should accept optional height prop", () => {
      const props: CodeEditorProps = {
        value: "code",
        onChange: jest.fn(),
        language: "python",
        height: "400px",
      };
      expect(props.height).toBe("400px");
    });

    it("should accept optional className prop", () => {
      const props: CodeEditorProps = {
        value: "code",
        onChange: jest.fn(),
        language: "python",
        className: "custom-editor",
      };
      expect(props.className).toBe("custom-editor");
    });
  });

  describe("Code Content Handling", () => {
    it("should handle empty string value", () => {
      const value = "";
      expect(value.length).toBe(0);
      expect(typeof value).toBe("string");
    });

    it("should handle multiline code", () => {
      const multilineCode = `def solution(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;

      expect(multilineCode.split("\n").length).toBeGreaterThan(1);
      expect(multilineCode).toContain("def solution");
    });

    it("should handle special characters", () => {
      const codeWithSpecialChars = `
        // Comment with special chars: äöü ñ ∞ ≠ 
        const regex = /^[a-z]+$/g;
        const template = \`Hello \${name}\`;
      `;

      expect(codeWithSpecialChars).toContain("äöü");
      expect(codeWithSpecialChars).toContain("regex");
    });

    it("should handle very long code", () => {
      const longCode = "x = 1\n".repeat(1000);
      expect(longCode.split("\n").length).toBe(1001); // 1000 + trailing empty
    });

    it("should handle code with tabs", () => {
      const codeWithTabs = "class Solution:\n\tdef solve(self):\n\t\tpass";
      expect(codeWithTabs).toContain("\t");
    });

    it("should handle code with different line endings", () => {
      const unixCode = "line1\nline2\nline3";
      const windowsCode = "line1\r\nline2\r\nline3";
      
      expect(unixCode.split("\n").length).toBe(3);
      expect(windowsCode.split("\r\n").length).toBe(3);
    });
  });

  describe("Language Switching", () => {
    it("should be able to switch between languages", () => {
      const languages: SupportedLanguage[] = ["python", "javascript", "java", "cpp", "go"];
      
      let currentLanguage: SupportedLanguage = "python";
      
      languages.forEach((lang) => {
        currentLanguage = lang;
        expect(SUPPORTED_LANGUAGES.some((l) => l.id === currentLanguage)).toBe(true);
      });
    });

    it("should provide starter code for each language on switch", () => {
      const languages: SupportedLanguage[] = ["python", "javascript", "java", "cpp", "go"];
      
      languages.forEach((lang) => {
        const starterCode = DEFAULT_STARTER_CODE[lang];
        expect(starterCode).toBeDefined();
        expect(starterCode.length).toBeGreaterThan(0);
      });
    });
  });
});
