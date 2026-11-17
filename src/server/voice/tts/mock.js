// Mock TTS for local development and tests. Produces a short, quiet tone pattern
// (NOT speech) whose length follows the text, so the whole pipeline can be tested
// without any API key.
import { pcmToWav, randomId } from '../util.js';

function tone(text, baseHz) {
  const rate = 24000;
  const seconds = Math.min(12, Math.max(0.6, text.length / 16));
  const n = Math.floor(rate * seconds);
  const pcm = new Uint8Array(n * 2);
  const dv = new DataView(pcm.buffer);
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const per = n / words;
  for (let i = 0; i < n; i++) {
    const w = Math.floor(i / per);
    const pos = (i % per) / per;
    const env = pos < 0.8 ? Math.sin(Math.PI * pos / 0.8) : 0;           // syllable-like envelope
    const hz = baseHz * (1 + 0.08 * Math.sin(w * 1.7));
    const s = Math.sin(2 * Math.PI * hz * i / rate) * env * 0.18;
    dv.setInt16(i * 2, Math.round(s * 32767), true);
  }
  return pcmToWav(pcm, rate);
}

export function mockTts() {
  return {
    name: 'mock',
    isMock: true,
    async synthesize({ text, gender }) { return { bytes: tone(text, gender === 'm' ? 140 : 230), format: 'wav', mime: 'audio/wav' }; },
    async createVoice() { return { providerVoiceId: 'mock_' + randomId(8) }; },
    async deleteVoice() { return true; },
    async synthesizeWithVoice({ text }) { return { bytes: tone(text, 180), format: 'wav', mime: 'audio/wav' }; },
    async transcribe() { return null; } // null = "not checked" (mock accepts)
  };
}
