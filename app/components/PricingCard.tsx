"use client";

import { useState } from "react";
import CheckoutButton from "./CheckoutButton";

type Plan = "monthly" | "annual";

export default function PricingCards() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");

  const plans = {
    monthly: {
      price: "$75",
      period: "/month",
      savings: null,
      buttonText: "Start Training",
    },
    annual: {
      price: "$500",
      period: "/year",
      savings: "Save $400 vs monthly",
      buttonText: "Start Training",
    },
  };

  const currentPlan = plans[selectedPlan];

  return (
    <div className="pricing-unified">
      {/* Plan Toggle */}
      <div className="pricing-toggle">
        <button
          type="button"
          className={`pricing-toggle-option ${selectedPlan === "monthly" ? "active" : ""}`}
          onClick={() => setSelectedPlan("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`pricing-toggle-option ${selectedPlan === "annual" ? "active" : ""}`}
          onClick={() => setSelectedPlan("annual")}
        >
          Annual
          <span className="pricing-toggle-badge">Best Value</span>
        </button>
      </div>

      {/* Single Pricing Card */}
      <div className="pricing-card-unified">
        <div className="pricing-card-content">
          <div className="pricing-card-price">
            <span className="pricing-amount">{currentPlan.price}</span>
            <span className="pricing-period">{currentPlan.period}</span>
          </div>
          
          {currentPlan.savings && (
            <p className="pricing-savings">{currentPlan.savings}</p>
          )}

          <ul className="pricing-features">
            <li>Unlimited mock interviews</li>
            <li>All 13 company simulations</li>
            <li>Coding, system design, and behavioral</li>
            <li>Real-time AI feedback</li>
            <li>Performance analytics</li>
            {selectedPlan === "annual" && (
              <>
                <li>Priority support</li>
                <li>Lifetime updates</li>
              </>
            )}
          </ul>

          <CheckoutButton className="btn btn-primary pricing-cta" plan={selectedPlan}>
            {currentPlan.buttonText}
          </CheckoutButton>

          <p className="pricing-guarantee">
            2-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}
