"use client";

import { useState, useEffect, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [animatedCounts, setAnimatedCounts] = useState<number[]>(companies.map(() => 0));
  const [isInView, setIsInView] = useState(false);

  const handleImageError = (domain: string) => {
    setImageErrors((prev) => new Set(prev).add(domain));
  };

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isInView) return;

    let animationFrame: number;
    let timeoutId: NodeJS.Timeout;

    const runAnimation = () => {
      const duration = 1500; // 1.5s to count up
      const startTime = performance.now();
      const targets = companies.map((c) => c.questionCount);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setAnimatedCounts(targets.map((target) => Math.round(target * easeOut)));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          // Hold at target for 3s, then reset and restart
          timeoutId = setTimeout(() => {
            setAnimatedCounts(companies.map(() => 0));
            // Small pause before restart
            setTimeout(runAnimation, 500);
          }, 3000);
        }
      };

      animationFrame = requestAnimationFrame(animate);
    };

    runAnimation();

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timeoutId);
    };
  }, [isInView]);

  return (
    <div className="landing-company-grid" ref={containerRef}>
      {companies.map((company, index) => (
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
            <span className="landing-company-count">{animatedCounts[index]} questions</span>
            <span className="landing-company-arrow">→</span>
          </div>
        </div>
      ))}
    </div>
  );
}
