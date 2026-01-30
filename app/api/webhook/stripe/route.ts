import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getSubscriptionConfirmationEmail } from "@/lib/emailTemplates";

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

        // Send beautiful confirmation email via Resend
        const resend = getResend();
        if (resend) {
          const planType = session.metadata?.plan_type || "annual";
          const amountPaid = session.amount_total 
            ? `$${(session.amount_total / 100).toFixed(0)}` 
            : planType === "monthly" ? "$75" : "$500";
          const planName = planType === "monthly" 
            ? "Monthly Access" 
            : "Annual Access";
          const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apexinterviewer.com";

          const emailContent = getSubscriptionConfirmationEmail({
            planName,
            amount: amountPaid,
            dashboardUrl: `${siteUrl}/dashboard`,
          });

          try {
            await resend.emails.send({
              from: FROM_EMAIL,
              to: customerEmail,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
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

  return NextResponse.json({ received: true });
}
