# Inkloom AI — UX and Content Survey Analysis (Step 0)

**Date**: 2026-10-29  
**Explorer**: Explorer 3 (UX and Content Explorer)  
**Target Project**: Inkloom AI Pre-Publication Brand Governance Platform  
**Scope**: End-to-end user journey, onboarding walkthroughs, Quick-Start Guide, technical jargon/terminology, tooltips, explanatory banners, status indicators, and mapping to R2 & R3 requirements.

---

## 1. Executive Summary

Inkloom AI possesses a remarkably rich functional core—spanning hybrid rule/claim/tone checking, slide deck scanning, self-healing ambiguity resolution, and multi-tenant brand isolation. However, from a UX and content perspective, the platform currently assumes substantial prior domain knowledge. There is **no in-app onboarding walkthrough** ("Step 1 -> Step 2 -> Step 3") once a user enters the workspace, **no Quick-Start Guide** accessible from the navigation or dashboard, **no interactive accessible helper tooltips** for complex governance terms, and several areas still expose raw AI/database terminology (e.g., `pgvector`, `chunk_04`, `distinct_violators`, `cosine distance`). 

Resolving requirements **R2** (Plain-Language Guidance and Interpretability) and **R3** (UI Helper Components and Simplified Status Indicators) requires adding an accessible in-app Quick-Start Guide, persistent 3-step walkthrough widgets, interactive keyboard-accessible tooltips for governance rules and brand score metrics, and plain-English translation layers over technical citations.

---

## 2. End-to-End User Journey Audit

Inkloom AI currently supports 8 distinct tabs and multi-persona workflows across 3 seeded organizations (Acme Enterprise, Zest Social, Solo Studio). Below is the comprehensive audit across each phase of the user journey.

### Journey 1: Landing Page & Discovery (`components/LandingPage.tsx`)
- **Current Experience**:
  - The landing page presents a polished marketing overview with sections: Hero, Social Proof, Features (6 cards), "Three steps to brand-safe publishing" (How It Works), About Inkloom, and CTA.
  - Plain-language messaging is solid at the high level: *"Pre-publish with confidence"*, *"Inkloom automatically scans every draft against your brand guidelines, verified facts, and compliance rules"*.
  - Step 1 ("Write & Submit"), Step 2 ("AI Scans & Flags"), Step 3 ("Review & Publish") are described textually.
- **Identified Gaps**:
  - The 3-step walkthrough exists **only** on the marketing landing page. Once a user clicks "Start Free Demo" or "Sign In" and enters `AppHome`, all onboarding guidance vanishes.
  - There is no link or button to launch an interactive Quick-Start Guide or open a tutorial demo directly from the landing navbar.

### Journey 2: Persona Selection & Authentication (`components/LoginScreen.tsx`)
- **Current Experience**:
  - Displays quick demo account selection for 5 personas:
    1. Leo Writer (`creator@acme.com`) - Writer
    2. Sarah Approver (`reviewer@acme.com`) - Reviewer
    3. Victoria Brand (`admin@acme.com`) - Brand Lead
    4. Alex Social (`creator@zest.io`) - Writer (Zest Social)
    5. Sam Solo (`solo@creator.dev`) - Solo Writer (Solo Studio)
  - Includes a helpful Render cold-start alert banner (*"Render Free Tier: If the backend was sleeping, the first sign-in may take 30–50 seconds"*).
- **Identified Gaps**:
  - The login screen does not explain what capabilities each role possesses (e.g., that Writers cannot approve, Reviewers see approval queues, Brand Leads manage rules & self-healing).
  - Role differences are not made clear until the user stumbles into disabled buttons or missing tabs.

### Journey 3: Drafting & AI Content Inspection (`apps/web/app/page.tsx` - Studio Tab)
- **Current Experience**:
  - Left pane: Drafts list with score badges, channel tags, and status labels (`statusLabels`).
  - Search bar by title and filter by channel (LinkedIn, Twitter/X, Blog, Press Release, Email Newsletter).
  - Right pane: Header panel with title, channel, version number, score badge, and action buttons (`Check My Words`, `Send for Review`, `Zero-API Publish`).
  - Text view: Split between `HighlightedText` (color-coded `<mark>` spans) + editable textarea on left, and `IssueCard` column on right.
  - 1-Click fix workflow: Clicking "Use This Fix" replaces the text in the editor, creates a new version, and triggers a re-review.
