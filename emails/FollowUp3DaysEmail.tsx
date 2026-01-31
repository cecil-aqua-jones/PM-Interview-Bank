import {
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout, Header, Footer } from "./components";

interface FollowUp3DaysEmailProps {
  firstName?: string;
  promoCode: string;
  expiryDate: string;
  checkoutUrl: string;
}

export const FollowUp3DaysEmail = ({
  firstName,
  promoCode,
  expiryDate,
  checkoutUrl,
}: FollowUp3DaysEmailProps) => {
  const name = firstName || "there";

  return (
    <EmailLayout preview="5 days left: Your 20% discount expires soon">
      <Section style={cardStyle}>
        <Header variant="dark" title="Apex Interviewer" />

        <Section style={contentSectionStyle}>
          <Text style={greetingStyle}>Hey {name},</Text>
          <Text style={textStyle}>
            Quick reminder: your exclusive 20% discount expires in{" "}
            <strong>5 days</strong>.
          </Text>
          <Text style={textStyle}>
            Every day you wait is another day you could be practicing with AI
            that catches the mistakes real interviewers will catch, before they
            cost you the job.
          </Text>

          <Section style={priceBoxStyle}>
            <Text style={priceText}>
              Your price: <span style={strikethroughStyle}>$500</span> →{" "}
              <strong>$400/year</strong>
            </Text>
          </Section>

          <Section style={ctaSectionStyle}>
            <Link
              href={`${checkoutUrl}?plan=annual&promo=${promoCode}`}
              style={ctaButtonStyle}
            >
              Lock In Your Discount →
            </Link>
          </Section>

          <Text style={promoCodeStyle}>
            Code <strong>{promoCode}</strong> • Expires {expiryDate}
          </Text>
        </Section>

        <Footer />
      </Section>
    </EmailLayout>
  );
};

export const subject = "⏰ 5 days left: Your 20% discount expires soon";

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
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center",
};

const priceText: React.CSSProperties = {
  margin: 0,
  color: "#92400e",
  fontSize: "16px",
  fontWeight: 600,
};

const strikethroughStyle: React.CSSProperties = {
  textDecoration: "line-through",
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
  padding: "16px 40px",
  borderRadius: "6px",
  fontWeight: 600,
  fontSize: "16px",
};

const promoCodeStyle: React.CSSProperties = {
  margin: "24px 0 0",
  color: "#666",
  fontSize: "14px",
  textAlign: "center",
};

export default FollowUp3DaysEmail;
