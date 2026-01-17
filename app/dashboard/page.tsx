import { getCompanies } from "@/lib/airtable";
import CompanyGridClientWrapper from "./components/CompanyGridClientWrapper";

// Force dynamic rendering - don't pre-render during build
export const dynamic = "force-dynamic";

export default async function AppHome() {
  const companies = await getCompanies();

  return <CompanyGridClientWrapper companies={companies} />;
}
