import { Section, Text, Link } from "@react-email/components";
import * as React from "react";

interface FooterProps {
  showUnsubscribe?: boolean;
  companyName?: string;
  tagline?: string;
}

export function Footer({
  showUnsubscribe = true,
  companyName = "Apex Interviewer",
  tagline = "AI-powered interview preparation for ambitious engineers",
}: FooterProps) {
  return (
    <Section style={footerStyle}>
      <Text style={companyNameStyle}>{companyName}</Text>
      <Text style={taglineStyle}>{tagline}</Text>
      {showUnsubscribe && (
        <Text style={unsubscribeStyle}>
          <Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" style={unsubscribeLinkStyle}>
            Unsubscribe
          </Link>
        </Text>
      )}
    </Section>
  );
}

const footerStyle: React.CSSProperties = {
  backgroundColor: "#faf9f7",
  padding: "32px 48px",
  borderTop: "1px solid #f0f0f0",
  textAlign: "center",
};

const companyNameStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "13px",
  color: "#1a1a1a",
  fontWeight: 500,
};

const taglineStyle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "12px",
  color: "#9ca3af",
};

const unsubscribeStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
};

const unsubscribeLinkStyle: React.CSSProperties = {
  color: "#9ca3af",
  textDecoration: "underline",
};

export default Footer;
