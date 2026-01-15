# PRD: Atlas PM Interview Bank Landing Page

## Overview
Build a premium, tech-focused landing page that sells a curated interview
question bank for mid to senior Product Management roles at America’s top 30
tech companies. The page should feel editorial and timeless, with understated
luxury and high trust.

## Goals
- Increase purchase conversions for the question bank.
- Establish authority and credibility through social proof.
- Communicate product value quickly with high-end design.

## Non-Goals
- No account system or subscription management in V1.
- No custom personalization or A/B testing framework in V1.
- No marketplace or community features.

## Target Users
- Mid-level PMs transitioning to senior roles.
- Senior PMs applying to top-tier tech companies.
- PM managers running internal interview prep sessions.

## Core Value Proposition
An interview question bank calibrated to the hiring bar of America’s top 30
tech companies, with rubrics and follow-up ladders that reveal true senior PM
signal.

## Success Metrics
- Conversion rate (visit → purchase).
- CTA click-through rate.
- Time on page (proxy for content engagement).
- Scroll depth (completion rate).
- Refund rate within 30 days.

## User Stories
- As a senior PM, I want to know the exact evaluation criteria so I can answer
  with the right depth.
- As a mid-level PM, I want to feel confident this resource reflects real top
  company expectations.
- As a PM manager, I want a credible question set for internal mocks.

## Functional Requirements
- Single-page, responsive marketing layout.
- Clearly defined sections: Hero, Trust/Calibration, Curriculum, Samples,
  Social Proof, Pricing, FAQ, Final CTA.
- Primary CTA anchored to pricing section.
- Secondary CTA to curriculum section.
- Footer with legal links placeholders.
- Copy structured for scannability with short paragraphs and lists.

## Content Requirements
- Executive headline that references “top 30 tech companies” and “mid–senior PM”.
- Product overview with clear promise and outcomes.
- Credibility block with counts (questions, modules, calibration) and references
  to top-tier companies without using logos.
- Testimonials with role and short outcome.
- Sample questions showcasing strategy, execution, analytics, and leadership.
- Pricing display with one-time purchase and refund policy mention.
- FAQ for common objections (level fit, frameworks, updates, use cases).

## Social Proof Strategy
- Testimonials from senior PMs (role, domain, short quote).
- “Calibrated to the bar at” section with company name list (text only).
- Quantitative proof:
  - Total number of questions.
  - Number of modules.
  - Calibration coverage across top companies.
- Optional future add-ons:
  - “As seen in” press strip.
  - Aggregate rating (e.g., 4.8/5) once real data exists.
  - Case studies with anonymized outcomes.

## Design System Guidance
- Typography: Playfair Display (headings), Inter (body).
- Palette: warm cream background, near-black text, single accent color (#f37021).
- Layout: generous whitespace, 2-column hero, grid-based sections.
- Components: subtle borders, minimal shadow, 2–6px radius buttons.
- Motion: slow ease-out transitions (0.4s–0.6s), no bounce.

## Information Architecture
1. Hero (value proposition + CTA + product snapshot)
2. Calibration / trust section
3. Curriculum and modules
4. Sample questions
5. Social proof and stats
6. Pricing
7. FAQ
8. Final CTA
9. Footer

## Technical Requirements
- Static HTML/CSS.
- Mobile-first responsiveness.
- Performance budget: < 200kb CSS + HTML.
- No external JS required.
- Fonts loaded from Google Fonts.

## Analytics (V1)
- Track CTA clicks (top and pricing CTA).
- Track scroll depth (25/50/75/100).
- Track pricing section views.
- Track outbound purchase link click.

## Legal & Compliance
- Do not imply official partnership with listed companies.
- Use text-only company references.
- Provide clear refund policy.

## QA Checklist
- Responsive behavior at 320px, 768px, 1024px, 1440px.
- CTA buttons scroll to correct anchors.
- Contrast ratio for text vs background meets accessibility guidelines.
- All links have hover states.
- No layout shifts from font loading.

## Out of Scope
- Payment integration.
- User accounts or gated content.
- Localization.

## Launch Plan
- Internal review of copy and design.
- Accessibility check.
- Performance check (Lighthouse).
- Deploy static page to hosting (Netlify/Vercel).

## Future Enhancements
- A/B test hero headline and pricing.
- Video preview or short founder story.
- Interactive sample question download.
