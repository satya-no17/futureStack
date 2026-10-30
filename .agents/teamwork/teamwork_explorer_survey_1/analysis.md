# Comprehensive Codebase & Stack Survey: Inkloom AI
**Role**: Explorer 1 (Codebase & Stack Explorer)  
**Milestone**: Step 0: Survey  
**Target Repository**: `/home/satya/projects/hackathon`  
**Date**: 2026-10-29  

---

## 1. Executive Summary

Inkloom AI is an automated pre-publication brand governance platform designed for multi-tenant teams (Acme Enterprise Solutions, Zest Social App, Solo Studio). It provides pre-publication content audits across tone of voice, factual claim verification, banned/outdated terminology, accessibility, slide deck layouts, and zero-API social publishing.

While the backend architecture (`apps/api`) features robust database schemas (PostgreSQL + pgvector), deterministic local vector embedding fallbacks, and multi-tenant isolation, the **frontend client (`apps/web`) currently exhibits severe vulnerabilities regarding error resiliency, offline/simulated fallback handling, accessibility, and user guidance**:
1. **No Error Boundaries**: There are zero Next.js error boundaries (`app/error.tsx`, `app/global-error.tsx`) and zero React component-level error boundaries. Any uncaught component exception causes a complete blank screen crash.
2. **Brittle API & Network Error Handling**: `apps/web/lib/api.ts` throws directly on HTTP non-200 or network failure (`TypeError: Failed to fetch`). It possesses no offline caching layer, no mock/simulated fallback data, and no fallback notice banners for server or network errors.
3. **Unhandled Promise Rejections During Outages**: Tab navigation in `apps/web/app/page.tsx:303-324` (`handleTabChange`) contains no `try/catch` wrappers around API calls for governance rules, analytics, and audit logs. When endpoints are unreachable, it emits unhandled promise rejections directly in the browser console.
4. **Auth Context Eviction on Outage**: `apps/web/lib/authContext.tsx:32-35` wipes user credentials and localStorage tokens upon any transient backend failure, immediately ejecting the user to the landing page.
5. **No Frontend Test Suites or Automated Verification Script**: Neither `apps/web` nor the root package provides test runners (Jest, Vitest, Playwright). The automated verification suite required by `ORIGINAL_REQUEST.md` to verify error boundary recovery, fallback state rendering, and route navigation is entirely absent.
6. **Accessibility & Guidance Gaps**: Zero `aria-*` attributes exist across `apps/web`. Zero `:focus-visible` styling is configured. Text color `#9ca3af` (`text-gray-400`) fails WCAG AA contrast (2.54:1 vs 4.5:1 required). No in-app Quick-Start Guide or 3-step walkthrough exists for authenticated users.

---

## 2. Codebase Structure & Monorepo Organization

The project is structured as an npm monorepo with workspace configuration at the root:

```
/home/satya/projects/hackathon/
├── package.json              # Monorepo workspaces config ("apps/*")
├── package-lock.json         # Unified dependency lockfile
├── README.md                 # Project architecture, demo accounts, walkthrough
├── render.yaml               # Render cloud deployment blueprint (web service)
├── apps/
│   ├── api/                  # Express + TypeScript + PostgreSQL + pgvector backend
│   │   ├── package.json      # Dependencies and scripts (tsc, dev, start, seed)
│   │   ├── tsconfig.json     # TypeScript config (ES2022, NodeNext/CommonJS)
│   │   ├── .env              # DB URL (Neon DB), JWT secret, Gemini API key
│   │   ├── src/
│   │   │   ├── index.ts      # Server entrypoint, middleware, route mounting
│   │   │   ├── ai/           # LLM wrapper (Gemini/Ollama), prompt templates, schemas, embeddings
│   │   │   ├── db/           # pg connection pool, schema.sql, seed.ts, migrations
│   │   │   ├── middleware/   # JWT auth, role validation, centralized error handler
│   │   │   ├── routes/       # 14 modular routers (auth, contents, reviews, facts, etc.)
│   │   │   └── services/     # Ingestion, review pipeline, publishers, analytics, audit
│   │   ├── test_round3_features.ts  # Verification for slide scanner, social intents, self-healing
│   │   ├── test_drafts.ts           # 10 sample drafts test suite against review engine
│   │   └── test_e2e_flow.ts         # End-to-end HTTP integration test suite
│   └── web/                  # Next.js 16 (App Router) + React 19 + Tailwind CSS v4 frontend
│       ├── package.json      # Dependencies (next, react, lucide-react, diff, tailwindcss)
│       ├── next.config.ts    # Turbopack, Tailwind loader, component cache
│       ├── tsconfig.json     # Path aliases (@/*), React JSX preserve
│       ├── app/
│       │   ├── layout.tsx    # Root layout, Google Fonts (Inter), AuthProvider
│       │   ├── globals.css   # Tailwind v4 import, custom scrollbar, diff highlights
│       │   ├── page.tsx      # Main application dashboard (single-page tab orchestrator)
│       │   └── favicon.ico
│       ├── components/       # 13 UI components (Header, IssueCard, ScoreBadge, etc.)
│       └── lib/
│           ├── api.ts        # Typed API client and data interfaces
│           └── authContext.tsx # React Context for user/organization auth state
└── scripts/
    └── generate_round2_pdf.py # ReportLab PDF submission builder
```

