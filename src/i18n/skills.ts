import type { Skill } from '@/skills/types';
import type { Locale } from './config';
import { EXTRA } from './locales';

// Per-language skill texts. Azerbaijani lives in the skill files themselves.
// Select options keep their Azerbaijani value (buildRequest reads it); optionLabels only change what is shown.
export type FieldText = { label?: string; placeholder?: string; hint?: string; optionLabels?: string[] };
export type SkillText = {
  name: string; tagline: string; ask: string; about: string; gives: string[];
  submitLabel?: string; footnote?: string;
  example?: Record<string, string>;
  fields?: Record<string, FieldText>;
};

const en: Record<string, SkillText> = {
  seslendirme: {
    name: 'Voiceover',
    tagline: 'Type Azerbaijani text, listen to the voice, download the file.',
    ask: 'Turn my text into speech',
    about: 'Paste your text. Numbers, dates and abbreviations are written out as words, and missing ə, ş, ç letters are restored. Then pick a female or male voice and a style, listen and download.',
    gives: ['Speech-ready text with a list of changes', '10 styles, female and male voices', 'Listen and download as WAV', 'Word limit for Reels'],
    footnote: 'When you share the audio on social media, say that it is an AI voice. Some platforms require it.',
  },
  'saxta-teklif-yoxlama': {
    name: 'Scam offer check',
    tagline: 'Got a scholarship, visa or job offer? Check it before you pay.',
    ask: 'Is this message a scam or real?',
    about: 'Paste the message, ad or link. It points out each suspicious part, compares it with what the official programme or visa centre says, and tells you what to do next.',
    gives: ['Short verdict: scam, suspicious or looks real', 'Suspicious parts, quoted from the text', 'Comparison with the official page, with a link', 'First steps if you already paid'],
    submitLabel: 'Check',
    footnote: 'This is not legal advice. Open the official website yourself before you decide.',
    example: {
      message: 'Congratulations! You have been pre-selected for a full scholarship in Canada. To keep your place, pay a $150 “file opening” fee within 24 hours via Western Union. Contact: scholarship.canada.office@gmail.com',
      country: 'Azerbaijan',
    },
    fields: {
      message: { label: 'Message, ad or letter', placeholder: 'For example: “Congratulations! You have been pre-selected for a full scholarship in Canada. Pay $150 within 24 hours to keep your place…”' },
      link: { label: 'Link (if any)' },
      paid: { label: 'Have you sent money or documents?', optionLabels: ['No', 'Yes, I paid money', 'Yes, I sent my passport or documents'] },
      country: { label: 'Where do you live?', placeholder: 'Azerbaijan' },
    },
  },
  'xaricde-tehsil': {
    name: 'Study abroad plan',
    tagline: 'See which programme to apply to, when, and with what, in one place.',
    ask: 'I want to study abroad for free',
    about: 'Describe your profile: field, budget, language certificate, countries. It sorts matching programmes into three groups by your chances and lists deadlines and required documents. It also reviews your motivation letter.',
    gives: ['Programmes: reach, match, safety', 'Step-by-step plan with deadlines', 'Document list and cost check', 'Notes on your letter'],
    submitLabel: 'Make a plan',
    footnote: 'Deadlines and requirements can change. Check the university’s own page before you apply.',
    example: { field: 'Computer science', background: 'Bachelor’s in ecology, GPA 85/100. One year as a web developer.', language: 'English B1, no certificate', countries: 'Hungary, Türkiye' },
    fields: {
      degree: { label: 'Which level?', optionLabels: ['Master’s', 'Bachelor’s', 'PhD', 'Language course / short programme'] },
      field: { label: 'Field of study', placeholder: 'For example: Computer science' },
      background: { label: 'Your education and experience', placeholder: 'University, GPA, work experience…' },
      budget: { label: 'Budget', optionLabels: ['Full scholarship only', 'Up to €3,000 a year', 'Up to €10,000 a year', 'Doesn’t matter'] },
      language: { label: 'Language certificate', placeholder: 'For example: no IELTS, English B1' },
      citizenship: { label: 'Your citizenship', placeholder: 'Azerbaijan' },
      countries: { label: 'Where do you want to study?', placeholder: 'For example: Türkiye, Germany, or “any”' },
    },
  },
  'viza-ve-yol': {
    name: 'Visa and travel',
    tagline: 'Prepare visa documents, the interview and your first week.',
    ask: 'What do I need for a visa?',
    about: 'Say where you are going and why. It finds the visa type, the document list and the order of steps. You can also practise the visa interview as questions and answers.',
    gives: ['Visa type and the official way to apply', 'Document list with dates', 'Interview practice', 'First steps after you arrive'],
    submitLabel: 'Start',
    footnote: 'Visa rules change. Check the embassy’s official page before you submit documents.',
    example: { destination: 'Hungary', start: 'September 2027', details: 'I have an admission letter and a full scholarship.' },
    fields: {
      destination: { label: 'Which country?', placeholder: 'For example: Hungary' },
      purpose: { label: 'Purpose', optionLabels: ['Study', 'Volunteering (ESC)', 'Internship programme', 'Short trip'] },
      start: { label: 'When does it start?', placeholder: 'For example: September 2027' },
      need: { label: 'What do you need?', optionLabels: ['Document list and plan', 'Visa interview practice', 'First week after arrival'] },
      citizenship: { label: 'Your citizenship', placeholder: 'Azerbaijan' },
      details: { label: 'More details', placeholder: 'I have an admission letter, a scholarship, a past visa refusal…' },
    },
  },
  'is-muracieti': {
    name: 'Job application',
    tagline: 'Give the vacancy and your CV, get a cover letter and fit notes.',
    ask: 'I need a cover letter for a job',
    about: 'Paste the vacancy and your CV. It puts the requirements next to your experience, shows the gaps and writes a short cover letter for that vacancy.',
    gives: ['Requirement-by-experience fit table', 'Concrete fixes for your CV', 'Cover letter', 'Likely interview questions'],
    submitLabel: 'Prepare',
    footnote: 'Read the letter and put it in your own words before you send it.',
    example: {
      vacancy: 'Junior Frontend Developer. Requirements: React, JavaScript, HTML/CSS, Git. English B1+. Team player. Baku, on-site.',
      cv: 'Leyla Mammadova. Junior web developer, 1 year. React, Node.js, Git. 3 projects: online shop, blog, task app. Bachelor’s in computer science, 2024. Languages: Azerbaijani, Turkish, English B1.',
    },
    fields: {
      where: { label: 'Where are you looking for work?', optionLabels: ['In Azerbaijan', 'Abroad', 'Both'] },
      vacancy: { label: 'Vacancy text', placeholder: 'Paste the full job ad here' },
      cv: { label: 'Your CV (as text)', placeholder: 'Paste your CV as text. Leave out ID numbers and your home address.' },
      lang: { label: 'Letter language', optionLabels: ['Azerbaijani', 'English', 'Russian', 'Turkish'] },
    },
  },
  'sosial-post': {
    name: 'Social media post',
    tagline: 'Write the topic, get ready text for Instagram, LinkedIn or TikTok.',
    ask: 'Write an Instagram post',
    about: 'Say what you want to talk about and who you are writing for. It writes a post, a carousel plan or a short video script that fits the platform.',
    gives: ['Post text that fits the platform', 'Carousel slides or a video script', '3 headline options', 'A suggested time to post'],
    submitLabel: 'Write',
    footnote: 'Adjust it to your own voice before posting.',
    example: { topic: 'How students can protect themselves from fake scholarship messages', audience: 'Students aged 18–25 who want to study abroad' },
    fields: {
      platform: { label: 'Platform' },
      format: { label: 'Format', optionLabels: ['Single post', 'Carousel', 'Short video script'] },
      topic: { label: 'Topic', placeholder: 'For example: how students can avoid fake scholarship messages' },
      audience: { label: 'Who are you writing for?', placeholder: 'For example: students aged 18–25 who want to study abroad' },
      lang: { label: 'Post language', optionLabels: ['Azerbaijani', 'English', 'Russian'] },
    },
  },
};

