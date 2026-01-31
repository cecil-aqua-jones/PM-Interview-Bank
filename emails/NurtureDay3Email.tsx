import {
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout, Header, Footer, Testimonial } from "./components";

interface NurtureDay3EmailProps {
  checkoutUrl: string;
}

export const NurtureDay3Email = ({ checkoutUrl }: NurtureDay3EmailProps) => {
  return (
    <EmailLayout preview="Quick question about your interview prep">
      <Section style={cardStyle}>
        <Header />

        <Section style={contentSectionStyle}>
          <Text style={textStyle}>Hey there,</Text>
          <Text style={textStyle}>
            I noticed you signed up for Apex Interviewer but haven't started
            training yet.
          </Text>
          <Text style={textStyle}>
            Quick question:{" "}
            <strong>Are you actively preparing for tech interviews right now?</strong>
          </Text>
          <Text style={textStyle}>
            If so, I wanted to share something that might help. Our platform has{" "}
            <strong>verified questions from actual Google, Meta, and Amazon interviews</strong> with 
            company-specific rubrics for coding, system design, and behavioral. Practice as many times 
            as you need. Last month, engineers using our simulations saw results like these:
          </Text>
        </Section>

        <Section style={testimonialsSectionStyle}>
          <Section style={testimonialBoxStyle}>
            <Text style={quoteStyle}>
              "Passed Google on my third attempt after 30 mock interviews here."
            </Text>
            <Text style={authorStyle}>- Sarah K., $145k → $280k (+93%)</Text>
          </Section>
          <Section style={testimonialBoxStyle}>
            <Text style={quoteStyle}>
              "Better feedback than my $200/hr interview coach."
            </Text>
            <Text style={authorStyle}>- Marcus T., now at Meta</Text>
          </Section>
        </Section>

        <Section style={contentSectionStyle}>
          <Text style={textStyle}>
            To help you get started, I'm offering you <strong>20% off</strong>{" "}
            any plan:
          </Text>

          <Link
            href={`${checkoutUrl}?plan=annual&promo=WELCOME20`}
            style={ctaButtonStyle}
          >
            $400/year (was $500). Get Started →
          </Link>

          <Text style={altPriceStyle}>
            or $55/month (was $75) • Use code <strong>WELCOME20</strong>
          </Text>
        </Section>

        <Footer />
      </Section>
    </EmailLayout>
  );
};

export const subject = "Quick question about your interview prep";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid rgba(0,0,0,0.06)",
};

const contentSectionStyle: React.CSSProperties = {
  padding: "0 48px 32px",
};

const textStyle: React.CSSProperties = {
  margin: "0 0 20px",
  color: "#1a1a1a",
  fontSize: "17px",
  lineHeight: 1.7,
};

const testimonialsSectionStyle: React.CSSProperties = {
  padding: "0 48px 32px",
};

const testimonialBoxStyle: React.CSSProperties = {
  backgroundColor: "#faf9f7",
  borderRadius: "8px",
  border: "1px solid #f0f0f0",
  padding: "20px 24px",
  marginBottom: "16px",
};

const quoteStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "14px",
  color: "#1a1a1a",
  fontStyle: "italic",
};

const authorStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#6b7280",
};

const ctaButtonStyle: React.CSSProperties = {
  display: "block",
  backgroundColor: "#1a1918",
  borderRadius: "4px",
  textAlign: "center",
  padding: "18px 24px",
  fontSize: "14px",
  fontWeight: 500,
  letterSpacing: "0.05em",
  color: "#ffffff",
  textDecoration: "none",
  marginBottom: "16px",
};

const altPriceStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#6b7280",
  textAlign: "center",
};

export default NurtureDay3Email;
