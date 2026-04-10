/**
 * Font detection via canvas text width comparison.
 * A font is considered installed if its rendered text width differs from
 * the monospace or sans-serif baseline. No DOM manipulation required.
 */

const FONT_LIST: readonly string[] = [
  'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia',
  'Helvetica', 'Impact', 'Tahoma', 'Times New Roman', 'Trebuchet MS',
  'Verdana', 'Wingdings', 'Calibri', 'Cambria', 'Candara', 'Consolas',
  'Constantia', 'Corbel', 'Franklin Gothic Medium', 'Garamond', 'Gill Sans',
  'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif',
  'Palatino Linotype', 'Segoe UI', 'Symbol', 'Bookman Old Style',
  'Book Antiqua', 'Century Gothic', 'Century', 'Futura', 'Rockwell',
  'Baskerville', 'Optima', 'Geneva', 'Monaco', 'Menlo', 'Andale Mono',
];

// Wide + narrow chars maximize width differences between fonts
const TEST_STRING = 'mmmmmmmmmmlli';
const FONT_SIZE = '72px';

export function getFontsFingerprint(): string {
  if (typeof document === 'undefined') return '';

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Measure baseline widths
    ctx.font = `${FONT_SIZE} monospace`;
    const monoW = ctx.measureText(TEST_STRING).width;

    ctx.font = `${FONT_SIZE} sans-serif`;
    const sansW = ctx.measureText(TEST_STRING).width;

    const detected: string[] = [];

    for (const font of FONT_LIST) {
      // Test with monospace fallback
      ctx.font = `${FONT_SIZE} '${font}', monospace`;
      const w1 = ctx.measureText(TEST_STRING).width;

      // Test with sans-serif fallback
      ctx.font = `${FONT_SIZE} '${font}', sans-serif`;
      const w2 = ctx.measureText(TEST_STRING).width;

      // Font is installed if it renders differently from either baseline
      if (w1 !== monoW || w2 !== sansW) {
        detected.push(font);
      }
    }

    return JSON.stringify(detected);
  } catch {
    return '';
  }
}