---

## 3. Tech Stack Breakdown

| Component | Layer | Technology / Package | Version | Purpose & Rationale |
|---|---|---|---|---|
| **Monorepo** | Workspace Manager | npm workspaces | v10+ | Coordinates `apps/api` and `apps/web` |
| **Backend** | Runtime & Language | Node.js / TypeScript | TS `5.8.2` | Typed execution via `ts-node` `10.9.2` |
| **Backend** | Web Framework | Express | `4.21.2` | RESTful API server |
| **Backend** | Database | PostgreSQL (Neon DB) | `pg` `8.13.3` | Relational multi-tenant data store |
| **Backend** | Vector Engine | `pgvector` | `0.2.0` | 384-dim dense embeddings, cosine distance (`<=>`) |
| **Backend** | Schema Validation | `zod` | `3.24.2` | Request body and AI structured output validation |
| **Backend** | Authentication | `jsonwebtoken` / `bcryptjs` | `9.0.2` / `2.4.3` | Bearer token auth, password hashing |
| **Backend** | AI Model Integrations | Google Gemini / Ollama | Custom REST fetch | `gemini-flash-lite-latest` via REST; local Ollama `qwen3.5:0.8b` fallback |
| **Backend** | Embeddings Engine | Deterministic Hybrid | Custom | Gemini `gemini-embedding-001` with local 384-dim subword projection fallback |
| **Frontend** | Framework | Next.js (App Router) | `16.4.3` | React Server Components & Turbopack enabled |
| **Frontend** | UI Library | React / React DOM | `19.3.0` | Modern React 19 client components |
| **Frontend** | Styling Framework | Tailwind CSS | `^4.0.0` | Utility CSS with `@tailwindcss/turbopack` |
| **Frontend** | Iconography | `lucide-react` | `^1.61.0` | SVG icons across navigation, cards, and badges |
| **Frontend** | Text Comparison | `diff` | `^4.0.4` | Word-level diff computation in `DiffView.tsx` |

---

## 4. Build, Dev, Test & Lint Scripts and Configurations

### 4.1 Root Workspace Scripts (`package.json`)
```json
{
  "scripts": {
    "dev": "npm run dev --workspace=apps/api & npm run dev --workspace=apps/web",
    "dev:api": "npm run dev --workspace=apps/api",
    "dev:web": "npm run dev --workspace=apps/web",
    "seed": "npm run seed --workspace=apps/api"
  }
}
```
*Note*: No root test, build, or lint scripts exist.

### 4.2 Backend Scripts (`apps/api/package.json`)
```json
{
  "scripts": {
    "build": "tsc && (cp src/db/schema.sql dist/db/ 2>/dev/null || copy src\\db\\schema.sql dist\\db\\ 2>nul || true)",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "seed": "ts-node src/db/seed.ts"
  }
}
```
- **Build Status**: Verified via `cd apps/api && npm run build` -> **Exit code 0** (clean compilation to `dist/`).
- **Database Status**: Verified live connection to Neon PostgreSQL instance -> **Schema and pgvector initialized; 3 organizations verified**.
- **Test Scripts**: Not defined in `package.json` scripts, but 3 executable test scripts exist in `apps/api/`:
  - `npx ts-node test_round3_features.ts`
  - `npx ts-node test_drafts.ts`
  - `npx ts-node test_e2e_flow.ts`

