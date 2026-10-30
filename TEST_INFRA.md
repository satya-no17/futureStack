# Inkloom AI — Test Infrastructure & Verification Architecture (TEST_INFRA.md)

**Project**: Inkloom AI — Error-Free, Accessible Brand Governance Platform  
**Document**: Test Infrastructure Specification  
**Version**: 1.0.0  
**Status**: ACTIVE  
**Last Updated**: 2026-10-29  

---

## 1. Executive Summary & Verification Philosophy

Inkloom AI is a pre-publication brand governance platform designed for multi-tenant organizations (Acme Enterprise, Zest Social, Solo Studio). To guarantee that the application operates without unhandled runtime crashes, adheres strictly to WCAG AA accessibility standards, provides plain-language onboarding, and navigates seamlessly across all primary workspaces, this document defines the authoritative **End-to-End (E2E) Test Infrastructure**.

### 1.1 Core Verification Principles
1. **Opaque-Box Requirement-Driven Testing**: Tests are derived strictly from user requirements documented in `ORIGINAL_REQUEST.md` and interface contracts in `PROJECT.md`, rather than matching implementation quirks.
2. **Anti-Facade / Zero-Cheat Mandate**: Facade tests that trivially return `true` or test mock tautologies are strictly forbidden. All tests exercise real code paths, mathematical calculations, DOM element semantics, and network states.
3. **Dual Execution Engine (Static AST/Component & Live Server)**:
   - **Static & Component Engine**: Analyzes TypeScript/JSX files, component exports, prop types, error boundary contracts, ARIA attributes, keyboard event handlers, and relative luminance contrast calculations without requiring a running server.
   - **Live Endpoint Probing**: When local servers are active (`localhost:3000` for Next.js, `localhost:3001` for Express API), probes real HTTP endpoints, evaluates response payloads, detects unhandled console errors, and verifies simulated failure modes.
4. **Deterministic Exit Codes**:
   - `exit 0`: All asserted test cases within the selected scope passed cleanly.
   - `exit 1`: One or more test cases within the selected scope failed.

---

## 2. Requirement Mapping to Acceptance Criteria

| Requirement | Acceptance Criteria (from ORIGINAL_REQUEST.md) | Test Focus Areas | Primary Target Files |
|---|---|---|---|
| **R1. Error Resilience & Fallbacks** | - Simulated backend/AI outages return no unhandled UI crashes or blank screens.<br>- UI displays cached/simulated data + visible fallback banner.<br>- Zero uncaught JavaScript errors or unhandled promise rejections. | Next.js route error boundaries, React component error boundaries, resilient API client interceptor, fallback data schemas, safe tab transitions. | `apps/web/app/error.tsx`<br>`apps/web/app/global-error.tsx`<br>`apps/web/components/ErrorBoundary.tsx`<br>`apps/web/components/FallbackBanner.tsx`<br>`apps/web/lib/api.ts`<br>`apps/web/lib/fallbackData.ts`<br>`apps/web/app/page.tsx` |
| **R2. Plain-Language Guidance** | - Prominent 3-step walkthrough on dashboard explaining platform purpose.<br>- Technical jargon sanitized and explained in plain English.<br>- Quick-start guide present and accessible. | 3-step walkthrough widget, Quick-Start Guide modal, jargon sanitization (`pgvector`, `chunk_count`, `Round 3`). | `apps/web/components/OnboardingWalkthrough.tsx`<br>`apps/web/components/QuickStartModal.tsx`<br>`apps/web/components/Header.tsx`<br>`apps/web/app/page.tsx` |
| **R3. UI Helper Components & Status** | - Interactive helper tooltips for complex governance terms.<br>- Simplified visual status indicators and transparent brand score breakdown. | Accessible tooltips (`role="tooltip"`, `tabIndex={0}`), Brand score breakdown formula ($100 - 15H - 7M - 3L$). | `apps/web/components/HelperTooltip.tsx`<br>`apps/web/components/ScoreBadge.tsx`<br>`apps/web/components/IssueCard.tsx` |
| **R4. Accessibility & Usability** | - Visible focus outlines (`:focus-visible` >= 2px).<br>- WCAG AA contrast (>= 4.5:1 normal, >= 3:1 large).<br>- Interactive spans/cards keyboard accessible (`tabIndex`, `role="button"`, `Enter`/`Space`).<br>- Descriptive ARIA labels on inputs, filters, icons, dialogs. | Global CSS focus rings, relative luminance calculations, keyboard handlers on `<mark>` and cards, dialog semantics and Escape key dismiss. | `apps/web/app/globals.css`<br>`apps/web/components/HighlightedText.tsx`<br>`apps/web/components/IssueCard.tsx`<br>`apps/web/components/DiffView.tsx`<br>`apps/web/components/ContrastCheckerModal.tsx` |
| **Navigation & Workspaces** | - Seamless transitions across all 8 primary workspaces.<br>- Safe error handling during tab navigation during outages. | 8 active tabs (`studio`, `slides`, `approvals`, `governance`, `analytics`, `audit`, `a11y`, `multitenant`), modal dialogs. | `apps/web/app/page.tsx`<br>`apps/web/components/Header.tsx` |

