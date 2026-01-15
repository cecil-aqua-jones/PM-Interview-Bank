"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "../app.module.css";
import { Company } from "@/lib/types";

type CompanyGridClientProps = {
  companies: Company[];
};

export default function CompanyGridClient({
  companies
}: CompanyGridClientProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "questions">("questions");

  const filteredCompanies = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = normalized
      ? companies.filter((company) =>
          company.name.toLowerCase().includes(normalized)
        )
      : companies.slice();

    return list.sort((a, b) => {
      if (sort === "name") {
        return a.name.localeCompare(b.name);
      }
      return (b.questionCount ?? 0) - (a.questionCount ?? 0);
    });
  }, [companies, query, sort]);

  return (
    <div className={styles.companyGridSection}>
      <div className={styles.filterRow}>
        <div className={styles.searchField}>
          <input
            placeholder="Jump to company"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <button
            type="button"
            onClick={() => setSort("questions")}
            className={`${styles.filterButton} ${
              sort === "questions" ? styles.filterButtonActive : ""
            }`}
          >
            Most questions
          </button>
          <button
            type="button"
            onClick={() => setSort("name")}
            className={`${styles.filterButton} ${
              sort === "name" ? styles.filterButtonActive : ""
            }`}
          >
            A-Z
          </button>
        </div>
      </div>
      <div className={styles.cardGrid}>
        {filteredCompanies.map((company) => (
          <div key={company.slug} className={styles.companyCard}>
            <div className={styles.companyBadge}>
              <span>{company.name}</span>
              <span className={styles.companyQuestions}>
                {company.questionCount ?? 0} questions
              </span>
            </div>
            <Link
              className={styles.cardButton}
              href={`/app/company/${company.slug}`}
            >
              View Questions →
            </Link>
          </div>
        ))}
        {!filteredCompanies.length && (
          <div className={styles.emptyState}>
            No companies match that search.
          </div>
        )}
      </div>
    </div>
  );
}
