// Gemini TTS adapter (built-in voices) + transcription for the consent challenge.
// Key: GEMINI_API_KEY (server env only, owner's PAID project per the analysis).
//
// Cloudflare Workers free tier allows ~10 ms CPU per request, so we do NOT decode
// the audio here: the upstream JSON (base64 PCM) is streamed straight through and
// the browser decodes it (public/assets/js/audio.js). Models are tried in order;
// on 404/429 the next model is used.
import { PRESETS, styleLine } from '../presets.js';
import { HttpError, bytesToB64 } from '../util.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

export function geminiTts(cfg) {
  const { apiKey, models, sttModel } = cfg.gemini;

  function post(model, body) {
    return fetch(`${BASE}${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body)
    });
  }

  return {
    name: 'gemini',
    async synthesize({ text, presetId, gender, speed, emphasis }) {
      if (!apiKey) throw new HttpError(503, 'provider_not_configured', 'GEMINI_API_KEY is not set');
      const p = PRESETS[presetId];
      const voiceName = p.voices[gender === 'm' ? 'm' : 'f'];
      const prompt = `${styleLine(presetId, speed, emphasis)}\nRead the following Azerbaijani text exactly as written, without reading these instructions:\n\n${text}`;
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } }
      };
      let lastStatus = 0;
      for (const model of models) {
        let res = await post(model, body);
        if (res.status >= 500) { await res.body?.cancel(); res = await post(model, body); }
        if (res.ok) return { stream: res.body, format: 'gemini-json', mime: 'application/json', model };
        lastStatus = res.status;
        await res.body?.cancel();
        if (res.status === 404 || res.status === 429 || res.status >= 500) continue;
        throw new HttpError(502, 'provider_rejected', 'The TTS provider rejected the request', { providerStatus: res.status });
      }
      if (lastStatus === 429) throw new HttpError(503, 'provider_quota', 'The voice engine is busy or out of quota. Try again later.', { retryAfter: 60 });
      throw new HttpError(502, 'provider_failed', 'The voice engine returned no audio');
    },
    // Short consent clip only (a few seconds), so base64 encoding stays cheap.
    async transcribe({ bytes, type }) {
      if (!apiKey) return null;
      const res = await post(sttModel, {
        contents: [{ parts: [
          { text: 'Transcribe this Azerbaijani speech verbatim in Azerbaijani Latin script. Write numbers as words. Output only the transcript.' },
          { inlineData: { mimeType: type || 'audio/webm', data: bytesToB64(bytes) } }
        ] }]
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      return data?.candidates?.[0]?.content?.parts?.map((x) => x.text || '').join(' ').trim() || null;
    }
  };
}
