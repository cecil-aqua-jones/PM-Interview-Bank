import { getCompanies } from "@/lib/airtable";
import { getBrandIcon } from "@/lib/brandfetch";
import LandingLogos from "./components/LandingLogos";

export default async function Home() {
  const companies = await getCompanies();
  const totalQuestions = companies.reduce(
    (sum, c) => sum + (c.questionCount ?? 0),
    0
  );

  // Prepare logo data for client component
  const logoData = companies.slice(0, 15).map((c) => ({
    name: c.name,
    slug: c.slug,
    logoUrl: getBrandIcon(c.name),
    initial: c.name.charAt(0).toUpperCase()
  }));

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <div className="brand-mark">PM</div>
            <span className="brand-name">Interview Bank</span>
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

        {/* Company Logos */}
        <section id="companies" className="trust">
          <div className="container">
            <p className="eyebrow">
              Real interview questions from {companies.length}+ companies
            </p>
            <LandingLogos logos={logoData} />
            <p className="trust-footer">
              Questions sourced from PM communities, interview debriefs, and
              verified candidate submissions.
            </p>
          </div>
        </section>

        {/* How We Got It */}
        <section className="section" id="how-it-works">
          <div className="container split">
            <div>
              <p className="eyebrow">The Story</p>
              <h2>How we built this bank.</h2>
              <p className="lead" style={{ marginBottom: 0 }}>
                We aggregated PM interview debriefs from private candidate
                circles, invite-only PM forums, and trusted communities across
                India and the US. Every question is anonymized, verified, and
                calibrated to the hiring bar of America's top tech companies.
              </p>
            </div>
            <div className="feature-grid">
              <div className="feature">
                <h4>Real Questions</h4>
                <p>
                  Sourced from actual interview loops, not recycled textbook
                  prompts.
                </p>
              </div>
              <div className="feature">
                <h4>Recently Verified</h4>
                <p>
                  Each question includes when it was last asked and at which
                  company.
                </p>
              </div>
              <div className="feature">
                <h4>Targeted Practice</h4>
                <p>
                  Filter by company, category, and interview round for focused
                  prep.
                </p>
              </div>
              <div className="feature">
                <h4>Time-Saving</h4>
                <p>
                  Skip the noise. Focus on high-signal questions that actually
                  appear.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section className="section alt">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Why PM Interview Bank</p>
              <h2>We do the heavy lifting for you.</h2>
              <p>
                Our crowdsourced platform brings together actual product
                interview questions from recent loops—so you don't have to spend
                days searching forums and communities.
              </p>
            </div>
            <div className="split">
              <div className="feature-grid">
                <div className="feature">
                  <h4>Crowdsourced Case Library</h4>
                  <p>
                    Real prompts from top companies, from product sense to
                    metrics deep dives.
                  </p>
                </div>
                <div className="feature">
                  <h4>Your Remedy for Framework Fatigue</h4>
                  <p>
                    Stop memorizing robotic templates. Practice adapting your
                    thinking to real prompts.
                  </p>
                </div>
                <div className="feature">
                  <h4>Exclusive Round Insights</h4>
                  <p>
                    See when questions were asked and what interviewers probe
                    for at senior levels.
                  </p>
                </div>
                <div className="feature">
                  <h4>Focus on What Matters</h4>
                  <p>
                    No fluff, no filler. Just the high-signal questions that
                    show up in onsite loops.
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

        {/* Pricing */}
        <section id="pricing" className="section">
          <div className="container pricing-grid">
            <div>
              <p className="eyebrow">Pricing</p>
              <h2>One-time purchase. Lifetime confidence.</h2>
              <p>
                No subscriptions, no fluff. A premium question bank designed to
                carry you through multiple interview cycles.
              </p>
              <ul className="checklist">
                <li>
                  Full access to {totalQuestions.toLocaleString()}+ questions
                </li>
                <li>Questions from {companies.length} top tech companies</li>
                <li>Filter by company, category, and round</li>
                <li>Monthly updates for 12 months</li>
                <li>Last-verified dates on all questions</li>
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
        <section className="section alt">
          <div className="container">
            <div className="section-header">
              <h2>Questions, answered.</h2>
            </div>
            <div className="faq-grid">
              <div className="faq">
                <h4>Is this best for experienced PMs?</h4>
                <p>
                  Yes. The bank focuses on mid to senior interview depth, with
                  clear expectations by level and company.
                </p>
              </div>
              <div className="faq">
                <h4>Where do the questions come from?</h4>
                <p>
                  Questions are sourced from interview debriefs shared in PM
                  communities, verified candidate submissions, and public
                  forums.
                </p>
              </div>
              <div className="faq">
                <h4>How often is it updated?</h4>
                <p>
                  We add new questions monthly as we receive fresh debriefs.
                  You'll get updates for 12 months.
                </p>
              </div>
              <div className="faq">
                <h4>Can I use it for mock interviews?</h4>
                <p>
                  Absolutely. It's designed for solo practice, peer prep, or
                  team interview training.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="container cta-inner">
            <h2>Ready to ace your PM interviews?</h2>
            <p>
              Join thousands of PMs who have used our question bank to land
              roles at top tech companies.
            </p>
            <a className="btn btn-accent" href="/login">
              Get Access Now
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>PM Interview Bank • Built for ambitious product leaders.</p>
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
