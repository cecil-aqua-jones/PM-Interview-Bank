import Link from "next/link";
import styles from "../app/(app)/app.module.css";
import { Company } from "@/lib/types";

type AppShellProps = {
  companies: Company[];
  children: React.ReactNode;
};

export default function AppShell({ companies, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.brandIcon}>⚡</span>
          <span className={styles.brandName}>GothamLoop</span>
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/app" className={styles.navItem}>
            Home
          </Link>
          <a className={styles.navItem} href="#">
            Request Company
          </a>
          <a className={styles.navItem} href="#">
            Billing
          </a>
        </nav>
        <div className={styles.sidebarDivider} />
        <div className={styles.companyList}>
          {companies.map((company) => (
            <Link
              key={company.slug}
              href={`/app/company/${company.slug}`}
              className={styles.companyItem}
            >
              <span className={styles.companyDot} />
              <span>{company.name}</span>
              {company.questionCount ? (
                <span className={styles.companyCount}>
                  {company.questionCount}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.breadcrumb}>Home</div>
          <button className={styles.iconButton} type="button">
            🌙
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