### 4.3 Frontend Scripts (`apps/web/package.json`)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```
- **Build Status**: Verified via `cd apps/web && npm run build` -> **Exit code 0** (Static pages generated successfully in Next.js 16 Turbopack).
- **Lint Status**: Verified via `cd apps/web && npm run lint` -> **Exit code 1** (87 problems: 69 errors, 18 warnings).
  - Primary cause: ESLint 9 default rule `@typescript-eslint/no-explicit-any` flagging `any` in `lib/api.ts` and components.
  - Secondary cause: `react-hooks/set-state-in-effect` in `lib/authContext.tsx:42` (`checkUser()` directly called inside `useEffect`).
- **Test Scripts**: **Zero test scripts or test runners configured** in `apps/web`.

---

## 5. Backend / API Architecture

### 5.1 Endpoints Inventory
The API server listens on `http://localhost:3001` (or `PORT` env) and exposes 14 endpoint groups:

1. **System & Health**:
   - `GET /health`: Server status, service identifier, UTC timestamp.
   - `ALL /seed`: HTTP trigger to run `seedDatabase()`.
2. **Authentication (`/auth`)**:
   - `POST /auth/login`: `{ email, password }` -> `{ token, user, organization }`.
   - `POST /auth/register`: `{ orgName, orgType, name, email, password }` -> `{ token, user, organization }`.
   - `GET /auth/me`: Validates JWT Bearer token -> `{ user, organization }`.
3. **Draft Contents & Reviews (`/contents`, `/reviews`)**:
   - `GET /contents`: Lists all content items for user's organization.
   - `POST /contents`: Creates new draft with initial version.
   - `GET /contents/:id`: Returns content metadata, version history, latest review status, issues list, and comment threads.
   - `POST /contents/:id/versions`: Saves new content version.
   - `POST /contents/:id/review`: Asynchronously queues review pipeline (`status: 'queued'`).
   - `GET /reviews/:id`: Fetches review status (`queued`, `running`, `done`, `failed`), score, and issues.
   - `PATCH /issues/:id`: Updates issue status (`open`, `accepted`, `dismissed`), suggestion, or reason.
   - `POST /contents/:id/submit`: Moves content status to `submitted`.
   - `POST /contents/:id/decision`: Reviewer approval, rejection, or changes requested.
   - `POST /contents/:id/publish`: Marks content as `published` and records tamper-evident audit log.
4. **Social & Multi-Modal Scanner (`/contents`, `/assets`)**:
   - `GET /contents/:id/social-preview`: Auto-formats copy for Twitter (280 char), LinkedIn, Threads (500 char), Bluesky (300 char) with intent URLs.
   - `POST /contents/:id/social-publish`: Dispatches via web intent URL, clipboard context, or webhook.
   - `GET /assets/demo-deck`: Ingests 4-slide Acme Enterprise pitch presentation.
   - `POST /assets/scan-slide-deck`: Runs layout, typography (all-caps detection), logo clearance (<24px), and OCR claim audits.
5. **Brand Knowledge & Governance (`/guidelines`, `/facts`, `/banned-terms`)**:
   - `GET|POST|DELETE /guidelines`: Manages guideline documents and 384-dim vector chunks.
   - `GET|POST|DELETE /facts`: Manages verified corporate facts and 384-dim vector chunks.
   - `GET|POST|DELETE /banned-terms`: Manages restricted terminology with preferred replacements.
6. **Analytics & Self-Healing (`/analytics`, `/audit-logs`, `/accessibility`)**:
   - `GET /analytics/summary`: Aggregate metrics, top repeated violations, ambiguous rules.
   - `GET /analytics/self-healing`: Clusters multi-author violation patterns.
   - `POST /analytics/self-healing/apply`: Applies AI guideline clarifications and regenerates vector embeddings.
   - `GET /audit-logs`: Cryptographic activity log with actor and event metadata.
   - `POST /accessibility/contrast`: WCAG 2.1 relative luminance and contrast ratio calculator.
   - `POST /accessibility/audit-text`: Readability audit (>30 word sentences, missing alt text, all-caps).

