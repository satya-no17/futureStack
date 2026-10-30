# Handoff Report — Explorer 3 (UX and Content Explorer)

**Working Directory**: `/home/satya/projects/hackathon/.agents/teamwork/teamwork_explorer_survey_3/`  
**Milestone**: Step 0: Survey  
**Recipient**: Project Orchestrator (`7a18d0b0-67be-48d0-be11-c3b1213b2948`)  
**Type**: Hard Handoff (Task Complete)

---

## 1. Observation

Direct observations from examining the codebase, components, configuration, and requirements:

1. **User Request & Requirements (`/home/satya/projects/hackathon/.agents/teamwork/ORIGINAL_REQUEST.md`)**:
   - Lines 15–17 (R2): *"Provide clear, everyday explanations across the entire end-to-end user journey (landing page, quick-start guide, analysis dashboard, and rule inspection) so any non-technical user immediately understands what Inkloom AI is, what it does, and how it works. Include an intuitive step-by-step onboarding walkthrough ('How it works: Step 1 -> Step 2 -> Step 3') and plain-English rule breakdowns."*
   - Lines 18–20 (R3): *"Add intuitive helper UI components—such as a Quick-Start Guide, interactive helper tooltips for complex governance terms, and simplified visual status indicators—making key insights and brand health metrics easy to interpret at a glance."*
   - Lines 31–35 (Acceptance Criteria):
     - *"The landing page or dashboard includes a prominent, plain-language explanation of Inkloom AI's purpose and a 3-step walkthrough explaining how to use the platform."*
     - *"Technical jargon across governance rules and brand score metrics is accompanied by plain-English explanations or interactive tooltips."*
     - *"A quick-start guide is present and accessible from the main navigation or dashboard."*

2. **Universal Navigation (`apps/web/components/Header.tsx`)**:
   - Lines 33–42 define 8 navigation tabs:
     `studio` ('Drafts & Scanner'), `slides` ('Slide Deck Scanner'), `approvals` ('Needs Review'), `governance` ('Brand Rules & Facts'), `analytics` ('Score & Reports'), `audit` ('Activity History'), `a11y` ('Colors & Readability'), `multitenant` ('Compare Brands').
   - **Zero Quick-Start Guide Links**: There is no button, link, or modal trigger for a Quick-Start Guide in the header or navigation bar.
   - Line 117 uses a native browser HTML title attribute: `title="Sign out to return to home"`. No rich or accessible tooltip component exists.

3. **Landing Page vs Dashboard Onboarding (`apps/web/components/LandingPage.tsx` vs `apps/web/app/page.tsx`)**:
   - In `LandingPage.tsx` lines 265–296, a static marketing 3-step breakdown exists:
     - Step 01: "Write & Submit"
     - Step 02: "AI Scans & Flags"
     - Step 03: "Review & Publish"
   - In `apps/web/app/page.tsx` lines 361–688 (the dashboard rendered after authentication):
     - **No onboarding walkthrough exists**. Once logged in, the user is dropped directly into the `studio` tab without any guided walkthrough, checklist, or instructions on what to do first.

4. **Brand Score Logic (`apps/api/src/services/review/score.ts`) vs UI Display (`apps/web/components/ScoreBadge.tsx`)**:
   - In `score.ts` lines 15–32, score calculation is deterministic:
     `score = 100 - (15 * high_severity_count) - (7 * medium_severity_count) - (3 * low_severity_count)`.
   - In `ScoreBadge.tsx` lines 12–71:
     The badge renders `score/100` and text like `Ready to share` (>=85), `Needs a few tweaks` (60–84), or `Needs attention` (<60).
     However, it contains **zero explanation or tooltips** detailing the scoring formula, point deductions, or passing criteria.

