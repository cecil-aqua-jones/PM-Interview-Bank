import { getCompanies } from "@/lib/airtable";
import Image from "next/image";
import LogoMarquee from "./components/LogoMarquee";
import AnimatedMascot from "@/components/AnimatedMascot";

export default async function Home() {
  const companies = await getCompanies();
  const totalQuestions = companies.reduce(
    (sum, c) => sum + (c.questionCount ?? 0),
    0
  );

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <AnimatedMascot size={36} />
            <span className="brand-name">Product Leaks</span>
          </div>
          <nav className="nav-links">
            <a href="#companies">Companies</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#proof">Results</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <a className="btn btn-primary" href="/login">
            Get Access
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">For Mid-Senior Product Managers</p>
              <h1>
                Your shortcut to acing Product Management interviews.
              </h1>
              <p className="lead">
                Access real product case studies and interview questions curated
                from {companies.length} top tech companies. Sharpen your product
                sense and land your dream PM role.
              </p>
              <div className="cta-group">
                <a className="btn btn-primary" href="/login">
                  Start Exploring Free
                </a>
                <a className="btn btn-secondary" href="#companies">
                  View Companies
                </a>
              </div>
              <p className="microcopy">
                {totalQuestions.toLocaleString()}+ questions • Updated monthly •
                Instant access
              </p>
            </div>
            <div className="hero-card">
              <div className="card-top">
                <h3>What's inside</h3>
                <p>
                  Comprehensive question bank covering every PM interview round.
                </p>
              </div>
              <div className="card-list">
                <div className="pill">Product Sense</div>
                <div className="pill">Execution</div>
                <div className="pill">Metrics</div>
                <div className="pill">Strategy</div>
                <div className="pill">Behavioral</div>
                <div className="pill">Take-home</div>
              </div>
              <div className="card-bottom">
                <p className="price-tag">$129</p>
                <span className="price-note">One-time purchase</span>
              </div>
            </div>
          </div>
        </section>

        {/* Company Logos - Infinite Marquee */}
        <section id="companies" className="trust">
          <div className="trust-header">
            <p className="eyebrow" style={{ textAlign: "center", marginBottom: 8 }}>
              Trusted by PMs preparing for interviews at
            </p>
            <p style={{ textAlign: "center", fontSize: 14, color: "#8a8884", marginBottom: 0 }}>
              30+ top American tech companies
            </p>
          </div>
          <LogoMarquee />
          <div className="container">
            <p className="trust-footer">
              Questions sourced from PM communities, interview debriefs, and
              verified candidate submissions.
            </p>
          </div>
        </section>

        {/* AI Mock Interview Feature */}
        <section className="section" id="features">
          <div className="container">
            <div className="ai-feature-grid">
              <div className="ai-feature-content">
                <p className="eyebrow">New Feature</p>
                <h2>Practice with an AI interviewer.</h2>
                <p className="lead">
                  Click play on any question and practice your response out loud. 
                  Our AI listens, evaluates your answer using a PM-specific rubric, 
                  and gives you actionable feedback in seconds.
                </p>
              </div>
              <div className="ai-feature-image">
                <Image
                  src="/ai-owl-mascot.png"
                  alt="AI Interview Coach - Friendly owl mascot"
                  width={400}
                  height={400}
                  priority
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section id="proof" className="section alt">
          <div className="container">
            <div className="proof-header">
              <p className="eyebrow">Results</p>
              <h2>What our users are saying.</h2>
              <p className="subtle">
                Don't just take our word for it. Here's what PMs who used our
                question bank have to say.
              </p>
            </div>
            <div className="stats-grid">
              <div className="stat">
                <h3>{totalQuestions.toLocaleString()}+</h3>
                <p>Interview questions</p>
              </div>
              <div className="stat">
                <h3>{companies.length}</h3>
                <p>Companies covered</p>
              </div>
              <div className="stat">
                <h3>8</h3>
                <p>Interview categories</p>
              </div>
            </div>
            <div className="testimonial-grid">
              <div className="testimonial">
                <p>
                  The questions were spot-on. I saw two nearly identical prompts
                  in my Google onsite.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">P</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">Priya S.</div>
                    <div className="testimonial-role">
                      Received offer from Stripe
                    </div>
                  </div>
                </div>
              </div>
              <div className="testimonial">
                <p>
                  Finally, a resource that feels written by people who have
                  actually interviewed at these companies.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">M</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">Marcus T.</div>
                    <div className="testimonial-role">
                      Received offer from Airbnb
                    </div>
                  </div>
                </div>
              </div>
              <div className="testimonial">
                <p>
                  Used it to prep for my RPM loop. The metrics questions were
                  incredibly helpful.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">E</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">Elena R.</div>
                    <div className="testimonial-role">
                      Cracked Google RPM loop
                    </div>
                  </div>
                </div>
              </div>
              <div className="testimonial">
                <p>
                  I prepped with this for two weeks and landed a Product Lead
                  role. Worth every penny.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">J</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">Jules K.</div>
                    <div className="testimonial-role">
                      Received offer from DoorDash
                    </div>
                  </div>
                </div>
              </div>
              <div className="testimonial">
                <p>
                  The behavioral questions helped me structure my stories way
                  better than any framework.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">M</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">Meera V.</div>
                    <div className="testimonial-role">
                      Received offer from Atlassian
                    </div>
                  </div>
                </div>
              </div>
              <div className="testimonial">
                <p>
                  I used this to interview my own candidates. The rubrics are
                  gold for hiring managers.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">A</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">Alex C.</div>
                    <div className="testimonial-role">Group PM at Meta</div>
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
                We aggregated PM interview debriefs from private candidate
                circles, invite-only PM forums, and trusted communities across
                India and the US. Every question is anonymized, verified, and
                calibrated to the hiring bar of America's top tech companies.
              </p>
            </div>
            <div className="feature-grid">
              <div className="feature">
                <h4>Sourced from Real Loops</h4>
                <p>
                  Actual questions from recent interview rounds, not recycled textbook
                  prompts.
                </p>
              </div>
              <div className="feature">
                <h4>Verified & Timestamped</h4>
                <p>
                  Each question includes when it was last asked and at which
                  company.
                </p>
              </div>
              <div className="feature">
                <h4>Difficulty Calibrated</h4>
                <p>
                  Questions tagged by difficulty and company expectations for
                  realistic prep.
                </p>
              </div>
              <div className="feature">
                <h4>Monthly Updates</h4>
                <p>
                  Fresh questions added regularly from ongoing interview cycles
                  worldwide.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Why Product Leaks</p>
              <h2>More than questions. Real practice.</h2>
              <p>
                Most interview prep stops at reading questions. We take you further 
                with AI-powered mock interviews that simulate the real experience.
              </p>
            </div>
            <div className="split">
              <div className="feature-grid">
                <div className="feature">
                  <h4>Voice-Based Practice</h4>
                  <p>
                    Practice speaking your answers out loud—the skill that 
                    actually matters in interviews.
                  </p>
                </div>
                <div className="feature">
                  <h4>PM-Specific Evaluation</h4>
                  <p>
                    AI feedback calibrated to PM competencies: structure, product 
                    thinking, metrics, communication, execution.
                  </p>
                </div>
                <div className="feature">
                  <h4>Difficulty-Aware Scoring</h4>
                  <p>
                    Feedback adjusts based on question difficulty and expected 
                    depth for your target level.
                  </p>
                </div>
                <div className="feature">
                  <h4>Progress Tracking</h4>
                  <p>
                    Review your scores over time, identify weak areas, and 
                    focus your practice where it counts.
                  </p>
                </div>
              </div>
              <div className="module-list">
                <div className="module">
                  <span>01</span>
                  <p>Product Sense Fundamentals</p>
                </div>
                <div className="module">
                  <span>02</span>
                  <p>Market & Competitive Insight</p>
                </div>
                <div className="module">
                  <span>03</span>
                  <p>Customer Discovery</p>
                </div>
                <div className="module">
                  <span>04</span>
                  <p>Product Design Collaboration</p>
                </div>
                <div className="module">
                  <span>05</span>
                  <p>Execution & Delivery</p>
                </div>
                <div className="module">
                  <span>06</span>
                  <p>Metrics & Experimentation</p>
                </div>
                <div className="module">
                  <span>07</span>
                  <p>Technical PM: Platform & APIs</p>
                </div>
                <div className="module">
                  <span>08</span>
                  <p>Leadership & Influence</p>
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
                <p className="tag">Product Sense</p>
                <h4>
                  Design a feature to help users discover new music on Spotify.
                </h4>
                <p>
                  Walk through your approach, user segments, and success
                  metrics.
                </p>
              </div>
              <div className="question-card">
                <p className="tag">Execution</p>
                <h4>
                  A launch is slipping. What do you cut, and how do you align
                  the team?
                </h4>
                <p>
                  Detail the decision framework and how you communicate the
                  reset.
                </p>
              </div>
              <div className="question-card">
                <p className="tag">Metrics</p>
                <h4>
                  Your activation rate dropped 12%. How do you diagnose it in 48
                  hours?
                </h4>
                <p>Prioritize hypotheses and explain how you'll rule them out.</p>
              </div>
              <div className="question-card">
                <p className="tag">Behavioral</p>
                <h4>Tell me about a time you led without authority and won.</h4>
                <p>
                  Share the context, the conflict, and the outcome you drove.
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
              <h2>One-time purchase. Unlimited practice.</h2>
              <p>
                No subscriptions, no fluff. Get the questions and AI-powered 
                mock interviews to prep for multiple interview cycles.
              </p>
              <ul className="checklist">
                <li>
                  Full access to {totalQuestions.toLocaleString()}+ verified questions
                </li>
                <li>Questions from {companies.length} top tech companies</li>
                <li>Unlimited AI mock interviews with voice practice</li>
                <li>Instant feedback scored on PM rubrics</li>
                <li>Progress tracking across all questions</li>
                <li>Monthly question updates for 12 months</li>
                <li>30-day money-back guarantee</li>
              </ul>
            </div>
            <div className="price-card">
              <p className="price">$129</p>
              <p className="price-label">One-time payment</p>
              <a className="btn btn-primary" href="/login">
                Get Access Now
              </a>
              <p className="microcopy">Secure checkout • Instant access</p>
            </div>
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
                  Click play on any question. An AI interviewer reads the question 
                  aloud. Record your verbal answer, and get instant feedback scored 
                  across 5 PM competencies.
                </p>
              </div>
              <div className="faq">
                <h4>What does the AI evaluate?</h4>
                <p>
                  Structure & frameworks, product thinking depth, metrics usage, 
                  communication clarity, and execution awareness—calibrated to 
                  your question's difficulty level.
                </p>
              </div>
              <div className="faq">
                <h4>Where do the questions come from?</h4>
                <p>
                  Questions are sourced from interview debriefs shared in PM
                  communities, verified candidate submissions, and invite-only
                  forums.
                </p>
              </div>
              <div className="faq">
                <h4>Is this best for experienced PMs?</h4>
                <p>
                  Yes. The bank focuses on mid to senior interview depth, with
                  questions calibrated for L5-L7 expectations at top companies.
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
                  We add new questions monthly as we receive fresh debriefs.
                  Your purchase includes 12 months of updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="container cta-inner">
            <h2>Ready to practice like it's the real thing?</h2>
            <p>
              Real questions. AI mock interviews. Instant feedback. 
              Everything you need to walk into your PM interview with confidence.
            </p>
            <a className="btn btn-accent" href="/login">
              Start Practicing Now
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>Product Leaks • Built for ambitious product leaders.</p>
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
