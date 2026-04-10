import { getCanvasFingerprint } from './collectors/canvas.js';
import { getWebGLFingerprint } from './collectors/webgl.js';
import { getAudioFingerprint } from './collectors/audio.js';
import { getHardwareFingerprint } from './collectors/hardware.js';
import { getFontsFingerprint } from './collectors/fonts.js';
import { hashComponents } from './hash.js';

export interface FingerprintResult {
  /** 8-character lowercase hex string derived from MurmurHash3 of all signals. */
  visitorId: string;
  /** Raw string value produced by each collector. Useful for debugging. */
  components: Record<string, string>;
}

/**
 * Wraps a collector call so that a failure returns an empty string without
 * propagating the error. This ensures one blocked API cannot break the whole fingerprint.
 */
async function safeCollect(
  name: string,
  fn: () => Promise<string> | string,
): Promise<[string, string]> {
  try {
    const value = await fn();
    return [name, value];
  } catch {
    return [name, ''];
  }
}

/**
 * Collects browser signals from five independent sources, hashes them with
 * MurmurHash3 (32-bit), and returns a stable `visitorId` string.
 *
 * SSR-safe: returns a server-side placeholder immediately when `window` is
 * not available (e.g., Node.js, Deno, Cloudflare Workers).
 */
export async function getFingerprint(): Promise<FingerprintResult> {
  // SSR guard: browser APIs are unavailable in server-side environments
  if (typeof window === 'undefined') {
    return { visitorId: 'ssr-placeholder', components: {} };
  }

  // Run all collectors concurrently; individual failures produce empty strings
  const results = await Promise.all([
    safeCollect('canvas', getCanvasFingerprint),
    safeCollect('webgl', getWebGLFingerprint),
    safeCollect('audio', getAudioFingerprint),
    safeCollect('hardware', getHardwareFingerprint),
    safeCollect('fonts', getFontsFingerprint),
  ]);

  const components: Record<string, string> = Object.fromEntries(results);

  // Hash in the same stable order as the array above
  const visitorId = hashComponents(results.map(([, value]) => value));

  return { visitorId, components };
}
