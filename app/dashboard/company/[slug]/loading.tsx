import styles from "../../app.module.css";

export default function CompanyLoading() {
  return (
    <>
      {/* Breadcrumb Skeleton */}
      <div className={styles.breadcrumb}>
        <div className={styles.skeletonBreadcrumb} />
      </div>

      {/* Header Skeleton */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderLeft}>
          <div className={styles.skeletonDetailLogo} />
          <div>
            <div className={styles.skeletonDetailTitle} />
            <div className={styles.skeletonDetailSubtitle} />
          </div>
        </div>
        <div className={styles.detailStats}>
          <div className={styles.skeletonStat} />
          <div className={styles.skeletonStat} />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className={styles.filterBar}>
        <div className={styles.filterSearch}>
          <div className={styles.skeletonSearch} />
        </div>
        <div className={styles.filterGroup}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonChip} />
          ))}
        </div>
      </div>

      {/* Question Layout Skeleton */}
      <div className={styles.questionLayout}>
        {/* Sidebar Skeleton */}
        <div className={styles.questionSidebar}>
          <div className={styles.questionSidebarHeader}>
            <div className={styles.skeletonSidebarTitle} />
          </div>
          <div className={styles.questionList}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonListItem}>
                <div className={styles.skeletonListItemTitle} />
                <div className={styles.skeletonListItemMeta} />
              </div>
            ))}
          </div>
        </div>

        {/* Detail Skeleton */}
        <div className={styles.questionDetail}>
          <div className={styles.questionCard}>
            <div className={styles.questionCardHeader}>
              <div className={styles.skeletonNav} />
              <div className={styles.skeletonQuestionTitle} />
              <div className={styles.skeletonTags} />
            </div>
            <div className={styles.questionCardBody}>
              <div className={styles.skeletonPrompt} />
              <div className={styles.skeletonPrompt} style={{ width: "80%" }} />
              <div className={styles.skeletonPrompt} style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
