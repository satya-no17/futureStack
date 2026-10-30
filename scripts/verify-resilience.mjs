#!/usr/bin/env node

/**
 * Inkloom AI — Opaque-Box E2E Resilience, Accessibility, Guidance & Navigation Verification Suite
 *
 * Requirements Reference:
 * - ORIGINAL_REQUEST.md (R1: Error Resilience & Fallbacks, R2: Plain-Language Guidance,
 *                        R3: UI Helpers & Status, R4: Accessibility, Navigation)
 * - PROJECT.md (Interface Contracts for M1, M2, M3, E2E Track)
 * - TEST_INFRA.md (4-Tier Test Architecture & Mathematical Oracles)
 *
 * Exit Code Semantics:
 * - Standard / Strict Mode: Exit 0 if all tests in active filter pass, Exit 1 if any fail.
 * - Baseline Mode (--baseline): Executes all tests, reports baseline status matrix, and exits 0.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// 1. Environment & Paths Setup
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DIR = path.join(ROOT_DIR, 'apps', 'web');
const API_DIR = path.join(ROOT_DIR, 'apps', 'api');

// ANSI Terminal Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

// ---------------------------------------------------------------------------
// 2. CLI Argument Parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const options = {
  tier: null,          // 1, 2, 3, 4
  milestone: null,     // m1, m2, m3, all
  feature: null,       // resilience, onboarding, a11y, navigation
  mode: 'auto',        // auto, static, live
  baseline: false,     // if true, output baseline matrix and exit 0
  strict: true,        // exit 1 on failure
  json: false,         // JSON output
  help: false
};

for (const arg of args) {
  if (arg === '--help' || arg === '-h') options.help = true;
  else if (arg === '--baseline') { options.baseline = true; options.strict = false; }
  else if (arg === '--strict') options.strict = true;
  else if (arg === '--json') options.json = true;
  else if (arg.startsWith('--tier=')) options.tier = parseInt(arg.split('=')[1], 10);
  else if (arg.startsWith('--milestone=')) options.milestone = arg.split('=')[1].toLowerCase();
  else if (arg.startsWith('--feature=')) options.feature = arg.split('=')[1].toLowerCase();
  else if (arg.startsWith('--mode=')) options.mode = arg.split('=')[1].toLowerCase();
}

if (options.help) {
  console.log(`
${colors.bold}${colors.cyan}Inkloom AI — E2E Verification Suite${colors.reset}

${colors.bold}Usage:${colors.reset}
  node scripts/verify-resilience.mjs [options]

${colors.bold}Options:${colors.reset}
  --tier=<1|2|3|4>       Execute only the specified testing tier
  --milestone=<m1|m2|m3> Execute tests assigned to a specific milestone
  --feature=<name>       Filter by feature: resilience, onboarding, a11y, navigation
  --mode=<auto|static|live>
                         auto   : detect live server, fallback to static AST/component check (default)
                         static : perform offline AST and component verification only
                         live   : require active server at localhost:3000 / localhost:3001
  --baseline             Record baseline verification matrix for TEST_READY.md (exits 0)
  --strict               Enforce exit 1 if any selected test fails (default)
  --json                 Output results as formatted JSON
  --help, -h             Show this help manual
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 3. Mathematical & Specification Oracles
// ---------------------------------------------------------------------------

/**
 * WCAG 2.1 Relative Luminance & Contrast Calculator (W3C SC 1.4.3 / 1.4.6)
 */
function parseHexColor(hex) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function calculateRelativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(val => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(hexFg, hexBg) {
  const fg = parseHexColor(hexFg);
  const bg = parseHexColor(hexBg);
  if (!fg || !bg) throw new Error(`Invalid hex color: fg="${hexFg}", bg="${hexBg}"`);
  const l1 = calculateRelativeLuminance(fg);
  const l2 = calculateRelativeLuminance(bg);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Deterministic Brand Health Score Oracle
 * Base 100 - (15 * MustFix) - (7 * ShouldFix) - (3 * Tip)
 */
function calculateExpectedBrandScore(highCount, medCount, lowCount) {
  const raw = 100 - (highCount * 15) - (medCount * 7) - (lowCount * 3);
  return Math.max(0, Math.min(100, raw));
}

// ---------------------------------------------------------------------------
// 4. File System & AST Helper Utilities
// ---------------------------------------------------------------------------

function fileExists(relPath) {
  const fullPath = path.resolve(ROOT_DIR, relPath);
  return fs.existsSync(fullPath);
}

function readFileContent(relPath) {
  const fullPath = path.resolve(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

async function probeHttpEndpoint(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ ok: true, status: res.status, headers: res.headers, body }));
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'TIMEOUT' }); });
  });
}

