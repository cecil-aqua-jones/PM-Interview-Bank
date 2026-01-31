import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCompanies } from "@/lib/airtable";
import LogoMarquee from "./components/LogoMarquee";
import LandingHeader from "./components/LandingHeader";
import PricingCards from "./components/PricingCard";
import CTAButton from "./components/CTAButton";
import SocialProofCarousel from "./components/SocialProofCarousel";
// import ExitIntentPopup from "./components/ExitIntentPopup";
import LandingRadarChart from "./components/LandingRadarChart";
// import ProgressShowcaseSection from "./components/ProgressShowcaseSection";
import LandingCompanyGrid from "./components/LandingCompanyGrid";
import LandingInterviewPreview from "./components/LandingInterviewPreview";
import LandingFeedbackPreview from "./components/LandingFeedbackPreview";
import { SITE_URL } from "@/lib/constants";

export const maxDuration = 30;

// ═══════════════════════════════════════════════════════════════════════════
// METADATA - Explicit SEO configuration for homepage
// ═══════════════════════════════════════════════════════════════════════════

export const metadata: Metadata = {
  title: "Apex Interviewer | AI Software Engineer Interview Coach - Google, Meta, Amazon Prep",
  description:
    "The AI-powered interview coach that helps software engineers pass Google, Meta, Amazon, and FAANG interviews. Real-time feedback on coding, system design, and behavioral interviews. Stop failing technical interviews. Practice with AI that evaluates like a real interviewer.",
  keywords: [
    // Niche-defining (own the category)
    "ai swe interview coach",
    "ai software engineer interview coaching",
    "ai coding interview coach",
    "ai technical interview coach",
    "ai mock interview software engineer",
    "ai interview trainer for developers",
    "software engineer interview coaching tool",
    // High-intent (ready to buy)
    "best ai mock interview tool for software engineers",
    "software engineer interview prep tool",
    "swe interview simulator",
    "ai interview feedback software engineer",
    "mock technical interview online",
    "practice software engineering interview with ai",
    "online mock coding interview with feedback",
    // Company-specific (high volume)
    "google software engineer interview prep",
    "meta swe interview questions",
    "amazon software engineer behavioral interview",
    "FAANG interview preparation",
    "MAANG interview coaching",
    "openai interview prep software engineer",
    "apple software engineer interview tips",
    // Interview types
    "system design interview prep",
    "behavioral interview prep software engineer",
    "coding interview communication tips",
    "technical phone screen tips",
    // Comparison (steal traffic)
    "interviewing.io alternative",
    "pramp alternative 2025",
    "better than leetcode for interview prep",
    "human interview coach vs ai interview coach",
    "leetcode not enough for interviews",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Apex Interviewer | AI Software Engineer Interview Coach",
    description:
      "AI-powered mock interviews for Google, Meta, Amazon, and FAANG. Real-time feedback on coding, system design, and behavioral interviews. Stop failing. Practice with AI that evaluates like a real interviewer.",
    url: SITE_URL,
    type: "website",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// JSON-LD STRUCTURED DATA - Comprehensive schemas for rich search results
// ═══════════════════════════════════════════════════════════════════════════

function JsonLd() {
  // Educational Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: "Apex Interviewer",
    url: SITE_URL,
    logo: `${SITE_URL}/ai-owl-mascot.png`,
    description:
      "Interview simulation platform featuring verified questions from actual tech interviews at Google, Meta, Amazon, OpenAI, and top companies. Company-specific rubrics for coding, system design, and behavioral.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@apexinterviewer.com",
      contactType: "customer service",
    },
  };

  // Website schema with search action
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Apex Interviewer",
    url: SITE_URL,
    description:
      "Verified interview questions from actual Google, Meta, Amazon, and OpenAI interviews. Company-specific rubrics. Unlimited practice.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/dashboard?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Breadcrumb schema for homepage
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
    ],
  };

  // Product schema with pricing
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Apex Interviewer - Tech Interview Simulation Platform",
    description:
      "Verified interview questions from actual tech interviews. Company-specific rubrics for coding, system design, and behavioral. Unlimited practice for Google, Meta, Amazon, OpenAI, and 10+ top companies.",
    image: `${SITE_URL}/og-image.png`,
    brand: {
      "@type": "Brand",
      name: "Apex Interviewer",
    },
    offers: [
      {
        "@type": "Offer",
        price: "75.00",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        name: "Monthly Plan",
        url: `${SITE_URL}/login`,
      },
      {
        "@type": "Offer",
        price: "500.00",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        name: "Annual Plan (Save $400)",
        url: `${SITE_URL}/login`,
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
  };

  // Comprehensive FAQ schema with ALL 9 FAQs from the page
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How is this different from LeetCode or HackerRank?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Those platforms test if you can solve problems. We simulate the actual interview experience, with follow-up questions, communication evaluation, and company-specific rubrics. We also cover behavioral and system design interviews, not just coding.",
        },
      },
      {
        "@type": "Question",
        name: "Where do your interview questions come from?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Every question in our database is sourced from real interview experiences. Engineers who have interviewed at Google, Meta, Amazon, and other top companies submit their questions, which our team verifies for accuracy. We don't use made-up problems, only questions that have actually been asked in interviews.",
        },
      },
      {
        "@type": "Question",
        name: "Can the AI really evaluate soft skills?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Our AI is trained on thousands of real tech interviews and can detect unclear explanations, missing trade-off discussions, and poor communication patterns. Every piece of feedback is grounded in your actual transcript.",
        },
      },
      {
        "@type": "Question",
        name: "What companies do you support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Google, Apple, Amazon, Microsoft, Meta, Netflix, Oracle, TikTok, Uber, OpenAI, Anthropic, Perplexity, and xAI. We're adding more every month.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to schedule interview times?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nope. Practice 24/7 whenever you want. The AI is always ready.",
        },
      },
      {
        "@type": "Question",
        name: "Does this work for senior/staff level interviews?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Our system design simulations and behavioral evaluations are calibrated for all levels from entry to staff engineer.",
        },
      },
      {
        "@type": "Question",
        name: "What if I'm interviewing at a company you don't cover?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our general SWE interview mode covers fundamental patterns that apply to any tech company. Plus, we add new companies based on user requests.",
        },
      },
      {
        "@type": "Question",
        name: "How does the money-back guarantee work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "If you're not satisfied within 2 days of purchase, fill out a short survey and we'll issue a full refund. No questions asked after that.",
        },
      },
      {
        "@type": "Question",
        name: "What makes your company-specific rubrics accurate?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We've analyzed hundreds of real interview evaluations and debriefs from each company to understand exactly what they look for. Combined with our verified question database from actual interviews, our rubrics reflect the real criteria senior engineers use when deciding to hire.",
        },
      },
      // Problem-aware questions (SEO: mid-funnel)
      {
        "@type": "Question",
        name: "Why do I keep failing coding interviews?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most engineers fail interviews not because they can't code, but because they don't communicate their thinking clearly. Real interviewers want to hear your reasoning process, trade-off analysis, and how you handle ambiguity. Apex Interviewer's AI evaluates exactly these soft skills and gives you specific feedback on where your communication breaks down.",
        },
      },
      {
        "@type": "Question",
        name: "How do I stop freezing during coding interviews?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Interview anxiety comes from uncertainty. The more you practice under realistic conditions, the more confident you become. Our AI asks follow-up questions and challenges your solutions just like a real interviewer, so you build the muscle memory to stay calm under pressure.",
        },
      },
      {
        "@type": "Question",
        name: "Is LeetCode enough to pass FAANG interviews?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "LeetCode tests if you can solve problems, but FAANG interviews evaluate much more: communication, trade-off analysis, system design thinking, and behavioral competencies. Many engineers grind 500+ LeetCode problems and still fail because they never practiced the interview skills that actually matter.",
        },
      },
      {
        "@type": "Question",
        name: "How is an AI interview coach different from a human coach?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Human coaches cost $200-400 per session and have limited availability. Apex Interviewer provides unlimited 24/7 practice at a fraction of the cost, with instant feedback after every response. Our AI is trained on thousands of real tech interviews and evaluates you on the same criteria used by actual FAANG interviewers.",
        },
      },
      // Skill-gap questions (SEO: problem-aware)
      {
        "@type": "Question",
        name: "How do I think out loud during a coding interview?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Thinking out loud means narrating your problem-solving process: state your assumptions, explain why you're choosing a particular approach, discuss time/space complexity trade-offs, and flag edge cases as you encounter them. Our AI gives you real-time feedback on your communication clarity so you can develop this skill.",
        },
      },
      {
        "@type": "Question",
        name: "How do I answer 'tell me about yourself' as a software engineer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Structure your answer around: your current role and key accomplishments, why you're interested in this company/role, and what unique value you bring. Keep it under 2 minutes and focus on technical impact. Our behavioral interview mode helps you craft and practice compelling stories using the STAR method.",
        },
      },
      {
        "@type": "Question",
        name: "What do FAANG interviewers actually look for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Beyond correct solutions, FAANG interviewers evaluate: problem-solving approach, code quality, communication clarity, handling of edge cases, complexity analysis, and cultural fit. Each company has specific rubrics. Google emphasizes 'Googleyness,' Amazon focuses on Leadership Principles. Our company-specific modes are calibrated to these exact criteria.",
        },
      },
      {
        "@type": "Question",
        name: "How many mock interviews should I do before a real interview?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Research suggests 15-20 realistic mock interviews build significant confidence. The key is quality over quantity. Each practice session should include feedback on your specific weaknesses. With unlimited Apex Interviewer sessions, you can practice until you consistently perform at your target level.",
        },
      },
    ],
  };

  // HowTo schema for the interview preparation process
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Prepare for Tech Interviews with Apex Interviewer",
    description:
      "Four steps to master your tech interview using realistic interview simulations",
    totalTime: "PT30M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Choose Your Target Company",
        text: "Select from Google, Meta, Amazon, Apple, Microsoft, Netflix, TikTok, Uber, OpenAI, Anthropic, Perplexity, xAI, or Oracle. Our AI adapts to each company's specific interview style, evaluation criteria, and rubrics.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Simulate a Real Interview",
        text: "Practice with verified questions sourced from actual interviews at your target company. Experience realistic follow-up questions that probe your thinking, just like facing a real senior engineer.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Get Instant, Detailed Feedback",
        text: "See exactly where you went wrong with specific feedback like 'Your space complexity analysis missed the auxiliary space used by the recursion stack' or 'Strong explanation of the trade-offs between HashMap and TreeMap.'",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Track Your Improvement",
        text: "Get a personalized dashboard showing exactly what to work on. Every piece of feedback is grounded in your interview transcript, no vague suggestions, just specific areas to improve.",
      },
    ],
  };

  // Sitelinks schema for Google rich results
  const sitelinksSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "SiteNavigationElement",
        position: 1,
        name: "Login",
        description: "Sign in to access interview simulations",
        url: `${SITE_URL}/login`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 2,
        name: "Dashboard",
        description: "Practice coding, system design, and behavioral interviews",
        url: `${SITE_URL}/dashboard`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 3,
        name: "Pricing",
        description: "Plans starting at $75/month",
        url: `${SITE_URL}/#pricing`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 4,
        name: "How It Works",
        description: "Learn how interview simulations work",
        url: `${SITE_URL}/#how-it-works`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 5,
        name: "Features",
        description: "Explore interview preparation features",
        url: `${SITE_URL}/#features`,
      },
    ],
  };

  // Course/training programs schema
  const coursesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Interview Training Programs",
    itemListElement: [
      {
        "@type": "Course",
        position: 1,
        name: "Coding Interview Practice",
        description:
          "Verified coding questions from actual Google, Meta, Amazon interviews with AI follow-up questions and real-time feedback",
        provider: { "@type": "Organization", name: "Apex Interviewer" },
        url: `${SITE_URL}/dashboard`,
        courseMode: "online",
        educationalLevel: "All Levels",
      },
      {
        "@type": "Course",
        position: 2,
        name: "System Design Interviews",
        description:
          "Real system design questions from actual interviews. Practice scalability, architecture, and trade-off discussions with AI feedback",
        provider: { "@type": "Organization", name: "Apex Interviewer" },
        url: `${SITE_URL}/dashboard`,
        courseMode: "online",
        educationalLevel: "Mid-Senior Level",
      },
      {
        "@type": "Course",
        position: 3,
        name: "Behavioral Interviews",
        description:
          "Verified behavioral questions from top tech companies. Practice leadership, teamwork, and conflict resolution with AI evaluation",
        provider: { "@type": "Organization", name: "Apex Interviewer" },
        url: `${SITE_URL}/dashboard`,
        courseMode: "online",
        educationalLevel: "All Levels",
      },
    ],
  };

  // Software Application schema
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Apex Interviewer",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "75",
      highPrice: "500",
      priceCurrency: "USD",
      offerCount: 2,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sitelinksSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coursesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
    </>
  );
}

