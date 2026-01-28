"use client";

import { useState, useMemo } from "react";
import styles from "../app.module.css";
import { CodingEvaluationResult, CODING_RUBRIC_CRITERIA } from "@/lib/codingRubric";
import { BehavioralEvaluationResult, BEHAVIORAL_RUBRIC } from "@/lib/behavioralRubric";
import { SystemDesignEvaluationResult, SYSTEM_DESIGN_CRITERIA } from "@/lib/systemDesignRubric";
import { InterviewRecord } from "@/lib/interviewStorage";

type FeedbackDimension = {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  feedback: string;
  candidateQuote?: string;
  whatWentWell?: string;
  howToImprove: string;
  levelLabel: string;
};

type FeedbackCardsProps = {
  record: InterviewRecord;
};

type AccordionSection = "level" | "improve" | "response" | null;

/**
 * Chevron icon for accordion
 */
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`${styles.accordionChevron} ${expanded ? styles.accordionChevronExpanded : ""}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/**
 * Accordion Item component
 */
function AccordionItem({
  id,
  title,
  children,
  expanded,
  onToggle,
}: {
  id: AccordionSection;
  title: string;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={styles.accordionItem}>
      <button
        type="button"
        className={styles.accordionTrigger}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`accordion-content-${id}`}
      >
        <ChevronIcon expanded={expanded} />
        <span className={styles.accordionTitle}>{title}</span>
      </button>
      <div
        id={`accordion-content-${id}`}
        className={`${styles.accordionContent} ${expanded ? styles.accordionContentExpanded : ""}`}
        role="region"
      >
        <div className={styles.accordionContentInner}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Get score label based on score value
 */
function getScoreLabel(score: number): string {
  if (score >= 4.5) return "Exceptional";
  if (score >= 3.5) return "Strong";
  if (score >= 2.5) return "Developing";
  if (score >= 1.5) return "Needs Work";
  return "Critical";
}

/**
 * Get color class based on score
 */
function getScoreColorClass(score: number): string {
  if (score >= 3.5) return styles.feedbackScoreHigh;
  if (score >= 2.5) return styles.feedbackScoreMid;
  return styles.feedbackScoreLow;
}

/**
 * Extract candidate quotes from conversation history
 */
function extractCandidateQuotes(
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[],
  dimension?: string
): string | undefined {
  if (!conversationHistory || conversationHistory.length === 0) return undefined;
  
  const candidateResponses = conversationHistory
    .filter(turn => turn.role === "candidate")
    .map(turn => turn.content);
  
  if (candidateResponses.length === 0) return undefined;
  
  const lastResponse = candidateResponses[candidateResponses.length - 1];
  if (lastResponse && lastResponse.length > 150) {
    return lastResponse.substring(0, 150) + "...";
  }
  return lastResponse || undefined;
}

/**
 * Build feedback dimensions for Coding interviews
 */
function buildCodingDimensions(
  evaluation: CodingEvaluationResult,
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[]
): FeedbackDimension[] {
  const dimensions: FeedbackDimension[] = [];
  const breakdown = evaluation.breakdown;
  
  const dimensionMap: { key: keyof typeof breakdown; criteriaName: string }[] = [
    { key: "correctness", criteriaName: "Correctness" },
    { key: "timeComplexity", criteriaName: "Time Complexity" },
    { key: "spaceComplexity", criteriaName: "Space Complexity" },
    { key: "codeQuality", criteriaName: "Code Quality" },
    { key: "problemSolving", criteriaName: "Problem-Solving Approach" },
  ];
  
  for (const { key, criteriaName } of dimensionMap) {
    const score = breakdown[key];
    const criterion = CODING_RUBRIC_CRITERIA.find(c => c.name === criteriaName);
    const level = criterion?.levels.find(l => l.score === Math.round(score));
    
    let howToImprove = "";
    let whatWentWell = "";
    
    if (key === "correctness") {
      if (score >= 4) {
        whatWentWell = "Your solution handles edge cases well and produces correct output.";
        howToImprove = "Consider adding defensive coding for additional edge cases like concurrent access.";
      } else if (score >= 3) {
        howToImprove = "Test your solution with edge cases: empty input, single elements, duplicates, and boundary values before submitting.";
      } else {
        howToImprove = "Focus on getting basic test cases working first. Walk through your code with simple examples to catch logical errors.";
      }
    } else if (key === "timeComplexity") {
      if (score >= 4) {
        whatWentWell = "You achieved optimal or near-optimal time complexity.";
        howToImprove = evaluation.complexityAnalysis.isOptimal 
          ? "Excellent! Consider discussing amortized analysis in your explanations."
          : `Your solution runs in ${evaluation.complexityAnalysis.time}. ${evaluation.suggestedOptimization || "Consider if there's a more efficient approach."}`;
      } else if (score >= 3) {
        howToImprove = `Your ${evaluation.complexityAnalysis.time} solution works but isn't optimal. ${evaluation.suggestedOptimization || "Look for ways to reduce nested loops or redundant operations."}`;
      } else {
        howToImprove = "Study common algorithm patterns (hash maps, two pointers, sliding window) to improve time complexity.";
      }
    } else if (key === "spaceComplexity") {
      if (score >= 4) {
        whatWentWell = `Efficient memory usage at ${evaluation.complexityAnalysis.space}.`;
        howToImprove = "Consider in-place modifications where applicable to further optimize.";
      } else if (score >= 3) {
        howToImprove = `Your ${evaluation.complexityAnalysis.space} space usage is acceptable. Consider if you can solve this with less auxiliary space.`;
      } else {
        howToImprove = "Avoid creating unnecessary data copies. Consider in-place algorithms and reusing existing structures.";
      }
    } else if (key === "codeQuality") {
      if (score >= 4) {
        whatWentWell = "Clean, readable code with good naming conventions.";
        howToImprove = "Continue practicing production-quality code. Consider adding brief comments for complex logic.";
      } else if (score >= 3) {
        howToImprove = "Use more descriptive variable names. Extract repeated logic into helper functions.";
      } else {
        howToImprove = "Prioritize readability: use meaningful variable names, break down complex functions, and avoid magic numbers.";
      }
    } else if (key === "problemSolving") {
      if (score >= 4) {
        whatWentWell = "Excellent problem-solving approach with clear thinking.";
        howToImprove = "Continue clarifying requirements upfront and discussing trade-offs.";
      } else if (score >= 3) {
        howToImprove = "Before coding, spend more time: clarify the problem, walk through examples, and outline your approach verbally.";
      } else {
        howToImprove = "Practice the problem-solving framework: understand → plan → implement → review. Don't jump straight to coding.";
      }
    }
    
    dimensions.push({
      name: criteriaName,
      score,
      maxScore: 5,
      weight: criterion?.weight || 0.2,
      feedback: level?.description || "",
      candidateQuote: extractCandidateQuotes(conversationHistory, criteriaName),
      whatWentWell: score >= 3.5 ? whatWentWell : undefined,
      howToImprove,
      levelLabel: getScoreLabel(score),
    });
  }
  
  return dimensions;
}

