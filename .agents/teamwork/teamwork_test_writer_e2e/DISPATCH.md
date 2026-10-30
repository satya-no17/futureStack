## 2026-10-29T09:22:06Z
[Message] timestamp=2026-10-29T09:22:06Z sender=7a18d0b0-67be-48d0-be11-c3b1213b2948 priority=MESSAGE_PRIORITY_HIGH content=You are the E2E Test Suite Writer leading the E2E Testing Track for Inkloom AI.

MANDATORY INPUTS:
- Read ORIGINAL_REQUEST.md at: /home/satya/projects/hackathon/.agents/teamwork/ORIGINAL_REQUEST.md
- Read PROJECT.md at: /home/satya/projects/hackathon/PROJECT.md

Your assigned working directory:
/home/satya/projects/hackathon/.agents/teamwork/teamwork_test_writer_e2e/

Exclusive file ownership:
- `scripts/verify-resilience.mjs` (and any helper test scripts under `scripts/`)
- `TEST_INFRA.md` at /home/satya/projects/hackathon/TEST_INFRA.md
- `TEST_READY.md` at /home/satya/projects/hackathon/TEST_READY.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Core Objectives & Methodology:
1. Design an opaque-box, requirement-driven E2E verification suite based on ORIGINAL_REQUEST.md acceptance criteria:
   - Error resilience and fallback behavior (simulated backend/AI outage returns no unhandled UI crashes or blank screens; fallback banners display; no uncaught JS errors or unhandled promise rejections).
   - Plain-language onboarding & interpretability (prominent 3-step walkthrough on dashboard, technical jargon explained/tooltips, quick-start guide present and accessible).
   - Accessibility standards (visible focus outlines, WCAG AA contrast >= 4.5:1, keyboard navigability on interactive elements, descriptive ARIA labels).
   - Navigation across primary tabs/routes.
2. Implement 4 tiers of test cases using systematic methodology:
   - Tier 1: Feature Coverage (>=5 test cases per feature covering equivalence class representatives).
   - Tier 2: Boundary & Corner Cases (limits, network timeouts, 500 errors, empty states, corrupted cache).
   - Tier 3: Cross-Feature Combinations (e.g., navigating tabs while in offline fallback mode, opening quick-start guide during simulated outage, keyboard navigation within fallback banner).
   - Tier 4: Real-World Workload Scenarios (end-to-end user journey from landing -> quick-start -> dashboard -> tab switching -> error recovery).
3. Author `TEST_INFRA.md` at project root using the project test infra template.
4. Build `scripts/verify-resilience.mjs` with clear pass/fail reporting, summary statistics, and exit code semantics (exit 0 on all pass, exit 1 on fail). Ensure it can test both running server endpoints and static code/AST/component verification.
5. Execute the test runner, document baseline results, and publish `TEST_READY.md` at project root with coverage summary and feature checklist.
6. Maintain progress.md in your working directory and deliver a complete 5-component handoff.md upon completion.
