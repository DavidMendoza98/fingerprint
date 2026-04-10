# @ingeniacode/fingerprint

A standalone, zero-dependency TypeScript library for browser fingerprinting. Collects signals from five independent browser APIs, hashes them with MurmurHash3 (32-bit), and returns a stable `visitorId` — no cookies, no storage, no server round-trips.

## Features

- **Zero runtime dependencies** — pure TypeScript, native Web APIs only
- **Five signal collectors** — Canvas, WebGL, Audio, Hardware, Fonts
- **Error boundaries** — one blocked API never breaks the fingerprint
- **SSR-safe** — returns a placeholder when `window` is unavailable
- **Consistent** — same browser + hardware = same `visitorId` across calls
- **Lightweight** — single async function, tree-shakeable ESM output

## Installation

```bash
npm install @ingeniacode/fingerprint
```

## API

```ts
import { getFingerprint } from '@ingeniacode/fingerprint';

const { visitorId, components } = await getFingerprint();
```

### `getFingerprint(): Promise<FingerprintResult>`

Collects all signals concurrently and returns:

| Field | Type | Description |
|---|---|---|
| `visitorId` | `string` | 8-character lowercase hex hash (e.g. `"a3f2b1c4"`) |
| `components` | `Record<string, string>` | Raw output from each collector, keyed by name |

#### Component keys

| Key | Source |
|---|---|
| `canvas` | PNG data URL from a hidden 2D canvas |
| `webgl` | GPU vendor, renderer, and hardware parameters |
| `audio` | OfflineAudioContext DSP signature |
| `hardware` | OS, screen, memory, concurrency, timezone |
| `fonts` | List of detected system fonts |

#### SSR behaviour

When called outside a browser (Next.js SSR, Node.js, Cloudflare Workers), `getFingerprint()` returns immediately without accessing any browser API:

```ts
{ visitorId: 'ssr-placeholder', components: {} }
```

---

## React

### Hook

```tsx
// hooks/useFingerprint.ts
import { useState, useEffect } from 'react';
import { getFingerprint, type FingerprintResult } from '@ingeniacode/fingerprint';

interface UseFingerprintResult {
  visitorId: string | null;
  components: FingerprintResult['components'];
  loading: boolean;
  error: Error | null;
}

export function useFingerprint(): UseFingerprintResult {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [components, setComponents] = useState<FingerprintResult['components']>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    getFingerprint()
      .then((result) => {
        if (!cancelled) {
          setVisitorId(result.visitorId);
          setComponents(result.components);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { visitorId, components, loading, error };
}
```

### Component usage

```tsx
// components/VisitorBadge.tsx
import { useFingerprint } from '../hooks/useFingerprint';

export function VisitorBadge() {
  const { visitorId, loading, error } = useFingerprint();

  if (loading) return <span>Identifying…</span>;
  if (error)   return <span>Fingerprint unavailable</span>;

  return (
    <div className="visitor-badge">
      <span className="label">Visitor ID</span>
      <code>{visitorId}</code>
    </div>
  );
}
```

### Next.js (App Router)

Because `getFingerprint()` requires browser APIs, call it only in Client Components:

```tsx
// app/components/FingerprintProvider.tsx
'use client';

import { createContext, useContext } from 'react';
import { useFingerprint } from '../hooks/useFingerprint';
import type { FingerprintResult } from '@ingeniacode/fingerprint';

interface FingerprintContextValue {
  visitorId: string | null;
  components: FingerprintResult['components'];
  loading: boolean;
}

const FingerprintContext = createContext<FingerprintContextValue>({
  visitorId: null,
  components: {},
  loading: true,
});

export function FingerprintProvider({ children }: { children: React.ReactNode }) {
  const { visitorId, components, loading } = useFingerprint();

  return (
    <FingerprintContext.Provider value={{ visitorId, components, loading }}>
      {children}
    </FingerprintContext.Provider>
  );
}

export const useVisitorId = () => useContext(FingerprintContext);
```

```tsx
// app/layout.tsx
import { FingerprintProvider } from './components/FingerprintProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FingerprintProvider>
          {children}
        </FingerprintProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx  (Server Component — reads from context via a Client Component)
'use client';

import { useVisitorId } from './components/FingerprintProvider';

export default function Page() {
  const { visitorId, loading } = useVisitorId();

  return (
    <main>
      <p>Visitor ID: {loading ? 'Loading…' : visitorId}</p>
    </main>
  );
}
```