/**
 * Build feedback dimensions for Behavioral interviews
 */
function buildBehavioralDimensions(
  evaluation: BehavioralEvaluationResult,
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[]
): FeedbackDimension[] {
  const dimensions: FeedbackDimension[] = [];
  
  for (const [name, data] of Object.entries(evaluation.breakdown)) {
    const criterion = BEHAVIORAL_RUBRIC.find(c => c.name === name);
    const score = data.score;
    
    let howToImprove = "";
    if (score < 3) {
      howToImprove = criterion?.feedbackTemplates.low || data.feedback;
    } else if (score < 4) {
      howToImprove = criterion?.feedbackTemplates.mid || "Continue developing this area with more practice.";
    } else {
      howToImprove = criterion?.feedbackTemplates.high || "Maintain this strength in future interviews.";
    }
    
    dimensions.push({
      name,
      score,
      maxScore: 5,
      weight: data.weight,
      feedback: data.feedback,
      candidateQuote: extractCandidateQuotes(conversationHistory, name),
      whatWentWell: score >= 3.5 ? data.feedback : undefined,
      howToImprove,
      levelLabel: getScoreLabel(score),
    });
  }
  
  return dimensions;
}

/**
 * Build feedback dimensions for System Design interviews
 */
function buildSystemDesignDimensions(
  evaluation: SystemDesignEvaluationResult,
  conversationHistory?: { role: "interviewer" | "candidate"; content: string }[]
): FeedbackDimension[] {
  const dimensions: FeedbackDimension[] = [];
  const breakdown = evaluation.breakdown;
  
  const dimensionMap: { key: keyof typeof breakdown; criteriaName: string }[] = [
    { key: "requirements", criteriaName: "Requirements Gathering & Scope" },
    { key: "architecture", criteriaName: "High-Level Architecture" },
    { key: "scalability", criteriaName: "Scalability & Performance" },
    { key: "dataModel", criteriaName: "Data Model & Storage" },
    { key: "tradeoffs", criteriaName: "Trade-off Analysis" },
    { key: "reliability", criteriaName: "Reliability & Fault Tolerance" },
    { key: "communication", criteriaName: "Communication & Clarity" },
  ];
  
  for (const { key, criteriaName } of dimensionMap) {
    const score = breakdown[key];
    const criterion = SYSTEM_DESIGN_CRITERIA.find(c => c.name === criteriaName);
    const level = criterion?.levels.find(l => l.score === Math.round(score));
    
    let howToImprove = "";
    let whatWentWell = "";
    
    if (key === "requirements") {
      if (score >= 4) {
        whatWentWell = "Excellent requirements gathering with functional and non-functional considerations.";
        howToImprove = "Continue probing for hidden requirements and edge cases upfront.";
      } else if (score >= 3) {
        howToImprove = "Ask more clarifying questions before designing. Clarify scale, latency requirements, and user expectations.";
      } else {
        howToImprove = "Never jump straight to design. Spend 5-10 minutes gathering requirements: Who are the users? What's the scale? What are the latency needs?";
      }
    } else if (key === "architecture") {
      if (score >= 4) {
        whatWentWell = `Good architecture with key components: ${evaluation.designHighlights.keyComponents.join(", ")}.`;
        howToImprove = "Consider discussing alternative architectures and why you chose this one.";
      } else if (score >= 3) {
        howToImprove = "Ensure you identify all major components. Practice drawing clear system diagrams with data flow arrows.";
      } else {
        howToImprove = "Study common architectures: API gateway, load balancer, application servers, database, cache. Draw diagrams for popular systems.";
      }
    } else if (key === "scalability") {
      if (score >= 4) {
        whatWentWell = `Strong scaling strategy: ${evaluation.designHighlights.scalingStrategy}.`;
        howToImprove = "Consider global distribution and multi-region strategies for extra depth.";
      } else if (score >= 3) {
        howToImprove = "Go deeper on scaling: discuss sharding strategies, read replicas, caching layers, and CDN usage.";
      } else {
        howToImprove = "Study horizontal scaling patterns: load balancing, database sharding, caching, async processing. Practice capacity estimation.";
      }
    } else if (key === "dataModel") {
      if (score >= 4) {
        whatWentWell = `Appropriate data storage: ${evaluation.designHighlights.dataStorage}.`;
        howToImprove = "Consider discussing indexing strategies and query optimization.";
      } else if (score >= 3) {
        howToImprove = "Justify your database choices. Explain why SQL vs NoSQL for your use case. Discuss data access patterns.";
      } else {
        howToImprove = "Study SQL vs NoSQL trade-offs. Learn when to use document stores, key-value stores, and relational databases.";
      }
    } else if (key === "tradeoffs") {
      if (score >= 4) {
        whatWentWell = `Good trade-off awareness: ${evaluation.designHighlights.mainTradeoff}.`;
        howToImprove = "Continue discussing nuanced trade-offs like eventual vs strong consistency.";
      } else if (score >= 3) {
        howToImprove = "Be more explicit about trade-offs. Every design decision has downsides—acknowledge them proactively.";
      } else {
        howToImprove = "Study CAP theorem and consistency models. Practice articulating: 'The trade-off here is X vs Y, and I chose X because...'";
      }
    } else if (key === "reliability") {
      if (score >= 4) {
        whatWentWell = "Good fault tolerance considerations with redundancy.";
        howToImprove = "Consider discussing chaos engineering and SLA-driven design.";
      } else if (score >= 3) {
        howToImprove = "Address failure scenarios more proactively. Discuss circuit breakers, retries, and graceful degradation.";
      } else {
        howToImprove = "Always ask: 'What happens when X fails?' Add redundancy, health checks, and failover mechanisms to your designs.";
      }
    } else if (key === "communication") {
      if (score >= 4) {
        whatWentWell = "Clear and well-organized design explanation.";
        howToImprove = "Practice summarizing your design in 30 seconds for executive audiences.";
      } else if (score >= 3) {
        howToImprove = "Structure your explanation: requirements → high-level design → deep dives. Use clear diagrams.";
      } else {
        howToImprove = "Practice explaining designs out loud. Use structured frameworks and draw clear diagrams with labeled components.";
      }
    }
    
    dimensions.push({
      name: criteriaName,
      score,
      maxScore: 5,
      weight: criterion?.weight || 0.15,
      feedback: level?.description || "",
      candidateQuote: extractCandidateQuotes(conversationHistory, criteriaName),
      whatWentWell: score >= 3.5 ? whatWentWell : undefined,
      howToImprove,
      levelLabel: getScoreLabel(score),
    });
  }
  
  return dimensions;
}

