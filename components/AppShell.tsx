"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import styles from "../app/dashboard/app.module.css";
import AnimatedMascot from "./AnimatedMascot";
import ThemeToggle from "@/app/components/ThemeToggle";
import { supabase } from "@/lib/supabaseClient";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!supabase || isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={styles.shell}>
      <nav className={styles.topNav}>
        <div className={styles.topNavInner}>
          <Link href="/dashboard" className={styles.brand}>
            <AnimatedMascot size={32} />
            <span className={styles.brandName}>
              <span className={styles.brandPrimary}>Apex</span>
              <span className={styles.brandSub}>|</span>
              <span className={styles.brandInterviewer}>&lt;interviewer/&gt;</span>
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
            <ThemeToggle />
            <div className={styles.userMenu} ref={dropdownRef}>
              <button
                className={styles.userMenuTrigger}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-label="User menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className={styles.userMenuDropdown}>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              )}
            </div>
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
                <span className={styles.brandPrimary}>Apex</span>
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
            <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "15px", color: "var(--charcoal)" }}>Theme</span>
              <ThemeToggle />
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              disabled={isLoggingOut}
              className={styles.mobileNavLink}
              style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
            >
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}

      <main className={styles.main}>{children}</main>
    </div>
  );
}
