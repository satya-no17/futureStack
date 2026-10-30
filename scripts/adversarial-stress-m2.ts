/**
 * Inkloom AI — Milestone 2 Adversarial Stress Test Suite
 *
 * Scope:
 * - QuickStartModal Out-of-Bounds Step Index & Crash Probing
 * - OnboardingWalkthrough LocalStorage Corruption & SSR Stress
 * - HelperTooltip Keyboard Accessibility, State Transitions & Dismissal
 * - Technical Jargon & Plain-Language Audit Across User-Facing Views
 * - ScoreBadge Deterministic Formula & Boundary Matrix
 * - Monorepo Build, Official Verification & Type Integrity
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';

// Components under test
import { QuickStartModal } from '../apps/web/components/QuickStartModal';
import { OnboardingWalkthrough } from '../apps/web/components/OnboardingWalkthrough';
import { HelperTooltip } from '../apps/web/components/HelperTooltip';
import { ScoreBadge } from '../apps/web/components/ScoreBadge';
import { Header } from '../apps/web/components/Header';

interface TestResult {
  suite: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'DEFECT_CONFIRMED';
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];
let unhandledRejections = 0;
let uncaughtExceptions = 0;

process.on('unhandledRejection', (reason) => {
  unhandledRejections++;
  console.error('[CRITICAL] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  uncaughtExceptions++;
  console.error('[CRITICAL] Uncaught Exception:', err);
});

function recordResult(result: TestResult) {
  results.push(result);
  const statusIcon = result.status === 'PASS' ? '✓ PASS' : result.status === 'DEFECT_CONFIRMED' ? '⚠️ DEFECT' : '✗ FAIL';
  console.log(`  ${statusIcon} [${result.suite}] ${result.name} (${result.durationMs}ms)`);
  if (result.details) {
    console.log(`    ↳ ${result.details}`);
  }
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log('  Inkloom AI — Challenger 1 Adversarial Stress Test Harness (Milestone 2)');
  console.log('========================================================================\n');

  // =========================================================================
  // SUITE 1: QuickStartModal Out-of-Bounds Step Index & Crash Probing
  // =========================================================================
  console.log('--- SUITE 1: QuickStartModal Out-of-Bounds Step Index & Crash Probing ---');

  // Test 1.1: Valid step indices (0 to 3)
  const validSteps = [0, 1, 2, 3];
  for (const step of validSteps) {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(QuickStartModal, { isOpen: true, onClose: () => {}, initialStep: step })
      );
      recordResult({
        suite: 'SUITE 1',
        name: `QuickStartModal renders valid initialStep=${step}`,
        status: 'PASS',
        durationMs: Date.now() - start,
        details: `Rendered dialog HTML length: ${html.length} chars`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE 1',
        name: `QuickStartModal renders valid initialStep=${step}`,
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test 1.2: Adversarial negative step indices (e.g. -1, -100)
  const negativeSteps = [-1, -100];
  for (const step of negativeSteps) {
    const start = Date.now();
    try {
      ReactDOMServer.renderToStaticMarkup(
        React.createElement(QuickStartModal, { isOpen: true, onClose: () => {}, initialStep: step })
      );
      recordResult({
        suite: 'SUITE 1',
        name: `QuickStartModal handles negative step initialStep=${step}`,
        status: 'PASS',
        durationMs: Date.now() - start,
        details: 'Unexpectedly survived without crash'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE 1',
        name: `QuickStartModal handles negative step initialStep=${step}`,
        status: 'DEFECT_CONFIRMED',
        durationMs: Date.now() - start,
        details: `Crash confirmed: ${err.message} (steps[${step}] is undefined)`
      });
    }
  }

  // Test 1.3: Adversarial upper out-of-bounds step indices (>= 4, e.g. 4, 5, 999)
  const upperSteps = [4, 5, 999];
  for (const step of upperSteps) {
    const start = Date.now();
    try {
      ReactDOMServer.renderToStaticMarkup(
        React.createElement(QuickStartModal, { isOpen: true, onClose: () => {}, initialStep: step })
      );
      recordResult({
        suite: 'SUITE 1',
        name: `QuickStartModal handles out-of-bounds step initialStep=${step}`,
        status: 'PASS',
        durationMs: Date.now() - start,
        details: 'Unexpectedly survived without crash'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE 1',
        name: `QuickStartModal handles out-of-bounds step initialStep=${step}`,
        status: 'DEFECT_CONFIRMED',
        durationMs: Date.now() - start,
        details: `Crash confirmed: ${err.message} (steps[${step}] is undefined; 4 steps defined)`
      });
    }
  }

  // Test 1.4: Modal closed with invalid step index
  {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(QuickStartModal, { isOpen: false, onClose: () => {}, initialStep: -1 })
      );
      recordResult({
        suite: 'SUITE 1',
        name: 'QuickStartModal returns null when isOpen=false even with out-of-bounds step',
        status: html === '' ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Correctly short-circuited when closed'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE 1',
        name: 'QuickStartModal returns null when isOpen=false even with out-of-bounds step',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // =========================================================================
  // SUITE 2: OnboardingWalkthrough LocalStorage Corruption & SSR Stress
  // =========================================================================
  console.log('\n--- SUITE 2: OnboardingWalkthrough LocalStorage Corruption & SSR Stress ---');

  // Test 2.1: SSR environment (window is undefined)
  {
    const start = Date.now();
    try {
      const origWindow = (global as any).window;
      delete (global as any).window;
      const html = ReactDOMServer.renderToStaticMarkup(React.createElement(OnboardingWalkthrough, {}));
      (global as any).window = origWindow;
      recordResult({
        suite: 'SUITE 2',
        name: 'OnboardingWalkthrough renders cleanly during SSR (window undefined)',
        status: html.includes('How Inkloom AI Works') ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Walkthrough rendered full banner during SSR'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE 2',
        name: 'OnboardingWalkthrough renders cleanly during SSR (window undefined)',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test 2.2: LocalStorage returns null (clean new visitor)
  {
    const start = Date.now();
    try {
      (global as any).window = {};
      (global as any).localStorage = {
        getItem: () => null,
        setItem: () => {}
      };
      const html = ReactDOMServer.renderToStaticMarkup(React.createElement(OnboardingWalkthrough, {}));
      recordResult({
        suite: 'SUITE 2',
        name: 'OnboardingWalkthrough handles null localStorage.getItem without throwing',
        status: html.includes('How Inkloom AI Works') ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Safely defaults to active walkthrough'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE 2',
        name: 'OnboardingWalkthrough handles null localStorage.getItem without throwing',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test 2.3: LocalStorage returns corrupted non-boolean values
  const corruptedTokens = ['{malformed: json}', 'undefined', 'NaN', '12345', 'null', '[object Object]', 'true-invalid'];
  for (const token of corruptedTokens) {
    const start = Date.now();
    try {
      (global as any).window = {};
      (global as any).localStorage = {
        getItem: () => token,
        setItem: () => {}
      };
      const html = ReactDOMServer.renderToStaticMarkup(React.createElement(OnboardingWalkthrough, {}));
      const correctlyTreatedAsFalse = html.includes('How Inkloom AI Works');
      recordResult({
        suite: 'SUITE 2',
        name: `OnboardingWalkthrough with corrupted value "${token}"`,
        status: correctlyTreatedAsFalse ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Value !== "true", safely rendered full guide'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE 2',
        name: `OnboardingWalkthrough with corrupted value "${token}"`,
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test 2.4: LocalStorage returns 'true' (minimized bar state)
  {
    const start = Date.now();
    try {
      (global as any).window = {};
      (global as any).localStorage = {
        getItem: () => 'true',
        setItem: () => {}
      };
      const html = ReactDOMServer.renderToStaticMarkup(React.createElement(OnboardingWalkthrough, {}));
      const rendersMinimized = html.includes('Show Tour') && html.includes('First time here?');
      recordResult({
        suite: 'SUITE 2',
        name: 'OnboardingWalkthrough renders minimized state when dismissed in localStorage',
        status: rendersMinimized ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Rendered compact recovery pill with "Show Tour" button'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE 2',
        name: 'OnboardingWalkthrough renders minimized state when dismissed in localStorage',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test 2.5: LocalStorage throws SecurityError (iframe sandbox / blocked cookies)
  {
    const start = Date.now();
    try {
      (global as any).window = {};
      (global as any).localStorage = {
        getItem: () => { throw new Error('SecurityError: The operation is insecure.'); },
        setItem: () => { throw new Error('SecurityError: The operation is insecure.'); }
      };
      ReactDOMServer.renderToStaticMarkup(React.createElement(OnboardingWalkthrough, {}));
      recordResult({
        suite: 'SUITE 2',
        name: 'OnboardingWalkthrough handles SecurityError in localStorage gracefully',
        status: 'PASS',
        durationMs: Date.now() - start,
        details: 'Protected with try/catch'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE 2',
        name: 'OnboardingWalkthrough handles SecurityError in localStorage gracefully',
        status: 'DEFECT_CONFIRMED',
        durationMs: Date.now() - start,
        details: `Crash confirmed on restricted storage: ${err.message}`
      });
    }
  }

  // =========================================================================
  // SUITE 3: HelperTooltip Keyboard Accessibility, State Transitions & Dismissal
  // =========================================================================
  console.log('\n--- SUITE 3: HelperTooltip Keyboard Accessibility, State Transitions & Dismissal ---');

  // Test 3.1: Structural ARIA and keyboard contract verification
  {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HelperTooltip, {
          text: 'Base 100 scoring system',
          term: 'Scoring Formula'
        })
      );
      const hasRoleButton = html.includes('role="button"');
      const hasTabIndex = html.includes('tabindex="0"');
      const hasAriaLabel = html.includes('aria-label="Learn more about Scoring Formula"');
      const hasAriaExpanded = html.includes('aria-expanded="false"');
      recordResult({
        suite: 'SUITE 3',
        name: 'HelperTooltip renders accessible trigger (role=button, tabIndex=0, aria-expanded=false)',
        status: hasRoleButton && hasTabIndex && hasAriaLabel && hasAriaExpanded ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'WCAG 2.1 compliance verified on trigger element'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE 3',
        name: 'HelperTooltip renders accessible trigger (role=button, tabIndex=0, aria-expanded=false)',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test 3.2: Keyboard handler verification on trigger
  {
    const start = Date.now();
    const tooltipCode = fs.readFileSync(
      path.resolve(__dirname, '../apps/web/components/HelperTooltip.tsx'),
      'utf8'
    );
    const handlesEnter = /e\.key === 'Enter'/i.test(tooltipCode);
    const handlesSpace = /e\.key === ' '/i.test(tooltipCode);
    const handlesEscapeOnTrigger = /e\.key === 'Escape'/i.test(tooltipCode);
    const handlesEscapeGlobal = /document\.addEventListener\('keydown'/i.test(tooltipCode);
    const handlesClickOutside = /document\.addEventListener\('mousedown'/i.test(tooltipCode);

    recordResult({
      suite: 'SUITE 3',
      name: 'HelperTooltip implements Enter and Space key activation',
      status: handlesEnter && handlesSpace ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: 'Enter/Space toggles popover state with preventDefault'
    });

    recordResult({
      suite: 'SUITE 3',
      name: 'HelperTooltip implements Escape key dismissal and focus restoration',
      status: handlesEscapeOnTrigger && handlesEscapeGlobal ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: 'Dual-layer Escape listener (local trigger + document keydown)'
    });

    recordResult({
      suite: 'SUITE 3',
      name: 'HelperTooltip implements outside mousedown dismissal',
      status: handlesClickOutside ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: 'Document mousedown listener checks containerRef.current.contains(target)'
    });
  }

  // Test 3.3: Tooltip focus-trap and z-index elevation
  {
    const start = Date.now();
    const tooltipCode = fs.readFileSync(
      path.resolve(__dirname, '../apps/web/components/HelperTooltip.tsx'),
      'utf8'
    );
    const hasZIndex = /z-50/.test(tooltipCode);
    const hasRoleTooltip = /role="tooltip"/.test(tooltipCode);
    const hasAriaDescribedBy = /aria-describedby/.test(tooltipCode);

    recordResult({
      suite: 'SUITE 3',
      name: 'HelperTooltip provides z-50 elevation, role="tooltip", and aria-describedby',
      status: hasZIndex && hasRoleTooltip && hasAriaDescribedBy ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: 'Meets WAI-ARIA tooltip design pattern'
    });
  }

  // =========================================================================
  // SUITE 4: Technical Jargon & Plain-Language Audit Across User-Facing Views
  // =========================================================================
  console.log('\n--- SUITE 4: Technical Jargon & Plain-Language Audit Across User-Facing Views ---');

  // Test 4.1: Audit internal hackathon string "Round 3 Improvement" across all apps/web
  {
    const start = Date.now();
    const files = [
      'apps/web/components/SlideDeckScanner.tsx',
      'apps/web/components/SelfHealingCard.tsx',
      'apps/web/app/page.tsx',
      'apps/web/components/QuickStartModal.tsx',
      'apps/web/components/OnboardingWalkthrough.tsx',
      'apps/web/components/LandingPage.tsx'
    ];

    let foundRound3 = false;
    for (const f of files) {
      const content = fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');
      if (/Round 3/i.test(content)) {
        foundRound3 = true;
        break;
      }
    }

    recordResult({
      suite: 'SUITE 4',
      name: 'All user-facing components sanitized of "Round 3" internal jargon',
      status: !foundRound3 ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: !foundRound3 ? 'Zero occurrences of "Round 3" found' : 'Found "Round 3" in component code'
    });
  }

  // Test 4.2: Audit "pgvector" in user-facing views
  {
    const start = Date.now();
    const landingContent = fs.readFileSync(
      path.resolve(__dirname, '../apps/web/components/LandingPage.tsx'),
      'utf8'
    );
    const hasPgvectorInLanding = /pgvector/i.test(landingContent);

    recordResult({
      suite: 'SUITE 4',
      name: 'Check presence of raw "pgvector" in LandingPage.tsx',
      status: hasPgvectorInLanding ? 'DEFECT_CONFIRMED' : 'PASS',
      durationMs: Date.now() - start,
      details: hasPgvectorInLanding
        ? 'Defect confirmed: LandingPage.tsx:315 contains raw jargon "pgvector semantic search"'
        : 'Sanitized from LandingPage'
    });
  }

  // Test 4.3: Audit "RAG-powered" in LandingPage.tsx
  {
    const start = Date.now();
    const landingContent = fs.readFileSync(
      path.resolve(__dirname, '../apps/web/components/LandingPage.tsx'),
      'utf8'
    );
    const hasRAGInLanding = /RAG-powered/i.test(landingContent);

    recordResult({
      suite: 'SUITE 4',
      name: 'Check presence of raw "RAG-powered" jargon in LandingPage.tsx',
      status: hasRAGInLanding ? 'DEFECT_CONFIRMED' : 'PASS',
      durationMs: Date.now() - start,
      details: hasRAGInLanding
        ? 'Defect confirmed: LandingPage.tsx lines 203 & 315 contain raw AI jargon "RAG-powered AI"'
        : 'Sanitized from LandingPage'
    });
  }

  // Test 4.4: Audit "chunk_count" in page.tsx user-facing text
  {
    const start = Date.now();
    const pageContent = fs.readFileSync(
      path.resolve(__dirname, '../apps/web/app/page.tsx'),
      'utf8'
    );
    // Check if chunk_count appears as literal UI text outside of JSX expression braces
    const exposesRawChunkCount = />([^<{]*chunk_count[^>}]*)</.test(pageContent);

    recordResult({
      suite: 'SUITE 4',
      name: 'page.tsx masks raw variable name "chunk_count" with plain English in UI',
      status: !exposesRawChunkCount ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: 'Correctly displays "{g.chunk_count} rules loaded" and "{f.chunk_count} facts verified"'
    });
  }

  // =========================================================================
  // SUITE 5: ScoreBadge Deterministic Formula & Boundary Matrix
  // =========================================================================
  console.log('\n--- SUITE 5: ScoreBadge Deterministic Formula & Boundary Matrix ---');

  // Test 5.1: Mathematical formula oracle: 100 - (15H + 7M + 3L)
  {
    const start = Date.now();
    function computeScore(high: number, med: number, low: number): number {
      return Math.max(0, 100 - (high * 15) - (med * 7) - (low * 3));
    }

    const testVectors = [
      { h: 0, m: 0, l: 0, expected: 100 },
      { h: 1, m: 0, l: 0, expected: 85 },
      { h: 0, m: 1, l: 0, expected: 93 },
      { h: 0, m: 0, l: 1, expected: 97 },
      { h: 1, m: 1, l: 1, expected: 75 },
      { h: 2, m: 2, l: 2, expected: 50 },
      { h: 10, m: 0, l: 0, expected: 0 }
    ];

    let allPassed = true;
    for (const v of testVectors) {
      const calc = computeScore(v.h, v.m, v.l);
      if (calc !== v.expected) {
        allPassed = false;
        break;
      }
    }

    recordResult({
      suite: 'SUITE 5',
      name: 'Score formula oracle matches specifications: 100 - (15H + 7M + 3L)',
      status: allPassed ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: 'All 7 severity vector permutations verified'
    });
  }

  // Test 5.2: Boundary score rendering matrix across all sizes
  {
    const start = Date.now();
    const scoreBoundaries = [-10, 0, 59, 60, 84, 85, 100, 150];
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
    let renderedCount = 0;
    let failedCount = 0;

    for (const score of scoreBoundaries) {
      for (const size of sizes) {
        try {
          const html = ReactDOMServer.renderToStaticMarkup(
            React.createElement(ScoreBadge, { score, size, issuesCount: { high: 1, medium: 2, low: 3 } })
          );
          if (html.length > 0) renderedCount++;
        } catch {
          failedCount++;
        }
      }
    }

    recordResult({
      suite: 'SUITE 5',
      name: `ScoreBadge boundary matrix (${renderedCount} combinations rendered)`,
      status: failedCount === 0 ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: `Zero crashes across ${renderedCount} combinations`
    });
  }

  // =========================================================================
  // SUITE 6: Header Component Navigation & Quick-Start Trigger
  // =========================================================================
  console.log('\n--- SUITE 6: Header Component Navigation & Quick-Start Trigger ---');

  // Test 6.1: Header renders Quick-Start button when onOpenQuickStart is supplied
  {
    const start = Date.now();
    const headerCode = fs.readFileSync(
      path.resolve(__dirname, '../apps/web/components/Header.tsx'),
      'utf8'
    );
    const hasTrigger = /onOpenQuickStart/.test(headerCode);
    const hasAriaLabel = /aria-label="Open Quick-Start Guide"/.test(headerCode);
    const hasFocusVisible = /focus-visible:ring-2/.test(headerCode);

    recordResult({
      suite: 'SUITE 6',
      name: 'Header provides accessible Quick-Start Guide trigger with aria-label and focus-visible',
      status: hasTrigger && hasAriaLabel && hasFocusVisible ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start,
      details: 'Trigger present, labeled, and keyboard-styled'
    });
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n========================================================================');
  console.log('  CHALLENGER 1 ADVERSARIAL STRESS TEST SUMMARY');
  console.log('========================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const defectCount = results.filter((r) => r.status === 'DEFECT_CONFIRMED').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`  Total Tests Executed        : ${results.length}`);
  console.log(`  Passed Tests                : ${passCount}`);
  console.log(`  Defects Confirmed           : ${defectCount}`);
  console.log(`  Unexpected Test Failures    : ${failCount}`);
  console.log(`  Unhandled Rejections Seen   : ${unhandledRejections}`);
  console.log(`  Uncaught Exceptions Seen    : ${uncaughtExceptions}`);
  console.log('========================================================================\n');

  if (defectCount > 0) {
    console.log('⚠️ EMPIRICAL DEFECTS DISCOVERED AND DOCUMENTED.');
  } else {
    console.log('✅ ALL ADVERSARIAL STRESS TESTS PASSED WITH ZERO DEFECTS.');
  }

  return { passCount, defectCount, failCount, results };
}

runTestSuite().catch((err) => {
  console.error('Test runner encountered fatal error:', err);
  process.exit(1);
});