export default function DetailedFeedbackCards({ record }: FeedbackCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<AccordionSection>("improve");
  
  // Build dimensions based on record type
  const dimensions = useMemo(() => {
    if (record.type === "coding") {
      return buildCodingDimensions(record.evaluation, record.conversationHistory);
    } else if (record.type === "behavioral") {
      return buildBehavioralDimensions(record.evaluation, record.conversationHistory);
    } else if (record.type === "system_design") {
      return buildSystemDesignDimensions(record.evaluation, record.conversationHistory);
    }
    return [];
  }, [record]);
  
  if (dimensions.length === 0) return null;
  
  const currentDimension = dimensions[currentIndex];
  const hasNext = currentIndex < dimensions.length - 1;
  const hasPrev = currentIndex > 0;
  
  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
      setExpandedSection("improve"); // Reset to improve on dimension change
    }
  };
  
  const goToPrev = () => {
    if (hasPrev) {
      setCurrentIndex(currentIndex - 1);
      setExpandedSection("improve"); // Reset to improve on dimension change
    }
  };

  const toggleSection = (section: AccordionSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  return (
    <div className={styles.feedbackCarousel}>
      {/* Section Label */}
      <div className={styles.feedbackCarouselHeader}>
        <span className={styles.feedbackCarouselLabel}>Detailed Feedback</span>
      </div>
      
      {/* Navigation Strip: Prev Button + Bubbles + Next Button */}
      <div className={styles.feedbackNavStrip}>
        <button
          type="button"
          onClick={goToPrev}
          disabled={!hasPrev}
          className={styles.feedbackCarouselBtn}
          aria-label="Previous dimension"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
          </svg>
        </button>
        
        {/* Dimension Indicators (Bubbles) */}
        <div className={styles.feedbackDimIndicators}>
          {dimensions.map((dim, idx) => (
            <button
              key={dim.name}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                setExpandedSection("improve");
              }}
              className={`${styles.feedbackDimIndicator} ${
                idx === currentIndex ? styles.feedbackDimIndicatorActive : ""
              } ${getScoreColorClass(dim.score)}`}
              aria-label={`Go to ${dim.name}`}
              title={`${dim.name}: ${dim.score.toFixed(1)}/5`}
            />
          ))}
        </div>
        
        <button
          type="button"
          onClick={goToNext}
          disabled={!hasNext}
          className={styles.feedbackCarouselBtn}
          aria-label="Next dimension"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
      </div>
      
      {/* Counter */}
      <div className={styles.feedbackCarouselCounterRow}>
        <span className={styles.feedbackCarouselCounter}>
          {currentIndex + 1} of {dimensions.length}
        </span>
      </div>
      
      {/* Current Feedback Card */}
      <div className={styles.feedbackCard}>
        {/* Card Header */}
        <div className={styles.feedbackCardHeader}>
          <div className={styles.feedbackCardTitleGroup}>
            <h4 className={styles.feedbackCardTitle}>{currentDimension.name}</h4>
            <span className={styles.feedbackCardWeight}>
              {Math.round(currentDimension.weight * 100)}% weight
            </span>
          </div>
          <div className={`${styles.feedbackCardScore} ${getScoreColorClass(currentDimension.score)}`}>
            <span className={styles.feedbackCardScoreValue}>
              {currentDimension.score.toFixed(1)}
            </span>
            <span className={styles.feedbackCardScoreMax}>/5</span>
            <span className={styles.feedbackCardScoreLabel}>
              {currentDimension.levelLabel}
            </span>
          </div>
        </div>
        
        {/* Score Visual Bar */}
        <div className={styles.feedbackScoreBar}>
          <div 
            className={`${styles.feedbackScoreBarFill} ${getScoreColorClass(currentDimension.score)}`}
            style={{ width: `${(currentDimension.score / 5) * 100}%` }}
          />
        </div>
        
        {/* Accordion Sections */}
        <div className={styles.accordionContainer}>
          {/* Performance Level */}
          {currentDimension.feedback && (
            <AccordionItem
              id="level"
              title="Performance Level"
              expanded={expandedSection === "level"}
              onToggle={() => toggleSection("level")}
            >
              <p className={styles.accordionText}>{currentDimension.feedback}</p>
            </AccordionItem>
          )}
          
          {/* How to Improve */}
          <AccordionItem
            id="improve"
            title="How to Improve"
            expanded={expandedSection === "improve"}
            onToggle={() => toggleSection("improve")}
          >
            <p className={styles.accordionText}>{currentDimension.howToImprove}</p>
          </AccordionItem>
          
          {/* Your Response (if available) */}
          {currentDimension.candidateQuote && (
            <AccordionItem
              id="response"
              title="Your Response"
              expanded={expandedSection === "response"}
              onToggle={() => toggleSection("response")}
            >
              <blockquote className={styles.accordionQuote}>
                "{currentDimension.candidateQuote}"
              </blockquote>
            </AccordionItem>
          )}
        </div>
      </div>
    </div>
  );
}
