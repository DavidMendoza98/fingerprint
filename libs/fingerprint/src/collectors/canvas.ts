/**
 * Canvas fingerprinting: renders text and geometric shapes to a hidden canvas
 * and returns the PNG data URL. Output varies by OS font engine, GPU driver,
 * and browser rendering pipeline.
 */
export async function getCanvasFingerprint(): Promise<string> {
  if (typeof document === 'undefined') return '';

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Background rectangle
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);

    // Text layer 1: Arial 11pt
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#069';
    ctx.font = '11pt Arial';
    // Emoji U+1F30D (🌍) and U+1F600 (😀) exercise OS emoji rendering
    ctx.fillText('Hello, world! \uD83C\uDF0D\uD83D\uDE00', 2, 15);

    // Text layer 2: Arial 18pt, semi-transparent
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.font = '18pt Arial';
    ctx.fillText('Hello, world! \uD83C\uDF0D\uD83D\uDE00', 4, 45);

    // Geometric shapes — exercise GPU rasterization paths
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 0, 255, 0.4)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 200, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(80, 200, 100, 0, 160, 100);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.quadraticCurveTo(200, 60, 220, 30);
    ctx.stroke();

    return canvas.toDataURL();
  } catch {
    return '';
  }
}
