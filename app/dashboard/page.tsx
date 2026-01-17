import { Metadata } from "next";
import { getCompanies } from "@/lib/airtable";
import CompanyGridClientWrapper from "./components/CompanyGridClientWrapper";

// Force dynamic rendering - don't pre-render during build
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Browse PM interview questions from top tech companies. Practice with AI mock interviews and track your progress.",
  robots: {
    index: false, // Dashboard is behind auth
    follow: false
  }
};

export default async function AppHome() {
  const companies = await getCompanies();

  return <CompanyGridClientWrapper companies={companies} />;
}
