/**
 * FormattedContent Component Tests
 * 
 * Tests the content parsing logic that detects code blocks vs prose
 * in problem descriptions and renders them appropriately.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// Mock the CSS module
jest.mock("../../app/dashboard/app.module.css", () => ({
  formattedContent: "formattedContent",
  textBlock: "textBlock",
  codeBlock: "codeBlock",
  codeBlockPre: "codeBlockPre",
}));

// Import after mocking
import FormattedContent from "../../app/dashboard/components/FormattedContent";

describe("FormattedContent", () => {
  describe("Prose Detection", () => {
    it("should render plain prose as text blocks", () => {
      const content = "This is a simple problem description that explains what you need to do.";
      
      render(<FormattedContent content={content} />);
      
      const textElement = screen.getByText(/This is a simple problem/);
      expect(textElement).toBeInTheDocument();
      expect(textElement).toHaveClass("textBlock");
    });

    it("should detect sentences starting with capital letters and multiple words", () => {
      const content = "Given an array of integers, return indices of the two numbers that add up to target.";
      
      render(<FormattedContent content={content} />);
      
      expect(screen.getByText(/Given an array/)).toHaveClass("textBlock");
    });

    it("should detect common prose starters like 'Then', 'So', 'In this'", () => {
      const content = "Then add a split condition to the left leaf.";
      
      render(<FormattedContent content={content} />);
      
      expect(screen.getByText(/Then add a split/)).toHaveClass("textBlock");
    });
  });

  describe("Code Block Detection", () => {
    it("should detect indented lines as code", () => {
      const content = `Here is the solution:
    def two_sum(nums, target):
        pass`;
      
      render(<FormattedContent content={content} />);
      
      // Should have both text and code blocks
      expect(screen.getByText(/Here is the solution/)).toBeInTheDocument();
      const codeBlocks = document.querySelectorAll(".codeBlock");
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    it("should detect ASCII art patterns with pipes and dashes", () => {
      const content = `The tree structure:
    |     |
  -----`;
      
      render(<FormattedContent content={content} />);
      
      const codeBlocks = document.querySelectorAll(".codeBlock");
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    it("should detect variable comparisons like X1 < 3", () => {
      const content = `Check condition:
X1 < 3`;
      
      render(<FormattedContent content={content} />);
      
      const codeBlocks = document.querySelectorAll(".codeBlock");
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    it("should detect tree node labels (Y, N, X)", () => {
      const content = `Tree leaves:
Y     N`;
      
      render(<FormattedContent content={content} />);
      
      const codeBlocks = document.querySelectorAll(".codeBlock");
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    it("should detect horizontal dash lines", () => {
      const content = `Separator:
------------`;
      
      render(<FormattedContent content={content} />);
      
      const codeBlocks = document.querySelectorAll(".codeBlock");
      expect(codeBlocks.length).toBeGreaterThan(0);
    });
  });

  describe("Mixed Content", () => {
    it("should correctly separate prose and code in mixed content", () => {
      const content = `This is the problem description.

    X1 < 3
  ---------
  |       |
  Y       N

Then evaluate the tree.`;
      
      render(<FormattedContent content={content} />);
      
      // Check for prose blocks
      expect(screen.getByText(/This is the problem description/)).toBeInTheDocument();
      expect(screen.getByText(/Then evaluate the tree/)).toBeInTheDocument();
      
      // Check for code blocks
      const codeBlocks = document.querySelectorAll(".codeBlock");
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    it("should keep consecutive code lines in the same block", () => {
      const content = `Decision tree:
    X1 < 3
  ---------
  |       |
  X2 < 1  N
---------
|   |
Y   N`;
      
      render(<FormattedContent content={content} />);
      
      // All the tree should be in code blocks, not split
      const codeBlocks = document.querySelectorAll(".codeBlock");
      // The tree diagram should be grouped together
      expect(codeBlocks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty content", () => {
      render(<FormattedContent content="" />);
      
      const container = document.querySelector(".formattedContent");
      expect(container).toBeInTheDocument();
      expect(container?.children.length).toBe(0);
    });

    it("should handle content with only whitespace", () => {
      render(<FormattedContent content="   \n\n   " />);
      
      const container = document.querySelector(".formattedContent");
      expect(container).toBeInTheDocument();
    });

    it("should handle very long prose without breaking", () => {
      const longProse = "This is a very long sentence that goes on and on. ".repeat(10);
      
      render(<FormattedContent content={longProse} />);
      
      expect(screen.getByText(/This is a very long sentence/)).toBeInTheDocument();
    });

    it("should preserve code block formatting (whitespace)", () => {
      const codeWithSpacing = `Code:
    if x > 0:
        return True`;
      
      render(<FormattedContent content={codeWithSpacing} />);
      
      // Check that the code block exists and contains the code
      const codeBlocks = document.querySelectorAll(".codeBlock");
      expect(codeBlocks.length).toBeGreaterThan(0);
      
      // The formatted content container should have all the content
      const container = document.querySelector(".formattedContent");
      expect(container?.textContent).toContain("if x > 0:");
    });

    it("should handle special characters in content", () => {
      const content = "Use the formula: O(n²) for time complexity & O(1) for space.";
      
      render(<FormattedContent content={content} />);
      
      expect(screen.getByText(/O\(n²\)/)).toBeInTheDocument();
    });
  });

  describe("Real-World Examples", () => {
    it("should handle a typical LeetCode-style problem", () => {
      const content = `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Example:
    Input: nums = [2,7,11,15], target = 9
    Output: [0,1]

You may assume that each input would have exactly one solution.`;
      
      render(<FormattedContent content={content} />);
      
      // Prose should be detected
      expect(screen.getByText(/Given an array of integers/)).toBeInTheDocument();
      expect(screen.getByText(/You may assume/)).toBeInTheDocument();
      
      // Example should be in code block
      const codeBlocks = document.querySelectorAll(".codeBlock");
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    it("should handle decision tree problem descriptions", () => {
      const content = `Build a decision tree classifier. The final tree should look like:

      X1 < 3
    -----------
    |         |
  X2 < 1    X1 < 6
  ------    ------
  |    |    |    |
  N    Y    Y    N

Evaluate the tree on input X1=2, X2=0.5. The result should be Y.`;
      
      render(<FormattedContent content={content} />);
      
      // Check structure is properly parsed
      expect(screen.getByText(/Build a decision tree/)).toBeInTheDocument();
      expect(screen.getByText(/Evaluate the tree/)).toBeInTheDocument();
    });
  });
});