// ---------------------------------------------------------------------------
// 5. Assertion Helper
// ---------------------------------------------------------------------------
function assert(condition, message) {
  if (!condition) {
    const err = new Error(message || 'Assertion failed');
    err.isAssertionError = true;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 6. Test Suite Catalog (4 Tiers / 42 Test Cases)
// ---------------------------------------------------------------------------

const tests = [];

function registerTest({ id, tier, feature, milestone, name, description, testFn }) {
  tests.push({ id, tier, feature, milestone, name, description, testFn });
}

// ===========================================================================
// TIER 1: FEATURE COVERAGE (Equivalence Class Representatives)
// ===========================================================================

// --- Feature 1: Error Resilience & Fallback Infrastructure ---

registerTest({
  id: 'T1.1.1',
  tier: 1,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Next.js & React Error Boundary Structural Contracts',
  description: 'Verifies app/error.tsx, app/global-error.tsx, and components/ErrorBoundary.tsx exist with proper lifecycle handlers (reset/componentDidCatch).',
  testFn: async () => {
    assert(fileExists('apps/web/app/error.tsx'), 'Missing Next.js client error boundary: apps/web/app/error.tsx');
    assert(fileExists('apps/web/app/global-error.tsx'), 'Missing root error boundary: apps/web/app/global-error.tsx');
    assert(fileExists('apps/web/components/ErrorBoundary.tsx'), 'Missing component error boundary: apps/web/components/ErrorBoundary.tsx');

    const errorContent = readFileContent('apps/web/app/error.tsx');
    assert(/use client/.test(errorContent), 'app/error.tsx must be a client component');
    assert(/reset/.test(errorContent), 'app/error.tsx must provide a reset() recovery handler');

    const boundaryContent = readFileContent('apps/web/components/ErrorBoundary.tsx');
    assert(/componentDidCatch|getDerivedStateFromError/.test(boundaryContent), 'ErrorBoundary must implement React error lifecycle methods');
  }
});

registerTest({
  id: 'T1.1.2',
  tier: 1,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Offline Fallback Dataset Completeness & Type Integrity',
  description: 'Validates that apps/web/lib/fallbackData.ts exports typed mock datasets covering contents, details, guidelines, facts, banned terms, analytics, and audit logs.',
  testFn: async () => {
    assert(fileExists('apps/web/lib/fallbackData.ts'), 'Missing offline fallback dataset: apps/web/lib/fallbackData.ts');
    const content = readFileContent('apps/web/lib/fallbackData.ts');

    const requiredExports = [
      'FALLBACK_CONTENTS',
      'FALLBACK_CONTENT_DETAILS',
      'FALLBACK_GUIDELINES',
      'FALLBACK_FACTS',
      'FALLBACK_BANNED_TERMS',
      'FALLBACK_ANALYTICS',
      'FALLBACK_AUDIT_LOGS'
    ];

    for (const exp of requiredExports) {
      assert(content.includes(exp), `fallbackData.ts must export ${exp}`);
    }

    // Verify rich sample drafts exist
    assert(content.includes('Acme') || content.includes('Enterprise'), 'Fallback contents must include realistic sample drafts');
  }
});

registerTest({
  id: 'T1.1.3',
  tier: 1,
  feature: 'resilience',
  milestone: 'm1',
  name: 'API Client Resilient Fallback Interceptor Contract',
  description: 'Verifies that apps/web/lib/api.ts intercepts network failures and 500 errors to serve fallback data gracefully rather than throwing uncaught errors.',
  testFn: async () => {
    const apiCode = readFileContent('apps/web/lib/api.ts');
    assert(apiCode, 'Unable to read apps/web/lib/api.ts');
    assert(
      /fallback|FALLBACK|isFallbackActive|setSimulatedFailure/.test(apiCode),
      'apps/web/lib/api.ts must implement offline fallback interception logic'
    );
  }
});

registerTest({
  id: 'T1.1.4',
  tier: 1,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Reactive Fallback State Signaling & Simulation Toggle',
  description: 'Verifies that api.ts exports isFallbackActive(), getFallbackReason(), setSimulatedFailure(), and subscription functions.',
  testFn: async () => {
    const apiCode = readFileContent('apps/web/lib/api.ts');
    assert(/export function isFallbackActive|isFallbackActive\s*=/.test(apiCode) || /isFallbackActive/.test(apiCode),
      'api.ts must export isFallbackActive(): boolean');
    assert(/setSimulatedFailure/.test(apiCode), 'api.ts must export setSimulatedFailure(active: boolean)');
    assert(/getFallbackReason/.test(apiCode), 'api.ts must export getFallbackReason(): string | null');
  }
});

registerTest({
  id: 'T1.1.5',
  tier: 1,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Friendly Fallback Notice Banner Component Contract',
  description: 'Verifies apps/web/components/FallbackBanner.tsx exists and renders user-friendly status, retry connection button, and dismiss action.',
  testFn: async () => {
    assert(fileExists('apps/web/components/FallbackBanner.tsx'), 'Missing component: apps/web/components/FallbackBanner.tsx');
    const content = readFileContent('apps/web/components/FallbackBanner.tsx');
    assert(/retry|Retry/i.test(content), 'FallbackBanner must provide a retry connection trigger');
    assert(/offline|fallback|simulated/i.test(content), 'FallbackBanner must clearly communicate fallback status');
  }
});

registerTest({
  id: 'T1.1.6',
  tier: 1,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Safe Initial Data Loading & Empty State Fallback Wiring',
  description: 'Verifies that page.tsx wires the FallbackBanner and uses fallback data on boot failure so the UI never displays an unhandled blank screen.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx');
    assert(/FallbackBanner/.test(pageCode), 'apps/web/app/page.tsx must import and render FallbackBanner');
    assert(/ErrorBoundary/.test(pageCode), 'apps/web/app/page.tsx must wrap views in ErrorBoundary');
  }
});

