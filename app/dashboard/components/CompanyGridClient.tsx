"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../app.module.css";
import { Company } from "@/lib/types";
import { getBrandIcon } from "@/lib/brandfetch";

type CompanyGridClientProps = {
  companies: Company[];
};

export default function CompanyGridClient({ companies }: CompanyGridClientProps) {
  const [query, setQuery] = useState("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const filteredCompanies = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return companies;
    return companies.filter((company) =>
      company.name.toLowerCase().includes(normalized)
    );
  }, [companies, query]);

  const totalQuestions = companies.reduce(
    (sum, company) => sum + (company.questionCount ?? 0),
    0
  );

  const handleImageError = (companyId: string) => {
    setImageErrors((prev) => new Set(prev).add(companyId));
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <p className={styles.pageEyebrow}>Question Bank</p>
        <h1 className={styles.pageTitle}>Companies</h1>
        <p className={styles.pageSubtitle}>
          {totalQuestions.toLocaleString()} interview questions across{" "}
          {companies.length} companies. Select a company to explore.
        </p>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search companies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className={styles.companyGrid}>
        {filteredCompanies.map((company) => (
          <Link
            key={company.slug}
            href={`/dashboard/company/${company.slug}`}
            className={styles.companyCard}
          >
            {imageErrors.has(company.id) ? (
              <div className={styles.companyLogoFallback}>
                {company.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <Image
                src={getBrandIcon(company.name)}
                alt={`${company.name} logo`}
                width={48}
                height={48}
                className={styles.companyLogo}
                onError={() => handleImageError(company.id)}
                unoptimized
              />
            )}

            <div className={styles.companyCardContent}>
              <h3 className={styles.companyName}>{company.name}</h3>
              <p className={styles.companyMeta}>Product Management</p>
            </div>

            <div className={styles.companyCardFooter}>
              <span className={styles.questionCount}>
                {company.questionCount ?? 0} questions
              </span>
              <svg
                className={styles.cardArrow}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {!filteredCompanies.length && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🔍</div>
          <h3 className={styles.emptyStateTitle}>No companies found</h3>
          <p className={styles.emptyStateText}>
            Try adjusting your search query.
          </p>
        </div>
      )}
    </>
  );
}
