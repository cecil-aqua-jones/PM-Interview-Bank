import {
  Section,
  Text,
  Link,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout, Footer } from "./components";

interface NurtureDay7EmailProps {
  checkoutUrl: string;
}

export const NurtureDay7Email = ({ checkoutUrl }: NurtureDay7EmailProps) => {
  return (
    <EmailLayout preview="Your exclusive 20% off expires soon">
      <Section style={cardStyle}>
        {/* Header */}
        <Section style={headerStyle}>
          <Text style={headerLabelStyle}>Exclusive Offer</Text>
          <Text style={headerTitleStyle}>20% Off Ends Soon</Text>
        </Section>

        <Section style={contentSectionStyle}>
          <Text style={textStyle}>Hey there,</Text>
          <Text style={textStyle}>
            I wanted to give you a heads up: the 20% discount I offered you is
            expiring soon.
          </Text>
          <Text style={textStyle}>
            After that, you'll pay full price.
          </Text>
        </Section>

        {/* Pricing */}
        <Section style={pricingSectionStyle}>
          <Row>
            <Column style={priceCardStyle}>
              <Text style={planLabelStyle}>Annual</Text>
              <Text style={originalPriceStyle}>$500</Text>
              <Text style={discountedPriceStyle}>$400</Text>
            </Column>
            <Column style={{ width: "4%" }} />
            <Column style={priceCardStyle}>
              <Text style={planLabelStyle}>Monthly</Text>
              <Text style={originalPriceStyle}>$75</Text>
              <Text style={discountedPriceStyle}>$55</Text>
            </Column>
          </Row>
        </Section>

        {/* Features */}
        <Section style={featuresSectionStyle}>
          <Text style={featuresTitleStyle}>What you get:</Text>
          {[
            "Unlimited AI mock interviews",
            "13 company simulations (Google, Meta, Amazon, OpenAI...)",
            "Coding, system design, and behavioral prep",
            "Real-time AI feedback with follow-up questions",
            "2-day money-back guarantee",
          ].map((feature, i) => (
            <Text key={i} style={featureItemStyle}>
              ✓ {feature}
            </Text>
          ))}
        </Section>

        {/* CTA */}
        <Section style={ctaSectionStyle}>
          <Link
            href={`${checkoutUrl}?plan=annual&promo=WELCOME20`}
            style={ctaButtonStyle}
          >
            Claim 20% Off Now
          </Link>
          <Text style={promoCodeStyle}>
            Use code <strong>WELCOME20</strong> at checkout
          </Text>
        </Section>

        <Footer />
      </Section>
    </EmailLayout>
  );
};

export const subject = "Your exclusive 20% off expires soon";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid rgba(0,0,0,0.06)",
};

const headerStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1918 0%, #2d2b2a 100%)",
  padding: "40px 48px",
  textAlign: "center",
};

const headerLabelStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "12px",
  color: "rgba(255,255,255,0.6)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const headerTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "Georgia, serif",
  fontSize: "32px",
  fontWeight: 400,
  color: "#ffffff",
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

const pricingSectionStyle: React.CSSProperties = {
  padding: "0 48px 32px",
};

const priceCardStyle: React.CSSProperties = {
  width: "48%",
  backgroundColor: "#faf9f7",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center",
  border: "1px solid #f0f0f0",
};

const planLabelStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "12px",
  color: "#6b7280",
  textTransform: "uppercase",
};

const originalPriceStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "14px",
  color: "#9ca3af",
  textDecoration: "line-through",
};

const discountedPriceStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "28px",
  color: "#1a1a1a",
  fontWeight: 700,
};

const featuresSectionStyle: React.CSSProperties = {
  padding: "0 48px 32px",
};

const featuresTitleStyle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "15px",
  color: "#1a1a1a",
  fontWeight: 600,
};

const featureItemStyle: React.CSSProperties = {
  padding: "6px 0",
  fontSize: "14px",
  color: "#444",
  margin: 0,
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

const promoCodeStyle: React.CSSProperties = {
  margin: "16px 0 0",
  fontSize: "13px",
  color: "#6b7280",
};

export default NurtureDay7Email;