---

## 3. The 4-Tier Test Architecture

The verification suite organizes test cases into 4 rigorous tiers:

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 4: Real-World Workload Scenarios                       │
│  - E2E User Journeys (Creator, Outage/Recovery, Auditor)    │
├─────────────────────────────────────────────────────────────┤
│ Tier 3: Cross-Feature Combinations                          │
│  - Offline Tab Navigation + Banner + QuickStart Coexistence │
├─────────────────────────────────────────────────────────────┤
│ Tier 2: Boundary & Corner Cases                             │
│  - Network Timeouts, HTTP 500, Corrupted Cache, Long Inputs │
├─────────────────────────────────────────────────────────────┤
│ Tier 1: Feature Coverage (>= 5 Tests per Feature)           │
│  - Resilience, Onboarding, Accessibility, Navigation        │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Tier 1: Feature Coverage (24 Test Cases)
Equivalence class representatives verifying primary functional behavior:
- **Resilience (6 tests)**:
  - `T1.1.1`: Next.js & React error boundary contracts (`app/error.tsx`, `app/global-error.tsx`, `components/ErrorBoundary.tsx`).
  - `T1.1.2`: Fallback dataset completeness (`apps/web/lib/fallbackData.ts` with typed mocks for contents, details, guidelines, facts, banned terms, analytics, audit logs).
  - `T1.1.3`: API client offline interceptor catches network/500 errors and serves fallback data without throwing unhandled exceptions.
  - `T1.1.4`: Reactive fallback state signaling (`isFallbackActive`, `getFallbackReason`, `setSimulatedFailure`, `subscribeToFallbackState`).
  - `T1.1.5`: Friendly fallback notice banner (`apps/web/components/FallbackBanner.tsx` with non-alarmist status, retry button, dismiss action).
  - `T1.1.6`: Safe initial data loading and empty state fallback rendering.
- **Onboarding & Guidance (6 tests)**:
  - `T1.2.1`: In-app 3-step walkthrough component on dashboard (`OnboardingWalkthrough.tsx` with Step 1 -> Step 2 -> Step 3).
  - `T1.2.2`: Quick-Start Guide modal component (`QuickStartModal.tsx` with end-to-end instructions and role cheat sheets).
  - `T1.2.3`: Header navigation and dashboard trigger for Quick-Start Guide.
  - `T1.2.4`: Interactive accessible helper tooltips (`HelperTooltip.tsx` with keyboard focus and `role="tooltip"`).
  - `T1.2.5`: Brand score transparency and deduction formula explanation in `ScoreBadge.tsx`.
  - `T1.2.6`: Sanitization of raw technical jargon (`pgvector`, `chunk_count`, `Round 3`, `distinct_violators`).
- **Accessibility Standards (7 tests)**:
  - `T1.3.1`: Global visible `:focus-visible` ring definition in `apps/web/app/globals.css` (>= 2px outline with offset).
  - `T1.3.2`: WCAG AA color contrast verification (evaluates relative luminance on all text color tokens against backgrounds to enforce >= 4.5:1, catching `#9ca3af`/`text-gray-400`).
  - `T1.3.3`: Keyboard navigability on highlighted text spans (`HighlightedText.tsx` `<mark>` tags have `tabIndex={0}`, `role="button"`, and `onKeyDown`).
  - `T1.3.4`: Keyboard navigability on issue cards and draft items (`IssueCard.tsx` and sidebar cards).
  - `T1.3.5`: Modal accessibility & focus management (`role="dialog"`, `aria-modal="true"`, and `Escape` key dismiss).
  - `T1.3.6`: Descriptive ARIA labels on search inputs, filter dropdowns, and icon buttons.
  - `T1.3.7`: Screen-reader accessible diff announcements in `DiffView.tsx` (`<ins>`, `<del>`, or `sr-only`).
