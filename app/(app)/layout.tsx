import "../globals.css";
import AppShell from "@/components/AppShell";
import { getCompanies } from "@/lib/airtable";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const companies = await getCompanies();

  return <AppShell companies={companies}>{children}</AppShell>;
}
