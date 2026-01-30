import { Section, Row, Column, Text } from "@react-email/components";
import * as React from "react";

interface HeaderProps {
  variant?: "default" | "dark" | "success" | "urgent";
  title?: string;
  subtitle?: string;
}

export function Header({ variant = "default", title, subtitle }: HeaderProps) {
  if (variant === "dark") {
    return (
      <Section style={darkHeaderStyle}>
        <Text style={darkTitleStyle}>{title || "Apex Interviewer"}</Text>
        {subtitle && <Text style={darkSubtitleStyle}>{subtitle}</Text>}
      </Section>
    );
  }

  if (variant === "success") {
    return (
      <Section style={successHeaderStyle}>
        <Row>
          <Column style={{ textAlign: "center" }}>
            <div style={checkIconContainerStyle}>
              <span style={{ color: "#22c55e", fontSize: "32px", lineHeight: "64px" }}>✓</span>
            </div>
          </Column>
        </Row>
        <Text style={successTitleStyle}>{title || "Welcome to Apex Interviewer"}</Text>
        {subtitle && <Text style={successSubtitleStyle}>{subtitle}</Text>}
      </Section>
    );
  }

  if (variant === "urgent") {
    return (
      <Section style={urgentHeaderStyle}>
        <Text style={urgentTitleStyle}>{title || "FINAL NOTICE"}</Text>
      </Section>
    );
  }

  // Default logo header
  return (
    <Section style={defaultHeaderStyle}>
      <Row>
        <Column style={{ textAlign: "center" }}>
          <div style={logoContainerStyle}>
            <span style={logoTextStyle}>A</span>
          </div>
        </Column>
      </Row>
    </Section>
  );
}

const defaultHeaderStyle: React.CSSProperties = {
  padding: "48px 48px 32px",
  textAlign: "center",
};

const logoContainerStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  background: "linear-gradient(135deg, #1a1918 0%, #2d2b2a 100%)",
  borderRadius: "12px",
  display: "inline-block",
  textAlign: "center",
};

const logoTextStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: 700,
  lineHeight: "48px",
};

const darkHeaderStyle: React.CSSProperties = {
  backgroundColor: "#1a1918",
  padding: "32px 40px",
  textAlign: "center",
};

const darkTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 600,
  letterSpacing: "-0.5px",
};

const darkSubtitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "rgba(255,255,255,0.7)",
  fontSize: "14px",
};

const successHeaderStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1918 0%, #2d2b2a 100%)",
  padding: "48px 48px 40px",
  textAlign: "center",
};

const checkIconContainerStyle: React.CSSProperties = {
  width: "64px",
  height: "64px",
  backgroundColor: "rgba(255,255,255,0.1)",
  borderRadius: "50%",
  display: "inline-block",
  marginBottom: "24px",
};

const successTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: "28px",
  fontWeight: 400,
  color: "#ffffff",
  letterSpacing: "-0.5px",
};

const successSubtitleStyle: React.CSSProperties = {
  margin: "16px 0 0",
  fontSize: "15px",
  color: "rgba(255,255,255,0.7)",
};

const urgentHeaderStyle: React.CSSProperties = {
  backgroundColor: "#dc2626",
  padding: "32px 48px",
  textAlign: "center",
};

const urgentTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 600,
  color: "#ffffff",
  letterSpacing: "0.05em",
};

export default Header;
