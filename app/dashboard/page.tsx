import { Metadata } from "next";
import { getCompanies } from "@/lib/airtable";
import CompanyGridClientWrapper from "./components/CompanyGridClientWrapper";

// Force dynamic rendering - don't pre-render during build
export const dynamic = "force-dynamic";

// Increase function timeout (requires Vercel Pro - 10s default on Hobby)
export const maxDuration = 30;

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Browse coding interview questions from top tech and AI companies. Practice with an AI interviewer that reviews your code and asks follow-up questions.",
  robots: {
    index: false, // Dashboard is behind auth
    follow: false
  }
};

export default async function AppHome() {
  const companies = await getCompanies();

  return <CompanyGridClientWrapper companies={companies} />;
}