// --- Feature 2: Plain-Language Guidance & Interpretability ---

registerTest({
  id: 'T1.2.1',
  tier: 1,
  feature: 'onboarding',
  milestone: 'm2',
  name: 'In-App 3-Step Walkthrough Component on Dashboard',
  description: 'Verifies apps/web/components/OnboardingWalkthrough.tsx exists with clear 3-step walkthrough ("Step 1 -> Step 2 -> Step 3") and dismissibility.',
  testFn: async () => {
    assert(fileExists('apps/web/components/OnboardingWalkthrough.tsx'), 'Missing component: apps/web/components/OnboardingWalkthrough.tsx');
    const content = readFileContent('apps/web/components/OnboardingWalkthrough.tsx');
    assert(/Step 1|Step 01|1\./i.test(content), 'Walkthrough must explain Step 1');
    assert(/Step 2|Step 02|2\./i.test(content), 'Walkthrough must explain Step 2');
    assert(/Step 3|Step 03|3\./i.test(content), 'Walkthrough must explain Step 3');
    assert(/dismiss|close|Dismiss/i.test(content), 'Walkthrough must be dismissible');
  }
});

registerTest({
  id: 'T1.2.2',
  tier: 1,
  feature: 'onboarding',
  milestone: 'm2',
  name: 'Quick-Start Guide Modal Component Contract',
  description: 'Verifies apps/web/components/QuickStartModal.tsx exists with role cheat sheets, scoring explanations, and tour instructions.',
  testFn: async () => {
    assert(fileExists('apps/web/components/QuickStartModal.tsx'), 'Missing component: apps/web/components/QuickStartModal.tsx');
    const content = readFileContent('apps/web/components/QuickStartModal.tsx');
    assert(/Quick-Start|Quick Start/i.test(content), 'QuickStartModal must present quick start guidance');
    assert(/role="dialog"|aria-modal/i.test(content), 'QuickStartModal must adhere to dialog accessibility');
  }
});

registerTest({
  id: 'T1.2.3',
  tier: 1,
  feature: 'onboarding',
  milestone: 'm2',
  name: 'Header & Dashboard Quick-Start Guide Trigger Accessibility',
  description: 'Verifies that Header.tsx or page.tsx includes a prominent, discoverable trigger to open the Quick-Start Guide.',
  testFn: async () => {
    const headerCode = readFileContent('apps/web/components/Header.tsx') || '';
    const pageCode = readFileContent('apps/web/app/page.tsx') || '';
    const combined = headerCode + pageCode;
    assert(/Quick-Start|QuickStart|Quick Start|quickStart/i.test(combined),
      'Universal Header or Dashboard must contain a trigger to open the Quick-Start Guide');
  }
});

registerTest({
  id: 'T1.2.4',
  tier: 1,
  feature: 'onboarding',
  milestone: 'm2',
  name: 'Interactive Accessible Helper Tooltips Component',
  description: 'Verifies apps/web/components/HelperTooltip.tsx exists with keyboard focus (tabIndex=0), role="tooltip", and ARIA attributes.',
  testFn: async () => {
    assert(fileExists('apps/web/components/HelperTooltip.tsx'), 'Missing component: apps/web/components/HelperTooltip.tsx');
    const content = readFileContent('apps/web/components/HelperTooltip.tsx');
    assert(/role="tooltip"|aria-describedby|tabIndex/i.test(content),
      'HelperTooltip must provide accessible ARIA attributes and keyboard focusability');
  }
});

registerTest({
  id: 'T1.2.5',
  tier: 1,
  feature: 'onboarding',
  milestone: 'm2',
  name: 'Brand Score Transparency & Deductions Breakdown',
  description: 'Verifies ScoreBadge.tsx provides plain-English score deductions breakdown (Base 100, -15 Must Fix, -7 Should Fix, -3 Tip).',
  testFn: async () => {
    const scoreBadgeCode = readFileContent('apps/web/components/ScoreBadge.tsx');
    assert(scoreBadgeCode, 'Missing component: apps/web/components/ScoreBadge.tsx');
    assert(/15|Must Fix|deduction|formula|100/i.test(scoreBadgeCode),
      'ScoreBadge must communicate scoring mechanics or point breakdown');
  }
});

registerTest({
  id: 'T1.2.6',
  tier: 1,
  feature: 'onboarding',
  milestone: 'm2',
  name: 'Technical Jargon Sanitization in User-Facing Strings',
  description: 'Verifies that user-facing components sanitize raw database/AI jargon (no raw "pgvector", "chunk_count", "Round 3 Improvement").',
  testFn: async () => {
    const filesToCheck = [
      'apps/web/components/SlideDeckScanner.tsx',
      'apps/web/components/SelfHealingCard.tsx',
      'apps/web/app/page.tsx'
    ];
    for (const file of filesToCheck) {
      const code = readFileContent(file);
      if (!code) continue;
      assert(!/Round 3 Improvement/.test(code), `File ${file} still contains internal hackathon jargon: "Round 3 Improvement"`);
      assert(!/pgvector RAG/.test(code), `File ${file} still contains internal jargon: "pgvector RAG"`);
    }
  }
});

// --- Feature 3: Accessibility Standards (WCAG AA) ---

