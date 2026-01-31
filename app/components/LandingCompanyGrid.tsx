"use client";

import { useState } from "react";
import Image from "next/image";

type CompanyPreview = {
  name: string;
  domain: string;
  questionCount: number;
};

const companies: CompanyPreview[] = [
  { name: "Google", domain: "google.com", questionCount: 117 },
  { name: "Meta", domain: "meta.com", questionCount: 98 },
  { name: "Apple", domain: "apple.com", questionCount: 94 },
  { name: "Microsoft", domain: "microsoft.com", questionCount: 110 },
];

function getLogoUrl(domain: string) {
  return `https://cdn.brandfetch.io/${domain}/w/512/h/512/icon?c=1idYa6uaY9QLaZxDxo6`;
}

export default function LandingCompanyGrid() {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (domain: string) => {
    setImageErrors((prev) => new Set(prev).add(domain));
  };

  return (
    <div className="landing-company-grid">
      {companies.map((company) => (
        <div key={company.name} className="landing-company-card">
          {imageErrors.has(company.domain) ? (
            <div className="landing-company-logo-fallback">
              {company.name.charAt(0)}
            </div>
          ) : (
            <Image
              src={getLogoUrl(company.domain)}
              alt={company.name}
              width={48}
              height={48}
              className="landing-company-logo"
              onError={() => handleImageError(company.domain)}
              unoptimized
            />
          )}
          <div className="landing-company-info">
            <h4 className="landing-company-name">{company.name}</h4>
            <p className="landing-company-type">Coding Questions</p>
          </div>
          <div className="landing-company-footer">
            <span className="landing-company-count">{company.questionCount} questions</span>
            <span className="landing-company-arrow">→</span>
          </div>
        </div>
      ))}
    </div>
  );
}
