import Link from "next/link";

export default function PrivacyPolicy() {
  const lastUpdated = "January 30, 2026";

  return (
    <>
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="brand">
              <span className="brand-primary">APEX</span>
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
          <h1>Privacy Policy</h1>
          <p className="legal-date">Last updated: {lastUpdated}</p>

          <section className="legal-section">
            <p>
              Beip, Inc. ("we," "us," or "our") operates Apex Interviewer 
              (the "Service"). This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our Service.
            </p>
            <p>
              By using Apex Interviewer, you agree to the collection and use of 
              information in accordance with this policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>1. Information We Collect</h2>
            
            <h3>Account Information</h3>
            <p>
              When you create an account, we collect your email address for 
              authentication purposes. We use magic link authentication, which 
              means we do not store passwords.
            </p>

            <h3>Payment Information</h3>
            <p>
              Payment processing is handled by Stripe. We do not store your credit 
              card numbers, bank account details, or other sensitive payment 
              information on our servers. Stripe's privacy policy governs the 
              collection and use of your payment information.
            </p>

            <h3>Interview Session Data</h3>
            <p>We collect the following data during your interview practice sessions:</p>
            <ul>
              <li>Your spoken and written responses to interview questions</li>
              <li>Audio recordings during voice-enabled interview sessions</li>
              <li>Transcriptions of your verbal responses</li>
              <li>AI-generated feedback and evaluation scores</li>
              <li>Session timestamps and duration</li>
            </ul>

            <h3>Progress and Performance Data</h3>
            <p>
              We track your performance across different question types, companies, 
              and difficulty levels to provide personalized feedback and progress 
              tracking.
            </p>

            <h3>Usage and Analytics Data</h3>
            <p>We automatically collect certain information when you use our Service:</p>
            <ul>
              <li>Pages visited and features used</li>
              <li>Device type, browser type, and operating system</li>
              <li>IP address and general location (country/region)</li>
              <li>Referring website or source</li>
              <li>Session duration and interaction patterns</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our interview simulation services</li>
              <li>Process your subscription payments</li>
              <li>Generate AI-powered feedback on your interview responses</li>
              <li>Track and display your progress over time</li>
              <li>Send transactional emails (account verification, payment receipts)</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Analyze usage patterns to improve our Service</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Third-Party Services</h2>
            <p>
              We use the following third-party services to operate Apex Interviewer. 
              Each service has its own privacy policy governing data handling:
            </p>
            
            <h3>Supabase</h3>
            <p>
              Authentication and database services. Stores your account information 
              and interview progress data.
            </p>

            <h3>Stripe</h3>
            <p>
              Payment processing. Handles all subscription billing and payment 
              information securely.
            </p>

            <h3>OpenAI</h3>
            <p>
              AI conversation and evaluation services. Your interview responses 
              are processed by OpenAI's API to generate feedback. OpenAI may 
              retain data as described in their privacy policy.
            </p>

            <h3>Cartesia</h3>
            <p>
              Text-to-speech services for voice-enabled interview simulations. 
              Processes text to generate realistic interviewer voices.
            </p>

            <h3>PostHog</h3>
            <p>
              Product analytics. Collects anonymized usage data to help us 
              understand how users interact with our Service.
            </p>

            <h3>Resend</h3>
            <p>
              Email delivery service. Sends transactional and marketing emails 
              on our behalf.
            </p>

            <h3>Vercel</h3>
            <p>
              Hosting and infrastructure. Hosts our application and may collect 
              server logs.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Data Retention and Deletion</h2>
            <p>
              We retain your personal data for as long as your account is active 
              or as needed to provide you with our services.
            </p>
            <p>
              <strong>Deletion requests:</strong> You may request deletion of your 
              account and all associated data at any time by contacting us at{" "}
              <a href="mailto:hi@apexinterviewer.com">hi@apexinterviewer.com</a>. 
              Upon receiving your request, we will delete your data immediately 
              from our systems, except where retention is required by law.
            </p>
            <p>
              Note that data already shared with third-party services (such as 
              OpenAI for processing) may be retained by those services according 
              to their own retention policies.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Your Rights</h2>
            <p>
              Depending on your location, you may have the following rights 
              regarding your personal data:
            </p>
            
            <h3>Access</h3>
            <p>
              You have the right to request a copy of the personal information 
              we hold about you.
            </p>

            <h3>Correction</h3>
            <p>
              You have the right to request correction of inaccurate personal 
              information.
            </p>

            <h3>Deletion</h3>
            <p>
              You have the right to request deletion of your personal information, 
              subject to certain exceptions.
            </p>

            <h3>Opt-Out of Marketing</h3>
            <p>
              You can unsubscribe from marketing emails at any time by clicking 
              the "unsubscribe" link in any marketing email or by contacting us.
            </p>

            <h3>Data Portability</h3>
            <p>
              You have the right to receive your personal data in a structured, 
              commonly used format.
            </p>

            <h3>CCPA Rights (California Residents)</h3>
            <p>
              California residents have additional rights under the California 
              Consumer Privacy Act, including the right to know what personal 
              information is collected, the right to delete, and the right to 
              opt-out of the sale of personal information. We do not sell 
              personal information.
            </p>

            <h3>GDPR Rights (EU/EEA Residents)</h3>
            <p>
              If you are in the European Union or European Economic Area, you 
              have rights under the General Data Protection Regulation, including 
              the right to access, rectify, erase, restrict processing, and data 
              portability.
            </p>

            <p>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:hi@apexinterviewer.com">hi@apexinterviewer.com</a>.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar tracking technologies to:</p>
            <ul>
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences</li>
              <li>Analyze usage patterns and improve our Service</li>
              <li>Measure the effectiveness of our marketing</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Note that 
              disabling cookies may affect the functionality of our Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your 
              personal information, including:
            </p>
            <ul>
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure authentication via magic links</li>
              <li>Access controls and authentication for our systems</li>
              <li>Regular security reviews</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic 
              storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Children's Privacy</h2>
            <p>
              Apex Interviewer is not intended for children under the age of 13. 
              We do not knowingly collect personal information from children 
              under 13. If you believe we have collected information from a 
              child under 13, please contact us immediately at{" "}
              <a href="mailto:hi@apexinterviewer.com">hi@apexinterviewer.com</a>.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries 
              other than your own, including the United States, where our servers 
              and third-party service providers are located. By using our Service, 
              you consent to such transfers.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify 
              you of any material changes by posting the new Privacy Policy on 
              this page and updating the "Last updated" date. Your continued use 
              of the Service after changes constitutes acceptance of the updated 
              policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data 
              practices, please contact us:
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