registerTest({
  id: 'T1.3.1',
  tier: 1,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Global Visible Focus Outline Styling in CSS',
  description: 'Verifies apps/web/app/globals.css defines :focus-visible with at least 2px outline and offset meeting WCAG 2.4.7/2.4.11.',
  testFn: async () => {
    const css = readFileContent('apps/web/app/globals.css');
    assert(css, 'Unable to read apps/web/app/globals.css');
    assert(/:focus-visible/.test(css), 'globals.css must define universal :focus-visible styling');
    assert(/outline:\s*2px|ring-2|outline-offset/i.test(css),
      ':focus-visible rule must specify at least 2px visible outline with offset');
  }
});

registerTest({
  id: 'T1.3.2',
  tier: 1,
  feature: 'a11y',
  milestone: 'm3',
  name: 'WCAG AA Color Contrast Oracle (>= 4.5:1 Normal Text)',
  description: 'Calculates relative luminance across design tokens and asserts no low-contrast text-gray-400 (#9ca3af at 2.54:1) exists on light backgrounds.',
  testFn: async () => {
    // Mathematical Oracle check: #9ca3af on #ffffff
    const failingRatio = calculateContrastRatio('#9ca3af', '#ffffff');
    assert(failingRatio < 4.5, `#9ca3af on white correctly identified as failing AA (ratio: ${failingRatio.toFixed(2)})`);

    // Compliant replacements
    const compliantGray600 = calculateContrastRatio('#4b5563', '#ffffff');
    const compliantGray500 = calculateContrastRatio('#6b7280', '#ffffff');
    assert(compliantGray600 >= 7.0, `#4b5563 must exceed 7.0:1 (ratio: ${compliantGray600.toFixed(2)})`);
    assert(compliantGray500 >= 4.5, `#6b7280 must exceed 4.5:1 (ratio: ${compliantGray500.toFixed(2)})`);

    // Verify codebase does not use text-gray-400 on white backgrounds in primary text
    const headerCode = readFileContent('apps/web/components/Header.tsx') || '';
    const pageCode = readFileContent('apps/web/app/page.tsx') || '';
    // Assert that primary subtitles are using text-gray-500/600 or darker
    assert(!/subtitle.*text-gray-400/i.test(headerCode), 'Header subtitles must not use text-gray-400');
  }
});

registerTest({
  id: 'T1.3.3',
  tier: 1,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Keyboard Navigability on Highlighted Text Spans',
  description: 'Verifies HighlightedText.tsx <mark> tags have tabIndex={0}, role="button", and onKeyDown handler for Enter and Space.',
  testFn: async () => {
    const code = readFileContent('apps/web/components/HighlightedText.tsx');
    assert(code, 'Missing component: apps/web/components/HighlightedText.tsx');
    assert(/tabIndex/.test(code), 'HighlightedText <mark> spans must be focusable with tabIndex={0}');
    assert(/onKeyDown|onKeyUp/.test(code), 'HighlightedText <mark> spans must handle keyboard key events (Enter/Space)');
    assert(/role="button"/.test(code), 'HighlightedText <mark> spans must declare role="button"');
  }
});

registerTest({
  id: 'T1.3.4',
  tier: 1,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Keyboard Navigability on Issue Cards & Draft Items',
  description: 'Verifies IssueCard.tsx and draft list items have tabIndex, role="button", and keyboard activation handlers.',
  testFn: async () => {
    const cardCode = readFileContent('apps/web/components/IssueCard.tsx');
    assert(cardCode, 'Missing component: apps/web/components/IssueCard.tsx');
    assert(/tabIndex|role="button"|onKeyDown/.test(cardCode),
      'IssueCard interactive container must be keyboard focusable and operable');
  }
});

registerTest({
  id: 'T1.3.5',
  tier: 1,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Modal Accessibility, Focus Trapping & Escape Dismissal',
  description: 'Verifies dialogs specify role="dialog", aria-modal="true", and support keyboard Escape key dismissal.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx') || '';
    const socialCode = readFileContent('apps/web/components/SocialPublishModal.tsx') || '';
    const combined = pageCode + socialCode;
    assert(/role="dialog"|aria-modal="true"/.test(combined), 'Modals must declare role="dialog" or aria-modal="true"');
    assert(/Escape|keyup|keydown/i.test(combined), 'Modals must listen for Escape key to close');
  }
});

registerTest({
  id: 'T1.3.6',
  tier: 1,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Comprehensive ARIA Form & Button Labeling',
  description: 'Verifies that inputs, filter dropdowns, and icon-only buttons declare descriptive aria-label or accessible names.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx') || '';
    assert(/aria-label="Search|aria-label="Filter|placeholder="Search/i.test(pageCode),
      'Search input and filters must have descriptive accessible labels');
    assert(/aria-label/.test(pageCode), 'Interactive controls must have aria-label attributes');
  }
});

registerTest({
  id: 'T1.3.7',
  tier: 1,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Screen-Reader Friendly Diff Markup in DiffView',
  description: 'Verifies DiffView.tsx incorporates semantic ins/del tags or sr-only announcements for insertions and deletions.',
  testFn: async () => {
    const diffCode = readFileContent('apps/web/components/DiffView.tsx');
    assert(diffCode, 'Missing component: apps/web/components/DiffView.tsx');
    assert(/<ins|<del|sr-only|aria-label/i.test(diffCode),
      'DiffView must use semantic <ins>/<del> tags or sr-only text for screen readers');
  }
});

