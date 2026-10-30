# Handoff Report: Explorer 2 (UI & Accessibility Explorer)

**Working Directory**: `/home/satya/projects/hackathon/.agents/teamwork/teamwork_explorer_survey_2/`  
**Milestone**: Step 0: Survey  
**Target Project**: Inkloom AI (`/home/satya/projects/hackathon`)  
**Scope**: UI Component Architecture, Routing, Error Boundaries, Fallback States, Accessibility (R1 & R4)  

---

## 1. Observation

Direct observations and evidence collected from the codebase:

1. **Framework & Dependencies**:
   - `apps/web/package.json:11-17`: Next.js `16.4.3`, React `19.3.0`, React DOM `19.3.0`, Lucide React `^1.61.0`, diff `^4.0.4`.
   - `apps/web/package.json:18-28`: Tailwind CSS `^4` with `@tailwindcss/turbopack ^4`. No UI library (Radix UI, Headless UI, shadcn) is installed.
   - `apps/web/package.json:5-10`: Scripts are limited to `"dev": "next dev"`, `"build": "next build"`, `"start": "next start"`, `"lint": "eslint"`. No frontend test runner (Jest, Vitest, Playwright) is configured.

2. **Routing & Views**:
   - Directory `apps/web/app/` contains strictly 4 files: `favicon.ico`, `globals.css`, `layout.tsx`, and `page.tsx`. Zero subdirectories or nested routes exist.
   - Navigation in `apps/web/app/page.tsx:376-1080` uses a single-page stateful tab model switching between 8 views via `activeTab`: `'studio'`, `'slides'`, `'approvals'`, `'governance'`, `'analytics'`, `'audit'`, `'a11y'`, `'multitenant'`.
   - Modals are conditionally rendered inline in `apps/web/app/page.tsx`: New Draft (`isNewModalOpen`), Decision Modal (`decisionModal.open`), and Zero-API Social Publishing (`isSocialPublishOpen`).

3. **Complete Absence of Error Boundaries**:
   - File search for `*error*` in `apps/web`: 0 results found.
   - Neither Next.js route error boundaries (`apps/web/app/error.tsx`, `apps/web/app/global-error.tsx`) nor React class error boundaries (`componentDidCatch`, `getDerivedStateFromError`) exist anywhere in `apps/web`.

4. **Failure Behavior & Missing Fallbacks (R1)**:
   - `apps/web/lib/api.ts:104-116`:
     ```typescript
     const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
     if (!res.ok) {
       let errorMsg = `HTTP ${res.status}`;
       ...
       throw new Error(errorMsg);
     }
     ```
     `fetchWithAuth` throws on any non-OK HTTP status or network failure with zero caching or fallback interceptors.
   - `apps/web/app/page.tsx:112-114`:
     ```typescript
     } catch (err) {
       console.error('Failed to load initial data:', err);
     }
     ```
     When the backend is down or unreachable, `contents` defaults to `[]` and `contentDetails` defaults to `null`. The studio renders line 681: `"Select a draft from the left or create a new one to start checking."` No drafts appear, no cached data is served, and no fallback notice banner is rendered.
   - `apps/web/app/page.tsx:303-324`:
     ```typescript
     async function handleTabChange(tab: ActiveTab) {
       setActiveTab(tab);
       if (tab === 'governance') {
         const [gRes, fRes, bRes] = await Promise.all([
           api.getGuidelines(), api.getFacts(), api.getBannedTerms()
         ]);
       ...
       } else if (tab === 'analytics') {
         const aRes = await api.getAnalytics();
       ...
       } else if (tab === 'audit') {
         const audRes = await api.getAuditLogs();
       }
     ```
     In `handleTabChange`, calls for `'governance'`, `'analytics'`, and `'audit'` lack `try/catch` blocks. When backend endpoints fail, these trigger verbatim **Uncaught (in promise) TypeError: Failed to fetch** or **Error: HTTP 500** in the browser console.
   - `apps/web/lib/authContext.tsx:32-35`:
     ```typescript
     } catch {
       localStorage.removeItem('inkloom_token');
       setUser(null);
       setOrganization(null);
     }
     ```
     A transient backend failure causes `api.getMe()` to wipe the local token and evict the user to the landing page.
   - Existing Fallback Banner (`apps/web/app/page.tsx:550-582`): Only handles AI model failure (`latestReview?.status === 'failed' || aiError`), but does not address backend server or network outages.