- **Identified Gaps**:
  - **No Step 1 -> Step 2 -> Step 3 walkthrough**: First-time users see an editor with pre-loaded copy but no visual banner or stepped guide showing: *1. Review highlighted words -> 2. Click 'Use This Fix' -> 3. Send for Review*.
  - **No Quick-Start Guide**: No modal or drawer explaining the workflow.
  - **Score opacity**: The Brand Score (e.g. `45/100` or `19/100`) shows a status text like `Needs attention`, but there is no tooltip explaining *why* it is 45 or *how* points were deducted.
  - **Highlighted text tooltip accessibility**: Highlighted words use native browser `<mark title="...">` attributes, which cannot be opened via keyboard and are not accessible on touch devices.

### Journey 4: Review Queue & Word-Level Diff View (`components/DiffView.tsx`, Approvals Tab)
- **Current Experience**:
  - Reviewers and Admins see submitted drafts waiting for review.
  - Displays side-by-side / inline word-level diff using the `diff` library (`diffWordsWithSpace`). Red strike-through for removed text, green highlight for added text.
  - Decision modal: "Confirm Approval" or "Send Feedback to Writer" with required revision notes.
- **Identified Gaps**:
  - The diff viewer hardcodes the original comparison text in line 753 (`oldText="Our app is the #1 fastest tool, guaranteed! Trusted by millions of businesses."`) instead of dynamically retrieving the actual previous version (e.g. `v1` vs `v2`).
  - No contextual tooltip explaining the difference between "Changes Needed" vs "Rejected".

### Journey 5: Brand Rules & Facts Management (Governance Tab)
- **Current Experience**:
  - Three sections: "Words to Avoid" (banned terms CRUD with term, replacement, reason, severity), "Brand Voice Guidelines" (list of guideline documents with chunk count), "Approved Facts & Numbers" (list of fact documents).
- **Identified Gaps**:
  - Non-technical users see technical terms like *"5 rules loaded"*, *"chunk_count"*, *"Category: voice"*.
  - Guideline and Fact items only show document titles and chunk numbers; users cannot expand or inspect the actual underlying rules or approved fact sentences from this page!
  - No helper tooltips explaining what constitutes a "Banned Term" vs a "Guideline" vs a "Fact".

### Journey 6: Brand Health Metrics & Reporting (Analytics Tab)
- **Current Experience**:
  - 4 high-level metric cards: Drafts Checked, Approved & Live, Team Average Score, Issues Needing Fix.
  - Self-Healing Brand Rules & Ambiguity Clarifier (`SelfHealingCard`).
  - Most Common Mistakes (`topViolations`) and Confusing Rules Helper (`ambiguousRules`).
- **Identified Gaps**:
  - Terminology like `distinct_violators`, `source_ref: "brand_guidelines_acme_v2:chunk_04"`, `multi-author confusion threshold` is presented without plain-language translations or tooltips.
  - The connection between ambiguous rules and how self-healing resolves them is not explained to non-technical users.

### Journey 7: Multi-Modal Slide Deck Scanner (`components/SlideDeckScanner.tsx`)
- **Current Experience**:
  - 16:9 simulated slide canvas with visual bounding boxes detecting logo padding (<24px exclusion zone), typography (all-caps shouts), and RAG claim contradictions.
  - 1-click import from slide to draft editor.
- **Identified Gaps**:
  - The header badge says *"Round 3 Improvement 1"*, which is internal hackathon grading terminology rather than user-facing product language.
  - Technical acronyms like `OCR factual claims`, `pgvector RAG fact verification`, `Logo Margin <24px` are unexplained.

### Journey 8: Accessibility & Brand Comparison (`components/ContrastCheckerModal.tsx`, `components/MultiTenantDemo.tsx`)
- **Current Experience**:
  - Contrast checker tests hex combinations against WCAG 2.1 AA Normal Text, AA Large Text, and AAA Top Standard.
  - Text accessibility checks for missing alt text, >30-word run-ons, and ALL-CAPS text blocks.
  - Multi-tenant demo compares identical copy evaluated under Acme Enterprise (strict) vs Zest Social (casual).
- **Identified Gaps**:
  - Lacks plain-language tooltips explaining *what* a contrast ratio is (e.g. why `4.5:1` is the legal standard).
  - The MultiTenantDemo shows static sample results rather than allowing live rule inspection.

---