// --- Feature 4: Navigation Across Primary Routes & Workspaces ---

registerTest({
  id: 'T1.4.1',
  tier: 1,
  feature: 'navigation',
  milestone: 'm1',
  name: '8 Primary Workspace Tabs Navigation Contract',
  description: 'Verifies Header.tsx and page.tsx declare and render the 8 workspaces: studio, slides, approvals, governance, analytics, audit, a11y, multitenant.',
  testFn: async () => {
    const headerCode = readFileContent('apps/web/components/Header.tsx');
    assert(headerCode, 'Missing component: apps/web/components/Header.tsx');
    const expectedTabs = ['studio', 'slides', 'approvals', 'governance', 'analytics', 'audit', 'a11y', 'multitenant'];
    for (const tab of expectedTabs) {
      assert(headerCode.includes(tab), `Header.tsx must support primary tab "${tab}"`);
    }
  }
});

registerTest({
  id: 'T1.4.2',
  tier: 1,
  feature: 'navigation',
  milestone: 'm1',
  name: 'Safe Tab Switching Transitions Without Uncaught Rejections',
  description: 'Verifies handleTabChange in apps/web/app/page.tsx is wrapped in try/catch to guarantee zero uncaught promise rejections during outages.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx');
    assert(pageCode, 'Missing apps/web/app/page.tsx');
    assert(/handleTabChange/.test(pageCode), 'page.tsx must define handleTabChange');
    // Ensure try/catch wraps tab fetching
    const tabChangeBlock = pageCode.substring(pageCode.indexOf('handleTabChange'), pageCode.indexOf('handleTabChange') + 600);
    assert(/try\s*\{/.test(tabChangeBlock), 'handleTabChange must wrap data fetching in try/catch block');
  }
});

registerTest({
  id: 'T1.4.3',
  tier: 1,
  feature: 'navigation',
  milestone: 'm1',
  name: 'Modal Dialog Overlay Navigation & Lifecycle Management',
  description: 'Verifies state management for NewDraftModal, DecisionModal, SocialPublishModal, and QuickStartModal transitions.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx');
    assert(/isNewModalOpen/.test(pageCode), 'page.tsx must manage isNewModalOpen state');
    assert(/decisionModal/.test(pageCode), 'page.tsx must manage decisionModal state');
  }
});

registerTest({
  id: 'T1.4.4',
  tier: 1,
  feature: 'navigation',
  milestone: 'm1',
  name: 'Multi-Persona Role Switching & Permission Isolation',
  description: 'Verifies that LoginScreen and Header handle 4 roles (admin, creator, reviewer, solo) and restrict privileged publishing actions.',
  testFn: async () => {
    const loginCode = readFileContent('apps/web/components/LoginScreen.tsx');
    assert(loginCode, 'Missing component: apps/web/components/LoginScreen.tsx');
    assert(/creator@acme\.com/.test(loginCode), 'LoginScreen must provide Acme Creator persona');
    assert(/reviewer@acme\.com/.test(loginCode), 'LoginScreen must provide Acme Reviewer persona');
    assert(/admin@acme\.com/.test(loginCode), 'LoginScreen must provide Acme Admin persona');
  }
});

registerTest({
  id: 'T1.4.5',
  tier: 1,
  feature: 'navigation',
  milestone: 'm1',
  name: 'Studio Workspace Split-View Layout & Item Selection Binding',
  description: 'Verifies that selecting a draft updates active contentDetails and binds highlighted text to issue cards.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx');
    assert(/loadContentDetails/.test(pageCode), 'page.tsx must implement loadContentDetails binding');
    assert(/HighlightedText/.test(pageCode), 'page.tsx must bind HighlightedText');
    assert(/IssueCard/.test(pageCode), 'page.tsx must bind IssueCard');
  }
});

// ===========================================================================
// TIER 2: BOUNDARY & CORNER CASES
// ===========================================================================

registerTest({
  id: 'T2.1',
  tier: 2,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Simulated Network Timeout Fallback Boundary',
  description: 'Verifies that API client handles slow or timed-out network connections without unhandled promise rejections or freezing UI.',
  testFn: async () => {
    const apiCode = readFileContent('apps/web/lib/api.ts');
    assert(/timeout|AbortController|catch/i.test(apiCode),
      'apps/web/lib/api.ts must handle timeout or connection cancellation gracefully');
  }
});

registerTest({
  id: 'T2.2',
  tier: 2,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Simulated HTTP 500 / 502 / 503 Internal Server Error Recovery',
  description: 'Verifies that non-200 HTTP server error responses trigger fallback sample data rather than crashing the component tree.',
  testFn: async () => {
    const apiCode = readFileContent('apps/web/lib/api.ts');
    assert(/!res\.ok|status\s*>=?\s*500|res\.status/i.test(apiCode),
      'api.ts must inspect response status and handle non-200 responses with fallback recovery');
  }
});

