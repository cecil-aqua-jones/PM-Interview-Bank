import Link from "next/link";
import AnimatedMascot from "@/components/AnimatedMascot";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function LandingHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <AnimatedMascot size={36} />
          <span className="brand-name">
            <span className="brand-primary">Apex</span>
            <span className="brand-sub">|</span>
            <span className="brand-interviewer">&lt;interviewer/&gt;</span>
          </span>
        </Link>
        <nav className="nav-links">
          <a href="/dashboard">Companies</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ThemeToggle />
          <Link href="/login" className="btn btn-primary">
            Try Free
          </Link>
        </div>
      </div>
    </header>
  );
}
