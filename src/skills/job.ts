import type { Skill } from './types';

export const job: Skill = {
  slug: 'is-muracieti',
  name: 'İş müraciəti',
  tagline: 'Vakansiyanı və CV-ni ver, müraciət məktubu və uyğunluq qeydləri al.',
  ask: 'İşə müraciət məktubu lazımdır',
  example: { vacancy: 'Junior Frontend Developer. Tələblər: React, JavaScript, HTML/CSS, Git. İngilis dili B1+. Komanda ilə işləmək bacarığı. Bakı, ofis.', cv: 'Leyla Məmmədova. Junior veb proqramçı, 1 il. React, Node.js, Git. 3 layihə: onlayn mağaza, blog, tapşırıq tətbiqi. Bakalavr: informatika, 2024. Dillər: Azərbaycan, Türk, İngilis B1.', lang: 'Azərbaycan' },
  about:
    'Vakansiya mətnini və CV-ni yapışdır. Tələblərlə təcrübəni yan-yana qoyur, çatışmayan yerləri göstərir və həmin vakansiya üçün qısa müraciət məktubu yazır.',
  gives: [
    'Tələb – təcrübə uyğunluq cədvəli',
    'CV üçün konkret düzəlişlər',
    'Müraciət məktubu',
    'Müsahibəyə ehtimal olunan suallar',
  ],
  group: 'İş',
  kind: 'assistant',
  access: 'pro',
  tone: '#6D28D9',
  mark: 'İş',
  fields: [
    { name: 'where', label: 'Harada iş axtarırsan?', type: 'select', options: ['Azərbaycanda', 'Xaricdə', 'Hər ikisi'] },
    { name: 'vacancy', label: 'Vakansiya mətni', type: 'textarea', rows: 7, required: true, placeholder: 'Elanın tam mətnini bura yapışdır' },
    { name: 'cv', label: 'CV-n (mətn)', type: 'textarea', rows: 7, required: true, placeholder: 'CV-ni mətn kimi yapışdır. Şəxsiyyət vəsiqəsi nömrəsi və ünvan yazma.' },
    { name: 'lang', label: 'Məktubun dili', optional: true, type: 'select', options: ['Azərbaycan', 'İngilis', 'Rus', 'Türk'] },
  ],
  buildRequest: (v) =>
    [
      `Bu vakansiyaya müraciət edirəm. İş axtardığım yer: ${v.where || 'Azərbaycanda'}. Xaricdirsə, viza sponsorluğunu rəsmi reyestrlə yoxla.`,
      `Vakansiya:\n"""${v.vacancy}"""`,
      `CV:\n"""${v.cv}"""`,
      `Müraciət məktubunu ${v.lang || 'Azərbaycan'} dilində yaz.`,
    ].join('\n\n'),
  submitLabel: 'Hazırla',
  // Paid on Agensi: replace with the exact listing link once it is live.
  agensiUrl: 'https://www.agensi.io',
  footnote: 'Məktubu göndərməzdən əvvəl oxu və öz sözlərinlə düzəlt.',
};