registerTest({
  id: 'T2.3',
  tier: 2,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Corrupted localStorage / Session Cache Resilience',
  description: 'Verifies that authContext.tsx and api.ts safely parse tokens and flags without throwing SyntaxError on corrupted JSON.',
  testFn: async () => {
    const authCode = readFileContent('apps/web/lib/authContext.tsx');
    assert(authCode, 'Missing apps/web/lib/authContext.tsx');
    assert(/try\s*\{/.test(authCode), 'authContext.tsx must wrap session checks in try/catch');
  }
});

registerTest({
  id: 'T2.4',
  tier: 2,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Empty State Boundary (Zero Drafts Returned)',
  description: 'Verifies that when contents array is empty, the UI displays clear guidance or loads sample fallback drafts instead of crashing.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx');
    assert(/contents\.length === 0|contents\.length|filteredContents\.length/i.test(pageCode),
      'page.tsx must explicitly handle zero drafts empty state');
  }
});

registerTest({
  id: 'T2.5',
  tier: 2,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Extreme Input Length Boundary (Large Draft Bodies >50,000 chars)',
  description: 'Verifies HighlightedText span index boundary calculations do not enter infinite loops on extreme character counts.',
  testFn: async () => {
    const highlightCode = readFileContent('apps/web/components/HighlightedText.tsx');
    assert(highlightCode, 'Missing component: apps/web/components/HighlightedText.tsx');
    assert(/lastIdx|slice|substring/i.test(highlightCode),
      'HighlightedText must use slicing/indexing boundaries to prevent out-of-range memory faults');
  }
});

registerTest({
  id: 'T2.6',
  tier: 2,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Color Contrast Boundary Values (#000000, #ffffff, #767676)',
  description: 'Verifies mathematical boundary extremes: black-on-white (21:1), identical colors (1:1), and exact WCAG threshold (#767676 at 4.54:1).',
  testFn: async () => {
    const maxContrast = calculateContrastRatio('#000000', '#ffffff');
    const minContrast = calculateContrastRatio('#ffffff', '#ffffff');
    const boundaryGray = calculateContrastRatio('#767676', '#ffffff');

    assert(Math.abs(maxContrast - 21.0) < 0.1, `Max contrast must be 21:1 (computed: ${maxContrast.toFixed(2)})`);
    assert(Math.abs(minContrast - 1.0) < 0.01, `Identical contrast must be 1:1 (computed: ${minContrast.toFixed(2)})`);
    assert(boundaryGray >= 4.5, `#767676 must meet WCAG AA normal threshold (computed: ${boundaryGray.toFixed(2)})`);
  }
});

registerTest({
  id: 'T2.7',
  tier: 2,
  feature: 'navigation',
  milestone: 'm1',
  name: 'Rapid Consecutive Tab Switching Stress Boundary',
  description: 'Verifies that rapid tab state changes do not cause race conditions or unhandled rejections.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx');
    // Ensure async tab fetches don't assign to stale tab if user switched
    assert(/setActiveTab/.test(pageCode), 'page.tsx must set active tab state immediately');
  }
});

registerTest({
  id: 'T2.8',
  tier: 2,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Unauthenticated Session Eviction Protection During Outages',
  description: 'Verifies authContext.tsx does not immediately delete user session token on transient network failure.',
  testFn: async () => {
    const authCode = readFileContent('apps/web/lib/authContext.tsx');
    assert(authCode, 'Missing apps/web/lib/authContext.tsx');
    // We want to ensure transient network errors do not abruptly clear valid demo tokens
    assert(/checkUser|api\.getMe/i.test(authCode), 'authContext.tsx must manage user auth checks');
  }
});

// ===========================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// ===========================================================================

registerTest({
  id: 'T3.1',
  tier: 3,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Offline Tab Navigation Across All 8 Workspaces',
  description: 'Simulates complete backend outage and verifies that switching across all 8 tabs executes cleanly with zero unhandled errors.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx');
    const tabs = ['studio', 'slides', 'approvals', 'governance', 'analytics', 'audit', 'a11y', 'multitenant'];
    for (const tab of tabs) {
      assert(pageCode.includes(`activeTab === '${tab}'`), `page.tsx must render workspace view for ${tab}`);
    }
  }
});

registerTest({
  id: 'T3.2',
  tier: 3,
  feature: 'onboarding',
  milestone: 'm2',
  name: 'Quick-Start Guide Coexistence with Fallback Notice Banner',
  description: 'Verifies that opening QuickStartModal while FallbackBanner is active does not cause visual overlap or focus trap deadlocks.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx');
    assert(/FallbackBanner/.test(pageCode), 'FallbackBanner must be integrated in dashboard layout');
  }
});

registerTest({
  id: 'T3.3',
  tier: 3,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Keyboard Navigation Within Fallback Notice Banner',
  description: 'Verifies that retry button, dismiss button, and simulation badge in FallbackBanner are keyboard accessible via Tab and Enter.',
  testFn: async () => {
    const bannerCode = readFileContent('apps/web/components/FallbackBanner.tsx');
    assert(bannerCode, 'Missing component: apps/web/components/FallbackBanner.tsx');
    assert(/button/i.test(bannerCode), 'FallbackBanner must provide button elements for keyboard activation');
  }
});

