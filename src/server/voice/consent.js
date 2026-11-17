// Consent challenge phrases and abuse pre-checks for own-voice generation.

const ONES = ['sıfır', 'bir', 'iki', 'üç', 'dörd', 'beş', 'altı', 'yeddi', 'səkkiz', 'doqquz'];
const TENS = ['', 'on', 'iyirmi', 'otuz', 'qırx', 'əlli', 'altmış', 'yetmiş', 'səksən', 'doxsan'];

function under1000(n) {
  const p = [];
  const h = Math.floor(n / 100), r = n % 100;
  if (h) p.push(h > 1 ? `${ONES[h]} yüz` : 'yüz');
  if (r >= 10) p.push(TENS[Math.floor(r / 10)]);
  if (r % 10) p.push(ONES[r % 10]);
  return p.join(' ');
}
export function fourDigitWords(n) {
  const th = Math.floor(n / 1000), rest = n % 1000;
  return [th === 1 ? 'min' : th ? `${under1000(th)} min` : '', rest ? under1000(rest) : ''].filter(Boolean).join(' ');
}

const SUBJECTS = ['Bu gün', 'Sabah', 'Axşam', 'Səhər tezdən', 'Bu həftə'];
const NOUNS = ['mavi limon', 'kiçik dəniz', 'qırmızı qələm', 'yaşıl pəncərə', 'isti çay', 'sakit küçə', 'şən buludlar', 'köhnə saat'];
const VERBS = ['dəfə gülümsəyir', 'dəfə parlayır', 'dəfə oxuyur', 'addım atır', 'dəfə fırlanır'];
const pick = (a) => a[crypto.getRandomValues(new Uint32Array(1))[0] % a.length];

export function makeChallenge() {
  const n = 1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000);
  return `${pick(SUBJECTS)} ${pick(NOUNS)} ${fourDigitWords(n)} ${pick(VERBS)}.`;
}

// The statement shown on screen and logged (hash) with every consent.
export const CONSENT_TEXT = {
  az: 'Mən təsdiq edirəm ki: (1) bu səs mənim öz səsimdir; (2) 18 yaşım tamamdır; (3) səsimin (biometrik məlumat) sintetik səs yaratmaq üçün emal olunmasına və xidmət təminatçısına (xaricdəki serverlərə) ötürülməsinə razıyam; (4) bu səslə başqasını təqlid etməyəcək, fırıldaqçılıq etməyəcəyəm. Razılığımı istənilən vaxt "Səsimi sil" düyməsi ilə geri götürə bilərəm.',
  en: 'I confirm that: (1) this is my own voice; (2) I am 18 or older; (3) I consent to my voice (biometric data) being processed to create a synthetic voice and transferred to the service provider (servers abroad); (4) I will not impersonate others or commit fraud with it. I can withdraw consent at any time with "Delete my voice".'
};

// Simple scam-pattern pre-check for own-voice text (flag, block, log).
const BLOCK = [/kart\s+məlumat/i, /\bcvv\b/i, /\bpin\s*kod/i, /təcili\s+pul/i, /bank\s+əməkdaşı/i, /şifrəni\s+(de|göndər|yaz)/i, /sms\s+kod/i, /hesabınız\s+bloklan/i];
export function abuseCheck(text) {
  return BLOCK.find((re) => re.test(text)) ? 'blocked_pattern' : null;
}
