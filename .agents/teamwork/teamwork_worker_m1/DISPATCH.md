## 2026-10-29T09:22:29Z

You are the Implementation Worker for Milestone 1: Error Resilience, Offline Fallback & Simulation Infrastructure for Inkloom AI.

MANDATORY INPUTS:
- Read ORIGINAL_REQUEST.md at: /home/satya/projects/hackathon/.agents/teamwork/ORIGINAL_REQUEST.md
- Read PROJECT.md at: /home/satya/projects/hackathon/PROJECT.md
- Review Explorer 1 Analysis at: /home/satya/projects/hackathon/.agents/teamwork/teamwork_explorer_survey_1/analysis.md
- Review Explorer 2 Analysis at: /home/satya/projects/hackathon/.agents/teamwork/teamwork_explorer_survey_2/analysis.md

Your assigned working directory:
/home/satya/projects/hackathon/.agents/teamwork/teamwork_worker_m1/

Exclusive file ownership:
- `apps/web/lib/fallbackData.ts`
- `apps/web/lib/api.ts`
- `apps/web/app/error.tsx`
- `apps/web/app/global-error.tsx`
- `apps/web/components/ErrorBoundary.tsx`
- `apps/web/components/FallbackBanner.tsx`
- `apps/web/app/page.tsx` (resilience wiring, error boundary wrapping, and safe tab handling)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Tasks for Milestone 1:
1. Create `apps/web/lib/fallbackData.ts`:
   - High-fidelity, typed sample datasets matching the exact interfaces in `lib/api.ts`:
     - `FALLBACK_CONTENTS`: multiple sample brand drafts (e.g. Acme Q3 Enterprise Launch, Social Campaign Announcement, Technical Specs Sheet).
     - `FALLBACK_CONTENT_DETAILS`: rich detail for each draft with reviews, flagged issues (with line numbers, suggestions, severities), diff comparisons, and readability metrics.
     - `FALLBACK_GUIDELINES`: brand voice, tone rules, styling guidelines.
     - `FALLBACK_FACTS`: key company facts and verified metrics.
     - `FALLBACK_BANNED_TERMS`: banned/deprecated terms with suggested alternatives.
     - `FALLBACK_ANALYTICS`: brand health score history, issue distribution by category, compliance trends.
     - `FALLBACK_AUDIT_LOGS`: recent activity logs, review approvals, rule edits.
2. Upgrade `apps/web/lib/api.ts`:
   - Catch network errors (`TypeError: Failed to fetch`), timeout errors, and HTTP 500 errors.
   - When external API fails or is unreachable, gracefully recover by returning the corresponding fallback/cached data instead of throwing.
   - Support Simulated Failure Mode: check for URL parameter `?simulate_failure=true` or localStorage `inkloom_simulate_failure === 'true'`, or programmatic `setSimulatedFailure(active: boolean)`. In simulated failure mode, seamlessly serve fallback data and flag fallback mode as active.
   - Export helper functions:
     - `isFallbackActive(): boolean`
     - `getFallbackReason(): string | null`
     - `setSimulatedFailure(active: boolean): void`
     - `isSimulatedFailureActive(): boolean`
     - `subscribeToFallbackState(callback: (active: boolean, reason: string | null) => void): () => void`
3. Error Boundaries:
   - `apps/web/app/error.tsx`: Next.js App Router client error boundary (`'use client'`). Renders a friendly recovery card with error details, "Try Again" reset button, and guidance.
   - `apps/web/app/global-error.tsx`: Root-level error boundary with HTML/body tags.
   - `apps/web/components/ErrorBoundary.tsx`: Reusable React class component error boundary with graceful fallback UI and optional retry callback. Wrap primary workspaces in `page.tsx`.
4. Create `apps/web/components/FallbackBanner.tsx`:
   - Friendly, visible notice banner (e.g., at top of dashboard or below header).
   - Informs users clearly: "Operating in offline fallback mode with simulated brand governance data. All scanning and inspection features remain interactive."
   - Includes a "Retry Connection" button, simulation status badge if triggered via simulation mode, and a dismiss/minimize button.
5. Harden `apps/web/app/page.tsx`:
   - Wrap `handleTabChange` and all async loads in try/catch blocks with graceful state setting so that navigating tabs during a complete network/API outage emits ZERO unhandled promise rejections or uncaught console errors.
   - Wire `FallbackBanner` to render whenever `isFallbackActive()` is true.
   - Ensure the drafts sidebar displays fallback drafts when backend is unreachable instead of rendering empty.
6. Verification & Hygiene:
   - Run `npm run build --workspace=apps/web` to verify that Next.js compilation succeeds with zero errors.
   - Test offline recovery by simulating network outage and confirming fallback data and banner render cleanly.
7. Maintain `progress.md` and deliver full `handoff.md` with build output and verification proof.
