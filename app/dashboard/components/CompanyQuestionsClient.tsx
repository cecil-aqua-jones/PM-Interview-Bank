"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "../app.module.css";
import { Question, getQuestionType, QuestionType } from "@/lib/types";
import { getBrandIcon } from "@/lib/brandfetch";
import { getInterview, InterviewRecord } from "@/lib/interviewStorage";
import { useTTSPreloader } from "@/lib/hooks/useTTSPreloader";
import { useQuestionEnhancer } from "@/lib/hooks/useQuestionEnhancer";
import InterviewPanel from "./InterviewPanel";
import BehavioralInterviewPanel from "./BehavioralInterviewPanel";
import SystemDesignInterviewPanel from "./SystemDesignInterviewPanel";
import FormattedContent from "./FormattedContent";

/**
 * Format a date string to "Mon D, YYYY" format (e.g., "Feb 6, 2025")
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return dateString;
  }
}

type CompanyQuestionsClientProps = {
  companyName: string;
  companySlug: string;
  questions: Question[];
};

export default function CompanyQuestionsClient({
  companyName,
  companySlug,
  questions
}: CompanyQuestionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [interviewQuestion, setInterviewQuestion] = useState<Question | null>(null);
  const [interviewRecords, setInterviewRecords] = useState<Record<string, InterviewRecord>>({});
  const [isInterviewClosing, setIsInterviewClosing] = useState(false);

  // TTS preloader for instant audio playback
  const { preload, preloadImmediate, preloadBatch, preloadAdjacent, getPreloadedAudio, isPreloaded, isLoading, getProgress, clearCache } = useTTSPreloader();
  
  // AI-powered question content enhancer for incomplete/poorly formatted questions
  const { enhanceMultiple, getEnhancedContent } = useQuestionEnhancer();

  // Load interview records from localStorage on mount
  useEffect(() => {
    const records: Record<string, InterviewRecord> = {};
    questions.forEach((q) => {
      const record = getInterview(q.id);
      if (record) {
        records[q.id] = record;
      }
    });
    setInterviewRecords(records);
  }, [questions]);

  const handleScoreUpdate = (questionId: string, score: number) => {
    // Reload the full record after score update
    const record = getInterview(questionId);
    if (record) {
      setInterviewRecords((prev) => ({ ...prev, [questionId]: record }));
    }
  };

  const tags = useMemo(() => {
    const values = new Set<string>();
    questions.forEach((q) => q.tags.forEach((tag) => values.add(tag)));
    return Array.from(values);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return questions.filter((q) => {
      if (
        normalized &&
        !q.title.toLowerCase().includes(normalized) &&
        !q.prompt.toLowerCase().includes(normalized)
      ) {
        return false;
      }
      if (activeTags.length) {
        const matchesTag = activeTags.some((tag) => q.tags.includes(tag));
        if (!matchesTag) return false;
      }
      return true;
    });
  }, [questions, query, activeTags]);

  // Aggressive preloading: load first 5 questions on mount
  useEffect(() => {
    if (filteredQuestions.length > 0) {
      const initialBatch = filteredQuestions.slice(0, 5).map(q => ({
        id: q.id,
        title: q.title,
        content: q.prompt
      }));
      preloadBatch(initialBatch, 7);
    }
  }, [filteredQuestions, preloadBatch]);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTags]);

  // Preload TTS when a question is selected (before user clicks start)
  // Also preload adjacent questions for smooth navigation
  useEffect(() => {
    if (filteredQuestions[selectedIndex]) {
      const q = filteredQuestions[selectedIndex];
      // Pass title and content separately for proper interview introduction
      preloadImmediate(q.id, q.title, q.prompt);
      // Also preload adjacent questions
      preloadAdjacent(filteredQuestions, selectedIndex);
    }
  }, [selectedIndex, filteredQuestions, preloadImmediate, preloadAdjacent]);

  // URL sync
  useEffect(() => {
    const paramQuery = searchParams.get("q") ?? "";
    const paramTags = searchParams.get("tags");
    const paramIndex = searchParams.get("i");

    if (paramQuery !== query) setQuery(paramQuery);
    if (paramTags) {
      const parsed = paramTags.split(",").filter(Boolean);
      if (parsed.join(",") !== activeTags.join(",")) setActiveTags(parsed);
    }
    if (paramIndex) {
      const idx = parseInt(paramIndex, 10);
      if (!isNaN(idx) && idx !== selectedIndex) setSelectedIndex(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeTags.length) params.set("tags", activeTags.join(","));
    if (selectedIndex > 0) params.set("i", String(selectedIndex));

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(`?${next}`, { scroll: false });
    }
  }, [query, activeTags, selectedIndex, router, searchParams]);

  const selectedQuestion = filteredQuestions[selectedIndex] ?? null;
  const selectedRecord = selectedQuestion ? interviewRecords[selectedQuestion.id] : null;
  const selectedQuestionType = selectedQuestion ? getQuestionType(selectedQuestion) : "coding";
  
  // Batch enhance questions that need AI improvement on page load
  // Process in background without blocking UI
  useEffect(() => {
    const questionsNeedingEnhancement = questions.filter(q => q.needsAIEnhancement);
    if (questionsNeedingEnhancement.length > 0) {
      // Run in background - don't await
      enhanceMultiple(questionsNeedingEnhancement);
    }
  }, [questions, enhanceMultiple]);
  
  // Get enhanced content for selected question (or original if not enhanced)
  const displayQuestion = useMemo(() => {
    if (!selectedQuestion) return null;
    const enhanced = getEnhancedContent(selectedQuestion);
    return {
      ...selectedQuestion,
      title: enhanced.title,
      prompt: enhanced.prompt,
    };
  }, [selectedQuestion, getEnhancedContent]);

  // Get enhanced content for interview question (used when starting interview)
  const enhancedInterviewQuestion = useMemo(() => {
    if (!interviewQuestion) return null;
    const enhanced = getEnhancedContent(interviewQuestion);
    return {
      ...interviewQuestion,
      title: enhanced.title,
      prompt: enhanced.prompt,
    };
  }, [interviewQuestion, getEnhancedContent]);

  const goToPrev = () => {
    if (selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
  };

  const goToNext = () => {
    if (selectedIndex < filteredQuestions.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setQuery("");
    setActiveTags([]);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/dashboard" className={styles.breadcrumbLink}>
          Companies
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{companyName}</span>
      </div>

      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderLeft}>
          {imageError ? (
            <div className={styles.detailLogoFallback}>
              {companyName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Image
              src={getBrandIcon(companyName)}
              alt={`${companyName} logo`}
              width={64}
              height={64}
              className={styles.detailLogo}
              onError={() => setImageError(true)}
              unoptimized
            />
          )}
          <div>
            <h1 className={styles.detailTitle}>{companyName}</h1>
            <p className={styles.detailSubtitle}>
              Coding Interview Questions
            </p>
          </div>
        </div>

        <div className={styles.detailStats}>
          <div className={styles.detailStat}>
            <div className={styles.detailStatValue}>{questions.length}</div>
            <div className={styles.detailStatLabel}>Questions</div>
          </div>
          <div className={styles.detailStat}>
            <div className={styles.detailStatValue}>{tags.length}</div>
            <div className={styles.detailStatLabel}>Categories</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterSearch}>
          <input
            type="text"
            className={styles.filterSearchInput}
            placeholder="Search questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          {tags.slice(0, 8).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`${styles.filterChip} ${activeTags.includes(tag) ? styles.filterChipActive : ""
                }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {(query || activeTags.length > 0) && (
          <div className={styles.filterActions}>
            <button
              type="button"
              onClick={clearFilters}
              className={styles.filterAction}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Question Layout */}
      <div className={styles.questionLayout}>
        {/* Sidebar */}
        <div className={styles.questionSidebar}>
          <div className={styles.questionSidebarHeader}>
            <div className={styles.questionSidebarTitle}>Questions</div>
            <div className={styles.questionSidebarCount}>
              {filteredQuestions.length} of {questions.length}
            </div>
          </div>

          <div className={styles.questionList}>
            {filteredQuestions.map((q, idx) => {
              const qType = getQuestionType(q);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  onMouseEnter={() => {
                    // Preload on hover for instant experience
                    preload(q.id, q.title, q.prompt, 6);
                  }}
                  className={`${styles.questionListItem} ${idx === selectedIndex ? styles.questionListItemActive : ""
                    }`}
                >
                  <div className={styles.questionListItemTitle}>
                    {q.title}
                  </div>
                  <div className={styles.questionListItemMeta}>
                    {q.tags[0] && (
                      <span className={styles.questionListItemTag}>
                        {q.tags[0]}
                      </span>
                    )}
                    {q.difficultyLabel && <span>{q.difficultyLabel}</span>}
                    {interviewRecords[q.id] && (
                      <span style={{
                        marginLeft: "auto",
                        fontWeight: 600,
                        color: interviewRecords[q.id].score >= 3.5 ? "#16a34a" :
                          interviewRecords[q.id].score >= 2.5 ? "#d97706" : "#dc2626"
                      }}>
                        {interviewRecords[q.id].score.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {!filteredQuestions.length && (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>No questions match.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className={styles.questionDetail}>
          {selectedQuestion ? (
            <div className={styles.questionCard}>
              <div className={styles.questionCardHeader}>
                {/* Navigation */}
                <div className={styles.questionCardNav}>
                  <button
                    type="button"
                    onClick={goToPrev}
                    disabled={selectedIndex === 0}
                    className={styles.questionNavBtn}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                    </svg>
                    Previous
                  </button>

                  <span className={styles.questionNavCounter}>
                    {selectedIndex + 1} of {filteredQuestions.length}
                  </span>

                  <button
                    type="button"
                    onClick={goToNext}
                    disabled={selectedIndex === filteredQuestions.length - 1}
                    className={styles.questionNavBtn}
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                    </svg>
                  </button>
                </div>

                {/* Title */}
                <h2 className={styles.questionCardTitle}>
                  {displayQuestion?.title || selectedQuestion.title}
                </h2>

                <div className={styles.questionCardTags}>
                  {selectedQuestion.tags.map((tag, i) => (
                    <span
                      key={tag}
                      className={`${styles.questionTag} ${i === 0 ? styles.questionTagPrimary : ""
                        }`}
                    >
                      {tag}
                    </span>
                  ))}
                  {selectedQuestion.difficultyLabel && (
                    <span className={styles.questionTag}>
                      {selectedQuestion.difficultyLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Problem Description */}
              {(displayQuestion?.prompt || selectedQuestion.prompt) && (
                <div className={styles.questionContent}>
                  <h3 className={styles.questionContentTitle}>Problem Description</h3>
                  <FormattedContent content={displayQuestion?.prompt || selectedQuestion.prompt} />
                </div>
              )}

              {/* Body - Show previous feedback or prompt to practice */}
              <div className={styles.questionCardBody}>
                {selectedRecord ? (
                  <div className={styles.previousFeedback}>
                    <div className={styles.previousFeedbackHeader}>
                      <div className={styles.previousFeedbackHeaderLeft}>
                        <div className={styles.previousFeedbackScore}>
                          {/* Circular progress ring */}
                          <svg className={styles.previousFeedbackScoreRing} viewBox="0 0 36 36">
                            <circle
                              className={styles.previousFeedbackScoreRingBg}
                              cx="18" cy="18" r="15.5"
                            />
                            <circle
                              className={`${styles.previousFeedbackScoreRingFill} ${selectedRecord.score >= 3.5 ? styles.scoreHigh :
                                selectedRecord.score >= 2.5 ? styles.scoreMid : styles.scoreLow
                                }`}
                              cx="18" cy="18" r="15.5"
                              strokeDasharray={`${selectedRecord.score * 19.4} 97`}
                            />
                          </svg>
                          <span className={styles.previousFeedbackScoreValue}>
                            {selectedRecord.score.toFixed(1)}
                          </span>
                        </div>
                        <div className={styles.previousFeedbackMeta}>
                          <span className={styles.previousFeedbackTitle}>Last Attempt</span>
                          <span className={styles.previousFeedbackDate}>
                            {new Date(selectedRecord.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                      </div>
                      <span className={`${styles.previousFeedbackPerformance} ${selectedRecord.score >= 3.5 ? styles.performanceHigh :
                        selectedRecord.score >= 2.5 ? styles.performanceMid : styles.performanceLow
                        }`}>
                        {selectedRecord.score >= 3.5 ? "Strong" :
                          selectedRecord.score >= 2.5 ? "Developing" : "Needs Work"}
                      </span>
                    </div>

                    <div className={styles.previousFeedbackContent}>
                      <p className={styles.previousFeedbackSummary}>
                        {selectedRecord.evaluation.overallFeedback}
                      </p>

                      {selectedRecord.evaluation.improvements.length > 0 && (
                        <div className={styles.previousFeedbackSection}>
                          <span className={styles.previousFeedbackSectionTitle}>
                            Areas to Focus On
                          </span>
                          <ul className={styles.previousFeedbackList}>
                            {selectedRecord.evaluation.improvements.slice(0, 3).map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className={styles.previousFeedbackActions}>
                      <button
                        className={styles.tryAgainBtn}
                        onClick={() => {
                          if (!isInterviewClosing && !interviewQuestion) {
                            setInterviewQuestion(selectedQuestion);
                          }
                        }}
                        disabled={isInterviewClosing || !!interviewQuestion}
                      >
                        Practice Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.noPractice}>
                    <div className={styles.noPracticeIcon}>
                      {selectedQuestionType === "coding" ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polyline points="4 17 10 11 4 5" />
                          <line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                      ) : selectedQuestionType === "system_design" ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
                    </div>
                    <p className={styles.noPracticeText}>
                      {selectedQuestionType === "coding"
                        ? "Code your solution, submit, get real-time feedback"
                        : selectedQuestionType === "system_design"
                          ? "Design and explain your architecture with an AI interviewer"
                          : "Practice your communication skills with back-and-forth conversation"
                      }
                    </p>
                    <button
                      className={`${styles.startPracticeBtn} ${isPreloaded(selectedQuestion.id) ? styles.startPracticeBtnReady : ""}`}
                      onClick={() => {
                        if (!isInterviewClosing && !interviewQuestion) {
                          setInterviewQuestion(selectedQuestion);
                        }
                      }}
                      disabled={isInterviewClosing || !!interviewQuestion}
                    >
                      {isPreloaded(selectedQuestion.id) ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {selectedQuestionType === "coding"
                            ? "Start Coding Interview"
                            : selectedQuestionType === "system_design"
                              ? "Start System Design Interview"
                              : "Start Behavioral Interview"
                          }
                        </>
                      ) : isLoading(selectedQuestion.id) ? (
                        <>
                          <span className={styles.loadingSpinner} />
                          Preparing...
                        </>
                      ) : (
                        // Not preloaded and not loading - either failed or not started
                        // Allow user to proceed anyway (audio will load on demand)
                        <>
                          {selectedQuestionType === "coding"
                            ? "Start Coding Interview"
                            : selectedQuestionType === "system_design"
                              ? "Start System Design Interview"
                              : "Start Behavioral Interview"
                          }
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.questionMeta}>
                {selectedQuestion.companyName && (
                  <div className={styles.questionMetaItem}>
                    <span className={styles.questionMetaLabel}>Company</span>
                    <span className={styles.questionMetaValue}>
                      {selectedQuestion.companyName}
                    </span>
                  </div>
                )}
                {selectedQuestion.lastVerified && (
                  <div className={styles.questionMetaItem}>
                    <span className={styles.questionMetaLabel}>Last Verified</span>
                    <span className={styles.questionMetaValue}>
                      {formatDate(selectedQuestion.lastVerified)}
                    </span>
                  </div>
                )}
                {selectedQuestion.tags[0] && (
                  <div className={styles.questionMetaItem}>
                    <span className={styles.questionMetaLabel}>Category</span>
                    <span className={styles.questionMetaValue}>
                      {selectedQuestion.tags[0]}
                    </span>
                  </div>
                )}
                {selectedRecord && (
                  <div className={styles.questionMetaItem}>
                    <span className={styles.questionMetaLabel}>Your Score</span>
                    <span className={styles.questionMetaValue}>
                      {selectedRecord.score}/5
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📋</div>
              <h3 className={styles.emptyStateTitle}>No question selected</h3>
              <p className={styles.emptyStateText}>
                Select a question from the list to view details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interview Panel - Elegant slide-out */}
      {/* coding uses InterviewPanel, behavioral uses BehavioralInterviewPanel, system_design shows coming soon */}
      {interviewQuestion && enhancedInterviewQuestion && (
        getQuestionType(interviewQuestion) === "coding" ? (
          <InterviewPanel
            question={enhancedInterviewQuestion}
            preloadedAudioUrl={getPreloadedAudio(interviewQuestion.id)?.audioUrl}
            onClose={() => {
              setIsInterviewClosing(true);
              setInterviewQuestion(null);
              setTimeout(() => setIsInterviewClosing(false), 200);
            }}
            onNext={() => {
              const currentIdx = filteredQuestions.findIndex(q => q.id === interviewQuestion.id);
              if (currentIdx < filteredQuestions.length - 1) {
                const nextQ = filteredQuestions[currentIdx + 1];
                setInterviewQuestion(nextQ);
                setSelectedIndex(currentIdx + 1);
                // Aggressively preload adjacent questions
                preloadAdjacent(filteredQuestions, currentIdx + 1);
              }
            }}
            onPrev={() => {
              const currentIdx = filteredQuestions.findIndex(q => q.id === interviewQuestion.id);
              if (currentIdx > 0) {
                const prevQ = filteredQuestions[currentIdx - 1];
                setInterviewQuestion(prevQ);
                setSelectedIndex(currentIdx - 1);
                // Aggressively preload adjacent questions
                preloadAdjacent(filteredQuestions, currentIdx - 1);
              }
            }}
            hasNext={filteredQuestions.findIndex(q => q.id === interviewQuestion.id) < filteredQuestions.length - 1}
            hasPrev={filteredQuestions.findIndex(q => q.id === interviewQuestion.id) > 0}
            onScoreUpdate={handleScoreUpdate}
            questionIndex={filteredQuestions.findIndex(q => q.id === interviewQuestion.id)}
            totalQuestions={filteredQuestions.length}
          />
        ) : getQuestionType(interviewQuestion) === "system_design" ? (
          <SystemDesignInterviewPanel
            question={enhancedInterviewQuestion}
            preloadedAudioUrl={getPreloadedAudio(interviewQuestion.id)?.audioUrl}
            onClose={() => {
              setIsInterviewClosing(true);
              setInterviewQuestion(null);
              setTimeout(() => setIsInterviewClosing(false), 200);
            }}
            onNext={() => {
              const currentIdx = filteredQuestions.findIndex(q => q.id === interviewQuestion.id);
              if (currentIdx < filteredQuestions.length - 1) {
                const nextQ = filteredQuestions[currentIdx + 1];
                setInterviewQuestion(nextQ);
              }
            }}
            onPrev={() => {
              const currentIdx = filteredQuestions.findIndex(q => q.id === interviewQuestion.id);
              if (currentIdx > 0) {
                const prevQ = filteredQuestions[currentIdx - 1];
                setInterviewQuestion(prevQ);
              }
            }}
            hasNext={filteredQuestions.findIndex(q => q.id === interviewQuestion.id) < filteredQuestions.length - 1}
            hasPrev={filteredQuestions.findIndex(q => q.id === interviewQuestion.id) > 0}
            onScoreUpdate={handleScoreUpdate}
            questionIndex={filteredQuestions.findIndex(q => q.id === interviewQuestion.id)}
            totalQuestions={filteredQuestions.length}
          />
        ) : (
          <BehavioralInterviewPanel
            question={enhancedInterviewQuestion}
            preloadedAudioUrl={getPreloadedAudio(interviewQuestion.id)?.audioUrl}
            onClose={() => {
              setIsInterviewClosing(true);
              setInterviewQuestion(null);
              setTimeout(() => setIsInterviewClosing(false), 200);
            }}
            onNext={() => {
              const currentIdx = filteredQuestions.findIndex(q => q.id === interviewQuestion.id);
              if (currentIdx < filteredQuestions.length - 1) {
                const nextQ = filteredQuestions[currentIdx + 1];
                setInterviewQuestion(nextQ);
                setSelectedIndex(currentIdx + 1);
                // Aggressively preload adjacent questions
                preloadAdjacent(filteredQuestions, currentIdx + 1);
              }
            }}
            onPrev={() => {
              const currentIdx = filteredQuestions.findIndex(q => q.id === interviewQuestion.id);
              if (currentIdx > 0) {
                const prevQ = filteredQuestions[currentIdx - 1];
                setInterviewQuestion(prevQ);
                setSelectedIndex(currentIdx - 1);
                // Aggressively preload adjacent questions
                preloadAdjacent(filteredQuestions, currentIdx - 1);
              }
            }}
            hasNext={filteredQuestions.findIndex(q => q.id === interviewQuestion.id) < filteredQuestions.length - 1}
            hasPrev={filteredQuestions.findIndex(q => q.id === interviewQuestion.id) > 0}
            onScoreUpdate={handleScoreUpdate}
            questionIndex={filteredQuestions.findIndex(q => q.id === interviewQuestion.id)}
            totalQuestions={filteredQuestions.length}
          />
        )
      )}
    </>
  );
}
