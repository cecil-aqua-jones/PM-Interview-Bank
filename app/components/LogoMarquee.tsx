"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./LogoMarquee.module.css";

// Target companies: Top Tech + AI Frontier
const TARGET_COMPANIES = [
  { name: "Google", domain: "google.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "TikTok", domain: "tiktok.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "OpenAI", domain: "openai.com" },
  { name: "Anthropic", domain: "anthropic.com" },
  { name: "Perplexity", domain: "perplexity.ai" },
  { name: "xAI", domain: "x.ai" },
  { name: "Oracle", domain: "oracle.com" },
];

function getLogoUrl(domain: string) {
  return `https://cdn.brandfetch.io/${domain}/w/512/h/512/icon?c=1idYa6uaY9QLaZxDxo6`;
}

export default function LogoMarquee() {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (domain: string) => {
    setImageErrors((prev) => new Set(prev).add(domain));
  };

  // Double the array for seamless infinite scroll
  const companies = [...TARGET_COMPANIES, ...TARGET_COMPANIES];

  return (
    <div className={styles.marqueeWrapper}>
      <div className={styles.marqueeGradientLeft} />
      <div className={styles.marqueeGradientRight} />
      <div className={styles.marqueeTrack}>
        <div className={styles.marqueeContent}>
          {companies.map((company, index) => (
            <div key={`${company.domain}-${index}`} className={styles.logoItem}>
              {imageErrors.has(company.domain) ? (
                <div className={styles.logoFallback}>
                  {company.name.charAt(0)}
                </div>
              ) : (
                <Image
                  src={getLogoUrl(company.domain)}
                  alt={`${company.name} logo`}
                  width={48}
                  height={48}
                  className={styles.logoImage}
                  onError={() => handleImageError(company.domain)}
                  unoptimized
                />
              )}
              <span className={styles.logoName}>{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