## 3. Onboarding Flow & Quick-Start Guide Audit

### Current Onboarding State
| Feature | Present? | Location | Assessment & Issues |
|---|---|---|---|
| **Marketing 3-Step Walkthrough** | Yes | `LandingPage.tsx` lines 265–296 | Explains Step 01 (Write & Submit), Step 02 (AI Scans & Flags), Step 03 (Review & Publish). Good for visitors, but completely missing inside the app. |
| **In-App Onboarding Walkthrough** | **NO** | `AppHome` / `page.tsx` | Completely absent. When a user logs in, they are immediately placed in the studio tab with no guided sequence, no progress indicators, and no onboarding checklist. |
| **Quick-Start Guide** | **NO** | Entire repository | Non-existent. There is no Quick-Start modal, slide-out drawer, dedicated page, or popover anywhere in `apps/web`. Main navigation has no Quick-Start button. |
| **First-Time User Experience (FTUE)** | Weak | `AppHome` / `page.tsx` | Assumes user knows to click "Check My Words", inspect issues on the right, click "Use This Fix", and then "Send for Review". |
| **Persona Contextual Guidance** | Weak | `Header.tsx`, `LoginScreen.tsx` | Role is shown as a text badge ("Writer", "Reviewer"), but there is no guide explaining what that persona's responsibilities or next steps are. |

### Required Additions for R2 & R3:
1. **Interactive In-App Onboarding Walkthrough**:
   - A prominent, dismissible or collapsable banner on the Studio dashboard:
     - **Step 1: Write or Select a Draft** (Pick a sample draft from the left or write your own text).
     - **Step 2: Check Words & Accept Fixes** (Click "Check My Words" to run real-time brand governance; apply 1-click fixes).
     - **Step 3: Send for Review or Publish** (Submit for reviewer sign-off or launch directly to social platforms).
2. **Dedicated Quick-Start Guide Modal / Drawer**:
   - Accessible via a prominent button in the `Header` (e.g. `Quick-Start Guide` with a BookOpen or Compass icon) and from the Studio dashboard.
   - Contains:
     - Interactive visual tour of the platform.
     - Role-based cheat sheets (Writer vs Reviewer vs Brand Lead vs Solo Creator).
     - Explanation of the Brand Score (100-point scale, score tiers, deductions).
     - Sample drafts and expected review outcomes.

---

## 4. Governance Terms, Brand Score Metrics & Technical Jargon Catalog

Below is the exhaustive catalog of technical, AI, and governance terms found throughout the codebase, along with their plain-English equivalents.

### 4.1. Issue Types & Governance Rules
| Code / Internal Term | Current UI Label | Plain-Language Meaning | Non-Technical Explanation (for Tooltips) |
|---|---|---|---|
| `banned_term` | "Word to avoid" | Prohibited vocabulary | *"A word or phrase that our company has specifically banned from all public copy (e.g., 'cheap' or 'guaranteed') because it damages our professional reputation or creates legal liability."* |
| `outdated_term` | "Old term" | Deprecated branding | *"An older brand phrase or discontinued product name that has been replaced by newer official branding (e.g., using an old product name)."* |
| `contradicted_claim` | "Incorrect fact" | Factual conflict with verified specs | *"This statement directly contradicts our company's approved technical specifications or client records (e.g., claiming 'millions of users' when our official data confirms 500+ enterprise clients)."* |
| `unverified_claim` | "Unproven claim" | Superlative or ranking without citation | *"This statement makes a superlative claim (e.g., '#1 fastest tool' or 'best in the industry') that is not supported by documented benchmarks or independent audit reports."* |
| `tone` | "Tone mismatch" | Brand voice deviation | *"The phrasing is too casual, too aggressive, or deviates from our established brand voice guidelines (e.g., saying 'our app' instead of 'our enterprise platform')."* |
| `accessibility` | "Hard to read" | WCAG readability/a11y issue | *"The text contains sentences over 30 words, all-caps shouting, or images missing alternative text for screen readers."* |
| `visual` | "Visual style" | Slide / visual guideline breach | *"Typography or logo safety zone violation on visual slides (e.g., text encroaching within 24px of the logo margin)."* |

