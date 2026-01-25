import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Apex Interviewer to access coding interview questions and AI mock interviews.",
  robots: {
    index: true,
    follow: true
  }
};

export default function LoginLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
