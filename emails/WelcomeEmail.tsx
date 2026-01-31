import {
  Section,
  Text,
  Link,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout, Header, Footer, Testimonial, TestimonialsContainer } from "./components";

interface WelcomeEmailProps {
  firstName?: string;
  promoCode: string;
  expiryDate: string;
  checkoutUrl: string;
}

export const WelcomeEmail = ({
  firstName,
  promoCode,
  expiryDate,
  checkoutUrl,
}: WelcomeEmailProps) => {
  const name = firstName || "there";

  return (
    <EmailLayout preview={`Save 20% on your interview prep - expires ${expiryDate}`}>
      <Section style={cardStyle}>
        <Header variant="dark" title="Apex Interviewer" />

        {/* Hero Section */}
        <Section style={heroSectionStyle}>
          <Text style={exclusiveLabel}>Exclusive Offer</Text>
          <Text style={heroTitle}>Save 20% on Your Interview Prep</Text>
          <Text style={heroText}>Hey {name},</Text>
          <Text style={heroText}>
            You were just checking out Apex Interviewer, the AI-powered interview
            training that's helped engineers land roles at Google, Meta, Amazon,
            OpenAI, and more.
          </Text>
          <Text style={heroText}>
            Before you go, I wanted to offer you something special:{" "}
            <strong>20% off any plan</strong>.
          </Text>
        </Section>

        {/* Pricing Cards */}
        <Section style={pricingSectionStyle}>
          <Row>
            <Column style={featuredCardStyle}>
              <Text style={featuredPlanLabel}>Annual</Text>
              <Text style={originalPriceWhite}>$500/year</Text>
              <Text style={discountedPriceWhite}>
                $400<span style={periodStyle}>/year</span>
              </Text>
              <Text style={savingsText}>Save $100</Text>
              <Link
                href={`${checkoutUrl}?plan=annual&promo=${promoCode}`}
                style={featuredCtaStyle}
              >
                Get Annual Access →
              </Link>
            </Column>
            <Column style={{ width: "4%" }} />
            <Column style={defaultCardStyle}>
              <Text style={planLabel}>Monthly</Text>
              <Text style={originalPrice}>$75/month</Text>
              <Text style={discountedPrice}>
                $55<span style={periodStyleDark}>/month</span>
              </Text>
              <Text style={savingsText}>Save $20/mo</Text>
              <Link
                href={`${checkoutUrl}?plan=monthly&promo=${promoCode}`}
                style={defaultCtaStyle}
              >
                Start Monthly →
              </Link>
            </Column>
          </Row>
        </Section>

        {/* Urgency */}
        <Section style={urgencySectionStyle}>
          <Section style={urgencyBoxStyle}>
            <Text style={urgencyText}>
              ⏰ This offer expires <strong>{expiryDate}</strong>
            </Text>
          </Section>
        </Section>

        {/* Social Proof */}
        <TestimonialsContainer title="What engineers are saying:">
          <Testimonial
            quote="After failing my first two Google interviews, I did 30 mock interviews here. The AI caught every unclear explanation. Passed my third attempt."
            author="David C."
            result="now at Google, $145k → $280k"
          />
          <Testimonial
            quote="Better feedback than my $200/hr interview coach. The AI caught mistakes I didn't even know I was making."
            author="Aisha P."
            result="now at Meta, $165k → $310k"
          />
        </TestimonialsContainer>

        {/* What You Get */}
        <Section style={featuresSectionStyle}>
          <Text style={featuresTitle}>What's included:</Text>
          <FeatureList />
        </Section>

        {/* Final CTA */}
        <Section style={finalCtaSectionStyle}>
          <Link
            href={`${checkoutUrl}?plan=annual&promo=${promoCode}`}
            style={finalCtaButtonStyle}
          >
            Claim Your 20% Discount →
          </Link>
          <Text style={promoCodeText}>
            Use code <strong>{promoCode}</strong> at checkout
          </Text>
        </Section>

        <Footer />
      </Section>
    </EmailLayout>
  );
};

const FeatureList = () => (
  <Section>
    {[
      "Verified questions from actual tech interviews",
      "Company-specific rubrics for coding, system design, and behavioral",
      "Unlimited practice sessions, 24/7",
      "Company-specific simulations (Google, Meta, Amazon, OpenAI...)",
      "Realistic follow-up questions that probe your thinking",
      "Performance analytics & progress tracking",
      "2-day money-back guarantee",
    ].map((feature, i) => (
      <Text key={i} style={featureItemStyle}>
        ✓ {feature}
      </Text>
    ))}
  </Section>
);

export const getSubject = (firstName?: string, expiryDate?: string) =>
  `${firstName ? `${firstName}, your` : "Your"} exclusive 20% off expires ${expiryDate}`;

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const heroSectionStyle: React.CSSProperties = {
  padding: "48px 40px 32px",
};

const exclusiveLabel: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#666",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const heroTitle: React.CSSProperties = {
  margin: "0 0 24px",
  color: "#1a1918",
  fontSize: "32px",
  fontWeight: 700,
  lineHeight: 1.2,
};

const heroText: React.CSSProperties = {
  margin: "0 0 24px",
  color: "#444",
  fontSize: "17px",
  lineHeight: 1.6,
};

const pricingSectionStyle: React.CSSProperties = {
  padding: "0 40px 32px",
};

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

const featuredPlanLabel: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#999",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const planLabel: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#666",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const originalPriceWhite: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#666",
  fontSize: "14px",
  textDecoration: "line-through",
};

const originalPrice: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#999",
  fontSize: "14px",
  textDecoration: "line-through",
};

const discountedPriceWhite: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#ffffff",
  fontSize: "36px",
  fontWeight: 700,
};

const discountedPrice: React.CSSProperties = {
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

const periodStyleDark: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 400,
  color: "#666",
};

const savingsText: React.CSSProperties = {
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

const defaultCtaStyle: React.CSSProperties = {
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

const urgencySectionStyle: React.CSSProperties = {
  padding: "0 40px 32px",
};

const urgencyBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "20px",
};

const urgencyText: React.CSSProperties = {
  margin: 0,
  color: "#92400e",
  fontSize: "15px",
  fontWeight: 600,
  textAlign: "center",
};

const featuresSectionStyle: React.CSSProperties = {
  padding: "0 40px 40px",
};

const featuresTitle: React.CSSProperties = {
  margin: "0 0 16px",
  color: "#1a1918",
  fontSize: "18px",
  fontWeight: 600,
};

const featureItemStyle: React.CSSProperties = {
  padding: "8px 0",
  color: "#444",
  fontSize: "15px",
  margin: 0,
};

const finalCtaSectionStyle: React.CSSProperties = {
  padding: "0 40px 48px",
  textAlign: "center",
};

const finalCtaButtonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#1a1918",
  color: "#ffffff",
  textDecoration: "none",
  padding: "18px 48px",
  borderRadius: "6px",
  fontWeight: 600,
  fontSize: "17px",
};

const promoCodeText: React.CSSProperties = {
  margin: "16px 0 0",
  color: "#666",
  fontSize: "13px",
};

export default WelcomeEmail;
