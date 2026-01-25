# PRD: Apex Interviewer Landing Page

## Overview
Build a premium, tech-focused landing page that sells a curated coding interview
question bank for software engineering roles at FAANG and top tech companies. 
The page should feel editorial and timeless, with understated luxury and high trust.

## Goals
- Increase purchase conversions for the question bank.
- Establish authority and credibility through social proof.
- Communicate product value quickly with high-end design.

## Non-Goals
- No account system or subscription management in V1.
- No custom personalization or A/B testing framework in V1.
- No marketplace or community features.

## Target Users
- Mid-level software engineers transitioning to senior roles.
- Senior engineers applying to FAANG and top-tier tech companies.
- Engineering managers running internal interview prep sessions.

## Core Value Proposition
A coding interview question bank calibrated to the hiring bar of FAANG and top
tech companies, with AI-powered mock interviews that provide real-time feedback
on code quality, complexity analysis, and problem-solving approach.

## Pricing
- Annual access: $300/year
- Launch discount: $150/year (50% off)
- 30-day money-back guarantee

## Success Metrics
- Conversion rate (visit → purchase).
- CTA click-through rate.
- Time on page (proxy for content engagement).
- Scroll depth (completion rate).
- Refund rate within 30 days.

## User Stories
- As a senior engineer, I want to practice with real interview questions so I can
  prepare for FAANG interviews.
- As a mid-level engineer, I want AI feedback on my code to identify weaknesses.
- As an engineering manager, I want a credible question set for internal mocks.

## Functional Requirements
- Single-page, responsive marketing layout.
- Clearly defined sections: Hero, Trust/Calibration, Features, Samples,
  Social Proof, Pricing, FAQ, Final CTA.
- Primary CTA anchored to pricing section.
- Secondary CTA to features section.
- Footer with legal links placeholders.
- Copy structured for scannability with short paragraphs and lists.

## Content Requirements
- Executive headline that references "FAANG" and "coding interview".
- Product overview with clear promise and outcomes.
- Credibility block with counts (questions, companies, topics) and references
  to top-tier companies with logos.
- Testimonials with role and short outcome.
- Sample questions showcasing algorithms, data structures, and system design.
- Pricing display with annual subscription and discount.
- FAQ for common objections (level fit, languages, updates, AI features).

## Social Proof Strategy
- Testimonials from engineers with offers (company, level, short quote).
- Company logo marquee showing question sources.
- Quantitative proof:
  - Total number of questions.
  - Number of companies.
  - Number of topic categories.
- AI mock interview feature highlight.

## Design System Guidance
- Typography: Playfair Display (headings), Inter (body).
- Palette: warm cream background, near-black text, single accent color (#f37021).
- Layout: generous whitespace, 2-column hero, grid-based sections.
- Components: subtle borders, minimal shadow, 2–6px radius buttons.
- Motion: slow ease-out transitions (0.4s–0.6s), no bounce.

## Information Architecture
1. Hero (value proposition + CTA + product snapshot)
2. Company logos / trust section
3. AI Mock Interview feature
4. Sample questions
5. Social proof and stats
6. How it works
7. Why us / comparison
8. Pricing
9. FAQ
10. Final CTA
11. Footer

## Technical Requirements
- Next.js with React.
- Mobile-first responsiveness.
- Performance budget: optimized for Core Web Vitals.
- Fonts loaded from Google Fonts.
- Stripe integration for payments.
- Supabase for authentication.

## Analytics (V1)
- Track CTA clicks (top and pricing CTA).
- Track scroll depth (25/50/75/100).
- Track pricing section views.
- Track checkout conversion.

## Legal & Compliance
- Do not imply official partnership with listed companies.
- Use logos under fair use for editorial reference.
- Provide clear refund policy.

## QA Checklist
- Responsive behavior at 320px, 768px, 1024px, 1440px.
- CTA buttons scroll to correct anchors.
- Contrast ratio for text vs background meets accessibility guidelines.
- All links have hover states.
- No layout shifts from font loading.
- Stripe checkout flow works end-to-end.

## Launch Plan
- Internal review of copy and design.
- Accessibility check.
- Performance check (Lighthouse).
- Deploy to Vercel.

## Future Enhancements
- A/B test hero headline and pricing.
- Video preview of AI mock interview.
- Progress tracking dashboard.
- Community features.
