import {
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout, Header, Footer } from "./components";

interface NurtureDay14EmailProps {
  checkoutUrl: string;
}

export const NurtureDay14Email = ({ checkoutUrl }: NurtureDay14EmailProps) => {
  return (
    <EmailLayout preview="Final notice: We're removing your discount">
      <Section style={cardStyle}>
        <Header variant="urgent" title="FINAL NOTICE" />

        <Section style={contentSectionStyle}>
          <Text style={textStyle}>This is my last email about this.</Text>
          <Text style={textStyle}>
            Your 20% discount code (<strong>WELCOME20</strong>) is being removed
            from your account tonight.
          </Text>
          <Text style={textStyle}>
            After this, you'll pay full price if you decide to start later.
          </Text>
        </Section>

        <Section style={priceBoxSectionStyle}>
          <Section style={priceBoxStyle}>
            <Text style={priceLabelStyle}>Your final price</Text>
            <Text style={originalPriceStyle}>$500/year</Text>
            <Text style={finalPriceStyle}>$400</Text>
          </Section>
        </Section>

        <Section style={contentSectionStyle}>
          <Text style={textStyle}>
            If you're serious about landing a role at Google, Meta, Amazon,
            OpenAI, or any top tech company, interview prep is non-negotiable.
          </Text>
        </Section>

        <Section style={ctaSectionStyle}>
          <Link
            href={`${checkoutUrl}?plan=annual&promo=WELCOME20`}
            style={ctaButtonStyle}
          >
            Use My Discount Before It's Gone
          </Link>
          <Text style={closingStyle}>
            Or pay $500 later. Your call.
          </Text>
        </Section>

        <Footer />
      </Section>
    </EmailLayout>
  );
};

export const subject = "Final notice: We're removing your discount";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid rgba(0,0,0,0.06)",
};

const contentSectionStyle: React.CSSProperties = {
  padding: "40px 48px 24px",
};

const textStyle: React.CSSProperties = {
  margin: "0 0 20px",
  color: "#1a1a1a",
  fontSize: "17px",
  lineHeight: 1.7,
};

const priceBoxSectionStyle: React.CSSProperties = {
  padding: "0 48px 32px",
};

const priceBoxStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
  borderRadius: "8px",
  padding: "32px",
  textAlign: "center",
};

const priceLabelStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "rgba(255,255,255,0.8)",
  fontSize: "14px",
};

const originalPriceStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "rgba(255,255,255,0.6)",
  fontSize: "16px",
  textDecoration: "line-through",
};

const finalPriceStyle: React.CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontSize: "48px",
  fontWeight: 700,
};

const ctaSectionStyle: React.CSSProperties = {
  padding: "0 48px 40px",
  textAlign: "center",
};

const ctaButtonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#1a1918",
  borderRadius: "4px",
  padding: "18px 48px",
  fontSize: "13px",
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#ffffff",
  textDecoration: "none",
};

const closingStyle: React.CSSProperties = {
  margin: "16px 0 0",
  fontSize: "14px",
  color: "#6b7280",
};

export default NurtureDay14Email;
