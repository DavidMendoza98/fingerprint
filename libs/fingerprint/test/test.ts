/**
 * Consistency test for @ingeniacode/fingerprint.
 *
 * Verifies that three consecutive calls to getFingerprint() in the same
 * browser session produce identical visitorId values.
 *
 * Run: serve this file (or its compiled output) and open in a browser.
 * Check the DevTools console for PASS / FAIL output.
 *
 * No test framework is required — uses console.assert only.
 */
import { getFingerprint } from '../src/index.js';

async function runConsistencyTest(): Promise<void> {
  console.log('[fingerprint] Running consistency test...');

  // Run three times concurrently — getFingerprint() is stateless so this is valid
  const [r1, r2, r3] = await Promise.all([
    getFingerprint(),
    getFingerprint(),
    getFingerprint(),
  ]);

  console.log('[fingerprint] Run 1 visitorId:', r1.visitorId);
  console.log('[fingerprint] Run 2 visitorId:', r2.visitorId);
  console.log('[fingerprint] Run 3 visitorId:', r3.visitorId);
  console.log('[fingerprint] Components:', JSON.stringify(r1.components, null, 2));

  console.assert(
    r1.visitorId === r2.visitorId,
    `FAIL: Run 1 and Run 2 differ — "${r1.visitorId}" vs "${r2.visitorId}"`,
  );
  console.assert(
    r2.visitorId === r3.visitorId,
    `FAIL: Run 2 and Run 3 differ — "${r2.visitorId}" vs "${r3.visitorId}"`,
  );
  console.assert(
    r1.visitorId.length === 8,
    `FAIL: visitorId is not 8 hex chars — got "${r1.visitorId}"`,
  );
  console.assert(
    r1.visitorId !== 'ssr-placeholder',
    'FAIL: SSR placeholder returned in browser context',
  );

  const allMatch =
    r1.visitorId === r2.visitorId &&
    r2.visitorId === r3.visitorId &&
    r1.visitorId.length === 8 &&
    r1.visitorId !== 'ssr-placeholder';

  if (allMatch) {
    console.log(`[fingerprint] PASS: All 3 runs produced identical visitorId: "${r1.visitorId}"`);
  } else {
    console.error('[fingerprint] FAIL: One or more assertions failed. See above.');
  }
}

runConsistencyTest().catch((err: unknown) => {
  console.error('[fingerprint] Unexpected error during test:', err);
});
