# Project: Inkloom AI — Error-Free, Accessible Brand Governance Platform

## Architecture
- **Monorepo Architecture**: npm workspaces (`apps/api` and `apps/web`).
- **Backend (`apps/api`)**: Node.js/Express, TypeScript, PostgreSQL (Neon) with pgvector, Google Gemini AI (with local deterministic embedding fallback).
- **Frontend (`apps/web`)**: Next.js 16.4.3 (Turbopack), React 19.3.0, Tailwind CSS v4, Lucide React, diff.
- **Client Architecture**: Single-page tabbed dashboard (`page.tsx`) with 8 primary views (`studio`, `slides`, `approvals`, `governance`, `analytics`, `audit`, `a11y`, `multitenant`) and modals (`NewDraftModal`, `DecisionModal`, `SocialPublishModal`, `QuickStartModal`, `ContrastCheckerModal`).
- **Resilience Architecture**:
  - Client-side offline cache & simulation layer (`lib/api.ts` & `lib/fallbackData.ts`).
  - Next.js route error boundaries (`app/error.tsx`, `app/global-error.tsx`) and component error boundary (`components/ErrorBoundary.tsx`).
  - Global friendly Fallback Notice Banner (`components/FallbackBanner.tsx`).
- **Guidance & Interpretability**:
  - In-app 3-step walkthrough on dashboard (`components/OnboardingWalkthrough.tsx`).
  - Quick-Start Guide modal (`components/QuickStartModal.tsx`) discoverable via header navigation and dashboard.
  - Interactive accessible tooltips (`components/HelperTooltip.tsx`) explaining governance terminology and scoring formula.
- **Accessibility**:
  - WCAG AA compliant contrast (>=4.5:1 for normal text).
  - Global visible `:focus-visible` styling (2px ring with offset).
  - Keyboard navigation for highlighted problem text spans, issue selection cards, and draft items.
  - Modal focus trapping, `role="dialog"`, and `Escape` key dismissal.
  - Descriptive ARIA attributes on all inputs, filters, controls, and diff elements.

---

## Feature Inventory
Every feature from ORIGINAL_REQUEST.md mapped to its assigned milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Global Error Boundaries | Next.js and React Error Boundaries preventing blank screens or crashes | M1 | R1 |
| F2 | Client-Side Offline Cache & Fallback Data | High-fidelity sample drafts, rules, analytics, and reviews for outages | M1 | R1 |
| F3 | Resilient API Client & Simulation Mode | Interceptor in `lib/api.ts` catching network/500 errors + simulated failure toggle | M1 | R1 |
| F4 | Friendly Fallback Notice Banner | Visible status banner informing users when operating on fallback/cached data | M1 | R1 |
| F5 | Safe Tab Transitions | Safe error handling in `handleTabChange` eliminating uncaught promise rejections | M1 | R1 |
| F6 | In-App 3-Step Walkthrough | Prominent dashboard onboarding walkthrough ("Step 1 -> Step 2 -> Step 3") | M2 | R2 |
| F7 | Quick-Start Guide Modal | Accessible guide modal reachable from header and dashboard with end-to-end instructions | M2 | R2, R3 |
| F8 | Interactive Governance Tooltips | Accessible hover/focus tooltips for complex governance terms and rule breakdowns | M2 | R2, R3 |
| F9 | Brand Score Transparency | Plain-English score breakdown on `ScoreBadge` explaining deductions and metrics | M2 | R3 |
| F10 | Technical Jargon Sanitization | Replace internal jargon (`pgvector`, `chunk_count`, `Round 3`) with plain language | M2 | R2 |
| F11 | Global Visible Focus Outlines | 2px visible `:focus-visible` styling across all interactive elements | M3 | R4 |
| F12 | Keyboard Operable Spans & Cards | `tabIndex={0}`, `role="button"`, and `onKeyDown` on marks, cards, and list items | M3 | R4 |
| F13 | Modal Accessibility & Escape Dismissal | `role="dialog"`, `aria-modal="true"`, focus management, and `Escape` key handling | M3 | R4 |
| F14 | Comprehensive ARIA Labeling | Meaningful `aria-label` attributes on search, filters, pickers, and icon buttons | M3 | R4 |
| F15 | WCAG AA Color Contrast Compliance | Replace low-contrast `#9ca3af` (`text-gray-400`) to guarantee >= 4.5:1 ratio | M3 | R4 |
| F16 | Opaque-Box E2E Test Suite | Automated verification suite testing error recovery, fallbacks, navigation, and a11y | E2E Track | Verification Suite |
| F17 | Final E2E Test Pass & Adversarial Hardening | 100% pass on E2E test tiers 1-4 and tier 5 adversarial hardening | Final Milestone | Verification Suite |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Error Resilience & Fallback Infrastructure | Error boundaries, API offline cache, simulated failure mode, fallback banner, safe tab navigation | None | DONE |
| M2 | Plain-Language Onboarding & Guidance | 3-step walkthrough, Quick-Start Guide, interactive tooltips, brand score breakdown, jargon cleanup | M1 (interface) | DONE |
| M3 | Accessibility & Usability Standards | Visible focus outlines, keyboard navigation on spans/cards, ARIA labels, modal a11y, WCAG AA contrast | M1, M2 | DONE |
| E2E | E2E Testing Suite (Parallel Track) | Automated opaque-box verification suite (Tiers 1-4) testing resilience, navigation, onboarding, and a11y | None (runs in parallel) | DONE |
| M4 | Final Milestone: E2E Pass & Hardening | Verify 100% E2E test suite pass (Tiers 1-4) followed by Tier 5 adversarial hardening | M1, M2, M3, E2E | DONE |