### 5.2 External AI Integrations & Embeddings
- **Google Gemini REST**:
  - Direct HTTP calls to `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}`.
  - Implements model cascading fallback: `gemini-flash-lite-latest` -> `gemini-3.5-flash-lite` -> `gemini-3.1-flash-lite-preview`.
  - Configured with `responseMimeType: 'application/json'` and validated against Zod schemas.
- **Ollama Local LLM**:
  - `http://localhost:11434/api/generate` with model `qwen3.5:0.8b` when `USE_OLLAMA=true`.
- **Embeddings Pipeline (`apps/api/src/ai/embed.ts`)**:
  - First attempts Google Gemini `gemini-embedding-001:embedContent` (dim=384).
  - If unavailable, seamlessly falls back to a deterministic **Local Semantic Projection Engine** using token hashing, character 3-grams, bi-grams, and L2 unit-norm scaling.

---

## 6. Error Handling & Failure Modes Deep Dive

### 6.1 Backend Review Pipeline (`apps/api/src/services/review/index.ts`)
The backend exhibits thoughtful partial failure isolation:
- Checkers run via `Promise.all([ruleCheck, toneCheck.catch(...), claimCheck.catch(...), a11yCheck])`.
- If external AI fails (e.g., API key quota exhausted, network drop), `toneCheck` and `claimCheck` catch the exception and return empty lists:
  ```typescript
  toneCheck(body, organizationId).catch(err => {
    aiFailed = true;
    aiErrorMessage = err.message || 'AI not responded';
    return [] as RawIssue[];
  })
  ```
- The review continues, saving rule-based issues (`ruleCheck` and `a11yCheck`) and setting:
  ```typescript
  const reviewStatus = aiFailed ? 'failed' : 'done';
  const statusErrorMsg = aiFailed ? (aiErrorMessage || 'AI not responded') : null;
  UPDATE reviews SET status = reviewStatus, score = finalScore, error_message = statusErrorMsg ...
  ```
- The frontend dashboard already detects this specific condition (`apps/web/app/page.tsx:550-582`) and displays an amber alert banner: `"⚠️ AI not responded — Rule checks only"`.

### 6.2 Frontend Failure Handling Flaws (`apps/web`)

Despite the review pipeline's resilience, the frontend client suffers from catastrophic failure points:

#### Flaw 1: `fetchWithAuth` in `lib/api.ts` Throws Without Fallback
```typescript
const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
if (!res.ok) {
  let errorMsg = `HTTP ${res.status}`;
  try {
    const errJson = await res.json();
    errorMsg = errJson.error || errorMsg;
  } catch {}
  throw new Error(errorMsg);
}
return res.json() as Promise<T>;
```
If the backend is not running, asleep on Render free tier, or returning 500:
- `fetch()` throws `TypeError: Failed to fetch`.
- There is no offline interceptor, no cached response lookup, and no mock data fallback.

#### Flaw 2: Auth Context Eviction on Network Interruption
In `apps/web/lib/authContext.tsx:28-38`:
```typescript
try {
  const res = await api.getMe();
  setUser(res.user);
  setOrganization(res.organization);
} catch {
  localStorage.removeItem('inkloom_token');
  setUser(null);
  setOrganization(null);
}
```
A 2-second network timeout immediately deletes the user's authentication token and resets the state to logged out, blocking the user from viewing existing work.

#### Flaw 3: Initial Data Load Failure Leaves Empty State
In `apps/web/app/page.tsx:93-117`:
```typescript
async function loadInitialData() {
  setLoading(true);
  try {
    const [contentsRes, queueRes] = await Promise.all([
      api.getContents(),
      ...
    ]);
    setContents(contentsRes.contents);
    ...
  } catch (err) {
    console.error('Failed to load initial data:', err);
  } finally {
    setLoading(false);
  }
}
```
When `api.getContents()` rejects:
- `contents` stays `[]`.
- `contentDetails` stays `null`.
- The UI renders line 681: `"Select a draft from the left or create a new one to start checking."`
- The sidebar is completely blank. No fallback banner is shown. The user has no idea the backend failed.

