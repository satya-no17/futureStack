## 2026-10-29T11:06:31Z
[Message] timestamp=2026-10-29T11:06:31Z sender=7a18d0b0-67be-48d0-be11-c3b1213b2948 priority=MESSAGE_PRIORITY_HIGH content=You are the Implementation Worker for Milestone 3 (Accessibility & Usability Standards) and Milestone 2 Hardening for Inkloom AI.

MANDATORY INPUTS:
- Read ORIGINAL_REQUEST.md at: /home/satya/projects/hackathon/.agents/teamwork/ORIGINAL_REQUEST.md
- Read PROJECT.md at: /home/satya/projects/hackathon/PROJECT.md
- Read Challenger 1 Handoff (with the 3 defect reports) at: /home/satya/projects/hackathon/.agents/teamwork/teamwork_challenger_m2_1/handoff.md
- Read TEST_READY.md at: /home/satya/projects/hackathon/TEST_READY.md

Your assigned working directory:
/home/satya/projects/hackathon/.agents/teamwork/teamwork_worker_m3/

Exclusive file ownership:
- `apps/web/components/QuickStartModal.tsx` (bounds clamping)
- `apps/web/components/OnboardingWalkthrough.tsx` (try/catch storage guard)
- `apps/web/components/LandingPage.tsx` (residual jargon sanitization & contrast)
- `apps/web/app/globals.css` (global focus-visible outline)
- `apps/web/components/HighlightedText.tsx` (keyboard accessibility on mark spans)
- `apps/web/components/IssueCard.tsx` (keyboard accessibility on cards, contrast)
- `apps/web/components/ContrastCheckerModal.tsx` (form labels, ARIA dialog)
- `apps/web/components/CommentThread.tsx` (input aria labels)
- `apps/web/components/DiffView.tsx` (screen-reader diff markup)
- `apps/web/components/SocialPublishModal.tsx` (modal accessibility)
- `apps/web/app/page.tsx` (form labels, ARIA, and contrast)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Tasks:
Part 1: Milestone 2 Hardening (Fix the 3 Challenger 1 issues)
1. `apps/web/components/QuickStartModal.tsx`:
   - Add defensive clamping: `const currentStep = Math.max(0, Math.min(steps.length - 1, activeStepIndex))`. Ensure negative or >= 4 indices never cause `undefined.icon` or runtime crashes.
2. `apps/web/components/OnboardingWalkthrough.tsx`:
   - Wrap `localStorage.getItem` and `localStorage.setItem` in safe try/catch helper functions so sandboxed iframes or restricted environments do not throw `DOMException: SecurityError`.
3. `apps/web/components/LandingPage.tsx`:
   - Replace `"pgvector semantic search"` on line 203 with `"semantic brand search"`.
   - Replace `"RAG-powered AI"` on line 315 with `"AI brand intelligence"`.
   - Replace `"vector embeddings"` on line 345 with `"brand knowledge base"`.
   - Verify that `npx ts-node scripts/adversarial-stress-m2.ts` passes 33/33 tests!

Part 2: Milestone 3 Accessibility & Usability Standards (R4)
4. `apps/web/app/globals.css`:
   - Add high-contrast visible focus outline for all interactive elements:
     ```css
     :focus-visible {
       outline: 2px solid #7c3aed !important;
       outline-offset: 2px !important;
     }
     ```
5. `apps/web/components/HighlightedText.tsx`:
   - Make problem `<mark>` spans keyboard operable:
     - Add `tabIndex={0}`, `role="button"`, `aria-label={issue.explanation || 'Select issue'}`, and `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectIssue(issue.id); } }}`.
6. `apps/web/components/IssueCard.tsx`:
   - Make issue selection cards keyboard operable:
     - Add `tabIndex={0}`, `role="button"`, `aria-label={issue.explanation || 'Select issue'}`, and `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}`.
     - Add plain-language rule citations.
7. `apps/web/components/ContrastCheckerModal.tsx`:
   - Add `aria-label` or `<label>` to color pickers and hex text inputs.
   - Add `role="dialog"`, `aria-modal="true"`, and `Escape` key dismissal.
8. `apps/web/components/CommentThread.tsx`:
   - Add `aria-label="Add a review comment"` to comment text input and send button.
9. `apps/web/components/DiffView.tsx`:
   - Add semantic screen-reader text (`<ins>`, `<del>`, or `<span className="sr-only">Added: </span>` / `<span className="sr-only">Removed: </span>`).
10. `apps/web/components/SocialPublishModal.tsx`:
    - Add `role="dialog"`, `aria-modal="true"`, `Escape` dismissal, and `aria-label`s.
11. Color Contrast Remediation (WCAG AA 4.5:1):
    - Replace all instances of `#9ca3af` (`text-gray-400`, contrast ratio 2.54:1) on white or light-gray backgrounds with `text-gray-600` (#4b5563, contrast 5.7:1) or `text-gray-500` (#6b7280, contrast 4.5:1) in `IssueCard.tsx`, `page.tsx`, `LandingPage.tsx`, `Header.tsx`, `DiffView.tsx`, and `SlideDeckScanner.tsx`.

Part 3: Verification & Quality
12. Run verification commands:
    - `npm run build --workspace=apps/web` (Exit code 0).
    - `npx ts-node scripts/adversarial-stress-m2.ts` (33 / 33 PASS).
    - `node scripts/verify-resilience.mjs --strict` (All 42 / 42 tests PASS with 100% success and exit code 0!).
    - Run ESLint on all touched files: 0 errors, 0 warnings.
13. Maintain `progress.md` and author full `handoff.md`.
