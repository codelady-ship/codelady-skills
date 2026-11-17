import type { Skill } from './types';

export const travel: Skill = {
  slug: 'viza-ve-yol',
  name: 'Viza və yol',
  tagline: 'Viza sənədləri, müsahibə və ilk həftə üçün hazırlıq.',
  ask: 'Viza üçün nə lazımdır?',
  example: { destination: 'Macarıstan', purpose: 'Təhsil', start: 'sentyabr 2027', need: 'Sənəd siyahısı və plan', details: 'Qəbul məktubum və tam təqaüdüm var.' },
  about:
    'Hara və nə üçün getdiyini yaz. Viza növünü, sənəd siyahısını və müraciət ardıcıllığını çıxarır. İstəsən viza müsahibəsini sual-cavab şəklində məşq edirsən.',
  gives: [
    'Viza növü və rəsmi müraciət yolu',
    'Sənəd siyahısı, tarixlərlə',
    'Müsahibə məşqi',
    'Gəlişdən sonrakı ilk addımlar',
  ],
  group: 'Xaricdə təhsil',
  kind: 'assistant',
  access: 'pro',
  tone: '#14213D',
  mark: 'Vi',
  fields: [
    { name: 'destination', label: 'Hansı ölkəyə?', type: 'text', required: true, placeholder: 'Məsələn: Macarıstan' },
    { name: 'purpose', label: 'Məqsəd', type: 'select', options: ['Təhsil', 'Könüllülük (ESC)', 'Təcrübə proqramı', 'Qısa səfər'] },
    { name: 'start', label: 'Nə vaxt başlayır?', optional: true, type: 'text', placeholder: 'Məsələn: sentyabr 2027' },
    { name: 'need', label: 'Nə lazımdır?', type: 'select', options: ['Sənəd siyahısı və plan', 'Viza müsahibəsi məşqi', 'Gəlişdən sonra ilk həftə'] },
    { name: 'citizenship', label: 'Vətəndaşlığın', optional: true, type: 'text', placeholder: 'Azərbaycan' },
    { name: 'details', label: 'Əlavə məlumat', optional: true, type: 'textarea', rows: 3, placeholder: 'Qəbul məktubu var, təqaüd var, əvvəl viza imtinası olub…' },
  ],
  buildRequest: (v) =>
    [
      `Ölkə: ${v.destination}. Məqsəd: ${v.purpose || 'Təhsil'}.`,
      v.start && `Başlama: ${v.start}.`,
      `İstəyim: ${v.need || 'Sənəd siyahısı və plan'}.`,
      v.details && `Əlavə: ${v.details}`,
      `Vətəndaşlığım: ${v.citizenship || 'Azərbaycan'}.`,
    ].filter(Boolean).join('\n'),
  submitLabel: 'Başla',
  // Paid on Agensi: replace with the exact listing link once it is live.
  agensiUrl: 'https://www.agensi.io',
  footnote: 'Viza qaydaları dəyişir. Sənədləri təqdim etməzdən əvvəl səfirliyin rəsmi səhifəsini yoxla.',
};