#### Flaw 4: Tab Switching Emits Unhandled Promise Rejections
In `apps/web/app/page.tsx:303-324`:
```typescript
async function handleTabChange(tab: ActiveTab) {
  setActiveTab(tab);
  if (tab === 'governance') {
    const [gRes, fRes, bRes] = await Promise.all([
      api.getGuidelines(),
      api.getFacts(),
      api.getBannedTerms()
    ]);
    setGuidelines(gRes.guidelines);
    setFacts(fRes.facts);
    setBannedTerms(bRes.bannedTerms);
  } else if (tab === 'analytics') {
    const aRes = await api.getAnalytics();
    setAnalyticsData(aRes);
  } else if (tab === 'audit') {
    const audRes = await api.getAuditLogs();
    setAuditLogs(audRes.logs);
  }
}
```
**Zero `try/catch` blocks** exist inside `handleTabChange`. Clicking "Brand Rules & Facts", "Score & Reports", or "Activity History" during an outage immediately throws **Uncaught (in promise) TypeError: Failed to fetch** or **Error: HTTP 500** into the browser console.

#### Flaw 5: Complete Lack of Error Boundaries
- `apps/web/app/error.tsx`: **Missing**
- `apps/web/app/global-error.tsx`: **Missing**
- React Component Error Boundary: **Missing**
Any unhandled React exception causes the entire tree to unmount, resulting in a blank white page.

---

## 7. Existing Test Suites & Test Runners Survey

### 7.1 Backend Test Suites
The repository contains 3 standalone test scripts under `apps/api/`:

1. **`test_round3_features.ts` (153 lines)**:
   - Tests `getSocialPreviews()` and intent URLs for Twitter and LinkedIn.
   - Tests `dispatchUniversalWebhook()` simulation.
   - Tests `scanSlideDeck()` with 4 mock slides (all-caps detection, logo clearance, unverified claims).
   - Tests `generateSelfHealingSuggestions()` and `applyRuleClarification()`.
