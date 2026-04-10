/**
 * Hardware and environment fingerprinting: collects stable, permission-free
 * properties from navigator, screen, and Intl APIs.
 */

// navigator.deviceMemory is not part of the standard TypeScript DOM lib
type NavigatorWithMemory = Navigator & { readonly deviceMemory?: number };

interface HardwareData {
  platform: string;
  userAgent: string;
  language: string;
  languages: string;
  hardwareConcurrency: number;
  deviceMemory: number | undefined;
  timeZone: string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
}

export function getHardwareFingerprint(): string {
  if (typeof window === 'undefined') return '';

  try {
    const nav = navigator as NavigatorWithMemory;

    const data: HardwareData = {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages.join(','),
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: nav.deviceMemory,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio,
    };

    return JSON.stringify(data);
  } catch {
    return '';
  }
}
