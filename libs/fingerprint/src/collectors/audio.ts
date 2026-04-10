/**
 * Audio fingerprinting: processes a silent oscillator signal through a
 * dynamics compressor in an OfflineAudioContext. No audio is played.
 * The sum of absolute sample values varies by browser DSP implementation
 * and CPU floating-point behavior.
 */
export async function getAudioFingerprint(): Promise<string> {
  if (typeof OfflineAudioContext === 'undefined') return '';

  try {
    const sampleRate = 44100;
    const bufferLen = 4096;

    const offlineCtx = new OfflineAudioContext(1, bufferLen, sampleRate);

    // Triangle oscillator at 10 kHz — richer harmonics than sine
    const oscillator = offlineCtx.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, offlineCtx.currentTime);

    // Dynamics compressor — exaggerates numeric differences between DSP implementations
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, offlineCtx.currentTime);
    compressor.knee.setValueAtTime(40, offlineCtx.currentTime);
    compressor.ratio.setValueAtTime(12, offlineCtx.currentTime);
    compressor.attack.setValueAtTime(0, offlineCtx.currentTime);
    compressor.release.setValueAtTime(0.25, offlineCtx.currentTime);

    // Pipeline: oscillator → compressor → offline destination
    oscillator.connect(compressor);
    compressor.connect(offlineCtx.destination);

    oscillator.start(0);
    oscillator.stop(bufferLen / sampleRate);

    const buffer = await offlineCtx.startRendering();
    const samples = buffer.getChannelData(0);

    // Sum of absolute values — always positive, high numeric distinctiveness
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += Math.abs(samples[i]);
    }

    return sum.toString();
  } catch {
    return '';
  }
}