// Comparison table icons
const CheckIcon = () => (
  <svg className="comparison-icon check" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const XIcon = () => (
  <svg className="comparison-icon x" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

export default async function Home() {
  const companies = await getCompanies();
  const totalQuestions = companies.reduce(
    (sum, c) => sum + (c.questionCount ?? 0),
    0
  );

  return (
    <>
      <JsonLd />
      {/* <ExitIntentPopup /> */}
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container hero-content">
            <h1>Train Until SWE Interviews Feel Easy</h1>
            <p className="lead">
              Practice with verified interview questions from Google, Meta, 
              Amazon, and other tech companies. Simulate real interview conditions with company-specific scoring 
              rubrics.
            </p>
            <div className="cta-group">
              <a className="btn btn-primary" href="/dashboard">
                Start Now
              </a>
            </div>
            <ul className="hero-features">
              <li>Verified questions from actual tech interviews</li>
              <li>Company-specific rubrics for coding, system design, and behavioral</li>
              <li>Unlimited practice until you're ready</li>
            </ul>
          </div>
        </section>

        {/* Company Logos - Right under hero */}
        <LogoMarquee />

        {/* Social Proof Carousel */}
        <SocialProofCarousel />

        {/* The Problem */}
        <section className="section">
          <div className="container">
            <div className="problem-section-grid">
              <div className="problem-section-content">
                <p className="eyebrow">The Problem</p>
                <h2>You Know How to Code. But Can You Interview?</h2>
                <p className="lead">
                  Most engineers fail top tech interviews not because they can't solve problems, but 
                  because they don't know how to communicate their thinking, optimize on the fly, 
                  or handle follow-up questions under pressure.
                </p>
                <p className="subtle" style={{ marginTop: 32 }}>
                  Traditional practice platforms give you problems. We give you an interview.
                </p>
              </div>
              <div className="problem-section-mascot">
                <Image
                  src="/mascot.png"
                  alt="Apex Interviewer Mascot"
                  width={320}
                  height={320}
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section alt" id="how-it-works">
          <div className="container">
            <p className="eyebrow">How It Works</p>
            <h2>Four steps to interview mastery</h2>
            
            {/* Step 01 */}
            <div className="how-it-works-row">
              <div className="how-it-works-text">
                <span className="how-it-works-number">01</span>
                <h3>Choose Your Target Company</h3>
                <p>
                  Select from Google, Meta, Amazon, Apple, Microsoft, Netflix, TikTok, Uber, 
                  OpenAI, Anthropic, Perplexity, xAI, or Oracle. Each simulation uses that company's 
                  specific interview style, evaluation criteria, and rubrics.
                </p>
              </div>
              <div className="how-it-works-preview">
                <LandingCompanyGrid />
              </div>
            </div>

            {/* Step 02 */}
            <div className="how-it-works-row reverse">
              <div className="how-it-works-text">
                <span className="how-it-works-number">02</span>
                <h3>Simulate a Real Interview</h3>
                <p>
                  Practice with verified questions sourced from actual interviews at your target 
                  company. Experience realistic follow-up questions that probe your thinking, just 
                  like facing a real senior engineer.
                </p>
              </div>
              <div className="how-it-works-preview">
                <LandingInterviewPreview />
              </div>
            </div>

            {/* Step 03 */}
            <div className="how-it-works-row">
              <div className="how-it-works-text">
                <span className="how-it-works-number">03</span>
                <h3>Get Instant, Detailed Feedback</h3>
                <p>
                  See exactly where you went wrong: "Your space complexity analysis missed 
                  the auxiliary space used by the recursion stack" or "Strong explanation 
                  of the trade-offs between HashMap and TreeMap."
                </p>
              </div>
              <div className="how-it-works-preview">
                <LandingFeedbackPreview />
              </div>
            </div>

            {/* Step 04 */}
            <div className="how-it-works-row reverse">
              <div className="how-it-works-text">
                <span className="how-it-works-number">04</span>
                <h3>Track Your Improvement</h3>
                <p>
                  Get a personalized dashboard showing exactly what to work on. Every piece 
                  of feedback is grounded in your interview transcript, no vague suggestions, 
                  just specific areas to improve.
                </p>
              </div>
              <div className="how-it-works-preview">
                <LandingRadarChart />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section" id="features">
          <div className="container">
            <p className="eyebrow">Built by Engineers Who've Been There</p>
            <h2>Features that matter</h2>
            <div className="feature-grid-editorial">
              <div className="feature-editorial">
                <h4>Real Questions from Real Interviews</h4>
                <p>
                  Every question in our database comes from verified interview experiences, submitted 
                  by engineers who actually interviewed at these companies and validated by our team. 
                  No made-up problems, just the questions you'll actually face.
                </p>
              </div>
              <div className="feature-editorial">
                <h4>Company-Specific Rubrics</h4>
                <p>
                  Get evaluated using the exact rubrics each company uses internally, for coding, 
                  system design, and behavioral. Google's bar is different from Meta's. We know 
                  the difference and train you accordingly.
                </p>
              </div>
              <div className="feature-editorial">
                <h4>Unlimited Practice Sessions</h4>
                <p>
                  Practice as many times as you need, 24/7. Run through coding problems, design 
                  systems, and rehearse behavioral answers until you're completely confident.
                </p>
              </div>
              <div className="feature-editorial">
                <h4>Performance Dashboard</h4>
                <p>
                  Track improvement across 50+ patterns: arrays, trees, dynamic programming, 
                  system design, and more. See exactly what to work on next.
                </p>
              </div>
              <div className="feature-editorial">
                <h4>Realistic Follow-Up Questions</h4>
                <p>
                  Experience the pressure of real interviews with probing follow-ups: 
                  "How would this handle 10 million concurrent requests?" "What's the trade-off?"
                </p>
              </div>
              <div className="feature-editorial">
                <h4>Transcript-Based Feedback</h4>
                <p>
                  Every critique is grounded in what you actually said. Review your transcript 
                  with timestamped feedback on every mistake and strength.
                </p>
              </div>
            </div>

            {/* Performance Dashboard Visual */}
            <div className="feature-chart-showcase">
              <div className="feature-chart-content">
                <p className="eyebrow">Measurable Progress</p>
                <h3>The Only Platform That Proves You're Improving</h3>
                <p className="feature-chart-description">
                  Watch your skills grow from first attempt to interview-ready. 
                  Our scoring system tracks 9 dimensions across coding, behavioral, and system design, so you know exactly when you're ready.
                </p>
                <Link href="/why-ai-coaching" className="link-arrow">
                  Learn why AI coaching works
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
              <div className="feature-chart-visuals">
                <LandingFeedbackPreview />
                <LandingRadarChart />
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="section">
          <div className="container">
            <p className="eyebrow">How We're Different</p>
            <h2>More than another practice platform</h2>
            <div className="comparison-table">
              <div className="comparison-header">
                <div className="comparison-cell">Feature</div>
                <div className="comparison-cell">Practice Platforms</div>
                <div className="comparison-cell">Peer Platforms</div>
                <div className="comparison-cell">Human Coaches</div>
                <div className="comparison-cell highlight">Apex Interviewer</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Real-time AI feedback</div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell highlight"><CheckIcon /></div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Evaluates communication</div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell"><CheckIcon /></div>
                <div className="comparison-cell"><CheckIcon /></div>
                <div className="comparison-cell highlight"><CheckIcon /></div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Company-specific rubrics</div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell highlight"><CheckIcon /></div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Behavioral + System Design</div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell"><CheckIcon /></div>
                <div className="comparison-cell"><CheckIcon /></div>
                <div className="comparison-cell highlight"><CheckIcon /></div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Unlimited 24/7 practice</div>
                <div className="comparison-cell"><CheckIcon /></div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell highlight"><CheckIcon /></div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Tracks improvement</div>
                <div className="comparison-cell"><CheckIcon /></div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell highlight"><CheckIcon /></div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Personalized feedback</div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell"><XIcon /></div>
                <div className="comparison-cell"><CheckIcon /></div>
                <div className="comparison-cell highlight"><CheckIcon /></div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Cost</div>
                <div className="comparison-cell">Free</div>
                <div className="comparison-cell">Free</div>
                <div className="comparison-cell">$200+/session</div>
                <div className="comparison-cell highlight">$75/month</div>
              </div>
            </div>
          </div>
        </section>

        {/* What You'll Practice */}
        <section className="section alt">
          <div className="container">
            <p className="eyebrow">What You'll Practice</p>
            <h2>Comprehensive interview preparation</h2>
            <div className="practice-grid">
              <div className="practice-item">
                <h4>Coding Interviews</h4>
                <p>{totalQuestions.toLocaleString()}+ problems across all difficulty levels</p>
              </div>
              <div className="practice-item">
                <h4>System Design</h4>
                <p>Scalability, architecture, and trade-off discussions</p>
              </div>
              <div className="practice-item">
                <h4>Behavioral Questions</h4>
                <p>Leadership, teamwork, and conflict resolution</p>
              </div>
              <div className="practice-item">
                <h4>Company-Specific Formats</h4>
                <p>Tailored to Google, Meta, Amazon, OpenAI, and 9 more</p>
              </div>
              <div className="practice-item">
                <h4>Full Interview Simulations</h4>
                <p>Mock phone screens, virtual onsites, and pair programming</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="section alt">
          <div className="container">
            <div className="pricing-header">
              <p className="eyebrow">Pricing</p>
              <h2>Start Training Today</h2>
            </div>
            <PricingCards />
            <div className="guarantee-notice">
              <p className="guarantee-title">2-Day Money-Back Guarantee</p>
              <p className="guarantee-text">
                Try it risk-free. If you're not satisfied within 48 hours, fill out a quick 
                survey and we'll refund you in full. No questions asked after that.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section">
          <div className="container narrow">
            <h2>Questions, answered</h2>
            <div className="faq-editorial">
              <div className="faq-item">
                <h4>How is this different from LeetCode or HackerRank?</h4>
                <p>
                  Those platforms test if you can solve problems. We simulate the actual interview 
                  experience, with follow-up questions, communication evaluation, and company-specific 
                  rubrics. We also cover behavioral and system design interviews, not just coding.
                </p>
              </div>
              <div className="faq-item">
                <h4>Where do your interview questions come from?</h4>
                <p>
                  Every question in our database is sourced from real interview experiences. Engineers 
                  who have interviewed at Google, Meta, Amazon, and other top companies submit their 
                  questions, which our team verifies for accuracy. We don't use made-up problems, only 
                  questions that have actually been asked in interviews.
                </p>
              </div>
              <div className="faq-item">
                <h4>Can the AI really evaluate soft skills?</h4>
                <p>
                  Yes. Our AI is trained on thousands of real tech interviews and can detect unclear 
                  explanations, missing trade-off discussions, and poor communication patterns. Every 
                  piece of feedback is grounded in your actual transcript.
                </p>
              </div>
              <div className="faq-item">
                <h4>What companies do you support?</h4>
                <p>
                  Google, Apple, Amazon, Microsoft, Meta, Netflix, Oracle, TikTok, Uber, OpenAI, 
                  Anthropic, Perplexity, and xAI. We're adding more every month.
                </p>
              </div>
              <div className="faq-item">
                <h4>Do I need to schedule interview times?</h4>
                <p>
                  Nope. Practice 24/7 whenever you want. The AI is always ready.
                </p>
              </div>
              <div className="faq-item">
                <h4>Does this work for senior/staff level interviews?</h4>
                <p>
                  Yes. Our system design simulations and behavioral evaluations are calibrated 
                  for all levels from entry to staff engineer.
                </p>
              </div>
              <div className="faq-item">
                <h4>What if I'm interviewing at a company you don't cover?</h4>
                <p>
                  Our general SWE interview mode covers fundamental patterns that apply to any 
                  tech company. Plus, we add new companies based on user requests.
                </p>
              </div>
              <div className="faq-item">
                <h4>How does the money-back guarantee work?</h4>
                <p>
                  If you're not satisfied within 2 days of purchase, fill out a short survey 
                  and we'll issue a full refund. No questions asked after that.
                </p>
              </div>
              <div className="faq-item">
                <h4>What makes your company-specific rubrics accurate?</h4>
                <p>
                  We've analyzed hundreds of real interview evaluations and debriefs from each 
                  company to understand exactly what they look for. Combined with our verified 
                  question database from actual interviews, our rubrics reflect the real criteria 
                  senior engineers use when deciding to hire.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="cta">
          <div className="container cta-inner">
            <h2>Stop Hoping. Start Practicing.</h2>
            <p>
              The difference between failing and passing your tech interview isn't talent, it's 
              preparation. Give yourself the unfair advantage.
            </p>
            <CTAButton />
            <p className="cta-microcopy">
              Risk-free. Full refund within 48 hours after a quick survey.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>© {new Date().getFullYear()} Beip, Inc. • Built for ambitious engineers.</p>
          <div className="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="mailto:hi@apexinterviewer.com">Support</a>
          </div>
        </div>
      </footer>
    </>
  );
}
