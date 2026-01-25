"use client";

import CheckoutButton from "./CheckoutButton";

export default function PricingCard() {
  return (
    <div className="price-card">
      <p className="price-original">$300</p>
      <p className="price">$150</p>
      <p className="price-label">per year</p>
      <p className="price-savings">Save 50% — Limited time offer</p>
      <CheckoutButton className="btn btn-primary">
        Get Access Now
      </CheckoutButton>
      <p className="microcopy">Secure checkout • Instant access</p>
    </div>
  );
}
