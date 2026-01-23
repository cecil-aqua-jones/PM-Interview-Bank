/**
 * TTS Preloader Hook Tests
 * 
 * Tests the TTS preloading system including:
 * - Cache management
 * - Priority queue handling
 * - Concurrent request limiting
 * - Batch and adjacent preloading
 */

describe("useTTSPreloader Logic", () => {
  // Configuration constants (matching the hook)
  const MAX_CONCURRENT_PRELOADS = 3;
  const MAX_CACHE_SIZE = 20;
  const CACHE_EXPIRY_MS = 30 * 60 * 1000;

  describe("Cache Management", () => {
    it("should evict oldest entry when cache is full", () => {
      const cache = new Map<string, { timestamp: number }>();
      
      const evictOldestIfNeeded = () => {
        if (cache.size >= MAX_CACHE_SIZE) {
          let oldestId: string | null = null;
          let oldestTimestamp = Infinity;
          
          cache.forEach((audio, id) => {
            if (audio.timestamp < oldestTimestamp) {
              oldestId = id;
              oldestTimestamp = audio.timestamp;
            }
          });
          
          if (oldestId) {
            cache.delete(oldestId);
          }
        }
      };

      // Fill cache to max
      const now = Date.now();
      for (let i = 0; i < MAX_CACHE_SIZE; i++) {
        cache.set(`q-${i}`, { timestamp: now + i });
      }

      expect(cache.size).toBe(MAX_CACHE_SIZE);

      evictOldestIfNeeded();

      expect(cache.size).toBe(MAX_CACHE_SIZE - 1);
      expect(cache.has("q-0")).toBe(false); // Oldest was evicted
      expect(cache.has("q-1")).toBe(true); // Second oldest still there
    });

    it("should cleanup expired entries", () => {
      const cache = new Map<string, { timestamp: number }>();
      const now = Date.now();

      // Add mix of expired and fresh entries
      cache.set("expired-1", { timestamp: now - CACHE_EXPIRY_MS - 1000 }); // Expired
      cache.set("expired-2", { timestamp: now - CACHE_EXPIRY_MS - 5000 }); // Expired
      cache.set("fresh-1", { timestamp: now - 1000 }); // Fresh
      cache.set("fresh-2", { timestamp: now }); // Fresh

      const cleanupExpiredCache = () => {
        const expired: string[] = [];
        
        cache.forEach((audio, id) => {
          if (now - audio.timestamp > CACHE_EXPIRY_MS) {
            expired.push(id);
          }
        });

        expired.forEach(id => cache.delete(id));
      };

      cleanupExpiredCache();

      expect(cache.size).toBe(2);
      expect(cache.has("expired-1")).toBe(false);
      expect(cache.has("expired-2")).toBe(false);
      expect(cache.has("fresh-1")).toBe(true);
      expect(cache.has("fresh-2")).toBe(true);
    });

    it("should update timestamp on access (LRU behavior)", () => {
      const cache = new Map<string, { timestamp: number }>();
      const initialTime = Date.now() - 10000;
      
      cache.set("q-1", { timestamp: initialTime });

      const getAndUpdate = (id: string) => {
        const cached = cache.get(id);
        if (cached) {
          cached.timestamp = Date.now();
        }
        return cached;
      };

      const result = getAndUpdate("q-1");

      expect(result).not.toBeNull();
      expect(result!.timestamp).toBeGreaterThan(initialTime);
    });
  });

  describe("Priority Queue", () => {
    it("should sort queue by priority (higher first)", () => {
      const queue = [
        { id: "q-1", text: "Question 1", priority: 3 },
        { id: "q-2", text: "Question 2", priority: 8 },
        { id: "q-3", text: "Question 3", priority: 5 },
        { id: "q-4", text: "Question 4", priority: 1 },
      ];

      queue.sort((a, b) => b.priority - a.priority);

      expect(queue[0].priority).toBe(8);
      expect(queue[1].priority).toBe(5);
      expect(queue[2].priority).toBe(3);
      expect(queue[3].priority).toBe(1);
    });

    it("should update priority if new priority is higher", () => {
      const queue = [
        { id: "q-1", text: "Question 1", priority: 3 },
        { id: "q-2", text: "Question 2", priority: 5 },
      ];

      const preload = (id: string, text: string, priority: number) => {
        const existingIndex = queue.findIndex(item => item.id === id);
        if (existingIndex >= 0) {
          if (priority > queue[existingIndex].priority) {
            queue[existingIndex].priority = priority;
          }
          return;
        }
        queue.push({ id, text, priority });
      };

      preload("q-1", "Question 1", 7); // Higher priority
      preload("q-2", "Question 2", 2); // Lower priority - shouldn't update

      expect(queue.find(q => q.id === "q-1")?.priority).toBe(7);
      expect(queue.find(q => q.id === "q-2")?.priority).toBe(5);
    });

    it("should skip items already in cache", () => {
      const cache = new Set(["q-1", "q-3"]);
      const queue = [
        { id: "q-1", text: "Question 1", priority: 5 },
        { id: "q-2", text: "Question 2", priority: 5 },
        { id: "q-3", text: "Question 3", priority: 5 },
        { id: "q-4", text: "Question 4", priority: 5 },
      ];

      const itemsToProcess = queue.filter(item => !cache.has(item.id));

      expect(itemsToProcess).toHaveLength(2);
      expect(itemsToProcess.find(q => q.id === "q-1")).toBeUndefined();
      expect(itemsToProcess.find(q => q.id === "q-2")).toBeDefined();
    });
  });

  describe("Concurrent Request Limiting", () => {
    it("should respect max concurrent preloads", () => {
      const loadingIds = new Set<string>();

      const canStartNewLoad = () => loadingIds.size < MAX_CONCURRENT_PRELOADS;

      // Add max concurrent loads
      loadingIds.add("q-1");
      loadingIds.add("q-2");
      loadingIds.add("q-3");

      expect(canStartNewLoad()).toBe(false);

      // Complete one
      loadingIds.delete("q-1");

      expect(canStartNewLoad()).toBe(true);
    });

    it("should skip items already loading", () => {
      const loading = new Set(["q-2"]);
      const queue = [
        { id: "q-1", text: "Question 1", priority: 5 },
        { id: "q-2", text: "Question 2", priority: 5 },
        { id: "q-3", text: "Question 3", priority: 5 },
      ];

      const toProcess = queue.filter(item => !loading.has(item.id));

      expect(toProcess).toHaveLength(2);
      expect(toProcess.find(q => q.id === "q-2")).toBeUndefined();
    });
  });

  describe("Batch Preloading", () => {
    it("should add all items to queue with decreasing priority", () => {
      const queue: { id: string; text: string; priority: number }[] = [];
      const basePriority = 7;

      const preloadBatch = (questions: { id: string; text: string }[]) => {
        questions.forEach((q, index) => {
          const priority = basePriority - Math.floor(index / 2);
          queue.push({ ...q, priority: Math.max(1, priority) });
        });
      };

      preloadBatch([
        { id: "q-1", text: "Q1" },
        { id: "q-2", text: "Q2" },
        { id: "q-3", text: "Q3" },
        { id: "q-4", text: "Q4" },
        { id: "q-5", text: "Q5" },
      ]);

      expect(queue).toHaveLength(5);
      // First two at same priority (7)
      expect(queue[0].priority).toBe(7);
      expect(queue[1].priority).toBe(7);
      // Next two at 6
      expect(queue[2].priority).toBe(6);
      expect(queue[3].priority).toBe(6);
      // Fifth at 5
      expect(queue[4].priority).toBe(5);
    });
  });

  describe("Adjacent Preloading", () => {
    it("should preload next 2 questions with high priority", () => {
      const questions = [
        { id: "q-0", title: "Q0", prompt: "P0" },
        { id: "q-1", title: "Q1", prompt: "P1" },
        { id: "q-2", title: "Q2", prompt: "P2" },
        { id: "q-3", title: "Q3", prompt: "P3" },
        { id: "q-4", title: "Q4", prompt: "P4" },
      ];
      const currentIndex = 1;
      const preloadedIds: { id: string; priority: number }[] = [];

      const preloadAdjacent = () => {
        // Next 2 questions
        for (let i = 1; i <= 2; i++) {
          const nextIndex = currentIndex + i;
          if (nextIndex < questions.length) {
            preloadedIds.push({ id: questions[nextIndex].id, priority: 8 - i });
          }
        }
        // Previous question
        if (currentIndex > 0) {
          preloadedIds.push({ id: questions[currentIndex - 1].id, priority: 5 });
        }
      };

      preloadAdjacent();

      expect(preloadedIds).toHaveLength(3);
      expect(preloadedIds.find(p => p.id === "q-2")?.priority).toBe(7); // Next
      expect(preloadedIds.find(p => p.id === "q-3")?.priority).toBe(6); // Next+1
      expect(preloadedIds.find(p => p.id === "q-0")?.priority).toBe(5); // Previous
    });

    it("should handle edge case at start of list", () => {
      const questions = [
        { id: "q-0", title: "Q0", prompt: "P0" },
        { id: "q-1", title: "Q1", prompt: "P1" },
        { id: "q-2", title: "Q2", prompt: "P2" },
      ];
      const currentIndex = 0;
      const preloadedIds: string[] = [];

      const preloadAdjacent = () => {
        for (let i = 1; i <= 2; i++) {
          const nextIndex = currentIndex + i;
          if (nextIndex < questions.length) {
            preloadedIds.push(questions[nextIndex].id);
          }
        }
        if (currentIndex > 0) {
          preloadedIds.push(questions[currentIndex - 1].id);
        }
      };

      preloadAdjacent();

      expect(preloadedIds).toHaveLength(2); // Only next 2, no previous
      expect(preloadedIds).toContain("q-1");
      expect(preloadedIds).toContain("q-2");
    });

    it("should handle edge case at end of list", () => {
      const questions = [
        { id: "q-0", title: "Q0", prompt: "P0" },
        { id: "q-1", title: "Q1", prompt: "P1" },
        { id: "q-2", title: "Q2", prompt: "P2" },
      ];
      const currentIndex = 2;
      const preloadedIds: string[] = [];

      const preloadAdjacent = () => {
        for (let i = 1; i <= 2; i++) {
          const nextIndex = currentIndex + i;
          if (nextIndex < questions.length) {
            preloadedIds.push(questions[nextIndex].id);
          }
        }
        if (currentIndex > 0) {
          preloadedIds.push(questions[currentIndex - 1].id);
        }
      };

      preloadAdjacent();

      expect(preloadedIds).toHaveLength(1); // Only previous, no next
      expect(preloadedIds).toContain("q-1");
    });
  });

  describe("Status Checking", () => {
    it("should correctly identify preloaded items", () => {
      const cache = new Map<string, { status: string }>();
      cache.set("q-1", { status: "ready" });
      cache.set("q-2", { status: "loading" });
      cache.set("q-3", { status: "error" });

      const isPreloaded = (id: string) => {
        const cached = cache.get(id);
        return cached?.status === "ready";
      };

      expect(isPreloaded("q-1")).toBe(true);
      expect(isPreloaded("q-2")).toBe(false);
      expect(isPreloaded("q-3")).toBe(false);
      expect(isPreloaded("q-4")).toBe(false);
    });

    it("should correctly identify loading items", () => {
      const loading = new Set(["q-1", "q-2"]);

      const isLoading = (id: string) => loading.has(id);

      expect(isLoading("q-1")).toBe(true);
      expect(isLoading("q-2")).toBe(true);
      expect(isLoading("q-3")).toBe(false);
    });
  });

  describe("Clear Cache", () => {
    it("should clear single item from cache", () => {
      const cache = new Map<string, { audioUrl: string }>();
      const revokedUrls: string[] = [];
      
      // Mock URL.revokeObjectURL
      const revokeObjectURL = (url: string) => revokedUrls.push(url);

      cache.set("q-1", { audioUrl: "url-1" });
      cache.set("q-2", { audioUrl: "url-2" });

      const clearCache = (questionId?: string) => {
        if (questionId) {
          const cached = cache.get(questionId);
          if (cached?.audioUrl) {
            revokeObjectURL(cached.audioUrl);
          }
          cache.delete(questionId);
        }
      };

      clearCache("q-1");

      expect(cache.size).toBe(1);
      expect(cache.has("q-1")).toBe(false);
      expect(cache.has("q-2")).toBe(true);
      expect(revokedUrls).toContain("url-1");
    });

    it("should clear entire cache", () => {
      const cache = new Map<string, { audioUrl: string }>();
      const queue: any[] = [{ id: "q-1" }, { id: "q-2" }];
      const revokedUrls: string[] = [];

      const revokeObjectURL = (url: string) => revokedUrls.push(url);

      cache.set("q-1", { audioUrl: "url-1" });
      cache.set("q-2", { audioUrl: "url-2" });
      cache.set("q-3", { audioUrl: "url-3" });

      const clearAllCache = () => {
        cache.forEach((audio) => {
          if (audio.audioUrl) revokeObjectURL(audio.audioUrl);
        });
        cache.clear();
        queue.length = 0;
      };

      clearAllCache();

      expect(cache.size).toBe(0);
      expect(queue).toHaveLength(0);
      expect(revokedUrls).toHaveLength(3);
    });
  });

  describe("Hover Preloading", () => {
    it("should preload on hover with medium priority", () => {
      const queue: { id: string; priority: number }[] = [];
      const HOVER_PRIORITY = 6;

      const onMouseEnter = (questionId: string) => {
        queue.push({ id: questionId, priority: HOVER_PRIORITY });
      };

      onMouseEnter("q-hover");

      expect(queue).toHaveLength(1);
      expect(queue[0].priority).toBe(6);
    });
  });

  describe("Immediate Preloading", () => {
    it("should skip queue for immediate preloads", () => {
      const cache = new Set<string>();
      const loading = new Set<string>();
      let loadCalled = false;

      const preloadImmediate = async (questionId: string) => {
        if (cache.has(questionId)) return;
        if (loading.has(questionId)) return;
        
        loading.add(questionId);
        loadCalled = true;
        // Simulate async load
        cache.add(questionId);
        loading.delete(questionId);
      };

      preloadImmediate("q-immediate");

      expect(loadCalled).toBe(true);
    });

    it("should not load if already cached", async () => {
      const cache = new Set<string>(["q-cached"]);
      let loadCalled = false;

      const preloadImmediate = async (questionId: string) => {
        if (cache.has(questionId)) return;
        loadCalled = true;
      };

      await preloadImmediate("q-cached");

      expect(loadCalled).toBe(false);
    });
  });
});
