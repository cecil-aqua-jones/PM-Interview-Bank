"use client";

import CheckoutButton from "./CheckoutButton";

export default function PricingCard() {
  return (
    <div className="price-card">
      <p className="price">$250</p>
      <p className="price-label">One-time payment</p>
      <CheckoutButton className="btn btn-primary">
        Get Access Now
      </CheckoutButton>
      <p className="microcopy">Secure checkout • Instant access</p>
    </div>
  );
}
