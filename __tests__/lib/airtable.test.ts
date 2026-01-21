/**
 * Airtable Data Fetching Tests
 * 
 * Tests the data mapping, parsing, and filtering logic
 * for questions fetched from Airtable.
 */

// Note: These tests focus on the data transformation logic,
// not the actual API calls (which would require integration tests)

describe("Airtable Data Mapping", () => {
  // Mock record structure matching Airtable API response
  const createMockRecord = (fields: Record<string, any>) => ({
    id: `rec${Math.random().toString(36).substr(2, 9)}`,
    createdTime: new Date().toISOString(),
    fields,
  });

  describe("toSlug Function", () => {
    // Test the slug generation logic
    const toSlug = (name: string): string =>
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    it("should convert company name to lowercase slug", () => {
      expect(toSlug("Google")).toBe("google");
      expect(toSlug("Meta")).toBe("meta");
    });

    it("should replace spaces with hyphens", () => {
      expect(toSlug("Cloud Kitchens")).toBe("cloud-kitchens");
    });

    it("should remove special characters", () => {
      expect(toSlug("AT&T")).toBe("at-t");
      expect(toSlug("Yahoo!")).toBe("yahoo");
    });

    it("should handle multiple spaces and special chars", () => {
      expect(toSlug("Company   Name  Inc.")).toBe("company-name-inc");
    });

    it("should trim leading/trailing hyphens", () => {
      expect(toSlug(" Google ")).toBe("google");
      expect(toSlug("--Google--")).toBe("google");
    });
  });

  describe("normalizeTags Function", () => {
    const normalizeTags = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value.filter((tag) => typeof tag === "string");
      }
      if (typeof value === "string") {
        return value.split(",").map((tag) => tag.trim()).filter(Boolean);
      }
      return [];
    };

    it("should pass through string arrays", () => {
      expect(normalizeTags(["coding", "system design"])).toEqual(["coding", "system design"]);
    });

    it("should split comma-separated strings", () => {
      expect(normalizeTags("coding, system design, onsite")).toEqual([
        "coding",
        "system design",
        "onsite",
      ]);
    });

    it("should filter out non-string values from arrays", () => {
      expect(normalizeTags(["coding", 123, null, "design"])).toEqual(["coding", "design"]);
    });

    it("should handle empty input", () => {
      expect(normalizeTags("")).toEqual([]);
      expect(normalizeTags([])).toEqual([]);
      expect(normalizeTags(null)).toEqual([]);
      expect(normalizeTags(undefined)).toEqual([]);
    });

    it("should trim whitespace from tags", () => {
      expect(normalizeTags("  coding  ,  design  ")).toEqual(["coding", "design"]);
    });
  });

  describe("parseConstraints Function", () => {
    const parseConstraints = (value: unknown): string[] | undefined => {
      if (!value) return undefined;
      if (Array.isArray(value)) return value.map(String);
      if (typeof value === "string") {
        return value.split(/[\n;]/).map((c) => c.trim()).filter(Boolean);
      }
      return undefined;
    };

    it("should parse newline-separated constraints", () => {
      const input = "1 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9";
      expect(parseConstraints(input)).toEqual([
        "1 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
      ]);
    });

    it("should parse semicolon-separated constraints", () => {
      const input = "n >= 1; m <= 100; k > 0";
      expect(parseConstraints(input)).toEqual(["n >= 1", "m <= 100", "k > 0"]);
    });

    it("should pass through arrays", () => {
      expect(parseConstraints(["constraint1", "constraint2"])).toEqual([
        "constraint1",
        "constraint2",
      ]);
    });

    it("should return undefined for empty input", () => {
      expect(parseConstraints("")).toBeUndefined();
      expect(parseConstraints(null)).toBeUndefined();
    });
  });

  describe("parseHints Function", () => {
    const parseHints = (value: unknown): string[] | undefined => {
      if (!value) return undefined;
      if (Array.isArray(value)) return value.map(String);
      if (typeof value === "string") {
        return value.split(/[\n,]/).map((h) => h.trim()).filter(Boolean);
      }
      return undefined;
    };

    it("should parse comma-separated hints", () => {
      expect(parseHints("Use hash map, Think about time complexity")).toEqual([
        "Use hash map",
        "Think about time complexity",
      ]);
    });

    it("should parse newline-separated hints", () => {
      expect(parseHints("Hint 1\nHint 2\nHint 3")).toEqual(["Hint 1", "Hint 2", "Hint 3"]);
    });

    it("should return undefined for empty input", () => {
      expect(parseHints("")).toBeUndefined();
      expect(parseHints(null)).toBeUndefined();
    });
  });

  describe("parseExamples Function", () => {
    type CodeExample = {
      input: string;
      output: string;
      explanation?: string;
    };

    const parseExamples = (value: unknown): CodeExample[] | undefined => {
      if (!value) return undefined;
      
      if (Array.isArray(value)) {
        return value.map((ex) => ({
          input: String(ex.input ?? ""),
          output: String(ex.output ?? ""),
          explanation: ex.explanation ? String(ex.explanation) : undefined,
        }));
      }
      
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.map((ex) => ({
              input: String(ex.input ?? ""),
              output: String(ex.output ?? ""),
              explanation: ex.explanation ? String(ex.explanation) : undefined,
            }));
          }
        } catch {
          // Not JSON, try formatted text
          const examples: CodeExample[] = [];
          const blocks = value.split("---").filter(Boolean);
          for (const block of blocks) {
            const inputMatch = block.match(/Input:\s*(.+?)(?=Output:|$)/is);
            const outputMatch = block.match(/Output:\s*(.+?)(?=Explanation:|$)/is);
            const explanationMatch = block.match(/Explanation:\s*(.+?)$/is);
            if (inputMatch && outputMatch) {
              examples.push({
                input: inputMatch[1].trim(),
                output: outputMatch[1].trim(),
                explanation: explanationMatch ? explanationMatch[1].trim() : undefined,
              });
            }
          }
          return examples.length > 0 ? examples : undefined;
        }
      }
      
      return undefined;
    };

    it("should parse JSON array of examples", () => {
      const json = JSON.stringify([
        { input: "[2,7,11,15], 9", output: "[0,1]", explanation: "2+7=9" },
      ]);
      
      const result = parseExamples(json);
      expect(result).toHaveLength(1);
      expect(result?.[0].input).toBe("[2,7,11,15], 9");
      expect(result?.[0].output).toBe("[0,1]");
      expect(result?.[0].explanation).toBe("2+7=9");
    });

    it("should parse array of example objects directly", () => {
      const examples = [
        { input: "nums = [1,2,3]", output: "6" },
        { input: "nums = []", output: "0" },
      ];
      
      const result = parseExamples(examples);
      expect(result).toHaveLength(2);
    });

    it("should parse formatted text examples", () => {
      const text = `Input: [2,7,11,15], target=9
Output: [0,1]
Explanation: nums[0] + nums[1] = 9
---
Input: [3,2,4], target=6
Output: [1,2]`;
      
      const result = parseExamples(text);
      expect(result).toHaveLength(2);
      expect(result?.[0].input).toContain("[2,7,11,15]");
      expect(result?.[1].input).toContain("[3,2,4]");
    });

    it("should return undefined for empty input", () => {
      expect(parseExamples("")).toBeUndefined();
      expect(parseExamples(null)).toBeUndefined();
    });

    it("should handle examples without explanation", () => {
      const examples = [{ input: "test", output: "result" }];
      const result = parseExamples(examples);
      expect(result?.[0].explanation).toBeUndefined();
    });
  });

  describe("Question Mapping", () => {
    it("should map Question field to title", () => {
      const record = createMockRecord({
        Question: "Two Sum",
        Content: "Find two numbers that add up to target",
        Company: "Google",
      });

      // Simulate toQuestion mapping
      const title = record.fields.Question ?? record.fields.Title ?? "Untitled";
      expect(title).toBe("Two Sum");
    });

    it("should map Content field to prompt", () => {
      const record = createMockRecord({
        Question: "Two Sum",
        Content: "Given an array of integers...",
        Company: "Google",
      });

      const prompt = record.fields.Content ?? record.fields.Description ?? record.fields.Question ?? "";
      expect(prompt).toBe("Given an array of integers...");
    });

    it("should derive difficulty from Frequency field", () => {
      // Frequency 1-3 = Easy, 4-6 = Medium, 7+ = Hard
      const getDifficultyFromFrequency = (freq: number): string => {
        if (freq >= 7) return "Hard";
        if (freq >= 4) return "Medium";
        return "Easy";
      };

      expect(getDifficultyFromFrequency(2)).toBe("Easy");
      expect(getDifficultyFromFrequency(5)).toBe("Medium");
      expect(getDifficultyFromFrequency(8)).toBe("Hard");
    });

    it("should generate company slug from Company field", () => {
      const toSlug = (name: string): string =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      expect(toSlug("Google")).toBe("google");
      expect(toSlug("Cloud Kitchens")).toBe("cloud-kitchens");
    });
  });

  describe("Question Filtering", () => {
    it("should filter out questions without title", () => {
      const questions = [
        { id: "1", title: "Valid Title", prompt: "Content here" },
        { id: "2", title: "Untitled", prompt: "Content here" },
        { id: "3", title: "", prompt: "Content here" },
      ];

      const valid = questions.filter(
        (q) => q.title && q.title !== "Untitled" && q.prompt && q.prompt.trim().length > 0
      );

      expect(valid).toHaveLength(1);
      expect(valid[0].id).toBe("1");
    });

    it("should filter out questions without content", () => {
      const questions = [
        { id: "1", title: "Title", prompt: "Valid content" },
        { id: "2", title: "Title", prompt: "" },
        { id: "3", title: "Title", prompt: "   " },
      ];

      const valid = questions.filter(
        (q) => q.title && q.title !== "Untitled" && q.prompt && q.prompt.trim().length > 0
      );

      expect(valid).toHaveLength(1);
      expect(valid[0].id).toBe("1");
    });

    it("should keep questions with both title and content", () => {
      const questions = [
        { id: "1", title: "Two Sum", prompt: "Given an array..." },
        { id: "2", title: "Merge Sort", prompt: "Implement merge sort..." },
      ];

      const valid = questions.filter(
        (q) => q.title && q.title !== "Untitled" && q.prompt && q.prompt.trim().length > 0
      );

      expect(valid).toHaveLength(2);
    });
  });
});

