import type { Skill } from './types';

// Instructions: "social" from coreyhaines31/marketingskills (MIT).
export const socialPost: Skill = {
  slug: 'sosial-post',
  name: 'Sosial şəbəkə postu',
  tagline: 'Mövzunu yaz, Instagram, LinkedIn və ya TikTok üçün hazır mətn al.',
  ask: 'Instagram üçün post yaz',
  example: { platform: 'Instagram', format: 'Karusel', topic: 'Tələbələri saxta təqaüd mesajlarından necə qorumaq olar', audience: '18–25 yaş, xaricdə oxumaq istəyən tələbələr', lang: 'Azərbaycan' },
  about:
    'Nə haqqında danışmaq istədiyini və kimə yazdığını qeyd et. Platformaya uyğun post, karusel planı və ya qısa video ssenarisi hazırlayır.',
  gives: [
    'Platformaya uyğun post mətni',
    'Karusel slaydları və ya video ssenarisi',
    'Başlıq üçün 3 variant',
    'Paylaşma vaxtı təklifi',
  ],
  group: 'Marketinq',
  kind: 'assistant',
  access: 'free',
  tone: '#0E7490',
  mark: 'Po',
  fields: [
    { name: 'platform', label: 'Platforma', type: 'select', options: ['Instagram', 'LinkedIn', 'TikTok', 'Facebook', 'X'] },
    { name: 'format', label: 'Format', type: 'select', options: ['Adi post', 'Karusel', 'Qısa video ssenarisi'] },
    { name: 'topic', label: 'Mövzu', type: 'textarea', rows: 4, required: true, placeholder: 'Məsələn: tələbələri saxta təqaüd mesajlarından necə qorumaq' },
    { name: 'audience', label: 'Kimə yazırsan?', optional: true, type: 'text', placeholder: 'Məsələn: 18–25 yaş, xaricdə oxumaq istəyən tələbələr' },
    { name: 'lang', label: 'Postun dili', optional: true, type: 'select', options: ['Azərbaycan', 'İngilis', 'Rus'] },
  ],
  buildRequest: (v) =>
    [
      `${v.platform || 'Instagram'} üçün ${(v.format || 'adi post').toLowerCase()} hazırla.`,
      `Mövzu: ${v.topic}`,
      v.audience && `Auditoriya: ${v.audience}`,
      `Postun dili: ${v.lang || 'Azərbaycan'}.`,
    ].filter(Boolean).join('\n'),
  submitLabel: 'Yaz',
  install: { repo: 'coreyhaines31/marketingskills', ref: 'main', dir: 'skills/social', folder: 'social' },
  sourceUrl: 'https://github.com/coreyhaines31/marketingskills',
  footnote: 'Paylaşmazdan əvvəl öz səsinə uyğunlaşdır.',
};
