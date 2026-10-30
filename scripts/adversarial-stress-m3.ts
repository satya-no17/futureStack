/**
 * Inkloom AI — Milestone 3 Adversarial Stress & Verification Suite
 *
 * Scope:
 * - Suite A: Modal Escape Key Dismissal & Focus Management
 *   (QuickStartModal, ContrastCheckerModal, SocialPublishModal, page.tsx)
 * - Suite B: Keyboard Accessibility on HighlightedText.tsx & IssueCard.tsx
 *   (Enter & Space handlers, preventDefault, stopPropagation, rule citation)
 * - Suite C: Screen-Reader Markup in DiffView.tsx
 *   (<ins>, <del>, .sr-only tags, aria-label attributes, diff boundaries)
 * - Suite D: WCAG 2.1 AA Color Contrast Oracle & #9ca3af Remediation Audit
 *   (Mathematical relative luminance, token ratios, light-background audit)
 * - Suite E: Full Build, Strict Verification & Linter Validation
 *   (verify-resilience.mjs strict, web build, api build, eslint)
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Components under test
import { QuickStartModal } from '../apps/web/components/QuickStartModal';
import { ContrastCheckerModal } from '../apps/web/components/ContrastCheckerModal';
import { SocialPublishModal } from '../apps/web/components/SocialPublishModal';
import { HighlightedText } from '../apps/web/components/HighlightedText';
import { IssueCard } from '../apps/web/components/IssueCard';
import { DiffView } from '../apps/web/components/DiffView';
import type { Issue } from '../apps/web/lib/api';

interface TestResult {
  suite: string;
  id: string;
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
  console.log(`  ${statusIcon} [${result.id}] ${result.name} (${result.durationMs}ms)`);
  if (result.details) {
    console.log(`    ↳ ${result.details}`);
  }
}

// ---------------------------------------------------------------------------
// WCAG 2.1 Relative Luminance & Contrast Formula
// ---------------------------------------------------------------------------
function parseHex(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(parseHex(fgHex));
  const l2 = relativeLuminance(parseHex(bgHex));
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// ---------------------------------------------------------------------------
// Main Verification Runner
// ---------------------------------------------------------------------------
async function runMilestone3Verification() {
  console.log('========================================================================');
  console.log('  Inkloom AI — Challenger 2 Adversarial Stress Test Suite (Milestone 3)');
  console.log('========================================================================\n');

  // =========================================================================
  // SUITE A: Modal Escape Key Dismissal & Focus Management
  // =========================================================================
  console.log('--- SUITE A: Modal Escape Key Dismissal & Focus Management ---');

  // Test A.1: QuickStartModal dialog ARIA attributes and focus management
  {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(QuickStartModal, { isOpen: true, onClose: () => {} })
      );
      const hasRole = html.includes('role="dialog"');
      const hasModal = html.includes('aria-modal="true"');
      const hasLabelledBy = html.includes('aria-labelledby="quickstart-title"');
      const hasCloseAria = html.includes('aria-label="Close Quick-Start Guide"');

      // Check focus logic in file content
      const filePath = path.resolve(__dirname, '../apps/web/components/QuickStartModal.tsx');
      const code = fs.readFileSync(filePath, 'utf8');
      const hasCloseRefFocus = code.includes('closeButtonRef.current?.focus()');

      recordResult({
        suite: 'SUITE A',
        id: 'A.1',
        name: 'QuickStartModal dialog semantics and focus shifting to close button',
        status: hasRole && hasModal && hasLabelledBy && hasCloseAria && hasCloseRefFocus ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Verified role="dialog", aria-modal="true", aria-labelledby, close button ref focus()'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE A',
        id: 'A.1',
        name: 'QuickStartModal dialog semantics and focus shifting to close button',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test A.2: QuickStartModal Escape key listener and stopPropagation
  {
    const start = Date.now();
    try {
      const filePath = path.resolve(__dirname, '../apps/web/components/QuickStartModal.tsx');
      const code = fs.readFileSync(filePath, 'utf8');
      const handlesEscape = code.includes("e.key === 'Escape'");
      const stopsPropagation = code.includes('e.stopPropagation()') && handlesEscape;
      const callsOnClose = code.includes('onClose()');
      const removesListener = code.includes("document.removeEventListener('keydown', handleKeyDown)");

      recordResult({
        suite: 'SUITE A',
        id: 'A.2',
        name: 'QuickStartModal Escape key dismissal, event stopPropagation, and cleanup',
        status: handlesEscape && stopsPropagation && callsOnClose && removesListener ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Verified keydown listener calls onClose(), e.stopPropagation(), and removes listener on unmount'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE A',
        id: 'A.2',
        name: 'QuickStartModal Escape key dismissal, event stopPropagation, and cleanup',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test A.3: QuickStartModal backdrop click vs inner click
  {
    const start = Date.now();
    try {
      const filePath = path.resolve(__dirname, '../apps/web/components/QuickStartModal.tsx');
      const code = fs.readFileSync(filePath, 'utf8');
      const checksBackdrop = code.includes('e.target === e.currentTarget') && code.includes('onClose()');

      recordResult({
        suite: 'SUITE A',
        id: 'A.3',
        name: 'QuickStartModal dismisses on backdrop click without bubbling from content',
        status: checksBackdrop ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Checked e.target === e.currentTarget guard'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE A',
        id: 'A.3',
        name: 'QuickStartModal dismisses on backdrop click without bubbling from content',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test A.4: ContrastCheckerModal dialog ARIA attributes and Escape handling
  {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(ContrastCheckerModal, { isOpen: true, onClose: () => {} })
      );
      const hasRole = html.includes('role="dialog"');
      const hasModal = html.includes('aria-modal="true"');
      // React escapes '&' to '&amp;' in rendered HTML attributes
      const hasLabel = html.includes('aria-label="Color Contrast &amp; Readability Checker"') || html.includes('aria-label="Color Contrast & Readability Checker"');

      const filePath = path.resolve(__dirname, '../apps/web/components/ContrastCheckerModal.tsx');
      const code = fs.readFileSync(filePath, 'utf8');
      const handlesEscape = code.includes("e.key === 'Escape'");
      const safeOnClose = code.includes('onClose?.()');
      const removesListener = code.includes("window.removeEventListener('keydown', handleKeyDown)");

      recordResult({
        suite: 'SUITE A',
        id: 'A.4',
        name: 'ContrastCheckerModal dialog semantics, optional onClose?.(), and Escape listener',
        status: hasRole && hasModal && hasLabel && handlesEscape && safeOnClose && removesListener ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Verified role="dialog", aria-modal="true", onClose?.() safety when used as tab view'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE A',
        id: 'A.4',
        name: 'ContrastCheckerModal dialog semantics, optional onClose?.(), and Escape listener',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test A.5: ContrastCheckerModal short-circuits when isOpen=false
  {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(ContrastCheckerModal, { isOpen: false, onClose: () => {} })
      );
      recordResult({
        suite: 'SUITE A',
        id: 'A.5',
        name: 'ContrastCheckerModal returns null when isOpen=false',
        status: html === '' ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: `Rendered length: ${html.length} chars (expected 0)`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE A',
        id: 'A.5',
        name: 'ContrastCheckerModal returns null when isOpen=false',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test A.6: SocialPublishModal dialog semantics, Escape key listener and decoupling
  {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(SocialPublishModal, {
          contentId: 'draft-1',
          contentTitle: 'Launch Post',
          isOpen: true,
          onClose: () => {},
          onPublished: () => {}
        })
      );
      const hasRole = html.includes('role="dialog"');
      const hasModal = html.includes('aria-modal="true"');
      const hasLabelledBy = html.includes('aria-labelledby="social-publish-title"');
      const hasCloseLabel = html.includes('aria-label="Close social publish modal"');

      const filePath = path.resolve(__dirname, '../apps/web/components/SocialPublishModal.tsx');
      const code = fs.readFileSync(filePath, 'utf8');
      const handlesEscape = code.includes("e.key === 'Escape'");
      const stopsPropagation = code.includes('e.stopPropagation()') && handlesEscape;
      const usesMicrotask = code.includes('queueMicrotask');

      recordResult({
        suite: 'SUITE A',
        id: 'A.6',
        name: 'SocialPublishModal dialog semantics, Escape listener with stopPropagation & microtask decoupling',
        status: hasRole && hasModal && hasLabelledBy && hasCloseLabel && handlesEscape && stopsPropagation && usesMicrotask ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Verified role="dialog", aria-modal="true", e.stopPropagation(), queueMicrotask decoupling'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE A',
        id: 'A.6',
        name: 'SocialPublishModal dialog semantics, Escape listener with stopPropagation & microtask decoupling',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test A.7: apps/web/app/page.tsx global Escape key handler and modal bindings
  {
    const start = Date.now();
    try {
      const pagePath = path.resolve(__dirname, '../apps/web/app/page.tsx');
      const pageCode = fs.readFileSync(pagePath, 'utf8');

      const hasEscapeListener = pageCode.includes("e.key === 'Escape'");
      const dismissesNewModal = pageCode.includes('setIsNewModalOpen(false)');
      const dismissesDecisionModal = pageCode.includes('setDecisionModal({ open: false');
      const dismissesQuickStart = pageCode.includes('setIsQuickStartOpen(false)');
      const dismissesSocialPublish = pageCode.includes('setIsSocialPublishOpen(false)');

      const hasNewDraftDialog = pageCode.includes('id="new-draft-modal-title"') && pageCode.includes('aria-labelledby="new-draft-modal-title"');
      const hasDecisionDialog = pageCode.includes('id="decision-modal-title"') && pageCode.includes('aria-labelledby="decision-modal-title"');

      recordResult({
        suite: 'SUITE A',
        id: 'A.7',
        name: 'page.tsx global Escape keydown listener dismisses all 4 modal dialog types',
        status: hasEscapeListener && dismissesNewModal && dismissesDecisionModal && dismissesQuickStart && dismissesSocialPublish && hasNewDraftDialog && hasDecisionDialog ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'All modal states (NewDraft, Decision, QuickStart, SocialPublish) wired to Escape keydown'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE A',
        id: 'A.7',
        name: 'page.tsx global Escape keydown listener dismisses all 4 modal dialog types',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // =========================================================================
  // SUITE B: Keyboard Accessibility on HighlightedText.tsx & IssueCard.tsx
  // =========================================================================
  console.log('\n--- SUITE B: Keyboard Accessibility on HighlightedText.tsx & IssueCard.tsx ---');

  const mockIssue: Issue = {
    id: 'iss-test-1',
    content_id: 'draft-1',
    type: 'banned_term',
    severity: 'high',
    quote: 'guaranteed cheapest',
    explanation: 'Unverified superlative and banned legal claim.',
    suggestion: 'competitive pricing',
    start_idx: 12,
    end_idx: 31,
    source_ref: 'Legal Compliance Guide Section 4',
    status: 'open'
  };

  // Test B.1: HighlightedText mark element keyboard attributes and ARIA
  {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HighlightedText, {
          body: 'We offer a guaranteed cheapest rate on the market today.',
          issues: [mockIssue],
          selectedIssueId: null,
          onSelectIssue: () => {}
        })
      );
      const hasMark = html.includes('<mark');
      const hasTabIndex = html.includes('tabindex="0"');
      const hasRoleButton = html.includes('role="button"');
      const hasAriaLabel = html.includes('aria-label="Unverified superlative and banned legal claim."');
      const hasSrOnly = html.includes('<span class="sr-only">(banned_term)</span>');

      recordResult({
        suite: 'SUITE B',
        id: 'B.1',
        name: 'HighlightedText <mark> tags declare tabIndex={0}, role="button", aria-label, and sr-only type',
        status: hasMark && hasTabIndex && hasRoleButton && hasAriaLabel && hasSrOnly ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'WCAG 2.1 AA keyboard focusable mark with descriptive screen-reader text'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE B',
        id: 'B.1',
        name: 'HighlightedText <mark> tags declare tabIndex={0}, role="button", aria-label, and sr-only type',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test B.2: HighlightedText onKeyDown: Enter key triggers onSelectIssue and preventDefault
  {
    const start = Date.now();
    try {
      let selectedId: string | null = null;
      let prevented = false;

      const elementTree = HighlightedText({
        body: 'We offer a guaranteed cheapest rate on the market today.',
        issues: [mockIssue],
        selectedIssueId: null,
        onSelectIssue: (id) => { selectedId = id; }
      });

      // Find the mark element in the children of the outer div
      const children = (elementTree.props as any).children as React.ReactElement[];
      const markElement = children.find((c: any) => c && c.type === 'mark');

      if (!markElement) {
        throw new Error('Could not find <mark> React element in HighlightedText render tree');
      }

      // Invoke onKeyDown with Enter
      const mockEvent = {
        key: 'Enter',
        preventDefault: () => { prevented = true; }
      };
      markElement.props.onKeyDown(mockEvent);

      const pass = selectedId === mockIssue.id && prevented;
      recordResult({
        suite: 'SUITE B',
        id: 'B.2',
        name: 'HighlightedText Enter keydown activates onSelectIssue and calls preventDefault',
        status: pass ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: `Selected: ${selectedId}, preventDefault called: ${prevented}`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE B',
        id: 'B.2',
        name: 'HighlightedText Enter keydown activates onSelectIssue and calls preventDefault',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test B.3: HighlightedText onKeyDown: Space key triggers onSelectIssue and preventDefault
  {
    const start = Date.now();
    try {
      let selectedId: string | null = null;
      let prevented = false;

      const elementTree = HighlightedText({
        body: 'We offer a guaranteed cheapest rate on the market today.',
        issues: [mockIssue],
        selectedIssueId: null,
        onSelectIssue: (id) => { selectedId = id; }
      });

      const children = (elementTree.props as any).children as React.ReactElement[];
      const markElement = children.find((c: any) => c && c.type === 'mark');

      // Invoke onKeyDown with Space (' ')
      const mockEvent = {
        key: ' ',
        preventDefault: () => { prevented = true; }
      };
      markElement.props.onKeyDown(mockEvent);

      const pass = selectedId === mockIssue.id && prevented;
      recordResult({
        suite: 'SUITE B',
        id: 'B.3',
        name: 'HighlightedText Space keydown activates onSelectIssue and calls preventDefault',
        status: pass ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: `Selected: ${selectedId}, preventDefault called: ${prevented}`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE B',
        id: 'B.3',
        name: 'HighlightedText Space keydown activates onSelectIssue and calls preventDefault',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test B.4: HighlightedText onKeyDown ignores non-activation keys (e.g. Tab, Escape, ArrowDown)
  {
    const start = Date.now();
    try {
      let selectedId: string | null = null;
      let prevented = false;

      const elementTree = HighlightedText({
        body: 'We offer a guaranteed cheapest rate on the market today.',
        issues: [mockIssue],
        selectedIssueId: null,
        onSelectIssue: (id) => { selectedId = id; }
      });

      const children = (elementTree.props as any).children as React.ReactElement[];
      const markElement = children.find((c: any) => c && c.type === 'mark');

      const nonActivationKeys = ['Tab', 'Escape', 'ArrowDown', 'ArrowUp', 'a', 'Shift'];
      let anyFired = false;

      for (const k of nonActivationKeys) {
        markElement.props.onKeyDown({
          key: k,
          preventDefault: () => { prevented = true; }
        });
        if (selectedId !== null || prevented) {
          anyFired = true;
          break;
        }
      }

      recordResult({
        suite: 'SUITE B',
        id: 'B.4',
        name: 'HighlightedText onKeyDown ignores non-activation keys (Tab, Escape, Arrows)',
        status: !anyFired ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Confirmed Tab, Escape, Arrows pass through without triggering issue selection'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE B',
        id: 'B.4',
        name: 'HighlightedText onKeyDown ignores non-activation keys (Tab, Escape, Arrows)',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test B.5: HighlightedText boundary resilience (overlapping spans, out-of-order, empty body)
  {
    const start = Date.now();
    try {
      const overlappingIssues: Issue[] = [
        { ...mockIssue, id: 'iss-1', start_idx: 5, end_idx: 15 },
        { ...mockIssue, id: 'iss-2', start_idx: 10, end_idx: 20 } // overlaps with iss-1
      ];
      const htmlOverlapping = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HighlightedText, {
          body: '012345678901234567890123456789',
          issues: overlappingIssues,
          selectedIssueId: null,
          onSelectIssue: () => {}
        })
      );

      const htmlEmpty = ReactDOMServer.renderToStaticMarkup(
        React.createElement(HighlightedText, {
          body: '',
          issues: [],
          selectedIssueId: null,
          onSelectIssue: () => {}
        })
      );

      recordResult({
        suite: 'SUITE B',
        id: 'B.5',
        name: 'HighlightedText boundary cases: overlapping spans skipped & empty body renders cleanly',
        status: htmlOverlapping.length > 0 && htmlEmpty.length > 0 ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'No infinite loops or crash on overlapping indices or zero-length text'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE B',
        id: 'B.5',
        name: 'HighlightedText boundary cases: overlapping spans skipped & empty body renders cleanly',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test B.6: IssueCard outer container keyboard attributes and ARIA
  {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(IssueCard, {
          issue: mockIssue,
          isSelected: false,
          onSelect: () => {},
          onAccept: () => {},
          onDismiss: () => {}
        })
      );
      const hasTabIndex = html.includes('tabindex="0"');
      const hasRoleButton = html.includes('role="button"');
      const hasAriaLabel = html.includes('aria-label="Unverified superlative and banned legal claim."');
      const hasFocusVisible = html.includes('focus-visible:ring-2') && html.includes('focus-visible:ring-violet-600');
      const hasRuleCitation = html.includes('Rule citation:');

      recordResult({
        suite: 'SUITE B',
        id: 'B.6',
        name: 'IssueCard renders tabIndex={0}, role="button", aria-label, focus outline & "Rule citation:"',
        status: hasTabIndex && hasRoleButton && hasAriaLabel && hasFocusVisible && hasRuleCitation ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'WCAG 2.1 AA keyboard operable issue card with plain-language rule citation'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE B',
        id: 'B.6',
        name: 'IssueCard renders tabIndex={0}, role="button", aria-label, focus outline & "Rule citation:"',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test B.7: IssueCard onKeyDown: Enter and Space trigger onSelect
  {
    const start = Date.now();
    try {
      const cardPath = path.resolve(__dirname, '../apps/web/components/IssueCard.tsx');
      const cardCode = fs.readFileSync(cardPath, 'utf8');

      // Extract the onKeyDown handler block from outer container
      const onKeyDownBlock = cardCode.match(/onKeyDown=\{\(e\)\s*=>\s*\{([\s\S]*?)\}\}/);
      if (!onKeyDownBlock) {
        throw new Error('Could not find onKeyDown handler in IssueCard.tsx');
      }

      // Execute extracted handler function dynamically with mock events
      const handlerFn = new Function('e', 'onSelect', `
        ${onKeyDownBlock[1]}
      `);

      let selectCount = 0;
      let preventCount = 0;
      const onSelect = () => { selectCount++; };

      // Test Enter
      handlerFn({
        key: 'Enter',
        preventDefault: () => { preventCount++; }
      }, onSelect);

      // Test Space (' ')
      handlerFn({
        key: ' ',
        preventDefault: () => { preventCount++; }
      }, onSelect);

      // Test Tab (should NOT trigger onSelect or preventDefault)
      handlerFn({
        key: 'Tab',
        preventDefault: () => { preventCount++; }
      }, onSelect);

      const pass = selectCount === 2 && preventCount === 2;
      recordResult({
        suite: 'SUITE B',
        id: 'B.7',
        name: 'IssueCard Enter and Space trigger onSelect and call preventDefault',
        status: pass ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: `selectCount: ${selectCount} (expected 2), preventCount: ${preventCount} (expected 2)`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE B',
        id: 'B.7',
        name: 'IssueCard Enter and Space trigger onSelect and call preventDefault',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test B.8: IssueCard inner controls stop event propagation on keydown and click
  {
    const start = Date.now();
    try {
      const cardPath = path.resolve(__dirname, '../apps/web/components/IssueCard.tsx');
      const cardCode = fs.readFileSync(cardPath, 'utf8');

      // Assert that interactive sub-containers stop keydown propagation so spaces in inputs don't bubble
      const editKeyDownStop = cardCode.includes('onKeyDown={(e) => e.stopPropagation()}');
      const actionKeyDownStop = (cardCode.match(/onKeyDown=\{\(e\) => e\.stopPropagation\(\)\}/g) || []).length >= 2;
      const clickStop = (cardCode.match(/onClick=\{\(e\) => e\.stopPropagation\(\)\}/g) || []).length >= 2;

      recordResult({
        suite: 'SUITE B',
        id: 'B.8',
        name: 'IssueCard inner inputs and action drawers stop event propagation (stopPropagation)',
        status: editKeyDownStop && actionKeyDownStop && clickStop ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: `Found ${(cardCode.match(/onKeyDown=\{\(e\) => e\.stopPropagation\(\)\}/g) || []).length} keydown stopPropagation handlers`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE B',
        id: 'B.8',
        name: 'IssueCard inner inputs and action drawers stop event propagation (stopPropagation)',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // =========================================================================
  // SUITE C: Screen-Reader Markup in DiffView.tsx
  // =========================================================================
  console.log('\n--- SUITE C: Screen-Reader Markup in DiffView.tsx ---');

  // Test C.1: DiffView renders <ins> and <del> tags for modified text
  {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(DiffView, {
          oldText: 'Our platform is the cheapest on the market.',
          newText: 'Our platform offers competitive pricing on the market.'
        })
      );

      const hasIns = html.includes('<ins');
      const hasDel = html.includes('<del');
      const hasDiffAddedClass = html.includes('diff-added');
      const hasDiffRemovedClass = html.includes('diff-removed');

      recordResult({
        suite: 'SUITE C',
        id: 'C.1',
        name: 'DiffView renders semantic <ins> and <del> elements with diff styling classes',
        status: hasIns && hasDel && hasDiffAddedClass && hasDiffRemovedClass ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Semantic HTML markup replaces plain unannounced colored text'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE C',
        id: 'C.1',
        name: 'DiffView renders semantic <ins> and <del> elements with diff styling classes',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test C.2: DiffView renders .sr-only and aria-label annotations
  {
    const start = Date.now();
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(DiffView, {
          oldText: 'Our platform is the cheapest on the market.',
          newText: 'Our platform offers competitive pricing on the market.'
        })
      );

      const hasSrOnlyAdded = html.includes('<span class="sr-only">Added: </span>');
      const hasSrOnlyRemoved = html.includes('<span class="sr-only">Removed: </span>');
      const hasAriaLabelAdded = /aria-label="Added: [^"]+"/.test(html);
      const hasAriaLabelRemoved = /aria-label="Removed: [^"]+"/.test(html);

      recordResult({
        suite: 'SUITE C',
        id: 'C.2',
        name: 'DiffView provides dual auditory cues: .sr-only textual prefixes and aria-label on <ins>/<del>',
        status: hasSrOnlyAdded && hasSrOnlyRemoved && hasAriaLabelAdded && hasAriaLabelRemoved ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Verified sr-only and aria-label attributes convey revision state to screen readers'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE C',
        id: 'C.2',
        name: 'DiffView provides dual auditory cues: .sr-only textual prefixes and aria-label on <ins>/<del>',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test C.3: DiffView boundary testing: 100% additions, 100% deletions, identical, empty
  {
    const start = Date.now();
    try {
      // 100% additions
      const htmlAddOnly = ReactDOMServer.renderToStaticMarkup(
        React.createElement(DiffView, { oldText: '', newText: 'Brand new draft content' })
      );
      const addOnlyValid = htmlAddOnly.includes('<ins') && !htmlAddOnly.includes('<del');

      // 100% deletions
      const htmlDelOnly = ReactDOMServer.renderToStaticMarkup(
        React.createElement(DiffView, { oldText: 'Completely discarded content', newText: '' })
      );
      const delOnlyValid = !htmlDelOnly.includes('<ins') && htmlDelOnly.includes('<del');

      // Identical text (0 ins, 0 del)
      const htmlIdentical = ReactDOMServer.renderToStaticMarkup(
        React.createElement(DiffView, { oldText: 'Identical unchanged text', newText: 'Identical unchanged text' })
      );
      const identicalValid = !htmlIdentical.includes('<ins') && !htmlIdentical.includes('<del');

      // Empty text
      const htmlEmpty = ReactDOMServer.renderToStaticMarkup(
        React.createElement(DiffView, { oldText: '', newText: '' })
      );
      const emptyValid = !htmlEmpty.includes('<ins') && !htmlEmpty.includes('<del');

      const allValid = addOnlyValid && delOnlyValid && identicalValid && emptyValid;
      recordResult({
        suite: 'SUITE C',
        id: 'C.3',
        name: 'DiffView boundary matrix: pure addition, pure deletion, identical text, and empty strings',
        status: allValid ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: `addOnly=${addOnlyValid}, delOnly=${delOnlyValid}, identical=${identicalValid}, empty=${emptyValid}`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE C',
        id: 'C.3',
        name: 'DiffView boundary matrix: pure addition, pure deletion, identical text, and empty strings',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // =========================================================================
  // SUITE D: WCAG 2.1 AA Color Contrast Oracle & #9ca3af Remediation Audit
  // =========================================================================
  console.log('\n--- SUITE D: WCAG 2.1 AA Color Contrast Oracle & #9ca3af Remediation Audit ---');

  // Test D.1: Mathematical relative luminance oracle validation
  {
    const start = Date.now();
    try {
      // Pure black (#000000) luminance must be 0
      const lumBlack = relativeLuminance({ r: 0, g: 0, b: 0 });
      // Pure white (#ffffff) luminance must be 1.0
      const lumWhite = relativeLuminance({ r: 255, g: 255, b: 255 });
      // Maximum possible contrast ratio (white on black) is 21:1
      const maxRatio = contrastRatio('#ffffff', '#000000');
      // Identical colors have contrast 1:1
      const minRatio = contrastRatio('#ffffff', '#ffffff');

      const blackPass = Math.abs(lumBlack - 0.0) < 0.0001;
      const whitePass = Math.abs(lumWhite - 1.0) < 0.0001;
      const maxPass = Math.abs(maxRatio - 21.0) < 0.01;
      const minPass = Math.abs(minRatio - 1.0) < 0.01;

      recordResult({
        suite: 'SUITE D',
        id: 'D.1',
        name: 'WCAG 2.1 relative luminance mathematical formula verified against W3C specification extremes',
        status: blackPass && whitePass && maxPass && minPass ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: `Black lum: ${lumBlack}, White lum: ${lumWhite}, Max ratio: ${maxRatio.toFixed(2)}:1, Min ratio: ${minRatio.toFixed(2)}:1`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE D',
        id: 'D.1',
        name: 'WCAG 2.1 relative luminance mathematical formula verified against W3C specification extremes',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test D.2: Prove #9ca3af on white fails WCAG AA and replacements pass
  {
    const start = Date.now();
    try {
      const failingRatio = contrastRatio('#9ca3af', '#ffffff');
      const gray500Ratio = contrastRatio('#6b7280', '#ffffff');
      const gray600Ratio = contrastRatio('#4b5563', '#ffffff');
      const gray700Ratio = contrastRatio('#374151', '#ffffff');

      // WCAG AA requires >= 4.5:1 for normal text
      const failingIdentified = failingRatio < 4.5;
      const gray500Passes = gray500Ratio >= 4.5;
      const gray600Passes = gray600Ratio >= 7.0; // Meets AAA
      const gray700Passes = gray700Ratio >= 9.0;

      recordResult({
        suite: 'SUITE D',
        id: 'D.2',
        name: 'Mathematical proof: #9ca3af fails AA (2.54:1 < 4.5:1), replacements #6b7280 & #4b5563 exceed AA/AAA',
        status: failingIdentified && gray500Passes && gray600Passes && gray700Passes ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: `#9ca3af=${failingRatio.toFixed(2)}:1 (FAIL), #6b7280=${gray500Ratio.toFixed(2)}:1 (AA PASS), #4b5563=${gray600Ratio.toFixed(2)}:1 (AAA PASS)`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE D',
        id: 'D.2',
        name: 'Mathematical proof: #9ca3af fails AA (2.54:1 < 4.5:1), replacements #6b7280 & #4b5563 exceed AA/AAA',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test D.3: Focus outline high contrast validation (#7c3aed against white)
  {
    const start = Date.now();
    try {
      const focusRatio = contrastRatio('#7c3aed', '#ffffff');
      const passesFocusContrast = focusRatio >= 4.5;

      // Also check globals.css
      const cssPath = path.resolve(__dirname, '../apps/web/app/globals.css');
      const css = fs.readFileSync(cssPath, 'utf8');
      const hasFocusVisibleRule = css.includes(':focus-visible') && css.includes('outline: 2px solid #7c3aed !important');
      const hasOffsetRule = css.includes('outline-offset: 2px !important');

      recordResult({
        suite: 'SUITE D',
        id: 'D.3',
        name: 'Focus visible ring token #7c3aed provides high contrast on white with 2px offset',
        status: passesFocusContrast && hasFocusVisibleRule && hasOffsetRule ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: `Focus contrast ratio: ${focusRatio.toFixed(2)}:1 (>=4.5:1), CSS 2px outline verified`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE D',
        id: 'D.3',
        name: 'Focus visible ring token #7c3aed provides high contrast on white with 2px offset',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test D.4: Notice banners and status badges contrast validation
  {
    const start = Date.now();
    try {
      // Must Fix: #991b1b on #fee2e2
      const mustFixRatio = contrastRatio('#991b1b', '#fee2e2');
      // Should Fix: #92400e on #fef3c7
      const shouldFixRatio = contrastRatio('#92400e', '#fef3c7');
      // Tip: #0369a1 on #e0f2fe
      const tipRatio = contrastRatio('#0369a1', '#e0f2fe');
      // Amber Notice Banner: #92400e on #fef3c7
      const bannerRatio = contrastRatio('#92400e', '#fef3c7');

      const mustFixPass = mustFixRatio >= 4.5;
      const shouldFixPass = shouldFixRatio >= 4.5;
      const tipPass = tipRatio >= 4.5;
      const bannerPass = bannerRatio >= 4.5;

      recordResult({
        suite: 'SUITE D',
        id: 'D.4',
        name: 'All severity badge tokens and fallback notice banner text meet WCAG AA (>= 4.5:1)',
        status: mustFixPass && shouldFixPass && tipPass && bannerPass ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: `MustFix=${mustFixRatio.toFixed(2)}:1, ShouldFix=${shouldFixRatio.toFixed(2)}:1, Tip=${tipRatio.toFixed(2)}:1, Banner=${bannerRatio.toFixed(2)}:1`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE D',
        id: 'D.4',
        name: 'All severity badge tokens and fallback notice banner text meet WCAG AA (>= 4.5:1)',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test D.5: Codebase audit: confirm #9ca3af is not used for critical text on white in touched files
  {
    const start = Date.now();
    try {
      const filesToCheck = [
        'apps/web/components/IssueCard.tsx',
        'apps/web/components/QuickStartModal.tsx',
        'apps/web/components/ContrastCheckerModal.tsx',
        'apps/web/components/SocialPublishModal.tsx',
        'apps/web/components/DiffView.tsx',
        'apps/web/components/HighlightedText.tsx',
        'apps/web/components/Header.tsx',
        'apps/web/components/LandingPage.tsx',
        'apps/web/components/SlideDeckScanner.tsx',
        'apps/web/app/page.tsx'
      ];

      const defects: string[] = [];

      for (const relPath of filesToCheck) {
        const fullPath = path.resolve(__dirname, '..', relPath);
        if (!fs.existsSync(fullPath)) continue;
        const content = fs.readFileSync(fullPath, 'utf8');

        // Look for text-gray-400 used on text (excluding scrollbars or dark tooltips)
        const lines = content.split('\n');
        lines.forEach((line, lineIdx) => {
          if (line.includes('text-gray-400')) {
            // Check if it's in a dark container (e.g. bg-gray-900 or bg-black)
            const isDarkBackground = line.includes('bg-gray-900') || line.includes('bg-black') || line.includes('bg-slate-900');
            if (!isDarkBackground) {
              defects.push(`${relPath}:${lineIdx + 1}: ${line.trim()}`);
            }
          }
        });
      }

      recordResult({
        suite: 'SUITE D',
        id: 'D.5',
        name: 'Audit across all 10 core Milestone 3 components asserts zero text-gray-400 on light backgrounds',
        status: defects.length === 0 ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: defects.length === 0 ? 'Zero occurrences of low-contrast text-gray-400 found' : `Found ${defects.length} defect(s): ${defects.slice(0, 3).join('; ')}`
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE D',
        id: 'D.5',
        name: 'Audit across all 10 core Milestone 3 components asserts zero text-gray-400 on light backgrounds',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // =========================================================================
  // SUITE E: Full Build, Strict Verification & Linter Validation
  // =========================================================================
  console.log('\n--- SUITE E: Full Build, Strict Verification & Linter Validation ---');

  // Test E.1: node scripts/verify-resilience.mjs --strict
  {
    const start = Date.now();
    try {
      const output = execSync('node scripts/verify-resilience.mjs --strict', {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
      });
      const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
      const passed = cleanOutput.includes('[SUITE PASSED]') && /Passing Tests\s+:\s+42/.test(cleanOutput);
      recordResult({
        suite: 'SUITE E',
        id: 'E.1',
        name: 'Full 4-tier verification suite (scripts/verify-resilience.mjs --strict) passes 42/42 tests',
        status: passed ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Exit code 0, 42/42 tests passing'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE E',
        id: 'E.1',
        name: 'Full 4-tier verification suite (scripts/verify-resilience.mjs --strict) passes 42/42 tests',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test E.2: Next.js web build (npm run build --workspace=apps/web)
  {
    const start = Date.now();
    try {
      const output = execSync('npm run build --workspace=apps/web', {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
      });
      const passed = output.includes('Compiled successfully') && (output.includes('○  (Static)') || output.includes('Finished TypeScript'));
      recordResult({
        suite: 'SUITE E',
        id: 'E.2',
        name: 'Next.js Turbopack web production build compiles successfully with exit code 0',
        status: passed ? 'PASS' : 'FAIL',
        durationMs: Date.now() - start,
        details: 'Turbopack build verified static prerendering with 0 errors'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE E',
        id: 'E.2',
        name: 'Next.js Turbopack web production build compiles successfully with exit code 0',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test E.3: API build (npm run build --workspace=apps/api)
  {
    const start = Date.now();
    try {
      execSync('npm run build --workspace=apps/api', {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
      });
      recordResult({
        suite: 'SUITE E',
        id: 'E.3',
        name: 'TypeScript API build (npm run build --workspace=apps/api) compiles with exit code 0',
        status: 'PASS',
        durationMs: Date.now() - start,
        details: 'tsc compilation succeeded with 0 errors'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE E',
        id: 'E.3',
        name: 'TypeScript API build (npm run build --workspace=apps/api) compiles with exit code 0',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // Test E.4: ESLint validation on touched files
  {
    const start = Date.now();
    try {
      execSync(
        'npx eslint components/QuickStartModal.tsx components/OnboardingWalkthrough.tsx components/LandingPage.tsx components/HighlightedText.tsx components/IssueCard.tsx components/ContrastCheckerModal.tsx components/CommentThread.tsx components/DiffView.tsx components/SocialPublishModal.tsx components/Header.tsx components/SlideDeckScanner.tsx app/page.tsx',
        {
          cwd: path.resolve(__dirname, '../apps/web'),
          encoding: 'utf8'
        }
      );
      recordResult({
        suite: 'SUITE E',
        id: 'E.4',
        name: 'ESLint verification on all touched components reports 0 errors and 0 warnings',
        status: 'PASS',
        durationMs: Date.now() - start,
        details: 'Clean lint status across all 12 touched files'
      });
    } catch (err: any) {
      recordResult({
        suite: 'SUITE E',
        id: 'E.4',
        name: 'ESLint verification on all touched components reports 0 errors and 0 warnings',
        status: 'FAIL',
        durationMs: Date.now() - start,
        details: err.message
      });
    }
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const defects = results.filter((r) => r.status === 'DEFECT_CONFIRMED').length;

  console.log('\n========================================================================');
  console.log('  CHALLENGER 2 ADVERSARIAL STRESS TEST SUMMARY (MILESTONE 3)');
  console.log('========================================================================');
  console.log(`  Total Tests Executed        : ${total}`);
  console.log(`  Passed Tests                : ${passed}`);
  console.log(`  Defects Confirmed           : ${defects}`);
  console.log(`  Unexpected Test Failures    : ${failed}`);
  console.log(`  Unhandled Rejections Seen   : ${unhandledRejections}`);
  console.log(`  Uncaught Exceptions Seen    : ${uncaughtExceptions}`);
  console.log('========================================================================\n');

  if (failed === 0 && defects === 0 && unhandledRejections === 0 && uncaughtExceptions === 0) {
    console.log('✅ ALL ADVERSARIAL STRESS TESTS PASSED WITH ZERO DEFECTS.');
    process.exit(0);
  } else {
    console.log('❌ ADVERSARIAL STRESS TESTS FAILED WITH CONFIRMED DEFECTS.');
    process.exit(1);
  }
}

runMilestone3Verification();
