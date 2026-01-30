import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { SITE_URL } from "@/lib/constants";

// Valid promo codes and their expiry handling
const VALID_PROMO_CODES = ["WELCOME20"];

const PLANS = {
  monthly: {
    name: "Apex Interviewer - Monthly Access",
    description: "1 month access to all coding interview questions and AI mock interviews",
    unit_amount: 7500, // $75.00 in cents
    promo_amount: 5500, // $55.00 in cents (20% off)
    product_key: "apex_interviewer_monthly",
  },
  annual: {
    name: "Apex Interviewer - Annual Access",
    description: "1 year access to all coding interview questions and AI mock interviews",
    unit_amount: 50000, // $500.00 in cents
    promo_amount: 40000, // $400.00 in cents (20% off)
    product_key: "apex_interviewer_annual",
  },
} as const;

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[Stripe] STRIPE_SECRET_KEY not configured");
    return NextResponse.json(
      { error: "Payment system not configured" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email;
    const promoCode = body.promo?.toUpperCase();
    const planType = body.plan === "monthly" ? "monthly" : "annual";
    const plan = PLANS[planType];
    
    // Check if promo code is valid
    const hasValidPromo = promoCode && VALID_PROMO_CODES.includes(promoCode);
    const finalAmount = hasValidPromo ? plan.promo_amount : plan.unit_amount;

    const productName = hasValidPromo 
      ? `${plan.name} (20% Off)` 
      : plan.name;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: plan.description,
              images: [`${SITE_URL}/ai-owl-mascot.png`],
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/?canceled=true`,
      customer_email: email || undefined,
      metadata: {
        product: plan.product_key,
        plan_type: planType,
        promo_code: hasValidPromo ? promoCode : null,
        discount_applied: hasValidPromo ? "20%" : null,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("[Stripe] Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
