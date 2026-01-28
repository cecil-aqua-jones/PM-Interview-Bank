# Apex Interviewer

Top Tech & AI coding interview preparation platform with AI-powered mock interviews.
Practice real coding questions from Google, OpenAI, Meta, Anthropic, Amazon, Apple,
Microsoft, Netflix, TikTok, Uber, Perplexity, xAI, and Oracle with an AI interviewer
that reviews your code and asks follow-up questions.

## Features

- **Real Questions**: Verified coding questions from top tech and AI companies
- **Code Editor**: Full-featured editor with syntax highlighting (Python, JS, Java, C++, Go)
- **AI Interviewer**: Reviews your code, asks follow-up questions about complexity
- **Voice Practice**: Practice explaining your solutions out loud
- **Progress Tracking**: Track scores by topic and identify weak areas

## Files

- `app/page.tsx` — Next.js landing page
- `app/globals.css` — Visual system and layout
- `app/dashboard/` — Authenticated app shell and screens
- `components/CodeEditor.tsx` — CodeMirror-based code editor
- `lib/codingRubric.ts` — Evaluation criteria for code review

## Quick Start

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` with the following:

```env
# Supabase (Authentication)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Airtable (Questions Database)
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
AIRTABLE_QUESTIONS_TABLE=Questions

# OpenAI (AI Interviewer)
OPENAI_API_KEY=

# Stripe (Payments)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App URL
NEXT_PUBLIC_APP_URL=https://apexinterviewer.com
```

## Airtable Schema

Questions table fields:

- `Question` or `Title` (text) — Problem title
- `Description` (long text) — Full problem description
- `Company` (single select) — Company name (Google, Meta, etc.)
- `Category` (multi-select) — Topic tags (Arrays, DP, Trees, etc.)
- `Difficulty` (single select) — Easy, Medium, Hard
- `Starter Code` (long text) — Optional starter template
- `Constraints` (long text) — Time/space constraints, separated by newlines
- `Examples` (long text) — JSON array or formatted text with Input/Output/Explanation
- `Hints` (long text) — Comma-separated hints
- `TimeComplexity` (text) — Expected time complexity (e.g., "O(n)")
- `SpaceComplexity` (text) — Expected space complexity (e.g., "O(1)")

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Supabase
- **Database**: Airtable
- **Code Editor**: CodeMirror 6
- **AI**: OpenAI GPT-4
- **Payments**: Stripe
- **Styling**: CSS Modules
