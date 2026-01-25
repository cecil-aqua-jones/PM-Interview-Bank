import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompanyBySlug, getQuestionsByCompany } from "@/lib/airtable";
import CompanyQuestionsWrapper from "../../components/CompanyQuestionsWrapper";

// Force dynamic rendering - don't pre-render during build
export const dynamic = "force-dynamic";

// Increase function timeout (requires Vercel Pro - 10s default on Hobby)
export const maxDuration = 30;

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = await getCompanyBySlug(params.slug);
  
  if (!company) {
    return {
      title: "Company Not Found"
    };
  }

  return {
    title: `${company.name} Coding Interview Questions`,
    description: `Practice ${company.name} coding interview questions with AI-powered mock interviews. Real questions from ${company.name} software engineering interviews.`,
    robots: {
      index: false, // Protected content
      follow: false
    }
  };
}

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
    <CompanyQuestionsWrapper
      companyName={company.name}
      companySlug={company.slug}
      questions={questions}
    />
  );
}
