## 2026-10-29T09:52:12Z
[Message] timestamp=2026-10-29T09:52:12Z sender=7a18d0b0-67be-48d0-be11-c3b1213b2948 priority=MESSAGE_PRIORITY_HIGH content=You are the Implementation Worker for Milestone 2: Plain-Language Onboarding, Quick-Start Guide & Governance Interpretability for Inkloom AI.

MANDATORY INPUTS:
- Read ORIGINAL_REQUEST.md at: /home/satya/projects/hackathon/.agents/teamwork/ORIGINAL_REQUEST.md
- Read PROJECT.md at: /home/satya/projects/hackathon/PROJECT.md
- Review Explorer 3 Analysis & Design at: /home/satya/projects/hackathon/.agents/teamwork/teamwork_explorer_survey_3/analysis.md
- Read TEST_READY.md at: /home/satya/projects/hackathon/TEST_READY.md

Your assigned working directory:
/home/satya/projects/hackathon/.agents/teamwork/teamwork_worker_m2/

Exclusive file ownership:
- `apps/web/components/QuickStartModal.tsx`
- `apps/web/components/OnboardingWalkthrough.tsx`
- `apps/web/components/HelperTooltip.tsx`
- `apps/web/components/ScoreBadge.tsx`
- `apps/web/components/Header.tsx`
- `apps/web/components/SlideDeckScanner.tsx`
- `apps/web/components/SelfHealingCard.tsx`
- `apps/web/app/page.tsx` (onboarding and quick-start wiring)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Tasks for Milestone 2:
1. Create `apps/web/components/QuickStartModal.tsx`:
   - Accessible quick-start guide modal triggered from navigation header and dashboard walkthrough.
   - Props: `{ isOpen: boolean; onClose: () => void; initialStep?: number }`.
   - Comprehensive plain-language overview:
     - Header: "Inkloom AI — Quick-Start Guide" with subtitle explaining purpose ("Brand governance and AI compliance made simple for any content creator").
     - 4 interactive guided steps with clear icons, bullet points, and plain-English tips:
       - Step 1: Connect Your Brand Rules (Guidelines, Facts, Banned Words)
       - Step 2: Write or Paste Drafts (LinkedIn, Twitter, Blogs, Press Releases, Slide Decks)
       - Step 3: Understand Brand Score & 1-Click Fixes (Transparent deductions, instant replacements)
       - Step 4: Review, Approve & Publish (Multi-persona approval flows, social zero-API publish)
     - Interactive controls: Next/Previous step buttons, step indicator pills, "Start Scanning Now" CTA button.
     - Accessible modal features: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="quickstart-title"`, `Escape` key dismissal listener, and auto-focus management.
2. Create `apps/web/components/OnboardingWalkthrough.tsx`:
   - Prominent, friendly 3-step walkthrough banner on the Studio dashboard ("How it works: Step 1 -> Step 2 -> Step 3").
   - Explains what Inkloom AI is in simple terms: "Your brand guardian that checks content against tone guidelines, verified facts, and banned words before you hit publish."
   - 3 visually distinct step cards:
     - Step 1: Select or Create a Draft (Choose from existing drafts or start fresh)
     - Step 2: Instant Brand Health Scan (AI highlights rule violations and factual risks)
     - Step 3: Apply 1-Click Fixes & Publish (Review suggestions, resolve issues, and reach 100/100)
   - Action buttons: "Open Quick-Start Guide" (opens modal), "Dismiss" (persists dismissal in localStorage `inkloom_onboarding_dismissed`), and "Show Tour" button when minimized.
3. Create `apps/web/components/HelperTooltip.tsx`:
   - Reusable, accessible popover tooltip for technical and governance terminology.
   - Props: `{ text: string; term?: string; position?: 'top' | 'bottom' | 'left' | 'right'; children: React.ReactNode }`.
   - Supports keyboard focus (`tabIndex={0}`), Enter/Space toggle, hover, `role="tooltip"`, `aria-describedby`, and clear high-contrast styling.
4. Upgrade `apps/web/components/ScoreBadge.tsx`:
   - Add transparent plain-English score breakdown on hover and keyboard focus:
     - Explains score calculation formula: Base 100 points, -15 per Must Fix, -7 per Should Fix, -3 per Tip.
     - Visual breakdown card showing count of Must Fix, Should Fix, and Tips with point deductions and pass/fail thresholds.
     - Plain-English status: "Ready to share (85-100)", "Needs a few tweaks (60-84)", "Needs attention (<60)".
5. Sanitize Technical Jargon:
   - In `apps/web/components/SlideDeckScanner.tsx`: replace `"Round 3 Improvement 1"` with `"Automated Slide Governance"`, replace `"pgvector RAG fact verification"` with `"Factual Verification against Approved Brand Facts"`.
   - In `apps/web/components/SelfHealingCard.tsx`: replace `"Round 3 Improvement 3"` with `"Brand Rule Auto-Sync"`, replace `"synchronizes vector embeddings with 1 click"` with `"synchronizes brand knowledge across guidelines and fact sheets with 1 click"`.
   - In `apps/web/app/page.tsx`: ensure raw database counts like `chunk_count` are labeled as `"X rules loaded"`.
6. Header & Dashboard Navigation Integration:
   - In `apps/web/components/Header.tsx`: add a prominent "Quick-Start Guide" button (with Compass or HelpCircle icon) with visible focus ring and tooltip.
   - In `apps/web/app/page.tsx`: add `isQuickStartOpen` state, wire `QuickStartModal`, mount `OnboardingWalkthrough` at the top of the Studio workspace.
7. Verification & Quality:
   - Run `npm run build --workspace=apps/web` (confirm clean exit code 0).
   - Run `node scripts/verify-resilience.mjs --milestone=m2` (confirm all M2 tests pass).
   - Run `node scripts/verify-resilience.mjs --baseline` (confirm overall passing test count advances).
   - Run ESLint on all touched files: 0 errors, 0 warnings.
8. Maintain `progress.md` and deliver full `handoff.md` with build and test logs.

## 2026-10-29T10:36:16Z
[Message] timestamp=2026-10-29T10:36:16Z sender=7a18d0b0-67be-48d0-be11-c3b1213b2948 priority=MESSAGE_PRIORITY_HIGH content=**Context**: Milestone 2 Implementation
**Content**: Checking in on your progress for Milestone 2. We see that QuickStartModal.tsx, OnboardingWalkthrough.tsx, HelperTooltip.tsx, ScoreBadge.tsx, and jargon sanitization have been authored. How is build verification and testing progressing?
**Action**: Please update progress.md with your latest status and author handoff.md when ready.

