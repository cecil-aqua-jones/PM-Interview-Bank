import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Product Leaks - Annual Access",
              description:
                "1 year access to all PM interview questions and AI mock interviews",
              images: [
                `${process.env.NEXT_PUBLIC_APP_URL || "https://productleaks.co"}/ai-owl-mascot.png`,
              ],
            },
            unit_amount: 25000, // $250.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin")}/?canceled=true`,
      customer_email: email || undefined,
      metadata: {
        product: "product_leaks_annual",
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
