import { getCompanyBySlug, getQuestionsByCompany } from "@/lib/airtable";
import CompanyQuestionsClient from "../../components/CompanyQuestionsClient";

type PageProps = {
  params: { slug: string };
};

export default async function CompanyPage({ params }: PageProps) {
  const company = await getCompanyBySlug(params.slug);
  const questions = await getQuestionsByCompany(params.slug);

  return (
    <CompanyQuestionsClient
      companyName={company?.name ?? "Company"}
      questions={questions}
    />
  );
}
