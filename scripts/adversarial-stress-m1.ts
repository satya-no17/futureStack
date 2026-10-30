/**
 * Inkloom AI — Milestone 1 Adversarial Stress Test Suite
 *
 * Scope:
 * - Repeated Simulation Mode Thrashing & Subscriber Resiliency
 * - Total Outage API Contract Invariants (30+ endpoints)
 * - Safe Tab Switching Across All 8 Workspace Views Under Outage
 * - State Mutation & Score Integrity in In-Memory Offline Store
 * - Concurrency, Extreme Input & Memory Stress
 */

import {
  api,
  isFallbackActive,
  getFallbackReason,
  setSimulatedFailure,
  isSimulatedFailureActive,
  subscribeToFallbackState,
  testConnection,
  ContentItem,
  ContentDetails,
  Issue
} from '../apps/web/lib/api';

import {
  FALLBACK_CONTENTS,
  FALLBACK_CONTENT_DETAILS,
  FALLBACK_GUIDELINES,
  FALLBACK_FACTS,
  FALLBACK_BANNED_TERMS,
  FALLBACK_ANALYTICS,
  FALLBACK_AUDIT_LOGS,
  FALLBACK_APPROVAL_QUEUE,
  FALLBACK_SLIDE_DECK,
  FALLBACK_SELF_HEALING
} from '../apps/web/lib/fallbackData';

interface TestResult {
  suite: string;
  name: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];
let unhandledRejectionCount = 0;
let uncaughtExceptionCount = 0;

process.on('unhandledRejection', (reason) => {
  unhandledRejectionCount++;
  console.error('[CRITICAL] Unhandled Promise Rejection detected:', reason);
});

process.on('uncaughtException', (err) => {
  uncaughtExceptionCount++;
  console.error('[CRITICAL] Uncaught Exception detected:', err);
});

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ suite, name, status: 'PASS', durationMs: duration });
    console.log(`  ✓ PASS [${suite}] ${name} (${duration}ms)`);
  } catch (err: any) {
    const duration = Date.now() - start;
    results.push({ suite, name, status: 'FAIL', durationMs: duration, details: err.message });
    console.error(`  ✗ FAIL [${suite}] ${name} (${duration}ms): ${err.message}`);
  }
}

