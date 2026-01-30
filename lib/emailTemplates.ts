// Email templates for authentication and lead nurture

export const PROMO_CODE = "WELCOME20";

// ═══════════════════════════════════════════════════════════════════════════
// MAGIC LINK EMAIL TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

type MagicLinkEmailProps = {
  magicLink: string;
  expiresIn?: string;
};

export function getMagicLinkEmail({ magicLink, expiresIn = "15 minutes" }: MagicLinkEmailProps) {
  return {
    subject: "Sign in to Apex Interviewer",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Apex Interviewer</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06);">
          
          <!-- Logo/Brand Header -->
          <tr>
            <td style="padding: 48px 48px 32px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 48px; height: 48px; background: linear-gradient(135deg, #1a1918 0%, #2d2b2a 100%); border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 700; line-height: 48px;">A</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="padding: 0 48px 16px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 400; color: #1a1a1a; letter-spacing: -0.5px;">
                Sign in to your account
              </h1>
            </td>
          </tr>
          
          <!-- Subtitle -->
          <tr>
            <td style="padding: 0 48px 40px; text-align: center;">
              <p style="margin: 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                Click the button below to securely sign in.<br>
                This link expires in ${expiresIn}.
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 48px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #1a1918; border-radius: 4px;">
                    <a href="${magicLink}" style="display: inline-block; padding: 18px 48px; font-size: 13px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #ffffff; text-decoration: none;">
                      Sign In to Apex
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-top: 1px solid #f0f0f0;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Alternative Link -->
          <tr>
            <td style="padding: 32px 48px; text-align: center;">
              <p style="margin: 0 0 12px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">
                Or copy this link
              </p>
              <p style="margin: 0; font-size: 13px; color: #6b7280; word-break: break-all; background-color: #faf9f7; padding: 12px 16px; border-radius: 4px; border: 1px solid #f0f0f0;">
                ${magicLink}
              </p>
            </td>
          </tr>
          
          <!-- Security Note -->
          <tr>
            <td style="padding: 0 48px 48px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf9f7; padding: 32px 48px; border-top: 1px solid #f0f0f0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #1a1a1a; font-weight: 500;">
                      Apex Interviewer
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      AI-powered interview preparation for ambitious engineers
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom Text -->
        <table role="presentation" width="480" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.6;">
                This is an automated message from Apex Interviewer.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `Sign in to Apex Interviewer

Click the link below to securely sign in to your account.
This link expires in ${expiresIn}.

${magicLink}

If you didn't request this email, you can safely ignore it.

—
Apex Interviewer
AI-powered interview preparation for ambitious engineers`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION CONFIRMATION EMAIL TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

type SubscriptionEmailProps = {
  planName: string;
  amount: string;
  dashboardUrl: string;
};

export function getSubscriptionConfirmationEmail({ planName, amount, dashboardUrl }: SubscriptionEmailProps) {
  return {
    subject: "Welcome to Apex Interviewer — Your training begins now",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Apex Interviewer</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06);">
          
          <!-- Success Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1918 0%, #2d2b2a 100%); padding: 48px 48px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
                <tr>
                  <td style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="color: #22c55e; font-size: 32px; line-height: 64px;">✓</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 400; color: #ffffff; letter-spacing: -0.5px;">
                Welcome to Apex Interviewer
              </h1>
              <p style="margin: 16px 0 0; font-size: 15px; color: rgba(255,255,255,0.7);">
                Your journey to interview mastery starts now
              </p>
            </td>
          </tr>
          
          <!-- Order Summary -->
          <tr>
            <td style="padding: 40px 48px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf9f7; border-radius: 8px; border: 1px solid #f0f0f0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 4px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">
                      Your Plan
                    </p>
                    <p style="margin: 0 0 16px; font-size: 18px; color: #1a1a1a; font-weight: 600;">
                      ${planName}
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                      <tr>
                        <td style="padding-top: 16px;">
                          <p style="margin: 0; font-size: 13px; color: #6b7280;">Amount paid</p>
                        </td>
                        <td style="padding-top: 16px; text-align: right;">
                          <p style="margin: 0; font-size: 15px; color: #1a1a1a; font-weight: 600;">${amount}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- What's Included -->
          <tr>
            <td style="padding: 0 48px 32px;">
              <p style="margin: 0 0 20px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">
                What you now have access to
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 24px; vertical-align: top;">
                          <span style="color: #22c55e; font-size: 14px;">✓</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">Unlimited AI Mock Interviews</p>
                          <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Practice coding, system design, and behavioral interviews 24/7</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 24px; vertical-align: top;">
                          <span style="color: #22c55e; font-size: 14px;">✓</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">13 Company Simulations</p>
                          <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Google, Meta, Amazon, OpenAI, Anthropic, and more</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 24px; vertical-align: top;">
                          <span style="color: #22c55e; font-size: 14px;">✓</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">Real-Time AI Feedback</p>
                          <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Get detailed feedback on every answer, grounded in your transcript</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 24px; vertical-align: top;">
                          <span style="color: #22c55e; font-size: 14px;">✓</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">Performance Analytics</p>
                          <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Track your improvement across 50+ patterns and skills</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 8px 48px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #1a1918; border-radius: 4px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 18px 48px; font-size: 13px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #ffffff; text-decoration: none;">
                      Start Your First Interview
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Quick Tips -->
          <tr>
            <td style="padding: 0 48px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fef3c7;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px; font-size: 14px; color: #92400e; font-weight: 600;">
                      💡 Pro tip to maximize your results
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.6;">
                      Engineers who do 20+ mock interviews before their real interview are <strong>3x more likely</strong> to receive an offer. Start with a coding interview today to establish your baseline.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf9f7; padding: 32px 48px; border-top: 1px solid #f0f0f0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #1a1a1a; font-weight: 500;">
                      Apex Interviewer
                    </p>
                    <p style="margin: 0 0 16px; font-size: 12px; color: #9ca3af;">
                      Built for ambitious engineers
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                      Questions? Reply to this email or contact support@apexinterviewer.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Receipt Note -->
        <table role="presentation" width="520" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 24px 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.6;">
                A receipt has been sent to your email. You can also view your billing history in your account settings.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `Welcome to Apex Interviewer!

Your journey to interview mastery starts now.

YOUR PLAN: ${planName}
Amount paid: ${amount}

WHAT YOU NOW HAVE ACCESS TO:

✓ Unlimited AI Mock Interviews
  Practice coding, system design, and behavioral interviews 24/7

✓ 13 Company Simulations
  Google, Meta, Amazon, OpenAI, Anthropic, and more

✓ Real-Time AI Feedback
  Get detailed feedback on every answer, grounded in your transcript

✓ Performance Analytics
  Track your improvement across 50+ patterns and skills

Start your first interview: ${dashboardUrl}

---

PRO TIP: Engineers who do 20+ mock interviews before their real interview are 3x more likely to receive an offer. Start with a coding interview today to establish your baseline.

—
Apex Interviewer
Built for ambitious engineers

Questions? Contact support@apexinterviewer.com`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LEAD NURTURE EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════
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

type EmailTemplateProps = {
  firstName?: string;
  promoCode: string;
  expiryDate: string;
  checkoutUrl: string;
};

export function getWelcomeEmail({ firstName, promoCode, expiryDate, checkoutUrl }: EmailTemplateProps) {
  const name = firstName || "there";
  
  return {
    subject: `${firstName ? `${firstName}, your` : "Your"} exclusive 20% off expires ${expiryDate}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Exclusive Offer</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f7f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1918; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                Apex Interviewer
              </h1>
            </td>
          </tr>
          
          <!-- Hero Section -->
          <tr>
            <td style="padding: 48px 40px 32px;">
              <p style="margin: 0 0 8px; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Exclusive Offer
              </p>
              <h2 style="margin: 0 0 24px; color: #1a1918; font-size: 32px; font-weight: 700; line-height: 1.2;">
                Save 20% on Your Interview Prep
              </h2>
              <p style="margin: 0 0 24px; color: #444; font-size: 17px; line-height: 1.6;">
                Hey ${name},
              </p>
              <p style="margin: 0 0 24px; color: #444; font-size: 17px; line-height: 1.6;">
                You were just checking out Apex Interviewer—the AI-powered interview training that's helped engineers land roles at Google, Meta, Amazon, OpenAI, and more.
              </p>
              <p style="margin: 0 0 24px; color: #444; font-size: 17px; line-height: 1.6;">
                Before you go, I wanted to offer you something special: <strong>20% off any plan</strong>.
              </p>
            </td>
          </tr>
          
          <!-- Pricing Cards -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="48%" style="background: linear-gradient(135deg, #1a1918 0%, #2d2b2a 100%); border-radius: 12px; padding: 28px; vertical-align: top;">
                    <p style="margin: 0 0 4px; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Annual</p>
                    <p style="margin: 0 0 4px; color: #666; font-size: 14px; text-decoration: line-through;">$500/year</p>
                    <p style="margin: 0 0 12px; color: #ffffff; font-size: 36px; font-weight: 700;">$400<span style="font-size: 16px; font-weight: 400; color: #999;">/year</span></p>
                    <p style="margin: 0 0 20px; color: #22c55e; font-size: 14px; font-weight: 600;">Save $100</p>
                    <a href="${checkoutUrl}?plan=annual&promo=${promoCode}" style="display: block; background-color: #ffffff; color: #1a1918; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-weight: 600; font-size: 15px; text-align: center;">
                      Get Annual Access →
                    </a>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: #f8f7f6; border: 1px solid #e5e3e1; border-radius: 12px; padding: 28px; vertical-align: top;">
                    <p style="margin: 0 0 4px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Monthly</p>
                    <p style="margin: 0 0 4px; color: #999; font-size: 14px; text-decoration: line-through;">$75/month</p>
                    <p style="margin: 0 0 12px; color: #1a1918; font-size: 36px; font-weight: 700;">$55<span style="font-size: 16px; font-weight: 400; color: #666;">/month</span></p>
                    <p style="margin: 0 0 20px; color: #22c55e; font-size: 14px; font-weight: 600;">Save $20/mo</p>
                    <a href="${checkoutUrl}?plan=monthly&promo=${promoCode}" style="display: block; background-color: #1a1918; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-weight: 600; font-size: 15px; text-align: center;">
                      Start Monthly →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Urgency -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 600; text-align: center;">
                      ⏰ This offer expires <strong>${expiryDate}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Social Proof -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 20px; color: #1a1918; font-size: 18px; font-weight: 600;">
                What engineers are saying:
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="background-color: #f8f7f6; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 12px; color: #444; font-size: 15px; line-height: 1.5; font-style: italic;">
                      "After failing my first two Google interviews, I did 30 mock interviews here. The AI caught every unclear explanation. Passed my third attempt."
                    </p>
                    <p style="margin: 0; color: #666; font-size: 13px; font-weight: 600;">
                      — David C., now at Google ($145k → $280k)
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #f8f7f6; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 12px; color: #444; font-size: 15px; line-height: 1.5; font-style: italic;">
                      "Better feedback than my $200/hr interview coach. The AI caught mistakes I didn't even know I was making."
                    </p>
                    <p style="margin: 0; color: #666; font-size: 13px; font-weight: 600;">
                      — Aisha P., now at Meta ($165k → $310k)
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- What You Get -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 16px; color: #1a1918; font-size: 18px; font-weight: 600;">
                What's included:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 8px 0; color: #444; font-size: 15px;">✓ Unlimited AI mock interviews</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #444; font-size: 15px;">✓ Company-specific simulations (Google, Meta, Amazon, OpenAI...)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #444; font-size: 15px;">✓ Coding, system design, and behavioral prep</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #444; font-size: 15px;">✓ Real-time AI feedback on your answers</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #444; font-size: 15px;">✓ Performance analytics & progress tracking</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #444; font-size: 15px;">✓ 2-day money-back guarantee</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Final CTA -->
          <tr>
            <td style="padding: 0 40px 48px; text-align: center;">
              <a href="${checkoutUrl}?plan=annual&promo=${promoCode}" style="display: inline-block; background-color: #1a1918; color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 6px; font-weight: 600; font-size: 17px;">
                Claim Your 20% Discount →
              </a>
              <p style="margin: 16px 0 0; color: #666; font-size: 13px;">
                Use code <strong>${promoCode}</strong> at checkout
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f7f6; padding: 32px 40px; border-top: 1px solid #e5e3e1;">
              <p style="margin: 0 0 8px; color: #666; font-size: 13px; text-align: center;">
                Apex Interviewer • Built for ambitious engineers
              </p>
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                You're receiving this because you signed up for updates. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #999;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `
Hey ${name},

You were just checking out Apex Interviewer—the AI-powered interview training that's helped engineers land roles at Google, Meta, Amazon, OpenAI, and more.

Before you go, I wanted to offer you something special: 20% off any plan.

YOUR EXCLUSIVE PRICING:

Annual Plan: $400/year (was $500) — Save $100
Monthly Plan: $55/month (was $75) — Save $20/mo

Claim your discount: ${checkoutUrl}?plan=annual&promo=${promoCode}

⏰ This offer expires ${expiryDate}

---

WHAT ENGINEERS ARE SAYING:

"After failing my first two Google interviews, I did 30 mock interviews here. The AI caught every unclear explanation. Passed my third attempt."
— David C., now at Google ($145k → $280k)

"Better feedback than my $200/hr interview coach. The AI caught mistakes I didn't even know I was making."
— Aisha P., now at Meta ($165k → $310k)

---

WHAT'S INCLUDED:

✓ Unlimited AI mock interviews
✓ Company-specific simulations (Google, Meta, Amazon, OpenAI...)
✓ Coding, system design, and behavioral prep
✓ Real-time AI feedback on your answers
✓ Performance analytics & progress tracking
✓ 2-day money-back guarantee

Use code ${promoCode} at checkout.

Claim Your 20% Discount: ${checkoutUrl}?plan=annual&promo=${promoCode}

—
Apex Interviewer
Built for ambitious engineers
    `.trim(),
  };
}

// Follow-up email for day 3 (5 days left)
export function getFollowUp3Days({ firstName, promoCode, expiryDate, checkoutUrl }: EmailTemplateProps) {
  const name = firstName || "there";
  
  return {
    subject: `⏰ 5 days left: Your 20% discount expires soon`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f7f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <tr>
            <td style="background-color: #1a1918; padding: 24px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">Apex Interviewer</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #444; font-size: 17px; line-height: 1.6;">
                Hey ${name},
              </p>
              <p style="margin: 0 0 20px; color: #444; font-size: 17px; line-height: 1.6;">
                Quick reminder: your exclusive 20% discount expires in <strong>5 days</strong>.
              </p>
              <p style="margin: 0 0 20px; color: #444; font-size: 17px; line-height: 1.6;">
                Every day you wait is another day you could be practicing with AI that catches the mistakes real interviewers will catch—before they cost you the job.
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 600;">
                      Your price: <span style="text-decoration: line-through;">$500</span> → <strong>$400/year</strong>
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="text-align: center; margin: 32px 0;">
                <a href="${checkoutUrl}?plan=annual&promo=${promoCode}" style="display: inline-block; background-color: #1a1918; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Lock In Your Discount →
                </a>
              </p>
              
              <p style="margin: 24px 0 0; color: #666; font-size: 14px; text-align: center;">
                Code <strong>${promoCode}</strong> • Expires ${expiryDate}
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f7f6; padding: 24px 40px; border-top: 1px solid #e5e3e1;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #999;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `Hey ${name},

Quick reminder: your exclusive 20% discount expires in 5 days.

Every day you wait is another day you could be practicing with AI that catches the mistakes real interviewers will catch—before they cost you the job.

Your price: $500 → $400/year

Lock in your discount: ${checkoutUrl}?plan=annual&promo=${promoCode}

Code ${promoCode} • Expires ${expiryDate}

—
Apex Interviewer`,
  };
}

// Follow-up email for day 5 (3 days left)
export function getFollowUp5Days({ firstName, promoCode, expiryDate, checkoutUrl }: EmailTemplateProps) {
  const name = firstName || "there";
  
  return {
    subject: `🔥 3 days left — Engineers who waited regret it`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f7f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <tr>
            <td style="background-color: #1a1918; padding: 24px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">Apex Interviewer</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #444; font-size: 17px; line-height: 1.6;">
                Hey ${name},
              </p>
              <p style="margin: 0 0 20px; color: #444; font-size: 17px; line-height: 1.6;">
                <strong>3 days left</strong> on your 20% discount.
              </p>
              <p style="margin: 0 0 20px; color: #444; font-size: 17px; line-height: 1.6;">
                I've seen engineers put off interview prep until the week before their interview—then panic when they realize they're not ready.
              </p>
              <p style="margin: 0 0 20px; color: #444; font-size: 17px; line-height: 1.6;">
                The ones who start early? They walk in confident because they've done 20, 30, 50 mock interviews. They've heard every follow-up question. They've fixed every weak spot.
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #dc2626; font-size: 24px; font-weight: 700;">
                      3 DAYS LEFT
                    </p>
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      Your $400/year price expires ${expiryDate}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="text-align: center; margin: 32px 0;">
                <a href="${checkoutUrl}?plan=annual&promo=${promoCode}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Start Training Now →
                </a>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f7f6; padding: 24px 40px; border-top: 1px solid #e5e3e1;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #999;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `Hey ${name},

3 days left on your 20% discount.

I've seen engineers put off interview prep until the week before their interview—then panic when they realize they're not ready.

The ones who start early? They walk in confident because they've done 20, 30, 50 mock interviews. They've heard every follow-up question. They've fixed every weak spot.

⚠️ 3 DAYS LEFT
Your $400/year price expires ${expiryDate}

Start training now: ${checkoutUrl}?plan=annual&promo=${promoCode}

—
Apex Interviewer`,
  };
}

// Final email for day 7 (expires tonight)
export function getFinalEmail({ firstName, promoCode, checkoutUrl }: Omit<EmailTemplateProps, 'expiryDate'>) {
  const name = firstName || "there";
  
  return {
    subject: `🚨 FINAL HOURS: Your discount expires at midnight`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f7f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <tr>
            <td style="background-color: #dc2626; padding: 24px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">⏰ FINAL HOURS</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #444; font-size: 17px; line-height: 1.6;">
                ${name},
              </p>
              <p style="margin: 0 0 20px; color: #444; font-size: 17px; line-height: 1.6;">
                This is it. Your 20% discount expires <strong>tonight at midnight</strong>.
              </p>
              <p style="margin: 0 0 20px; color: #444; font-size: 17px; line-height: 1.6;">
                After tonight, you'll pay full price: $500 instead of $400.
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #ffffff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Your final price
                    </p>
                    <p style="margin: 0 0 8px; color: #fecaca; font-size: 18px; text-decoration: line-through;">
                      $500/year
                    </p>
                    <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: 700;">
                      $400
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="text-align: center; margin: 32px 0;">
                <a href="${checkoutUrl}?plan=annual&promo=${promoCode}" style="display: inline-block; background-color: #1a1918; color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 6px; font-weight: 600; font-size: 17px;">
                  Claim Before Midnight →
                </a>
              </p>
              
              <p style="margin: 24px 0 0; color: #666; font-size: 15px; text-align: center;">
                Don't let $100 slip away.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f7f6; padding: 24px 40px; border-top: 1px solid #e5e3e1;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #999;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `${name},

This is it. Your 20% discount expires TONIGHT AT MIDNIGHT.

After tonight, you'll pay full price: $500 instead of $400.

YOUR FINAL PRICE: $400 (was $500)

Claim before midnight: ${checkoutUrl}?plan=annual&promo=${promoCode}

Don't let $100 slip away.

—
Apex Interviewer`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NON-CONVERTER RE-ENGAGEMENT EMAIL TEMPLATES
// For users who signed up but haven't purchased after X days
// ═══════════════════════════════════════════════════════════════════════════

type NurtureEmailProps = {
  checkoutUrl: string;
};

// Day 3: Soft check-in with social proof
export function getNurtureDay3Email({ checkoutUrl }: NurtureEmailProps) {
  return {
    subject: "Quick question about your interview prep",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06);">
          
          <tr>
            <td style="padding: 48px 48px 32px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 48px; height: 48px; background: linear-gradient(135deg, #1a1918 0%, #2d2b2a 100%); border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 700; line-height: 48px;">A</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 32px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                Hey there,
              </p>
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                I noticed you signed up for Apex Interviewer but haven't started training yet.
              </p>
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                Quick question: <strong>Are you actively preparing for tech interviews right now?</strong>
              </p>
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                If so, I wanted to share something that might help. Last month, engineers using our AI mock interviews saw results like these:
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf9f7; border-radius: 8px; border: 1px solid #f0f0f0;">
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #1a1a1a; font-style: italic;">
                      "Passed Google on my third attempt after 30 mock interviews here."
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                      — Sarah K., $145k → $280k (+93%)
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #1a1a1a; font-style: italic;">
                      "Better feedback than my $200/hr interview coach."
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">
                      — Marcus T., now at Meta
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 32px;">
              <p style="margin: 0 0 24px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                To help you get started, I'm offering you <strong>20% off</strong> any plan:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #1a1918; border-radius: 4px; text-align: center;">
                    <a href="${checkoutUrl}?plan=annual&promo=WELCOME20" style="display: block; padding: 18px 24px; font-size: 14px; font-weight: 500; letter-spacing: 0.05em; color: #ffffff; text-decoration: none;">
                      $400/year (was $500) — Get Started →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280; text-align: center;">
                or $55/month (was $75) • Use code <strong>WELCOME20</strong>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #faf9f7; padding: 32px 48px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #1a1a1a; font-weight: 500;">
                Apex Interviewer
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #9ca3af;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `Hey there,

I noticed you signed up for Apex Interviewer but haven't started training yet.

Quick question: Are you actively preparing for tech interviews right now?

If so, I wanted to share something that might help. Last month, engineers using our AI mock interviews saw results like these:

"Passed Google on my third attempt after 30 mock interviews here."
— Sarah K., $145k → $280k (+93%)

"Better feedback than my $200/hr interview coach."
— Marcus T., now at Meta

To help you get started, I'm offering you 20% off any plan:

$400/year (was $500) or $55/month (was $75)
Use code WELCOME20

Get started: ${checkoutUrl}?plan=annual&promo=WELCOME20

—
Apex Interviewer`,
  };
}

// Day 5: Urgency + missed opportunities
export function getNurtureDay5Email({ checkoutUrl }: NurtureEmailProps) {
  return {
    subject: "Engineers who waited often regret it",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06);">
          
          <tr>
            <td style="padding: 48px 48px 32px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 48px; height: 48px; background: linear-gradient(135deg, #1a1918 0%, #2d2b2a 100%); border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 700; line-height: 48px;">A</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 32px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                I've talked to hundreds of engineers after their interviews.
              </p>
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                The ones who didn't get the offer almost always say the same thing:
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-left: 3px solid #dc2626; padding-left: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 18px; color: #1a1a1a; font-style: italic; line-height: 1.6;">
                      "I knew the algorithm, but I froze when they asked follow-up questions I hadn't practiced."
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 32px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                LeetCode teaches you to solve problems. But real interviews test something else: <strong>can you think out loud, handle pressure, and adapt when the interviewer throws you a curveball?</strong>
              </p>
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                That's what our AI is trained to simulate. It asks follow-up questions. It probes your reasoning. It catches the same mistakes a Google or Meta interviewer would catch.
              </p>
              <p style="margin: 0; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                The engineers who start practicing early? They walk into their interviews <strong>confident</strong>.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px 24px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 13px; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;">
                      Your 20% discount
                    </p>
                    <p style="margin: 0; font-size: 24px; color: #78350f; font-weight: 700;">
                      $400/year <span style="font-size: 16px; font-weight: 400; text-decoration: line-through; color: #92400e;">$500</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 32px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #1a1918; border-radius: 4px;">
                    <a href="${checkoutUrl}?plan=annual&promo=WELCOME20" style="display: inline-block; padding: 18px 48px; font-size: 13px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #ffffff; text-decoration: none;">
                      Start Training Today
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">
                Code <strong>WELCOME20</strong> • Also works for monthly ($55/mo)
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #faf9f7; padding: 32px 48px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #1a1a1a; font-weight: 500;">
                Apex Interviewer
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #9ca3af;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `I've talked to hundreds of engineers after their interviews.

The ones who didn't get the offer almost always say the same thing:

"I knew the algorithm, but I froze when they asked follow-up questions I hadn't practiced."

LeetCode teaches you to solve problems. But real interviews test something else: can you think out loud, handle pressure, and adapt when the interviewer throws you a curveball?

That's what our AI is trained to simulate. It asks follow-up questions. It probes your reasoning. It catches the same mistakes a Google or Meta interviewer would catch.

The engineers who start practicing early? They walk into their interviews confident.

YOUR 20% DISCOUNT: $400/year (was $500)

Start training: ${checkoutUrl}?plan=annual&promo=WELCOME20

Code WELCOME20 • Also works for monthly ($55/mo)

—
Apex Interviewer`,
  };
}

// Day 7: Discount focus
export function getNurtureDay7Email({ checkoutUrl }: NurtureEmailProps) {
  return {
    subject: "Your exclusive 20% off expires soon",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #1a1918 0%, #2d2b2a 100%); padding: 40px 48px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.1em;">
                Exclusive Offer
              </p>
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 32px; font-weight: 400; color: #ffffff;">
                20% Off Ends Soon
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 48px 24px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                Hey there,
              </p>
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                I wanted to give you a heads up: the 20% discount I offered you is expiring soon.
              </p>
              <p style="margin: 0; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                After that, you'll pay full price.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="48%" style="background-color: #faf9f7; border-radius: 8px; padding: 24px; text-align: center; border: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase;">Annual</p>
                    <p style="margin: 0 0 4px; font-size: 14px; color: #9ca3af; text-decoration: line-through;">$500</p>
                    <p style="margin: 0; font-size: 28px; color: #1a1a1a; font-weight: 700;">$400</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: #faf9f7; border-radius: 8px; padding: 24px; text-align: center; border: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase;">Monthly</p>
                    <p style="margin: 0 0 4px; font-size: 14px; color: #9ca3af; text-decoration: line-through;">$75</p>
                    <p style="margin: 0; font-size: 28px; color: #1a1a1a; font-weight: 700;">$55</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 32px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #1a1a1a; font-weight: 600;">
                What you get:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr><td style="padding: 6px 0; font-size: 14px; color: #444;">✓ Unlimited AI mock interviews</td></tr>
                <tr><td style="padding: 6px 0; font-size: 14px; color: #444;">✓ 13 company simulations (Google, Meta, Amazon, OpenAI...)</td></tr>
                <tr><td style="padding: 6px 0; font-size: 14px; color: #444;">✓ Coding, system design, and behavioral prep</td></tr>
                <tr><td style="padding: 6px 0; font-size: 14px; color: #444;">✓ Real-time AI feedback with follow-up questions</td></tr>
                <tr><td style="padding: 6px 0; font-size: 14px; color: #444;">✓ 2-day money-back guarantee</td></tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #1a1918; border-radius: 4px;">
                    <a href="${checkoutUrl}?plan=annual&promo=WELCOME20" style="display: inline-block; padding: 18px 48px; font-size: 13px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #ffffff; text-decoration: none;">
                      Claim 20% Off Now
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">
                Use code <strong>WELCOME20</strong> at checkout
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #faf9f7; padding: 32px 48px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #1a1a1a; font-weight: 500;">
                Apex Interviewer
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #9ca3af;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `Hey there,

I wanted to give you a heads up: the 20% discount I offered you is expiring soon.

After that, you'll pay full price.

YOUR PRICING:
Annual: $400 (was $500)
Monthly: $55 (was $75)

WHAT YOU GET:
✓ Unlimited AI mock interviews
✓ 13 company simulations (Google, Meta, Amazon, OpenAI...)
✓ Coding, system design, and behavioral prep
✓ Real-time AI feedback with follow-up questions
✓ 2-day money-back guarantee

Claim 20% off: ${checkoutUrl}?plan=annual&promo=WELCOME20

Use code WELCOME20 at checkout

—
Apex Interviewer`,
  };
}

// Day 14: Final urgency - last chance
export function getNurtureDay14Email({ checkoutUrl }: NurtureEmailProps) {
  return {
    subject: "Final notice: We're removing your discount",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06);">
          
          <tr>
            <td style="background-color: #dc2626; padding: 32px 48px; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff; letter-spacing: 0.05em;">
                FINAL NOTICE
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 48px 24px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                This is my last email about this.
              </p>
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                Your 20% discount code (<strong>WELCOME20</strong>) is being removed from your account tonight.
              </p>
              <p style="margin: 0; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                After this, you'll pay full price if you decide to start later.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 8px;">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <p style="margin: 0 0 8px; color: rgba(255,255,255,0.8); font-size: 14px;">
                      Your final price
                    </p>
                    <p style="margin: 0 0 8px; color: rgba(255,255,255,0.6); font-size: 16px; text-decoration: line-through;">
                      $500/year
                    </p>
                    <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: 700;">
                      $400
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 24px;">
              <p style="margin: 0; color: #1a1a1a; font-size: 17px; line-height: 1.7;">
                If you're serious about landing a role at Google, Meta, Amazon, OpenAI, or any top tech company, interview prep is non-negotiable.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 48px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #1a1918; border-radius: 4px;">
                    <a href="${checkoutUrl}?plan=annual&promo=WELCOME20" style="display: inline-block; padding: 18px 48px; font-size: 13px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #ffffff; text-decoration: none;">
                      Use My Discount Before It's Gone
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 14px; color: #6b7280;">
                Or pay $500 later. Your call.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #faf9f7; padding: 32px 48px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #1a1a1a; font-weight: 500;">
                Apex Interviewer
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #9ca3af;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `This is my last email about this.

Your 20% discount code (WELCOME20) is being removed from your account tonight.

After this, you'll pay full price if you decide to start later.

YOUR FINAL PRICE: $400/year (was $500)

If you're serious about landing a role at Google, Meta, Amazon, OpenAI, or any top tech company, interview prep is non-negotiable.

Use your discount before it's gone: ${checkoutUrl}?plan=annual&promo=WELCOME20

Or pay $500 later. Your call.

—
Apex Interviewer`,
  };
}
