/*
 * Codelady Səs: Azerbaijani text normaliser ("Mətni hazırla").
 * Runs fully in the browser (and in Node for tests). No network.
 * Usage: CL_NORMALIZE.prepare(text, options) -> { text, changes, uncertain, emphasis }
 */
(function (root) {
  'use strict';
  var D = root.CL_DATA;
  if (!D) throw new Error('data.js must be loaded before normalize.js');

  var L = 'A-Za-zƏəÇçŞşĞğIıİiÖöÜüÄä';            // Latin letters incl. Azerbaijani
  var BACK = 'aıou', FRONT = 'eəiöü', VOWELS = 'aıoueəiöü';

  /* ---------------- helpers ---------------- */
  function azLower(s) { return s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase(); }
  function azUpperFirst(s) {
    if (!s) return s;
    var c = s.charAt(0), up = c === 'i' ? 'İ' : c === 'ı' ? 'I' : c.toUpperCase();
    return up + s.slice(1);
  }
  function fold(s) {
    return azLower(s).replace(/ə|ä/g, 'e').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u');
  }
  function lastVowel(w) {
    for (var i = w.length - 1; i >= 0; i--) if (VOWELS.indexOf(w[i]) >= 0) return w[i];
    return 'e';
  }
  function endsWithVowel(w) { return VOWELS.indexOf(w.charAt(w.length - 1)) >= 0; }
  function harmA(v) { return BACK.indexOf(v) >= 0 ? 'a' : 'ə'; }
  function harmI(v) { return (v === 'a' || v === 'ı') ? 'ı' : (v === 'o' || v === 'u') ? 'u' : (v === 'ö' || v === 'ü') ? 'ü' : 'i'; }
  function harmQ(v) { return BACK.indexOf(v) >= 0 ? 'q' : 'k'; }

  /* Render a suffix template (A, I, Q archiphonemes) after a stem. */
  function renderTemplate(stem, tpl) {
    var v = lastVowel(azLower(stem)), out = '';
    for (var i = 0; i < tpl.length; i++) {
      var c = tpl[i], r;
      if (c === 'A') r = harmA(v); else if (c === 'I') r = harmI(v); else if (c === 'Q') r = harmQ(v); else r = c;
      if (VOWELS.indexOf(r) >= 0) v = r;
      out += r;
    }
    return out;
  }

  /* Turn a suffix as the user wrote it ("da", "dən", "ci") into a template. */
  function writtenToTemplate(s) {
    return azLower(s).replace(/[aəeä]/g, 'A').replace(/[ıiuü]/g, 'I');
  }

  /* Attach a written suffix to a number word with harmony and buffer consonants. */
  function attachSuffix(word, written) {
    if (!written) return word;
    var tpl = writtenToTemplate(written);
    var w = azLower(word);
    var vEnd = endsWithVowel(w);
    var first = tpl.charAt(0), second = tpl.charAt(1);
    if (vEnd && (first === 'A' || first === 'I')) {
      tpl = (first === 'A' ? 'y' : 'n') + tpl;
    } else if (!vEnd && /[yns]/.test(first) && (second === 'A' || second === 'I')) {
      tpl = tpl.slice(1);
    }
    return word + renderTemplate(word, tpl);
  }

  /* ---------------- numbers ---------------- */
  var N = D.numbers;
  function under1000(n) {
    var parts = [], h = Math.floor(n / 100), r = n % 100;
    if (h) parts.push(h > 1 ? N.ones[h] + ' ' + N.hundred : N.hundred);
    if (r >= 10) parts.push(N.tens[Math.floor(r / 10)]);
    if (r % 10) parts.push(N.ones[r % 10]);
    return parts.join(' ');
  }
  function intToWords(digits) {
    digits = String(digits).replace(/^0+(?=\d)/, '');
    if (digits.length > 15) return digits.split('').map(function (d) { return N.ones[+d]; }).join(' ');
    var n = Number(digits);
    if (n === 0) return N.ones[0];
    var scales = [[1e12, N.trillion], [1e9, N.billion], [1e6, N.million], [1e3, N.thousand]];
    var parts = [];
    for (var i = 0; i < scales.length; i++) {
      var s = scales[i][0], c = Math.floor(n / s);
      if (c) {
        if (s === 1e3 && c === 1) parts.push(N.thousand);
        else parts.push(under1000(c) + ' ' + scales[i][1]);
        n = n % s;
      }
    }
    if (n) parts.push(under1000(n));
    return parts.join(' ');
  }
  function ordinal(words) {
    var w = azLower(words);
    return words + (endsWithVowel(w) ? 'nc' + harmI(lastVowel(w)) : renderTemplate(words, 'IncI'));
  }
  /* "12" + "5" -> decimal reading */
  function decimalWords(intPart, frac) {
    var res = intToWords(intPart) + ' ' + N.point + ' ';
    var den = N.fractionDenominators[frac.length - 1];
    if (!den) return intToWords(intPart) + ' ' + N.point + ' ' + frac.split('').map(function (d) { return N.ones[+d]; }).join(' ');
    return res + den + ' ' + intToWords(frac);
  }
  /* Parse a numeric string with Azerbaijani separators into words. */
  function numberWords(raw) {
    var s = raw.replace(/ /g, ' ').trim();
    var m;
    if ((m = /^(\d{1,3}(?:[ .]\d{3})+)(?:,(\d+))?$/.exec(s))) {
      var intDigits = m[1].replace(/[ .]/g, '');
      return m[2] ? decimalWords(intDigits, m[2]) : intToWords(intDigits);
    }
    if ((m = /^(\d+)[.,](\d+)$/.exec(s))) return decimalWords(m[1], m[2]);
    if (/^\d+$/.test(s)) return intToWords(s);
    return null;
  }
  /* Digit groups as in phone numbers: leading zeros are spoken. */
  function groupWords(g) {
    var lead = /^0+/.exec(g), out = [];
    var z = lead ? lead[0].length : 0;
    if (z === g.length) z = g.length;
    for (var i = 0; i < z; i++) out.push(N.ones[0]);
    if (z < g.length) out.push(intToWords(g.slice(z)));
    return out.join(' ');
  }

  var NUM = '\\d{1,3}(?:[ .\\u00A0]\\d{3})+(?:,\\d+)?|\\d+(?:[.,]\\d+)?';
  var SUF = '(?:-([' + L + ']+))?';
  var NOTL = '(?![' + L + '])';
  var NOTPRE = '(?<![\\d' + L + '])';

  /* ---------------- diacritic restoration ---------------- */
  var LEX = null;
  function buildLex() {
    LEX = { byFold: Object.create(null), exact: Object.create(null) };
    D.lexicon.forEach(function (w) {
      var lw = azLower(w), f = fold(w);
      LEX.exact[lw] = w;
      var cur = LEX.byFold[f];
      if (!cur) LEX.byFold[f] = [w];
      else if (cur.indexOf(w) < 0 && cur.map(azLower).indexOf(lw) < 0) cur.push(w);
    });
    Object.keys(D.turkishAliases).forEach(function (k) { LEX.exact[azLower(D.turkishAliases[k])] = D.turkishAliases[k]; });
  }
  function lexUnique(f) { var c = LEX.byFold[f]; return c && c.length === 1 ? c[0] : null; }

  function restoreWord(word, fromCyrillic) {
    if (!LEX) buildLex();
    var lw = azLower(word);
    if (LEX.exact[lw]) return null;                                  // already a known correct form
    if (word.length <= 5 && word === word.toUpperCase() && /[A-Z]/.test(word) && word.length > 1) return null; // acronym
    if (D.turkishAliases[lw] && D.turkishAliases[lw] !== lw) return { to: D.turkishAliases[lw], conf: 0.9, kind: 'turkish' };

    var f = fold(lw);
    var variants = [[f, 0.95]];
    if (/sh|ch|gh/.test(f)) variants.push([f.replace(/sh/g, 's').replace(/ch/g, 'c').replace(/gh/g, 'g'), 0.9]);
    if (/^k[aiou]/.test(f)) variants.push(['q' + f.slice(1), 0.85]);
    if (fromCyrillic && /q/.test(f)) {
      variants.push([f.replace(/q/g, 'g'), 0.85]);
      variants.push([f.replace(/q/, 'g'), 0.85]);
    }
    var i, v, hit;
    for (i = 0; i < variants.length; i++) {
      v = variants[i][0];
      var c = LEX.byFold[v];
      if (c && c.length > 1) return { to: null, conf: 0.4, kind: 'ambiguous', options: c };
      if ((hit = lexUnique(v))) return hit === lw ? null : { to: hit, conf: variants[i][1], kind: 'letters' };
    }
    // stem + suffix
    for (i = 0; i < variants.length; i++) {
      v = variants[i][0];
      for (var cut = v.length - 1; cut >= 2; cut--) {
        var stemF = v.slice(0, cut), sufF = v.slice(cut);
        var stems = [];
        var s1 = lexUnique(stemF); if (s1) stems.push([s1, s1]);
        if (/g$/.test(stemF)) { var s2 = lexUnique(stemF.slice(0, -1) + 'q'); if (s2 && /q$/.test(s2)) stems.push([s2, s2.slice(0, -1) + 'ğ']); }
        if (/y$/.test(stemF)) { var s3 = lexUnique(stemF.slice(0, -1) + 'k'); if (s3 && /k$/.test(s3)) stems.push([s3, s3.slice(0, -1) + 'y']); }
        var found = [];
        stems.forEach(function (st) {
          D.suffixTemplates.forEach(function (t) {
            var suf = renderTemplate(st[0], t);
            if (fold(suf) === sufF) {
              var cand = st[1] + suf;
              if (found.indexOf(cand) < 0) found.push(cand);
            }
          });
        });
        if (found.length === 1) {
          if (azLower(found[0]) === lw) return null;
          return { to: found[0], conf: (cut >= 3 ? 0.85 : 0.7) * (variants[i][1] / 0.95), kind: 'letters' };
        }
        if (found.length > 1) return { to: null, conf: 0.4, kind: 'ambiguous', options: found };
      }
    }
    return null;
  }
  function matchCase(orig, repl) {
    if (orig.length > 1 && orig === orig.toUpperCase() && orig !== orig.toLowerCase()) return repl.toUpperCase();
    var first = orig.charAt(0);
    if (first !== first.toLowerCase()) return azUpperFirst(repl);
    return repl;
  }

  /* ---------------- Cyrillic ---------------- */
  var CYR_RE = /[Ѐ-ӿ]/;
  function translitWord(w) {
    var out = '';
    for (var i = 0; i < w.length; i++) {
      var ch = w[i], lo = ch.toLowerCase(), t = D.cyrillic[lo];
      if (t === undefined) { out += ch; continue; }
      if (ch !== lo && t) t = (i === 0 || w.length === 1 || w[i + 1] === (w[i + 1] || '').toLowerCase()) ? azUpperFirst(t) : t.toUpperCase();
      out += t;
    }
    return out;
  }

  /* ---------------- main ---------------- */
  function prepare(input, opts) {
    opts = opts || {};
    var threshold = typeof opts.threshold === 'number' ? opts.threshold : D.restoreThreshold;
    var changes = [], uncertain = [], emphasis = [];
    var text = String(input || '');
    function log(kind, from, to, conf) { if (from !== to) changes.push({ kind: kind, from: from, to: to, confidence: conf == null ? 1 : conf }); }
    function rep(re, kind, fn) {
      text = text.replace(re, function () {
        var out = fn.apply(null, arguments);
        if (out == null) return arguments[0];
        log(kind, arguments[0], out);
        return out;
      });
    }
    function emph(w) { w = w.trim(); if (w && emphasis.indexOf(w) < 0) emphasis.push(w); }

    // 1. Cyrillic -> Latin, then letter restoration
    var wordRe = new RegExp('[' + L + '\\u0400-\\u04FFʼ\']+', 'g');
    text = text.replace(wordRe, function (w) {
      var fromCyr = CYR_RE.test(w), cur = w;
      if (fromCyr) { cur = translitWord(w).replace(/[ʼ']/g, ''); log('cyrillic', w, cur, 1); }
      if (/^['ʼ]|['ʼ]$/.test(cur)) return cur;
      var r = restoreWord(cur, fromCyr);
      if (!r) return cur;
      if (!r.to) { if (!fromCyr) uncertain.push({ word: cur, options: r.options || [] }); return cur; }
      var out = matchCase(cur, r.to);
      if (r.conf >= threshold) { log(r.kind === 'turkish' ? 'turkish' : 'letters', cur, out, r.conf); return out; }
      uncertain.push({ word: cur, options: [out], confidence: r.conf });
      return cur;
    });

    // 2. Emoji and pictographs
    rep(/(?:[\u{1F1E6}-\u{1F1FF}]{2}|\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])(?:️|‍|[\u{1F3FB}-\u{1F3FF}]|\p{Extended_Pictographic})*\s?/gu, 'emoji', function () { return ''; });
    text = text.replace(/[️⃣‍]/g, '');

    // 3. URLs and e-mails
    rep(/\bhttps?:\/\/(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)[^\s]*/gi, 'url', function (m, host) { return host.split('.').join(' nöqtə '); });
    rep(/\b([a-z0-9._-]+)@([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/gi, 'url', function (m, u, host) { return u.replace(/[._]/g, ' ') + ' et ' + host.split('.').join(' nöqtə '); });
    rep(/\b(?:www\.)?([a-z0-9-]{2,})\.(az|com|net|org|ru|tr|io|ai|me|edu)\b(?!\.\w)/gi, 'url', function (m, a, b) { return a + ' nöqtə ' + b; });

    // 4. Abbreviations
    D.abbreviations.forEach(function (p) {
      var esc = p[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp(NOTPRE.replace('\\d', '') + esc + (/[.]$/.test(p[0]) ? '' : NOTL), 'g');
      rep(re, 'abbr', function () { return p[1]; });
    });
    text = text.replace(/nömrə +(?=\d)/g, 'nömrə ').replace(/nömrə(?=\d)/g, 'nömrə ');
    Object.keys(D.spelledAcronyms).forEach(function (a) {
      rep(new RegExp('(?<![' + L + '])' + a + '(?![' + L + '])', 'g'), 'abbr', function () { return D.spelledAcronyms[a]; });
    });
    if (opts.brands) {
      Object.keys(D.brandRespell).forEach(function (b) {
        rep(new RegExp('(?<![' + L + '])' + b.replace('-', '\\-') + '(?![' + L + '])', 'gi'), 'brand', function () { return D.brandRespell[b]; });
      });
    }

    // 5. Phone numbers
    function phone(m, cc, groups) {
      var parts = [];
      if (cc) parts.push(N.plus + ' ' + intToWords(cc.replace('+', '')));
      groups.forEach(function (g) { parts.push(groupWords(g)); });
      return parts.join(', ');
    }
    rep(/\+994[\s-]?\(?(\d{2})\)?[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{2})(?!\d)/g, 'phone', function (m, a, b, c, d) { return phone(m, '+994', [a, b, c, d]); });
    rep(/(?<![\d+])\(?(0\d{2})\)?[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{2})(?!\d)/g, 'phone', function (m, a, b, c, d) { return phone(m, null, [a, b, c, d]); });
    rep(/(?<![\d+.,])(\d{2})[\s-](\d{3})[\s-](\d{2})[\s-](\d{2})(?![\d])/g, 'phone', function (m, a, b, c, d) { return phone(m, null, [a, b, c, d]); });
    rep(/\*(\d{3,4})(?!\d)/g, 'phone', function (m, a) { return 'ulduz ' + intToWords(a); });

    // 6. Dates
    function dateWords(d, mo, y) {
      d = +d; mo = +mo;
      if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
      return intToWords(String(d)) + ' ' + D.months[mo - 1] + (y ? ' ' + intToWords(y) : '');
    }
    rep(/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g, 'date', function (m, y, mo, d) { return dateWords(d, mo, y); });
    rep(/(?<![\d.])(\d{1,2})[./](\d{1,2})[./](\d{4})(?![\d])/g, 'date', function (m, d, mo, y) { return dateWords(d, mo, y); });

    // 7. Times and time ranges
    function timeWords(h, mi) {
      h = +h;
      if (h > 24 || +mi > 59) return null;
      var w = intToWords(String(h));
      if (mi !== '00') w += ' ' + (mi.charAt(0) === '0' ? N.ones[0] + ' ' + N.ones[+mi.charAt(1)] : intToWords(mi));
      return w;
    }
    rep(new RegExp('(saat\\s+)?(?<!\\d)(\\d{1,2}):(\\d{2})\\s*[-–—]\\s*(\\d{1,2}):(\\d{2})(?!\\d)', 'gi'), 'time', function (m, saat, h1, m1, h2, m2) {
      var a = timeWords(h1, m1), b = timeWords(h2, m2);
      if (!a || !b) return null;
      return (saat || 'saat ') + attachSuffix(a, 'dan') + ' ' + attachSuffix(b, 'a') + ' qədər';
    });
    rep(new RegExp('(saat\\s+)?(?<![\\d.])(\\d{1,2}):(\\d{2})(?![\\d:])' + SUF, 'gi'), 'time', function (m, saat, h, mi, suf) {
      var a = timeWords(h, mi);
      if (!a) return null;
      return (saat || 'saat ') + attachSuffix(a, suf);
    });

    // 8. Money
    var CUR_SYM = '[$€£₽₺₼]';
    var CUR_CODE = '(?:AZN|USD|EUR|GBP|RUB|TRY)';
    function money(numStr, cur, suf) {
      var c = D.currencies[cur];
      var s = numStr.replace(/ /g, ' ');
      var m = /^(\d{1,3}(?:[ .,]\d{3})*|\d+)(?:[.,](\d{1,2}))$/.exec(s);
      var words;
      if (m && c.sub && !/^\d{1,3}[.,]\d{3}$/.test(s)) {
        var sub = m[2].length === 1 ? m[2] + '0' : m[2];
        words = intToWords(m[1].replace(/[ .,]/g, '')) + ' ' + c.word;
        if (+sub) words += ' ' + intToWords(sub) + ' ' + c.sub;
        emph(words);
        return suf ? attachSuffix(words, suf) : words;
      }
      if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, ' ');   // $1,299 US-style thousands
      var nw = numberWords(s);
      if (!nw) return null;
      words = nw + ' ' + c.word;
      emph(words);
      return suf ? attachSuffix(words, suf) : words;
    }
    rep(new RegExp('(' + CUR_SYM + ')\\s?(' + NUM + ')' + SUF, 'g'), 'money', function (m, cur, n, suf) { return money(n, cur, suf); });
    rep(new RegExp('(' + NUM + ')\\s?(' + CUR_SYM + '|' + CUR_CODE + NOTL + ')' + SUF, 'g'), 'money', function (m, n, cur, suf) { return money(n, cur, suf); });
    rep(new RegExp('(?<![' + L + '])AZN(?![' + L + '])', 'g'), 'abbr', function () { return 'manat'; });

    // 9. Percent
    rep(new RegExp('(' + NUM + ')\\s?%' + SUF, 'g'), 'percent', function (m, n, suf) { var w = numberWords(n); if (!w) return null; w += ' faiz'; emph(w); return attachSuffix(w, suf); });
    rep(new RegExp('%\\s?(' + NUM + ')' + SUF, 'g'), 'percent', function (m, n, suf) { var w = numberWords(n); if (!w) return null; w += ' faiz'; emph(w); return attachSuffix(w, suf); });

    // 10. Temperature and units
    rep(new RegExp('([-−]?)(' + NUM + ')\\s?°\\s?[CС]?' + NOTL, 'g'), 'unit', function (m, sign, n) { var w = numberWords(n); return w ? (sign ? N.minus + ' ' : '') + w + ' dərəcə' : null; });
    var unitKeys = Object.keys(D.units).sort(function (a, b) { return b.length - a.length; }).map(function (u) { return u.replace(/[.²]/g, function (c) { return c === '.' ? '\\.' : c; }); });
    rep(new RegExp('(' + NUM + ')\\s?(' + unitKeys.join('|') + ')(?![' + L + '\\d²])\\.?' + SUF, 'g'), 'unit', function (m, n, u, suf) {
      var w = numberWords(n), uw = D.units[u] || D.units[u.replace(/\\/g, '')];
      if (!w || !uw) return null;
      return attachSuffix(w + ' ' + uw, suf);
    });

    // 11. Number ranges 10-15
    rep(new RegExp(NOTPRE + '(' + NUM + ')\\s?[-–—]\\s?(' + NUM + ')(?![\\d:.,])' + SUF, 'g'), 'number', function (m, a, b, suf) {
      var wa = numberWords(a), wb = numberWords(b);
      if (!wa || !wb) return null;
      return wa + ' – ' + attachSuffix(wb, suf);
    });

    // 12. Numbers with ordinal / case suffixes, negatives, plain numbers
    rep(new RegExp('(?<![\\d' + L + '])([-−](?=\\d))?(' + NUM + ')' + SUF + '(?![\\d])', 'g'), 'number', function (m, sign, n, suf) {
      var w = numberWords(n);
      if (!w) return null;
      if (sign) w = N.minus + ' ' + w;
      if (suf) {
        var om = /^(?:[ıiuü]?n)?c[ıiuü](.*)$/i.exec(suf);
        if (om) { w = ordinal(w); return om[1] ? attachSuffix(w, om[1]) : w; }
        return attachSuffix(w, suf);
      }
      return w;
    });

    // 13. Symbols
    rep(/\s&\s/g, 'symbol', function () { return ' və '; });
    rep(/#([\p{L}\d_]+)/gu, 'symbol', function (m, tag) { return 'heşteq ' + tag; });
    rep(/(\p{L})\s\+\s(\p{L})/gu, 'symbol', function (m, a, b) { return a + ' artı ' + b; });
    rep(/^[ \t]*[•▪●◦\-–*]\s+/gm, 'symbol', function () { return ''; });
    rep(/[*_~`]{1,3}([^*_~`\n]+)[*_~`]{1,3}/g, 'symbol', function (m, inner) { return inner; });

    // 14. Pause hints: punctuation that gives natural pauses
    rep(/\.{3,}/g, 'pause', function () { return '…'; });
    rep(/([!?])\1+/g, 'pause', function (m, c) { return c; });
    rep(/!\?|\?!/g, 'pause', function () { return '?'; });
    D.commaBefore.forEach(function (c) {
      rep(new RegExp('([' + L + '\\d])\\s+(' + c + ')(?![' + L + '])', 'gi'), 'pause', function (m, a, w) { return a + ', ' + w; });
    });
    var origLines = String(input || '').split('\n');
    var curLines = text.split('\n');
    text = curLines.map(function (line, idx) {
      var t = line.replace(/[ \t]+$/, '');
      var src = curLines.length === origLines.length ? origLines[idx] : t;
      var words = src.trim().split(/\s+/).filter(function (w) { return /\p{L}/u.test(w); });
      if (words.length >= 4 && !/[.!?…:;,]$/.test(t)) { log('pause', t, t + '.'); return t + '.'; }
      return t;
    }).join('\n');

    // 15. Whitespace tidy
    text = text.replace(/[ \t]{2,}/g, ' ').replace(/ +([,.!?…;:])/g, '$1').replace(/^[ \t]+/gm, '').trim();

    // 16. Stress hints (sent to the engine as "emphasise", text unchanged)
    var lowered = ' ' + azLower(text) + ' ';
    D.emphasisWords.forEach(function (w) {
      if (new RegExp('(?<![' + L + '])' + w + '(?![' + L + '])').test(lowered)) emph(w);
    });
    (text.match(new RegExp('(?<![' + L + '])[A-ZƏÇŞĞIİÖÜ]{4,}(?![' + L + '])', 'g')) || []).forEach(function (w) {
      if (D.wordAcronyms.indexOf(w) < 0) emph(azLower(w));
    });

    return { text: text, changes: changes, uncertain: uncertain, emphasis: emphasis.slice(0, 6) };
  }

  /* ---------------- word diff (for the review sheet) ---------------- */
  function tokens(s) { return s.match(/\S+\s*/g) || []; }
  function diff(a, b) {
    var A = tokens(a), B = tokens(b), n = A.length, m = B.length;
    var at = A.map(function (t) { return t.trim(); }), bt = B.map(function (t) { return t.trim(); });
    var dp = [], i, j;
    for (i = 0; i <= n; i++) { dp.push(new Uint16Array(m + 1)); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--)
      dp[i][j] = at[i] === bt[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    var out = [], cur = null;
    function push(type, tok) {
      if (type === 'eq') { cur = null; out.push({ type: 'eq', text: tok }); return; }
      if (!cur) { cur = { type: 'change', del: [], ins: [] }; out.push(cur); }
      cur[type].push(tok);
    }
    i = 0; j = 0;
    while (i < n && j < m) {
      if (at[i] === bt[j]) { push('eq', B[j]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { push('del', A[i]); i++; }
      else { push('ins', B[j]); j++; }
    }
    while (i < n) push('del', A[i++]);
    while (j < m) push('ins', B[j++]);
    return out;
  }

  var API = {
    prepare: prepare, diff: diff, intToWords: intToWords, ordinal: ordinal,
    attachSuffix: attachSuffix, fold: fold, numberWords: numberWords
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.CL_NORMALIZE = API;
})(typeof self !== 'undefined' ? self : this);
