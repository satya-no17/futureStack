# Inkloom AI — Milestone 2 Adversarial Stress Test Results

**Date**: 2026-10-29  
**Challenger**: Challenger 1 (EMPIRICAL CHALLENGER — critic, specialist)  
**Target Milestone**: Milestone 2 (Plain-Language Onboarding, Quick-Start Guide & Governance Interpretability)  
**Assigned Working Directory**: `/home/satya/projects/hackathon/.agents/teamwork/teamwork_challenger_m2_1/`  
**Verdict**: **REJECT WITH DEFECTS** (Empirical defects confirmed: unhandled crash on out-of-bounds steps in `QuickStartModal`, unhandled SecurityError on restricted `localStorage` in `OnboardingWalkthrough`, and residual technical jargon `pgvector` / `RAG-powered AI` in `LandingPage.tsx`)

---

## 1. Test Harness Overview

A dedicated, comprehensive adversarial test harness was authored and executed at `scripts/adversarial-stress-m2.ts`:
- **Total Tests Executed**: 33 tests across 6 dedicated test suites.
- **Passed Tests**: 25 tests (75.8%).
- **Confirmed Defects**: 8 test assertions reproducing concrete failure modes.
- **Unhandled Exceptions / Rejections in Runner**: 0 (all errors caught and verified under test assertions).

In addition, the following verification commands were executed:
1. `node scripts/verify-resilience.mjs --milestone=m2` (8/8 PASS)
2. `npm run build --workspace=apps/web` (Next.js 16.4.3 Turbopack build: Exit code 0)
3. `cd apps/web && npx eslint components/QuickStartModal.tsx components/OnboardingWalkthrough.tsx components/HelperTooltip.tsx components/ScoreBadge.tsx components/Header.tsx` (Exit code 0, 0 errors, 0 warnings)

---

## 2. Adversarial Execution Log (`scripts/adversarial-stress-m2.ts`)

### Command
```bash
npx ts-node --transpile-only -O '{"module":"commonjs","jsx":"react-jsx"}' scripts/adversarial-stress-m2.ts
```