---

## Angular

### Service

```ts
// fingerprint.service.ts
import { Injectable, signal } from '@angular/core';
import { getFingerprint, type FingerprintResult } from '@ingeniacode/fingerprint';

@Injectable({ providedIn: 'root' })
export class FingerprintService {
  readonly visitorId   = signal<string | null>(null);
  readonly components  = signal<FingerprintResult['components']>({});
  readonly loading     = signal(true);
  readonly error       = signal<Error | null>(null);

  constructor() {
    this.collect();
  }

  private collect(): void {
    getFingerprint()
      .then((result) => {
        this.visitorId.set(result.visitorId);
        this.components.set(result.components);
      })
      .catch((err: unknown) => {
        this.error.set(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        this.loading.set(false);
      });
  }
}
```

### Component

```ts
// visitor-badge.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FingerprintService } from './fingerprint.service';

@Component({
  selector: 'app-visitor-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visitor-badge">
      @if (fp.loading()) {
        <span>Identifying…</span>
      } @else if (fp.error()) {
        <span>Fingerprint unavailable</span>
      } @else {
        <span class="label">Visitor ID</span>
        <code>{{ fp.visitorId() }}</code>
      }
    </div>
  `,
})
export class VisitorBadgeComponent {
  protected fp = inject(FingerprintService);
}
```

### Usage in a standalone app

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // FingerprintService is providedIn: 'root' — no extra registration needed
  ],
};
```

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(console.error);
```

```ts
// app.component.ts
import { Component } from '@angular/core';
import { VisitorBadgeComponent } from './visitor-badge.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VisitorBadgeComponent],
  template: `<app-visitor-badge />`,
})
export class AppComponent {}
```

### Angular Universal (SSR)

The library is SSR-safe out of the box. When Angular Universal renders on the server, `getFingerprint()` returns `{ visitorId: 'ssr-placeholder', components: {} }` without touching any browser API. The real fingerprint is computed on the client after hydration.

---

## How it works

```
getFingerprint()
│
├── canvas    → hidden <canvas> 2D draw → toDataURL()
├── webgl     → WebGLRenderingContext → GPU vendor/renderer + hw params
├── audio     → OfflineAudioContext oscillator → sum(|samples|)
├── hardware  → navigator + screen + Intl → JSON
└── fonts     → canvas measureText width comparison → detected[]
│
└── hashComponents([canvas, webgl, audio, hardware, fonts])
        │
        └── MurmurHash3 (32-bit x86) → 8-char hex → visitorId
```

Each collector runs concurrently. If any Web API is blocked or unavailable, that collector returns an empty string and the rest continue normally.

## Collectors in detail

| Collector | Signal source | Varies by |
|---|---|---|
| **Canvas** | 2D rendering of text + shapes | GPU driver, OS font renderer, browser version |
| **WebGL** | GPU parameters + unmasked vendor/renderer | GPU model, driver version |
| **Audio** | OfflineAudioContext DSP output | CPU FPU, browser DSP implementation |
| **Hardware** | `navigator`, `screen`, `Intl`, `devicePixelRatio` | OS, device, display, locale |
| **Fonts** | Canvas text width per font family | Installed system fonts |

## Hashing

Signals are joined with `|` and hashed with **MurmurHash3 (32-bit x86)**, implemented in pure TypeScript using `Math.imul()` for correct 32-bit arithmetic. The output is an 8-character zero-padded lowercase hex string.

```
murmurhash3_x86_32("hello", 0) === 0x248bfa47
murmurhash3_x86_32("test",  0) === 0xba6bd213
```

## Privacy considerations

- No data is sent to any server by this library.
- No cookies or storage (`localStorage`, `sessionStorage`, `IndexedDB`) are written.
- All computation happens locally in the browser.
- The `visitorId` is deterministic — the same device produces the same ID on every call.
- Users who reset browser settings, clear site data, or switch browsers will receive a different `visitorId`.

## Browser support

| Browser | Version |
|---|---|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 14+ |
| Edge | 80+ |

Requires: `OfflineAudioContext`, `WebGLRenderingContext`, `HTMLCanvasElement`, `Intl.DateTimeFormat`. All available in any modern browser released after 2020.

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
