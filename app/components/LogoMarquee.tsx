"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./LogoMarquee.module.css";

// Top 30 American tech companies
const TOP_TECH_COMPANIES = [
  { name: "Google", domain: "google.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "Adobe", domain: "adobe.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "Nvidia", domain: "nvidia.com" },
  { name: "Intel", domain: "intel.com" },
  { name: "Cisco", domain: "cisco.com" },
  { name: "IBM", domain: "ibm.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Airbnb", domain: "airbnb.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Shopify", domain: "shopify.com" },
  { name: "Square", domain: "squareup.com" },
  { name: "Snap", domain: "snap.com" },
  { name: "Pinterest", domain: "pinterest.com" },
  { name: "Spotify", domain: "spotify.com" },
  { name: "Slack", domain: "slack.com" },
  { name: "Zoom", domain: "zoom.us" },
  { name: "Dropbox", domain: "dropbox.com" },
  { name: "PayPal", domain: "paypal.com" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "Twitter", domain: "x.com" },
  { name: "DoorDash", domain: "doordash.com" },
  { name: "Coinbase", domain: "coinbase.com" },
  { name: "Databricks", domain: "databricks.com" },
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
  const companies = [...TOP_TECH_COMPANIES, ...TOP_TECH_COMPANIES];

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