5. **Tooltips and Highlighting (`apps/web/components/HighlightedText.tsx`, `apps/web/components/IssueCard.tsx`)**:
   - In `HighlightedText.tsx` lines 60–71:
     Highlighted problem spans use `<mark>` elements with `title={`${issue.severity.toUpperCase()}: ${issue.explanation}`} `.
     This is a native browser HTML title attribute, which is not keyboard focusable, not touch accessible, and provides no interactive popover.
   - In `IssueCard.tsx` lines 27–46, friendly labels exist (`Must Fix`, `Should Fix`, `Tip`, `Word to avoid`, `Incorrect fact`, `Unproven claim`, `Tone mismatch`), but they lack interactive tooltips explaining what those terms mean or how the system determined them.
   - In `IssueCard.tsx` lines 98–104, rule citations quote raw identifiers (e.g. `Acme Brand Voice Guide §2`, `Acme Technical Specs Fact #5 & #7`, or raw chunk references) without expandable plain-English rule texts.

6. **Technical Jargon in UI Components**:
   - `SlideDeckScanner.tsx` line 61: `"Round 3 Improvement 1"` (hackathon grading jargon).
   - `SlideDeckScanner.tsx` line 66: `"OCR factual claims using pgvector RAG fact verification"`.
   - `SlideDeckScanner.tsx` line 154: `"Logo Margin <24px"`.
   - `SlideDeckScanner.tsx` line 211: `"RAG Claim Contradiction"`.
   - `SelfHealingCard.tsx` line 65: `"Round 3 Improvement 3"`.
   - `SelfHealingCard.tsx` line 69: `"synchronizes vector embeddings with 1 click"`.
   - `SelfHealingCard.tsx` line 126: `"Distinct Authors Confused"`.
   - `SelfHealingCard.tsx` line 195: `"Updating Guidelines & Vector Chunks..."`.
   - `page.tsx` line 889: `"5 rules loaded"` (displaying `g.chunk_count`).

7. **Error Fallback Banners (`apps/web/app/page.tsx`)**:
   - Lines 550–582 implement an amber alert banner when `latestReview?.status === 'failed' || aiError`:
     `"⚠️ AI not responded — Rule checks only"`.
   - However, when network or backend API calls fail (e.g. `loadInitialData()` line 112, `loadContentDetails()` line 134), errors are caught and logged only to `console.error()`, leaving the UI blank or empty with no fallback notice banner.

---

## 2. Logic Chain

1. **Premise 1 (R2 & R3 Requirements)**: ORIGINAL_REQUEST.md lines 15–20 and 31–35 require a 3-step onboarding walkthrough ("How it works: Step 1 -> Step 2 -> Step 3") on the dashboard, a discoverable Quick-Start Guide, interactive helper tooltips for governance terms and score metrics, and plain-language guidance across the entire journey.
2. **Premise 2 (Current Onboarding Gap)**: Observations 2 and 3 show that while the landing page has a marketing summary of 3 steps, the in-app dashboard (`AppHome` in `page.tsx`) has zero onboarding walkthrough. Furthermore, there is no Quick-Start Guide anywhere in the application or navigation. Therefore, non-technical users entering the application have no guided path.
3. **Premise 3 (Current Tooltip & Accessibility Gap)**: Observations 2 and 5 demonstrate that tooltips are currently implemented solely via HTML `title` attributes (e.g. `<mark title="...">` in `HighlightedText.tsx:66` and button titles in `Header.tsx:117`). These do not support keyboard navigation (violating R4), lack rich formatting, and do not explain governance rules or brand score mechanics (violating R3).
4. **Premise 4 (Technical Jargon Friction)**: Observation 6 shows multiple UI components displaying raw internal jargon (`pgvector`, `RAG claim contradiction`, `Round 3 Improvement 1`, `vector embeddings`, `chunk_count`). Non-technical content creators and reviewers will be confused by database and hackathon terminology.
5. **Premise 5 (Score Interpretability Gap)**: Observation 4 demonstrates that while the backend has a clean, simple scoring formula in `score.ts` (100 base, -15 Must Fix, -7 Should Fix, -3 Tip), `ScoreBadge.tsx` does not explain this to the user, making brand health metrics opaque.
6. **Inference / Conclusion**: Implementing R2 and R3 requires introducing:
   - An accessible `QuickStartGuideModal` triggered from `Header.tsx` and the dashboard.
   - A persistent, dismissible `OnboardingWalkthrough` banner on the Studio dashboard.
   - An accessible `HelperTooltip` component with keyboard focus and ARIA attributes for governance terms and score metrics.
   - An interactive `ScoreBreakdownTooltip` on `ScoreBadge`.
   - Sanitizing all raw technical strings into plain English.

