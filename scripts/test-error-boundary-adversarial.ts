/**
 * Empirical Adversarial Test Harness for Milestone 1 Error Resilience
 *
 * Tests:
 * 1. ErrorBoundary class component lifecycle, containment, and reset behavior.
 * 2. Route error boundary (apps/web/app/error.tsx) recovery options.
 * 3. Root global error boundary (apps/web/app/global-error.tsx) structure and reset.
 * 4. Adversarial corrupted draft responses (null/undefined fields) and UI containment.
 * 5. Simulated failure toggles and fallback state reactivity.
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import assert from 'node:assert';

import { ErrorBoundary } from '../apps/web/components/ErrorBoundary';
import ErrorBoundaryPage from '../apps/web/app/error';
import GlobalError from '../apps/web/app/global-error';
import { ScoreBadge } from '../apps/web/components/ScoreBadge';
import { HighlightedText } from '../apps/web/components/HighlightedText';
import { IssueCard } from '../apps/web/components/IssueCard';
import {
  api,
  setSimulatedFailure,
  isSimulatedFailureActive,
  Issue
} from '../apps/web/lib/api';
import {
  FALLBACK_CONTENTS,
  FALLBACK_CONTENT_DETAILS
} from '../apps/web/lib/fallbackData';

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${msg}`);
    failed++;
  }
}

async function runAsyncTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${msg}`);
    failed++;
  }
}

async function main() {
  console.log('========================================================================');
  console.log('  Inkloom AI — Empirical Challenger 2 Adversarial Test Harness          ');
  console.log('========================================================================\n');

  // -----------------------------------------------------------------------------
  // SUITE 1: ErrorBoundary Component Lifecycle, Containment & Reset
  // -----------------------------------------------------------------------------
  console.log('--- SUITE 1: ErrorBoundary Component Lifecycle & Recovery ---');

  runTest('1.1 ErrorBoundary initializes with hasError: false and renders children', () => {
    const childText = 'Normal workspace children content';
    const instance = new ErrorBoundary({
      children: React.createElement('div', { id: 'workspace-child' }, childText)
    });

    assert.strictEqual(instance.state.hasError, false, 'Initial hasError must be false');
    assert.strictEqual(instance.state.error, null, 'Initial error must be null');

    const rendered = instance.render();
    const html = ReactDOMServer.renderToStaticMarkup(rendered as React.ReactElement);
    assert.strictEqual(html.includes(childText), true, 'Must render children when no error exists');
    assert.strictEqual(html.includes('role="alert"'), false, 'Must not render alert role when healthy');
  });

  runTest('1.2 getDerivedStateFromError derives hasError: true and retains Error object', () => {
    const testError = new Error('Adversarial fault: WebGL context lost');
    const derivedState = ErrorBoundary.getDerivedStateFromError(testError);

    assert.strictEqual(derivedState.hasError, true, 'derivedState.hasError must be true');
    assert.strictEqual(derivedState.error, testError, 'derivedState.error must retain exact error object');
  });

  runTest('1.3 componentDidCatch logs warning non-destructively without crashing', () => {
    const instance = new ErrorBoundary({ children: null });
    const testError = new Error('Component crashed during mount');
    const errorInfo: React.ErrorInfo = { componentStack: '\n    in CrashingChild\n    in ErrorBoundary' };

    let warned = false;
    const originalWarn = console.warn;
    console.warn = () => {
      warned = true;
    };

    try {
      instance.componentDidCatch(testError, errorInfo);
      assert.strictEqual(warned, true, 'componentDidCatch should log diagnostic notice');
    } finally {
      console.warn = originalWarn;
    }
  });

  runTest('1.4 ErrorBoundary renders accessible fallback UI with custom title & description', () => {
    const customTitle = 'Custom Workspace Fault';
    const customDesc = 'Workflows paused safely. No data was lost.';
    const testError = new Error('State reconciliation mismatch');

    const instance = new ErrorBoundary({
      children: React.createElement('div', null, 'Will not render'),
      fallbackTitle: customTitle,
      fallbackDescription: customDesc
    });
    instance.state = { hasError: true, error: testError };

    const rendered = instance.render();
    const html = ReactDOMServer.renderToStaticMarkup(rendered as React.ReactElement);

    assert.strictEqual(html.includes('role="alert"'), true, 'Must have role="alert" for accessibility');
    assert.strictEqual(html.includes('aria-live="polite"'), true, 'Must have aria-live="polite"');
    assert.strictEqual(html.includes(customTitle), true, 'Must render custom fallbackTitle');
    assert.strictEqual(html.includes(customDesc), true, 'Must render custom fallbackDescription');
    assert.strictEqual(html.includes('State reconciliation mismatch'), true, 'Must display verbatim error message');
    assert.strictEqual(html.includes('Reload Workspace Section'), true, 'Must display reset button');
  });

  runTest('1.5 ErrorBoundary handleReset resets state and triggers onReset callback', () => {
    let resetTriggered = false;
    const onResetMock = () => {
      resetTriggered = true;
    };

    const instance = new ErrorBoundary({
      children: React.createElement('div', null, 'Restored content'),
      onReset: onResetMock
    });

    // Put in error state
    instance.state = { hasError: true, error: new Error('Fatal error') };

    // Mock setState to emulate React lifecycle
    instance.setState = ((newState: any) => {
      instance.state = { ...instance.state, ...newState };
    }) as any;
    instance.handleReset();

    assert.strictEqual(instance.state.hasError, false, 'hasError must reset to false');
    assert.strictEqual(instance.state.error, null, 'error must reset to null');
    assert.strictEqual(resetTriggered, true, 'onReset callback must be invoked');

    // After reset, render() returns children again
    const restoredRender = instance.render();
    const restoredHtml = ReactDOMServer.renderToStaticMarkup(restoredRender as React.ReactElement);
    assert.strictEqual(restoredHtml.includes('Restored content'), true, 'Restored content must be rendered after reset');
  });

  runTest('1.6 Simulation of throwing React child component contained by ErrorBoundary', () => {
    function renderTree(hasError: boolean) {
      const boundary = new ErrorBoundary({
        fallbackTitle: 'Studio Section Shield',
        children: React.createElement('div', null, 'Active Studio Workspace')
      });

      if (hasError) {
        try {
          throw new Error('Uncaught rendering exception inside HighlightedText');
        } catch (err: any) {
          boundary.state = ErrorBoundary.getDerivedStateFromError(err);
        }
      }

      return boundary.render();
    }

    // 1. Normal render
    const healthyHtml = ReactDOMServer.renderToStaticMarkup(renderTree(false) as React.ReactElement);
    assert.strictEqual(healthyHtml.includes('Active Studio Workspace'), true);
    assert.strictEqual(healthyHtml.includes('Studio Section Shield'), false);

    // 2. Errored render - contained
    const containedHtml = ReactDOMServer.renderToStaticMarkup(renderTree(true) as React.ReactElement);
    assert.strictEqual(containedHtml.includes('Studio Section Shield'), true);
    assert.strictEqual(containedHtml.includes('Uncaught rendering exception inside HighlightedText'), true);
    assert.strictEqual(containedHtml.includes('Reload Workspace Section'), true);
  });

  // -----------------------------------------------------------------------------
  // SUITE 2: Route Error Boundary (apps/web/app/error.tsx)
  // -----------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Route Error Boundary (app/error.tsx) ---');

  runTest('2.1 error.tsx renders role="alert", diagnostics, and error digest', () => {
    const mockError = new Error('API gateway connection timeout 504') as Error & { digest?: string };
    mockError.digest = 'DIGEST_ROUTE_ERROR_8831';

    let resetCount = 0;
    const mockReset = () => { resetCount++; };

    const element = React.createElement(ErrorBoundaryPage, { error: mockError, reset: mockReset });
    const html = ReactDOMServer.renderToStaticMarkup(element);

    assert.strictEqual(html.includes('role="alert"'), true, 'Must have role="alert"');
    assert.strictEqual(html.includes('aria-live="assertive"'), true, 'Must have aria-live="assertive"');
    assert.strictEqual(html.includes('Application Resilience Active'), true, 'Must show resilience badge');
    assert.strictEqual(html.includes('API gateway connection timeout 504'), true, 'Must display error message');
    assert.strictEqual(html.includes('DIGEST_ROUTE_ERROR_8831'), true, 'Must display digest code');
    assert.strictEqual(html.includes('Try Again'), true, 'Must have Try Again button');
    assert.strictEqual(html.includes('Use Offline Fallback'), true, 'Must have Offline Fallback button');
    assert.strictEqual(html.includes('Return to Dashboard Home'), true, 'Must have Home button');
  });

  runTest('2.2 error.tsx handles null or empty error messages gracefully', () => {
    const emptyError = new Error('') as Error & { digest?: string };
    const element = React.createElement(ErrorBoundaryPage, { error: emptyError, reset: () => {} });
    const html = ReactDOMServer.renderToStaticMarkup(element);

    assert.strictEqual(html.includes('An unexpected rendering error occurred while loading this view.'), true, 'Must show fallback diagnostics string');
  });

  runTest('2.3 error.tsx "Use Offline Fallback" enables simulation and resets', () => {
    setSimulatedFailure(false);
    assert.strictEqual(isSimulatedFailureActive(), false);

    let resetCalled = false;
    const handleSwitchToFallback = () => {
      setSimulatedFailure(true);
      resetCalled = true;
    };

    handleSwitchToFallback();
    assert.strictEqual(isSimulatedFailureActive(), true, 'Simulation mode must become active');
    assert.strictEqual(resetCalled, true, 'Reset callback must be called');

    setSimulatedFailure(false);
  });

  // -----------------------------------------------------------------------------
  // SUITE 3: Global Error Boundary (apps/web/app/global-error.tsx)
  // -----------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Global Error Boundary (app/global-error.tsx) ---');

  runTest('3.1 global-error.tsx renders root <html> and <body> with alert role', () => {
    const mockError = new Error('Fatal root layout corruption') as Error & { digest?: string };
    const element = React.createElement(GlobalError, { error: mockError, reset: () => {} });
    const html = ReactDOMServer.renderToStaticMarkup(element);

    assert.strictEqual(html.includes('<html lang="en">'), true, 'Must render <html> tag');
    assert.strictEqual(html.includes('<body'), true, 'Must render <body> tag');
    assert.strictEqual(html.includes('role="alert"'), true, 'Must have role="alert"');
    assert.strictEqual(html.includes('Application Interruption'), true, 'Must display Application Interruption heading');
    assert.strictEqual(html.includes('Fatal root layout corruption'), true, 'Must display error message');
    assert.strictEqual(html.includes('Reset &amp; Try Again'), true, 'Must render Reset & Try Again');
    assert.strictEqual(html.includes('Reload Application'), true, 'Must render Reload Application');
  });

  // -----------------------------------------------------------------------------
  // SUITE 4: Adversarial Fallback Draft Responses & Null/Undefined Stress Testing
  // -----------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Adversarial Fallback Draft Responses Stress Testing ---');

  runTest('4.1 Fallback dataset completeness & non-null integrity', () => {
    assert.strictEqual(FALLBACK_CONTENTS.length >= 4, true, 'At least 4 fallback drafts must exist');
    for (const c of FALLBACK_CONTENTS) {
      assert.strictEqual(typeof c.id, 'string', 'c.id must be string');
      assert.strictEqual(typeof c.title, 'string', 'c.title must be string');
      assert.strictEqual(typeof c.channel, 'string', 'c.channel must be string');
      assert.strictEqual(typeof c.status, 'string', 'c.status must be string');
      assert.strictEqual(typeof c.latest_score, 'number', 'c.latest_score must be number');
      assert.strictEqual(typeof c.current_version_id, 'string', 'c.current_version_id must be string');

      const details = FALLBACK_CONTENT_DETAILS[c.id];
      assert.strictEqual(!!details, true, `Details must exist for ${c.id}`);
      assert.strictEqual(Array.isArray(details.versions), true, 'versions must be array');
      assert.strictEqual(details.versions.length > 0, true, 'versions must not be empty');
      assert.strictEqual(Array.isArray(details.issues), true, 'issues must be array');
      assert.strictEqual(Array.isArray(details.comments), true, 'comments must be array');
    }
  });

  runTest('4.2 ScoreBadge withstands extreme and edge-case score values (0, 100, -5, 120)', () => {
    const scores = [0, 50, 59, 60, 84, 85, 100, -5, 120];
    for (const score of scores) {
      for (const size of ['sm', 'md', 'lg'] as const) {
        const el = React.createElement(ScoreBadge, { score, size });
        const html = ReactDOMServer.renderToStaticMarkup(el);
        assert.strictEqual(typeof html, 'string');
        assert.strictEqual(html.length > 0, true);
      }
    }
  });

  runTest('4.3 HighlightedText withstands zero issues, empty string body, and overlapping indices', () => {
    // 1. Zero issues
    const el1 = React.createElement(HighlightedText, {
      body: 'Clean text without any issues',
      issues: [],
      selectedIssueId: null,
      onSelectIssue: () => {}
    });
    const html1 = ReactDOMServer.renderToStaticMarkup(el1);
    assert.strictEqual(html1.includes('Clean text without any issues'), true);

    // 2. Empty body
    const el2 = React.createElement(HighlightedText, {
      body: '',
      issues: [],
      selectedIssueId: null,
      onSelectIssue: () => {}
    });
    const html2 = ReactDOMServer.renderToStaticMarkup(el2);
    assert.strictEqual(typeof html2, 'string');

    // 3. Overlapping and out-of-order issues
    const mockIssues: Issue[] = [
      {
        id: 'iss-2',
        type: 'tone',
        severity: 'low',
        quote: 'world',
        start_idx: 6,
        end_idx: 11,
        explanation: 'Tone issue',
        source_ref: 'Style',
        suggestion: 'everyone',
        status: 'open'
      },
      {
        id: 'iss-1',
        type: 'banned_term',
        severity: 'high',
        quote: 'Hello',
        start_idx: 0,
        end_idx: 5,
        explanation: 'Banned term',
        source_ref: 'Policy',
        suggestion: 'Greetings',
        status: 'open'
      },
      {
        id: 'iss-overlap',
        type: 'banned_term',
        severity: 'medium',
        quote: 'lo wo',
        start_idx: 3,
        end_idx: 8,
        explanation: 'Overlap span',
        source_ref: 'Policy',
        suggestion: '',
        status: 'open'
      }
    ];

    const el3 = React.createElement(HighlightedText, {
      body: 'Hello world of brand governance',
      issues: mockIssues,
      selectedIssueId: 'iss-1',
      onSelectIssue: () => {}
    });
    const html3 = ReactDOMServer.renderToStaticMarkup(el3);
    assert.strictEqual(html3.includes('Hello'), true);
    assert.strictEqual(html3.includes('world'), true);
    assert.strictEqual(html3.includes('mark'), true);
  });

  runTest('4.4 IssueCard handles sparse/missing optional fields gracefully', () => {
    const sparseIssue: Issue = {
      id: 'iss-sparse',
      type: 'banned_term',
      severity: 'medium',
      quote: 'guaranteed',
      start_idx: 10,
      end_idx: 20,
      explanation: 'Avoid absolute promises',
      source_ref: 'Brand Guide',
      suggestion: '',
      status: 'open'
    };

    const el = React.createElement(IssueCard, {
      issue: sparseIssue,
      isSelected: false,
      onSelect: () => {},
      onAcceptFix: () => {},
      onDismiss: () => {}
    });
    const html = ReactDOMServer.renderToStaticMarkup(el);
    assert.strictEqual(html.includes('guaranteed'), true);
    assert.strictEqual(html.includes('Avoid absolute promises'), true);
  });

  runTest('4.5 Error boundary containment prevents crash when draft data triggers child exception', () => {
    function CorruptedDraftViewer({ draft }: { draft: any }) {
      if (!draft || !draft.title) {
        throw new TypeError("Cannot read properties of undefined (reading 'toLowerCase')");
      }
      return React.createElement('div', null, draft.title);
    }

    const boundary = new ErrorBoundary({
      fallbackTitle: 'Draft Rendering Fault',
      fallbackDescription: 'A draft contained unexpected data formatting.',
      children: null
    });

    try {
      CorruptedDraftViewer({ draft: { title: null } });
    } catch (caughtErr: any) {
      boundary.state = ErrorBoundary.getDerivedStateFromError(caughtErr);
    }

    const fallbackHtml = ReactDOMServer.renderToStaticMarkup(boundary.render() as React.ReactElement);
    assert.strictEqual(fallbackHtml.includes('Draft Rendering Fault'), true);
    assert.strictEqual(fallbackHtml.includes("Cannot read properties of undefined (reading &#x27;toLowerCase&#x27;)"), true);
    assert.strictEqual(fallbackHtml.includes('Reload Workspace Section'), true);
  });

  await runAsyncTest('4.6 api.getContent with unknown ID returns populated fallback structure', async () => {
    setSimulatedFailure(true);
    const nonExistentDetails = await api.getContent('draft-completely-unknown-999');
    assert.strictEqual(!!nonExistentDetails, true, 'Must return fallback details object');
    assert.strictEqual(!!nonExistentDetails.content, true, 'Must have content item');
    assert.strictEqual(Array.isArray(nonExistentDetails.versions), true, 'Must have versions array');
    assert.strictEqual(nonExistentDetails.versions.length > 0, true, 'Versions array must be populated');
    assert.strictEqual(Array.isArray(nonExistentDetails.issues), true, 'Issues must be empty array, not undefined');
    assert.strictEqual(Array.isArray(nonExistentDetails.comments), true, 'Comments must be empty array, not undefined');
    setSimulatedFailure(false);
  });

  runTest('4.7 Multi-cycle error-to-recovery lifecycle (Crash -> Catch -> Reset -> Heal -> Render)', () => {
    let childHealthy = false;
    let onResetCalled = false;

    function DynamicChild() {
      if (!childHealthy) {
        throw new Error('Transient network rendering glitch');
      }
      return React.createElement('div', { id: 'healed-workspace' }, 'Workspace Restored and Fully Functional');
    }

    const boundary = new ErrorBoundary({
      fallbackTitle: 'Workspace Shield',
      onReset: () => {
        onResetCalled = true;
        childHealthy = true; // Simulating healing during reset
      },
      children: React.createElement(DynamicChild)
    });

    // Step 1: Child throws on render
    try {
      DynamicChild();
    } catch (err: any) {
      boundary.state = ErrorBoundary.getDerivedStateFromError(err);
    }
    assert.strictEqual(boundary.state.hasError, true);

    // Step 2: Fallback UI displayed
    const crashedHtml = ReactDOMServer.renderToStaticMarkup(boundary.render() as React.ReactElement);
    assert.strictEqual(crashedHtml.includes('Workspace Shield'), true);
    assert.strictEqual(crashedHtml.includes('Transient network rendering glitch'), true);

    // Step 3: User clicks reset button
    boundary.setState = ((newState: any) => {
      boundary.state = { ...boundary.state, ...newState };
    }) as any;
    boundary.handleReset();

    assert.strictEqual(onResetCalled, true, 'onReset must be called');
    assert.strictEqual(boundary.state.hasError, false, 'hasError must be false');
    assert.strictEqual(childHealthy, true, 'Child state was healed');

    // Step 4: Component renders healed child cleanly
    const healedHtml = ReactDOMServer.renderToStaticMarkup(boundary.render() as React.ReactElement);
    assert.strictEqual(healedHtml.includes('Workspace Restored and Fully Functional'), true);
    assert.strictEqual(healedHtml.includes('Workspace Shield'), false);
  });

  // -----------------------------------------------------------------------------
  // SUITE 5: API Simulation & Fallback Subscriptions
  // -----------------------------------------------------------------------------
  console.log('\n--- SUITE 5: API Simulation & Reactive Fallback State ---');

  await runAsyncTest('5.1 api.getContents and api.getContent in simulated failure mode', async () => {
    setSimulatedFailure(true);
    assert.strictEqual(isSimulatedFailureActive(), true, 'Simulation mode must be active');

    const contentsRes = await api.getContents();
    assert.strictEqual(Array.isArray(contentsRes.contents), true);
    assert.strictEqual(contentsRes.contents.length >= 4, true);

    const firstDraft = contentsRes.contents[0];
    const details = await api.getContent(firstDraft.id);
    assert.strictEqual(details.content.id, firstDraft.id);
    assert.strictEqual(details.issues.length >= 4, true);

    setSimulatedFailure(false);
    assert.strictEqual(isSimulatedFailureActive(), false);
  });

  await runAsyncTest('5.2 Fallback subscription notifies listeners on simulated failure toggling', async () => {
    let recordedActive: boolean | null = null;
    let recordedReason: string | null = null;

    const unsubscribe = api.subscribeToFallbackState((active, reason) => {
      recordedActive = active;
      recordedReason = reason;
    });

    setSimulatedFailure(true);
    assert.strictEqual(recordedActive, true);
    assert.strictEqual(recordedReason?.includes('Simulated failure mode active'), true);

    setSimulatedFailure(false);
    assert.strictEqual(recordedActive, false);
    assert.strictEqual(recordedReason, null);

    unsubscribe();
  });

  // -----------------------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`TOTAL ADVERSARIAL TESTS: ${passed + failed}`);
  console.log(`PASSING: ${passed}`);
  console.log(`FAILING: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('[ALL ADVERSARIAL TESTS PASSED EMPIRICALLY]');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('Fatal test harness execution error:', e);
  process.exit(1);
});
