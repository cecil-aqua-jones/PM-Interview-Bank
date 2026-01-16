import styles from "./app.module.css";

export default function DashboardLoading() {
  return (
    <>
      {/* Header Skeleton */}
      <div className={styles.pageHeader}>
        <div className={styles.skeletonEyebrow} />
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonSubtitle} />
      </div>

      {/* Search Skeleton */}
      <div className={styles.searchBar}>
        <div className={styles.skeletonSearch} />
      </div>

      {/* Company Grid Skeleton */}
      <div className={styles.companyGrid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonLogo} />
            <div className={styles.skeletonCardContent}>
              <div className={styles.skeletonCardTitle} />
              <div className={styles.skeletonCardMeta} />
            </div>
            <div className={styles.skeletonCardFooter} />
          </div>
        ))}
      </div>
    </>
  );
}