---

## 3. Caveats

- **Backend AI Availability**: The survey noted that AI endpoints (Gemini LLM and pgvector embeddings) depend on external API keys and database connectivity. The UI already has a fallback banner for AI review failure (`page.tsx:550`), which must be preserved and expanded to cover network/API failures.
- **Strict Read-Only Execution**: In accordance with explorer rules, no source code was modified during this survey. Proposed components are specified as designs and patterns for subsequent implementation agents.
- **Browser/Environment**: The survey was conducted via static code inspection and project structure analysis. No browser runtime was altered.

---

## 4. Conclusion

The Inkloom AI codebase is functionally solid with strong foundational capabilities, but it currently fails key acceptance criteria for R2 and R3:
- **AC R2.1 (3-step walkthrough on dashboard)**: Currently FAIL (only present on marketing landing page).
- **AC R2.2 (Plain-English explanations and tooltips for jargon)**: Currently FAIL (uses HTML title attributes; contains raw jargon like `pgvector`, `chunk_count`, `vector embeddings`).
- **AC R3.1 (Quick-start guide present and accessible from nav/dashboard)**: Currently FAIL (completely missing).
- **AC R3.2 (Interactive helper tooltips for governance terms)**: Currently FAIL (no rich accessible tooltips).
- **AC R3.3 (Simplified visual status indicators with clear metrics)**: Partially PASS (visual pills exist, but score mechanics and passing criteria are unexplained).

All required UI components and content specifications have been designed and documented in detail in `analysis.md`.

---

## 5. Verification Method

To independently verify the observations and gaps documented in this report:

1. **Verify Absence of Quick-Start Guide in Navigation**:
   ```bash
   grep -rn "Quick" apps/web/components/ apps/web/app/
   ```
   *Expected Result*: Zero occurrences of "Quick-Start" or "QuickStart" in navigation or dashboard.

2. **Verify Absence of In-App 3-Step Walkthrough in Dashboard**:
   Inspect `apps/web/app/page.tsx` lines 361–460.
   *Expected Result*: The dashboard layout immediately renders the draft search bar and split-pane editor without any onboarding banner or "Step 1 -> Step 2 -> Step 3" walkthrough.

3. **Verify Existing Native Title Tooltips vs Rich Tooltips**:
   ```bash
   grep -rn 'title="' apps/web/components/
   ```
   *Expected Result*: Only HTML `title="..."` attributes exist in `Header.tsx:117`, `SelfHealingCard.tsx:78`, and `HighlightedText.tsx:66`. No custom tooltip components or ARIA tooltip roles (`role="tooltip"`) exist.

4. **Verify Raw Technical Jargon in UI**:
   ```bash
   grep -rn -E "pgvector|Round 3 Improvement|vector embeddings|chunk_count" apps/web/components/ apps/web/app/
   ```
   *Expected Result*: Multiple raw jargon strings found in `SlideDeckScanner.tsx`, `SelfHealingCard.tsx`, and `page.tsx`.

5. **Verify Brand Score Mechanics**:
   Inspect `apps/api/src/services/review/score.ts` lines 15–32 and compare against `apps/web/components/ScoreBadge.tsx`.
   *Expected Result*: Backend scoring deductions (-15, -7, -3) are not explained or displayed anywhere in `ScoreBadge.tsx`.
