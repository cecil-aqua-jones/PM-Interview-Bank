"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "../app/dashboard/app.module.css";
import AnimatedMascot from "./AnimatedMascot";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <div className={styles.shell}>
      <nav className={styles.topNav}>
        <div className={styles.topNavInner}>
          <Link href="/dashboard" className={styles.brand}>
            <AnimatedMascot size={32} />
            <span className={styles.brandName}>
              <span className={styles.brandPrimary}>APEX</span>
              <span className={styles.brandSub}>|</span>
              <span className={styles.brandSub}>&lt;interviewer/&gt;</span>
            </span>
          </Link>

          <div className={styles.navLinks}>
            <Link
              href="/dashboard"
              className={`${styles.navLink} ${isActive("/dashboard") ? styles.navLinkActive : ""
                }`}
            >
              Companies
            </Link>
            <Link
              href="/dashboard/progress"
              className={`${styles.navLink} ${isActive("/dashboard/progress") ? styles.navLinkActive : ""
                }`}
            >
              Progress
            </Link>
          </div>

          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className={styles.mobileNav}>
          <div className={styles.mobileNavHeader}>
            <Link href="/dashboard" className={styles.brand} onClick={() => setMobileMenuOpen(false)}>
              <AnimatedMascot size={32} />
              <span className={styles.brandName}>
                <span className={styles.brandPrimary}>APEX</span>
                <span className={styles.brandSub}>|</span>
                <span className={styles.brandSub}>&lt;interviewer/&gt;</span>
              </span>
            </Link>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className={styles.mobileNavLinks}>
            <Link
              href="/dashboard"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Companies
            </Link>
            <Link
              href="/dashboard/progress"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Progress
            </Link>
          </div>
        </div>
      )}

      <main className={styles.main}>{children}</main>
    </div>
  );
}
