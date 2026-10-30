# Comprehensive UI & Accessibility Survey Analysis (R1 & R4)

**Project**: Inkloom AI — Pre-Publication Brand Governance Platform  
**Target Repository**: `/home/satya/projects/hackathon`  
**Explorer**: UI & Accessibility Explorer (Surveyor 2)  
**Date**: 2026-10-29  

---

## 1. Executive Summary

This survey provides a comprehensive audit of the frontend user interface architecture, styling, routing, error handling, fallback resilience, and accessibility (WCAG 2.1 / 2.2 AA standards) for the Inkloom AI project. 

The application is built on **Next.js 16.4.3 (Turbopack)**, **React 19.3.0**, and **Tailwind CSS v4**, using **Lucide React (v1.61.0)** for iconography and **diff (v4.0.4)** for word-level revisions. The interface is organized as a unified single-page application (SPA) with tab-driven navigation managing 8 distinct workspaces: Drafts & Scanner (`studio`), Multi-Modal Slide Deck Scanner (`slides`), Needs Review (`approvals`), Brand Rules & Facts (`governance`), Score & Reports (`analytics`), Activity History (`audit`), Colors & Readability (`a11y`), and Multi-Tenant Compare (`multitenant`).

While the application possesses rich domain features and clean visual layouts, **critical gaps exist in error resilience (R1) and accessibility (R4)**:
1. **Zero Error Boundaries**: Neither Next.js route error boundaries (`app/error.tsx`, `app/global-error.tsx`) nor React class/component error boundaries exist. A runtime failure in any sub-component unmounts or crashes the entire application.
2. **Fragile Offline / Failure Behavior**: When the backend API is unreachable or returns 500 errors, the application emits uncaught promise rejections, logs console errors, leaves views permanently blank or spinning indefinitely, and provides no cached or simulated sample data.
3. **Accessibility (WCAG AA) Deficits**: 
   - Interactive text highlights (`<mark>`) and card selectors rely on mouse click handlers without keyboard accessibility (`tabIndex={0}`, `role="button"`, `onKeyDown`).
   - Global and component focus outlines are missing (`focus:outline-none` is applied without replacing it with compliant 2px focus rings).
   - Form controls, icon-only actions, and modal dialogs lack descriptive ARIA labels (`aria-label`, `<label htmlFor>`, `role="dialog"`).
   - `text-gray-400` (#9ca3af) on white/light gray backgrounds yields a **2.54:1** contrast ratio, severely failing the WCAG AA requirement of 4.5:1.

Below is the detailed diagnostic breakdown and remediation roadmap.

---

## 2. UI Component Architecture & Design System

### 2.1 Dependency & Framework Stack
- **Next.js**: `16.4.3` (`apps/web/package.json:14`) running with Turbopack and Cache Components enabled.
- **React**: `19.3.0` (`apps/web/package.json:15`).
- **Styling**: `@tailwindcss/turbopack` and `tailwindcss` `^4` (`apps/web/package.json:19,26`). Global CSS utilizes `@import "tailwindcss";` (`apps/web/app/globals.css:1`).
- **Icons**: `lucide-react` `^1.61.0` (`apps/web/package.json:13`).
- **Text Diffing**: `diff` `^4.0.4` (`apps/web/package.json:12`).
- **No Headless / Radix UI**: Unlike many modern enterprise apps, no component library (Radix UI, Headless UI, Ark UI, shadcn/ui) is installed. All modals, tabs, dropdowns, and cards are custom-built in raw React and Tailwind.

### 2.2 Layout & Global Theme
- **Root Layout** (`apps/web/app/layout.tsx:1-30`):
  - Wraps the application in `<html>` (`lang="en"`, `className="h-full"`), imports the Google Font `Inter` (weights 300-900), and injects `<AuthProvider>` wrapping `{children}`.
  - Note: Next.js emits an ESLint warning regarding custom Google Font links in layout; Next font optimization (`next/font/google`) is recommended.
- **Theme Variables & Tokens** (`apps/web/app/globals.css:10-18`):
  - `--background`: `#fbfbfc` (light slate)
  - `--foreground`: `#111827` (gray-900)
  - `--card-bg`: `#ffffff`
  - `--card-border`: `#e5e7eb` (gray-200)
  - `--accent-violet`: `#7c3aed` (violet-600)
- **Utility Classes**:
  - `.glass-panel`: Clean white card with subtle 1px border and light box shadow.
  - `.glass-panel-hover`: Hover elevation transition.
  - `.highlight-high` (`#fee2e2` bg, `#991b1b` text), `.highlight-medium` (`#fef3c7` bg, `#92400e` text), `.highlight-low` (`#e0f2fe` bg, `#0369a1` text).
  - `.diff-added` (`#dcfce7` bg, `#166534` text) and `.diff-removed` (`#fee2e2` bg, `#991b1b` text, strikethrough).

### 2.3 Component Inventory & Responsibilities
All components reside in `apps/web/components/`:
| Component | File Path | Lines | Purpose & Features |
|---|---|---|---|
| `Header` | `components/Header.tsx` | 129 | Sticky navigation bar, active tab pill switcher, unread approval badge, user persona switcher, and sign-out action. |
| `LandingPage` | `components/LandingPage.tsx` | 434 | Public marketing overview, 3-step workflow explanation, value pillars, feature cards, and CTA to launch demo. |
| `LoginScreen` | `components/LoginScreen.tsx` | 238 | Sign-in interface with 5 pre-configured demo account switcher cards (Acme Creator, Reviewer, Admin, Zest Creator, Solo). |
| `ScoreBadge` | `components/ScoreBadge.tsx` | 72 | Dynamic visual badge calculating color tiers: Emerald (>85%), Amber (60-84%), Rose (<60%). Supports `sm`, `md`, `lg`. |
| `HighlightedText` | `components/HighlightedText.tsx` | 91 | Renders content body with interactive `<mark>` spans mapped to open issue start/end character offsets. |
| `IssueCard` | `components/IssueCard.tsx` | 196 | Expandable problem card showing quote, rule citation, explanation, 1-click "Use This Fix", custom suggestion editor, and dismiss drawer. |
| `DiffView` | `components/DiffView.tsx` | 58 | Word-by-word visual comparison between previous and revised drafts using `diffWordsWithSpace`. |
| `CommentThread` | `components/CommentThread.tsx` | 113 | Anchored reviewer notes and feedback list with role-tagged badges and quick comment submission. |
| `ContrastCheckerModal` | `components/ContrastCheckerModal.tsx` | 211 | Interactive WCAG contrast calculator with color pickers, live sample preview, and text readability checker (>30 words, ALL CAPS). |
| `MultiTenantDemo` | `components/MultiTenantDemo.tsx` | 163 | Side-by-side comparative evaluation showing how the same sentence yields opposite governance results for Acme Enterprise vs Zest Social. |
| `SelfHealingCard` | `components/SelfHealingCard.tsx` | 208 | Analytics card discovering ambiguous guidelines tripped by multiple writers with AI clarification and 1-click guideline update. |
| `SlideDeckScanner` | `components/SlideDeckScanner.tsx` | 325 | Ingests 4-slide demo pitch deck, evaluates logo exclusion zones (<24px padding), typography shrieks, and visual claims. |
| `SocialPublishModal` | `components/SocialPublishModal.tsx` | 391 | Zero-API web share intent launcher (Twitter, LinkedIn, Threads, Bluesky, etc.) and webhook dispatcher with character counters. |

---

## 3. Routing Structure & Navigation State

### 3.1 Next.js App Router Structure
The routing structure in `apps/web/app` is minimal:
```
apps/web/app/
├── favicon.ico
├── globals.css
├── layout.tsx     (Root layout, metadata, AuthProvider)
└── page.tsx       (Main entry point containing all tab views and modals)
```
There are **no nested route directories** (e.g., `/dashboard`, `/governance`, `/analytics`, `/login`). The application functions entirely as an authenticated SPA within `apps/web/app/page.tsx`.

### 3.2 View States & Screen Transitions
The UI lifecycle transitions through three primary top-level states:
1. **Auth Loading State** (`page.tsx:343-352`): Spinner displayed while verifying token in `authContext.tsx`.
2. **Unauthenticated Public State**:
   - `showLogin === false`: Displays `<LandingPage onGetStarted={() => setShowLogin(true)} />` (`page.tsx:358`).
   - `showLogin === true`: Displays `<LoginScreen onBack={() => setShowLogin(false)} />` (`page.tsx:356`).
3. **Authenticated Dashboard State** (`page.tsx:362-1212`):
   Contains `<Header>` and renders conditional workspaces based on `activeTab`:
   - `studio` (lines 376-689): Two-column draft workspace with search, filter, draft list, editor, highlighted text, issue cards, and comment thread.
   - `slides` (lines 694-703): Multi-Modal Slide Deck Scanner.
   - `approvals` (lines 708-784): Review queue with approval actions and `<DiffView>`.
   - `governance` (lines 789-926): Words to Avoid (banned terms), Brand Voice Guidelines, and Approved Facts & Numbers.
   - `analytics` (lines 931-1024): Governance metric cards, `<SelfHealingCard>`, most common violations, and ambiguous rules.
   - `audit` (lines 1029-1069): Cryptographic audit log stream.
   - `a11y` (line 1074): Color contrast and text readability tools.
   - `multitenant` (line 1079): Comparative Acme vs Zest brand rule demo.
4. **Overlay Modals**:
   - `isNewModalOpen` (lines 1086-1148): Create New Draft modal.
   - `decisionModal.open` (lines 1153-1192): Reviewer approval / change request dialog.
   - `isSocialPublishOpen` (lines 1197-1211): Zero-API Social Publishing modal.

---

## 4. Current Error Boundary & Fallback Analysis (R1)

### 4.1 Error Boundaries Audit
| Scope | Expected File / Component | Current Status | Impact if Unhandled Error Occurs |
|---|---|---|---|
| Next.js Route Error Boundary | `apps/web/app/error.tsx` | **Missing** | Any rendering error or promise rejection bubbles up, triggering the Next.js unhandled crash screen. |
| Next.js Root Layout Error Boundary | `apps/web/app/global-error.tsx` | **Missing** | A layout or provider crash completely breaks the application shell. |
| React Component Error Boundary | Custom `<ErrorBoundary>` | **Missing** | An exception in any tab (e.g. malformed analytics payload, slide scan glitch) unmounts the entire React tree. |

### 4.2 API Failure & Network Outage Behavior
In `apps/web/lib/api.ts:90-119`, `fetchWithAuth` is implemented as:
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
When the API backend (`http://localhost:3001`) is offline, disconnected, or returns a 500 status:
1. **Initial Boot Failure** (`page.tsx:93-117`):
   ```typescript
   try {
     const [contentsRes, queueRes] = await Promise.all([
       api.getContents(), ...
     ]);
   } catch (err) {
     console.error('Failed to load initial data:', err); // CONSOLE ERROR EMITTED
   }
   ```
   `contents` remains empty (`[]`), `contentDetails` remains `null`. The studio tab renders line 681: `"Select a draft from the left or create a new one to start checking."` No drafts appear, no cached data is loaded, and **no notice banner** informs the user that the backend is unreachable.
2. **Unhandled Promise Rejections in Tab Switching** (`page.tsx:303-324`):
   ```typescript
   async function handleTabChange(tab: ActiveTab) {
     setActiveTab(tab);
     if (tab === 'governance') {
       const [gRes, fRes, bRes] = await Promise.all([
         api.getGuidelines(), api.getFacts(), api.getBannedTerms()
       ]); // NO TRY/CATCH -> UNCAUGHT PROMISE REJECTION
     ...
     } else if (tab === 'analytics') {
       const aRes = await api.getAnalytics(); // NO TRY/CATCH -> UNCAUGHT REJECTION
     } else if (tab === 'audit') {
       const audRes = await api.getAuditLogs(); // NO TRY/CATCH -> UNCAUGHT REJECTION
     }
   }
   ```
   Clicking **"Brand Rules & Facts"**, **"Score & Reports"**, or **"Activity History"** while the backend is down immediately fires **Uncaught (in promise) TypeError: Failed to fetch** in the browser console. For analytics, `analyticsData` stays `null`, causing the spinner to spin forever (`Loading Reports...`).
3. **Session Eviction on Wakeup** (`authContext.tsx:28-36`):
   ```typescript
   try {
     const res = await api.getMe();
   } catch {
     localStorage.removeItem('inkloom_token');
     setUser(null);
     setOrganization(null);
   }
   ```
   If the user refreshes the page during a temporary backend outage or cold start, `api.getMe()` throws, `localStorage.removeItem('inkloom_token')` wipes their session, and they are evicted back to the landing page.
4. **Alert Popups on Action Failures**:
   Browser native alerts (`alert(...)`) are used instead of non-blocking UI notifications:
   - `page.tsx:238`: `alert('Draft sent for review!')`
   - `page.tsx:240`: `alert('Could not send draft: ...')`
   - `page.tsx:255`: `alert('Could not save feedback: ...')`
   - `page.tsx:268`: `alert('Could not publish: ...')`
   - `page.tsx:298`: `alert('Could not create draft: ...')`
   - `SelfHealingCard.tsx:48`: `alert('Could not apply clarification: ...')`
   - `SlideDeckScanner.tsx:40`: `alert('Could not load slide deck: ...')`

### 4.3 Existing Notice Banners
The **only** current fallback notice banner in the entire codebase is the AI failure banner in `page.tsx:550-582`:
- Trigger: `(contentDetails.latestReview?.status === 'failed' || aiError)`
- Display: Amber banner stating *"AI not responded — The AI review model did not respond or is not configured. Rule-based checks (words to avoid, readability grade) were completed and are shown below."* with a "Retry AI Check" button.
- Defect: This only handles backend-reported AI timeouts when the backend itself is healthy. It does **not** handle API server outages, database disconnection, or client network failures.

---

## 5. Exhaustive Accessibility Audit (R4)

### 5.1 Keyboard Navigability & Operability (WCAG 2.1 SC 2.1.1, 2.4.3)
1. **Interactive `<mark>` Elements** (`components/HighlightedText.tsx:60-71`):
   - Element: `<mark onClick={() => onSelectIssue(issue.id)} ...>`
   - Violation: No `tabIndex={0}`, no `role="button"`, and no `onKeyDown` handler. A keyboard-only user (using Tab / Enter / Space) cannot navigate to, inspect, or activate highlighted issues in the text.
2. **Issue Cards Container** (`components/IssueCard.tsx:51-58`):
   - Element: `<div onClick={onSelect} className="... cursor-pointer">`
   - Violation: Div elements with click handlers are not in the focus sequence. Users cannot focus or select cards via Tab.
3. **Draft List Items** (`apps/web/app/page.tsx:428-455`):
   - Element: `<div key={c.id} onClick={() => loadContentDetails(c.id)} className="... cursor-pointer">`
   - Violation: Not a semantic button or link; not focusable via keyboard; lacks `role="button"` and `onKeyDown`.
4. **Slide Issue Items** (`components/SlideDeckScanner.tsx:255-264`):
   - Element: `<div key={issue.id} onClick={() => setSelectedIssueId(issue.id)} className="... cursor-pointer">`
   - Violation: Not keyboard accessible.
5. **Modal Focus Management & Escape Key** (`page.tsx`, `SocialPublishModal.tsx`):
   - Modals do not trap keyboard focus within the dialog; pressing Tab cycles background page elements behind the backdrop.
   - Pressing the `Escape` key does not dismiss modals.

### 5.2 Visible Focus Indicators (WCAG 2.1 SC 2.4.7, WCAG 2.2 SC 2.4.11)
1. **No Global `:focus-visible` Styles** (`globals.css`):
   - Global stylesheet defines fonts, scrollbars, and highlight classes, but contains zero focus pseudo-class rules.
2. **Suppression of Default Focus Rings Without Sufficient Replacement**:
   - Inputs and textareas use `focus:outline-none focus:ring-1 focus:ring-violet-500` (`page.tsx:388,614,1100`).
   - The 1px outline fails the WCAG 2.2 Focus Appearance minimum 2px solid boundary requirement with 3:1 contrast against adjacent colors.
3. **Buttons Lacking Focus Indicators**:
   - Navigation buttons in `Header.tsx:81-98`: only have `hover:text-gray-900 hover:bg-white/80`, no focus ring.
   - Primary action buttons ("Check My Words", "New Draft", "Send for Review", "Approve Draft"): no `focus-visible:ring-2` defined.

### 5.3 ARIA Roles, States & Form Labels (WCAG 2.1 SC 1.3.1, 4.1.2)
1. **Unlabeled Form Inputs**:
   - Search Drafts (`page.tsx:383-390`): `<input type="text" placeholder="Search drafts by title..." />` lacks `aria-label="Search drafts by title"`.
   - Channel Filter (`page.tsx:392-403`): `<select value={channelFilter}>` lacks `aria-label="Filter drafts by publishing channel"`.
   - Comment Input (`CommentThread.tsx:94-100`): `<input type="text" placeholder="Write feedback or notes..." />` lacks `aria-label="Write a team note or feedback"`.
   - Contrast Checker Inputs (`ContrastCheckerModal.tsx:56-87`):
     - `<input type="color">` and `<input type="text">` for foreground text color have no `aria-label` or `id`/`htmlFor`.
     - `<input type="color">` and `<input type="text">` for background color have no `aria-label` or `id`/`htmlFor`.
     - Readability textarea (`ContrastCheckerModal.tsx:181-187`) has no `<label>` or `aria-label`.
2. **Icon-Only Buttons Lacking Accessible Names**:
   - Banned Term Delete (`page.tsx:852-862`): `<button title="Remove from list"><Trash2 className="w-4 h-4" /></button>` lacks `aria-label="Delete banned term {b.term}"`.
   - Social Publish Close (`SocialPublishModal.tsx:195-200`): `<button onClick={onClose}><X className="w-5 h-5" /></button>` lacks `aria-label="Close dialog"`.
   - Header Sign Out on Mobile (`Header.tsx:116-122`): `<button onClick={logout}>` hides the text on mobile screens leaving only the icon without `aria-label="Sign out"`.
3. **Dialog Semantics**:
   - Modals in `page.tsx` (New Draft, Decision) and `SocialPublishModal.tsx` lack `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
4. **Screen-Reader Accessibility for DiffView** (`components/DiffView.tsx:36-54`):
   - `.diff-added` and `.diff-removed` rely strictly on color and strikethrough. Screen readers read words sequentially without notifying the user whether a word was inserted or deleted.
   - Proper implementation requires semantic `<ins>` and `<del>` or `<span className="sr-only">Added: </span>` and `<span className="sr-only">Removed: </span>`.

### 5.4 Text Color Contrast Audit (WCAG AA 4.5:1 Normal Text, 3:1 Large Text)
All calculations use the WCAG 2.1 relative luminance formula:
$$L = 0.2126 R + 0.7152 G + 0.0722 B$$
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

| Color Class | Hex Code | Background | Computed Ratio | WCAG AA Status | Remediation Required |
|---|---|---|---|---|---|
| `text-gray-400` | `#9ca3af` | White (`#ffffff`) | **2.54:1** | **FAIL** (< 4.5:1) | Change to `text-gray-600` (`#4b5563`, 7.0:1) or `text-gray-500` (`#6b7280`, 4.55:1). |
| `text-gray-400` | `#9ca3af` | Light Gray (`#f9fafb`) | **2.48:1** | **FAIL** (< 4.5:1) | Change to `text-gray-600` or `text-gray-500`. |
| `text-gray-400` on dark | `#9ca3af` | Slate-900 (`#0f172a`) | **5.45:1** | **PASS** (> 4.5:1) | Retain for dark slide stage. |
| `text-violet-500` | `#8b5cf6` | White (`#ffffff`) | **4.65:1** | **PASS** (Normal), but close | Recommend `text-violet-600` (`#7c3aed`, 6.6:1) for safety. |
| `text-violet-500` | `#8b5cf6` | Gray-50 (`#f9fafb`) | **4.48:1** | **BORDERLINE FAIL** | Change to `text-violet-600` in `LandingPage.tsx:290`. |
| `.highlight-high` | `#991b1b` on `#fee2e2` | Red-100 | **7.08:1** | **PASS** (> 4.5:1) | Fully compliant. |
| `.highlight-medium` | `#92400e` on `#fef3c7` | Amber-100 | **6.82:1** | **PASS** (> 4.5:1) | Fully compliant. |
| `.highlight-low` | `#0369a1` on `#e0f2fe` | Sky-100 | **5.14:1** | **PASS** (> 4.5:1) | Fully compliant. |
| `.diff-added` | `#166534` on `#dcfce7` | Green-100 | **7.42:1** | **PASS** (> 4.5:1) | Fully compliant. |
| `.diff-removed` | `#991b1b` on `#fee2e2` | Red-100 | **7.08:1** | **PASS** (> 4.5:1) | Fully compliant. |

---

## 6. Requirements Mapping (R1 & R4)

### 6.1 Requirement R1: Error-Free Operation & Graceful UI Fallbacks

| Requirement Item from ORIGINAL_REQUEST.md | Current Codebase State | Exact Deficiency & Failure Vector | Proposed Architectural Solution |
|---|---|---|---|
| "Operate without unhandled runtime errors, console errors, or broken screens" | Next.js and React error boundaries are completely absent. | If any component throws an error, the screen goes blank or shows Next.js crash overlay. | 1. Implement `app/error.tsx` and `app/global-error.tsx`.<br>2. Implement reusable `<ErrorBoundary>` wrapping all major workspace views. |
| "When external services, AI providers, or backend endpoints are unreachable... UI gracefully recovers" | `api.ts:fetchWithAuth` throws `TypeError: Failed to fetch`. `page.tsx:loadInitialData` logs error; views are empty. | Backend outage results in empty UI, frozen loaders, or crash. | Implement an **Offline / Simulated Fallback Layer** in `lib/api.ts` (or client cache adapter) that transparently returns structured sample data when API calls fail. |
| "Display cached or simulated fallback data" | No offline cache or static fallback seed data exists on the frontend. | If backend is offline, drafts, guidelines, facts, analytics, and audit logs are 100% empty. | Ship high-fidelity offline sample data: Acme canonical drafts, approval items, guidelines, facts, banned terms, analytics, slide deck, and audit logs. |
| "Accompanied by clear, friendly fallback notice banners explaining the status" | Only 1 banner exists in `page.tsx` specifically for AI model failure (`AI not responded`). No backend outage banner. | When backend fails, user sees blank white boxes with zero explanatory notice. | Implement a persistent, friendly, non-alarmist top-level **Fallback Status Banner**: *"Operating in Offline Demo Mode — Backend service is unreachable. Showing verified sample data."* |
| "No uncaught JavaScript errors or unhandled promise rejections in console" | `handleTabChange` in `page.tsx:303-324` has no `try/catch` on `Promise.all` or `api.getAnalytics()`. | Tab navigation while offline emits `Uncaught (in promise) Error` in the browser console. | Wrap all tab data loading in resilient `try/catch` blocks with safe state setters and fallback notifications. Replace `console.error` with silent state updates. |

### 6.2 Requirement R4: Accessibility & Usability Standards

| Requirement Item from ORIGINAL_REQUEST.md | Current Codebase State | Exact Deficiency & Failure Vector | Proposed Architectural Solution |
|---|---|---|---|
| "All interactive elements are keyboard accessible with visible focus outlines" | `<mark>` highlights and card containers have `onClick` but lack keyboard handlers. `globals.css` has no focus-visible styles. | Keyboard-only users cannot tab to issues or see their active focus position. | 1. Add `tabIndex={0}`, `role="button"`, and `onKeyDown={(e) => (e.key === 'Enter' \|\| e.key === ' ') && onSelect()}` to `<mark>`, issue cards, and draft cards.<br>2. Add global `:focus-visible` ring rules in `globals.css`. |
| "Text elements meet WCAG AA contrast ratio standards (4.5:1 normal, 3:1 large)" | `text-gray-400` is used extensively for metadata, timestamps, subtitles, and labels. | Computed contrast of `#9ca3af` on `#ffffff` is **2.54:1** (fails 4.5:1 threshold). | Replace all occurrences of `text-gray-400` on light backgrounds with `text-gray-600` (#4b5563, 7.0:1) or `text-gray-500` (#6b7280, 4.55:1). |
| "Form inputs, icons, and status indicators have descriptive ARIA labels" | Search input, filter select, color pickers, comment inputs, and delete icons lack ARIA attributes. | Screen reader users hear "edit text" or "button" without context or name. | Add `aria-label`, `aria-labelledby`, and `<label htmlFor>` to all inputs, selects, textareas, and icon buttons. Add `role="dialog"` to modals. |
| "Screen-reader friendly structure" | `DiffView.tsx` uses colored text without announcing insertions or deletions. | Visually impaired users cannot determine what text was added or removed. | Wrap insertions in `<ins className="diff-added"><span className="sr-only">Added: </span>...` and `<del className="diff-removed"><span className="sr-only">Removed: </span>...`. |

---

## 7. Concrete Implementation Proposals (Draft Specifications)

### 7.1 Error Boundary Architecture
1. **Next.js Route Error Boundary** (`apps/web/app/error.tsx`):
   A Client Component receiving `{ error, reset }` that renders a calm, branded recovery screen with:
   - Shield icon with amber/violet styling.
   - Plain-English explanation: *"Something unexpected occurred, but Inkloom AI protected your drafts."*
   - "Try Again" button calling `reset()`.
   - "Switch to Offline Demo Mode" button allowing navigation to cached data.
2. **Component Error Boundary** (`apps/web/components/ErrorBoundary.tsx`):
   A React class component with `componentDidCatch` and `getDerivedStateFromError`, supporting a `fallbackTitle` and `fallbackDescription`. This allows individual tabs (like `analytics` or `slides`) to fail gracefully without crashing the whole shell.

### 7.2 Offline / Resilient API Layer (`apps/web/lib/fallbackData.ts` & `apps/web/lib/api.ts`)
Create a dedicated mock data provider containing:
- Sample Acme & Zest drafts (matching the hackathon demo walkthrough).
- Approval queue items.
- Guidelines, Facts, Banned terms.
- Pre-compiled analytics statistics and ambiguity reports.
- Audit trail logs.
- Slide deck scanner demo data.
In `apps/web/lib/api.ts`:
Wrap API methods with a fallback interceptor: if `fetchWithAuth` fails due to network error, 500 status, or timeout, seamlessly serve the fallback mock data and notify the application via a shared `fallbackState` listener.

### 7.3 Global Accessible Focus & Contrast Tokens
1. In `apps/web/app/globals.css`:
   ```css
   /* WCAG 2.2 AA Focus Visible Default */
   :focus-visible {
     outline: 2px solid #7c3aed;
     outline-offset: 2px;
   }
   ```
2. Update all `text-gray-400` instances in `page.tsx`, `Header.tsx`, `LandingPage.tsx`, `LoginScreen.tsx`, `ScoreBadge.tsx`, `CommentThread.tsx`, `SelfHealingCard.tsx`, `SlideDeckScanner.tsx`, and `SocialPublishModal.tsx` to `text-gray-600` or `text-gray-500`.

### 7.4 Verification Test Suite Strategy
Create an automated test suite / verification script:
- Verifies that `app/error.tsx` catches and recovers from deliberate errors.
- Verifies that simulated backend 500 errors and network failures render fallback sample data without unhandled console errors.
- Verifies that tab navigation across all 8 tabs executes without uncaught promise rejections.
- Verifies that interactive elements have `tabIndex`, `role="button"`, and ARIA labels.

---

## 8. Conclusion
The Inkloom AI frontend has strong visual polish and feature richness, but currently lacks the structural fault tolerance and accessibility standards required by R1 and R4. By adding Next.js and component error boundaries, transparent offline sample data fallbacks, accessible keyboard navigation, proper ARIA labeling, and WCAG AA contrast adjustments, the platform will become an exemplary, enterprise-grade brand governance showcase.
