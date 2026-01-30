import { Section, Row, Column, Text, Link } from "@react-email/components";
import * as React from "react";

interface PricingCardProps {
  variant?: "featured" | "default";
  planName: string;
  originalPrice: string;
  discountedPrice: string;
  period: string;
  savings: string;
  ctaText: string;
  ctaUrl: string;
}

export function PricingCard({
  variant = "default",
  planName,
  originalPrice,
  discountedPrice,
  period,
  savings,
  ctaText,
  ctaUrl,
}: PricingCardProps) {
  const isFeatured = variant === "featured";

  return (
    <Column style={isFeatured ? featuredCardStyle : defaultCardStyle}>
      <Text style={isFeatured ? featuredPlanNameStyle : planNameStyle}>{planName}</Text>
      <Text style={isFeatured ? featuredOriginalPriceStyle : originalPriceStyle}>
        {originalPrice}
      </Text>
      <Text style={isFeatured ? featuredDiscountedPriceStyle : discountedPriceStyle}>
        {discountedPrice}
        <span style={periodStyle}>/{period}</span>
      </Text>
      <Text style={savingsStyle}>{savings}</Text>
      <Link href={ctaUrl} style={isFeatured ? featuredCtaStyle : ctaStyle}>
        {ctaText}
      </Link>
    </Column>
  );
}

interface PricingCardsContainerProps {
  children: React.ReactNode;
}

export function PricingCardsContainer({ children }: PricingCardsContainerProps) {
  return (
    <Section style={{ padding: "0 40px 32px" }}>
      <Row>{children}</Row>
    </Section>
  );
}

const featuredCardStyle: React.CSSProperties = {
  width: "48%",
  background: "linear-gradient(135deg, #1a1918 0%, #2d2b2a 100%)",
  borderRadius: "12px",
  padding: "28px",
  verticalAlign: "top",
};

const defaultCardStyle: React.CSSProperties = {
  width: "48%",
  backgroundColor: "#f8f7f6",
  border: "1px solid #e5e3e1",
  borderRadius: "12px",
  padding: "28px",
  verticalAlign: "top",
};

const featuredPlanNameStyle: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#999",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const planNameStyle: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#666",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const featuredOriginalPriceStyle: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#666",
  fontSize: "14px",
  textDecoration: "line-through",
};

const originalPriceStyle: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#999",
  fontSize: "14px",
  textDecoration: "line-through",
};

const featuredDiscountedPriceStyle: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#ffffff",
  fontSize: "36px",
  fontWeight: 700,
};

const discountedPriceStyle: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#1a1918",
  fontSize: "36px",
  fontWeight: 700,
};

const periodStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 400,
  color: "#999",
};

const savingsStyle: React.CSSProperties = {
  margin: "0 0 20px",
  color: "#22c55e",
  fontSize: "14px",
  fontWeight: 600,
};

const featuredCtaStyle: React.CSSProperties = {
  display: "block",
  backgroundColor: "#ffffff",
  color: "#1a1918",
  textDecoration: "none",
  padding: "14px 24px",
  borderRadius: "6px",
  fontWeight: 600,
  fontSize: "15px",
  textAlign: "center",
};

const ctaStyle: React.CSSProperties = {
  display: "block",
  backgroundColor: "#1a1918",
  color: "#ffffff",
  textDecoration: "none",
  padding: "14px 24px",
  borderRadius: "6px",
  fontWeight: 600,
  fontSize: "15px",
  textAlign: "center",
};

export default PricingCard;
