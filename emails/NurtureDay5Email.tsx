import {
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout, Header, Footer } from "./components";

interface NurtureDay5EmailProps {
  checkoutUrl: string;
}

export const NurtureDay5Email = ({ checkoutUrl }: NurtureDay5EmailProps) => {
  return (
    <EmailLayout preview="Engineers who waited often regret it">
      <Section style={cardStyle}>
        <Header />

        <Section style={contentSectionStyle}>
          <Text style={textStyle}>
            I've talked to hundreds of engineers after their interviews.
          </Text>
          <Text style={textStyle}>
            The ones who didn't get the offer almost always say the same thing:
          </Text>
        </Section>

        <Section style={quoteSectionStyle}>
          <Section style={quoteBoxStyle}>
            <Text style={quoteTextStyle}>
              "I knew the algorithm, but I froze when they asked follow-up
              questions I hadn't practiced."
            </Text>
          </Section>
        </Section>

        <Section style={contentSectionStyle}>
          <Text style={textStyle}>
            LeetCode teaches you to solve problems. But real interviews test
            something else:{" "}
            <strong>
              can you think out loud, handle pressure, and adapt when the
              interviewer throws you a curveball?
            </strong>
          </Text>
          <Text style={textStyle}>
            That's what our AI is trained to simulate. It asks follow-up
            questions. It probes your reasoning. It catches the same mistakes a
            Google or Meta interviewer would catch.
          </Text>
          <Text style={textStyle}>
            The engineers who start practicing early? They walk into their
            interviews <strong>confident</strong>.
          </Text>
        </Section>

        <Section style={priceBoxSectionStyle}>
          <Section style={priceBoxStyle}>
            <Text style={priceLabelStyle}>Your 20% discount</Text>
            <Text style={priceStyle}>
              $400/year{" "}
              <span style={originalPriceStyle}>$500</span>
            </Text>
          </Section>
        </Section>

        <Section style={ctaSectionStyle}>
          <Link
            href={`${checkoutUrl}?plan=annual&promo=WELCOME20`}
            style={ctaButtonStyle}
          >
            Start Training Today
          </Link>
          <Text style={promoCodeStyle}>
            Code <strong>WELCOME20</strong> • Also works for monthly ($55/mo)
          </Text>
        </Section>

        <Footer />
      </Section>
    </EmailLayout>
  );
};

export const subject = "Engineers who waited often regret it";

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

const quoteSectionStyle: React.CSSProperties = {
  padding: "0 48px 32px",
};

const quoteBoxStyle: React.CSSProperties = {
  borderLeft: "3px solid #dc2626",
  paddingLeft: "20px",
};

const quoteTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  color: "#1a1a1a",
  fontStyle: "italic",
  lineHeight: 1.6,
};

const priceBoxSectionStyle: React.CSSProperties = {
  padding: "0 48px 40px",
};

const priceBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "20px 24px",
  textAlign: "center",
};

const priceLabelStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "13px",
  color: "#92400e",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const priceStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "24px",
  color: "#78350f",
  fontWeight: 700,
};

const originalPriceStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 400,
  textDecoration: "line-through",
  color: "#92400e",
};

const ctaSectionStyle: React.CSSProperties = {
  padding: "0 48px 32px",
  textAlign: "center",
};

const ctaButtonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#1a1918",
  borderRadius: "4px",
  padding: "18px 48px",
  fontSize: "13px",
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#ffffff",
  textDecoration: "none",
};

const promoCodeStyle: React.CSSProperties = {
  margin: "16px 0 0",
  fontSize: "13px",
  color: "#6b7280",
};

export default NurtureDay5Email;
