import {
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout, Header, Footer } from "./components";

interface MagicLinkEmailProps {
  magicLink: string;
  expiresIn?: string;
}

export const MagicLinkEmail = ({
  magicLink,
  expiresIn = "15 minutes",
}: MagicLinkEmailProps) => {
  return (
    <EmailLayout preview="Sign in to Apex Interviewer">
      <Section style={cardStyle}>
        <Header />

        {/* Title */}
        <Section style={titleSectionStyle}>
          <Text style={titleStyle}>Sign in to your account</Text>
        </Section>

        {/* Subtitle */}
        <Section style={subtitleSectionStyle}>
          <Text style={subtitleStyle}>
            Click the button below to securely sign in.
            <br />
            This link expires in {expiresIn}.
          </Text>
        </Section>

        {/* CTA Button */}
        <Section style={buttonSectionStyle}>
          <Link href={magicLink} style={buttonStyle}>
            Sign In to Apex
          </Link>
        </Section>

        {/* Divider */}
        <Section style={{ padding: "0 48px" }}>
          <Hr style={dividerStyle} />
        </Section>

        {/* Alternative Link */}
        <Section style={altLinkSectionStyle}>
          <Text style={altLinkLabelStyle}>Or copy this link</Text>
          <Text style={altLinkStyle}>{magicLink}</Text>
        </Section>

        {/* Security Note */}
        <Section style={securityNoteSectionStyle}>
          <Text style={securityNoteStyle}>
            If you didn't request this email, you can safely ignore it.
          </Text>
        </Section>

        {/* Footer */}
        <Footer showUnsubscribe={false} />
      </Section>

      {/* Bottom Text */}
      <Section style={bottomTextSectionStyle}>
        <Text style={bottomTextStyle}>
          This is an automated message from Apex Interviewer.
          <br />
          Please do not reply to this email.
        </Text>
      </Section>
    </EmailLayout>
  );
};

// Subject line export
export const subject = "Sign in to Apex Interviewer";

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid rgba(0,0,0,0.06)",
};

const titleSectionStyle: React.CSSProperties = {
  padding: "0 48px 16px",
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: "28px",
  fontWeight: 400,
  color: "#1a1a1a",
  letterSpacing: "-0.5px",
};

const subtitleSectionStyle: React.CSSProperties = {
  padding: "0 48px 40px",
  textAlign: "center",
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "15px",
  color: "#6b7280",
  lineHeight: 1.6,
};

const buttonSectionStyle: React.CSSProperties = {
  padding: "0 48px 40px",
  textAlign: "center",
};

const buttonStyle: React.CSSProperties = {
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

const dividerStyle: React.CSSProperties = {
  borderTop: "1px solid #f0f0f0",
  margin: 0,
};

const altLinkSectionStyle: React.CSSProperties = {
  padding: "32px 48px",
  textAlign: "center",
};

const altLinkLabelStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "12px",
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const altLinkStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#6b7280",
  wordBreak: "break-all",
  backgroundColor: "#faf9f7",
  padding: "12px 16px",
  borderRadius: "4px",
  border: "1px solid #f0f0f0",
};

const securityNoteSectionStyle: React.CSSProperties = {
  padding: "0 48px 48px",
  textAlign: "center",
};

const securityNoteStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#9ca3af",
  lineHeight: 1.6,
};

const bottomTextSectionStyle: React.CSSProperties = {
  padding: "32px 20px",
  textAlign: "center",
};

const bottomTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "11px",
  color: "#9ca3af",
  lineHeight: 1.6,
};

export default MagicLinkEmail;
