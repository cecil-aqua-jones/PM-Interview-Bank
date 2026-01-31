import {
  Section,
  Text,
  Link,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout, Header, Footer } from "./components";

interface SubscriptionConfirmationEmailProps {
  planName: string;
  amount: string;
  dashboardUrl: string;
}

export const SubscriptionConfirmationEmail = ({
  planName,
  amount,
  dashboardUrl,
}: SubscriptionConfirmationEmailProps) => {
  return (
    <EmailLayout preview="Welcome to Apex Interviewer — Your training begins now">
      <Section style={cardStyle}>
        {/* Success Header */}
        <Header
          variant="success"
          title="Welcome to Apex Interviewer"
          subtitle="Your journey to interview mastery starts now"
        />

        {/* Order Summary */}
        <Section style={orderSummarySectionStyle}>
          <Section style={orderSummaryBoxStyle}>
            <Text style={orderLabelStyle}>Your Plan</Text>
            <Text style={orderPlanStyle}>{planName}</Text>
            <Section style={orderDividerStyle}>
              <Row>
                <Column>
                  <Text style={orderDetailLabelStyle}>Amount paid</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={orderDetailValueStyle}>{amount}</Text>
                </Column>
              </Row>
            </Section>
          </Section>
        </Section>

        {/* What's Included */}
        <Section style={includedSectionStyle}>
          <Text style={includedTitleStyle}>What you now have access to</Text>
          
          <FeatureItem
            title="Unlimited AI Mock Interviews"
            description="Practice coding, system design, and behavioral interviews 24/7"
          />
          <FeatureItem
            title="RealCompany Simulations"
            description="Google, Meta, Amazon, OpenAI, Anthropic, and more"
          />
          <FeatureItem
            title="Real-Time AI Feedback"
            description="Get detailed feedback on every answer, grounded in your transcript"
          />
          <FeatureItem
            title="Performance Analytics"
            description="Track your improvement across 50+ patterns and skills"
            isLast
          />
        </Section>

        {/* CTA Button */}
        <Section style={ctaSectionStyle}>
          <Link href={dashboardUrl} style={ctaButtonStyle}>
            Start Your First Interview
          </Link>
        </Section>

        {/* Pro Tip */}
        <Section style={proTipSectionStyle}>
          <Section style={proTipBoxStyle}>
            <Text style={proTipTitleStyle}>
              💡 Pro tip to maximize your results
            </Text>
            <Text style={proTipTextStyle}>
              Engineers who do 20+ mock interviews before their real interview are{" "}
              <strong>3x more likely</strong> to receive an offer. Start with a
              coding interview today to establish your baseline.
            </Text>
          </Section>
        </Section>

        {/* Footer */}
        <Footer
          showUnsubscribe={false}
          tagline="Built for ambitious engineers"
        />
      </Section>

      {/* Receipt Note */}
      <Section style={receiptNoteSectionStyle}>
        <Text style={receiptNoteStyle}>
          A receipt has been sent to your email. You can also view your billing
          history in your account settings.
        </Text>
      </Section>
    </EmailLayout>
  );
};

// Feature Item Component
interface FeatureItemProps {
  title: string;
  description: string;
  isLast?: boolean;
}

const FeatureItem = ({ title, description, isLast }: FeatureItemProps) => (
  <Section style={isLast ? featureItemLastStyle : featureItemStyle}>
    <Row>
      <Column style={{ width: "24px", verticalAlign: "top" }}>
        <span style={{ color: "#22c55e", fontSize: "14px" }}>✓</span>
      </Column>
      <Column style={{ paddingLeft: "12px" }}>
        <Text style={featureTitleStyle}>{title}</Text>
        <Text style={featureDescStyle}>{description}</Text>
      </Column>
    </Row>
  </Section>
);

// Subject line export
export const subject = "Welcome to Apex Interviewer — Your training begins now";

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid rgba(0,0,0,0.06)",
};

const orderSummarySectionStyle: React.CSSProperties = {
  padding: "40px 48px 32px",
};

const orderSummaryBoxStyle: React.CSSProperties = {
  backgroundColor: "#faf9f7",
  borderRadius: "8px",
  border: "1px solid #f0f0f0",
  padding: "24px",
};

const orderLabelStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "11px",
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const orderPlanStyle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "18px",
  color: "#1a1a1a",
  fontWeight: 600,
};

const orderDividerStyle: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  paddingTop: "16px",
};

const orderDetailLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#6b7280",
};

const orderDetailValueStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "15px",
  color: "#1a1a1a",
  fontWeight: 600,
};

const includedSectionStyle: React.CSSProperties = {
  padding: "0 48px 32px",
};

const includedTitleStyle: React.CSSProperties = {
  margin: "0 0 20px",
  fontSize: "11px",
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const featureItemStyle: React.CSSProperties = {
  padding: "12px 0",
  borderBottom: "1px solid #f0f0f0",
};

const featureItemLastStyle: React.CSSProperties = {
  padding: "12px 0",
};

const featureTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  color: "#1a1a1a",
  fontWeight: 500,
};

const featureDescStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "13px",
  color: "#6b7280",
};

const ctaSectionStyle: React.CSSProperties = {
  padding: "8px 48px 40px",
  textAlign: "center",
};

const ctaButtonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "18px 48px",
  backgroundColor: "#1a1918",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#ffffff",
  textDecoration: "none",
};

const proTipSectionStyle: React.CSSProperties = {
  padding: "0 48px 40px",
};

const proTipBoxStyle: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  borderRadius: "8px",
  border: "1px solid #fef3c7",
  padding: "20px 24px",
};

const proTipTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "14px",
  color: "#92400e",
  fontWeight: 600,
};

const proTipTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#78350f",
  lineHeight: 1.6,
};

const receiptNoteSectionStyle: React.CSSProperties = {
  padding: "24px 20px",
  textAlign: "center",
};

const receiptNoteStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "11px",
  color: "#9ca3af",
  lineHeight: 1.6,
};

export default SubscriptionConfirmationEmail;
