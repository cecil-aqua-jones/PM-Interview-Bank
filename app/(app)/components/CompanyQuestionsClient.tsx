"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../app.module.css";
import { Question } from "@/lib/types";

type CompanyQuestionsClientProps = {
  companyName: string;
  questions: Question[];
};

const getAverageScore = (items: Question[]) => {
  const scores = items
    .map((question) => question.difficultyScore)
    .filter((score): score is number => typeof score === "number");
  if (!scores.length) {
    return null;
  }
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round((total / scores.length) * 10) / 10;
};

export default function CompanyQuestionsClient({
  companyName,
  questions
}: CompanyQuestionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeDifficulty, setActiveDifficulty] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(
    questions[0]?.id ?? null
  );
  const [savedMessage, setSavedMessage] = useState("");

  const tags = useMemo(() => {
    const values = new Set<string>();
    questions.forEach((question) =>
      question.tags.forEach((tag) => values.add(tag))
    );
    return Array.from(values);
  }, [questions]);

  const difficulties = useMemo(() => {
    const values = new Set<string>();
    questions.forEach((question) => {
      if (question.difficultyLabel) {
        values.add(question.difficultyLabel);
      }
    });
    return ["All", ...Array.from(values)];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return questions.filter((question) => {
      if (
        normalized &&
        !question.title.toLowerCase().includes(normalized) &&
        !question.prompt.toLowerCase().includes(normalized)
      ) {
        return false;
      }
      if (activeTags.length) {
        const matchesTag = activeTags.some((tag) =>
          question.tags.includes(tag)
        );
        if (!matchesTag) {
          return false;
        }
      }
      if (
        activeDifficulty !== "All" &&
        question.difficultyLabel !== activeDifficulty
      ) {
        return false;
      }
      return true;
    });
  }, [questions, query, activeTag, activeDifficulty]);

  useEffect(() => {
    if (!filteredQuestions.length) {
      setSelectedId(null);
      return;
    }

    if (!filteredQuestions.find((question) => question.id === selectedId)) {
      setSelectedId(filteredQuestions[0].id);
    }
  }, [filteredQuestions, selectedId]);

  const selectedQuestion = filteredQuestions.find(
    (question) => question.id === selectedId
  );

  const averageScore = getAverageScore(filteredQuestions);

  useEffect(() => {
    const paramQuery = searchParams.get("q") ?? "";
    const paramTags = searchParams.get("tags");
    const paramDifficulty = searchParams.get("difficulty") ?? "All";
    const paramSelected = searchParams.get("selected");

    if (paramQuery !== query) {
      setQuery(paramQuery);
    }

    if (paramDifficulty !== activeDifficulty) {
      setActiveDifficulty(paramDifficulty);
    }

    if (paramTags) {
      const parsed = paramTags
        .split(",")
        .map((tag) => decodeURIComponent(tag))
        .filter(Boolean);
      if (parsed.join(",") !== activeTags.join(",")) {
        setActiveTags(parsed);
      }
    } else if (activeTags.length) {
      setActiveTags([]);
    }

    if (paramSelected && paramSelected !== selectedId) {
      setSelectedId(paramSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (activeTags.length) {
      params.set("tags", activeTags.map(encodeURIComponent).join(","));
    }
    if (activeDifficulty !== "All") {
      params.set("difficulty", activeDifficulty);
    }
    if (selectedId) {
      params.set("selected", selectedId);
    }

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(`?${next}`, { scroll: false });
    }
  }, [query, activeTags, activeDifficulty, selectedId, router, searchParams]);

  useEffect(() => {
    if (searchParams.toString()) {
      return;
    }
    const stored = localStorage.getItem("pmq_filters");
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as {
        query?: string;
        tags?: string[];
        difficulty?: string;
      };
      if (parsed.query) {
        setQuery(parsed.query);
      }
      if (parsed.tags?.length) {
        setActiveTags(parsed.tags);
      }
      if (parsed.difficulty) {
        setActiveDifficulty(parsed.difficulty);
      }
    } catch {
      localStorage.removeItem("pmq_filters");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setQuery("");
    setActiveTags([]);
    setActiveDifficulty("All");
  };

  const saveFilters = () => {
    const payload = {
      query,
      tags: activeTags,
      difficulty: activeDifficulty
    };
    localStorage.setItem("pmq_filters", JSON.stringify(payload));
    setSavedMessage("Saved");
    setTimeout(() => setSavedMessage(""), 2000);
  };

  return (
    <div className={styles.companyLayout}>
      <div className={styles.questionList}>
        <div className={styles.companyHeader}>
          <h2 className={styles.companyTitle}>{companyName}</h2>
          <p className={styles.companyMeta}>
            {filteredQuestions.length} of {questions.length} questions
          </p>
        </div>
        <div className={styles.filterStack}>
          <input
            className={styles.searchInput}
            placeholder="Search questions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className={styles.filterActions}>
            <button
              type="button"
              className={styles.filterAction}
              onClick={saveFilters}
            >
              Save filters
            </button>
            <button
              type="button"
              className={styles.filterActionGhost}
              onClick={clearFilters}
            >
              Clear
            </button>
            {savedMessage ? (
              <span className={styles.savedMessage}>{savedMessage}</span>
            ) : null}
          </div>
          <div className={styles.filterGroupWrap}>
            {tags.map((tag) => (
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
          <div className={styles.filterGroupWrap}>
            {difficulties.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveDifficulty(label)}
                className={`${styles.filterChip} ${
                  activeDifficulty === label ? styles.filterChipActive : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.list}>
          {filteredQuestions.map((question) => (
            <button
              key={question.id}
              type="button"
              onClick={() => setSelectedId(question.id)}
              className={`${styles.listItem} ${
                selectedId === question.id ? styles.listItemActive : ""
              }`}
            >
              {question.title}
            </button>
          ))}
          {!filteredQuestions.length && (
            <div className={styles.emptyState}>No questions match.</div>
          )}
        </div>
      </div>
      <div className={styles.detailPane}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h4>Total questions</h4>
            <p>{questions.length}</p>
          </div>
          <div className={styles.statCard}>
            <h4>Tags</h4>
            <p>{tags.length - 1}</p>
          </div>
          <div className={styles.statCard}>
            <h4>Avg. difficulty</h4>
            <p>{averageScore ?? "-"}</p>
          </div>
        </div>
        {selectedQuestion ? (
          <div className={styles.detailCard}>
            <div className={styles.detailHeader}>
              <div>
                <h3>{selectedQuestion.title}</h3>
                <div className={styles.detailTags}>
                  {selectedQuestion.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>
              {selectedQuestion.difficultyLabel ? (
                <span className={styles.badge}>
                  {selectedQuestion.difficultyLabel}
                  {selectedQuestion.difficultyScore
                    ? ` - ${selectedQuestion.difficultyScore}/10`
                    : ""}
                </span>
              ) : null}
            </div>
            <p className={styles.detailPrompt}>{selectedQuestion.prompt}</p>
            {selectedQuestion.requirements?.length ? (
              <div className={styles.detailSection}>
                <h4>Requirements</h4>
                <ul>
                  {selectedQuestion.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div className={styles.emptyState}>No question selected.</div>
        )}
      </div>
    </div>
  );
}