async function main() {
  console.log('========================================================================');
  console.log('  Inkloom AI — Challenger 1 Adversarial Stress Test Harness (Milestone 1) ');
  console.log('========================================================================\n');

  // ==========================================================================
  // SUITE 1: SIMULATION TOGGLE THRASHING & SUBSCRIBER STRESS
  // ==========================================================================
  console.log('--- SUITE 1: Simulation Toggle Thrashing & Subscriber Resiliency ---');

  await runTest('SUITE 1', 'Rapid alternating simulation toggle (10,000 cycles)', () => {
    for (let i = 0; i < 10000; i++) {
      setSimulatedFailure(true);
      assert(isSimulatedFailureActive() === true, 'Simulation should be active');
      assert(isFallbackActive() === true, 'Fallback should be active');
      setSimulatedFailure(false);
      assert(isSimulatedFailureActive() === false, 'Simulation should be inactive');
    }
  });

  await runTest('SUITE 1', 'Multi-subscriber notification order & unsubscribe isolation', () => {
    let sub1Calls = 0;
    let sub2Calls = 0;
    let sub3Calls = 0;

    const unsub1 = subscribeToFallbackState((active) => {
      sub1Calls++;
    });

    const unsub2 = subscribeToFallbackState((active) => {
      sub2Calls++;
      // A rogue subscriber that throws an error must not crash other subscribers
      if (active && sub2Calls > 2) {
        throw new Error('Rogue subscriber crash test');
      }
    });

    const unsub3 = subscribeToFallbackState((active) => {
      sub3Calls++;
    });

    // Initial subscribe invokes immediately
    assert(sub1Calls === 1, 'Sub 1 should receive initial state');
    assert(sub2Calls === 1, 'Sub 2 should receive initial state');
    assert(sub3Calls === 1, 'Sub 3 should receive initial state');

    setSimulatedFailure(true);
    assert(sub1Calls === 2, 'Sub 1 should receive update');
    assert(sub3Calls === 2, 'Sub 3 should still receive update despite Sub 2 throw');

    unsub2(); // unsubscribe sub2

    setSimulatedFailure(false);
    assert(sub1Calls === 3, 'Sub 1 should receive update');
    assert(sub2Calls === 2, 'Sub 2 should NOT receive update after unsubscribe');
    assert(sub3Calls === 3, 'Sub 3 should receive update');

    unsub1();
    unsub3();

    setSimulatedFailure(true);
    setSimulatedFailure(false);
    assert(sub1Calls === 3, 'Sub 1 should receive no further updates');
    assert(sub3Calls === 3, 'Sub 3 should receive no further updates');
  });

  await runTest('SUITE 1', 'Reason string consistency during toggle transitions', () => {
    setSimulatedFailure(true);
    const reasonActive = getFallbackReason();
    assert(typeof reasonActive === 'string' && reasonActive.length > 0, 'Reason must be non-empty string when active');
    setSimulatedFailure(false);
    const reasonInactive = getFallbackReason();
    assert(reasonInactive === null || typeof reasonInactive === 'string', 'Reason should be null or string');
  });

  await runTest('SUITE 1', 'testConnection() behavior during simulated failure', async () => {
    setSimulatedFailure(true);
    const isConn = await testConnection();
    assert(isConn === false, 'testConnection must return false when simulated failure is active');
    setSimulatedFailure(false);
  });

  // ==========================================================================
  // SUITE 2: COMPLETE BACKEND OUTAGE API CONTRACT INVARIANTS
  // ==========================================================================
  console.log('\n--- SUITE 2: Complete Backend Outage API Contract Invariants ---');

  // Force simulated failure on for total outage emulation
  setSimulatedFailure(true);

  await runTest('SUITE 2', 'api.login(), register(), getMe() contracts under outage', async () => {
    const loginRes = await api.login('challenger@inkloom.test', 'secret123');
    assert(loginRes && typeof loginRes.token === 'string', 'Login must return token');
    assert(loginRes.user && loginRes.user.email === 'challenger@inkloom.test', 'User email must match');
    assert(loginRes.organization && typeof loginRes.organization.name === 'string', 'Organization must be returned');

    const regRes = await api.register('Adversarial Org', 'enterprise', 'Tester', 'test@inkloom.test');
    assert(regRes && typeof regRes.token === 'string', 'Register must return token');
    assert(regRes.organization.name === 'Adversarial Org', 'Org name must match');

    const meRes = await api.getMe();
    assert(meRes && meRes.user && meRes.organization, 'getMe must return user and organization');
  });

  await runTest('SUITE 2', 'api.getContents() returns valid non-null draft list', async () => {
    const res = await api.getContents();
    assert(Array.isArray(res.contents), 'res.contents must be an array');
    assert(res.contents.length >= 4, 'Must return at least 4 fallback drafts');
    for (const item of res.contents) {
      assert(typeof item.id === 'string' && item.id.length > 0, 'Item must have string id');
      assert(typeof item.title === 'string' && item.title.length > 0, 'Item must have string title');
      assert(typeof item.channel === 'string', 'Item must have string channel');
      assert(typeof item.latest_score === 'number', 'Item must have numeric latest_score');
      assert(typeof item.status === 'string', 'Item must have status');
    }
  });

  await runTest('SUITE 2', 'api.getContent() handles existing, missing, and malformed IDs', async () => {
    // 1. Existing ID
    const known = await api.getContent('draft-fallback-1');
    assert(known && known.content && known.content.id === 'draft-fallback-1', 'Must return draft-fallback-1');
    assert(Array.isArray(known.versions) && known.versions.length > 0, 'Must have versions');
    assert(Array.isArray(known.issues) && known.issues.length > 0, 'Must have issues');
    assert(known.latestReview !== undefined, 'latestReview must be defined');

    // 2. Non-existent ID
    const missing = await api.getContent('non-existent-id-99999');
    assert(missing && missing.content !== undefined, 'Missing ID must fall back gracefully');
    assert(Array.isArray(missing.versions), 'Missing ID fallback must have versions array');
    assert(Array.isArray(missing.issues), 'Missing ID fallback must have issues array');

    // 3. Malformed / Empty ID
    const emptyId = await api.getContent('');
    assert(emptyId && emptyId.content !== undefined, 'Empty ID must not crash');
  });

  await runTest('SUITE 2', 'api.patchIssue() mutates status and returns valid score', async () => {
    const patchRes = await api.patchIssue('iss-101', {
      status: 'accepted',
      suggestion: 'Brand-approved terminology'
    });
    assert(patchRes.issue && patchRes.issue.status === 'accepted', 'Issue status must be accepted');
    assert(typeof patchRes.newScore === 'number' && patchRes.newScore >= 0 && patchRes.newScore <= 100, 'Score must be 0-100');

    // Patch unknown issue ID
    const unknownPatch = await api.patchIssue('iss-unknown-uuid', {
      status: 'dismissed',
      dismiss_reason: 'False positive flag'
    });
    assert(unknownPatch.issue && unknownPatch.issue.status === 'dismissed', 'Unknown issue patch must succeed gracefully');
    assert(typeof unknownPatch.newScore === 'number', 'Score must be numeric');
  });

  await runTest('SUITE 2', 'api.getGuidelines(), api.getFacts(), api.getBannedTerms() contracts', async () => {
    const [gRes, fRes, bRes] = await Promise.all([
      api.getGuidelines(),
      api.getFacts(),
      api.getBannedTerms()
    ]);
    assert(Array.isArray(gRes.guidelines) && gRes.guidelines.length > 0, 'Guidelines array must be non-empty');
    assert(Array.isArray(fRes.facts) && fRes.facts.length > 0, 'Facts array must be non-empty');
    assert(Array.isArray(bRes.bannedTerms) && bRes.bannedTerms.length > 0, 'Banned terms array must be non-empty');

    assert(typeof gRes.guidelines[0].title === 'string', 'Guideline must have title');
    assert(typeof fRes.facts[0].content === 'string', 'Fact must have content');
    assert(typeof bRes.bannedTerms[0].term === 'string', 'Banned term must have term');
  });

  await runTest('SUITE 2', 'api.getAnalytics() & api.getAuditLogs() contracts', async () => {
    const analytics = await api.getAnalytics();
    assert(analytics && typeof analytics.stats === 'object', 'Analytics must have stats object');
    assert(typeof analytics.stats.total_drafts === 'number', 'total_drafts must be numeric');
    assert(typeof analytics.stats.approved_count === 'number', 'approved_count must be numeric');
    assert(typeof analytics.stats.org_avg_score === 'number', 'org_avg_score must be numeric');
    assert(Array.isArray(analytics.topViolations), 'topViolations must be an array');
    assert(Array.isArray(analytics.ambiguousRules), 'ambiguousRules must be an array');

    const auditRes = await api.getAuditLogs();
    assert(Array.isArray(auditRes.logs) && auditRes.logs.length > 0, 'Audit logs must be an array');
    assert(typeof auditRes.logs[0].action === 'string', 'Audit log must have action');
    assert(typeof auditRes.logs[0].actor_name === 'string', 'Audit log must have actor_name');
  });

  await runTest('SUITE 2', 'api.checkContrast() mathematical fallback under outage', async () => {
    // 1. High contrast
    const c1 = await api.checkContrast('#000000', '#ffffff');
    assert(c1.ratio >= 20.0, 'Black on white contrast ratio should be ~21:1');
    assert(c1.passesAA === true, 'Black on white must pass AA');
    assert(c1.passesAAA === true, 'Black on white must pass AAA');
    assert(c1.score === 'AAA', 'Black on white score must be AAA');

    // 2. Low contrast
    const c2 = await api.checkContrast('#9ca3af', '#ffffff');
    assert(c2.passesAA === false, 'Gray-400 on white fails AA');
    assert(c2.score === 'Fail' || c2.score === 'AA Large', 'Score should reflect failure or AA Large');

    // 3. 3-character hex shorthand
    const c3 = await api.checkContrast('#000', '#fff');
    assert(c3.passesAA === true, '3-character hex #000 on #fff must pass AA');

    // 4. Corrupt/Invalid hex values must NOT throw
    const c4 = await api.checkContrast('garbage-hex', 'not-a-color');
    assert(typeof c4.ratio === 'number', 'Invalid colors must return fallback ratio without throwing');
    assert(typeof c4.passesAA === 'boolean', 'Invalid colors must return boolean passesAA');
  });

  await runTest('SUITE 2', 'api.auditA11yText() offline readability scanning', async () => {
    const shortText = 'Inkloom AI ensures brand governance across social channels.';
    const r1 = await api.auditA11yText(shortText);
    assert(Array.isArray(r1.issues) && r1.issues.length === 0, 'Short text should have no readability issues');

    const longSentence = 'This is a very long sentence designed specifically to test the readability rule which flags any statement containing more than twenty eight words in order to maintain plain language accessibility across all corporate communications.';
    const r2 = await api.auditA11yText(longSentence);
    assert(Array.isArray(r2.issues) && r2.issues.length >= 1, 'Sentence > 28 words must flag accessibility issue');
    assert(r2.issues[0].type === 'accessibility', 'Issue type must be accessibility');

    // Empty string edge case
    const r3 = await api.auditA11yText('');
    assert(Array.isArray(r3.issues) && r3.issues.length === 0, 'Empty string must not crash');

    // Text with no punctuation edge case
    const r4 = await api.auditA11yText('no terminal punctuation whatsoever');
    assert(Array.isArray(r4.issues) && r4.issues.length === 0, 'Unpunctuated short text must not crash');
  });

  await runTest('SUITE 2', 'api.getSocialPreviews() and publishToSocial() contracts', async () => {
    const sp = await api.getSocialPreviews('draft-fallback-1', true);
    assert(Array.isArray(sp.previews) && sp.previews.length === 3, 'Must have previews for Twitter, LinkedIn, Threads');
    assert(sp.previews[0].channel === 'twitter', 'First preview must be Twitter');
    assert(sp.previews[0].formattedText.includes('🛡️'), 'Watermark must be included when true');

    const pubRes = await api.publishToSocial('draft-fallback-1', {
      channel: 'twitter',
      method: 'intent_url'
    });
    assert(pubRes.status === 'published_simulated', 'Status must be published_simulated in offline mode');
  });

  await runTest('SUITE 2', 'api.getDemoSlideDeck(), scanSlideDeck(), and self-healing contracts', async () => {
    const deck = await api.getDemoSlideDeck();
    assert(deck && Array.isArray(deck.slides) && deck.slides.length > 0, 'Demo deck must contain slides');

    const scan = await api.scanSlideDeck('Test Deck', 'pdf', deck.slides);
    assert(scan.totalSlides === deck.slides.length, 'Total slides must match');
    assert(typeof scan.overallScore === 'number', 'Overall score must be numeric');

    const sh = await api.getSelfHealingSuggestions();
    assert(Array.isArray(sh.suggestions) && sh.suggestions.length > 0, 'Self healing suggestions must be non-empty');

    const applySh = await api.applySelfHealingSuggestion(sh.suggestions[0].id);
    assert(applySh.success === true, 'Applying self-healing suggestion must succeed');
  });

  // ==========================================================================
  // SUITE 3: COMPLETE 8-TAB NAVIGATION SIMULATION UNDER TOTAL OUTAGE
  // ==========================================================================
  console.log('\n--- SUITE 3: Safe 8-Tab Navigation Under Total Outage ---');

  const tabs = [
    'studio',
    'slides',
    'approvals',
    'governance',
    'analytics',
    'audit',
    'a11y',
    'multitenant'
  ] as const;

  type ActiveTab = typeof tabs[number];

  async function simulateTabNavigation(tab: ActiveTab) {
    try {
      if (tab === 'governance') {
        const [gRes, fRes, bRes] = await Promise.all([
          api.getGuidelines().catch(() => ({ guidelines: [] })),
          api.getFacts().catch(() => ({ facts: [] })),
          api.getBannedTerms().catch(() => ({ bannedTerms: [] }))
        ]);
        assert(Array.isArray(gRes.guidelines), 'gRes must be array');
        assert(Array.isArray(fRes.facts), 'fRes must be array');
        assert(Array.isArray(bRes.bannedTerms), 'bRes must be array');
      } else if (tab === 'analytics') {
        const aRes = await api.getAnalytics().catch(() => null);
        assert(aRes !== null && typeof aRes === 'object', 'aRes must be object');
      } else if (tab === 'audit') {
        const audRes = await api.getAuditLogs().catch(() => ({ logs: [] }));
        assert(Array.isArray(audRes.logs), 'audRes must be array');
      } else if (tab === 'approvals') {
        const qRes = await api.getApprovalsQueue().catch(() => ({ queue: [] }));
        assert(Array.isArray(qRes.queue), 'qRes must be array');
      } else if (tab === 'slides') {
        const deck = await api.getDemoSlideDeck().catch(() => null);
        assert(deck !== null && Array.isArray(deck.slides), 'deck must have slides');
      } else if (tab === 'a11y') {
        const cRes = await api.checkContrast('#1e293b', '#ffffff').catch(() => null);
        assert(cRes !== null && typeof cRes.ratio === 'number', 'cRes must have ratio');
      } else if (tab === 'multitenant') {
        const uRes = await api.getUsers().catch(() => ({ users: [] }));
        assert(Array.isArray(uRes.users), 'uRes must be array');
      } else if (tab === 'studio') {
        const cRes = await api.getContents().catch(() => ({ contents: [] }));
        assert(Array.isArray(cRes.contents), 'cRes must be array');
      }
    } catch (err: any) {
      throw new Error(`Tab navigation to "${tab}" threw uncaught error: ${err.message}`);
    }
  }

  await runTest('SUITE 3', 'Sequential navigation through all 8 tabs under outage', async () => {
    for (const tab of tabs) {
      await simulateTabNavigation(tab);
    }
  });

  await runTest('SUITE 3', 'Rapid randomized tab switching stress test (500 transitions)', async () => {
    for (let i = 0; i < 500; i++) {
      const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
      await simulateTabNavigation(randomTab);
    }
  });

  await runTest('SUITE 3', 'Concurrent tab switching simulation (50 parallel requests)', async () => {
    const promises = Array.from({ length: 50 }).map((_, i) => {
      const tab = tabs[i % tabs.length];
      return simulateTabNavigation(tab);
    });
    await Promise.all(promises);
  });

  // ==========================================================================
  // SUITE 4: IN-MEMORY MUTATION & STATE INTEGRITY UNDER OUTAGE
  // ==========================================================================
  console.log('\n--- SUITE 4: In-Memory Mutation & State Integrity Under Outage ---');

  await runTest('SUITE 4', 'Create draft offline adds to getContents() and getContent()', async () => {
    const beforeCount = (await api.getContents()).contents.length;
    const title = `Adversarial Test Draft ${Date.now()}`;
    const body = 'This is an offline draft generated by the challenger agent.';

    const created = await api.createContent(title, 'linkedin', body);
    assert(created.content.title === title, 'Created title must match');
    assert(created.version.body === body, 'Created body must match');

    const afterRes = await api.getContents();
    assert(afterRes.contents.length === beforeCount + 1, 'Contents count must increment by 1');
    assert(afterRes.contents[0].id === created.content.id, 'New draft must be unshifted to front');

    const detail = await api.getContent(created.content.id);
    assert(detail.content.id === created.content.id, 'Draft details must be retrievable');
    assert(detail.versions[0].body === body, 'Draft version body must match');
  });

  await runTest('SUITE 4', 'Submit for approval adds draft to approval queue', async () => {
    const created = await api.createContent('Approval Queue Test', 'twitter', 'Body for approval');
    const queueBefore = (await api.getApprovalsQueue()).queue.length;

    await api.submitForApproval(created.content.id);

    const queueAfter = (await api.getApprovalsQueue()).queue;
    assert(queueAfter.length === queueBefore + 1, 'Approval queue length must increase');
    assert(queueAfter[0].id === created.content.id, 'Draft must be at head of approval queue');
  });

  await runTest('SUITE 4', 'Submit decision updates status, removes from queue, adds audit log', async () => {
    const created = await api.createContent('Decision Test Draft', 'threads', 'Body to be rejected');
    await api.submitForApproval(created.content.id);

    const auditBefore = (await api.getAuditLogs()).logs.length;
    await api.submitDecision(created.content.id, 'rejected', 'Violates brand voice policy');

    const detail = await api.getContent(created.content.id);
    assert(detail.content.status === 'rejected', 'Draft status must be rejected');

    const queue = (await api.getApprovalsQueue()).queue;
    const inQueue = queue.some((q) => q.id === created.content.id);
    assert(!inQueue, 'Decided draft must be removed from approval queue');

    const auditAfter = (await api.getAuditLogs()).logs;
    assert(auditAfter.length === auditBefore + 1, 'Audit log must increment');
    assert(auditAfter[0].action === 'rejected', 'Audit log action must be rejected');
  });

  await runTest('SUITE 4', 'Banned terms add and delete mutate state correctly', async () => {
    const term = `banned-${Date.now()}`;
    const beforeList = (await api.getBannedTerms()).bannedTerms;

    const added = await api.createBannedTerm(term, 'preferred-term', 'Testing reason', 'high');
    const afterAdd = (await api.getBannedTerms()).bannedTerms;
    assert(afterAdd.some((b) => b.id === added.bannedTerm.id), 'Added banned term must be present');

    await api.deleteBannedTerm(added.bannedTerm.id);
    const afterDelete = (await api.getBannedTerms()).bannedTerms;
    assert(!afterDelete.some((b) => b.id === added.bannedTerm.id), 'Deleted banned term must be removed');
  });

  // ==========================================================================
  // SUITE 5: HIGH CONCURRENCY, EXTREME DATA & MEMORY PRESSURE
  // ==========================================================================
  console.log('\n--- SUITE 5: High Concurrency, Extreme Data & Memory Pressure ---');

  await runTest('SUITE 5', '100 concurrent heterogeneous API calls during outage', async () => {
    const tasks = [];
    for (let i = 0; i < 100; i++) {
      const mod = i % 5;
      if (mod === 0) tasks.push(api.getContents());
      else if (mod === 1) tasks.push(api.getContent('draft-fallback-1'));
      else if (mod === 2) tasks.push(api.getAnalytics());
      else if (mod === 3) tasks.push(api.getAuditLogs());
      else tasks.push(api.getGuidelines());
    }
    const resList = await Promise.all(tasks);
    assert(resList.length === 100, 'All 100 concurrent tasks must complete successfully');
  });

  await runTest('SUITE 5', 'Large input boundary stress (>100,000 char draft body)', async () => {
    const hugeBody = 'Enterprise brand governance statement. '.repeat(2500); // ~100k chars
    const created = await api.createContent('Huge Body Test', 'email', hugeBody);
    assert(created.version.body.length === hugeBody.length, 'Huge body must be preserved without truncation');

    const newVer = await api.createNewVersion(created.content.id, hugeBody + ' Version 2');
    assert(newVer.version.body.length > hugeBody.length, 'Huge body version 2 must be preserved');
  });

  await runTest('SUITE 5', 'Memory stability check across 1,000 rapid operations', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    for (let i = 0; i < 1000; i++) {
      await api.getContents();
      await api.getAnalytics();
    }
    const finalMemory = process.memoryUsage().heapUsed;
    const diffMb = (finalMemory - initialMemory) / (1024 * 1024);
    console.log(`    (Heap delta after 1,000 ops: ${diffMb.toFixed(2)} MB)`);
    assert(diffMb < 150, 'Memory consumption must not leak excessively (<150MB delta)');
  });

  // Reset simulation flag to clean state
  setSimulatedFailure(false);

  // ==========================================================================
  // FINAL SUMMARY
  // ==========================================================================
  console.log('\n========================================================================');
  console.log('  CHALLENGER 1 ADVERSARIAL STRESS TEST SUMMARY');
  console.log('========================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log(`  Total Tests Executed        : ${total}`);
  console.log(`  Passed Tests                : ${passed}`);
  console.log(`  Failed Tests                : ${failed}`);
  console.log(`  Unhandled Rejections Seen   : ${unhandledRejectionCount}`);
  console.log(`  Uncaught Exceptions Seen    : ${uncaughtExceptionCount}`);
  console.log('========================================================================\n');

  if (failed > 0 || unhandledRejectionCount > 0 || uncaughtExceptionCount > 0) {
    console.error('❌ ADVERSARIAL STRESS TEST SUITE REJECTED WITH DEFECTS.');
    process.exit(1);
  } else {
    console.log('✅ ADVERSARIAL STRESS TEST SUITE CONFIRMED: ZERO DEFECTS DETECTED.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal crash in test runner:', err);
  process.exit(1);
});