2. **`test_drafts.ts` (147 lines)**:
   - Tests 10 diverse drafts through `runReviewPipeline()`:
     - Draft 1: Blatant violations (cheap, guaranteed, #1, millions).
     - Draft 2: Fully compliant formal B2B post.
     - Draft 3: Slang and jargon (killer, hack).
     - Draft 4: Readability run-on sentence (>30 words).
     - Draft 5: Missing image alt text (`![](...)`).
     - Draft 6: All-caps shouting (`UPGRADE YOUR SYSTEM...`).
     - Draft 7: Contradicted consumer scale.
     - Draft 8: Unverified comparative ranking.
     - Draft 9: Subtle colloquialism (our app).
     - Draft 10: Clean enterprise announcement.
3. **`test_e2e_flow.ts` (235 lines)**:
   - Executes 9 sequential HTTP integration steps against `http://localhost:3001`:
     - Step 1: Admin login & verify guidelines/facts.
     - Step 2: Creator login & submit canonical draft.
     - Step 3: Run review & inspect issues.
     - Step 4: 1-click accept fixes & re-review (score rises from ~45 to ~95).
     - Step 5: Submit draft for sign-off.
     - Step 6: Reviewer login -> inspect approval queue -> review diff & approve.
     - Step 7: Admin marks published.
     - Step 8: Admin inspects audit log and analytics.
     - Step 9: Multi-tenancy comparison in Zest Social.

### 7.2 Test Suite Gaps Against Acceptance Criteria
- **No Frontend Test Runner**: There is no Jest, Vitest, or Playwright setup in `apps/web`.
- **Missing Acceptance Criteria Test**: The acceptance criteria explicitly state:
  > *"An automated test suite or verification script is present and passes, verifying error boundary recovery, fallback state rendering, and navigation across primary routes."*
- Currently, **zero tests exist** that simulate backend failure, test error boundary recovery, or verify fallback notice banners and cached data rendering.

---

## 8. Requirements Gap Analysis

| Requirement | Description in `ORIGINAL_REQUEST.md` | Current State in Repository | Gap & Severity |
|---|---|---|---|
| **R1.1 Error-Free Operation** | No unhandled runtime errors, console errors, or broken screens during navigation or outages. | `handleTabChange` lacks `try/catch`; uncaught promise rejections occur when API is unreachable. | **HIGH**: Tab navigation throws unhandled console errors during API downtime. |
| **R1.2 Graceful UI Fallbacks** | When endpoints or AI fail, UI recovers with cached/simulated data + visible fallback notice banners. | Only partial banner exists for AI review failure. Backend outages yield empty screens, zero cached data, and zero fallback banners. | **HIGH**: Missing simulated fallback data and fallback banners across all views. |
| **R1.3 Simulated Failure Handling** | Triggering simulated backend or AI failures results in no crashes or blank screens. | No simulated failure mode or toggle exists. | **HIGH**: No mechanism exists to demonstrate simulated failure recovery. |
| **R1.4 Error Boundaries** | Error boundary recovery catches component errors without full crash. | Neither Next.js `app/error.tsx` nor React `ErrorBoundary` exists. | **HIGH**: Zero error boundaries in application. |
| **R2.1 Plain-Language Onboarding** | Prominent explanation of Inkloom AI's purpose and a 3-step walkthrough on landing page/dashboard. | 3-step exists on landing page, but **zero onboarding exists on in-app dashboard**. | **MEDIUM**: Authenticated users receive no onboarding guidance. |
| **R2.2 Plain-English Explanations** | Technical jargon across governance rules and score metrics accompanied by plain-English explanations. | Jargon displayed raw: `pgvector`, `RAG claim contradiction`, `Round 3 Improvement`, `chunk_count`. | **MEDIUM**: Non-technical users confronted with database jargon. |
| **R3.1 Quick-Start Guide** | Quick-start guide present and accessible from main navigation or dashboard. | **Completely missing**. No guide exists in header or dashboard. | **MEDIUM**: Quick-Start Guide not implemented. |
| **R3.2 Helper Tooltips** | Interactive tooltips for complex governance terms and score metrics. | Only HTML `title` attributes exist on `<mark>` tags; no rich accessible tooltips. | **MEDIUM**: No interactive tooltips. |
| **R3.3 Simplified Status Indicators** | Simplified visual status indicators making insights easy to interpret at a glance. | Score badge exists, but scoring mechanics and point deductions are unexplained. | **LOW**: Status indicators present but lack metric interpretability. |
| **R4.1 Keyboard Accessibility** | All interactive elements keyboard accessible with visible focus outlines. | Clickable `<mark>` tags and cards lack `tabIndex` and keyboard handlers; focus outlines suppressed. | **HIGH**: Violates WCAG 2.1.1 and 2.4.7. |
| **R4.2 Color Contrast (WCAG AA)** | Text elements meet WCAG AA contrast ratio (4.5:1 normal, 3:1 large). | `text-gray-400` (`#9ca3af`) on white gives **2.54:1**, failing AA standard. | **HIGH**: Violates WCAG 1.4.3. |
| **R4.3 ARIA Labels** | Form inputs, icons, and status indicators have descriptive ARIA labels. | Zero `aria-*` attributes exist across `apps/web`. | **HIGH**: Violates WCAG 1.3.1 and 4.1.2. |
| **Verification Suite** | Automated test suite verifying error boundary recovery, fallback rendering, and navigation. | **Completely missing**. Existing scripts only test happy path backend APIs. | **HIGH**: Acceptance criterion verification suite missing. |

---

## 9. Synthesis of Multi-Explorer Findings

Connecting findings across Explorer 1 (Codebase & Stack), Explorer 2 (UI & Accessibility), and Explorer 3 (UX & Content):

### 9.1 Consensus Findings
1. **Error Resiliency Deficit (Explorer 1 & Explorer 2)**:
   Both surveys independently confirmed that `lib/api.ts` throws without fallback data, `handleTabChange` has unhandled promise rejections, and no error boundaries exist in `app/`.
2. **Offline Data Necessity (Explorer 1 & Explorer 2)**:
   A comprehensive mock/offline fallback dataset is required in `lib/api.ts` (or an offline fallback service) so that if the backend is down, the UI seamlessly populates demo drafts, rules, guidelines, facts, analytics, and audit logs.
3. **Onboarding & Guidance Absence (Explorer 1 & Explorer 3)**:
   While `LandingPage.tsx` has high-level marketing text, the logged-in experience (`page.tsx`) completely lacks the required 3-step walkthrough and Quick-Start Guide.
4. **Accessibility Overhaul Required (Explorer 1 & Explorer 2)**:
   The entire web application lacks keyboard interactivity on key interactive spans and cards, has no `:focus-visible` ring styling, and has zero ARIA labels.

### 9.2 Resolved Nuances
- *AI Failure vs Backend Failure*: The app *does* have an alert banner for AI review failure (`latestReview.status === 'failed'`), but *does not* have any fallback mechanism when the backend server itself or individual endpoints fail. The solution must provide a unified fallback banner system.
- *Simulation Mode*: To satisfy acceptance criteria without requiring users to kill their local backend process, a simulation toggle or header/query parameter (e.g. `?simulate_failure=true` or an in-app "Simulate Outage" toggle button) will allow instant, deterministic verification of graceful fallback states.

---

## 10. Recommended Remediation & Architecture Proposal

To guide subsequent planning and implementation phases:

### 10.1 Layer 1: Resilient API Client & Fallback Cache (`apps/web/lib/api.ts`)
- Introduce an in-memory & localStorage fallback cache with high-fidelity simulated sample data for Acme Enterprise and Zest Social.
- Wrap `fetchWithAuth` in an automatic fallback interceptor:
  - If `fetch()` rejects (network offline, connection refused, 500 error, or simulation flag active), seamlessly return cached/simulated data.
  - Set a reactive global state `fallbackState: { isFallback: boolean; reason: string; timestamp: string }`.
  - Provide a toggle function `api.setSimulatedFailure(enabled: boolean)` accessible via UI header and URL query param `?simulate_failure=true`.

### 10.2 Layer 2: Error Boundaries (`apps/web/app/error.tsx` & React `ErrorBoundary`)
- Create `apps/web/app/error.tsx` (Next.js route error boundary) with user-friendly recovery UI and retry button.
- Create `apps/web/components/ErrorBoundary.tsx` to wrap primary tab panels, preventing isolated component exceptions from crashing the parent layout.

### 10.3 Layer 3: Fallback Notice Banners (`apps/web/components/FallbackNoticeBanner.tsx`)
- Render a clear, friendly banner when operating on fallback data:
  `"⚡ Offline / Fallback Mode: Operating on cached sample data. Backend connection unavailable. Full functionality remains accessible."`
- Include a "Retry Connection" button and a "Simulate API Failure / Normal Mode" switcher.

### 10.4 Layer 4: Plain-Language Onboarding & Quick-Start Guide
- Create `apps/web/components/QuickStartGuideModal.tsx` accessible via a prominent button in `Header.tsx`.
- Add an in-app 3-step walkthrough banner on the `studio` dashboard:
  - Step 1: Draft or load content -> Step 2: Click "Check My Words" -> Step 3: 1-Click Accept Fixes & Publish.
- Replace internal jargon in UI cards with clear explanations.

### 10.5 Layer 5: Accessible Tooltips & Visual Health Metrics
- Create `apps/web/components/HelperTooltip.tsx` supporting keyboard focus (`tabIndex={0}`, `role="tooltip"`, `aria-describedby`).
- Enhance `ScoreBadge.tsx` with an interactive score breakdown tooltip showing the deterministic formula:
  `Base 100 - (15 × Must Fix) - (7 × Should Fix) - (3 × Tip)`.

### 10.6 Layer 6: Accessibility Compliance (WCAG AA)
- In `globals.css`, define universal `:focus-visible` styles with a high-contrast 2px ring.
- In `page.tsx` and components, add `tabIndex={0}`, `role="button"`, and `onKeyDown` (Enter/Space) to clickable `<mark>` tags, draft cards, and issue cards.
- Add descriptive `aria-label` attributes to search, filter selects, color pickers, and icon buttons.
- Update `text-gray-400` on white backgrounds to `text-gray-600` or `text-gray-500` to exceed 4.5:1 contrast.

### 10.7 Layer 7: Automated Verification Test Suite
- Add an automated verification script (e.g. `scripts/verify_resilience_and_fallbacks.ts` or `apps/web/test_resilience.ts`) that verifies:
  1. Simulated API failure triggers fallback sample data without throwing unhandled exceptions.
  2. Fallback notice banners render accurately.
  3. Primary navigation across all 8 tabs executes without uncaught promise rejections.
  4. Error boundary recovers cleanly from simulated component throws.