describe("Company Derivation", () => {
  it("should derive unique companies from questions", () => {
    const questions = [
      { companySlug: "google", companyName: "Google" },
      { companySlug: "google", companyName: "Google" },
      { companySlug: "meta", companyName: "Meta" },
      { companySlug: "amazon", companyName: "Amazon" },
    ];

    const companyMap = new Map<string, { name: string; count: number }>();

    for (const q of questions) {
      if (q.companySlug && q.companyName) {
        const existing = companyMap.get(q.companySlug);
        if (existing) {
          existing.count++;
        } else {
          companyMap.set(q.companySlug, { name: q.companyName, count: 1 });
        }
      }
    }

    expect(companyMap.size).toBe(3);
    expect(companyMap.get("google")?.count).toBe(2);
    expect(companyMap.get("meta")?.count).toBe(1);
  });

  it("should sort companies alphabetically by name", () => {
    const companies = [
      { name: "Zebra", slug: "zebra" },
      { name: "Apple", slug: "apple" },
      { name: "Meta", slug: "meta" },
    ];

    const sorted = companies.sort((a, b) => a.name.localeCompare(b.name));

    expect(sorted[0].name).toBe("Apple");
    expect(sorted[1].name).toBe("Meta");
    expect(sorted[2].name).toBe("Zebra");
  });
});
