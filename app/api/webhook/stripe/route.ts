import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { SubscriptionConfirmationEmail, subscriptionSubject } from "@/emails";
import {
  captureServerEvent,
  identifyServerUser,
  flushPostHog,
} from "@/lib/posthog-server";
import { SITE_URL } from "@/lib/constants";

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getSupabaseAdmin(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Apex Interviewer <hello@apexinterviewer.com>";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  if (!stripe || !supabaseAdmin) {
    return NextResponse.json({ error: "Service not configured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_email;

    if (customerEmail) {
      try {
        // Find user by email and update their payment status
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === customerEmail);

        // Extract payment details for tracking
        const planType = session.metadata?.plan_type || "annual";
        const amountInCents =
          session.amount_total || (planType === "monthly" ? 7500 : 50000);
        const amountInDollars = amountInCents / 100;

        // Use user.id for PostHog to match client-side identity (AuthGuard uses session.user.id)
        // Fall back to email for pending payments (user hasn't signed up yet)
        const posthogDistinctId = user?.id || customerEmail;

        if (user) {
          // Update user metadata to mark as paid
          await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              has_paid: true,
              payment_date: new Date().toISOString(),
              stripe_session_id: session.id,
            },
          });
          console.log("[Webhook] User payment recorded:", customerEmail);
        } else {
          // Store payment for user who hasn't signed up yet
          await supabaseAdmin.from("pending_payments").upsert({
            email: customerEmail,
            stripe_session_id: session.id,
            payment_date: new Date().toISOString(),
          });
          console.log("[Webhook] Pending payment recorded:", customerEmail);
        }

        // Track purchase event in PostHog for revenue analytics
        // Uses user.id when available to match client-side identity
        captureServerEvent(posthogDistinctId, "purchase", {
          plan: planType,
          revenue: amountInDollars,
          currency: "USD",
          stripe_session_id: session.id,
          promo_code: session.metadata?.promo_code || null,
          discount_applied: session.metadata?.discount_applied || null,
          // Include email for reference (useful if distinct_id is user.id)
          customer_email: customerEmail,
        });

        // Update user properties in PostHog
        // Note: Cumulative revenue is tracked via 'purchase' events above,
        // which PostHog aggregates automatically for revenue analytics.
        identifyServerUser(posthogDistinctId, {
          properties: {
            has_paid: true,
            plan_type: planType,
            last_purchase_amount: amountInDollars,
            last_purchase_date: new Date().toISOString(),
          },
          propertiesSetOnce: {
            first_purchase_date: new Date().toISOString(),
            first_plan_type: planType,
          },
        });

        console.log("[Webhook] PostHog purchase tracked:", posthogDistinctId, `$${amountInDollars}`);

        // Send beautiful confirmation email via Resend using React Email
        const resend = getResend();
        if (resend) {
          const amountPaid = `$${amountInDollars.toFixed(0)}`;
          const planName =
            planType === "monthly" ? "Monthly Access" : "Annual Access";
          const dashboardUrl = `${SITE_URL}/dashboard`;

          const emailProps = { planName, amount: amountPaid, dashboardUrl };
          const html = await render(SubscriptionConfirmationEmail(emailProps));
          const text = await render(SubscriptionConfirmationEmail(emailProps), { plainText: true });

          try {
            await resend.emails.send({
              from: FROM_EMAIL,
              to: customerEmail,
              subject: subscriptionSubject,
              html,
              text,
              tags: [
                { name: "type", value: "subscription_confirmation" },
                { name: "plan", value: planType },
              ],
            });
            console.log("[Webhook] Confirmation email sent to:", customerEmail);
          } catch (emailErr) {
            console.error("[Webhook] Failed to send confirmation email:", emailErr);
          }
        }
      } catch (err) {
        console.error("[Webhook] Error updating user:", err);
      }
    }
  }

  // Flush PostHog events before returning (important for serverless)
  await flushPostHog();

  return NextResponse.json({ received: true });
}
