export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-mark" />
            <span className="brand-name">Atlas PM Interview Bank</span>
          </div>
          <nav className="nav-links">
            <a href="#origin">Story</a>
            <a href="#curriculum">Curriculum</a>
            <a href="#proof">Proof</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a className="btn btn-primary" href="#pricing">
            Get the Bank
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">For Mid-Senior Product Managers</p>
              <h1>
                Your shortcut to acing Product Management interviews.
              </h1>
              <p className="lead">
                Access real product case studies and interview questions to
                sharpen your product sense and land your dream PM role.
              </p>
              <div className="cta-group">
                <a className="btn btn-primary" href="#pricing">
                  Explore
                </a>
                <a className="btn btn-secondary" href="#curriculum">
                  Ramp PM Questions
                </a>
                <a className="btn btn-secondary" href="#curriculum">
                  Google PM Questions
                </a>
                <a className="btn btn-secondary" href="#curriculum">
                  Uber PM Questions
                </a>
              </div>
              <p className="microcopy">
                Updated monthly - 650+ questions - Instant download
              </p>
            </div>
            <div className="hero-card">
              <div className="card-top">
                <h3>What's inside</h3>
                <p>
                  13 modules covering product strategy, execution, analytics,
                  leadership, and behavioral depth.
                </p>
              </div>
              <div className="card-list">
                <div className="pill">Strategy + Vision</div>
                <div className="pill">Metrics + Analytics</div>
                <div className="pill">Execution + Delivery</div>
                <div className="pill">Leadership + Influence</div>
                <div className="pill">Technical Fluency</div>
                <div className="pill">Behavioral Depth</div>
              </div>
              <div className="card-bottom">
                <p className="price-tag">$129</p>
                <span className="price-note">One-time purchase</span>
              </div>
            </div>
          </div>
        </section>

        <section className="trust">
          <div className="container">
            <p className="eyebrow">
              We curate real interview questions asked by 100+ companies and
              popular PM loops like:
            </p>
            <div className="logo-grid">
              <span>Apple</span>
              <span>Google</span>
              <span>Amazon</span>
              <span>Microsoft</span>
              <span>Meta</span>
              <span>Netflix</span>
              <span>Stripe</span>
              <span>Airbnb</span>
              <span>Uber</span>
              <span>Salesforce</span>
            </div>
            <p className="subtle">
              Additional calibration across the top 30 tech companies in the
              US.
            </p>
          </div>
        </section>

        <section className="section alt" id="origin">
          <div className="container split">
            <div>
              <h2>How we got it: real PM interview debriefs.</h2>
              <p>
                We built this bank from fresh PM interview debriefs traded in
                private candidate circles and invite-only PM forums across
                India. Think: post-interview writeups, memory dumps, and
                role-specific recaps shared within 48 hours of onsite loops.
                Everything is anonymized and then calibrated to the hiring bar
                of America's top 30 tech companies.
              </p>
            </div>
            <div className="feature-grid">
              <div className="feature">
                <h4>Real questions, real context</h4>
                <p>
                  Prompts reflect live interview cycles, not recycled textbook
                  prompts.
                </p>
              </div>
              <div className="feature">
                <h4>Targeted practice</h4>
                <p>
                  Questions are tagged by domain and seniority for efficient
                  prep.
                </p>
              </div>
              <div className="feature">
                <h4>Exclusive insights</h4>
                <p>
                  Each module includes what interviewers listen for at senior
                  levels.
                </p>
              </div>
              <div className="feature">
                <h4>Time-saving focus</h4>
                <p>Skip noise and concentrate on questions that matter.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="curriculum" className="section">
          <div className="container split">
            <div>
              <h2>Why Atlas PM Interview Bank?</h2>
              <p>
                We do the heavy lifting for you. Our crowdsourced platform
                brings together actual product interview questions from recent
                loops shared by PMs in the community, so you do not have to
                spend days searching forums.
              </p>
              <div className="feature-grid">
                <div className="feature">
                  <h4>Crowdsourced case library</h4>
                  <p>
                    Real prompts from top companies, from product sense to
                    metrics deep dives.
                  </p>
                </div>
                <div className="feature">
                  <h4>Your remedy for framework fatigue</h4>
                  <p>
                    Stop memorizing robotic templates. Practice adapting your
                    thinking to real prompts.
                  </p>
                </div>
                <div className="feature">
                  <h4>Exclusive round insights</h4>
                  <p>
                    See when questions were asked and what interviewers probe
                    for at senior levels.
                  </p>
                </div>
                <div className="feature">
                  <h4>Targeted case practice</h4>
                  <p>
                    Filter by stage: recruiter screen, product sense,
                    execution, and take-home.
                  </p>
                </div>
                <div className="feature">
                  <h4>Focus on what matters</h4>
                  <p>
                    No fluff, no filler. Just the high-signal questions that
                    show up in onsite loops.
                  </p>
                </div>
              </div>
            </div>
            <div className="module-list">
              <div className="module">
                <span>01</span>
                <p>Product Sense Fundamentals</p>
              </div>
              <div className="module">
                <span>02</span>
                <p>Case Study: Market & Competitive Insight</p>
              </div>
              <div className="module">
                <span>03</span>
                <p>Product Sense: Customer Discovery</p>
              </div>
              <div className="module">
                <span>04</span>
                <p>Product Sense: Design Collaboration</p>
              </div>
              <div className="module">
                <span>05</span>
                <p>Execution: Roadmap & Delivery</p>
              </div>
              <div className="module">
                <span>06</span>
                <p>Execution: Metrics & Experimentation</p>
              </div>
              <div className="module">
                <span>07</span>
                <p>Technical PM: Platform & APIs</p>
              </div>
              <div className="module">
                <span>08</span>
                <p>Leadership: Influence & Alignment</p>
              </div>
              <div className="module">
                <span>09</span>
                <p>Stakeholder Management</p>
              </div>
              <div className="module">
                <span>10</span>
                <p>Case Study: Scaling & Operations</p>
              </div>
              <div className="module">
                <span>11</span>
                <p>Behavioral: Ownership & Conflict</p>
              </div>
              <div className="module">
                <span>12</span>
                <p>Take-Home: Written Exercise + Review</p>
              </div>
              <div className="module">
                <span>13</span>
                <p>Offer Strategy & Negotiation</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section alt">
          <div className="container">
            <h2>Sample questions that feel like the real interview.</h2>
            <div className="question-grid">
              <div className="question-card">
                <p className="tag">Strategy</p>
                <h4>How would you decide whether to sunset a core product?</h4>
                <p>
                  Walk through your decision criteria, tradeoffs, and the data
                  you would require to act.
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
                <p className="tag">Analytics</p>
                <h4>
                  Your activation rate dropped 12%. How do you diagnose it in
                  48 hours?
                </h4>
                <p>
                  Prioritize hypotheses and explain how you'll rule them out.
                </p>
              </div>
              <div className="question-card">
                <p className="tag">Leadership</p>
                <h4>Tell me about a time you led without authority and won.</h4>
                <p>
                  Share the context, the conflict, and the outcome you drove.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="proof" className="section">
          <div className="container">
            <div className="proof-header">
              <h2>What our users are saying.</h2>
              <p>
                Don't just take our word for it. Here's what some of our users
                have to say.
              </p>
            </div>
            <div className="stats-grid">
              <div className="stat">
                <h3>650+</h3>
                <p>Interview questions across senior PM domains.</p>
              </div>
              <div className="stat">
                <h3>13</h3>
                <p>Curated modules mapped to core evaluation areas.</p>
              </div>
              <div className="stat">
                <h3>30</h3>
                <p>Company calibration lens across top tech firms.</p>
              </div>
            </div>
            <div className="testimonial-grid">
              <div className="testimonial">
                <p>
                  "Received a PM offer from Stripe."
                </p>
                <span>Priya S. - Senior PM</span>
              </div>
              <div className="testimonial">
                <p>
                  "Cracked the Google RPM loop."
                </p>
                <span>Marcus T. - Product Manager</span>
              </div>
              <div className="testimonial">
                <p>
                  "Received a Senior PM offer from Airbnb."
                </p>
                <span>Elena R. - Senior PM</span>
              </div>
              <div className="testimonial">
                <p>"Received a Product Lead offer from DoorDash."</p>
                <span>Jules K. - Product Lead</span>
              </div>
              <div className="testimonial">
                <p>"Received an offer from Atlassian."</p>
                <span>Meera V. - PM</span>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="section alt">
          <div className="container pricing-grid">
            <div>
              <h2>One-time purchase. Lifetime confidence.</h2>
              <p>
                No subscriptions, no fluff. A premium question bank designed to
                carry you through multiple interview cycles.
              </p>
              <ul className="checklist">
                <li>Instant PDF + Notion access</li>
                <li>Monthly updates for 12 months</li>
                <li>Framework cheat sheets</li>
                <li>Interview scorecard templates</li>
              </ul>
            </div>
            <div className="price-card">
              <p className="price">$129</p>
              <p className="price-label">One-time payment</p>
              <a className="btn btn-primary" href="#pricing">
                Buy Now
              </a>
              <p className="microcopy">
                Secure checkout - 30-day refund policy
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="section">
          <div className="container">
            <h2>Questions, answered.</h2>
            <div className="faq-grid">
              <div className="faq">
                <h4>Is this best for experienced PMs?</h4>
                <p>
                  Yes. The bank focuses on mid to senior interview depth, with
                  clear expectations by level and company bar.
                </p>
              </div>
              <div className="faq">
                <h4>Does it include frameworks?</h4>
                <p>
                  Every module includes a distilled framework and rubric you
                  can reuse across interviews.
                </p>
              </div>
              <div className="faq">
                <h4>How do updates work?</h4>
                <p>
                  You'll receive monthly updates for 12 months, reflecting
                  market shifts and new interview patterns.
                </p>
              </div>
              <div className="faq">
                <h4>Can I use it for mock interview prep?</h4>
                <p>
                  Absolutely. It's designed for solo practice, peer prep, or
                  team interview training.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="container cta-inner">
            <h2>Ready to embark on your interview prep journey?</h2>
            <p>
              Start exploring resources calibrated to America's top tech
              companies.
            </p>
            <a className="btn btn-primary" href="#pricing">
              Start Exploring Resources
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>Atlas PM Interview Bank - Built for ambitious product leaders.</p>
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
