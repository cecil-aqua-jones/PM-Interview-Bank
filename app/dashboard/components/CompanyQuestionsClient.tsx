"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "../app.module.css";
import { Question } from "@/lib/types";
import { getBrandIcon } from "@/lib/brandfetch";

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

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTags]);

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
              Product Management Interview Questions
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
              className={`${styles.filterChip} ${
                activeTags.includes(tag) ? styles.filterChipActive : ""
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
            {filteredQuestions.map((q, idx) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`${styles.questionListItem} ${
                  idx === selectedIndex ? styles.questionListItemActive : ""
                }`}
              >
                <div className={styles.questionListItemTitle}>{q.title}</div>
                <div className={styles.questionListItemMeta}>
                  {q.tags[0] && (
                    <span className={styles.questionListItemTag}>
                      {q.tags[0]}
                    </span>
                  )}
                  {q.difficultyLabel && <span>{q.difficultyLabel}</span>}
                </div>
              </button>
            ))}

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
                      <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
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
                      <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </button>
                </div>

                {/* Title & Tags */}
                <h2 className={styles.questionCardTitle}>
                  {selectedQuestion.title}
                </h2>

                <div className={styles.questionCardTags}>
                  {selectedQuestion.tags.map((tag, i) => (
                    <span
                      key={tag}
                      className={`${styles.questionTag} ${
                        i === 0 ? styles.questionTagPrimary : ""
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

              <div className={styles.questionCardBody}>
                <p className={styles.questionPrompt}>
                  {selectedQuestion.prompt}
                </p>
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
                      {selectedQuestion.lastVerified}
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
    </>
  );
}
