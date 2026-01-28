"use client";

import CheckoutButton from "./CheckoutButton";

export default function PricingCard() {
  return (
    <div className="price-card">
      <p className="price-original">$500</p>
      <p className="price">$350</p>
      <p className="price-label">per year</p>
      <p className="price-savings">Save $150 — Limited time offer</p>
      <CheckoutButton className="btn btn-primary">
        Get Access Now
      </CheckoutButton>
      <p className="microcopy">Secure checkout • Instant access</p>
    </div>
  );
}
