import { Section, Text } from "@react-email/components";
import * as React from "react";

interface TestimonialProps {
  quote: string;
  author: string;
  result?: string;
}

export function Testimonial({ quote, author, result }: TestimonialProps) {
  return (
    <Section style={testimonialStyle}>
      <Text style={quoteStyle}>"{quote}"</Text>
      <Text style={authorStyle}>
        - {author}
        {result && <span style={resultStyle}> ({result})</span>}
      </Text>
    </Section>
  );
}

interface TestimonialsContainerProps {
  children: React.ReactNode;
  title?: string;
}

export function TestimonialsContainer({ children, title }: TestimonialsContainerProps) {
  return (
    <Section style={{ padding: "0 40px 40px" }}>
      {title && <Text style={titleStyle}>{title}</Text>}
      {children}
    </Section>
  );
}

const testimonialStyle: React.CSSProperties = {
  backgroundColor: "#f8f7f6",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "16px",
};

const quoteStyle: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#444",
  fontSize: "15px",
  lineHeight: 1.5,
  fontStyle: "italic",
};

const authorStyle: React.CSSProperties = {
  margin: 0,
  color: "#666",
  fontSize: "13px",
  fontWeight: 600,
};

const resultStyle: React.CSSProperties = {
  fontWeight: 400,
  color: "#22c55e",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 20px",
  color: "#1a1918",
  fontSize: "18px",
  fontWeight: 600,
};

export default Testimonial;
