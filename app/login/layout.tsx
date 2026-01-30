import { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sign In | Access AI Mock Interviews",
  description:
    "Sign in to Apex Interviewer to practice coding, system design, and behavioral interviews with AI feedback. Access 1000+ interview questions for Google, Meta, Amazon, and more.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_URL}/login`,
  },
  openGraph: {
    title: "Sign In to Apex Interviewer",
    description:
      "Access AI-powered mock interviews for top tech companies. Practice coding, system design, and behavioral interviews with instant feedback.",
    url: `${SITE_URL}/login`,
    type: "website",
  },
};

// JSON-LD schema for login page
function LoginJsonLd() {
  const loginSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Sign In to Apex Interviewer",
    description:
      "Access AI-powered mock interviews and practice coding questions for top tech companies",
    url: `${SITE_URL}/login`,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Sign In",
          item: `${SITE_URL}/login`,
        },
      ],
    },
    potentialAction: {
      "@type": "LoginAction",
      target: `${SITE_URL}/login`,
      name: "Sign in with email",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(loginSchema) }}
    />
  );
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LoginJsonLd />
      {children}
    </>
  );
}
