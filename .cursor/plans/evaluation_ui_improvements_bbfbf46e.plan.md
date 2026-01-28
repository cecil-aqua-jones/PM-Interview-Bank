---
name: Evaluation UI Improvements
overview: Enhance the interview results/feedback UI and progress dashboard based on the evaluation framework PDF, adding Red Flags, Priority Improvements, Follow-up Questions, and Design Summary sections while applying Hermes-level elegant UI refinements throughout.
todos:
  - id: results-summary-card
    content: Create ResultsSummaryCard component with elegant score display and dimension breakdown
    status: completed
  - id: red-flags-section
    content: Create RedFlagsSection component for displaying critical issues with score cap effects
    status: completed
  - id: priority-improvements
    content: Create PriorityImprovements component with numbered ranking and What You Said / How to Improve format
    status: completed
  - id: followup-question
    content: Create FollowUpQuestion component for displaying suggested interview follow-up
    status: completed
  - id: design-summary-card
    content: Create DesignSummaryCard component for system design interviews (components, scaling, trade-offs, missed topics)
    status: completed
  - id: integrate-feedback-cards
    content: Refactor FeedbackCards.tsx to integrate all new sections in proper order
    status: pending
  - id: enhance-detailed-feedback
    content: Enhance DetailedFeedbackCards.tsx with refined styling and better quotes display
    status: pending
  - id: css-hermes-styling
    content: Add new CSS styles following Hermes design principles (warm colors, generous whitespace, crisp borders)
    status: in_progress
  - id: progress-dashboard-polish
    content: Apply minor elegance refinements to progress dashboard
    status: pending
isProject: false
---

# Enhanced Interview Evaluation UI

## Summary

The PDF framework specifies a structured evaluation display with sections that the current UI partially implements but lacks key elements like **Red Flags**, **Priority Improvements with rewrites**, **Follow-Up Questions**, and **Design Summary**. The evaluation data already contains these fields (`redFlagsIdentified`, `nextFollowUp`, `missedConsiderations`) but they are not surfaced in the UI.

## Data Already Available (No API Changes Needed)

The rubric files already return these fields:

```typescript
// All interview types have:
redFlagsIdentified: string[];
strengths: string[];
improvements: string[];
overallFeedback: string;

// Coding:
nextFollowUp: string;
suggestedOptimization?: string;

// Behavioral:
suggestedFollowUp: string;
storyBankRecommendations?: string;

// System Design:
suggestedDeepDive: string;
missedConsiderations: string[];
designHighlights: { keyComponents, scalingStrategy, mainTradeoff };
```

---

## UI Changes Required

### 1. Create New ResultsSummaryCard Component

A new elegant summary card that shows at-a-glance results per the PDF framework:

**Layout:**

- Score with verdict badge (styled like a luxury product tag)
- Horizontal dimension breakdown with minimal bars
- Red flags section (if any) with warning styling

**File:** `app/dashboard/components/ResultsSummaryCard.tsx` (new)

### 2. Create RedFlagsSection Component

Display blocking issues prominently per the PDF framework:

- Section header: "Critical Issues"
- Each flag shown with warning icon
- Explain the score cap effect (e.g., "Ownership capped at 2.5")
- Elegant styling with subtle red accent

**File:** `app/dashboard/components/RedFlagsSection.tsx` (new)

### 3. Create PriorityImprovements Component

Display ranked improvements (max 3) with rewrites:

- Numbered 1, 2, 3 ranking
- "What You Said" quote (from conversation)
- "How to Improve" rewrite suggestion
- Clean editorial layout with generous whitespace

**File:** `app/dashboard/components/PriorityImprovements.tsx` (new)

### 4. Create FollowUpQuestion Component

Display the suggested follow-up question:

- Styled as a thought-provoking prompt
- Expandable section showing expected answer direction
- Helps candidates prepare for real interview dynamics

**File:** `app/dashboard/components/FollowUpQuestion.tsx` (new)

### 5. Create DesignSummaryCard Component (System Design only)

Per PDF framework, show design summary:

- **Components:** List of key components identified
- **Scaling Strategy:** How they approached scale
- **Main Trade-off:** The primary trade-off acknowledged
- **Missed Topics:** What they should have addressed

**File:** `app/dashboard/components/DesignSummaryCard.tsx` (new)

### 6. Refactor FeedbackCards.tsx

Update the existing component to integrate new sections:

```tsx
<ResultsSummaryCard evaluation={evaluation} />
<RedFlagsSection flags={evaluation.redFlagsIdentified} />
<DetailedFeedbackCarousel dimensions={dimensions} />
<PriorityImprovements
  improvements={evaluation.improvements}
  conversation={conversation}
/>
<FollowUpQuestion question={evaluation.nextFollowUp} />
```

### 7. Refactor DetailedFeedbackCards.tsx

Enhance the carousel with:

- More elegant card styling (Hermes aesthetic)
- Better visual hierarchy for scores
- Cleaner navigation controls
- Add "What You Said" quotes from conversation

### 8. CSS Styling Updates

Apply Hermes design principles to `app.module.css`:

- **Colors:** Warm ivory backgrounds, charcoal text, subtle gold accents for strengths
- **Typography:** Playfair Display for headers, increased letter-spacing
- **Spacing:** 4x more padding, generous whitespace
- **Borders:** Crisp 1px borders, no heavy shadows
- **Red flags:** Subtle burgundy accent (not harsh red)
- **Animations:** Slow fade-in (0.4s ease-out)

### 9. Progress Dashboard Refinements

Minor elegance updates to progress page:

- Refine card styling consistency
- Better empty states
- Cleaner stat presentation
- The current design is already quite elegant, minimal changes needed

---

## Component Structure

```
FeedbackContainer
├── ResultsSummaryCard
│   ├── ScoreDisplay (large score + verdict)
│   ├── DimensionBreakdownMini (horizontal bars)
│   └── VerdictBadge
├── RedFlagsSection (if redFlags.length > 0)
│   └── RedFlagItem (for each flag)
├── DetailedFeedbackCarousel (existing, enhanced)
│   └── DimensionCard (per dimension)
├── PriorityImprovements
│   └── ImprovementItem (numbered 1-3)
├── FollowUpQuestion
│   ├── QuestionText
│   └── ExpectedAnswerHint (expandable)
└── ActionButtons (Done / Try Again)

// System Design only:
├── DesignSummaryCard
│   ├── ComponentsList
│   ├── ScalingStrategy
│   ├── MainTradeoff
│   └── MissedTopicsList
```

---

## Files to Create

- `app/dashboard/components/ResultsSummaryCard.tsx`
- `app/dashboard/components/RedFlagsSection.tsx`
- `app/dashboard/components/PriorityImprovements.tsx`
- `app/dashboard/components/FollowUpQuestion.tsx`
- `app/dashboard/components/DesignSummaryCard.tsx`

## Files to Modify

- [app/dashboard/components/FeedbackCards.tsx](app/dashboard/components/FeedbackCards.tsx) - Integrate new sections
- [app/dashboard/components/DetailedFeedbackCards.tsx](app/dashboard/components/DetailedFeedbackCards.tsx) - Styling refinements
- [app/dashboard/app.module.css](app/dashboard/app.module.css) - New styles for components
- [app/dashboard/progress/page.tsx](app/dashboard/progress/page.tsx) - Minor elegance tweaks
