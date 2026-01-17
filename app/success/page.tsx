import Link from "next/link";
import AnimatedMascot from "@/components/AnimatedMascot";

export default function SuccessPage() {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand">
            <AnimatedMascot size={36} />
            <span className="brand-name">Product Leaks</span>
          </Link>
        </div>
      </header>

      <main>
        <section className="section" style={{ minHeight: "70vh", display: "flex", alignItems: "center" }}>
          <div className="container" style={{ textAlign: "center", maxWidth: "600px" }}>
            <div style={{ 
              width: "80px", 
              height: "80px", 
              background: "#16a34a", 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 32px"
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "16px" }}>
              Welcome to Product Leaks!
            </h1>
            
            <p className="lead" style={{ marginBottom: "32px", color: "var(--slate)" }}>
              Your payment was successful. You now have full access to all PM interview 
              questions and AI mock interviews for the next year.
            </p>

            <div style={{ 
              background: "var(--ivory)", 
              padding: "24px", 
              borderRadius: "var(--radius-lg)",
              marginBottom: "32px"
            }}>
              <p style={{ fontSize: "14px", color: "var(--slate)", marginBottom: "16px" }}>
                A confirmation email has been sent to your inbox with your receipt and login details.
              </p>
              <p style={{ fontSize: "14px", color: "var(--slate)" }}>
                <strong>Next step:</strong> Check your email for a magic link to access your dashboard.
              </p>
            </div>

            <Link 
              href="/login" 
              className="btn btn-primary"
              style={{ minWidth: "200px" }}
            >
              Go to Dashboard
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>Product Leaks • Built for ambitious product leaders.</p>
        </div>
      </footer>
    </>
  );
}
