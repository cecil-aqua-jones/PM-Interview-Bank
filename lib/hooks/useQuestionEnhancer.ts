"use client";

import { useState, useCallback, useRef } from "react";
import { Question } from "@/lib/types";

type EnhancedQuestion = {
  title: string;
  prompt: string;
  wasEnhanced: boolean;
  changes: string[];
};

type EnhancerState = {
  isEnhancing: boolean;
  error: string | null;
  enhancedQuestions: Map<string, EnhancedQuestion>;
};

/**
 * Hook for on-demand AI enhancement of question content
 * 
 * Usage:
 * const { enhanceQuestion, getEnhancedContent, isEnhancing } = useQuestionEnhancer();
 * 
 * // Enhance a question that needs it
 * if (question.needsAIEnhancement) {
 *   await enhanceQuestion(question);
 * }
 * 
 * // Get enhanced content (falls back to original if not enhanced)
 * const content = getEnhancedContent(question);
 */
export function useQuestionEnhancer() {
  const [state, setState] = useState<EnhancerState>({
    isEnhancing: false,
    error: null,
    enhancedQuestions: new Map(),
  });
  
  const pendingRef = useRef<Set<string>>(new Set());

  /**
   * Enhance a single question with AI
   */
  const enhanceQuestion = useCallback(async (question: Question): Promise<EnhancedQuestion | null> => {
    // Skip if already enhanced or currently enhancing
    if (state.enhancedQuestions.has(question.id) || pendingRef.current.has(question.id)) {
      return state.enhancedQuestions.get(question.id) || null;
    }

    pendingRef.current.add(question.id);
    setState(prev => ({ ...prev, isEnhancing: true, error: null }));

    try {
      const response = await fetch("/api/questions/sanitize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: {
            id: question.id,
            title: question.title,
            prompt: question.prompt,
            tags: question.tags,
          },
          useAI: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enhance question");
      }

      const data = await response.json();
      
      const enhanced: EnhancedQuestion = {
        title: data.title,
        prompt: data.prompt,
        wasEnhanced: data.wasModified,
        changes: data.changes || [],
      };

      setState(prev => {
        const newMap = new Map(prev.enhancedQuestions);
        newMap.set(question.id, enhanced);
        return {
          ...prev,
          isEnhancing: pendingRef.current.size > 1,
          enhancedQuestions: newMap,
        };
      });

      pendingRef.current.delete(question.id);
      return enhanced;
    } catch (error) {
      console.error("[QuestionEnhancer] Error:", error);
      pendingRef.current.delete(question.id);
      setState(prev => ({
        ...prev,
        isEnhancing: pendingRef.current.size > 0,
        error: error instanceof Error ? error.message : "Enhancement failed",
      }));
      return null;
    }
  }, [state.enhancedQuestions]);

  /**
   * Get enhanced content for a question (or original if not enhanced)
   */
  const getEnhancedContent = useCallback((question: Question): { title: string; prompt: string } => {
    const enhanced = state.enhancedQuestions.get(question.id);
    if (enhanced) {
      return { title: enhanced.title, prompt: enhanced.prompt };
    }
    return { title: question.title, prompt: question.prompt };
  }, [state.enhancedQuestions]);

  /**
   * Check if a question has been enhanced
   */
  const isEnhanced = useCallback((questionId: string): boolean => {
    return state.enhancedQuestions.has(questionId);
  }, [state.enhancedQuestions]);

  /**
   * Get enhancement details for a question
   */
  const getEnhancementDetails = useCallback((questionId: string): EnhancedQuestion | null => {
    return state.enhancedQuestions.get(questionId) || null;
  }, [state.enhancedQuestions]);

  /**
   * Batch enhance multiple questions
   */
  const enhanceMultiple = useCallback(async (questions: Question[]): Promise<void> => {
    const needsEnhancement = questions.filter(
      q => q.needsAIEnhancement && !state.enhancedQuestions.has(q.id) && !pendingRef.current.has(q.id)
    );

    if (needsEnhancement.length === 0) return;

    // Enhance in parallel with concurrency limit
    const BATCH_SIZE = 3;
    for (let i = 0; i < needsEnhancement.length; i += BATCH_SIZE) {
      const batch = needsEnhancement.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(q => enhanceQuestion(q)));
    }
  }, [enhanceQuestion, state.enhancedQuestions]);

  return {
    enhanceQuestion,
    enhanceMultiple,
    getEnhancedContent,
    isEnhanced,
    getEnhancementDetails,
    isEnhancing: state.isEnhancing,
    error: state.error,
  };
}