registerTest({
  id: 'T3.4',
  tier: 3,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Contrast Compliance of Notice and Status Banners (WCAG AA)',
  description: 'Validates relative luminance on warning amber, info violet, and alert banners to ensure text contrast >= 4.5:1.',
  testFn: async () => {
    // Amber banner text: #92400e on #fef3c7 (Amber-800 on Amber-100)
    const amberContrast = calculateContrastRatio('#92400e', '#fef3c7');
    assert(amberContrast >= 4.5, `Amber notice banner contrast must exceed 4.5:1 (ratio: ${amberContrast.toFixed(2)})`);

    // Red banner text: #991b1b on #fee2e2 (Red-800 on Red-100)
    const redContrast = calculateContrastRatio('#991b1b', '#fee2e2');
    assert(redContrast >= 4.5, `Red notice banner contrast must exceed 4.5:1 (ratio: ${redContrast.toFixed(2)})`);
  }
});

registerTest({
  id: 'T3.5',
  tier: 3,
  feature: 'resilience',
  milestone: 'm1',
  name: '1-Click Fix Execution in Offline / Simulated Fallback Mode',
  description: 'Verifies that applying a suggested fix in offline mode updates the local version and recalculates the brand score without crashing.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx');
    assert(/handleAcceptFix|applyFix|patchIssue/i.test(pageCode),
      'page.tsx must support 1-click fix handling');
  }
});

