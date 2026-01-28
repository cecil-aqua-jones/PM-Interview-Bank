import { getCompanies } from "@/lib/airtable";
import LogoMarquee from "./components/LogoMarquee";
import LandingHeader from "./components/LandingHeader";
import PricingCard from "./components/PricingCard";
import CTAButton from "./components/CTAButton";

// Increase function timeout (requires Vercel Pro - 10s default on Hobby)
export const maxDuration = 30;

// JSON-LD Structured Data for SEO
function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apexinterviewer.com";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Apex Interviewer",
    url: siteUrl,
    logo: `${siteUrl}/ai-owl-mascot.png`,
    description: "Top Tech & AI Coding Interview Questions with AI Practice",
    sameAs: []
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Apex Interviewer",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/dashboard?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Apex Interviewer - Annual Access",
    description: "500+ coding interview questions from top tech and AI companies with AI-powered mock interviews",
    brand: {
      "@type": "Brand",
      name: "Apex Interviewer"
    },
    offers: {
      "@type": "Offer",
      price: "350.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      url: siteUrl
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What companies are included in Apex Interviewer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Apex Interviewer includes coding interview questions from Google, Meta, Apple, Microsoft, Netflix, TikTok, Uber, Amazon, OpenAI, Anthropic, Perplexity, xAI, and Oracle—the most sought-after tech and AI companies."
        }
      },
      {
        "@type": "Question",
        name: "How does the AI mock interview work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our AI interviewer reads the coding problem aloud, you write your solution in the code editor, then the AI reviews your code, asks follow-up questions about time/space complexity, and provides detailed feedback."
        }
      },
      {
        "@type": "Question",
        name: "What programming languages are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Apex Interviewer supports Python, JavaScript, Java, C++, and Go—the most common languages used in top tech and AI company coding interviews."
        }
      }
    ]
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
      <LandingHeader />

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <h1>
                Land your dream role at the companies shaping tomorrow.
              </h1>
              <p className="lead">
                Real coding questions from Google, OpenAI, Meta, Anthropic, Amazon, Apple, and the world's most sought-after tech companies. Practice with an AI interviewer that reviews your code like a senior engineer.
              </p>
              <div className="cta-group">
                <a className="btn btn-primary" href="/dashboard">
                  Start Practicing Free
                </a>
                <a className="btn btn-secondary" href="/dashboard">
                  View Companies
                </a>
              </div>
              <p className="microcopy">
                {totalQuestions.toLocaleString()}+ questions • Updated weekly •
                Python, JS, Java, C++, Go
              </p>
            </div>
            <div className="hero-card">
              <div className="card-top">
                <h3>What's inside</h3>
                <p>
                  Comprehensive question bank covering every coding interview topic.
                </p>
              </div>
              <div className="card-list">
                <div className="pill">Arrays & Strings</div>
                <div className="pill">Trees & Graphs</div>
                <div className="pill">Dynamic Programming</div>
                <div className="pill">System Design</div>
                <div className="pill">Recursion</div>
                <div className="pill">Sorting & Searching</div>
              </div>
              <div className="card-bottom">
                <p className="price-tag"><s style={{ color: "#9ca3af", fontWeight: 400 }}>$500</s> $350</p>
                <span className="price-note">per year • $150 off</span>
              </div>
            </div>
          </div>
        </section>

        {/* Company Logos - Infinite Marquee */}
        <section id="companies" className="trust">
          <div className="trust-header">
            <p className="eyebrow" style={{ textAlign: "center", marginBottom: 8 }}>
              Sourced from real interviews at
            </p>
            <p style={{ textAlign: "center", fontSize: 14, color: "#8a8884", marginBottom: 0 }}>
              13 companies. Every question that matters.
            </p>
          </div>
          <LogoMarquee />
          <div className="container">
            <p className="trust-footer">
              Questions sourced from Blind, LeetCode discussions, interview debriefs, and
              verified engineer submissions.
            </p>
          </div>
        </section>

        {/* AI Mock Interview Feature */}
        <section className="section section-white" id="features">
          <div className="container">
            <div className="ai-feature-grid">
              <div className="ai-feature-content">
                <p className="eyebrow">AI-Powered Practice</p>
                <h2>Code. Submit. Get grilled.</h2>
                <p className="lead">
                  Write your solution in a real code editor. Our AI interviewer reviews your code,
                  asks follow-up questions about complexity and edge cases, and gives you
                  detailed feedback—exactly like a real Big Tech or AI lab interview.
                </p>
              </div>
              <div className="ai-feature-video">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/mascot.webm" type="video/webm" />
                  <source src="/mascot.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section id="proof" className="section alt">
          <div className="container">
            <div className="proof-header">
              <p className="eyebrow">Results</p>
              <h2>Engineers who landed their dream roles.</h2>
              <p className="subtle">
                Don't just take our word for it. Here's what engineers who used our
                question bank have to say.
              </p>
            </div>
            <div className="stats-grid">
              <div className="stat">
                <h3>{totalQuestions.toLocaleString()}+</h3>
                <p>Coding questions</p>
              </div>
              <div className="stat">
                <h3>{companies.length}</h3>
                <p>Companies covered</p>
              </div>
              <div className="stat">
                <h3>15+</h3>
                <p>Topic categories</p>
              </div>
            </div>
            <div className="testimonial-grid">
              <div className="testimonial">
                <p>
                  The follow-up questions were exactly what I got asked at Google.
                  "What if the input was 10x larger?" Nailed it.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">A</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">Alex K.</div>
                    <div className="testimonial-role">
                      L5 SWE offer from Google
                    </div>
                  </div>
                </div>
              </div>
              <div className="testimonial">
                <p>
                  The system design questions were exactly what I got asked.
                  "Design a rate limiter for an API with 100M requests/day." Word for word.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">D</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">David C.</div>
                    <div className="testimonial-role">
                      Research Engineer offer from OpenAI
                    </div>
                  </div>
                </div>
              </div>
              <div className="testimonial">
                <p>
                  Anthropic's bar is insane. The AI follow-ups here—"What if this runs
                  on a GPU cluster?"—prepared me for the depth they expect.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">P</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">Priya S.</div>
                    <div className="testimonial-role">
                      Senior SWE offer from Anthropic
                    </div>
                  </div>
                </div>
              </div>
              <div className="testimonial">
                <p>
                  Used this for my Amazon loop. The DP questions were spot-on.
                  Got the exact same problem in my onsite.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">R</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">Raj P.</div>
                    <div className="testimonial-role">
                      SDE II offer from Amazon
                    </div>
                  </div>
                </div>
              </div>
              <div className="testimonial">
                <p>
                  When you're interviewing for a company building AGI, you need to
                  think at a different level. This got me there.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">J</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">Jordan T.</div>
                    <div className="testimonial-role">
                      Founding Engineer offer from xAI
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How We Got It */}
        <section className="section" id="how-it-works">
          <div className="container split">
            <div>
              <p className="eyebrow">The Source</p>
              <h2>Real questions. Verified origins.</h2>
              <p className="lead" style={{ marginBottom: 0 }}>
                We aggregated coding interview debriefs from Blind, LeetCode discussions,
                private engineering communities, and verified candidate submissions.
                Every question is tagged with the company, difficulty, and topic.
              </p>
            </div>
            <div className="feature-grid">
              <div className="feature">
                <h4>From Real Interviews</h4>
                <p>
                  Actual questions from recent coding rounds, not recycled textbook
                  problems.
                </p>
              </div>
              <div className="feature">
                <h4>Company-Tagged</h4>
                <p>
                  Know exactly which company asked which question and when.
                </p>
              </div>
              <div className="feature">
                <h4>Difficulty Calibrated</h4>
                <p>
                  Easy, Medium, Hard—aligned with actual top tech interview expectations.
                </p>
              </div>
              <div className="feature">
                <h4>Weekly Updates</h4>
                <p>
                  Fresh questions added regularly from ongoing interview cycles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Why Apex Interviewer</p>
              <h2>More than LeetCode. Real interview practice.</h2>
              <p>
                Most interview prep stops at solving problems. We take you further
                with AI-powered mock interviews that simulate the real experience.
              </p>
            </div>
            <div className="split">
              <div className="feature-grid">
                <div className="feature">
                  <h4>Full Code Editor</h4>
                  <p>
                    Write real code with syntax highlighting, not pseudocode in a
                    text box.
                  </p>
                </div>
                <div className="feature">
                  <h4>AI Follow-Up Questions</h4>
                  <p>
                    Get grilled on time complexity, space complexity, and edge cases—
                    just like the real thing.
                  </p>
                </div>
                <div className="feature">
                  <h4>Voice-Based Discussion</h4>
                  <p>
                    Practice explaining your solution out loud—the skill that
                    actually matters in interviews.
                  </p>
                </div>
                <div className="feature">
                  <h4>Progress Tracking</h4>
                  <p>
                    Track your scores by topic, identify weak areas, and focus
                    your practice where it counts.
                  </p>
                </div>
              </div>
              <div className="module-list">
                <div className="module">
                  <span>01</span>
                  <p>Arrays & Strings</p>
                </div>
                <div className="module">
                  <span>02</span>
                  <p>Hash Tables & Sets</p>
                </div>
                <div className="module">
                  <span>03</span>
                  <p>Linked Lists</p>
                </div>
                <div className="module">
                  <span>04</span>
                  <p>Trees & Graphs</p>
                </div>
                <div className="module">
                  <span>05</span>
                  <p>Dynamic Programming</p>
                </div>
                <div className="module">
                  <span>06</span>
                  <p>Recursion & Backtracking</p>
                </div>
                <div className="module">
                  <span>07</span>
                  <p>Sorting & Searching</p>
                </div>
                <div className="module">
                  <span>08</span>
                  <p>System Design</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Questions */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Sample Questions</p>
              <h2>Questions that feel like the real interview.</h2>
            </div>
            <div className="question-grid">
              <div className="question-card">
                <p className="tag">Arrays • Medium</p>
                <h4>
                  Two Sum
                </h4>
                <p>
                  Given an array of integers and a target, return indices of two numbers
                  that add up to target.
                </p>
              </div>
              <div className="question-card">
                <p className="tag">Dynamic Programming • Hard</p>
                <h4>
                  Longest Increasing Subsequence
                </h4>
                <p>
                  Find the length of the longest strictly increasing subsequence.
                </p>
              </div>
              <div className="question-card">
                <p className="tag">Trees • Medium</p>
                <h4>
                  Validate Binary Search Tree
                </h4>
                <p>
                  Determine if a binary tree is a valid BST.
                </p>
              </div>
              <div className="question-card">
                <p className="tag">Graphs • Hard</p>
                <h4>
                  Word Ladder
                </h4>
                <p>
                  Find the shortest transformation sequence from beginWord to endWord.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="section alt">
          <div className="container pricing-grid">
            <div>
              <p className="eyebrow">Pricing</p>
              <h2>Annual access. Unlimited practice.</h2>
              <p>
                One simple price for a full year. All the questions and AI-powered
                mock interviews to prep for your top tech interviews.
              </p>
              <ul className="checklist">
                <li>
                  Full access to {totalQuestions.toLocaleString()}+ verified questions
                </li>
                <li>Questions from {companies.length} top tech companies</li>
                <li>Full code editor with 5 language support</li>
                <li>Unlimited AI mock interviews with follow-ups</li>
                <li>Complexity analysis & optimization feedback</li>
                <li>Progress tracking across all topics</li>
                <li>Weekly question updates for 12 months</li>
                <li>30-day money-back guarantee</li>
              </ul>
            </div>
            <PricingCard />
          </div>
        </section>

        {/* FAQ */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2>Questions, answered.</h2>
            </div>
            <div className="faq-grid">
              <div className="faq">
                <h4>How does the AI mock interview work?</h4>
                <p>
                  Select a question, write your solution in the code editor, then submit.
                  The AI reviews your code, asks follow-up questions about complexity and
                  edge cases, and provides detailed feedback.
                </p>
              </div>
              <div className="faq">
                <h4>What does the AI evaluate?</h4>
                <p>
                  Correctness, time complexity, space complexity, code quality,
                  and edge case handling—calibrated to industry interview standards.
                </p>
              </div>
              <div className="faq">
                <h4>What languages are supported?</h4>
                <p>
                  Python, JavaScript, Java, C++, and Go—the most common languages
                  in top tech coding interviews.
                </p>
              </div>
              <div className="faq">
                <h4>Where do the questions come from?</h4>
                <p>
                  Questions are sourced from Blind, LeetCode discussions, verified
                  candidate submissions, and private engineering communities.
                </p>
              </div>
              <div className="faq">
                <h4>Are AI mock interviews unlimited?</h4>
                <p>
                  Yes. Practice any question as many times as you want. Your
                  progress and scores are saved so you can track improvement.
                </p>
              </div>
              <div className="faq">
                <h4>How often is the question bank updated?</h4>
                <p>
                  We add new questions weekly as we receive fresh interview debriefs.
                  Your purchase includes 12 months of updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="container cta-inner">
            <h2>Ready to work at the companies building the future?</h2>
            <p>
              Real questions. AI-powered practice. The preparation that gets offers.
            </p>
            <CTAButton />
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