5. **Accessibility Audit (R4)**:
   - Keyboard Trapping & Activation:
     - `apps/web/components/HighlightedText.tsx:60`: `<mark onClick={() => onSelectIssue(issue.id)} ...>` has no `tabIndex={0}`, no `role="button"`, and no `onKeyDown`. Keyboard users cannot select highlighted spans.
     - `apps/web/components/IssueCard.tsx:51`: `<div onClick={onSelect} ... className="... cursor-pointer ...">` lacks `tabIndex` and keyboard selection handlers.
     - `apps/web/app/page.tsx:428`: `<div key={c.id} onClick={() => loadContentDetails(c.id)} ...>` in the draft list lacks `tabIndex`, `role="button"`, and keyboard handlers.
     - Modals in `apps/web/app/page.tsx` and `apps/web/components/SocialPublishModal.tsx` lack focus trapping and `Escape` key dismissal.
   - Focus Outlines:
     - `apps/web/app/globals.css`: Contains zero `:focus-visible` styling. Default focus outline is suppressed in inputs via `focus:outline-none` with only a 1px ring (`focus:ring-1 focus:ring-violet-500`). Buttons in `Header.tsx` have no focus rings.
   - Form Labels & ARIA Names:
     - `apps/web/app/page.tsx:383-390`: Search input has placeholder but no `aria-label`.
     - `apps/web/app/page.tsx:392-403`: Channel filter `<select>` has no `aria-label`.
     - `apps/web/components/ContrastCheckerModal.tsx:56-87`: Color pickers and hex text inputs have no `aria-label` or `<label htmlFor>`.
     - `apps/web/components/CommentThread.tsx:94-100`: Comment text input has no `aria-label`.
     - `apps/web/components/DiffView.tsx:36-54`: Differences are rendered via colored spans without screen-reader indications (`<ins>`, `<del>`, or `.sr-only` text).
   - Text Contrast Ratios:
     - `text-gray-400` (`#9ca3af`) is used across 42 lines on white (`#ffffff`) or light-gray backgrounds (`#fbfbfc`, `#f9fafb`), giving a computed contrast ratio of **2.54:1**, violating the WCAG AA minimum threshold of 4.5:1 for normal text.
     - `text-violet-500` (`#8b5cf6`) on light gray backgrounds (`LandingPage.tsx:290`) yields **4.48:1**, borderline failing the 4.5:1 standard.

---

## 2. Logic Chain

1. **Premise 1 (R1 Resilience)**: Requirement R1 mandates that *"the entire application operates without unhandled runtime errors, console errors, or broken screens"* and that when endpoints fail *"the UI must gracefully recover by displaying cached or simulated fallback data accompanied by clear, friendly fallback notice banners"*.
2. **Inference from Obs 3 & 4**: Because there are no Next.js route error boundaries (`app/error.tsx`) or component-level error boundaries, and because `lib/api.ts` throws immediately without an offline cache or mock fallback data, any API disconnection or 500 error leaves screens blank or frozen. Furthermore, because `handleTabChange` lacks `try/catch` handlers, navigating tabs during an outage emits uncaught promise rejections directly in the console.
3. **Premise 2 (R4 Accessibility)**: Requirement R4 mandates that *"all interactive elements and pages meet standard accessibility practices, including clear color contrast, proper ARIA labels, keyboard navigability with visible focus indicators, and screen-reader friendly structure"*.
4. **Inference from Obs 5**: The presence of clickable `<mark>` tags and cards without `tabIndex`, `role="button"`, or `onKeyDown` prevents keyboard-only operation. The suppression of focus outlines (`focus:outline-none`) without a minimum 2px visible focus ring violates WCAG 2.4.7 and 2.4.11. The absence of `aria-label` or `<label htmlFor>` on search, filters, color pickers, and icon buttons violates WCAG 1.3.1 and 4.1.2. The use of `#9ca3af` (`text-gray-400`) on white gives a **2.54:1** contrast ratio, which fails WCAG AA (4.5:1).
5. **Deductive Conclusion**: To achieve complete compliance with R1 and R4, the project requires:
   - Next.js and component-level Error Boundaries (`app/error.tsx`, `app/global-error.tsx`, `<ErrorBoundary>`).
   - A client-side Offline & Simulated Fallback Layer in `lib/api.ts` with pre-cached sample drafts, rules, and analytics.
   - A friendly global Fallback Notice Banner that displays whenever fallback data is active.
   - Safe `try/catch` wrapping for all tab transitions and action triggers.
   - Comprehensive keyboard navigation (`tabIndex={0}`, `role="button"`, `onKeyDown`), visible 2px `:focus-visible` styling, descriptive ARIA attributes, semantic `<ins>`/`<del>` in DiffView, and upgrading `text-gray-400` to `text-gray-600`/`text-gray-500`.

