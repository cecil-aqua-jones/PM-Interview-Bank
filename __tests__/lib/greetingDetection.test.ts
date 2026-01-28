import { isGreeting, extractGreeting, getGreetingType } from "@/lib/greetingDetection";

describe("greetingDetection", () => {
  describe("isGreeting", () => {
    // Standard greetings
    it.each([
      "hello",
      "Hello",
      "HELLO",
      "hello there",
      "Hello!",
      "hi",
      "Hi",
      "hi there",
      "hey",
      "Hey",
      "hey there",
      "greetings",
      "howdy",
    ])("should recognize '%s' as a greeting", (text) => {
      expect(isGreeting(text)).toBe(true);
    });

    // Formal greetings
    it.each([
      "good morning",
      "Good Morning",
      "good afternoon",
      "good evening",
      "Good morning!",
    ])("should recognize formal greeting '%s'", (text) => {
      expect(isGreeting(text)).toBe(true);
    });

    // Eager/start expressions
    it.each([
      "start",
      "Start",
      "ready",
      "Ready",
      "let's go",
      "Let's go",
      "lets go",
      "let's start",
      "let's begin",
      "begin",
    ])("should recognize eager expression '%s' as greeting", (text) => {
      expect(isGreeting(text)).toBe(true);
    });

    // Affirmative responses
    it.each([
      "yes",
      "Yes",
      "yeah",
      "yep",
      "sure",
      "okay",
      "ok",
    ])("should recognize affirmative '%s' as greeting", (text) => {
      expect(isGreeting(text)).toBe(true);
    });

    // Casual greetings
    it.each([
      "what's up",
      "whats up",
      "sup",
    ])("should recognize casual greeting '%s'", (text) => {
      expect(isGreeting(text)).toBe(true);
    });

    // Non-greetings (should return false)
    it.each([
      "",
      "   ",
      "how do I solve this?",
      "the algorithm should work",
      "I think we need to use a hash map",
      "goodbye",
      "thanks",
      "thank you",
      "help",
      "what is the time complexity?",
    ])("should NOT recognize '%s' as a greeting", (text) => {
      expect(isGreeting(text)).toBe(false);
    });

    // Edge cases
    it("should handle null/undefined input gracefully", () => {
      expect(isGreeting(null as unknown as string)).toBe(false);
      expect(isGreeting(undefined as unknown as string)).toBe(false);
    });

    it("should handle whitespace-padded greetings", () => {
      expect(isGreeting("  hello  ")).toBe(true);
      expect(isGreeting("\thello\n")).toBe(true);
    });
  });

  describe("extractGreeting", () => {
    it("should extract the greeting word/phrase", () => {
      expect(extractGreeting("hello there")).toBe("hello");
      expect(extractGreeting("Good morning!")).toBe("Good morning");
      expect(extractGreeting("let's go!")).toBe("let's go");
    });

    it("should return null for non-greetings", () => {
      expect(extractGreeting("how are you")).toBe(null);
      expect(extractGreeting("")).toBe(null);
    });

    it("should handle null/undefined input gracefully", () => {
      expect(extractGreeting(null as unknown as string)).toBe(null);
      expect(extractGreeting(undefined as unknown as string)).toBe(null);
    });
  });

  describe("getGreetingType", () => {
    it("should classify formal greetings", () => {
      expect(getGreetingType("good morning")).toBe("formal");
      expect(getGreetingType("Good afternoon")).toBe("formal");
      expect(getGreetingType("greetings")).toBe("formal");
    });

    it("should classify eager greetings", () => {
      expect(getGreetingType("let's go")).toBe("eager");
      expect(getGreetingType("ready")).toBe("eager");
      expect(getGreetingType("start")).toBe("eager");
    });

    it("should classify casual greetings", () => {
      expect(getGreetingType("hey")).toBe("casual");
      expect(getGreetingType("what's up")).toBe("casual");
      expect(getGreetingType("howdy")).toBe("casual");
    });

    it("should classify neutral greetings (default)", () => {
      expect(getGreetingType("hello")).toBe("neutral");
      expect(getGreetingType("hi")).toBe("neutral");
      expect(getGreetingType("yes")).toBe("neutral");
    });
  });
});
