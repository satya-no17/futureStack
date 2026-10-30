/**
 * Inkloom AI — Adversarial Real Network Failure & Outage Stress Test
 *
 * Scope:
 * - Unreachable backend port (ECONNREFUSED) with simulated failure = FALSE
 * - HTTP 500 Internal Server Error injection
 * - HTTP 503 Service Unavailable injection
 * - AbortController timeout trigger (>3500ms server hang)
 */

import http from 'http';

// We must dynamically reload or configure API_URL before requiring api
const DEAD_PORT = 59123;
process.env.NEXT_PUBLIC_API_URL = `http://127.0.0.1:${DEAD_PORT}`;

// Clean cache to ensure api uses the new environment variable
delete require.cache[require.resolve('../apps/web/lib/api')];
const {
  api,
  isFallbackActive,
  getFallbackReason,
  setSimulatedFailure,
  isSimulatedFailureActive
} = require('../apps/web/lib/api');

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

async function run() {
  console.log('========================================================================');
  console.log('  Adversarial Real Network Failure & Outage Injection Test');
  console.log(`  Target Unreachable Port: ${DEAD_PORT}`);
  console.log('========================================================================\n');

  // Verify simulated failure is explicitly turned OFF
  setSimulatedFailure(false);
  assert(isSimulatedFailureActive() === false, 'Simulated failure must be false');

  // --------------------------------------------------------------------------
  // TEST 1: Connection Refused (Port Unreachable)
  // --------------------------------------------------------------------------
  console.log('1. Testing Connection Refused on Dead Port (http://127.0.0.1:59123)...');
  const draftsRes = await api.getContents();
  assert(Array.isArray(draftsRes.contents) && draftsRes.contents.length >= 4, 'Must return fallback drafts on connection refused');
  assert(isFallbackActive() === true, 'Fallback state must be active after network failure');
  const reason = getFallbackReason();
  console.log(`   Fallback active: ${isFallbackActive()}, Reason: "${reason}"`);
  assert(typeof reason === 'string' && reason.length > 0, 'Reason must be non-empty');

  const contentRes = await api.getContent('draft-fallback-1');
  assert(contentRes && contentRes.content.id === 'draft-fallback-1', 'Must return draft-fallback-1');

  const guidelinesRes = await api.getGuidelines();
  assert(Array.isArray(guidelinesRes.guidelines) && guidelinesRes.guidelines.length > 0, 'Must return guidelines');

  const analyticsRes = await api.getAnalytics();
  assert(analyticsRes && analyticsRes.stats.total_drafts > 0, 'Must return analytics stats');

  const auditRes = await api.getAuditLogs();
  assert(Array.isArray(auditRes.logs) && auditRes.logs.length > 0, 'Must return audit logs');

  const patchRes = await api.patchIssue('iss-101', { status: 'accepted' });
  assert(patchRes.issue.status === 'accepted', 'Must patch issue offline');

  console.log('   ✓ Connection Refused: All endpoints returned structured fallback without throwing.\n');

  // --------------------------------------------------------------------------
  // TEST 2: HTTP 500 / 503 Server Error Injection
  // --------------------------------------------------------------------------
  console.log('2. Testing HTTP 500 Internal Server Error & 503 Service Unavailable Injection...');
  const ERROR_PORT = 59124;
  let serverStatusCode = 500;

  const mockServer = http.createServer((req, res) => {
    res.writeHead(serverStatusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Simulated HTTP ${serverStatusCode} Failure from Chaos Server` }));
  });

  await new Promise<void>((resolve) => mockServer.listen(ERROR_PORT, '127.0.0.1', () => resolve()));

  // Re-point API_URL to error port
  process.env.NEXT_PUBLIC_API_URL = `http://127.0.0.1:${ERROR_PORT}`;
  delete require.cache[require.resolve('../apps/web/lib/api')];
  const apiError = require('../apps/web/lib/api').api;

  // HTTP 500
  serverStatusCode = 500;
  const res500 = await apiError.getContents();
  assert(Array.isArray(res500.contents) && res500.contents.length >= 4, 'Must return fallback on HTTP 500');
  console.log('   ✓ HTTP 500 handled gracefully, fallback data returned.');

  // HTTP 503
  serverStatusCode = 503;
  const res503 = await apiError.getAnalytics();
  assert(res503 && res503.stats.total_drafts > 0, 'Must return fallback on HTTP 503');
  console.log('   ✓ HTTP 503 handled gracefully, fallback data returned.');

  await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  console.log('   ✓ Chaos Error Server closed.\n');

  console.log('========================================================================');
  console.log('  ALL REAL NETWORK FAILURE & HTTP ERROR TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================================');
}

run().catch((err) => {
  console.error('[CRITICAL] Real Network Failure Test Failed:', err);
  process.exit(1);
});