### 4.2. Brand Health & Analytics Metrics
| Metric / Term | Current UI Usage | Technical Origin | Plain-Language Explanation |
|---|---|---|---|
| `latest_score` / `ScoreBadge` | "Brand Score (45/100)" | `score.ts: computeScore()` | Calculated out of 100: starts at 100; subtracts 15 for High severity ("Must Fix"), 7 for Medium ("Should Fix"), and 3 for Low ("Tip"). Dismissed issues restore points. |
| Score Tiers | Emerald / Amber / Rose | `score >= 85`, `score >= 60`, `score < 60` | - **85–100 (Ready to share)**: Excellent compliance, cleared for review/publishing.<br>- **60–84 (Needs a few tweaks)**: Minor issues or suggestions.<br>- **0–59 (Needs attention)**: Significant brand, legal, or factual issues that must be fixed. |
| `topViolations` | "Most Common Mistakes" | Aggregated issue counts | Phrases tripped most frequently across all submitted drafts in the organization. |
| `ambiguousRules` | "Confusing Rules Helper" | Group by `source_ref` having `>= 2` distinct creators | Brand rules that multiple different writers accidentally violate, proving the rule itself is poorly written or unclear and needs refinement. |
| `SelfHealingCard` | "Self-Healing Brand Rules & Ambiguity Clarifier" | Gemini LLM analysis of ambiguous rules | An AI assistant that analyzes repeated mistakes across the team, rewrites confusing guidelines into crystal-clear Do's and Don'ts, and updates the rulebook with 1 click. |
| `distinct_violators` | "Distinct Authors Confused" | SQL `COUNT(DISTINCT c.created_by)` | Number of different team members who have tripped this rule. |
| `source_ref` | E.g. `brand_guidelines_acme_v2:chunk_04` | RAG guideline vector chunk ID | The exact section of the official brand voice manual or technical spec that defines this rule. |

### 4.3. Raw Technical Jargon to Eliminate / Translate
| Raw Term in Code / UI | File / Location | Plain-Language Replacement |
|---|---|---|
| `"Round 3 Improvement 1"` | `SlideDeckScanner.tsx:61` | Replace with `"Visual Asset Scanner"` |
| `"Round 3 Improvement 3"` | `SelfHealingCard.tsx:65` | Replace with `"Smart Rule Assistant"` |
| `"pgvector RAG fact verification"` | `SlideDeckScanner.tsx:66` | Replace with `"Verified facts database cross-check"` |
| `"RAG Claim Contradiction"` | `SlideDeckScanner.tsx:211` | Replace with `"Fact Mismatch Detected"` |
| `"Logo Margin <24px"` | `SlideDeckScanner.tsx:154` | Replace with `"Logo Safety Margin Warning (<24px clearance)"` |
| `"synchronizes vector embeddings with 1 click"` | `SelfHealingCard.tsx:69` | Replace with `"updates the team rulebook with 1 click"` |
| `"Updating Guidelines & Vector Chunks..."` | `SelfHealingCard.tsx:195` | Replace with `"Updating Team Brand Guidelines..."` |
| `"5 rules loaded"` / `"chunk_count"` | `page.tsx:889` | Replace with `"5 guideline sections indexed"` |

---

## 5. Tooltips, Banners, and Status Indicators Audit

### 5.1. Tooltips Audit
- **Current State**:
  - Tooltips are virtually **absent**.
  - The few existing tooltips are basic HTML `title` attributes on buttons:
    - `Header.tsx:117`: `title="Sign out to return to home"`
    - `page.tsx:859`: `title="Remove from list"`
    - `SelfHealingCard.tsx:78`: `title="Refresh Analysis"`
    - `HighlightedText.tsx:66`: `title={`${issue.severity.toUpperCase()}: ${issue.explanation}`}` on `<mark>` tags.
- **Deficiencies**:
  - HTML `title` tooltips cannot be triggered with keyboard Tab/Enter/Space navigation.
  - They do not support rich text, icons, formatting, or links.
  - They are completely invisible on mobile or touch interfaces.
  - Screen readers often ignore or inconsistently read HTML `title` attributes.
- **Required Fix**:
  - Implement an accessible `HelperTooltip` component with:
    - Keyboard focus (`tabIndex={0}`, `role="tooltip"`, `aria-describedby`).
    - Visible focus ring on trigger icon (`HelpCircle` or `Info`).
    - High-contrast card with clean explanation and optional "Learn more" link.

