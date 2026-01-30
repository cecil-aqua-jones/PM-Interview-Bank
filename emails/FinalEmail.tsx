import {
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout, Header, Footer } from "./components";

interface FinalEmailProps {
  firstName?: string;
  promoCode: string;
  checkoutUrl: string;
}

export const FinalEmail = ({
  firstName,
  promoCode,
  checkoutUrl,
}: FinalEmailProps) => {
  const name = firstName || "there";

  return (
    <EmailLayout preview="FINAL HOURS: Your discount expires at midnight">
      <Section style={cardStyle}>
        <Header variant="urgent" title="⏰ FINAL HOURS" />

        <Section style={contentSectionStyle}>
          <Text style={greetingStyle}>{name},</Text>
          <Text style={textStyle}>
            This is it. Your 20% discount expires{" "}
            <strong>tonight at midnight</strong>.
          </Text>
          <Text style={textStyle}>
            After tonight, you'll pay full price: $500 instead of $400.
          </Text>

          <Section style={priceBoxStyle}>
            <Text style={priceLabelStyle}>Your final price</Text>
            <Text style={originalPriceStyle}>$500/year</Text>
            <Text style={finalPriceStyle}>$400</Text>
          </Section>

          <Section style={ctaSectionStyle}>
            <Link
              href={`${checkoutUrl}?plan=annual&promo=${promoCode}`}
              style={ctaButtonStyle}
            >
              Claim Before Midnight →
            </Link>
          </Section>

          <Text style={closingStyle}>Don't let $100 slip away.</Text>
        </Section>

        <Footer />
      </Section>
    </EmailLayout>
  );
};

export const subject = "🚨 FINAL HOURS: Your discount expires at midnight";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
};

const contentSectionStyle: React.CSSProperties = {
  padding: "40px",
};

const greetingStyle: React.CSSProperties = {
  margin: "0 0 20px",
  color: "#444",
  fontSize: "17px",
  lineHeight: 1.6,
};

const textStyle: React.CSSProperties = {
  margin: "0 0 20px",
  color: "#444",
  fontSize: "17px",
  lineHeight: 1.6,
};

const priceBoxStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
  borderRadius: "8px",
  padding: "32px",
  margin: "24px 0",
  textAlign: "center",
};

const priceLabelStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#ffffff",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const originalPriceStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#fecaca",
  fontSize: "18px",
  textDecoration: "line-through",
};

const finalPriceStyle: React.CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontSize: "48px",
  fontWeight: 700,
};

const ctaSectionStyle: React.CSSProperties = {
  margin: "32px 0",
  textAlign: "center",
};

const ctaButtonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#1a1918",
  color: "#ffffff",
  textDecoration: "none",
  padding: "18px 48px",
  borderRadius: "6px",
  fontWeight: 600,
  fontSize: "17px",
};

const closingStyle: React.CSSProperties = {
  margin: "24px 0 0",
  color: "#666",
  fontSize: "15px",
  textAlign: "center",
};

export default FinalEmail;
