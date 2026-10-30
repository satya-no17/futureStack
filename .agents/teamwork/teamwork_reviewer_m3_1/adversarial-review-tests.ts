import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';

// Import components to stress test
import { QuickStartModal } from '../../../apps/web/components/QuickStartModal';
import { OnboardingWalkthrough } from '../../../apps/web/components/OnboardingWalkthrough';
import { HighlightedText } from '../../../apps/web/components/HighlightedText';
import { IssueCard } from '../../../apps/web/components/IssueCard';
import { ContrastCheckerModal } from '../../../apps/web/components/ContrastCheckerModal';
import { SocialPublishModal } from '../../../apps/web/components/SocialPublishModal';
import { DiffView } from '../../../apps/web/components/DiffView';

let passed = 0;
let failed = 0;

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
    throw new Error(message);
  }
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ EXCEPTION in [${name}]:`, e.message);
    failed++;
  }
}

console.log('=== Teamwork Reviewer 1 Independent Adversarial Stress Tests ===\n');

// 1. QuickStartModal Stress
console.log('--- Suite 1: QuickStartModal Bounds & Edge Cases ---');
test('QuickStartModal handles NaN initialStep', () => {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(QuickStartModal, { isOpen: true, onClose: () => {}, initialStep: NaN })
  );
  assert(html.includes('Connect Your Brand Rules'), 'Defaulted to Step 1 on NaN');
});

test('QuickStartModal handles Infinity and -Infinity', () => {
  const html1 = ReactDOMServer.renderToStaticMarkup(
    React.createElement(QuickStartModal, { isOpen: true, onClose: () => {}, initialStep: Infinity })
  );
  assert(html1.includes('Review, Approve &amp; Publish') || html1.includes('Review, Approve & Publish'), 'Clamped to Step 4 on Infinity');

  const html2 = ReactDOMServer.renderToStaticMarkup(
    React.createElement(QuickStartModal, { isOpen: true, onClose: () => {}, initialStep: -Infinity })
  );
  assert(html2.includes('Connect Your Brand Rules'), 'Clamped to Step 1 on -Infinity');
});

test('QuickStartModal handles decimal initialStep', () => {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(QuickStartModal, { isOpen: true, onClose: () => {}, initialStep: 2.7 })
  );
  assert(html.length > 500, 'Rendered successfully with floating-point step');
});

test('QuickStartModal returns null when isOpen=false', () => {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(QuickStartModal, { isOpen: false, onClose: () => {} })
  );
  assert(html === '', 'Returned null when isOpen=false');
});

// 2. OnboardingWalkthrough Sandboxed Storage Stress
console.log('\n--- Suite 2: OnboardingWalkthrough Sandbox & Exception Handling ---');
test('OnboardingWalkthrough handles sandboxed localStorage SecurityError', () => {
  const originalWindow = (global as any).window;
  
  // Set window with throwing getter
  (global as any).window = {
    get localStorage() {
      throw new Error('Access Denied (Strict Sandbox SecurityError)');
    }
  };

  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(OnboardingWalkthrough, {})
  );
  assert(html.includes('Step 1 → Step 2 → Step 3'), 'Survived throwing localStorage SecurityError');

  (global as any).window = originalWindow;
});

test('OnboardingWalkthrough handles localStorage returning non-boolean garbage', () => {
  const originalWindow = (global as any).window;
  (global as any).window = {
    localStorage: {
      getItem: () => '{"corrupted":"json", 12345: true}'
    }
  };

  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(OnboardingWalkthrough, {})
  );
  assert(html.includes('Step 1 → Step 2 → Step 3'), 'Handled garbage value without throwing');

  (global as any).window = originalWindow;
});

// 3. HighlightedText Adversarial Inputs
console.log('\n--- Suite 3: HighlightedText Edge Cases & Span Boundaries ---');
test('HighlightedText with empty body and issues', () => {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(HighlightedText, {
      body: '',
      issues: [],
      selectedIssueId: null,
      onSelectIssue: () => {}
    })
  );
  assert(typeof html === 'string', 'Rendered empty state without throwing');
});

test('HighlightedText with overlapping issues', () => {
  const issues = [
    { id: '1', content_id: 'c1', start_idx: 0, end_idx: 10, severity: 'high' as const, type: 'banned_term', status: 'open' as const, explanation: 'Issue 1' },
    { id: '2', content_id: 'c1', start_idx: 5, end_idx: 15, severity: 'medium' as const, type: 'tone', status: 'open' as const, explanation: 'Issue 2' }
  ];
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(HighlightedText, {
      body: 'This is a test of overlapping text spans.',
      issues: issues,
      selectedIssueId: '1',
      onSelectIssue: () => {}
    })
  );
  assert(html.includes('role="button"'), 'Rendered mark tag with role="button"');
  assert(html.includes('tabindex="0"'), 'Mark tag is focusable');
});

test('HighlightedText with issues having inverted or out-of-range indices', () => {
  const issues = [
    { id: 'bad1', content_id: 'c1', start_idx: 50, end_idx: 100, severity: 'low' as const, type: 'visual', status: 'open' as const, explanation: 'Out of range' }
  ];
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(HighlightedText, {
      body: 'Short text',
      issues: issues,
      selectedIssueId: null,
      onSelectIssue: () => {}
    })
  );
  assert(html.includes('Short text'), 'Correctly retained full body');
});

// 4. IssueCard Keyboard Operability & Semantics
console.log('\n--- Suite 4: IssueCard Keyboard Attributes & Semantics ---');
test('IssueCard container provides keyboard accessibility attributes', () => {
  const issue = {
    id: 'iss-1',
    content_id: 'c-1',
    type: 'banned_term',
    severity: 'high' as const,
    quote: 'cheap',
    explanation: 'Do not use word cheap',
    suggestion: 'affordable',
    source_ref: 'Acme Tone Guide Section 2.1',
    status: 'open' as const,
    start_idx: 0,
    end_idx: 5
  };

  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IssueCard, {
      issue,
      isSelected: false,
      onSelect: () => {},
      onAccept: () => {},
      onDismiss: () => {}
    })
  );

  assert(html.includes('tabindex="0"'), 'Card container has tabindex="0"');
  assert(html.includes('role="button"'), 'Card container has role="button"');
  assert(html.includes('Rule citation:'), 'Displays user-friendly Rule citation');
  assert(!html.includes('chunk_count'), 'Free from technical jargon');
});

// 5. DiffView Semantics
console.log('\n--- Suite 5: DiffView Markup Semantics ---');
test('DiffView renders ins, del, and sr-only annotations', () => {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(DiffView, {
      oldText: 'The product is cheap and fast.',
      newText: 'The product is affordable and fast.'
    })
  );

  assert(html.includes('<ins'), 'Includes semantic <ins> tag');
  assert(html.includes('<del'), 'Includes semantic <del> tag');
  assert(html.includes('sr-only'), 'Includes sr-only screen reader announcements');
  assert(html.includes('Added:'), 'Announces Added text');
  assert(html.includes('Removed:'), 'Announces Removed text');
});

// 6. WCAG AA Mathematical Luminance Verification
console.log('\n--- Suite 6: WCAG AA Color Contrast Mathematical Calculations ---');
function getLuminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(rgb1: [number, number, number], rgb2: [number, number, number]) {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

test('Global focus-visible outline color contrast on light bg', () => {
  // #7c3aed (124, 58, 237) on #ffffff (255, 255, 255)
  const contrast = getContrast([124, 58, 237], [255, 255, 255]);
  assert(contrast >= 3.0, `Focus indicator contrast is ${contrast.toFixed(2)}:1 (must be >= 3.0:1 for non-text UI components)`);
  console.log(`    ↳ #7c3aed on #ffffff contrast ratio: ${contrast.toFixed(2)}:1`);
});

