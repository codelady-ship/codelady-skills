import type { Skill } from './types';

export const studyAbroad: Skill = {
  slug: 'xaricde-tehsil',
  name: 'Xaricdə təhsil planı',
  tagline: 'Hansı proqrama, nə vaxt və nə ilə müraciət edəcəyini bir yerdə gör.',
  ask: 'Xaricdə pulsuz oxumaq istəyirəm',
  example: { degree: 'Magistr', field: 'Kompüter elmləri', background: 'Bakalavr: ekologiya, ortalama 85. 1 il veb proqramçı kimi işləmişəm.', budget: 'Yalnız tam təqaüd', language: 'İngilis B1, sertifikatım yoxdur', countries: 'Macarıstan, Türkiyə' },
  about:
    'Profilini yaz: ixtisas, büdcə, dil sertifikatı, ölkələr. Sənə uyğun proqramları ehtimala görə üç qrupa bölür, son tarixləri və lazım olan sənədləri sıralayır. Motivasiya məktubunu da yoxlayır.',
  gives: [
    'Proqramlar: çətin, uyğun, ehtiyat',
    'Son tarixlərlə addım-addım plan',
    'Sənəd siyahısı və xərc yoxlaması',
    'Məktuba qeydlər',
  ],
  group: 'Xaricdə təhsil',
  kind: 'assistant',
  access: 'pro',
  tone: '#1F7A7A',
  mark: 'Tə',
  fields: [
    { name: 'degree', label: 'Hansı pillə?', type: 'select', options: ['Magistr', 'Bakalavr', 'Doktorantura', 'Dil kursu / qısa proqram'] },
    { name: 'field', label: 'İxtisas', type: 'text', required: true, placeholder: 'Məsələn: Kompüter elmləri' },
    { name: 'background', label: 'Təhsilin və təcrüben', optional: true, type: 'textarea', rows: 4, placeholder: 'Bitirdiyin universitet, ortalama bal, iş təcrübəsi…' },
    { name: 'budget', label: 'Büdcə', type: 'select', options: ['Yalnız tam təqaüd', 'İldə 3 000 €-dək', 'İldə 10 000 €-dək', 'Fərq etmir'] },
    { name: 'language', label: 'Dil sertifikatı', optional: true, type: 'text', placeholder: 'Məsələn: IELTS yoxdur, B1 ingilis' },
    { name: 'citizenship', label: 'Vətəndaşlığın', optional: true, type: 'text', placeholder: 'Azərbaycan' },
    { name: 'countries', label: 'Harada oxumaq istəyirsən?', optional: true, type: 'text', placeholder: 'Məsələn: Azərbaycan, Türkiyə, Almaniya və ya “fərq etmir”' },
  ],
  buildRequest: (v) =>
    [
      `${v.degree || 'Magistr'} üçün xaricdə təhsil planı istəyirəm.`,
      `İxtisas: ${v.field}`,
      v.background && `Təhsil və təcrübə: ${v.background}`,
      v.budget && `Büdcə: ${v.budget}`,
      v.language && `Dil: ${v.language}`,
      v.countries && `Ölkələr: ${v.countries}`,
      `Vətəndaşlığım: ${v.citizenship || 'Azərbaycan'}.`,
    ].filter(Boolean).join('\n'),
  submitLabel: 'Plan hazırla',
  // Paid on Agensi: replace with the exact listing link once it is live.
  agensiUrl: 'https://www.agensi.io',
  footnote: 'Son tarixlər və şərtlər dəyişə bilər. Müraciətdən əvvəl universitetin öz səhifəsini yoxla.',
};
