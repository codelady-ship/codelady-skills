import type { Skill } from './types';

export const scamChecker: Skill = {
  slug: 'saxta-teklif-yoxlama',
  name: 'Saxta təklif yoxlaması',
  tagline: 'Təqaüd, viza və ya iş təklifi gəlib? Pul ödəmədən əvvəl yoxla.',
  ask: 'Gələn mesaj saxtadır, yoxsa real?',
  example: {
    message: 'Təbriklər! Siz Kanadada tam təqaüdə ilkin seçildiniz. Yerinizi saxlamaq üçün 24 saat ərzində 150 $ "sənəd açılışı" haqqı ödəyin. Ödəniş Western Union ilə. Əlaqə: scholarship.canada.office@gmail.com',
    paid: 'Xeyr',
    country: 'Azərbaycan',
  },
  about:
    'Mesajı, elanı və ya linki bura yapışdır. Mətndəki şübhəli yerləri tək-tək göstərir, rəsmi proqramın və ya viza mərkəzinin nə dediyi ilə müqayisə edir və nə etməli olduğunu yazır.',
  gives: [
    'Qısa hökm: fırıldaq, şübhəli və ya real görünür',
    'Şübhəli yerlər, mətndən sitatla',
    'Rəsmi səhifə ilə müqayisə və link',
    'Pul ödəmisənsə, ilk addımlar',
  ],
  group: 'Xaricdə təhsil',
  kind: 'assistant',
  access: 'free',
  tone: '#C2410C',
  mark: 'Sx',
  fields: [
    {
      name: 'message', label: 'Mesaj, elan və ya məktub', type: 'textarea', rows: 7, required: true,
      placeholder: 'Məsələn: “Təbriklər! Kanadada tam təqaüdə ilkin seçildiniz. Yerinizi saxlamaq üçün 24 saat ərzində 150 $ ödəyin…”',
    },
    { name: 'link', label: 'Link (varsa)', optional: true, type: 'text', placeholder: 'https://…' },
    {
      name: 'paid', label: 'Pul və ya sənəd göndərmisən?', optional: true, type: 'select',
      options: ['Xeyr', 'Bəli, pul ödəmişəm', 'Bəli, pasport və ya sənəd göndərmişəm'],
    },
    { name: 'country', label: 'Harada yaşayırsan?', optional: true, type: 'text', placeholder: 'Azərbaycan' },
  ],
  buildRequest: (v) =>
    [
      'Bu təklif real, yoxsa fırıldaqdır?',
      `Mətn:\n"""${v.message}"""`,
      v.link && `Link: ${v.link}`,
      v.paid && v.paid !== 'Xeyr' && `Vəziyyət: ${v.paid}.`,
      `Yaşadığım ölkə: ${v.country || 'Azərbaycan'}.`,
    ].filter(Boolean).join('\n\n'),
  submitLabel: 'Yoxla',
  install: { repo: 'codelady-ship/scholarship-visa-scam-checker', ref: 'main', folder: 'scholarship-visa-scam-checker' },
  sourceUrl: 'https://github.com/codelady-ship/scholarship-visa-scam-checker',
  footnote: 'Bu hüquqi məsləhət deyil. Qərar verməzdən əvvəl rəsmi saytı özün də aç.',
};