---

## 3. Caveats

1. **Read-Only Survey Scope**: Per explorer guidelines, no source files were modified during this survey. Proposed patches and architectures are documented for the implementer.
2. **Backend Engine Integrity**: The backend AI review engine (`apps/api/src/services/review/index.ts`) already implements partial degradation for LLM failures (setting review status to `'failed'` and calculating rule/readability scores). However, frontend resilience cannot rely solely on the backend being operational; true R1 compliance requires client-side resilience when the API server is completely down.
3. **ESLint Existing Lints**: Running `npm run lint --workspace=apps/web` currently reports 87 problems (69 errors, 18 warnings) primarily due to `@typescript-eslint/no-explicit-any` and `react-hooks/set-state-in-effect`. While `next build` passes with zero errors, these lints should be addressed or cleaned during implementation to maintain code hygiene.

---

## 4. Conclusion

The Inkloom AI platform features a sophisticated domain architecture and clean visual design, but currently fails the core acceptance criteria of R1 (resilience against backend outages, no console errors, fallback notice banners) and R4 (keyboard operability, visible focus indicators, ARIA labeling, WCAG AA 4.5:1 text contrast). 

Implementation must prioritize:
1. Creating `apps/web/app/error.tsx` and a reusable `<ErrorBoundary>` component.
2. Introducing `apps/web/lib/fallbackData.ts` and wiring fallback interceptors into `apps/web/lib/api.ts` so simulated backend failures display full demo data seamlessly.
3. Adding a prominent, friendly top-level Fallback Notice Banner when operating in offline/simulated mode.
4. Adding keyboard listeners, `tabIndex={0}`, and `role="button"` to `<mark>` tags, issue cards, and draft lists.
5. Defining global `:focus-visible` ring styling in `globals.css`.
6. Attaching `aria-label` attributes to all form controls, filters, and icon buttons.
7. Replacing `text-gray-400` with `text-gray-600` or `text-gray-500` to meet the 4.5:1 WCAG AA contrast standard.
8. Building an automated verification script to validate error recovery, fallback rendering, route navigation, and accessibility attributes.

---

## 5. Verification Method

To independently verify the observations and findings in this report:

1. **Verify Absence of Error Boundaries**:
   ```bash
   find apps/web -name "*error*"
   # Expected output: 0 results
   ```
2. **Verify Uncaught Rejection in Tab Switching When API is Offline**:
   Ensure `apps/api` is NOT running, then launch `apps/web`:
   ```bash
   npm run dev --workspace=apps/web
   ```
   Open browser developer console at `http://localhost:3000`. Navigate to "Brand Rules & Facts" (`governance`) or "Score & Reports" (`analytics`).
   *Observed behavior*: Console throws `Uncaught (in promise) TypeError: Failed to fetch`, and analytics loader spins indefinitely.
3. **Verify Interactive Elements Keyboard Inoperability**:
   Open Studio tab. Press `Tab` repeatedly.
   *Observed behavior*: Focus skips over the highlighted `<mark>` spans in `HighlightedText.tsx` and skips over cards in `IssueCard.tsx`.
4. **Verify Contrast Ratios**:
   Inspect elements styled with `text-gray-400` on `#ffffff` using Chrome DevTools Accessibility pane or Lighthouse.
   *Observed ratio*: 2.54:1 (Threshold for WCAG AA is 4.5:1).
5. **Verify Next.js Production Build**:
   ```bash
   npm run build --workspace=apps/web
   # Expected output: Compiled successfully in Turbopack
   ```

### Invalidation Conditions
This analysis would be invalidated if:
- Next.js App Router error boundaries (`app/error.tsx`) or React class error boundaries already exist in an unindexed directory.
- `lib/api.ts` already contains an active offline caching and mock data layer.
- `<mark>` elements and cards already support keyboard focus and event dispatching.
- `text-gray-400` (#9ca3af) on white evaluates to >= 4.5:1 under standard relative luminance formulas (mathematically impossible).
