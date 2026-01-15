import { getCompanies } from "@/lib/airtable";
import CompanyGridClient from "./components/CompanyGridClient";

export default async function AppHome() {
  const companies = await getCompanies();

  return (
    <div>
      <h1>Home</h1>
      <CompanyGridClient companies={companies} />
    </div>
  );
}
