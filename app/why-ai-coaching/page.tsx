import { Metadata } from "next";
import Link from "next/link";
import LandingHeader from "../components/LandingHeader";
import LandingCompanyGrid from "../components/LandingCompanyGrid";
import LandingInterviewPreview from "../components/LandingInterviewPreview";
import LandingFeedbackPreview from "../components/LandingFeedbackPreview";
import LandingRadarChart from "../components/LandingRadarChart";

export const metadata: Metadata = {
  title: "Do AI Mock Interviews Actually Work? | Apex Interviewer",
  description:
    "Research shows that mock interview frequency is the best predictor of landing an offer. Learn why AI-powered interview practice delivers better results than traditional coaching.",
  keywords: [
    "AI mock interview effectiveness",
    "do AI interviews work",
    "AI interview practice results",
    "mock interview frequency",
    "interview coaching comparison",
  ],
};

export default function WhyAICoaching() {
  return (
    <>
      <LandingHeader />

      <main className="why-ai-page">
        {/* Hero */}
        <section className="why-ai-hero">
          <div className="container">
            <p className="eyebrow">The Research-Backed Answer</p>
            <h1>Do AI Mock Interviews Actually Work?</h1>
            <p className="why-ai-hero-lead">
              Yes, and the data explains why. Studies show that the single best predictor 
              of landing a software engineering offer is the <em>frequency and quality</em> of 
              mock interviews taken before the real thing. AI removes every barrier to 
              getting those reps in.
            </p>
          </div>
        </section>

        {/* Section 1: The AI Advantage */}
        <section className="section alt">
          <div className="container">
            <div className="why-ai-section-grid">
              <div className="why-ai-section-content">
                <p className="eyebrow">The AI Advantage</p>
                <h2>Tech Companies Use AI to Screen You. Use It to Prepare</h2>
                <p className="why-ai-section-text">
                  Google, Meta, Amazon, and dozens of other tech companies now use AI-powered 
                  systems to evaluate candidates. These systems analyze your communication 
                  patterns, problem-solving approach, and technical accuracy with 
                  machine-level precision.
                </p>
                <p className="why-ai-section-text">
                  If AI is going to evaluate you, shouldn't AI help you prepare? Training 
                  with the same technology that will assess you gives you an unfair advantage 
                  over candidates who only practice with humans.
                </p>
              </div>
              <div className="why-ai-section-visual">
                <LandingCompanyGrid />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Practice More, Practice Honestly */}
        <section className="section">
          <div className="container">
            <div className="why-ai-section-grid reverse">
              <div className="why-ai-section-content">
                <p className="eyebrow">Volume Matters</p>
                <h2>Practice More, Practice Honestly</h2>
                
                <div className="why-ai-benefits">
                  <div className="why-ai-benefit">
                    <h4>Available 24/7</h4>
                    <p>
                      Practice the moment motivation hits, not when a calendar slot opens up 
                      three weeks from now. Strike while the iron is hot.
                    </p>
                  </div>
                  
                  <div className="why-ai-benefit">
                    <h4>Zero Judgment</h4>
                    <p>
                      Bomb the same question six times and feel nothing but progress. 
                      There's no awkwardness, no embarrassment, just learning.
                    </p>
                  </div>
                  
                  <div className="why-ai-benefit">
                    <h4>No Performing for Your Coach</h4>
                    <p>
                      Experiment freely with rough, risky answers instead of playing it safe. 
                      Try the unconventional approach. See what sticks.
                    </p>
                  </div>
                  
                  <div className="why-ai-benefit">
                    <h4>More Honest Reps</h4>
                    <p>
                      Higher frequency, exactly when you need them. No scheduling friction. 
                      No cancellation guilt. Just practice.
                    </p>
                  </div>
                </div>
              </div>
              <div className="why-ai-section-visual">
                <LandingInterviewPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Feedback Humans Won't Give */}
        <section className="section alt">
          <div className="container">
            <div className="why-ai-section-grid">
              <div className="why-ai-section-content">
                <p className="eyebrow">Precision Feedback</p>
                <h2>Feedback Humans Won't Give You</h2>
                
                <div className="why-ai-benefits">
                  <div className="why-ai-benefit">
                    <h4>Pinpoints Habits You Can't See</h4>
                    <p>
                      Filler words, rambling, burying the lead. AI catches the patterns 
                      you're blind to and your friends are too polite to mention.
                    </p>
                  </div>
                  
                  <div className="why-ai-benefit">
                    <h4>Perfect Recall Across Sessions</h4>
                    <p>
                      Tracks your specific weakness patterns across every session. 
                      Humans forget. AI remembers everything.
                    </p>
                  </div>
                  
                  <div className="why-ai-benefit">
                    <h4>Same Rubric Every Time</h4>
                    <p>
                      Know whether you're actually improving, not just feeling more comfortable. 
                      Consistent measurement reveals real progress.
                    </p>
                  </div>
                  
                  <div className="why-ai-benefit">
                    <h4>No Softened Feedback</h4>
                    <p>
                      No protecting the relationship. No sparing your feelings. 
                      Just precise, calibrated honesty about where you stand.
                    </p>
                  </div>
                </div>
              </div>
              <div className="why-ai-section-visual">
                <div className="why-ai-visual-stack">
                  <LandingFeedbackPreview />
                  <LandingRadarChart />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Elite Coaching for Everyone */}
        <section className="section">
          <div className="container">
            <div className="why-ai-elite-section">
              <p className="eyebrow">Democratizing Excellence</p>
              <h2>Elite Coaching, Available to Everyone</h2>
              
              <div className="why-ai-comparison">
                <div className="why-ai-comparison-card human">
                  <p className="why-ai-comparison-label">Human Coaches</p>
                  <p className="why-ai-comparison-price">$150–300<span>/session</span></p>
                  <ul className="why-ai-comparison-list">
                    <li>Booked out for weeks</li>
                    <li>Limited availability</li>
                    <li>Quality varies wildly</li>
                    <li>Relationship dynamics affect honesty</li>
                  </ul>
                </div>
                
                <div className="why-ai-comparison-card ai">
                  <p className="why-ai-comparison-label">AI Coaching</p>
                  <p className="why-ai-comparison-price">Unlimited<span> practice</span></p>
                  <ul className="why-ai-comparison-list">
                    <li>Available right now</li>
                    <li>24/7 access</li>
                    <li>Consistent quality every session</li>
                    <li>Brutally honest feedback</li>
                  </ul>
                </div>
              </div>
              
              <div className="why-ai-elite-message">
                <p>
                  The best human coaches have frameworks that work. But those frameworks 
                  shouldn't be gatekept behind $300/hour fees and six-week waitlists.
                </p>
                <p>
                  <strong>Your prep quality shouldn't depend on your bank account.</strong> 
                  Well-prepared candidates make better engineers. We think everyone deserves that shot.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="why-ai-cta">
          <div className="container">
            <h2>Ready to See the Difference?</h2>
            <p>
              Stop wondering if AI interview practice works. Try it yourself and 
              feel the difference in your next mock session.
            </p>
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Start Practicing Now
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="site-footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} Apex Interviewer. All rights reserved.</p>
            <nav className="footer-links">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}
