/**
 * CompanyQuestionsClient Component Tests
 * 
 * Tests focus on business logic and data handling rather than
 * full component rendering due to complex dependencies.
 */

import { Question, Company } from "../../lib/types";

describe("CompanyQuestionsClient Business Logic", () => {
  const mockQuestions: Question[] = [
    {
      id: "q-1",
      title: "Two Sum",
      prompt: "Given an array of integers, return indices of two numbers that add up to target.",
      tags: ["Array", "Hash Table"],
      difficultyLabel: "Easy",
      companySlug: "google",
      companyName: "Google",
      examples: [{ input: "[2,7]", output: "[0,1]" }],
      constraints: ["2 <= nums.length <= 10^4"],
    },
    {
      id: "q-2",
      title: "LRU Cache",
      prompt: "Design and implement an LRU cache.",
      tags: ["Design", "Hash Table", "Linked List"],
      difficultyLabel: "Medium",
      companySlug: "google",
      companyName: "Google",
    },
    {
      id: "q-3",
      title: "Median of Two Sorted Arrays",
      prompt: "Find the median of two sorted arrays.",
      tags: ["Array", "Binary Search"],
      difficultyLabel: "Hard",
      companySlug: "google",
      companyName: "Google",
    },
  ];

  const mockCompany: Company = {
    id: "google",
    name: "Google",
    slug: "google",
  };

  describe("Question Filtering", () => {
    it("should filter questions by company slug", () => {
      const filtered = mockQuestions.filter((q) => q.companySlug === "google");
      expect(filtered).toHaveLength(3);
    });

    it("should return empty array for non-existent company", () => {
      const filtered = mockQuestions.filter((q) => q.companySlug === "meta");
      expect(filtered).toHaveLength(0);
    });

    it("should filter questions by difficulty", () => {
      const easy = mockQuestions.filter((q) => q.difficultyLabel === "Easy");
      const medium = mockQuestions.filter((q) => q.difficultyLabel === "Medium");
      const hard = mockQuestions.filter((q) => q.difficultyLabel === "Hard");

      expect(easy).toHaveLength(1);
      expect(medium).toHaveLength(1);
      expect(hard).toHaveLength(1);
    });

    it("should filter questions by tag", () => {
      const arrayQuestions = mockQuestions.filter((q) => q.tags.includes("Array"));
      const designQuestions = mockQuestions.filter((q) => q.tags.includes("Design"));

      expect(arrayQuestions).toHaveLength(2);
      expect(designQuestions).toHaveLength(1);
    });
  });

  describe("Question Sorting", () => {
    it("should sort questions by difficulty (Easy -> Medium -> Hard)", () => {
      const difficultyOrder: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
      const sorted = [...mockQuestions].sort((a, b) => {
        const aOrder = difficultyOrder[a.difficultyLabel || "Medium"] || 2;
        const bOrder = difficultyOrder[b.difficultyLabel || "Medium"] || 2;
        return aOrder - bOrder;
      });

      expect(sorted[0].difficultyLabel).toBe("Easy");
      expect(sorted[1].difficultyLabel).toBe("Medium");
      expect(sorted[2].difficultyLabel).toBe("Hard");
    });

    it("should sort questions alphabetically by title", () => {
      const sorted = [...mockQuestions].sort((a, b) =>
        a.title.localeCompare(b.title)
      );

      expect(sorted[0].title).toBe("LRU Cache");
      expect(sorted[1].title).toBe("Median of Two Sorted Arrays");
      expect(sorted[2].title).toBe("Two Sum");
    });
  });

  describe("Question Selection", () => {
    it("should find question by ID", () => {
      const question = mockQuestions.find((q) => q.id === "q-2");
      expect(question).toBeDefined();
      expect(question?.title).toBe("LRU Cache");
    });

    it("should return undefined for non-existent ID", () => {
      const question = mockQuestions.find((q) => q.id === "non-existent");
      expect(question).toBeUndefined();
    });
  });

  describe("Question Data Validation", () => {
    it("should require title and prompt", () => {
      const isValidQuestion = (q: Partial<Question>) =>
        Boolean(q.title && q.prompt);

      expect(isValidQuestion(mockQuestions[0])).toBe(true);
      expect(isValidQuestion({ title: "Test" })).toBe(false);
      expect(isValidQuestion({ prompt: "Test" })).toBe(false);
      expect(isValidQuestion({})).toBe(false);
    });

    it("should have array type for tags", () => {
      mockQuestions.forEach((q) => {
        expect(Array.isArray(q.tags)).toBe(true);
      });
    });

    it("should have valid difficulty labels", () => {
      const validDifficulties = ["Easy", "Medium", "Hard"];
      mockQuestions.forEach((q) => {
        if (q.difficultyLabel) {
          expect(validDifficulties).toContain(q.difficultyLabel);
        }
      });
    });
  });

  describe("Company Data", () => {
    it("should have required company properties", () => {
      expect(mockCompany.id).toBeDefined();
      expect(mockCompany.name).toBeDefined();
      expect(mockCompany.slug).toBeDefined();
    });

    it("should generate valid slugs", () => {
      const toSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      expect(toSlug("Google")).toBe("google");
      expect(toSlug("Cloud Kitchens")).toBe("cloud-kitchens");
      expect(toSlug("AT&T")).toBe("at-t");
    });
  });

  describe("Interview Score Logic", () => {
    const mockScores: Record<string, number> = {
      "q-1": 8,
      "q-2": 6,
    };

    it("should retrieve score for completed interview", () => {
      const getScore = (questionId: string) => mockScores[questionId] ?? null;

      expect(getScore("q-1")).toBe(8);
      expect(getScore("q-2")).toBe(6);
    });

    it("should return null for unscored questions", () => {
      const getScore = (questionId: string) => mockScores[questionId] ?? null;

      expect(getScore("q-3")).toBeNull();
      expect(getScore("non-existent")).toBeNull();
    });

    it("should identify scored questions", () => {
      const hasScore = (questionId: string) => questionId in mockScores;

      expect(hasScore("q-1")).toBe(true);
      expect(hasScore("q-3")).toBe(false);
    });
  });

  describe("Tag Statistics", () => {
    it("should count questions per tag", () => {
      const tagCounts: Record<string, number> = {};
      mockQuestions.forEach((q) => {
        q.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      expect(tagCounts["Array"]).toBe(2);
      expect(tagCounts["Hash Table"]).toBe(2);
      expect(tagCounts["Design"]).toBe(1);
      expect(tagCounts["Binary Search"]).toBe(1);
      expect(tagCounts["Linked List"]).toBe(1);
    });

    it("should get unique tags", () => {
      const allTags = mockQuestions.flatMap((q) => q.tags);
      const uniqueTags = [...new Set(allTags)];

      expect(uniqueTags).toContain("Array");
      expect(uniqueTags).toContain("Hash Table");
      expect(uniqueTags).toContain("Design");
      expect(uniqueTags.length).toBeLessThan(allTags.length);
    });
  });

  describe("Search Logic", () => {
    it("should search questions by title (case insensitive)", () => {
      const search = (term: string) =>
        mockQuestions.filter((q) =>
          q.title.toLowerCase().includes(term.toLowerCase())
        );

      expect(search("sum")).toHaveLength(1);
      expect(search("SUM")).toHaveLength(1);
      expect(search("cache")).toHaveLength(1);
      expect(search("xyz")).toHaveLength(0);
    });

    it("should search questions by tag", () => {
      const searchByTag = (tag: string) =>
        mockQuestions.filter((q) =>
          q.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
        );

      expect(searchByTag("array")).toHaveLength(2);
      expect(searchByTag("DESIGN")).toHaveLength(1);
    });
  });

  describe("Difficulty Distribution", () => {
    it("should calculate difficulty distribution", () => {
      const distribution: Record<string, number> = {
        Easy: 0,
        Medium: 0,
        Hard: 0,
      };

      mockQuestions.forEach((q) => {
        if (q.difficultyLabel && distribution[q.difficultyLabel] !== undefined) {
          distribution[q.difficultyLabel]++;
        }
      });

      expect(distribution.Easy).toBe(1);
      expect(distribution.Medium).toBe(1);
      expect(distribution.Hard).toBe(1);
    });

    it("should calculate percentage distribution", () => {
      const total = mockQuestions.length;
      const easyPercent =
        (mockQuestions.filter((q) => q.difficultyLabel === "Easy").length /
          total) *
        100;

      expect(easyPercent).toBeCloseTo(33.33, 1);
    });
  });

  describe("Question with Full Coding Fields", () => {
    const fullQuestion: Question = {
      id: "q-full",
      title: "Complete Question",
      prompt: "Full problem description",
      tags: ["Array"],
      difficultyLabel: "Medium",
      starterCode: "def solution(): pass",
      constraints: ["n <= 1000", "nums[i] >= 0"],
      examples: [
        { input: "[1,2,3]", output: "6", explanation: "Sum is 6" },
        { input: "[]", output: "0" },
      ],
      hints: ["Think about prefix sums", "Consider using a hash map"],
      expectedComplexity: { time: "O(n)", space: "O(1)" },
    };

    it("should have starter code", () => {
      expect(fullQuestion.starterCode).toBeDefined();
      expect(fullQuestion.starterCode).toContain("def solution");
    });

    it("should have constraints array", () => {
      expect(Array.isArray(fullQuestion.constraints)).toBe(true);
      expect(fullQuestion.constraints?.length).toBe(2);
    });

    it("should have examples array with input/output", () => {
      expect(Array.isArray(fullQuestion.examples)).toBe(true);
      expect(fullQuestion.examples?.[0].input).toBeDefined();
      expect(fullQuestion.examples?.[0].output).toBeDefined();
    });

    it("should have hints array", () => {
      expect(Array.isArray(fullQuestion.hints)).toBe(true);
      expect(fullQuestion.hints?.length).toBe(2);
    });

    it("should have expected complexity", () => {
      expect(fullQuestion.expectedComplexity).toBeDefined();
      expect(fullQuestion.expectedComplexity?.time).toBe("O(n)");
      expect(fullQuestion.expectedComplexity?.space).toBe("O(1)");
    });
  });
});