test('text-gray-600 on white', () => {
  // #4b5563 (75, 85, 99) on #ffffff (255, 255, 255)
  const contrast = getContrast([75, 85, 99], [255, 255, 255]);
  assert(contrast >= 4.5, `text-gray-600 contrast is ${contrast.toFixed(2)}:1 (must be >= 4.5:1 for WCAG AA normal text)`);
  console.log(`    ↳ #4b5563 on #ffffff contrast ratio: ${contrast.toFixed(2)}:1`);
});

test('text-gray-500 on white', () => {
  // #6b7280 (107, 114, 128) on #ffffff (255, 255, 255)
  const contrast = getContrast([107, 114, 128], [255, 255, 255]);
  assert(contrast >= 4.5, `text-gray-500 contrast is ${contrast.toFixed(2)}:1 (must be >= 4.5:1 for WCAG AA normal text)`);
  console.log(`    ↳ #6b7280 on #ffffff contrast ratio: ${contrast.toFixed(2)}:1`);
});

test('Diff added text (#166534 on #dcfce7)', () => {
  // #166534 (22, 101, 52) on #dcfce7 (220, 252, 231)
  const contrast = getContrast([22, 101, 52], [220, 252, 231]);
  assert(contrast >= 4.5, `Diff added text contrast is ${contrast.toFixed(2)}:1 (must be >= 4.5:1)`);
  console.log(`    ↳ Diff added contrast: ${contrast.toFixed(2)}:1`);
});

test('Diff removed text (#991b1b on #fee2e2)', () => {
  // #991b1b (153, 27, 27) on #fee2e2 (254, 226, 226)
  const contrast = getContrast([153, 27, 27], [254, 226, 226]);
  assert(contrast >= 4.5, `Diff removed text contrast is ${contrast.toFixed(2)}:1 (must be >= 4.5:1)`);
  console.log(`    ↳ Diff removed contrast: ${contrast.toFixed(2)}:1`);
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
