# Product Leaks

Elegant landing page and PRD for a premium interview question bank aimed at
mid to senior Product Management roles at America's top tech companies.

## Files
- `app/page.tsx` — Next.js landing page.
- `app/globals.css` — Visual system and layout.
- `app/(app)/` — Authenticated app shell and screens.
- `PRD.md` — End-to-end product requirements document.
- `index.html` and `styles.css` — Legacy static version (kept for reference).

## Quick Preview
Install dependencies and run the dev server:

`npm install`
`npm run dev`

## Environment Variables
Create a `.env.local` with the following:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_COMPANIES_TABLE` (optional, default: `Companies`)
- `AIRTABLE_QUESTIONS_TABLE` (optional, default: `Questions`)

## Airtable Schema
Companies table fields:
- `Name` (text)
- `Slug` (text)
- `QuestionCount` (number)

Questions table fields:
- `Title` (text)
- `Prompt` (long text)
- `Tags` (multi-select or comma-separated text)
- `DifficultyLabel` (text)
- `DifficultyScore` (number)
- `CompanySlug` (text)
- `Requirements` (multi-select or comma-separated text)
