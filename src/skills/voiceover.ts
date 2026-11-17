import type { Skill } from './types';

export const voiceover: Skill = {
  slug: 'seslendirme',
  name: 'Səsləndirmə',
  tagline: 'Azərbaycanca mətni yaz, səsi dinlə, faylı yüklə.',
  ask: 'Mətni səsə çevirmək istəyirəm',
  about:
    'Mətni yapışdır. Rəqəmləri, tarixləri və qısaltmaları sözlə yazır, ə, ş, ç hərflərini bərpa edir. Sonra qadın və ya kişi səsi və üslub seçirsən, səsi dinləyib yükləyirsən.',
  gives: [
    'Səsə hazır mətn, dəyişikliklərin siyahısı ilə',
    '10 üslub, qadın və kişi səsi',
    'Dinlə və WAV kimi yüklə',
    'Reels üçün söz limiti',
  ],
  group: 'Səs',
  kind: 'voice',
  access: 'free',
  tone: '#E2674A',
  mark: 'Sə',
  install: { repo: 'codelady-ship/azerbaijani-voiceover-studio', ref: 'main', folder: 'azerbaijani-voiceover-studio' },
  sourceUrl: 'https://github.com/codelady-ship/azerbaijani-voiceover-studio',
  footnote: 'Səsi sosial şəbəkədə paylaşanda süni səs olduğunu qeyd et. Bəzi platformalar bunu tələb edir.',
};
