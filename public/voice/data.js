/*
 * Codelady Səs: swappable data file.
 * Presets and Azerbaijani rules are taken from the companion skill
 * azerbaijani-voiceover-studio (templates/voice-presets.md,
 * templates/normalisation-cheatsheet.md, templates/orthoepy-and-liveliness.md).
 * Orthoepy source: "Azərbaycan dilinin orfoepiya normaları" (Cabinet of Ministers
 * Decision No. 175, 18 June 2021). Replace this file to change presets or rules;
 * normalize.js and app.js only read the object below.
 */
(function (root) {
  'use strict';

  var DATA = {};

  /* ------------------------------------------------------------------ */
  /* 10 original style presets. None imitates a real person.            */
  /* wpm = words per minute at speed 1.0 (skill pace × 60).             */
  /* person: fictional style name shown on the chip (not a real        */
  /* person's voice). nativeGender: default voice when the preset is    */
  /* picked.                                                             */
  /* style: English style line for Gemini; {gender} is replaced by      */
  /* "female" / "male". voices: Gemini prebuilt voices per gender.       */
  /* ------------------------------------------------------------------ */
  DATA.presets = [
    {
      id: 'semimi', wpm: 112, nativeGender: 'f', person: 'Aysel',
      name: { az: 'Səmimi bələdçi', en: 'Friendly guide' },
      desc: { az: 'İsti, inamlı izah, yüngül təbəssümlə', en: 'Warm, confident explainer with a slight smile' },
      style: 'Warm, confident, friendly {gender} explainer with a slight smile. Brisk but clear pace. Short pause after commas, clear pause after each sentence. Yes/no questions rise at the end; wh-questions stress the question word. Short commands are firm and falling.',
      voices: { f: 'Sulafat', m: 'Achird' },
      web: { rate: 1.0, pitch: 1.05 },
      sample: { az: 'Təqaüdə seçildiyin barədə mesaj gəlib? Dayan. Əvvəlcə rəsmi saytı yoxla.', en: 'Got a message saying you won a scholarship? Stop. Check the official site first.' }
    },
    {
      id: 'reel', wpm: 138, nativeGender: 'f', person: 'Lalə',
      name: { az: 'Enerjili Reel', en: 'Energetic Reel' },
      desc: { az: 'Sürətli, parlaq, trend və kampaniyalar üçün', en: 'Fast and bright, for trends and sales' },
      style: 'Very energetic, upbeat young {gender} Reel host with a big smile. Fast pace, punchy short sentences, excited emphasis on numbers and offers, quick pauses.',
      voices: { f: 'Laomedeia', m: 'Puck' },
      web: { rate: 1.15, pitch: 1.15 },
      sample: { az: 'Bu həftə hər şey otuz faiz endirimlə! Tələs, cəmi üç gün qalıb!', en: 'Everything is thirty percent off this week! Hurry, only three days left!' }
    },
    {
      id: 'muellim', wpm: 96, nativeGender: 'm', person: 'Elvin',
      name: { az: 'Sakit müəllim', en: 'Calm teacher' },
      desc: { az: 'Səbirli müəllim tonu, dərs və təlimatlar', en: 'Patient teacher tone for lessons and how-tos' },
      style: 'Calm, patient, friendly {gender} teacher. Moderate pace, clear articulation, longer pause between steps, gentle stress on key terms. Questions rise gently, as if checking understanding.',
      voices: { f: 'Erinome', m: 'Sadaltager' },
      web: { rate: 0.92, pitch: 1.0 },
      sample: { az: 'Birinci addım: faylı açın. İndi isə diqqətlə baxın, düymə yuxarıdadır.', en: 'Step one: open the file. Now look closely, the button is at the top.' }
    },
    {
      id: 'lifestyle', wpm: 102, nativeGender: 'f', person: 'Nərmin',
      name: { az: 'Yumşaq lifestyle', en: 'Soft lifestyle' },
      desc: { az: 'Yumşaq, intim ton: gözəllik, kafe, səyahət', en: 'Soft and intimate: beauty, cafés, travel' },
      style: 'Soft, cosy, intimate {gender} lifestyle voice, as if speaking close to the microphone. Relaxed pace, gentle pauses, warm and dreamy. Sensory words are lightly stretched.',
      voices: { f: 'Despina', m: 'Umbriel' },
      web: { rate: 0.95, pitch: 0.98 },
      sample: { az: 'Səhər qəhvəsi, yumşaq işıq… və bir az özünə vaxt.', en: 'Morning coffee, soft light… and a little time for yourself.' }
    },
    {
      id: 'lux', wpm: 90, nativeGender: 'f', person: 'Günay',
      name: { az: 'Zərif lüks reklam', en: 'Elegant luxury ad' },
      desc: { az: 'Yavaş, incə reklam: zinət, moda, ətir', en: 'Slow, refined ads: jewellery, fashion, perfume' },
      style: 'Elegant, sophisticated luxury-ad {gender} voice. Slow, controlled pace, long pauses between short phrases, calm confidence, refined and smooth. No sharp rises. The brand name is said last and alone.',
      voices: { f: 'Gacrux', m: 'Algieba' },
      web: { rate: 0.85, pitch: 0.95 },
      sample: { az: 'Zəriflik. Sadəlik. Və sənə layiq olan parıltı.', en: 'Elegance. Simplicity. And the shine you deserve.' }
    },
    {
      id: 'nagil', wpm: 85, nativeGender: 'f', person: 'Ayla',
      name: { az: 'Nağıl səsləndirmə', en: 'Storyteller' },
      desc: { az: 'İsti, müdrik nağılçı: hekayə və tarix', en: 'Warm, wise storyteller: tales and history' },
      style: 'Warm, wise {gender} storyteller in their late forties. Slow pace, rich, gentle voice, long pauses before important moments, gentle emotion, like telling a tale to children. Questions rise mysteriously.',
      voices: { f: 'Vindemiatrix', m: 'Charon' },
      web: { rate: 0.85, pitch: 0.9 },
      sample: { az: 'Biri vardı, biri yoxdu… Uzaq bir kənddə bir qoca bağban yaşayırdı.', en: 'Once upon a time… an old gardener lived in a faraway village.' }
    },
    {
      id: 'xeber', wpm: 114, nativeGender: 'm', person: 'Tural',
      name: { az: 'Xəbər diktoru', en: 'News anchor' },
      desc: { az: 'Ciddi, aydın diktor: elan və faktlar', en: 'Serious, crisp anchor: announcements and facts' },
      style: 'Professional {gender} news anchor. Neutral, authoritative, crisp diction, steady pace, even intonation, clear stress on numbers and names. No colloquial tone.',
      voices: { f: 'Kore', m: 'Rasalgethi' },
      web: { rate: 1.0, pitch: 0.97 },
      sample: { az: 'Bu gün Bakıda yeni metro stansiyası açıldı. Stansiya gündə on min sərnişinə xidmət edəcək.', en: 'A new metro station opened in Baku today. It will serve ten thousand passengers a day.' }
    },
    {
      id: 'premium', wpm: 90, nativeGender: 'm', person: 'Orxan',
      name: { az: 'Premium brend', en: 'Premium brand' },
      desc: { az: 'Dərin, ağır ton: avtomobil, bank, daşınmaz əmlak', en: 'Deep and weighty: cars, banks, real estate' },
      style: 'Deep, resonant, premium {gender} brand voice. Slow, confident pace, weighty pauses between short phrases, calm power. Strong falling endings; the product name is said alone at the end.',
      voices: { f: 'Achernar', m: 'Orus' },
      web: { rate: 0.85, pitch: 0.85 },
      sample: { az: 'Gücü hiss et. Rahatlığı yaşa. Yeni nəsil artıq Bakıda.', en: 'Feel the power. Live the comfort. The new generation is now in Baku.' }
    },
    {
      id: 'motiv', wpm: 120, nativeGender: 'm', person: 'Rauf',
      name: { az: 'Motivasiya', en: 'Motivation' },
      desc: { az: 'Sakit başlayır, enerjini artırır', en: 'Starts calm, builds up energy' },
      style: 'Passionate motivational {gender} speaker. Starts calm and builds energy, the pace rising through the text, strong emphasis on key words, a short dramatic pause before the final line. Rhetorical questions rise, then the answer falls firmly.',
      voices: { f: 'Leda', m: 'Alnilam' },
      web: { rate: 1.05, pitch: 1.0 },
      sample: { az: 'Hər gün bir addım. Yorulursan? Normaldır. Amma dayanma!', en: 'One step every day. Tired? That is normal. But do not stop!' }
    },
    {
      id: 'vlog', wpm: 145, nativeGender: 'm', person: 'Ceyhun',
      name: { az: 'Zarafatcıl vloq', en: 'Playful vlog' },
      desc: { az: 'Canlı, şən, danışıq dili: yumor və yemək', en: 'Lively, casual: humour and food reviews' },
      style: 'Playful, funny young {gender} vlogger, casual and colloquial. Fast pace, lively ups and downs, ironic stress, a short comic pause before the punchline, deadpan punchline.',
      voices: { f: 'Autonoe', m: 'Zubenelgenubi' },
      web: { rate: 1.15, pitch: 1.05 },
      sample: { az: 'Dedim pəhriz edəcəm… sonra qutab gördüm. Pəhriz sabaha qaldı.', en: 'I said I would diet… then I saw qutab. The diet moved to tomorrow.' }
    }
  ];

  /* Shared Gemini instruction prepended to every style line. */
  DATA.geminiBase = 'Azerbaijani with a native Baku accent (not Turkish). Natural conversational rhythm, not like reading aloud. Pronounce ə, ı, ö, ü, ğ, q and x the Azerbaijani way. Final q in native words sounds like [x]; keep long vowels in words like saat and məna; keep double consonants long.';

  /* ------------------------------------------------------------------ */
  /* Normaliser data                                                     */
  /* ------------------------------------------------------------------ */
  DATA.numbers = {
    ones: ['sıfır', 'bir', 'iki', 'üç', 'dörd', 'beş', 'altı', 'yeddi', 'səkkiz', 'doqquz'],
    tens: ['', 'on', 'iyirmi', 'otuz', 'qırx', 'əlli', 'altmış', 'yetmiş', 'səksən', 'doxsan'],
    hundred: 'yüz', thousand: 'min', million: 'milyon', billion: 'milyard', trillion: 'trilyon',
    point: 'tam', minus: 'mənfi', plus: 'artı',
    fractionDenominators: ['onda', 'yüzdə', 'mində', 'on mində', 'yüz mində', 'milyonda']
  };

  DATA.months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];

  /* Currencies: words + optional sub-unit (read only when exactly 2 decimals). */
  DATA.currencies = {
    'AZN': { word: 'manat', sub: 'qəpik' }, '₼': { word: 'manat', sub: 'qəpik' },
    '$': { word: 'dollar', sub: 'sent' }, 'USD': { word: 'dollar', sub: 'sent' },
    '€': { word: 'avro', sub: 'sent' }, 'EUR': { word: 'avro', sub: 'sent' },
    '£': { word: 'funt sterlinq', sub: 'pens' }, 'GBP': { word: 'funt sterlinq', sub: 'pens' },
    '₽': { word: 'rubl', sub: null }, 'RUB': { word: 'rubl', sub: null },
    '₺': { word: 'türk lirəsi', sub: null }, 'TRY': { word: 'türk lirəsi', sub: null }
  };

  /* Units read after a number. */
  DATA.units = {
    'km': 'kilometr', 'm': 'metr', 'sm': 'santimetr', 'mm': 'millimetr',
    'kq': 'kiloqram', 'kg': 'kiloqram', 'q': 'qram', 'qr': 'qram', 't': 'ton',
    'l': 'litr', 'ml': 'millilitr', 'mln': 'milyon', 'mlrd': 'milyard',
    'GB': 'giqabayt', 'MB': 'meqabayt', 'dəq': 'dəqiqə', 'san': 'saniyə',
    'm²': 'kvadratmetr', 'm2': 'kvadratmetr', 'kv.m': 'kvadratmetr', 'ha': 'hektar'
  };

  /* Abbreviations expanded anywhere (exact, case-sensitive where it matters). */
  DATA.abbreviations = [
    ['və s.', 'və sairə'], ['ve s.', 'və sairə'], ['və b.', 'və başqaları'],
    ['məs.', 'məsələn'], ['mes.', 'məsələn'], ['küç.', 'küçəsi'], ['kuc.', 'küçəsi'], ['pr-t', 'prospekti'], ['r-nu', 'rayonu'],
    ['e.ə.', 'eramızdan əvvəl'], ['prof.', 'professor'], ['dos.', 'dosent'],
    ['dr.', 'doktor'], ['tel.', 'telefon'], ['şək.', 'şəkil'], ['səh.', 'səhifə'],
    ['№', 'nömrə '], ['No.', 'nömrə']
  ];

  /* Acronyms people spell out with Azerbaijani letter names. */
  DATA.spelledAcronyms = {
    'BDU': 'be-de-u', 'ADNSU': 'a-de-en-es-u', 'ABŞ': 'a-be-şe', 'DSMF': 'de-es-em-ef',
    'BMT': 'be-em-te', 'AZTV': 'a-ze-te-ve', 'SMM': 'es-em-em', 'PDF': 'pe-de-ef',
    'UNEC': 'unek', 'ADU': 'a-de-u', 'AzTU': 'a-ze-te-u', 'İT': 'i-te', 'MDB': 'em-de-be'
  };
  /* Acronyms read as words: kept as they are. */
  DATA.wordAcronyms = ['ASAN', 'ADA', 'DİM', 'NATO', 'UNESCO', 'UNICEF', 'FIFA', 'UEFA'];

  /* Optional respelling of foreign brands (off by default). */
  DATA.brandRespell = {
    'iPhone': 'Ayfon', 'WhatsApp': 'Vatsap', 'Instagram': 'İnstaqram', 'YouTube': 'Yutub',
    'Google': 'Qugl', 'TikTok': 'Tiktok', 'Facebook': 'Feysbuk', 'Telegram': 'Teleqram',
    'email': 'imeyl', 'e-mail': 'imeyl', 'online': 'onlayn', 'offline': 'oflayn'
  };

  /* Keywords that usually carry the stress in ads and Reels. */
  DATA.emphasisWords = ['pulsuz', 'endirim', 'yeni', 'indi', 'cəmi', 'tələs', 'hədiyyə', 'ən', 'yalnız', 'son', 'bu gün', 'dayan', 'diqqət'];

  /* Conjunctions that take a comma before them (pause hint). */
  DATA.commaBefore = ['amma', 'lakin', 'çünki'];

  /* ------------------------------------------------------------------ */
  /* Diacritic restoration                                               */
  /* A word is restored only when its ASCII-folded form maps to exactly  */
  /* ONE word below. Valid ASCII words (bir, on, kitab…) are listed too, */
  /* so collisions such as on/ön or de/də are left untouched.            */
  /* ------------------------------------------------------------------ */
  DATA.restoreThreshold = 0.8;

  DATA.lexicon = (
    // pronouns, particles, conjunctions
    'mən sən o biz siz onlar məni səni onu bizi sizi onları mənim sənin onun bizim sizin onların mənə sənə ona bizə sizə onlara ' +
    'məndə səndə onda bizdə sizdə məndən səndən ondan bizdən sizdən özüm özün özü özümüz özünüz özləri özünə özünü ' +
    'və ki də da ilə amma lakin ancaq çünki yəni əgər həm hər heç nə niyə necə harada hara haradan haçan kim hansı neçə nəyə nəyi ' +
    'bu şu həmin belə elə bələ burada orada bura ora indi sonra əvvəl hələ artıq yenə daha ən çox az bir iki üç dörd beş altı yeddi səkkiz doqquz on ' +
    'iyirmi otuz qırx əlli altmış yetmiş səksən doxsan yüz min milyon milyard sıfır tam faiz yarım birinci ikinci üçüncü dördüncü beşinci ' +
    'bəli xeyr yox var yoxdur vardır deyil deyilmi olar olmaz lazım lazımdır mümkün mütləq sadəcə yalnız cəmi hətta axı bəs onda deməli bax ' +
    'salam sağ sağol sağolun təşəkkür təşəkkürlər minnətdaram xahiş zəhmət buyurun əla gözəl yaxşı pis böyük kiçik yeni köhnə uzun qısa ' +
    'çətin asan şirin acı isti soyuq yumşaq sərt təzə ucuz baha pulsuz endirim hədiyyə şəxs şəxsi şəxsən insan adam uşaq qız oğlan ana ata ' +
    'qardaş bacı dost dostlar ailə həyat dünya ölkə şəhər kənd ev iş məktəb universitet tələbə müəllim müəllimə dərs kitab dəftər qələm ' +
    'gün gecə səhər axşam həftə ay il saat dəqiqə saniyə vaxt zaman bugün sabah dünən indiki keçən gələn bazar ertəsi çərşənbə axşamı cümə şənbə ' +
    'yanvar fevral mart aprel may iyun iyul avqust sentyabr oktyabr noyabr dekabr yay qış payız bahar ' +
    'su çay qəhvə çörək ət toyuq balıq meyvə tərəvəz şirniyyat dadlı yemək içmək restoran kafe mağaza qiymət pul manat qəpik dollar ' +
    'sifariş çatdırılma müştəri xidmət şirkət biznes məhsul kampaniya reklam satış alış kurs təlim proqram sayt səhifə link mesaj zəng ' +
    'telefon nömrə ünvan küçə rayon Bakı Azərbaycan Gəncə Sumqayıt Şəki Şuşa Qəbələ Lənkəran azərbaycanca azərbaycanlı türk rus ingilis ' +
    'dil söz cümlə mətn səs video şəkil musiqi film xəbər hekayə nağıl sual cavab problem həll fikir məqsəd arzu sevgi ürək can ' +
    'göz əl baş üz ayaq gülüş təbəssüm qəlb ruh həyəcan sevinc qorxu güc sürət rahatlıq keyfiyyət dəyər uğur zəfər qələbə ' +
    'gəl gəlir gəldi gələcək gəlin gedir getdi gedək gedəcək get gör görür gördü görmək gözlə gözləyin bax baxın bil bilir bilirəm bilirsən bilmirəm ' +
    'de deyir dedi demək et edir etdi etmək edəcək ol olur oldu olmaq olacaq al alır aldı almaq ver verir verdi vermək yaz yazır yazdı yazmaq ' +
    'oxu oxuyur oxudu oxumaq danış danışır danışdı danışmaq danışaq sev sevir sevirəm sevirik sevdi sevmək işlə işləyir işlədi işləmək ' +
    'başla başlayır başladı başlamaq bitir bitdi öyrən öyrənir öyrəndi öyrənmək düşün düşünür düşündü istə istəyir istədi istəmək ' +
    'qal qalır qaldı qalıb tap tapır tapdı yoxla yoxlayın yoxlayır sat satır satdı gəz gəzir gəzdi qoy qoyur qoydu çalış çalışır çalışdı ' +
    'kömək et yaşa yaşayır yaşadı yaşamaq tələs tələsin dayan dayanma unutma unutmayın abunə ol izlə izləyin paylaş paylaşın yaz qeyd ' +
    'hər şey hamı hamısı bütün çoxlu bəzi başqa digər eyni fərqli əsas vacib maraqlı əlverişli sərfəli peşəkar keyfiyyətli təhlükəsiz ' +
    'rəsmi doğru düz səhv həqiqət yalan açıq bağlı hazır hazırla səsləndir səsləndirmə qadın kişi stil sürət ' +
    'çox çoxdur azdır gözəldir yaxşıdır əladır hazırdır vacibdir lazımdır ' +
    'gülməli şən sakit ciddi dərin zərif lüks premium enerjili səmimi isti dost dostum dostlar əziz hörmətli ' +
    'ağac ağacı dağ dağı yağış qar külək hava günəş ulduz dəniz çay göl yol maşın avtobus metro təyyarə qatar ' +
    'otaq otağı qonaq qonağı çiçək çiçəyi ürəyi böyük kiçik yaxın uzaq qabaq arxa üst alt iç çöl ' +
    'şənbə bazar ertəsi gözləmək görüşmək görüşərik görüşənədək hələlik xoş xoşdur xoşbəxt bayram novruz təbrik təbriklər ' +
    'təklif təkliflər məsələn məsələ sairə başqaları təqaüd təqaüdə imtahan qəbul nəticə bal sənəd ərizə müraciət ' +
    'işıq qaranlıq rəng ağ qara qırmızı yaşıl mavi sarı çəhrayı bənövşəyi narıncı boz ' +
    'üçün görə qədər kimi sonra əvvəl ərzində zamanı vasitəsilə haqqında barədə arasında ilə birlikdə tək təkcə ' +
    'nəfər dəfə addım hissə tərəf yer yerdə ad soyad yaş boy çəki ' +
    'qutab dolma plov kabab şəkərbura paxlava ' +
    'necəsən necəsiniz yaxşıyam sağ ol çox sağ ol xoş gəldiniz xoş gəlmisiniz uğurlar'
  ).split(/\s+/).filter(Boolean);

  /* Direct Turkish-spelling → Azerbaijani aliases (keyboard/orthography slips). */
  DATA.turkishAliases = {
    'güzel': 'gözəl', 'çok': 'çox', 'değil': 'deyil', 'için': 'üçün', 'şehir': 'şəhər', 'ev': 'ev',
    'merhaba': 'salam', 'teşekkür': 'təşəkkür', 'teşekkürler': 'təşəkkürlər', 'şirket': 'şirkət',
    'kitap': 'kitab', 'kız': 'qız', 'kardeş': 'qardaş', 'kadın': 'qadın', 'erkek': 'kişi',
    'şimdi': 'indi', 'yok': 'yox', 'ücretsiz': 'pulsuz', 'indirim': 'endirim', 'gün': 'gün',
    'büyük': 'böyük', 'küçük': 'kiçik', 'yeni': 'yeni', 'hafta': 'həftə', 'ses': 'səs'
  };

  /* Suffix templates for stem + suffix restoration.
     A = a/ə, I = ı/i/u/ü, Q = q/k (by the preceding vowel). */
  DATA.suffixTemplates = [
    'lAr', 'dA', 'dAn', 'A', 'yA', 'In', 'nIn', 'I', 'nI', 'yI', 'lA', 'ylA', 'lI', 'sIz', 'lIQ', 'dIr', 'dIrlAr',
    'Im', 'Iz', 'ImIz', 'InIz', 'sI', 'sInI', 'sInA', 'sIndA', 'sInIn', 'mIz', 'nIz',
    'lArI', 'lArIn', 'lArA', 'lArdA', 'lArdAn', 'lArImIz', 'lArInIz', 'lArIm', 'lArIn', 'ImdA', 'ImA', 'ImI', 'IndA', 'InA', 'InI',
    'Ir', 'IrAm', 'IrsAn', 'IrIQ', 'IrsInIz', 'IrlAr', 'dI', 'dIm', 'dIn', 'dIQ', 'dInIz', 'dIlAr', 'mIş', 'mIşdIr',
    'AcAQ', 'yAcAQ', 'AcAm', 'yAcAm', 'mAQ', 'mA', 'mAz', 'mAdI', 'mIr', 'mIrAm', 'sA', 'AQ', 'yAQ', 'Ar', 'In', 'yIn', 'mAlI',
    'dAQI', 'IQ', 'Ib', 'yIb', 'ArAQ', 'yArAQ', 'mAyIn', 'mAyA',
    'yIr', 'yIrAm', 'yIrsAn', 'yIrIQ', 'yIrsInIz', 'yIrlAr', 'yIrdI', 'yAcAQsInIz', 'yIn', 'yInIz', 'sInIz'
  ];

  /* Azerbaijani Cyrillic → Latin (1958–1991 alphabet) plus Russian-keyboard letters. */
  DATA.cyrillic = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'q', 'ғ': 'ğ', 'д': 'd', 'е': 'e', 'ә': 'ə', 'ж': 'j', 'з': 'z', 'и': 'i',
    'ы': 'ı', 'ј': 'y', 'к': 'k', 'ҝ': 'g', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'ө': 'ö', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ү': 'ü', 'ф': 'f', 'х': 'x', 'һ': 'h', 'ч': 'ç', 'ҹ': 'c', 'ш': 'ş',
    'э': 'e', 'й': 'y', 'ю': 'yu', 'я': 'ya', 'ё': 'yo', 'ц': 'ts', 'щ': 'şç', 'ь': '', 'ъ': '', 'і': 'i', 'ҕ': 'ğ'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.CL_DATA = DATA;
})(typeof self !== 'undefined' ? self : this);
