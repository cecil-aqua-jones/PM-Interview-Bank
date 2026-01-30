import { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service | Apex Interviewer",
  description:
    "Read the Terms of Service for Apex Interviewer. Understand your rights and responsibilities when using our AI-powered interview preparation platform.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  openGraph: {
    title: "Terms of Service | Apex Interviewer",
    description:
      "Read the Terms of Service for Apex Interviewer. Understand your rights and responsibilities.",
    url: `${SITE_URL}/terms`,
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