### 5.2. Explanatory Banners Audit
- **Current State**:
  - **AI Fallback Banner**: Present in `page.tsx:550–582` when `latestReview?.status === 'failed' || aiError`. It displays:
    > ⚠️ **AI not responded — Rule checks only**  
    > The AI review model did not respond or is not configured. Rule-based checks (words to avoid, readability grade) were completed and are shown below. [Retry AI Check]
  - **Render Cold-Start Notice**: Present in `LoginScreen.tsx:122–127`.
- **Deficiencies**:
  - There is **no persistent or dismissible Onboarding Banner** on the Studio tab explaining what to do.
  - There is **no Network / Backend Fallback Banner** if `api.getContents()` or `api.getContent()` fails due to server downtime. If the API fails, `page.tsx` logs to `console.error` and leaves the UI in a blank or empty state (`"Select a draft from the left or create a new one to start checking"`), giving the user no explanation or recovery options.
- **Required Fix**:
  - Add an intuitive 3-Step Walkthrough Banner at the top of the Studio tab.
  - Add standard Fallback Notice Banners when cached or simulated sample data is being used during network outages (satisfying R1 & R2).

### 5.3. Visual Status Indicators Audit
- **Current State**:
  - `ScoreBadge`: Color-coded pill (`sm`, `md`) and summary card (`lg`). Uses green for >=85, amber for >=60, red for <60.
  - `IssueCard` badges:
    - Severity: `Must Fix` (red), `Should Fix` (amber), `Tip` (sky).
    - Type: `Word to avoid`, `Old term`, `Incorrect fact`, `Unproven claim`, `Tone mismatch`, `Hard to read`, `Visual style`.
    - Status: `Fix applied` (green check), `Skipped` (italic gray).
  - Draft sidebar status: `Draft`, `Checking...`, `Waiting for Review`, `Approved`, `Changes Needed`, `Published`.
  - Social publish character count meter: Green if within limit, red if exceeding limit.
- **Strengths**:
  - The severity and type labels in `IssueCard` are already mostly plain-English!
  - Color choices (emerald, amber, rose) follow intuitive traffic-light conventions.
- **Deficiencies**:
  - Status indicators lack tooltip definitions. A junior writer does not know why a claim is flagged as "Unproven claim" rather than "Incorrect fact".
  - Score badge does not indicate how close the score is to passing the approval threshold (e.g. "82/100 — 3 points away from Ready to Share").

---

## 6. Requirements Mapping: R2 and R3

### Requirement R2: Plain-Language Guidance and Interpretability
> *"Provide clear, everyday explanations across the entire end-to-end user journey (landing page, quick-start guide, analysis dashboard, and rule inspection) so any non-technical user immediately understands what Inkloom AI is, what it does, and how it works. Include an intuitive step-by-step onboarding walkthrough ('How it works: Step 1 -> Step 2 -> Step 3') and plain-English rule breakdowns."*

| R2 Sub-Requirement | Current Status | Specific Gap | Proposed Solution |
|---|---|---|---|
| **Everyday explanations across user journey** | Partially Met | Technical jargon persists in slide scanner, self-healing card, and analytics (`distinct_violators`, `vector chunks`, `RAG claim contradiction`). | Add a plain-language dictionary and sanitize all technical UI strings to everyday terms. |
| **Step-by-step onboarding walkthrough ("Step 1 -> Step 2 -> Step 3")** | **Not Met** | Only exists as static copy on the landing page; completely absent inside the workspace dashboard. | Implement an interactive `OnboardingWalkthrough` banner at the top of the Studio tab with steps: 1. Draft/Import, 2. Check & Fix, 3. Review & Publish. |
| **Plain-English rule breakdowns** | Partially Met | IssueCard has plain titles, but rule citations show raw IDs like `Acme Brand Voice Guide §2` or `brand_guidelines_acme_v2:chunk_04` without readable rule texts. | Provide an expandable/popover rule breakdown that quotes the exact guideline in plain English with Do's and Don'ts. |

### Requirement R3: UI Helper Components and Simplified Status Indicators
> *"Add intuitive helper UI components—such as a Quick-Start Guide, interactive helper tooltips for complex governance terms, and simplified visual status indicators—making key insights and brand health metrics easy to interpret at a glance."*

