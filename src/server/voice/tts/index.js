// TTS / cloning provider registry.
// Built-in interface: synthesize({ text, presetId, gender, speed, emphasis }) -> { bytes, mime }
// Clone interface:    createVoice({ name, files:[{bytes,type,name}] }) -> { providerVoiceId }
//                     deleteVoice(providerVoiceId)
//                     synthesizeWithVoice({ text, providerVoiceId, presetId, speed }) -> { bytes, mime }
// Verify interface:   transcribe({ bytes, type }) -> string | null
import { mockTts } from './mock.js';
import { geminiTts } from './gemini.js';
import { elevenTts } from './elevenlabs.js';
import { HttpError } from '../util.js';

const FACTORIES = { mock: mockTts, gemini: geminiTts, elevenlabs: elevenTts };

export function getProvider(name, cfg) {
  const f = FACTORIES[name];
  if (!f) throw new HttpError(500, 'bad_provider', `Unknown provider "${name}"`);
  return f(cfg);
}
