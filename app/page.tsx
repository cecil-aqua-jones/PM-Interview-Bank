import { Metadata } from "next";
import { getCompanies } from "@/lib/airtable";
import LogoMarquee from "./components/LogoMarquee";
import LandingHeader from "./components/LandingHeader";
import PricingCards from "./components/PricingCard";
import CTAButton from "./components/CTAButton";
import SocialProofCarousel from "./components/SocialProofCarousel";
import ExitIntentPopup from "./components/ExitIntentPopup";
import { SITE_URL } from "@/lib/constants";

export const maxDuration = 30;

// ═══════════════════════════════════════════════════════════════════════════
// METADATA - Explicit SEO configuration for homepage
// ═══════════════════════════════════════════════════════════════════════════

export const metadata: Metadata = {
  title: "Apex Interviewer | AI Mock Interviews for Google, Meta, Amazon & Top Tech",
  description:
    "Practice coding, system design, and behavioral interviews with AI that asks follow-up questions and gives real-time feedback. Used by engineers at Google, Meta, Amazon, OpenAI, and more.",
  keywords: [
    "AI mock interview",
    "coding interview practice",
    "tech interview prep",
    "Google interview questions",
    "Meta interview prep",
    "Amazon coding interview",
    "system design interview",
    "behavioral interview practice",
    "software engineer interview",
    "OpenAI interview prep",
    "Anthropic coding interview",
    "LeetCode alternative",
    "technical interview AI",
    "interview simulator",
    "coding interview feedback",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Apex Interviewer | AI Mock Interviews for Top Tech Companies",
    description:
      "Practice with an AI interviewer that asks follow-up questions, evaluates your communication, and gives feedback using company-specific rubrics.",
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
      "AI-powered mock interview platform for tech professionals preparing for coding, system design, and behavioral interviews at top companies.",
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
      "Practice coding, system design, and behavioral interviews with AI-powered mock interviews",
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
    name: "Apex Interviewer - AI Mock Interview Platform",
    description:
      "AI-powered interview training with company-specific simulations for Google, Meta, Amazon, OpenAI, and 10+ top tech companies.",
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

  // Comprehensive FAQ schema with ALL 8 FAQs from the page
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How is this different from LeetCode or HackerRank?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Those platforms test if you can solve problems. We simulate the actual interview experience—with follow-up questions, communication evaluation, and company-specific rubrics. We also cover behavioral and system design interviews, not just coding.",
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
          text: "If you're not satisfied within 2 days of purchase, fill out a short survey and we'll issue a full refund—no questions asked after that.",
        },
      },
      {
        "@type": "Question",
        name: "What makes your company-specific rubrics accurate?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We've analyzed hundreds of real interview evaluations and debriefs from each company to understand exactly what they look for. Our rubrics reflect the actual criteria senior engineers use when deciding to hire.",
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
      "Four steps to master your tech interview using AI-powered mock interviews",
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
        name: "Get Interviewed by AI",
        text: "Solve real coding problems, design systems, and answer behavioral questions while our AI interviewer asks follow-up questions, probes your thinking, and evaluates you exactly like a real senior engineer would.",
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
        text: "Get a personalized dashboard showing exactly what to work on. Every piece of feedback is grounded in your interview transcript—no vague suggestions, just specific areas to improve.",
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
        description: "Sign in to access AI mock interviews",
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
        description: "Learn how AI mock interviews work",
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
          "1000+ problems with AI follow-up questions for Google, Meta, Amazon, and more",
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
          "Scalability, architecture, and trade-off discussions with AI feedback",
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
          "Leadership, teamwork, and conflict resolution practice with AI evaluation",
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

export default async function Home() {
  const companies = await getCompanies();
  const totalQuestions = companies.reduce(
    (sum, c) => sum + (c.questionCount ?? 0),
    0
  );

  return (
    <>
      <JsonLd />
      <ExitIntentPopup />
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container hero-content">
            <h1>Train Until SWE Interviews Feel Easy</h1>
            <p className="lead">
              Simulate real coding, behavioral, and system design interviews, get detailed 
              AI feedback, and fix your weaknesses before you walk into your real interview.
            </p>
            <div className="cta-group">
              <a className="btn btn-primary" href="/dashboard">
                Start Training Now — 2-Day Money-Back Guarantee
              </a>
            </div>
            <ul className="hero-features">
              <li>Real-time AI feedback on your answers</li>
              <li>Company-specific interview simulations for Google, Meta, Amazon, and 10+ top tech companies</li>
              <li>Track improvement across coding, system design, and behavioral interviews</li>
            </ul>
          </div>
        </section>

        {/* Company Logos - Right under hero */}
        <LogoMarquee />

        {/* Social Proof Carousel */}
        <SocialProofCarousel />

        {/* The Problem */}
        <section className="section">
          <div className="container narrow">
            <p className="eyebrow">The Problem</p>
            <h2>You Know How to Code. But Can You Interview?</h2>
            <p className="lead">
              Most engineers fail top tech interviews not because they can't solve problems—but 
              because they don't know how to communicate their thinking, optimize on the fly, 
              or handle follow-up questions under pressure.
            </p>
            <p className="subtle" style={{ marginTop: 32 }}>
              Traditional practice platforms give you problems. We give you an interview.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="section alt" id="how-it-works">
          <div className="container">
            <p className="eyebrow">How It Works</p>
            <h2>Four steps to interview mastery</h2>
            <div className="steps-grid">
              <div className="step">
                <span className="step-number">01</span>
                <h4>Choose Your Target Company</h4>
                <p>
                  Select from Google, Meta, Amazon, Apple, Microsoft, Netflix, TikTok, Uber, 
                  OpenAI, Anthropic, Perplexity, xAI, or Oracle. Our AI adapts to each company's 
                  specific interview style, evaluation criteria, and rubrics.
                </p>
              </div>
              <div className="step">
                <span className="step-number">02</span>
                <h4>Get Interviewed by AI</h4>
                <p>
                  Solve real coding problems, design systems, and answer behavioral questions 
                  while our AI interviewer asks follow-up questions, probes your thinking, and 
                  evaluates you exactly like a real senior engineer would.
                </p>
              </div>
              <div className="step">
                <span className="step-number">03</span>
                <h4>Get Instant, Detailed Feedback</h4>
                <p>
                  See exactly where you went wrong: "Your space complexity analysis missed 
                  the auxiliary space used by the recursion stack" or "Strong explanation 
                  of the trade-offs between HashMap and TreeMap."
                </p>
              </div>
              <div className="step">
                <span className="step-number">04</span>
                <h4>Track Your Improvement</h4>
                <p>
                  Get a personalized dashboard showing exactly what to work on. Every piece 
                  of feedback is grounded in your interview transcript—no vague suggestions, 
                  just specific areas to improve.
                </p>
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
                <h4>Company-Specific Rubrics</h4>
                <p>
                  Our AI evaluates you using the exact rubrics each company uses internally. 
                  Google's bar for system design is different from Meta's—we know the difference 
                  and train you accordingly.
                </p>
              </div>
              <div className="feature-editorial">
                <h4>AI That Understands Code</h4>
                <p>
                  Not just checking test cases. Our AI evaluates your thought process, 
                  communication clarity, and code quality in real-time.
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
                <h4>Real-Time Follow-Up Questions</h4>
                <p>
                  The AI probes deeper when you're vague, just like a real interviewer: 
                  "How would this handle 10 million concurrent requests?"
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
          </div>
        </section>

        {/* Testimonials - Proof It Works */}
        <section className="section alt" id="proof">
          <div className="container">
            <p className="eyebrow">Proof It Works</p>
            <h2>Engineers who changed their trajectory</h2>
            <div className="testimonial-editorial-grid">
              <div className="testimonial-editorial">
                <blockquote>
                  "After failing my first two Google interviews, I did 30 mock interviews here. 
                  The AI was brutal—it caught every unclear explanation and lazy optimization. 
                  But that's exactly what I needed. Passed my third attempt."
                </blockquote>
                <div className="testimonial-attribution">
                  <p className="testimonial-name">David Chen</p>
                  <p className="testimonial-title">Software Engineer at Google</p>
                </div>
              </div>
              <div className="testimonial-editorial">
                <blockquote>
                  "I paid $200/hour for interview coaching before. This AI gives better feedback, 
                  it's available 24/7, and it costs a fraction of the price."
                </blockquote>
                <div className="testimonial-attribution">
                  <p className="testimonial-name">Aisha Patel</p>
                  <p className="testimonial-title">SWE at Meta</p>
                </div>
              </div>
              <div className="testimonial-editorial">
                <blockquote>
                  "I thought I knew how to solve the problems. But the AI's follow-up questions—
                  'What if N is 10 million?' 'How would you handle concurrent requests?'—taught me 
                  what top tech interviewers actually care about."
                </blockquote>
                <div className="testimonial-attribution">
                  <p className="testimonial-name">Jake Morrison</p>
                  <p className="testimonial-title">Engineer at Amazon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="section">
          <div className="container narrow">
            <p className="eyebrow">How We're Different</p>
            <h2>More than another practice platform</h2>
            <div className="comparison-table">
              <div className="comparison-header">
                <div className="comparison-cell">Feature</div>
                <div className="comparison-cell">Other Platforms</div>
                <div className="comparison-cell highlight">Apex Interviewer</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Real-time feedback</div>
                <div className="comparison-cell">—</div>
                <div className="comparison-cell highlight">Yes</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Evaluates communication</div>
                <div className="comparison-cell">—</div>
                <div className="comparison-cell highlight">Yes</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Asks follow-up questions</div>
                <div className="comparison-cell">—</div>
                <div className="comparison-cell highlight">Yes</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Company-specific rubrics</div>
                <div className="comparison-cell">—</div>
                <div className="comparison-cell highlight">13 companies</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Behavioral + System Design</div>
                <div className="comparison-cell">—</div>
                <div className="comparison-cell highlight">Yes</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Available 24/7</div>
                <div className="comparison-cell">Yes</div>
                <div className="comparison-cell highlight">Yes</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">Cost</div>
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

        {/* Covered Companies */}
        <section className="section" id="companies">
          <div className="container narrow">
            <p className="eyebrow">Covered Companies</p>
            <h2>We simulate interviews for top tech companies</h2>
            <div className="company-categories">
              <div className="company-category">
                <h4>Big Tech</h4>
                <p>Google • Apple • Amazon • Microsoft • Meta • Netflix • Oracle</p>
              </div>
              <div className="company-category">
                <h4>AI & Innovation</h4>
                <p>OpenAI • Anthropic • Perplexity • xAI</p>
              </div>
              <div className="company-category">
                <h4>High-Growth</h4>
                <p>TikTok • Uber</p>
              </div>
            </div>
            <p className="subtle" style={{ marginTop: 32, textAlign: "center" }}>
              More companies added every month
            </p>
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
                survey and we'll refund you in full—no questions asked after that.
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
                  experience—with follow-up questions, communication evaluation, and company-specific 
                  rubrics. We also cover behavioral and system design interviews, not just coding.
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
                  and we'll issue a full refund—no questions asked after that.
                </p>
              </div>
              <div className="faq-item">
                <h4>What makes your company-specific rubrics accurate?</h4>
                <p>
                  We've analyzed hundreds of real interview evaluations and debriefs from each 
                  company to understand exactly what they look for. Our rubrics reflect the 
                  actual criteria senior engineers use when deciding to hire.
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
              The difference between failing and passing your tech interview isn't talent—it's 
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
          <p>Apex Interviewer • Built for ambitious engineers.</p>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </>
  );
}
