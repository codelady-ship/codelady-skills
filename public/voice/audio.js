/* Audio helpers: decode engine responses, join chunks, export WAV/MP3.
   Formats: 'wav' (RIFF), 'gemini-json' (generateContent JSON with base64 PCM), 'mp3'. */
(function (root) {
  'use strict';

  function b64ToBytes(b64) {
    var bin = atob(b64), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function wavToPcm(bytes) {
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var rate = dv.getUint32(24, true), off = 12;
    while (off + 8 <= bytes.length) {
      var id = String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]);
      var size = dv.getUint32(off + 4, true);
      if (id === 'data') return { pcm: new Int16Array(bytes.slice(off + 8, off + 8 + size).buffer), rate: rate };
      off += 8 + size + (size % 2);
    }
    throw new Error('bad wav');
  }
  /* -> { kind: 'pcm', pcm: Int16Array, rate } or { kind: 'mp3', bytes } */
  async function decode(response, format) {
    if (format === 'mp3') return { kind: 'mp3', bytes: new Uint8Array(await response.arrayBuffer()) };
    if (format === 'gemini-json') {
      var data = await response.json();
      var part = (((data.candidates || [])[0] || {}).content || {}).parts;
      part = part && part.find(function (p) { return p.inlineData; });
      if (!part) throw { code: 'provider_failed' };
      var raw = b64ToBytes(part.inlineData.data), mime = part.inlineData.mimeType || '';
      if (/wav/i.test(mime)) return Object.assign({ kind: 'pcm' }, wavToPcm(raw));
      var rate = Number((/rate=(\d+)/.exec(mime) || [])[1] || 24000);
      return { kind: 'pcm', pcm: new Int16Array(raw.buffer.slice(0, raw.length - (raw.length % 2))), rate: rate };
    }
    return Object.assign({ kind: 'pcm' }, wavToPcm(new Uint8Array(await response.arrayBuffer())));
  }

  function join(parts, gapMs) {
    if (parts[0].kind === 'mp3') {
      var total = parts.reduce(function (s, p) { return s + p.bytes.length; }, 0), out = new Uint8Array(total), o = 0;
      parts.forEach(function (p) { out.set(p.bytes, o); o += p.bytes.length; });
      return { kind: 'mp3', bytes: out };
    }
    var rate = parts[0].rate, gap = Math.round(rate * (gapMs || 250) / 1000);
    var len = parts.reduce(function (s, p) { return s + p.pcm.length; }, 0) + gap * (parts.length - 1);
    var pcm = new Int16Array(len), off = 0, peak = 1;
    parts.forEach(function (p, i) { pcm.set(p.pcm, off); off += p.pcm.length + (i < parts.length - 1 ? gap : 0); });
    for (var i = 0; i < pcm.length; i++) { var a = Math.abs(pcm[i]); if (a > peak) peak = a; }
    var gain = Math.min(4, 29204 / peak);                         // normalise peak to about -1 dBFS
    if (gain > 1.02 || gain < 0.98) for (var j = 0; j < pcm.length; j++) pcm[j] = Math.max(-32768, Math.min(32767, Math.round(pcm[j] * gain)));
    return { kind: 'pcm', pcm: pcm, rate: rate };
  }

  function toWav(a) {
    var n = a.pcm.length * 2, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    function w(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, a.rate, true); v.setUint32(28, a.rate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n, true);
    new Int16Array(buf, 44).set(a.pcm);
    return new Blob([buf], { type: 'audio/wav' });
  }

  var lamePromise = null;
  function loadLame() {
    if (root.lamejs) return Promise.resolve(root.lamejs);
    if (!lamePromise) lamePromise = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js';
      s.crossOrigin = 'anonymous';
      s.onload = function () { root.lamejs ? res(root.lamejs) : rej(new Error('lamejs')); };
      s.onerror = function () { lamePromise = null; rej(new Error('lamejs')); };
      document.head.appendChild(s);
    });
    return lamePromise;
  }
  async function toMp3(a) {
    if (a.kind === 'mp3') return new Blob([a.bytes], { type: 'audio/mpeg' });
    var lame = await loadLame();
    var enc = new lame.Mp3Encoder(1, a.rate, 128), out = [], block = 1152;
    for (var i = 0; i < a.pcm.length; i += block) {
      var b = enc.encodeBuffer(a.pcm.subarray(i, i + block));
      if (b.length) out.push(new Uint8Array(b));
    }
    var end = enc.flush();
    if (end.length) out.push(new Uint8Array(end));
    return new Blob(out, { type: 'audio/mpeg' });
  }
  function toBlob(a) { return a.kind === 'mp3' ? new Blob([a.bytes], { type: 'audio/mpeg' }) : toWav(a); }

  /* Split text at paragraph, sentence, then comma; never inside a word. */
  function chunk(text, max) {
    var out = [];
    text.split(/\n{2,}/).forEach(function (para) {
      para = para.trim();
      if (!para) return;
      if (para.length <= max) { out.push(para); return; }
      var sentences = para.match(/[^.!?…]+[.!?…]+["»”)]*\s*|[^.!?…]+$/g) || [para], cur = '';
      sentences.forEach(function (s) {
        if ((cur + s).length <= max) { cur += s; return; }
        if (cur) out.push(cur.trim());
        cur = '';
        while (s.length > max) {
          var cut = s.lastIndexOf(', ', max); if (cut < max * 0.4) cut = s.lastIndexOf(' ', max); if (cut < 1) cut = max;
          out.push(s.slice(0, cut + 1).trim()); s = s.slice(cut + 1);
        }
        cur = s;
      });
      if (cur.trim()) out.push(cur.trim());
    });
    return out;
  }

  root.CL_AUDIO = { decode: decode, join: join, toWav: toWav, toMp3: toMp3, toBlob: toBlob, chunk: chunk };
})(self);