- **Navigation (5 tests)**:
  - `T1.4.1`: 8 primary workspace tab navigation contracts (`studio`, `slides`, `approvals`, `governance`, `analytics`, `audit`, `a11y`, `multitenant`).
  - `T1.4.2`: Safe tab switching transitions wrapped in `try/catch` eliminating unhandled promise rejections.
  - `T1.4.3`: Overlay modal state management (New Draft, Decision, Social Publish, Quick Start).
  - `T1.4.4`: Role-based persona view permissions (Admin, Reviewer, Creator, Solo).
  - `T1.4.5`: Studio two-column split layout and issue selection binding.

### 3.2 Tier 2: Boundary & Corner Cases (8 Test Cases)
- `T2.1`: Simulated network timeout (>10s fetch delay recovers via fallback cache without UI freeze).
- `T2.2`: Simulated HTTP 500/502/503 server errors (gracefully returns cached/sample data with descriptive fallback reason).
- `T2.3`: Corrupted or invalid JSON in localStorage (recovers with default state without crashing).
- `T2.4`: Zero drafts returned from server (renders sample fallback drafts or informative empty state).
- `T2.5`: Extreme input length handling (draft titles >500 chars or bodies >50,000 chars handled without crashing highlighter).
- `T2.6`: Color contrast boundary conditions (pure black #000000, pure white #ffffff, and threshold boundary #767676).
- `T2.7`: Rapid consecutive tab switching stress test (rapid tab switches do not cause race conditions or unhandled rejections).
- `T2.8`: Unauthenticated / expired session handling (graceful state reset without alert popup loops).

### 3.3 Tier 3: Cross-Feature Combinations (6 Test Cases)
- `T3.1`: Full tab navigation while in offline fallback mode (switching through all 8 tabs emits ZERO console errors).
- `T3.2`: Quick-Start Guide modal coexistence with Fallback Notice Banner (no layout collision or backdrop focus trap conflicts).
- `T3.3`: Keyboard navigation within Fallback Notice Banner (retry button, dismiss button, and simulation badge operable via Tab/Enter).
- `T3.4`: Contrast compliance of status and notice banners (warning amber, info violet, and slate badges all meet >= 4.5:1).
- `T3.5`: 1-Click fix execution in offline fallback mode (applying fixes locally updates draft version and recalculates score).
- `T3.6`: Tooltip behavior inside modal backdrops (tooltips inside modals retain focus and close safely on `Escape`).

### 3.4 Tier 4: Real-World Workload Scenarios (4 End-to-End Scenarios)
- `T4.1`: **Canonical Creator Journey**: Landing page -> Quick-Start Tour -> Studio dashboard -> Inspect highlighted issue -> Apply 1-click fix -> Score increases.
- `T4.2`: **Outage & Recovery Journey**: Normal mode -> Backend outage simulated -> Fallback Banner appears -> Fallback drafts accessible -> Tab switching operable -> Live connection restored.
- `T4.3`: **Keyboard-Only Auditor Journey**: Tab to header -> Navigate to Studio -> Tab to draft item -> Enter -> Tab to highlighted issue -> Enter -> Inspect issue card -> Tab to fix -> Enter.
- `T4.4`: **Reviewer Sign-Off Journey**: Approvals tab -> Inspect diff view -> Verify accessible added/removed spans -> Open decision dialog -> Dismiss with Escape -> Re-open and approve.

---

## 4. Authoritative Oracles & Mathematical Specifications

### 4.1 WCAG 2.1 / 2.2 Relative Luminance & Contrast Formula
The test runner calculates exact contrast ratios using the W3C WCAG 2.1 specification:
1. Normalize sRGB color channels ($R, G, B \in [0, 1]$):
   $$C_{\text{linear}} = \begin{cases} \frac{C}{12.92} & \text{if } C \le 0.04045 \\ \left(\frac{C + 0.055}{1.055}\right)^{2.4} & \text{if } C > 0.04045 \end{cases}$$
2. Compute relative luminance:
   $$L = 0.2126 R_{\text{linear}} + 0.7152 G_{\text{linear}} + 0.0722 B_{\text{linear}}$$
3. Calculate contrast ratio between foreground ($L_1$) and background ($L_2$) where $L_1 \ge L_2$:
   $$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$
4. Compliance Criteria:
   - **Normal Text**: Ratio must be $\ge 4.5:1$.
   - **Large Text** ($\ge 18\text{pt}$ or $\ge 14\text{pt}$ bold): Ratio must be $\ge 3.0:1$.
   - **Critical Check**: The color `#9ca3af` (`text-gray-400`) on white (`#ffffff`) yields $2.54:1$ and **fails**. The test asserts that all replacements (e.g., `#6b7280` at $4.55:1$ or `#4b5563` at $7.0:1$) pass.

### 4.2 Brand Health Score Formula
The platform's scoring oracle computes scores out of 100:
$$\text{Score} = \max\left(0, \min\left(100, 100 - (15 \times H) - (7 \times M) - (3 \times L)\right)\right)$$
Where:
- $H$ = count of active High severity issues ("Must Fix")
- $M$ = count of active Medium severity issues ("Should Fix")
- $L$ = count of active Low severity issues ("Tip")
- Dismissed or accepted issues are subtracted from active penalties.
The test verifies that `ScoreBadge.tsx` and fallback calculation routines adhere strictly to this formula.

### 4.3 Resilience & Fallback State Machine
```
   [ Normal Operation ]
           │
           │ (Fetch Failure: Network Offline, Timeout, HTTP 500, or simulate_failure=true)
           ▼
   [ Fallback Active ] ◄── Emit Fallback State Signal (isFallbackActive = true)
           │           ◄── Render FallbackBanner with status & retry button
           │           ◄── Return High-Fidelity Typed Mock Data from fallbackData.ts
           │
           │ (User clicks "Retry Connection" or network recovers)
           ▼
   [ Reconnecting ]
      ├── Successful: Return to [ Normal Operation ] (isFallbackActive = false)
      └── Failed: Remain in [ Fallback Active ]
```

---

## 5. Test Runner Specification (`scripts/verify-resilience.mjs`)

The test runner is implemented in modern Node.js ESM (`.mjs`) with zero third-party npm runtime dependencies, ensuring high portability across local development and CI/CD pipelines.

### 5.1 Command-Line Options
```bash
node scripts/verify-resilience.mjs [options]
```

| Flag | Parameter | Description |
|---|---|---|
| `--all` | - | Runs all tests across all 4 tiers (default). |
| `--tier` | `1`, `2`, `3`, `4` | Runs only tests belonging to the specified tier. |
| `--milestone` | `m1`, `m2`, `m3`, `all` | Filters tests by feature milestone assignment. |
| `--feature` | `resilience`, `onboarding`, `a11y`, `navigation` | Filters tests by feature domain. |
| `--mode` | `auto`, `static`, `live` | `auto`: uses live server if reachable, falls back to static. `static`: offline code/AST analysis only. `live`: strictly probes live HTTP endpoints. |
| `--baseline` | - | Records baseline results for `TEST_READY.md` without failing exit code. |
| `--strict` | - | Forces exit code 1 if any asserted test in the active filter fails (default). |
| `--json` | - | Outputs raw test results in structured JSON format. |
| `--help` | - | Displays usage help and available flags. |

### 5.2 Exit Code Semantics
- **Strict Mode** (default):
  - `exit 0`: 100% of selected tests passed.
  - `exit 1`: One or more selected tests failed.
- **Baseline Mode** (`--baseline`):
  - Always executes the full suite, outputs the baseline matrix, and exits `0` to facilitate progressive milestone tracking and automated report generation.

---

## 6. Execution Commands & Workflows

### 6.1 Running the Full Test Suite
```bash
# Execute entire 4-tier verification suite
node scripts/verify-resilience.mjs

# Via package.json script (if configured)
npm run test:e2e
```

### 6.2 Milestone-Specific Verification
```bash
# Milestone 1: Error Resilience & Fallback Infrastructure
node scripts/verify-resilience.mjs --milestone=m1

# Milestone 2: Plain-Language Onboarding & Guidance
node scripts/verify-resilience.mjs --milestone=m2

# Milestone 3: Accessibility & Usability Standards
node scripts/verify-resilience.mjs --milestone=m3
```

### 6.3 Tier-Specific Verification
```bash
# Feature coverage only
node scripts/verify-resilience.mjs --tier=1

# Boundary & corner cases
node scripts/verify-resilience.mjs --tier=2

# Cross-feature combinations
node scripts/verify-resilience.mjs --tier=3

# Real-world workload scenarios
node scripts/verify-resilience.mjs --tier=4
```

### 6.4 Baseline Documentation
```bash
# Generate baseline status matrix for TEST_READY.md
node scripts/verify-resilience.mjs --baseline
```

---

## 7. Artifacts & Reporting Deliverables

Upon test suite execution, the following artifacts are produced:
1. **Terminal Report**: Colorized, formatted table with test ID, description, tier, feature, duration, and status (✅ PASS, ❌ FAIL, ⏳ PENDING).
2. **`TEST_READY.md`**: Authoritative readiness document in the project root containing test summary statistics, feature checklist, and reproducibility proof.
3. **Structured JSON Output**: Accessible via `--json` for CI/CD test result ingestion.