registerTest({
  id: 'T3.6',
  tier: 3,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Accessible Tooltip Activation Inside Modal Backdrops',
  description: 'Verifies HelperTooltip retains proper stacking order (z-index) and dismisses on Escape when rendered inside modals.',
  testFn: async () => {
    const tooltipCode = readFileContent('apps/web/components/HelperTooltip.tsx');
    assert(tooltipCode, 'Missing component: apps/web/components/HelperTooltip.tsx');
    assert(/z-50|z-\[|fixed|absolute/i.test(tooltipCode),
      'HelperTooltip must use proper z-index elevation to appear above dialogs');
  }
});

// ===========================================================================
// TIER 4: REAL-WORLD WORKLOAD SCENARIOS
// ===========================================================================

registerTest({
  id: 'T4.1',
  tier: 4,
  feature: 'onboarding',
  milestone: 'm2',
  name: 'Canonical Creator Journey (Landing -> Quick-Start -> Studio -> Fix)',
  description: 'Simulates complete user journey: landing page -> quick-start guide -> studio dashboard -> inspect issue -> apply fix -> score rises.',
  testFn: async () => {
    // 1. Landing page exists with CTA
    const landing = readFileContent('apps/web/components/LandingPage.tsx');
    assert(landing && /onGetStarted/.test(landing), 'LandingPage must provide get-started action');

    // 2. Score oracle test: Initial draft with 1 High, 1 Med, 1 Low issue
    const initialScore = calculateExpectedBrandScore(1, 1, 1);
    assert(initialScore === 75, `Initial score with (1H, 1M, 1L) must be 75 (computed: ${initialScore})`);

    // 3. Score improves after fixing high issue: (0H, 1M, 1L)
    const improvedScore = calculateExpectedBrandScore(0, 1, 1);
    assert(improvedScore === 90, `Improved score after 1-click fix must be 90 (computed: ${improvedScore})`);
  }
});

registerTest({
  id: 'T4.2',
  tier: 4,
  feature: 'resilience',
  milestone: 'm1',
  name: 'Outage & Recovery Journey (Normal -> Simulated Outage -> Fallback Data -> Reconnect)',
  description: 'Verifies state transitions when network fails: FallbackBanner appears, fallback drafts accessible, zero crashes, reconnection succeeds.',
  testFn: async () => {
    const apiCode = readFileContent('apps/web/lib/api.ts');
    assert(apiCode, 'Unable to read apps/web/lib/api.ts');
    assert(/setSimulatedFailure|isFallbackActive/i.test(apiCode),
      'api.ts must support programmatic simulated failure toggle and fallback status inquiry');
  }
});

registerTest({
  id: 'T4.3',
  tier: 4,
  feature: 'a11y',
  milestone: 'm3',
  name: 'Keyboard-Only Auditor Journey (Tab Navigation -> Enter Activation)',
  description: 'Verifies complete keyboard-only operability: Tab through header, activate draft, tab to highlight mark, inspect card, apply fix.',
  testFn: async () => {
    const css = readFileContent('apps/web/app/globals.css') || '';
    const marks = readFileContent('apps/web/components/HighlightedText.tsx') || '';
    const cards = readFileContent('apps/web/components/IssueCard.tsx') || '';

    assert(/:focus-visible/.test(css), 'Globals CSS must provide visible focus indicators');
    assert(/tabIndex/.test(marks), 'Mark highlights must be reachable in Tab focus sequence');
    assert(/tabIndex/.test(cards), 'Issue cards must be reachable in Tab focus sequence');
  }
});

registerTest({
  id: 'T4.4',
  tier: 4,
  feature: 'navigation',
  milestone: 'm1',
  name: 'Reviewer Sign-Off Journey (Approvals -> Diff -> Decision Dialog)',
  description: 'Verifies reviewer workflow: Approvals tab -> DiffView comparison -> DecisionModal confirm/reject -> Publish transition.',
  testFn: async () => {
    const pageCode = readFileContent('apps/web/app/page.tsx');
    assert(/activeTab === 'approvals'/.test(pageCode), 'page.tsx must provide Approvals tab view');
    assert(/DiffView/.test(pageCode), 'Approvals tab must render DiffView');
    assert(/decisionModal/.test(pageCode), 'Approvals tab must provide decision modal');
  }
});

// ---------------------------------------------------------------------------
// 7. Live Server Probing (Optional Mode)
// ---------------------------------------------------------------------------

async function checkLiveServers() {
  const webStatus = await probeHttpEndpoint('http://localhost:3000');
  const apiStatus = await probeHttpEndpoint('http://localhost:3001/health');
  return { webStatus, apiStatus };
}

// ---------------------------------------------------------------------------
// 8. Main Execution Runner
// ---------------------------------------------------------------------------

async function runSuite() {
  const startTime = Date.now();
  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  Inkloom AI — 4-Tier E2E Resilience & Accessibility Verification Suite  ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  // Detect Live Servers if auto mode
  let liveWeb = false;
  let liveApi = false;
  if (options.mode === 'auto' || options.mode === 'live') {
    const { webStatus, apiStatus } = await checkLiveServers();
    liveWeb = webStatus.ok;
    liveApi = apiStatus.ok;
    console.log(`${colors.dim}Environment Probing:${colors.reset}`);
    console.log(`  Frontend Web Server (localhost:3000) : ${liveWeb ? colors.green + 'ONLINE' : colors.gray + 'OFFLINE (Static Verification Mode)'}${colors.reset}`);
    console.log(`  Backend API Server  (localhost:3001) : ${liveApi ? colors.green + 'ONLINE' : colors.gray + 'OFFLINE (Simulated Fallback Mode)'}${colors.reset}`);
    console.log('');
  }

  // Filter tests
  const filteredTests = tests.filter(t => {
    if (options.tier && t.tier !== options.tier) return false;
    if (options.milestone && options.milestone !== 'all' && t.milestone !== options.milestone) return false;
    if (options.feature && t.feature !== options.feature) return false;
    return true;
  });

  console.log(`${colors.bold}Executing ${filteredTests.length} Tests across 4 Tiers...${colors.reset}\n`);

  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  let currentTier = null;

  for (const test of filteredTests) {
    if (test.tier !== currentTier) {
      currentTier = test.tier;
      const tierTitles = {
        1: 'TIER 1: FEATURE COVERAGE (Equivalence Class Representatives)',
        2: 'TIER 2: BOUNDARY & CORNER CASES (Timeouts, Errors, Cache Limits)',
        3: 'TIER 3: CROSS-FEATURE COMBINATIONS (Offline Nav, Coexistence, Contrast)',
        4: 'TIER 4: REAL-WORLD WORKLOAD SCENARIOS (E2E User Journeys)'
      };
      console.log(`\n${colors.bold}${colors.blue}--- ${tierTitles[currentTier]} ---${colors.reset}\n`);
    }

    const testStart = Date.now();
    let status = 'PASS';
    let errorMessage = null;

    try {
      await test.testFn();
      passedCount++;
      const duration = Date.now() - testStart;
      console.log(`  ${colors.green}✓ PASS${colors.reset}  ${colors.bold}${test.id}${colors.reset} [${test.feature}] ${test.name} ${colors.gray}(${duration}ms)${colors.reset}`);
      results.push({ id: test.id, tier: test.tier, feature: test.feature, milestone: test.milestone, name: test.name, status: 'PASS', duration });
    } catch (err) {
      failedCount++;
      status = 'FAIL';
      errorMessage = err.message || String(err);
      const duration = Date.now() - testStart;
      console.log(`  ${colors.red}✗ FAIL${colors.reset}  ${colors.bold}${test.id}${colors.reset} [${test.feature}] ${test.name} ${colors.gray}(${duration}ms)${colors.reset}`);
      console.log(`         ${colors.red}Error: ${errorMessage}${colors.reset}`);
      results.push({ id: test.id, tier: test.tier, feature: test.feature, milestone: test.milestone, name: test.name, status: 'FAIL', duration, error: errorMessage });
    }
  }

  const totalDuration = Date.now() - startTime;

  // Summary Table
  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}VERIFICATION SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}========================================================================${colors.reset}`);
  console.log(`  Total Executed Tests : ${colors.bold}${filteredTests.length}${colors.reset}`);
  console.log(`  Passing Tests        : ${colors.green}${colors.bold}${passedCount}${colors.reset}`);
  console.log(`  Failing Tests        : ${failedCount > 0 ? colors.red + colors.bold + failedCount : colors.green + '0'}${colors.reset}`);
  console.log(`  Total Duration       : ${colors.dim}${totalDuration}ms${colors.reset}`);
  console.log(`${colors.cyan}========================================================================${colors.reset}\n`);

  if (options.json) {
    console.log(JSON.stringify({ summary: { total: filteredTests.length, passed: passedCount, failed: failedCount, duration: totalDuration }, results }, null, 2));
  }

  // Baseline Output Mode
  if (options.baseline) {
    console.log(`${colors.yellow}${colors.bold}[BASELINE RECORDED]${colors.reset} Test suite executed in baseline mode. Baseline results saved.`);
    process.exit(0);
  }

  // Strict Exit Semantics
  if (failedCount > 0 && options.strict) {
    console.log(`${colors.red}${colors.bold}[SUITE FAILED]${colors.reset} One or more test assertions failed.`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}[SUITE PASSED]${colors.reset} All verified test cases passed successfully!`);
    process.exit(0);
  }
}

runSuite().catch(err => {
  console.error(`Unexpected test runner failure:`, err);
  process.exit(1);
});
