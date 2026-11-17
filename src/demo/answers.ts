// Sample answers for the static demo (GitHub Pages). They are written by hand to show
// what each panel returns. No AI runs and no skill instructions are included here:
// the paid skills' SKILL.md texts are private and never part of this repository.
import type { Locale } from '@/i18n/config';

type Pair = { az: string; en: string };

const NOTE: Pair = {
  az: '> **Demo cavab.** Bu, əvvəlcədən yazılmış nümunədir: AI qoşulmayıb və sorğun heç yerə göndərilmir. Tam versiya öz açarları ilə işə salınır (README-yə bax).',
  en: '> **Demo answer.** This is a pre-written sample: no AI is connected and your request is not sent anywhere. The full version runs with your own keys (see the README).',
};

const quote = (lang: 'az' | 'en', first: string) =>
  first ? (lang === 'az' ? `\n\nSorğun: “${first}”` : `\n\nYour request: “${first}”`) : '';

const ANSWERS: Record<string, Pair> = {
  'saxta-teklif-yoxlama': {
    az: `## Hökm: çox güman fırıldaqdır

**Şübhəli yerlər, mətndən sitatla**
1. “24 saat ərzində 150 $ … ödəyin”: rəsmi təqaüd proqramları yer saxlamaq üçün pul istəmir. Təcili vaxt qoymaq təzyiq üsuludur.
2. “Ödəniş Western Union ilə”: geri qaytarıla bilməyən köçürmə. Universitetlər rüsumu öz rəsmi portalında alır.
3. “scholarship.canada.office@gmail.com”: pulsuz poçt ünvanı. Kanada hökuməti və universitetlər öz domenlərindən yazır (məsələn, *.gc.ca, *.ca).
4. “İlkin seçildiniz”, amma sən müraciət etməmisən: real seçim yalnız müraciətdən sonra olur.

**Rəsmi səhifə ilə müqayisə**
- Kanada təqaüdləri: educanada.ca (rəsmi siyahı, ödənişsiz müraciət).
- Fırıldaq barədə xəbərdarlıq: canada.ca → “Protect yourself from fraud”.

**Nə etməli**
- Pul ödəmə, sənəd göndərmə, cavab yazma.
- Mesajın ekran şəklini saxla.
- Pul ödəmisənsə: bankına dərhal zəng et, köçürməni dayandırmağı xahiş et; polisə (102) müraciət et.`,
    en: `## Verdict: very likely a scam

**Red flags, quoted from the text**
1. “pay 150 $ within 24 hours”: real scholarships never charge to hold your place. A short deadline is a pressure tactic.
2. “Payment via Western Union”: an untraceable transfer. Universities take fees through their own portal.
3. “scholarship.canada.office@gmail.com”: a free webmail address. The Government of Canada and universities write from their own domains (*.gc.ca, *.ca).
4. “You have been pre-selected”, but you never applied: selection only follows an application.

**Compared with the official source**
- Canadian scholarships: educanada.ca (official list, applying is free).
- Fraud warning: canada.ca → “Protect yourself from fraud”.

**What to do**
- Don't pay, don't send documents, don't reply.
- Keep a screenshot of the message.
- If you already paid: call your bank now and ask to stop the transfer, then report it to the police.`,
  },
  'xaricde-tehsil': {
    az: `## Sənin üçün plan: Magistr, Kompüter elmləri

**Proqramlar (ehtimala görə)**
| Qrup | Proqram | Təqaüd | Son tarix |
|---|---|---|---|
| Çətin | ELTE (Budapeşt), Computer Science MSc | Stipendium Hungaricum | 15 yanvar |
| Uyğun | Debrecen Universiteti, Computer Science MSc | Stipendium Hungaricum | 15 yanvar |
| Uyğun | Türkiyə Bursları, Bilgisayar Mühendisliği | tam təqaüd + yataqxana | 20 fevral |
| Ehtiyat | Pécs Universiteti, Computer Science MSc | Stipendium Hungaricum | 15 yanvar |

**Addım-addım**
1. Noyabr: diplom və transkriptin tərcüməsi, iki tövsiyə məktubu istə.
2. Dekabr: motivasiya məktubunu yaz (hər proqrama ayrıca).
3. Yanvar: Stipendium Hungaricum portalında müraciət.
4. Fevral: Türkiyə Bursları müraciəti.

**Dil sertifikatı:** bəzi Macarıstan universitetləri IELTS əvəzinə öz onlayn testini qəbul edir. Hər proqramın səhifəsində yoxla.

**Məktuba qeyd:** ekologiyadan proqramlaşdırmaya keçidini bir konkret layihə ilə izah et.`,
    en: `## Your plan: Master's, Computer Science

**Programmes (by chance of admission)**
| Group | Programme | Funding | Deadline |
|---|---|---|---|
| Reach | ELTE (Budapest), Computer Science MSc | Stipendium Hungaricum | 15 January |
| Match | University of Debrecen, Computer Science MSc | Stipendium Hungaricum | 15 January |
| Match | Türkiye Scholarships, Computer Engineering | full scholarship + dorm | 20 February |
| Safety | University of Pécs, Computer Science MSc | Stipendium Hungaricum | 15 January |

**Step by step**
1. November: translate your diploma and transcript, ask for two reference letters.
2. December: write a motivation letter for each programme.
3. January: apply on the Stipendium Hungaricum portal.
4. February: apply to Türkiye Scholarships.

**Language certificate:** some Hungarian universities accept their own online test instead of IELTS. Check each programme page.

**Letter note:** explain your move from ecology to programming with one concrete project.`,
  },
  'viza-ve-yol': {
    az: `## Macarıstan, təhsil vizası (D tipli): sənəd siyahısı

**Sənədlər**
- [ ] Pasport (ən azı 6 ay etibarlı) və 2 şəkil
- [ ] Universitetin qəbul məktubu
- [ ] Təqaüd məktubu (Stipendium Hungaricum) və ya maliyyə sübutu
- [ ] Tibbi sığorta (təqaüdçülər üçün çox vaxt daxildir)
- [ ] Yaşayış yeri sübutu (yataqxana təsdiqi)
- [ ] Doldurulmuş ərizə forması (Enter Hungary portalı)

**Plan**
1. Qəbul məktubu gələn kimi: konsulluqdan randevu al.
2. Randevudan 1 həftə əvvəl: bütün sənədlərin surətini çıxar.
3. Gəlişdən sonra 30 gün ərzində: yaşayış icazəsi üçün immiqrasiya idarəsinə müraciət et.

Rəsmi mənbə: enterhungary.gov.hu`,
    en: `## Hungary, student visa (type D): document checklist

**Documents**
- [ ] Passport (valid 6+ months) and 2 photos
- [ ] University admission letter
- [ ] Scholarship letter (Stipendium Hungaricum) or proof of funds
- [ ] Health insurance (often included for scholarship holders)
- [ ] Proof of accommodation (dorm confirmation)
- [ ] Completed application form (Enter Hungary portal)

**Plan**
1. As soon as the admission letter arrives: book a consulate appointment.
2. One week before: copy every document.
3. Within 30 days of arrival: apply for the residence permit at the immigration office.

Official source: enterhungary.gov.hu`,
  },
  'is-muracieti': {
    az: `## Uyğunluq: 7 / 10

**Güclü tərəflər**
- Tələb olunan React və TypeScript CV-də var, layihə ilə.
- Komanda ilə iş təcrübəsi göstərilib.

**Çatışmayanlar**
- Vakansiya “REST API ilə iş” istəyir: CV-yə Express layihəni əlavə et.
- Nəticələri rəqəmlə yaz (məsələn, “səhifə yüklənməsini 40% sürətləndirdim”).

**Müraciət məktubu (qısa)**
> Hörmətli işə qəbul komandası,
> Frontend Developer vakansiyanız üçün müraciət edirəm. Son bir ildə React və TypeScript ilə üç layihə qurmuşam...

**Yoxla:** elanda maaş və şirkət ünvanı var. Fırıldaq əlaməti tapılmadı.`,
    en: `## Match: 7 / 10

**Strengths**
- React and TypeScript from the vacancy are in your CV, with a project.
- Team experience is shown.

**Gaps**
- The vacancy asks for “REST API experience”: add your Express project to the CV.
- Put numbers on results (e.g. “cut page load time by 40%”).

**Cover letter (short)**
> Dear hiring team,
> I am applying for your Frontend Developer role. Over the past year I built three projects with React and TypeScript...

**Check:** the ad lists a salary and a company address. No scam signs found.`,
  },
  'sosial-post': {
    az: `## Instagram postu: 3 variant

**1. Problem ilə başla**
Xaricdə pulsuz oxumaq istəyirsən, amma haradan başlayacağını bilmirsən? Bu 3 addım sənə vaxt qazandırar 👇

**2. Rəqəmlə başla**
150 $ “sənəd haqqı” istəyən təqaüd yoxdur. Real təqaüdləri necə tanıyacağını göstərirəm.

**3. Sual ilə başla**
Sənə də “ilkin seçildiniz” məktubu gəlib?

**Hashtaglar:** #xaricdətəhsil #təqaüd #stipendiumhungaricum
**Ən yaxşı vaxt:** iş günləri 19:00–21:00`,
    en: `## Instagram post: 3 versions

**1. Lead with the problem**
Want to study abroad for free but don't know where to start? These 3 steps save you weeks 👇

**2. Lead with a number**
No real scholarship asks for a $150 “document fee”. Here's how to spot the real ones.

**3. Lead with a question**
Did you also get a “you've been pre-selected” email?

**Hashtags:** #studyabroad #scholarship #stipendiumhungaricum
**Best time:** weekdays 7–9 pm`,
  },
};

const GENERIC: Pair = {
  az: '## Nümunə nəticə\n\nTam versiyada skill sorğunu oxuyur və burada addım-addım cavab yazır: qısa xülasə, konkret addımlar və mənbə linkləri.',
  en: '## Sample result\n\nIn the full version the skill reads your request and writes a step-by-step answer here: a short summary, concrete steps and source links.',
};

/** Demo answer for one panel. Languages other than Azerbaijani get the English sample. */
export function demoAnswer(slug: string, lang: Locale, first: string): { text: string; sources: { title: string; url: string }[]; engine: string } {
  const l: 'az' | 'en' = lang === 'az' ? 'az' : 'en';
  const body = (ANSWERS[slug] || GENERIC)[l];
  return { engine: 'demo', sources: [], text: `${NOTE[l]}${quote(l, first.slice(0, 140))}\n\n${body}` };
}