const ru: Record<string, SkillText> = {
  seslendirme: {
    name: 'Озвучка',
    tagline: 'Напишите текст на азербайджанском, прослушайте и скачайте файл.',
    ask: 'Хочу превратить текст в голос',
    about: 'Вставьте текст. Числа, даты и сокращения будут записаны словами, недостающие буквы ə, ş, ç восстановятся. Затем выберите женский или мужской голос и стиль, прослушайте и скачайте.',
    gives: ['Текст, готовый к озвучке, со списком правок', '10 стилей, женский и мужской голос', 'Прослушать и скачать в WAV', 'Лимит слов для Reels'],
    footnote: 'Публикуя аудио в соцсетях, укажите, что голос создан ИИ. Некоторые платформы этого требуют.',
  },
  'saxta-teklif-yoxlama': {
    name: 'Проверка на мошенничество',
    tagline: 'Пришло предложение о стипендии, визе или работе? Проверьте, прежде чем платить.',
    ask: 'Это сообщение — мошенничество или правда?',
    about: 'Вставьте сообщение, объявление или ссылку. Инструмент покажет каждое подозрительное место, сравнит с тем, что пишет официальная программа или визовый центр, и подскажет, что делать.',
    gives: ['Короткий вывод: мошенничество, подозрительно или похоже на правду', 'Подозрительные места с цитатами', 'Сравнение с официальной страницей и ссылка', 'Первые шаги, если вы уже заплатили'],
    submitLabel: 'Проверить',
    footnote: 'Это не юридическая консультация. Прежде чем решать, откройте официальный сайт сами.',
    example: {
      message: 'Поздравляем! Вы прошли предварительный отбор на полную стипендию в Канаде. Чтобы сохранить место, оплатите сбор 150 $ за «открытие дела» в течение 24 часов через Western Union. Контакт: scholarship.canada.office@gmail.com',
      country: 'Азербайджан',
    },
    fields: {
      message: { label: 'Сообщение, объявление или письмо', placeholder: 'Например: «Поздравляем! Вы прошли отбор на полную стипендию в Канаде. Оплатите 150 $ в течение 24 часов…»' },
      link: { label: 'Ссылка (если есть)' },
      paid: { label: 'Вы уже отправили деньги или документы?', optionLabels: ['Нет', 'Да, я заплатил(а)', 'Да, я отправил(а) паспорт или документы'] },
      country: { label: 'Где вы живёте?', placeholder: 'Азербайджан' },
    },
  },
  'xaricde-tehsil': {
    name: 'План учёбы за рубежом',
    tagline: 'Куда, когда и с какими документами подавать — всё в одном месте.',
    ask: 'Хочу бесплатно учиться за границей',
    about: 'Опишите себя: специальность, бюджет, языковой сертификат, страны. Инструмент разделит подходящие программы на три группы по шансам, составит список сроков и документов и проверит мотивационное письмо.',
    gives: ['Программы: сложные, подходящие, запасные', 'Пошаговый план со сроками', 'Список документов и проверка расходов', 'Замечания к письму'],
    submitLabel: 'Составить план',
    footnote: 'Сроки и условия могут меняться. Перед подачей проверьте страницу самого университета.',
    example: { field: 'Компьютерные науки', background: 'Бакалавр: экология, средний балл 85. Год работы веб-разработчиком.', language: 'Английский B1, сертификата нет', countries: 'Венгрия, Турция' },
    fields: {
      degree: { label: 'Какой уровень?', optionLabels: ['Магистратура', 'Бакалавриат', 'Докторантура', 'Языковой курс / короткая программа'] },
      field: { label: 'Специальность', placeholder: 'Например: компьютерные науки' },
      background: { label: 'Образование и опыт', placeholder: 'Университет, средний балл, опыт работы…' },
      budget: { label: 'Бюджет', optionLabels: ['Только полная стипендия', 'До 3 000 € в год', 'До 10 000 € в год', 'Неважно'] },
      language: { label: 'Языковой сертификат', placeholder: 'Например: IELTS нет, английский B1' },
      citizenship: { label: 'Ваше гражданство', placeholder: 'Азербайджан' },
      countries: { label: 'Где хотите учиться?', placeholder: 'Например: Турция, Германия или «неважно»' },
    },
  },
  'viza-ve-yol': {
    name: 'Виза и дорога',
    tagline: 'Подготовка документов на визу, собеседования и первой недели.',
    ask: 'Что нужно для визы?',
    about: 'Укажите, куда и зачем едете. Инструмент определит тип визы, список документов и порядок подачи. Можно также потренировать визовое собеседование в формате вопрос-ответ.',
    gives: ['Тип визы и официальный порядок подачи', 'Список документов со сроками', 'Тренировка собеседования', 'Первые шаги после приезда'],
    submitLabel: 'Начать',
    footnote: 'Визовые правила меняются. Перед подачей документов проверьте официальную страницу посольства.',
    example: { destination: 'Венгрия', start: 'сентябрь 2027', details: 'У меня есть письмо о зачислении и полная стипендия.' },
    fields: {
      destination: { label: 'В какую страну?', placeholder: 'Например: Венгрия' },
      purpose: { label: 'Цель', optionLabels: ['Учёба', 'Волонтёрство (ESC)', 'Стажировка', 'Короткая поездка'] },
      start: { label: 'Когда начало?', placeholder: 'Например: сентябрь 2027' },
      need: { label: 'Что нужно?', optionLabels: ['Список документов и план', 'Тренировка визового собеседования', 'Первая неделя после приезда'] },
      citizenship: { label: 'Ваше гражданство', placeholder: 'Азербайджан' },
      details: { label: 'Дополнительно', placeholder: 'Есть письмо о зачислении, стипендия, был отказ в визе…' },
    },
  },
  'is-muracieti': {
    name: 'Отклик на вакансию',
    tagline: 'Дайте вакансию и резюме — получите сопроводительное письмо и разбор соответствия.',
    ask: 'Нужно сопроводительное письмо',
    about: 'Вставьте текст вакансии и резюме. Инструмент сопоставит требования с вашим опытом, покажет пробелы и напишет короткое письмо под эту вакансию.',
    gives: ['Таблица: требование — опыт', 'Конкретные правки для резюме', 'Сопроводительное письмо', 'Вероятные вопросы на собеседовании'],
    submitLabel: 'Подготовить',
    footnote: 'Перед отправкой прочитайте письмо и перепишите своими словами.',
    example: {
      vacancy: 'Junior Frontend Developer. Требования: React, JavaScript, HTML/CSS, Git. Английский B1+. Умение работать в команде. Баку, офис.',
      cv: 'Лейла Мамедова. Junior веб-разработчик, 1 год. React, Node.js, Git. 3 проекта: интернет-магазин, блог, приложение задач. Бакалавр информатики, 2024. Языки: азербайджанский, турецкий, английский B1.',
    },
    fields: {
      where: { label: 'Где ищете работу?', optionLabels: ['В Азербайджане', 'За рубежом', 'И там, и там'] },
      vacancy: { label: 'Текст вакансии', placeholder: 'Вставьте полный текст объявления' },
      cv: { label: 'Ваше резюме (текстом)', placeholder: 'Вставьте резюме текстом. Не пишите номер удостоверения и адрес.' },
      lang: { label: 'Язык письма', optionLabels: ['Азербайджанский', 'Английский', 'Русский', 'Турецкий'] },
    },
  },
  'sosial-post': {
    name: 'Пост для соцсетей',
    tagline: 'Напишите тему — получите готовый текст для Instagram, LinkedIn или TikTok.',
    ask: 'Напиши пост для Instagram',
    about: 'Укажите, о чём хотите рассказать и для кого пишете. Инструмент подготовит пост, план карусели или сценарий короткого видео под платформу.',
    gives: ['Текст поста под платформу', 'Слайды карусели или сценарий видео', '3 варианта заголовка', 'Когда лучше опубликовать'],
    submitLabel: 'Написать',
    footnote: 'Перед публикацией подстройте текст под свой стиль.',
    example: { topic: 'Как студентам защититься от фейковых сообщений о стипендиях', audience: 'Студенты 18–25 лет, которые хотят учиться за рубежом' },
    fields: {
      platform: { label: 'Платформа' },
      format: { label: 'Формат', optionLabels: ['Обычный пост', 'Карусель', 'Сценарий короткого видео'] },
      topic: { label: 'Тема', placeholder: 'Например: как не попасться на фейковые стипендии' },
      audience: { label: 'Для кого пишете?', placeholder: 'Например: студенты 18–25 лет, которые хотят учиться за рубежом' },
      lang: { label: 'Язык поста', optionLabels: ['Азербайджанский', 'Английский', 'Русский'] },
    },
  },
};

