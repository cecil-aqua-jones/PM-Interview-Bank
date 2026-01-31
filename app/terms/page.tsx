import Link from "next/link";

export default function TermsOfService() {
  const lastUpdated = "January 30, 2026";

  return (
    <>
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="brand">
              <span className="brand-primary">Apex</span>
            </Link>
            <nav className="header-nav">
              <Link href="/login" className="btn btn-outline">
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="legal-page">
        <div className="container narrow">
          <h1>Terms of Service</h1>
          <p className="legal-date">Last updated: {lastUpdated}</p>

          <section className="legal-section">
            <p>
              These Terms of Service ("Terms") govern your access to and use of 
              Apex Interviewer (the "Service"), operated by Beip, Inc. ("we," "us," 
              or "our"), a Delaware corporation.
            </p>
            <p>
              By accessing or using our Service, you agree to be bound by these 
              Terms. If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>1. Description of Service</h2>
            <p>
              Apex Interviewer is an AI-powered interview simulation platform 
              designed to help software engineers prepare for technical interviews 
              at top technology companies. The Service includes:
            </p>
            <ul>
              <li>
                <strong>Coding Interview Practice:</strong> Verified coding 
                questions with AI-powered evaluation and feedback
              </li>
              <li>
                <strong>System Design Practice:</strong> Architecture and 
                scalability questions with detailed feedback
              </li>
              <li>
                <strong>Behavioral Interview Practice:</strong> Leadership and 
                situational questions with company-specific evaluation criteria
              </li>
              <li>
                <strong>Voice-Enabled Simulations:</strong> Real-time voice 
                interactions that simulate actual interview conditions
              </li>
              <li>
                <strong>Company-Specific Rubrics:</strong> Evaluation criteria 
                tailored to how companies like Google, Meta, Amazon, and others 
                assess candidates
              </li>
              <li>
                <strong>Progress Tracking:</strong> Performance analytics and 
                improvement tracking
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>2. User Accounts</h2>
            
            <h3>Registration</h3>
            <p>
              To use Apex Interviewer, you must create an account using a valid 
              email address. You agree to provide accurate information and keep 
              your account information up to date.
            </p>

            <h3>Account Security</h3>
            <p>
              You are responsible for maintaining the security of your account. 
              We use magic link authentication; you should not share your magic 
              links with others. You agree to notify us immediately of any 
              unauthorized access to your account.
            </p>

            <h3>One Account Per Person</h3>
            <p>
              Each account is for individual use only. You may not share your 
              account credentials or allow others to access your account. We 
              reserve the right to terminate accounts that violate this provision.
            </p>

            <h3>Age Requirement</h3>
            <p>
              You must be at least 18 years old to use the Service. By using 
              the Service, you represent that you meet this age requirement.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Subscription and Payments</h2>
            
            <h3>Pricing</h3>
            <p>
              Apex Interviewer is offered through paid subscription plans:
            </p>
            <ul>
              <li><strong>Monthly Plan:</strong> $75 per month</li>
              <li><strong>Annual Plan:</strong> $500 per year (save $400)</li>
            </ul>
            <p>
              Prices are subject to change. We will notify you of any price 
              changes before your next billing cycle.
            </p>

            <h3>Billing</h3>
            <p>
              Subscriptions are billed in advance on a recurring basis (monthly 
              or annually, depending on your plan). Your subscription will 
              automatically renew unless you cancel before the renewal date.
            </p>

            <h3>Payment Processing</h3>
            <p>
              All payments are processed securely through Stripe. By providing 
              payment information, you authorize us to charge your payment method 
              for the subscription fees.
            </p>

            <h3>Money-Back Guarantee</h3>
            <p>
              We offer a <strong>2-day money-back guarantee</strong> for new 
              subscribers. If you are not satisfied with the Service within 
              48 hours of your initial purchase, you may request a full refund 
              by completing a brief survey and contacting us at{" "}
              <a href="mailto:hi@apexinterviewer.com">hi@apexinterviewer.com</a>.
            </p>

            <h3>Cancellation</h3>
            <p>
              You may cancel your subscription at any time. Upon cancellation:
            </p>
            <ul>
              <li>Your access will continue until the end of your current billing period</li>
              <li>You will not be charged for subsequent billing periods</li>
              <li>No prorated refunds are provided for partial billing periods after the 2-day guarantee period</li>
            </ul>

            <h3>Refunds</h3>
            <p>
              Except as provided in our money-back guarantee, all subscription 
              fees are non-refundable. If you believe you are entitled to a 
              refund for exceptional circumstances, contact us at{" "}
              <a href="mailto:hi@apexinterviewer.com">hi@apexinterviewer.com</a>.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>
                Share your account or login credentials with others
              </li>
              <li>
                Use the Service for any illegal or unauthorized purpose
              </li>
              <li>
                Attempt to reverse engineer, decompile, or disassemble any part 
                of the Service
              </li>
              <li>
                Use automated scripts, bots, or scrapers to access the Service
              </li>
              <li>
                Interfere with or disrupt the Service or servers connected to 
                the Service
              </li>
              <li>
                Copy, reproduce, distribute, or publicly display any content 
                from the Service without our written permission
              </li>
              <li>
                Redistribute, resell, or commercially exploit the Service or 
                its content
              </li>
              <li>
                Submit false, misleading, or fraudulent information
              </li>
              <li>
                Harass, abuse, or harm another person through the Service
              </li>
              <li>
                Circumvent any access controls or usage limits
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Intellectual Property</h2>
            
            <h3>Our Content</h3>
            <p>
              The Service and its original content, features, and functionality 
              are owned by Beip, Inc. and are protected by international copyright, 
              trademark, patent, trade secret, and other intellectual property 
              laws. This includes but is not limited to:
            </p>
            <ul>
              <li>Interview questions and their solutions</li>
              <li>Company-specific evaluation rubrics</li>
              <li>AI-generated feedback and responses</li>
              <li>User interface design and graphics</li>
              <li>Software code and algorithms</li>
              <li>Documentation and educational content</li>
            </ul>

            <h3>Your Content</h3>
            <p>
              You retain ownership of any content you submit through the Service, 
              such as your interview responses. By submitting content, you grant 
              us a non-exclusive, worldwide, royalty-free license to use, process, 
              and analyze your content for the purpose of providing and improving 
              the Service.
            </p>

            <h3>Trademarks</h3>
            <p>
              "Apex Interviewer" and related logos are trademarks of Beip, Inc. 
              You may not use our trademarks without our prior written permission. 
              Company names mentioned in our Service (Google, Meta, Amazon, etc.) 
              are trademarks of their respective owners and are used for 
              identification purposes only.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. AI-Generated Content Disclaimer</h2>
            <p>
              <strong>Important:</strong> Apex Interviewer uses artificial 
              intelligence to provide interview simulations and feedback. 
              Please understand that:
            </p>
            <ul>
              <li>
                AI-generated feedback is provided for <strong>practice and 
                educational purposes only</strong>
              </li>
              <li>
                We do not guarantee that our feedback accurately reflects how 
                any specific company evaluates candidates
              </li>
              <li>
                <strong>Using our Service does not guarantee success in any 
                interview</strong>
              </li>
              <li>
                AI responses may occasionally be inaccurate, incomplete, or 
                inconsistent
              </li>
              <li>
                Our company-specific rubrics are based on publicly available 
                information and user reports; they are not endorsed by or 
                affiliated with the companies mentioned
              </li>
            </ul>
            <p>
              You should use the Service as one tool among many in your interview 
              preparation, and not rely solely on our feedback when preparing 
              for actual interviews.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT 
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT 
              NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR 
              A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
            </p>
            <p>
              We do not warrant that:
            </p>
            <ul>
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>The results obtained from using the Service will be accurate or reliable</li>
              <li>Any errors in the Service will be corrected</li>
              <li>The Service will meet your specific requirements</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL BEIP, INC., 
              ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES 
              BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
              PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, 
              DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul>
              <li>Your access to or use of or inability to access or use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
            <p>
              OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATING TO 
              THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US 
              IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Beip, Inc. and 
              its officers, directors, employees, contractors, agents, licensors, 
              and suppliers from and against any claims, liabilities, damages, 
              judgments, awards, losses, costs, expenses, or fees (including 
              reasonable attorneys' fees) arising out of or relating to your 
              violation of these Terms or your use of the Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Dispute Resolution</h2>
            
            <h3>Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with 
              the laws of the State of Delaware, United States, without regard 
              to its conflict of law provisions.
            </p>

            <h3>Arbitration</h3>
            <p>
              Any dispute arising from or relating to these Terms or the Service 
              shall be resolved through binding arbitration in accordance with 
              the rules of the American Arbitration Association. The arbitration 
              shall be conducted in Delaware, and judgment on the arbitration 
              award may be entered in any court having jurisdiction.
            </p>

            <h3>Class Action Waiver</h3>
            <p>
              YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED 
              ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR 
              REPRESENTATIVE ACTION.
            </p>

            <h3>Exception</h3>
            <p>
              Notwithstanding the above, either party may seek injunctive or 
              other equitable relief in any court of competent jurisdiction to 
              protect its intellectual property rights.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service 
              immediately, without prior notice or liability, for any reason, 
              including without limitation if you breach these Terms.
            </p>
            <p>
              Upon termination:
            </p>
            <ul>
              <li>Your right to use the Service will immediately cease</li>
              <li>We may delete your account and all associated data</li>
              <li>Provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time 
              at our sole discretion. If a revision is material, we will provide 
              at least 30 days' notice prior to any new terms taking effect by 
              posting on our website or sending you an email.
            </p>
            <p>
              Your continued use of the Service after the revised Terms become 
              effective constitutes your acceptance of the new Terms. If you do 
              not agree to the new Terms, you must stop using the Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Severability</h2>
            <p>
              If any provision of these Terms is held to be unenforceable or 
              invalid, such provision will be changed and interpreted to 
              accomplish the objectives of such provision to the greatest extent 
              possible under applicable law, and the remaining provisions will 
              continue in full force and effect.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the 
              entire agreement between you and Beip, Inc. regarding the Service 
              and supersede all prior agreements and understandings, whether 
              written or oral.
            </p>
          </section>

          <section className="legal-section">
            <h2>15. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <p>
              <strong>Beip, Inc.</strong><br />
              Email:{" "}
              <a href="mailto:hi@apexinterviewer.com">hi@apexinterviewer.com</a><br />
              Website:{" "}
              <a href="https://www.apexinterviewer.com">www.apexinterviewer.com</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <a href="mailto:hi@apexinterviewer.com">Contact</a>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Beip, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
