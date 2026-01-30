import {
  Html,
  Head,
  Body,
  Container,
  Font,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
  children: React.ReactNode;
  preview?: string;
}

export function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="system-ui"
          fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
        />
      </Head>
      {preview && <Preview>{preview}</Preview>}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {children}
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: "#faf9f7",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto",
  padding: "60px 20px",
};

export default EmailLayout;