### Raw Output Log
```text
========================================================================
  Inkloom AI — Challenger 1 Adversarial Stress Test Harness (Milestone 2)
========================================================================

--- SUITE 1: QuickStartModal Out-of-Bounds Step Index & Crash Probing ---
  ✓ PASS [SUITE 1] QuickStartModal renders valid initialStep=0 (15ms)
    ↳ Rendered dialog HTML length: 11158 chars
  ✓ PASS [SUITE 1] QuickStartModal renders valid initialStep=1 (4ms)
    ↳ Rendered dialog HTML length: 11140 chars
  ✓ PASS [SUITE 1] QuickStartModal renders valid initialStep=2 (3ms)
    ↳ Rendered dialog HTML length: 11352 chars
  ✓ PASS [SUITE 1] QuickStartModal renders valid initialStep=3 (3ms)
    ↳ Rendered dialog HTML length: 11112 chars
  ⚠️ DEFECT [SUITE 1] QuickStartModal handles negative step initialStep=-1 (1ms)
    ↳ Crash confirmed: Cannot read properties of undefined (reading 'icon') (steps[-1] is undefined)
  ⚠️ DEFECT [SUITE 1] QuickStartModal handles negative step initialStep=-100 (1ms)
    ↳ Crash confirmed: Cannot read properties of undefined (reading 'icon') (steps[-100] is undefined)
  ⚠️ DEFECT [SUITE 1] QuickStartModal handles out-of-bounds step initialStep=4 (1ms)
    ↳ Crash confirmed: Cannot read properties of undefined (reading 'icon') (steps[4] is undefined; 4 steps defined)
  ⚠️ DEFECT [SUITE 1] QuickStartModal handles out-of-bounds step initialStep=5 (1ms)
    ↳ Crash confirmed: Cannot read properties of undefined (reading 'icon') (steps[5] is undefined; 4 steps defined)
  ⚠️ DEFECT [SUITE 1] QuickStartModal handles out-of-bounds step initialStep=999 (0ms)
    ↳ Crash confirmed: Cannot read properties of undefined (reading 'icon') (steps[999] is undefined; 4 steps defined)
  ✓ PASS [SUITE 1] QuickStartModal returns null when isOpen=false even with out-of-bounds step (0ms)
    ↳ Correctly short-circuited when closed

--- SUITE 2: OnboardingWalkthrough LocalStorage Corruption & SSR Stress ---
  ✓ PASS [SUITE 2] OnboardingWalkthrough renders cleanly during SSR (window undefined) (6ms)
    ↳ Walkthrough rendered full banner during SSR
  ✓ PASS [SUITE 2] OnboardingWalkthrough handles null localStorage.getItem without throwing (3ms)
    ↳ Safely defaults to active walkthrough
  ✓ PASS [SUITE 2] OnboardingWalkthrough with corrupted value "{malformed: json}" (2ms)
    ↳ Value !== "true", safely rendered full guide
  ✓ PASS [SUITE 2] OnboardingWalkthrough with corrupted value "undefined" (2ms)
    ↳ Value !== "true", safely rendered full guide
  ✓ PASS [SUITE 2] OnboardingWalkthrough with corrupted value "NaN" (2ms)
    ↳ Value !== "true", safely rendered full guide
  ✓ PASS [SUITE 2] OnboardingWalkthrough with corrupted value "12345" (1ms)
    ↳ Value !== "true", safely rendered full guide
  ✓ PASS [SUITE 2] OnboardingWalkthrough with corrupted value "null" (2ms)
    ↳ Value !== "true", safely rendered full guide
  ✓ PASS [SUITE 2] OnboardingWalkthrough with corrupted value "[object Object]" (2ms)
    ↳ Value !== "true", safely rendered full guide
  ✓ PASS [SUITE 2] OnboardingWalkthrough with corrupted value "true-invalid" (1ms)
    ↳ Value !== "true", safely rendered full guide
  ✓ PASS [SUITE 2] OnboardingWalkthrough renders minimized state when dismissed in localStorage (0ms)
    ↳ Rendered compact recovery pill with "Show Tour" button
  ⚠️ DEFECT [SUITE 2] OnboardingWalkthrough handles SecurityError in localStorage gracefully (0ms)
    ↳ Crash confirmed on restricted storage: SecurityError: The operation is insecure.

--- SUITE 3: HelperTooltip Keyboard Accessibility, State Transitions & Dismissal ---
  ✓ PASS [SUITE 3] HelperTooltip renders accessible trigger (role=button, tabIndex=0, aria-expanded=false) (1ms)
    ↳ WCAG 2.1 compliance verified on trigger element
  ✓ PASS [SUITE 3] HelperTooltip implements Enter and Space key activation (0ms)
    ↳ Enter/Space toggles popover state with preventDefault
  ✓ PASS [SUITE 3] HelperTooltip implements Escape key dismissal and focus restoration (0ms)
    ↳ Dual-layer Escape listener (local trigger + document keydown)
  ✓ PASS [SUITE 3] HelperTooltip implements outside mousedown dismissal (0ms)
    ↳ Document mousedown listener checks containerRef.current.contains(target)
  ✓ PASS [SUITE 3] HelperTooltip provides z-50 elevation, role="tooltip", and aria-describedby (0ms)
    ↳ Meets WAI-ARIA tooltip design pattern

--- SUITE 4: Technical Jargon & Plain-Language Audit Across User-Facing Views ---
  ✓ PASS [SUITE 4] All user-facing components sanitized of "Round 3" internal jargon (0ms)
    ↳ Zero occurrences of "Round 3" found
  ⚠️ DEFECT [SUITE 4] Check presence of raw "pgvector" in LandingPage.tsx (0ms)
    ↳ Defect confirmed: LandingPage.tsx:315 contains raw jargon "pgvector semantic search"
  ⚠️ DEFECT [SUITE 4] Check presence of raw "RAG-powered" jargon in LandingPage.tsx (0ms)
    ↳ Defect confirmed: LandingPage.tsx lines 203 & 315 contain raw AI jargon "RAG-powered AI"
  ✓ PASS [SUITE 4] page.tsx masks raw variable name "chunk_count" with plain English in UI (0ms)
    ↳ Correctly displays "{g.chunk_count} rules loaded" and "{f.chunk_count} facts verified"

--- SUITE 5: ScoreBadge Deterministic Formula & Boundary Matrix ---
  ✓ PASS [SUITE 5] Score formula oracle matches specifications: 100 - (15H + 7M + 3L) (0ms)
    ↳ All 7 severity vector permutations verified
  ✓ PASS [SUITE 5] ScoreBadge boundary matrix (24 combinations rendered) (12ms)
    ↳ Zero crashes across 24 combinations

--- SUITE 6: Header Component Navigation & Quick-Start Trigger ---
  ✓ PASS [SUITE 6] Header provides accessible Quick-Start Guide trigger with aria-label and focus-visible (0ms)
    ↳ Trigger present, labeled, and keyboard-styled

========================================================================
  CHALLENGER 1 ADVERSARIAL STRESS TEST SUMMARY
========================================================================
  Total Tests Executed        : 33
  Passed Tests                : 25
  Defects Confirmed           : 8
  Unexpected Test Failures    : 0
  Unhandled Rejections Seen   : 0
  Uncaught Exceptions Seen    : 0
========================================================================

⚠️ EMPIRICAL DEFECTS DISCOVERED AND DOCUMENTED.
```

