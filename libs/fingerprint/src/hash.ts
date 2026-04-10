/**
 * MurmurHash3 (32-bit, x86 variant) — pure TypeScript, zero dependencies.
 *
 * Verified against smhasher test vectors:
 *   murmurhash3_x86_32("hello", 0) === 0x248bfa47
 *   murmurhash3_x86_32("test",  0) === 0xba6bd213
 *   murmurhash3_x86_32("",      0) === 0x00000000
 */
function murmurhash3_x86_32(key: string, seed: number): number {
  let h1 = seed | 0;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  const len = key.length;
  const remainder = len & 3;     // len % 4
  const bytes = len - remainder; // largest multiple of 4 <= len
  let i = 0;

  // Main body: process 4-char (4-byte for ASCII) blocks
  while (i < bytes) {
    let k1 =
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(i + 1) & 0xff) << 8) |
      ((key.charCodeAt(i + 2) & 0xff) << 16) |
      ((key.charCodeAt(i + 3) & 0xff) << 24);

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17); // ROTL32(k1, 15)
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19); // ROTL32(h1, 13)
    h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;

    i += 4;
  }

  // Tail: remaining 1–3 chars
  let k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
    // falls through
    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
    // falls through
    case 1:
      k1 ^= key.charCodeAt(i) & 0xff;
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }

  // Finalization: mix in length, then fmix32
  h1 ^= len;

  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0; // unsigned 32-bit integer
}

/**
 * Joins component strings with '|', hashes the result, and returns an 8-char
 * lowercase hex string. The order of components is stable and must not change.
 */
export function hashComponents(components: string[]): string {
  const combined = components.join('|');
  const hash = murmurhash3_x86_32(combined, 0);
  return hash.toString(16).padStart(8, '0');
}
