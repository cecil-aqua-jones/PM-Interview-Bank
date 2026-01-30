// Email configuration and utility functions
// NOTE: Email templates have been migrated to /emails directory using React Email

export const PROMO_CODE = "WELCOME20";
export const PROMO_EXPIRY_DAYS = 7;

export function getPromoExpiryDate(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + PROMO_EXPIRY_DAYS);
  return expiry;
}

export function formatExpiryDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