---

## Interface Contracts

### M1 (Resilience) ↔ M2/M3/UI Components
- **Fallback State Signal**:
  `apps/web/lib/api.ts` exports:
  - `isFallbackActive(): boolean` — returns true if serving simulated or cached fallback data.
  - `getFallbackReason(): string | null` — returns description of failure (e.g., 'Backend service unavailable', 'Simulated failure mode active').
  - `setSimulatedFailure(active: boolean): void` — programmatically toggles simulated failure mode.
- **Fallback Data Contract**:
  `apps/web/lib/fallbackData.ts` exports typed mock datasets:
  - `FALLBACK_CONTENTS: ContentItem[]`
  - `FALLBACK_CONTENT_DETAILS: Record<string, ContentDetails>`
  - `FALLBACK_GUIDELINES: Guideline[]`
  - `FALLBACK_FACTS: BrandFact[]`
  - `FALLBACK_BANNED_TERMS: BannedTerm[]`
  - `FALLBACK_ANALYTICS: AnalyticsData`
  - `FALLBACK_AUDIT_LOGS: AuditLogEntry[]`
- **Fallback Banner Component**:
  `apps/web/components/FallbackBanner.tsx`:
  - Props: `{ isSimulated?: boolean; onDismiss?: () => void; onRetry?: () => void }`

### M2 (Guidance) ↔ Navigation & Views
- **QuickStartModal**:
  `apps/web/components/QuickStartModal.tsx`:
  - Props: `{ isOpen: boolean; onClose: () => void }`
- **OnboardingWalkthrough**:
  `apps/web/components/OnboardingWalkthrough.tsx`:
  - Props: `{ onStartTour?: () => void; onDismiss?: () => void; isDismissed?: boolean }`
- **HelperTooltip**:
  `apps/web/components/HelperTooltip.tsx`:
  - Props: `{ text: string; term?: string; position?: 'top' | 'bottom' | 'left' | 'right'; children: React.ReactNode }`

### E2E Testing Track Contract
- Test script entry point: `node scripts/verify-resilience.mjs` or `npm run test:e2e`
- Generates `TEST_READY.md` containing verification commands, exit codes, and tier breakdown.

---

## Code Layout
- `apps/web/lib/fallbackData.ts` — Mock and cached brand governance data for offline and simulated states.
- `apps/web/lib/api.ts` — Resilient API client with fallback interceptor, failure detection, and offline mode.
- `apps/web/app/error.tsx` — Next.js client-side route error boundary.
- `apps/web/app/global-error.tsx` — Next.js root error boundary.
- `apps/web/components/ErrorBoundary.tsx` — Reusable React class error boundary for component trees.
- `apps/web/components/FallbackBanner.tsx` — Visible, friendly notice banner for fallback states.
- `apps/web/components/QuickStartModal.tsx` — Quick-start guide modal with 3-step walkthrough.
- `apps/web/components/OnboardingWalkthrough.tsx` — In-app dashboard onboarding banner.
- `apps/web/components/HelperTooltip.tsx` — Accessible popover tooltip for technical and governance terms.
- `apps/web/components/ScoreBadge.tsx` — Updated score badge with plain-English scoring breakdown.
- `apps/web/app/globals.css` — Global focus-visible outlines, accessibility tokens.
- `apps/web/components/HighlightedText.tsx` — Keyboard-accessible highlighted problem text.
- `apps/web/components/IssueCard.tsx` — Keyboard-accessible issue card with plain-language rule citations.
- `tests/e2e/` or `scripts/` — Automated resilience, accessibility, and navigation verification suite.
