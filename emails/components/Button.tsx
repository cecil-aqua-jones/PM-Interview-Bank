import { Button as ReactEmailButton, Section } from "@react-email/components";
import * as React from "react";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "urgent";
  fullWidth?: boolean;
}

export function Button({ href, children, variant = "primary", fullWidth = false }: ButtonProps) {
  const buttonStyles = {
    primary: primaryButtonStyle,
    secondary: secondaryButtonStyle,
    urgent: urgentButtonStyle,
  };

  return (
    <Section style={{ padding: "0 48px 40px", textAlign: "center" }}>
      <ReactEmailButton
        href={href}
        style={{
          ...buttonStyles[variant],
          ...(fullWidth ? { display: "block", width: "100%" } : {}),
        }}
      >
        {children}
      </ReactEmailButton>
    </Section>
  );
}

const primaryButtonStyle: React.CSSProperties = {
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

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "16px 40px",
  backgroundColor: "#ffffff",
  border: "1px solid #e5e3e1",
  borderRadius: "6px",
  fontSize: "15px",
  fontWeight: 600,
  color: "#1a1918",
  textDecoration: "none",
};

const urgentButtonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "16px 40px",
  backgroundColor: "#dc2626",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: 600,
  color: "#ffffff",
  textDecoration: "none",
};

export default Button;
