"use client";

import { useState } from "react";
import Image from "next/image";

type LogoItem = {
  name: string;
  slug: string;
  logoUrl: string;
  initial: string;
};

type LandingLogosProps = {
  logos: LogoItem[];
};

export default function LandingLogos({ logos }: LandingLogosProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (slug: string) => {
    setImageErrors((prev) => new Set(prev).add(slug));
  };

  return (
    <div className="logo-grid">
      {logos.map((logo) => (
        <div key={logo.slug} className="logo-item">
          {imageErrors.has(logo.slug) ? (
            <div className="logo-item-fallback">{logo.initial}</div>
          ) : (
            <Image
              src={logo.logoUrl}
              alt={`${logo.name} logo`}
              width={40}
              height={40}
              onError={() => handleImageError(logo.slug)}
              unoptimized
            />
          )}
          <span>{logo.name}</span>
        </div>
      ))}
    </div>
  );
}