---

## 3. Detailed Empirical Defect Analysis

### Defect 1: `QuickStartModal` crashes on out-of-bounds step index
- **Observation**:
  `apps/web/components/QuickStartModal.tsx` defines:
  ```tsx
  export function QuickStartModal({
    isOpen,
    onClose,
    initialStep = 0,
    onNavigateTab
  }: QuickStartModalProps) {
    const [currentStep, setCurrentStep] = useState(initialStep);
    ...
    const steps = [ /* 4 step definitions: indices 0, 1, 2, 3 */ ];
    const currentStepData = steps[currentStep];
    ...
    <currentStepData.icon className="w-6 h-6" /> // Line 296
  ```
- **Reproduction**:
  Rendering `<QuickStartModal isOpen={true} onClose={() => {}} initialStep={-1} />` or `initialStep={4}` or `initialStep={5}` throws:
  `TypeError: Cannot read properties of undefined (reading 'icon')`.
- **Root Cause**: Missing bounds checking or clamping on `currentStep` during render (`Math.max(0, Math.min(steps.length - 1, currentStep || 0))`).
- **Mitigation Proposal**:
  ```tsx
  const safeStep = Math.max(0, Math.min(steps.length - 1, currentStep || 0));
  const currentStepData = steps[safeStep] || steps[0];
  ```

### Defect 2: `OnboardingWalkthrough` crashes on restricted storage environments
- **Observation**:
  `apps/web/components/OnboardingWalkthrough.tsx` lines 30-35:
  ```tsx
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('inkloom_onboarding_dismissed') === 'true';
    }
    return false;
  });
  ```
- **Reproduction**:
  In an iframe sandbox, private browsing mode with storage disabled, or security-restricted environment where accessing `window.localStorage` throws a `DOMException` / `SecurityError`, component initialization immediately crashes with:
  `SecurityError: The operation is insecure.`
- **Mitigation Proposal**:
  Wrap `localStorage.getItem` and `localStorage.setItem` in `try { ... } catch { return false; }`.

### Defect 3: Residual raw technical jargon (`pgvector`, `RAG-powered AI`) in `LandingPage.tsx`
- **Observation**:
  In `apps/web/components/LandingPage.tsx`:
  - **Line 203**: `desc: 'Every draft is automatically audited against your brand voice guidelines, verified facts, and banned terms using RAG-powered AI.'`
  - **Line 315**: `Built with RAG-powered AI and pgvector semantic search, Inkloom goes beyond simple keyword matching.`
  - **Line 345**: `Unlike regex-based tools, Inkloom uses vector embeddings to understand the meaning behind your brand guidelines...`
- **Violation**:
  - `ORIGINAL_REQUEST.md` R2: "Provide clear, everyday explanations across the entire end-to-end user journey (landing page, quick-start guide, analysis dashboard, and rule inspection) so any non-technical user immediately understands what Inkloom AI is, what it does, and how it works."
  - `PROJECT.md` F10: "Technical Jargon Sanitization: Replace internal jargon (pgvector, chunk_count, Round 3) with plain language."
- **Root Cause**:
  `scripts/verify-resilience.mjs` test `T1.2.6` only inspected `SlideDeckScanner.tsx`, `SelfHealingCard.tsx`, and `page.tsx`, so Worker M2 omitted `LandingPage.tsx`.
- **Mitigation Proposal**:
  Replace `pgvector semantic search` and `RAG-powered AI` with plain-language equivalents:
  - Line 203: "using intelligent contextual brand safety checks."
  - Line 315: "Built with AI-powered contextual understanding and semantic brand intelligence..."
  - Line 345: "Inkloom understands the deep meaning behind your brand guidelines..."