| R3 Sub-Requirement | Current Status | Specific Gap | Proposed Solution |
|---|---|---|---|
| **Quick-Start Guide** | **Not Met** | Completely missing from codebase. | Create a `QuickStartGuideModal` accessible via a "Quick-Start Guide" button in `Header.tsx` and a prompt in `page.tsx`. |
| **Interactive helper tooltips for governance terms** | **Not Met** | Only native browser HTML `title` attributes exist. No keyboard-accessible, ARIA-compliant rich tooltips. | Build an accessible `HelperTooltip` component and attach it to governance terms, issue badges, and brand score metrics. |
| **Simplified visual status indicators** | Partially Met | ScoreBadge and status pills exist, but lack contextual explanations, score calculation breakdowns, and passing threshold indicators. | Enhance `ScoreBadge` with an interactive breakdown popover showing point deductions (-15, -7, -3) and passing criteria. |

---

## 7. Recommended Architectural Design & Component Specifications

To implement R2 and R3 without disrupting the existing codebase or breaking integrity, the following modular component additions and enhancements are recommended:

### 1. `components/QuickStartModal.tsx`
- **Purpose**: Modal guide explaining the platform in 3 minutes.
- **Sections**:
  1. *Welcome & Mission*: What Inkloom AI is in simple terms.
  2. *3-Step Interactive Walkthrough*:
     - Step 1: Draft or Import Content (with quick-select demo drafts).
     - Step 2: Instant Brand Check & 1-Click Fixes (how AI scans tone, facts, and prohibited words).
     - Step 3: Approval Queue & Zero-API Social Publishing (how team review and 1-click share work).
  3. *Brand Score Explained*: Point scale breakdown (100 base, -15 Must Fix, -7 Should Fix, -3 Tip).
  4. *Role Guide*: Writer vs Reviewer vs Brand Lead vs Solo Creator.
- **Discoverability**:
  - Accessible via a new button in `Header.tsx`: `<button onClick={() => setQuickStartOpen(true)}>Quick-Start Guide</button>`.
  - Accessible via a banner button on the Studio dashboard.

### 2. `components/OnboardingWalkthrough.tsx`
- **Purpose**: A compact, friendly step-by-step card rendered at the top of the Studio tab for new sessions.
- **Features**:
  - Displays 3 steps with visual completion checkmarks:
    - `Step 1: Select or write a draft` (Marked complete when a draft is loaded).
    - `Step 2: Click 'Check My Words' & apply fixes` (Marked complete when fixes are applied or score >85).
    - `Step 3: Send for review or publish` (Marked complete when draft is submitted or published).
  - Can be dismissed or collapsed by the user (`Dismiss walkthrough` with localStorage persistence).

### 3. `components/HelperTooltip.tsx`
- **Purpose**: A reusable, keyboard-accessible tooltip component.
- **Accessibility Specs**:
  - Trigger has `tabIndex={0}`, `role="button"`, `aria-label="Help info"`, and `aria-describedby={tooltipId}`.
  - Visible focus ring with high-contrast indicator.
  - Supports hover and focus triggers with delay.
  - Esc key closes tooltip.

### 4. `components/ScoreBreakdownTooltip.tsx` (or enhanced `ScoreBadge.tsx`)
- **Purpose**: Explains exactly how the brand score is determined.
- **Content**:
  - Base Score: `100 points`
  - Current Deductions:
    - High Severity (Must Fix): `-15 points each`
    - Medium Severity (Should Fix): `-7 points each`
    - Low Severity (Tip): `-3 points each`
  - Thresholds: `>=85 Ready to Share`, `60–84 Needs a few tweaks`, `<60 Needs attention`.

### 5. Plain-Language Jargon Sanitation across Pages
- Remove all references to `"Round 3 Improvement X"`.
- Replace technical DB terms (`chunk_count`, `vector embeddings`, `distinct_violators`) with plain-English equivalents (`sections indexed`, `brand guidelines`, `team members confused`).

---

## 8. Summary of Findings

1. **User Journey**: The existing technical architecture is robust and feature-complete, but non-technical users lack handholding when transitioning from the landing page to the in-app dashboard.
2. **Onboarding**: No in-app onboarding walkthrough currently exists. A 3-step walkthrough banner is urgently needed.
3. **Quick-Start Guide**: Must be created and prominently linked in the universal Header and dashboard.
4. **Terminology**: Multiple pages expose raw AI/database terminology that should be sanitized to plain English.
5. **Tooltips & Indicators**: Existing tooltips are purely static HTML `title` attributes with zero keyboard accessibility. An accessible `HelperTooltip` component is required to explain governance rules and brand score metrics.
