import { Company, Question } from "./types";

export const mockCompanies: Company[] = [
  { id: "apple", name: "Apple", slug: "apple", questionCount: 23 },
  { id: "google", name: "Google", slug: "google", questionCount: 18 },
  { id: "amazon", name: "Amazon", slug: "amazon", questionCount: 67 },
  { id: "airbnb", name: "Airbnb", slug: "airbnb", questionCount: 23 },
  { id: "stripe", name: "Stripe", slug: "stripe", questionCount: 11 },
  { id: "uber", name: "Uber", slug: "uber", questionCount: 16 }
];

export const mockQuestions: Question[] = [
  {
    id: "q1",
    title: "Database Selection",
    prompt:
      "Explain the differences between relational and NoSQL databases and when to use each. (Uber)",
    tags: ["design", "onsite"],
    difficultyLabel: "Very Common",
    difficultyScore: 8,
    companySlug: "apple"
  },
  {
    id: "q2",
    title: "Real-Time Audio Stream Synchronization",
    prompt:
      "Design a strategy to synchronize audio playback across devices in a multi-device system.",
    tags: ["design", "onsite"],
    difficultyLabel: "Common",
    difficultyScore: 6,
    companySlug: "apple",
    requirements: [
      "Synchronize playback across N devices (2 ≤ N ≤ 10)",
      "Max acceptable desync: 50ms between any two devices",
      "Handle network latency variations (10-200ms)",
      "Compensate for device processing delays",
      "Graceful degradation when a device falls behind"
    ]
  },
  {
    id: "q3",
    title: "Load Balancer",
    prompt: "Design a load balancer from scratch. (Google)",
    tags: ["design"],
    difficultyLabel: "Common",
    difficultyScore: 6,
    companySlug: "google"
  }
];
