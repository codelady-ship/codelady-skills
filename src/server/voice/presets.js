// Server copy of the 10 style presets (ids must match public/assets/js/data.js;
// tests/api.test.mjs checks this). Delivery only; none imitates a real person.
// The chip names (Aysel, Elvin, Ayla…) live in data.js and are fictional style names.

export const GEMINI_BASE =
  'Azerbaijani with a native Baku accent (not Turkish). Natural conversational rhythm, not like reading aloud. ' +
  'Pronounce ə, ı, ö, ü, ğ, q and x the Azerbaijani way.';

export const PRESETS = {
  semimi: { wpm: 112, voices: { f: 'Sulafat', m: 'Achird' }, eleven: { tag: '', stability: 0.5 },
    style: 'Warm, confident, friendly explainer with a slight smile. Brisk but clear. Short pause after commas, clear pause after each sentence. Yes/no questions rise at the end; wh-questions stress the question word.' },
  reel: { wpm: 138, voices: { f: 'Laomedeia', m: 'Puck' }, eleven: { tag: '[excited]', stability: 0.3 },
    style: 'Very energetic, upbeat Reel host with a big smile. Fast, punchy short sentences, excited emphasis on numbers and offers, quick pauses.' },
  muellim: { wpm: 96, voices: { f: 'Erinome', m: 'Sadaltager' }, eleven: { tag: '', stability: 0.8 },
    style: 'Calm, patient, friendly teacher. Moderate pace, clear articulation, longer pause between steps, gentle stress on key terms.' },
  lifestyle: { wpm: 102, voices: { f: 'Despina', m: 'Umbriel' }, eleven: { tag: '', stability: 0.5 },
    style: 'Soft, cosy, intimate lifestyle voice, as if close to the microphone. Relaxed pace, gentle pauses, warm and dreamy.' },
  lux: { wpm: 90, voices: { f: 'Gacrux', m: 'Algieba' }, eleven: { tag: '', stability: 0.8 },
    style: 'Elegant, sophisticated luxury-ad voice. Slow, controlled, long pauses between short phrases, calm confidence, refined and smooth.' },
  nagil: { wpm: 85, voices: { f: 'Vindemiatrix', m: 'Charon' }, eleven: { tag: '[curious]', stability: 0.5 },
    style: 'Warm, wise storyteller. Slow pace, rich, gentle voice, long pauses before important moments, gentle emotion, like telling a tale to children.' },
  xeber: { wpm: 114, voices: { f: 'Kore', m: 'Rasalgethi' }, eleven: { tag: '', stability: 0.8 },
    style: 'Professional news anchor. Neutral, authoritative, crisp diction, steady pace, even intonation, clear stress on numbers and names.' },
  premium: { wpm: 90, voices: { f: 'Achernar', m: 'Orus' }, eleven: { tag: '', stability: 0.8 },
    style: 'Deep, resonant premium brand voice. Slow, confident pace, weighty pauses between short phrases, calm power.' },
  motiv: { wpm: 120, voices: { f: 'Leda', m: 'Alnilam' }, eleven: { tag: '[excited]', stability: 0.3 },
    style: 'Passionate motivational speaker. Starts calm and builds energy, strong emphasis on key words, a short dramatic pause before the final line.' },
  vlog: { wpm: 145, voices: { f: 'Autonoe', m: 'Zubenelgenubi' }, eleven: { tag: '', stability: 0.3 },
    style: 'Playful, funny young vlogger, casual and colloquial. Fast, lively ups and downs, a short comic pause before the punchline.' }
};

export function styleLine(presetId, speed = 1, emphasis = []) {
  const p = PRESETS[presetId];
  const wpm = Math.round(p.wpm * speed);
  let s = `${GEMINI_BASE} ${p.style} Pace about ${wpm} words per minute.`;
  if (emphasis.length) s += ` Emphasise: ${emphasis.slice(0, 6).join(', ')}.`;
  return s;
}
