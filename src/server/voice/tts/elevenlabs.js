// ElevenLabs adapter: built-in voices (optional) + Instant Voice Cloning for paid users.
// Key: ELEVENLABS_API_KEY (server env only). Azerbaijani needs Eleven v3 (or newer).
// Voice cloning needs a paid ElevenLabs plan on the owner's account.
import { PRESETS } from '../presets.js';
import { HttpError } from '../util.js';

const API = 'https://api.elevenlabs.io/v1';

export function elevenTts(cfg) {
  const { apiKey, model, voiceF, voiceM } = cfg.eleven;
  const H = () => {
    if (!apiKey) throw new HttpError(503, 'provider_not_configured', 'ELEVENLABS_API_KEY is not set');
    return { 'xi-api-key': apiKey };
  };

  async function tts(voiceId, text, presetId, speed) {
    const p = PRESETS[presetId] || PRESETS.semimi;
    const body = {
      text: p.eleven.tag ? `${p.eleven.tag} ${text}` : text,
      model_id: model,
      language_code: 'az',
      voice_settings: { stability: p.eleven.stability, similarity_boost: 0.8, speed: Math.min(1.2, Math.max(0.7, speed || 1)) }
    };
    const res = await fetch(`${API}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { ...H(), 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(body)
    });
    if (res.status === 429) throw new HttpError(503, 'provider_quota', 'The voice engine is busy or out of quota. Try again later.', { retryAfter: 60 });
    if (res.status === 401 || res.status === 403) throw new HttpError(502, 'provider_rejected', 'The TTS provider rejected the request');
    if (!res.ok) throw new HttpError(502, 'provider_failed', `The voice engine failed (${res.status})`);
    return { stream: res.body, format: 'mp3', mime: 'audio/mpeg' };  // streamed, no CPU spent
  }

  return {
    name: 'elevenlabs',
    async synthesize({ text, presetId, gender, speed }) {
      const voiceId = gender === 'm' ? voiceM : voiceF;
      if (!voiceId) throw new HttpError(503, 'provider_not_configured', 'ELEVENLABS_VOICE_F / ELEVENLABS_VOICE_M are not set');
      return tts(voiceId, text, presetId, speed);
    },
    async synthesizeWithVoice({ text, providerVoiceId, presetId, speed }) {
      return tts(providerVoiceId, text, presetId, speed);
    },
    async createVoice({ name, files, description }) {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', description || 'User-owned voice, consent recorded');
      fd.append('remove_background_noise', 'true');
      files.forEach((f, i) => fd.append('files', new Blob([f.bytes], { type: f.type }), f.name || `sample-${i}.webm`));
      const res = await fetch(`${API}/voices/add`, { method: 'POST', headers: H(), body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.voice_id) throw new HttpError(502, 'clone_failed', 'Voice cloning failed', { providerStatus: res.status });
      return { providerVoiceId: data.voice_id };
    },
    async deleteVoice(providerVoiceId) {
      const res = await fetch(`${API}/voices/${encodeURIComponent(providerVoiceId)}`, { method: 'DELETE', headers: H() });
      if (!res.ok && res.status !== 404) throw new HttpError(502, 'clone_delete_failed', 'Could not delete the voice at the provider');
      return true;
    },
    async transcribe() { return null; }
  };
}
