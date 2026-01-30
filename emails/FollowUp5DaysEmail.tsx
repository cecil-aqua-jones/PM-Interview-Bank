import {
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout, Header, Footer } from "./components";

interface FollowUp5DaysEmailProps {
  firstName?: string;
  promoCode: string;
  expiryDate: string;
  checkoutUrl: string;
}

export const FollowUp5DaysEmail = ({
  firstName,
  promoCode,
  expiryDate,
  checkoutUrl,
}: FollowUp5DaysEmailProps) => {
  const name = firstName || "there";

  return (
    <EmailLayout preview="3 days left — Engineers who waited regret it">
      <Section style={cardStyle}>
        <Header variant="dark" title="Apex Interviewer" />

        <Section style={contentSectionStyle}>
          <Text style={greetingStyle}>Hey {name},</Text>
          <Text style={textStyle}>
            <strong>3 days left</strong> on your 20% discount.
          </Text>
          <Text style={textStyle}>
            I've seen engineers put off interview prep until the week before
            their interview—then panic when they realize they're not ready.
          </Text>
          <Text style={textStyle}>
            The ones who start early? They walk in confident because they've
            done 20, 30, 50 mock interviews. They've heard every follow-up
            question. They've fixed every weak spot.
          </Text>

          <Section style={urgencyBoxStyle}>
            <Text style={urgencyDaysStyle}>3 DAYS LEFT</Text>
            <Text style={urgencySubtitleStyle}>
              Your $400/year price expires {expiryDate}
            </Text>
          </Section>

          <Section style={ctaSectionStyle}>
            <Link
              href={`${checkoutUrl}?plan=annual&promo=${promoCode}`}
              style={ctaButtonStyle}
            >
              Start Training Now →
            </Link>
          </Section>
        </Section>

        <Footer />
      </Section>
    </EmailLayout>
  );
};

export const subject = "🔥 3 days left — Engineers who waited regret it";

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

const urgencyBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center",
};

const urgencyDaysStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#dc2626",
  fontSize: "24px",
  fontWeight: 700,
};

const urgencySubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#991b1b",
  fontSize: "14px",
};

const ctaSectionStyle: React.CSSProperties = {
  margin: "32px 0",
  textAlign: "center",
};

const ctaButtonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#dc2626",
  color: "#ffffff",
  textDecoration: "none",
  padding: "16px 40px",
  borderRadius: "6px",
  fontWeight: 600,
  fontSize: "16px",
};

export default FollowUp5DaysEmail;
