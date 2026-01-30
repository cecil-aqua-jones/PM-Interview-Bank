import { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy | Apex Interviewer",
  description:
    "Learn how Apex Interviewer collects, uses, and protects your personal information. Our commitment to your privacy and data security.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  openGraph: {
    title: "Privacy Policy | Apex Interviewer",
    description:
      "Learn how Apex Interviewer collects, uses, and protects your personal information.",
    url: `${SITE_URL}/privacy`,
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
