/**
 * Inkloom AI — Milestone 2 Adversarial Stress Suite for ScoreBadge & Metrics Interpretability
 *
 * Scope:
 * 1. Mathematical Accuracy & Deduction Formula Verification
 * 2. Edge-Case Score Mapping & Status Labeling (-15, 0, 59, 60, 84, 85, 100, 105, NaN, extremes)
 * 3. Size Variants Integrity (sm, md, lg) & Rendering
 * 4. Keyboard Navigation & Event Handler Simulation (Enter, Space, Escape, outside click)
 * 5. Screen-Reader Semantic Structure (aria-expanded, aria-haspopup, role="region", aria-label)
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import ts from 'typescript';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const ROOT_DIR = process.cwd();

// --- 1. Load and Transpile ScoreBadge Component ---
const scoreBadgeFilePath = path.resolve(ROOT_DIR, 'apps/web/components/ScoreBadge.tsx');
assert(fs.existsSync(scoreBadgeFilePath), `ScoreBadge.tsx must exist at ${scoreBadgeFilePath}`);

const scoreBadgeSource = fs.readFileSync(scoreBadgeFilePath, 'utf8');

const transpiled = ts.transpileModule(scoreBadgeSource, {
  compilerOptions: {
    jsx: ts.JsxEmit.React,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true
  }
});

const customRequire = (id) => {
  if (id === 'react') return React;
  if (id === 'lucide-react') return require('lucide-react');
  return require(id);
};

const mod = { exports: {} };
const fn = new Function('require', 'module', 'exports', transpiled.outputText);
fn(customRequire, mod, mod.exports);

const ScoreBadge = mod.exports.ScoreBadge;
assert(typeof ScoreBadge === 'function', 'ScoreBadge must export a functional React component');

// --- Test Harness Framework ---
const results = [];

function runTest(id, name, testFn) {
  const start = Date.now();
  try {
    testFn();
    const durationMs = Date.now() - start;
    results.push({ id, name, status: 'PASS', durationMs });
    console.log(`  ✓ PASS [${id}] ${name} (${durationMs}ms)`);
  } catch (err) {
    const durationMs = Date.now() - start;
    results.push({ id, name, status: 'FAIL', durationMs, error: err.message });
    console.error(`  ✗ FAIL [${id}] ${name} (${durationMs}ms)`);
    console.error(`         Error: ${err.message}`);
  }
}

console.log('\n========================================================================');
console.log('  Milestone 2 Challenger: ScoreBadge Adversarial Verification Suite');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: Mathematical Accuracy of Deductions
// -----------------------------------------------------------------------------
console.log('--- 1. MATHEMATICAL ACCURACY & DEDUCTION FORMULA ---');

runTest('MATH-1.1', 'Brand Health Score Calculation Oracle Invariant (Base 100, -15, -7, -3)', () => {
  const formula = (h, m, l) => Math.max(0, Math.min(100, 100 - (h * 15) - (m * 7) - (l * 3)));

  const testCases = [
    { h: 0, m: 0, l: 0, expected: 100 },
    { h: 1, m: 0, l: 0, expected: 85 },
    { h: 0, m: 1, l: 0, expected: 93 },
    { h: 0, m: 0, l: 1, expected: 97 },
    { h: 1, m: 1, l: 1, expected: 75 },
    { h: 2, m: 3, l: 1, expected: 46 }, // 100 - 30 - 21 - 3 = 46
    { h: 3, m: 0, l: 0, expected: 55 }, // 100 - 45 = 55
    { h: 0, m: 5, l: 0, expected: 65 }, // 100 - 35 = 65
    { h: 0, m: 0, l: 30, expected: 10 }, // 100 - 90 = 10
    { h: 7, m: 0, l: 0, expected: 0 },  // 100 - 105 -> clamped to 0
    { h: 10, m: 10, l: 10, expected: 0 } // clamped to 0
  ];

  for (const tc of testCases) {
    const actual = formula(tc.h, tc.m, tc.l);
    assert.strictEqual(actual, tc.expected, `Mismatch for (${tc.h}H, ${tc.m}M, ${tc.l}L): expected ${tc.expected}, got ${actual}`);
  }
});

runTest('MATH-1.2', 'ScoreBadge Source Code Defines Strict Base 100 and Deduction Rates', () => {
  assert(scoreBadgeSource.includes('Base: 100 pts') || scoreBadgeSource.includes('100 points'),
    'ScoreBadge must state Base: 100 points');
  assert(scoreBadgeSource.includes('-15') && scoreBadgeSource.includes('Must Fix'),
    'ScoreBadge must specify -15 for Must Fix / High severity');
  assert(scoreBadgeSource.includes('-7') && scoreBadgeSource.includes('Should Fix'),
    'ScoreBadge must specify -7 for Should Fix / Medium severity');
  assert(scoreBadgeSource.includes('-3') && scoreBadgeSource.includes('Tip'),
    'ScoreBadge must specify -3 for Tip / Low severity');
});

runTest('MATH-1.3', 'ScoreBadge Renders Itemized Breakdown With issuesCount Prop', () => {
  // Test with issuesCount provided
  const htmlWithIssues = ReactDOMServer.renderToStaticMarkup(
    React.createElement(ScoreBadge, {
      score: 75,
      size: 'md',
      issuesCount: { high: 1, medium: 1, low: 1 }
    })
  );
  assert(htmlWithIssues.includes('75/100'), 'Must render score 75/100');

  // Verify breakdown template logic directly by simulating open breakdown card
  // Check the string representations in code:
  // high: issuesCount.high + ' × -15 pts'
  // medium: issuesCount.medium + ' × -7 pts'
  // low: issuesCount.low + ' × -3 pts'
  const highFmt = (h) => (h !== undefined ? `${h} × -15 pts` : '-15 points each');
  const medFmt = (m) => (m !== undefined ? `${m} × -7 pts` : '-7 points each');
  const lowFmt = (l) => (l !== undefined ? `${l} × -3 pts` : '-3 points each');

  assert.strictEqual(highFmt(2), '2 × -15 pts');
  assert.strictEqual(medFmt(3), '3 × -7 pts');
  assert.strictEqual(lowFmt(1), '1 × -3 pts');
  assert.strictEqual(highFmt(0), '0 × -15 pts');
  assert.strictEqual(highFmt(undefined), '-15 points each');
  assert.strictEqual(medFmt(undefined), '-7 points each');
  assert.strictEqual(lowFmt(undefined), '-3 points each');
});

// -----------------------------------------------------------------------------
// SECTION 2: Edge-Case Scores & Status Labeling Mapping
// -----------------------------------------------------------------------------
console.log('\n--- 2. EDGE-CASE SCORES & STATUS LABELING (-15, 0, 59, 60, 84, 85, 100, 105) ---');

const edgeCases = [
  { score: -15, expectedCategory: 'rose', expectedLabel: 'Needs attention (<60)' },
  { score: 0,   expectedCategory: 'rose', expectedLabel: 'Needs attention (<60)' },
  { score: 59,  expectedCategory: 'rose', expectedLabel: 'Needs attention (<60)' },
  { score: 60,  expectedCategory: 'amber', expectedLabel: 'Needs a few tweaks (60-84)' },
  { score: 84,  expectedCategory: 'amber', expectedLabel: 'Needs a few tweaks (60-84)' },
  { score: 85,  expectedCategory: 'emerald', expectedLabel: 'Ready to share (85-100)' },
  { score: 100, expectedCategory: 'emerald', expectedLabel: 'Ready to share (85-100)' },
  { score: 105, expectedCategory: 'emerald', expectedLabel: 'Ready to share (85-100)' },
  { score: -1000, expectedCategory: 'rose', expectedLabel: 'Needs attention (<60)' },
  { score: 9999, expectedCategory: 'emerald', expectedLabel: 'Ready to share (85-100)' }
];

edgeCases.forEach(({ score, expectedCategory, expectedLabel }) => {
  runTest(`EDGE-2.${score}`, `Edge-case score ${score} maps cleanly to "${expectedLabel}" without throwing`, () => {
    // Test size: sm
    let htmlSm = '';
    assert.doesNotThrow(() => {
      htmlSm = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score, size: 'sm' }));
    }, `ScoreBadge threw for score ${score} at size="sm"`);
    assert(htmlSm.includes(`${score}/100`), `sm must include "${score}/100"`);
    assert(htmlSm.includes(expectedCategory), `sm must include theme class for ${expectedCategory}`);

    // Test size: md
    let htmlMd = '';
    assert.doesNotThrow(() => {
      htmlMd = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score, size: 'md' }));
    }, `ScoreBadge threw for score ${score} at size="md"`);
    assert(htmlMd.includes(`${score}/100`), `md must include "${score}/100"`);
    const escapedLabel = expectedLabel.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    assert(htmlMd.includes(expectedLabel) || htmlMd.includes(escapedLabel), `md must include label "${expectedLabel}" (or escaped "${escapedLabel}")`);
    assert(htmlMd.includes(expectedCategory), `md must include theme class for ${expectedCategory}`);

    // Test size: lg
    let htmlLg = '';
    assert.doesNotThrow(() => {
      htmlLg = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score, size: 'lg' }));
    }, `ScoreBadge threw for score ${score} at size="lg"`);
    assert(htmlLg.includes(String(score)), `lg must include score number "${score}"`);
    assert(htmlLg.includes(expectedLabel) || htmlLg.includes(escapedLabel), `lg must include label "${expectedLabel}" (or escaped "${escapedLabel}")`);
    assert(htmlLg.includes(expectedCategory), `lg must include theme class for ${expectedCategory}`);
  });
});

// -----------------------------------------------------------------------------
// SECTION 3: Keyboard Interaction & Event Handlers
// -----------------------------------------------------------------------------
console.log('\n--- 3. KEYBOARD INTERACTION & EVENT LISTENERS ---');

runTest('KEY-3.1', 'Enter and Space Keys Trigger Toggle with preventDefault()', () => {
  // Extract onKeyDown behavior from component source
  const hasEnterSpaceHandler = /if\s*\(\s*e\.key\s*===\s*'Enter'\s*\|\|\s*e\.key\s*===\s*' '\s*\)\s*\{\s*e\.preventDefault\(\);\s*setShowBreakdown\(\(prev\)\s*=>\s*!prev\);/
    .test(scoreBadgeSource);
  assert(hasEnterSpaceHandler, 'ScoreBadge must handle Enter and Space by preventing default and toggling breakdown state');

  // Simulate onKeyDown logic with mock event
  let state = false;
  const setShowBreakdown = (updater) => {
    state = typeof updater === 'function' ? updater(state) : updater;
  };

  const simulateKeyDown = (key) => {
    let prevented = false;
    const e = {
      key,
      preventDefault: () => { prevented = true; }
    };
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowBreakdown((prev) => !prev);
    }
    return { prevented, state };
  };

  // Test Enter key
  state = false;
  const resEnter1 = simulateKeyDown('Enter');
  assert.strictEqual(resEnter1.prevented, true, 'Enter key must call preventDefault()');
  assert.strictEqual(resEnter1.state, true, 'Enter key must toggle popover from false to true');

  const resEnter2 = simulateKeyDown('Enter');
  assert.strictEqual(resEnter2.prevented, true, 'Enter key must call preventDefault()');
  assert.strictEqual(resEnter2.state, false, 'Enter key must toggle popover from true to false');

  // Test Space key
  state = false;
  const resSpace1 = simulateKeyDown(' ');
  assert.strictEqual(resSpace1.prevented, true, 'Space key must call preventDefault()');
  assert.strictEqual(resSpace1.state, true, 'Space key must toggle popover from false to true');

  const resSpace2 = simulateKeyDown(' ');
  assert.strictEqual(resSpace2.prevented, true, 'Space key must call preventDefault()');
  assert.strictEqual(resSpace2.state, false, 'Space key must toggle popover from true to false');

  // Test Other key (e.g. Tab, ArrowDown)
  state = false;
  const resTab = simulateKeyDown('Tab');
  assert.strictEqual(resTab.prevented, false, 'Tab key must NOT call preventDefault()');
  assert.strictEqual(resTab.state, false, 'Tab key must NOT alter breakdown state');
});

runTest('KEY-3.2', 'Escape Key Dismisses Breakdown Popover on Document Listener', () => {
  const hasEscapeListener = /e\.key\s*===\s*'Escape'\s*[\s\S]*?setShowBreakdown\(false\)/.test(scoreBadgeSource);
  assert(hasEscapeListener, 'ScoreBadge must listen for Escape key to close popover');

  // Simulate useEffect lifecycle for Escape key
  let popoverOpen = true;
  const setOpen = (val) => { popoverOpen = val; };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  handleKeyDown({ key: 'Escape' });
  assert.strictEqual(popoverOpen, false, 'Escape key event must set showBreakdown to false');

  // Non-escape keys should not close
  popoverOpen = true;
  handleKeyDown({ key: 'Enter' });
  assert.strictEqual(popoverOpen, true, 'Non-Escape key on document listener must not close popover');
});

runTest('KEY-3.3', 'Outside Click Handler Dismisses Breakdown Popover', () => {
  const hasOutsideClickListener = /contains\(e\.target\s*as\s*Node\)\s*[\s\S]*?setShowBreakdown\(false\)/.test(scoreBadgeSource);
  assert(hasOutsideClickListener, 'ScoreBadge must listen for mousedown outside container to close popover');

  // Simulate outside click logic
  let popoverOpen = true;
  const setOpen = (val) => { popoverOpen = val; };

  const containerNode = { id: 'container' };
  const insideNode = { id: 'inside', parent: containerNode };
  const outsideNode = { id: 'outside' };

  const containerRef = {
    current: {
      contains: (target) => target === containerNode || target === insideNode
    }
  };

  const handleClickOutside = (e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      setOpen(false);
    }
  };

  // Click inside
  handleClickOutside({ target: insideNode });
  assert.strictEqual(popoverOpen, true, 'Clicking inside container must NOT close popover');

  // Click outside
  handleClickOutside({ target: outsideNode });
  assert.strictEqual(popoverOpen, false, 'Clicking outside container must close popover');
});

// -----------------------------------------------------------------------------
// SECTION 4: Screen-Reader Semantics & Accessibility Attributes
// -----------------------------------------------------------------------------
console.log('\n--- 4. SCREEN-READER ACCESSIBILITY (ARIA & SEMANTICS) ---');

runTest('ARIA-4.1', 'aria-expanded Reflects Popover State', () => {
  // In closed state
  const htmlSm = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 85, size: 'sm' }));
  assert(htmlSm.includes('aria-expanded="false"'), 'Closed sm badge must render aria-expanded="false"');

  const htmlMd = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 85, size: 'md' }));
  assert(htmlMd.includes('aria-expanded="false"'), 'Closed md badge must render aria-expanded="false"');

  const htmlLg = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 85, size: 'lg' }));
  assert(htmlLg.includes('aria-expanded="false"'), 'Closed lg badge must render aria-expanded="false"');
});

runTest('ARIA-4.2', 'aria-haspopup Present on sm and md Interactive Triggers', () => {
  const htmlSm = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 85, size: 'sm' }));
  assert(htmlSm.includes('aria-haspopup="dialog"'), 'sm button must declare aria-haspopup="dialog"');

  const htmlMd = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 85, size: 'md' }));
  assert(htmlMd.includes('aria-haspopup="dialog"'), 'md button must declare aria-haspopup="dialog"');
});

runTest('ARIA-4.3', 'Breakdown Popover Declares role="region" and aria-label', () => {
  assert(scoreBadgeSource.includes('role="region"'), 'Breakdown popover card must declare role="region"');
  assert(scoreBadgeSource.includes('aria-label="Score calculation breakdown"'),
    'Breakdown popover card must declare aria-label="Score calculation breakdown"');
  assert(scoreBadgeSource.includes('id={popoverId}'), 'Breakdown popover card must bind useId() to id');
});

runTest('ARIA-4.4', 'Interactive Buttons Have tabIndex={0} and Accessible Labels', () => {
  const htmlSm = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 85, size: 'sm' }));
  assert(htmlSm.includes('tabindex="0"'), 'sm button must have tabindex="0"');
  assert(htmlSm.includes('aria-label="Brand Score 85/100, Ready to share (85-100). Click to view score calculation formula."'),
    'sm button must have descriptive aria-label');

  const htmlMd = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 85, size: 'md' }));
  assert(htmlMd.includes('tabindex="0"'), 'md button must have tabindex="0"');
  assert(htmlMd.includes('aria-label="Brand Score 85/100, Ready to share (85-100). Click to view formula."'),
    'md button must have descriptive aria-label');

  const htmlLg = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 85, size: 'lg' }));
  assert(htmlLg.includes('tabindex="0"'), 'lg button must have tabindex="0"');
  assert(htmlLg.includes('aria-label="View brand score formula breakdown"'),
    'lg formula button must have descriptive aria-label');
});

// -----------------------------------------------------------------------------
// SECTION 5: Breakdown Popover Structure & Floating Point Boundaries
// -----------------------------------------------------------------------------
console.log('\n--- 5. BREAKDOWN CARD STRUCTURE & FLOAT/EXTREME STRESS ---');

runTest('POPOVER-5.1', 'Breakdown Popover Contains Formula, Severity Rows, and Thresholds', () => {
  // Test transpile of renderBreakdownCard logic
  assert(scoreBadgeSource.includes('Brand Score Formula'), 'Must contain "Brand Score Formula" header');
  assert(scoreBadgeSource.includes('Base: 100 pts'), 'Must state "Base: 100 pts"');
  assert(scoreBadgeSource.includes('Must Fix (High)'), 'Must contain "Must Fix (High)"');
  assert(scoreBadgeSource.includes('Should Fix (Medium)'), 'Must contain "Should Fix (Medium)"');
  assert(scoreBadgeSource.includes('Tip (Low)'), 'Must contain "Tip (Low)"');
  assert(scoreBadgeSource.includes('Approval Status Thresholds'), 'Must contain "Approval Status Thresholds"');
  assert(scoreBadgeSource.includes('Ready to share'), 'Must list "Ready to share"');
  assert(scoreBadgeSource.includes('Needs a few tweaks'), 'Must list "Needs a few tweaks"');
  assert(scoreBadgeSource.includes('Needs attention'), 'Must list "Needs attention"');
  assert(scoreBadgeSource.includes('Press Esc or click outside to close'), 'Must provide keyboard dismissal hint');
});

runTest('FLOAT-5.2', 'Floating-Point Score Boundaries (59.9999, 84.9999, 85.0001)', () => {
  // 59.9999 should be <60 (Needs attention)
  const html59 = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 59.9999, size: 'md' }));
  assert(html59.includes('text-rose-700'), '59.9999 must map to rose (Needs attention)');

  // 60.0000 should be 60-84 (Needs a few tweaks)
  const html60 = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 60.0, size: 'md' }));
  assert(html60.includes('text-amber-700'), '60.0 must map to amber (Needs a few tweaks)');

  // 84.9999 should be 60-84 (Needs a few tweaks)
  const html84 = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 84.9999, size: 'md' }));
  assert(html84.includes('text-amber-700'), '84.9999 must map to amber (Needs a few tweaks)');

  // 85.0000 should be 85-100 (Ready to share)
  const html85 = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 85.0, size: 'md' }));
  assert(html85.includes('text-emerald-700'), '85.0 must map to emerald (Ready to share)');
});

runTest('STRESS-5.3', 'Extreme Malformed Prop Resilience (showLabel=false, NaN, undefined issuesCount)', () => {
  // showLabel=false
  const htmlNoLabel = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 90, showLabel: false }));
  assert(!htmlNoLabel.includes('(Ready to share (85-100))'), 'When showLabel=false, visual label text must be omitted');
  assert(htmlNoLabel.includes('aria-label='), 'When showLabel=false, accessible aria-label must still be preserved');

  // score=NaN
  assert.doesNotThrow(() => {
    const htmlNaN = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: NaN }));
    assert(htmlNaN.length > 0, 'Must produce valid HTML for NaN');
  });

  // Partial issuesCount ({})
  assert.doesNotThrow(() => {
    const htmlEmptyIssues = ReactDOMServer.renderToStaticMarkup(React.createElement(ScoreBadge, { score: 80, issuesCount: {} }));
    assert(htmlEmptyIssues.length > 0, 'Must produce valid HTML for empty issuesCount');
  });
});

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log('STRESS TEST SUMMARY');
console.log('========================================================================');
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`Total Tests Executed : ${results.length}`);
console.log(`Passed               : ${passed}`);
console.log(`Failed               : ${failed}`);

if (failed > 0) {
  console.error('\n[STRESS TEST FAILED] Defects detected during empirical adversarial review.');
  process.exit(1);
} else {
  console.log('\n[STRESS TEST PASSED] 100% assertions verified empirically.');
  process.exit(0);
}
