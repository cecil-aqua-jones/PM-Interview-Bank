import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  getNurtureDay3Email,
  getNurtureDay5Email,
  getNurtureDay7Email,
  getNurtureDay14Email,
} from "@/lib/emailTemplates";

// Initialize clients
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Apex Interviewer <hello@apexinterviewer.com>";
const NURTURE_DAYS = [3, 5, 7, 14] as const;

type NurtureDay = typeof NURTURE_DAYS[number];

// Get the email template for a specific day
function getEmailForDay(day: NurtureDay, checkoutUrl: string) {
  switch (day) {
    case 3:
      return getNurtureDay3Email({ checkoutUrl });
    case 5:
      return getNurtureDay5Email({ checkoutUrl });
    case 7:
      return getNurtureDay7Email({ checkoutUrl });
    case 14:
      return getNurtureDay14Email({ checkoutUrl });
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this automatically, or manual calls need it)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow Vercel cron (no auth) or manual calls with secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Check if this is a Vercel cron request (they don't send auth header)
    const isVercelCron = req.headers.get("x-vercel-cron") === "true";
    if (!isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabaseAdmin = getSupabaseAdmin();
  const resend = getResend();

  if (!supabaseAdmin) {
    console.error("[Nurture Cron] Supabase not configured");
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  if (!resend) {
    console.error("[Nurture Cron] Resend not configured");
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apexinterviewer.com";
  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get all users from Supabase Auth
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error("[Nurture Cron] Error fetching users:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const users = usersData?.users || [];
    const now = new Date();

    for (const user of users) {
      // Skip users who have already paid
      if (user.user_metadata?.has_paid) {
        continue;
      }

      // Calculate days since signup
      const createdAt = new Date(user.created_at);
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Check if today matches any nurture day
      if (!NURTURE_DAYS.includes(daysSinceSignup as NurtureDay)) {
        continue;
      }

      results.processed++;
      const emailType = `day${daysSinceSignup}`;

      // Check if we already sent this email
      const { data: existingSend } = await supabaseAdmin
        .from("sent_nurture_emails")
        .select("id")
        .eq("user_email", user.email)
        .eq("email_type", emailType)
        .single();

      if (existingSend) {
        console.log(`[Nurture Cron] Already sent ${emailType} to ${user.email}`);
        results.skipped++;
        continue;
      }

      // Get the appropriate email template
      const emailContent = getEmailForDay(daysSinceSignup as NurtureDay, `${siteUrl}/dashboard`);

      try {
        // Send the email
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email!,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          tags: [
            { name: "type", value: "nurture" },
            { name: "day", value: daysSinceSignup.toString() },
          ],
        });

        // Record that we sent this email
        await supabaseAdmin.from("sent_nurture_emails").insert({
          user_email: user.email,
          email_type: emailType,
        });

        console.log(`[Nurture Cron] Sent ${emailType} email to ${user.email}`);
        results.sent++;
      } catch (emailError) {
        console.error(`[Nurture Cron] Failed to send ${emailType} to ${user.email}:`, emailError);
        results.errors++;
      }
    }

    console.log("[Nurture Cron] Complete:", results);
    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("[Nurture Cron] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
