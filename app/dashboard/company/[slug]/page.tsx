import { notFound } from "next/navigation";
import { getCompanyBySlug, getQuestionsByCompany } from "@/lib/airtable";
import CompanyQuestionsClient from "../../components/CompanyQuestionsClient";

// Force dynamic rendering - don't pre-render during build
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export default async function CompanyPage({ params }: Props) {
  const { slug } = params;

  const [company, questions] = await Promise.all([
    getCompanyBySlug(slug),
    getQuestionsByCompany(slug)
  ]);

  if (!company) {
    notFound();
  }

  return (
    <CompanyQuestionsClient
      companyName={company.name}
      companySlug={company.slug}
      questions={questions}
    />
  );
}