const tr: Record<string, SkillText> = {
  seslendirme: {
    name: 'Seslendirme',
    tagline: 'Azerbaycanca metni yaz, sesi dinle, dosyayı indir.',
    ask: 'Metni sese çevirmek istiyorum',
    about: 'Metni yapıştır. Sayılar, tarihler ve kısaltmalar yazıyla yazılır, eksik ə, ş, ç harfleri düzeltilir. Sonra kadın ya da erkek sesi ve bir stil seçer, dinler ve indirirsin.',
    gives: ['Seslendirmeye hazır metin ve değişiklik listesi', '10 stil, kadın ve erkek sesi', 'Dinle ve WAV olarak indir', 'Reels için kelime sınırı'],
    footnote: 'Sesi sosyal medyada paylaşırken yapay zekâ sesi olduğunu belirt. Bazı platformlar bunu ister.',
  },
  'saxta-teklif-yoxlama': {
    name: 'Sahte teklif kontrolü',
    tagline: 'Burs, vize ya da iş teklifi mi geldi? Ödeme yapmadan önce kontrol et.',
    ask: 'Gelen mesaj sahte mi, gerçek mi?',
    about: 'Mesajı, ilanı ya da linki buraya yapıştır. Şüpheli yerleri tek tek gösterir, resmî programın ya da vize merkezinin söyledikleriyle karşılaştırır ve ne yapman gerektiğini yazar.',
    gives: ['Kısa hüküm: dolandırıcılık, şüpheli ya da gerçek görünüyor', 'Şüpheli yerler, metinden alıntıyla', 'Resmî sayfayla karşılaştırma ve link', 'Ödeme yaptıysan ilk adımlar'],
    submitLabel: 'Kontrol et',
    footnote: 'Bu hukuki tavsiye değildir. Karar vermeden önce resmî siteyi kendin de aç.',
    example: {
      message: 'Tebrikler! Kanada’da tam burs için ön seçimi geçtiniz. Yerinizi korumak için 24 saat içinde Western Union ile 150 $ “dosya açılış” ücreti ödeyin. İletişim: scholarship.canada.office@gmail.com',
      country: 'Azerbaycan',
    },
    fields: {
      message: { label: 'Mesaj, ilan ya da mektup', placeholder: 'Örneğin: “Tebrikler! Kanada’da tam burs için ön seçimi geçtiniz. Yerinizi korumak için 24 saat içinde 150 $ ödeyin…”' },
      link: { label: 'Link (varsa)' },
      paid: { label: 'Para ya da belge gönderdin mi?', optionLabels: ['Hayır', 'Evet, para ödedim', 'Evet, pasaport ya da belge gönderdim'] },
      country: { label: 'Nerede yaşıyorsun?', placeholder: 'Azerbaycan' },
    },
  },
  'xaricde-tehsil': {
    name: 'Yurt dışında eğitim planı',
    tagline: 'Hangi programa, ne zaman ve neyle başvuracağını tek yerde gör.',
    ask: 'Yurt dışında ücretsiz okumak istiyorum',
    about: 'Profilini yaz: bölüm, bütçe, dil sertifikası, ülkeler. Sana uygun programları şansına göre üç gruba ayırır, son tarihleri ve gereken belgeleri sıralar. Niyet mektubunu da kontrol eder.',
    gives: ['Programlar: zor, uygun, yedek', 'Son tarihlerle adım adım plan', 'Belge listesi ve masraf kontrolü', 'Mektuba notlar'],
    submitLabel: 'Plan hazırla',
    footnote: 'Son tarihler ve şartlar değişebilir. Başvurudan önce üniversitenin kendi sayfasını kontrol et.',
    example: { field: 'Bilgisayar bilimleri', background: 'Lisans: ekoloji, ortalama 85. 1 yıl web geliştirici olarak çalıştım.', language: 'İngilizce B1, sertifikam yok', countries: 'Macaristan, Türkiye' },
    fields: {
      degree: { label: 'Hangi seviye?', optionLabels: ['Yüksek lisans', 'Lisans', 'Doktora', 'Dil kursu / kısa program'] },
      field: { label: 'Bölüm', placeholder: 'Örneğin: Bilgisayar bilimleri' },
      background: { label: 'Eğitimin ve deneyimin', placeholder: 'Üniversite, not ortalaması, iş deneyimi…' },
      budget: { label: 'Bütçe', optionLabels: ['Sadece tam burs', 'Yılda 3.000 €’ya kadar', 'Yılda 10.000 €’ya kadar', 'Fark etmez'] },
      language: { label: 'Dil sertifikası', placeholder: 'Örneğin: IELTS yok, İngilizce B1' },
      citizenship: { label: 'Vatandaşlığın', placeholder: 'Azerbaycan' },
      countries: { label: 'Nerede okumak istiyorsun?', placeholder: 'Örneğin: Türkiye, Almanya ya da “fark etmez”' },
    },
  },
  'viza-ve-yol': {
    name: 'Vize ve yol',
    tagline: 'Vize belgeleri, mülakat ve ilk hafta için hazırlık.',
    ask: 'Vize için ne gerekiyor?',
    about: 'Nereye ve ne için gittiğini yaz. Vize türünü, belge listesini ve başvuru sırasını çıkarır. İstersen vize mülakatını soru-cevap şeklinde çalışırsın.',
    gives: ['Vize türü ve resmî başvuru yolu', 'Tarihli belge listesi', 'Mülakat pratiği', 'Varıştan sonraki ilk adımlar'],
    submitLabel: 'Başla',
    footnote: 'Vize kuralları değişir. Belgeleri vermeden önce büyükelçiliğin resmî sayfasını kontrol et.',
    example: { destination: 'Macaristan', start: 'Eylül 2027', details: 'Kabul mektubum ve tam bursum var.' },
    fields: {
      destination: { label: 'Hangi ülkeye?', placeholder: 'Örneğin: Macaristan' },
      purpose: { label: 'Amaç', optionLabels: ['Eğitim', 'Gönüllülük (ESC)', 'Staj programı', 'Kısa seyahat'] },
      start: { label: 'Ne zaman başlıyor?', placeholder: 'Örneğin: Eylül 2027' },
      need: { label: 'Ne lazım?', optionLabels: ['Belge listesi ve plan', 'Vize mülakatı pratiği', 'Varıştan sonra ilk hafta'] },
      citizenship: { label: 'Vatandaşlığın', placeholder: 'Azerbaycan' },
      details: { label: 'Ek bilgi', placeholder: 'Kabul mektubu var, burs var, daha önce vize reddi oldu…' },
    },
  },
  'is-muracieti': {
    name: 'İş başvurusu',
    tagline: 'İlanı ve CV’ni ver, ön yazı ve uyum notları al.',
    ask: 'İş için ön yazı lazım',
    about: 'İlan metnini ve CV’ni yapıştır. Şartları deneyiminle yan yana koyar, eksikleri gösterir ve o ilan için kısa bir ön yazı yazar.',
    gives: ['Şart – deneyim uyum tablosu', 'CV için somut düzeltmeler', 'Ön yazı', 'Mülakatta çıkabilecek sorular'],
    submitLabel: 'Hazırla',
    footnote: 'Göndermeden önce yazıyı oku ve kendi kelimelerinle düzelt.',
    example: {
      vacancy: 'Junior Frontend Developer. Şartlar: React, JavaScript, HTML/CSS, Git. İngilizce B1+. Ekip çalışmasına yatkınlık. Bakü, ofis.',
      cv: 'Leyla Memmedova. Junior web geliştirici, 1 yıl. React, Node.js, Git. 3 proje: online mağaza, blog, görev uygulaması. Lisans: bilgisayar, 2024. Diller: Azerbaycanca, Türkçe, İngilizce B1.',
    },
    fields: {
      where: { label: 'Nerede iş arıyorsun?', optionLabels: ['Azerbaycan’da', 'Yurt dışında', 'İkisi de'] },
      vacancy: { label: 'İlan metni', placeholder: 'İlanın tam metnini buraya yapıştır' },
      cv: { label: 'CV’n (metin olarak)', placeholder: 'CV’ni metin olarak yapıştır. Kimlik numarası ve adres yazma.' },
      lang: { label: 'Yazının dili', optionLabels: ['Azerbaycanca', 'İngilizce', 'Rusça', 'Türkçe'] },
    },
  },
  'sosial-post': {
    name: 'Sosyal medya gönderisi',
    tagline: 'Konuyu yaz, Instagram, LinkedIn ya da TikTok için hazır metin al.',
    ask: 'Instagram için gönderi yaz',
    about: 'Ne anlatmak istediğini ve kime yazdığını belirt. Platforma uygun gönderi, karusel planı ya da kısa video senaryosu hazırlar.',
    gives: ['Platforma uygun gönderi metni', 'Karusel slaytları ya da video senaryosu', 'Başlık için 3 seçenek', 'Paylaşım saati önerisi'],
    submitLabel: 'Yaz',
    footnote: 'Paylaşmadan önce kendi üslubuna uyarla.',
    example: { topic: 'Öğrenciler sahte burs mesajlarından nasıl korunur', audience: '18–25 yaş, yurt dışında okumak isteyen öğrenciler' },
    fields: {
      platform: { label: 'Platform' },
      format: { label: 'Format', optionLabels: ['Normal gönderi', 'Karusel', 'Kısa video senaryosu'] },
      topic: { label: 'Konu', placeholder: 'Örneğin: öğrenciler sahte burs mesajlarından nasıl korunur' },
      audience: { label: 'Kime yazıyorsun?', placeholder: 'Örneğin: 18–25 yaş, yurt dışında okumak isteyen öğrenciler' },
      lang: { label: 'Gönderinin dili', optionLabels: ['Azerbaycanca', 'İngilizce', 'Rusça'] },
    },
  },
};

const TEXTS: Partial<Record<Locale, Record<string, SkillText>>> = {
  en, ru, tr,
  ...Object.fromEntries(Object.entries(EXTRA).map(([l, p]) => [l, p.skills])),
};

/** The skill with its visible texts in the given language. buildRequest and option values stay as they are. */
export function localizeSkill(skill: Skill, lang: Locale): Skill {
  // Untranslated extra languages show English rather than Azerbaijani.
  const t = TEXTS[lang]?.[skill.slug] ?? (lang === 'az' ? undefined : en[skill.slug]);
  if (!t) return skill;
  return {
    ...skill,
    name: t.name, tagline: t.tagline, ask: t.ask, about: t.about, gives: t.gives,
    submitLabel: t.submitLabel ?? skill.submitLabel,
    footnote: t.footnote ?? skill.footnote,
    example: skill.example && { ...skill.example, ...t.example },
    fields: skill.fields?.map((f) => ({ ...f, ...t.fields?.[f.name] })),
  };
}
