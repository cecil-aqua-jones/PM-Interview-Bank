"use client";

import { useState } from "react";
import Image from "next/image";

type SuccessStory = {
  name: string;
  fromCompany: string;
  fromDomain: string;
  toCompany: string;
  toDomain: string;
  prevTC: string;
  newTC: string;
  increase: string;
  quote: string;
  gridArea: string;
};

const stories: SuccessStory[] = [
  {
    name: "Sarah K.",
    fromCompany: "Uber",
    fromDomain: "uber.com",
    toCompany: "Google",
    toDomain: "google.com",
    prevTC: "$145k",
    newTC: "$280k",
    increase: "93",
    quote: "Passed Google on my third attempt.",
    gridArea: "card1",
  },
  {
    name: "Marcus T.",
    fromCompany: "Amazon",
    fromDomain: "amazon.com",
    toCompany: "Meta",
    toDomain: "meta.com",
    prevTC: "$165k",
    newTC: "$310k",
    increase: "88",
    quote: "Better feedback than my $200/hr interview coach. The AI caught mistakes I didn't even know I was making.",
    gridArea: "card2",
  },
  {
    name: "Priya S.",
    fromCompany: "Microsoft",
    fromDomain: "microsoft.com",
    toCompany: "Amazon",
    toDomain: "amazon.com",
    prevTC: "$125k",
    newTC: "$245k",
    increase: "96",
    quote: "Finally understood what interviewers actually want. After 20 mock interviews, I went from nervous to confident. The system design feedback alone was worth it.",
    gridArea: "card3",
  },
  {
    name: "David C.",
    fromCompany: "Google",
    fromDomain: "google.com",
    toCompany: "OpenAI",
    toDomain: "openai.com",
    prevTC: "$180k",
    newTC: "$340k",
    increase: "89",
    quote: "Follow-up questions were brutal—exactly what I needed.",
    gridArea: "card4",
  },
  {
    name: "Aisha P.",
    fromCompany: "Meta",
    fromDomain: "meta.com",
    toCompany: "Anthropic",
    toDomain: "anthropic.com",
    prevTC: "$155k",
    newTC: "$295k",
    increase: "90",
    quote: "Went from failing phone screens to landing Anthropic.",
    gridArea: "card5",
  },
  {
    name: "Jake M.",
    fromCompany: "Apple",
    fromDomain: "apple.com",
    toCompany: "Netflix",
    toDomain: "netflix.com",
    prevTC: "$140k",
    newTC: "$260k",
    increase: "86",
    quote: "30 mock interviews here prepared me for the real thing. Landed Netflix with a 86% TC increase.",
    gridArea: "card6",
  },
];

function getLogoUrl(domain: string) {
  return `https://cdn.brandfetch.io/${domain}/w/512/h/512/icon?c=1idYa6uaY9QLaZxDxo6`;
}

export default function SocialProofCarousel() {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (domain: string) => {
    setImageErrors((prev) => new Set(prev).add(domain));
  };

  return (
    <section className="bento-section">
      <div className="container">
        <h2 className="bento-heading">Real Results from Real Engineers</h2>
        <div className="bento-grid">
          {stories.map((story) => (
            <article
              key={story.gridArea}
              className="bento-card"
              style={{ gridArea: story.gridArea }}
            >
              <div className="bento-logos">
                {imageErrors.has(story.fromDomain) ? (
                  <div className="bento-logo-fallback">
                    {story.fromCompany.charAt(0)}
                  </div>
                ) : (
                  <Image
                    src={getLogoUrl(story.fromDomain)}
                    alt={story.fromCompany}
                    width={48}
                    height={48}
                    className="bento-logo"
                    onError={() => handleImageError(story.fromDomain)}
                    unoptimized
                  />
                )}
                <span className="bento-arrow">→</span>
                {imageErrors.has(story.toDomain) ? (
                  <div className="bento-logo-fallback">
                    {story.toCompany.charAt(0)}
                  </div>
                ) : (
                  <Image
                    src={getLogoUrl(story.toDomain)}
                    alt={story.toCompany}
                    width={48}
                    height={48}
                    className="bento-logo"
                    onError={() => handleImageError(story.toDomain)}
                    unoptimized
                  />
                )}
              </div>
              <p className="bento-quote">"{story.quote}"</p>
              <div className="bento-footer">
                <div className="bento-tc">
                  <span className="bento-tc-change">
                    {story.prevTC} → {story.newTC}
                  </span>
                </div>
                <div className="bento-increase">
                  <span className="bento-increase-value">+{story.increase}%</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
