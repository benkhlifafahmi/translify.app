import type { Dict, Testimonial, FaqItem } from "./types";

export const id: Dict = {
  "nav.how": "Cara kerjanya",
  "nav.features": "Fitur",
  "nav.pricing": "Harga",
  "nav.faq": "Tanya Jawab",
  "nav.login": "Masuk",
  "nav.cta": "Mulai",

  "hero.badge": "Untuk pembaca penasaran, besar maupun kecil",
  "hero.title.1": "Baca buku apa pun,",
  "hero.title.2": "dalam bahasamu",
  "hero.subtitle":
    "Lemparkan PDF atau EPUB, dan Translify menjaga tata letaknya sama persis — hanya diterjemahkan. Lalu ngobrol dengan bukumu dan kuis dirimu, supaya kamu benar-benar ingat apa yang kamu baca.",
  "hero.cta.primary": "Coba 30 hari",
  "hero.cta.secondary": "Lihat paket",
  "hero.bullet.1": "Tata letak terjaga, halaman demi halaman",
  "hero.bullet.2": "14 bahasa, semua aksara",
  "hero.bullet.3": "Uang kembali 30 hari, tanpa pertanyaan",

  "trust.stat1.n": "42.000+",
  "trust.stat1.l": "buku diterjemahkan",
  "trust.stat2.n": "14",
  "trust.stat2.l": "bahasa, semua aksara",
  "trust.stat3.n": "9,4 / 10",
  "trust.stat3.l": "kepuasan pembaca",
  "trust.stat4.n": "30 hari",
  "trust.stat4.l": "uang kembali, selalu",

  "demo.badge": "Lihat aksinya · demo langsung",
  "demo.title.1": "Sehari penuh membaca, dalam",
  "demo.title.2": "dua puluh enam detik",

  "how.badge": "Tiga langkah, sepuluh menit",
  "how.title.1": "Dari PDF ke",
  "how.title.2": "buku yang kamu pahami",
  "how.subtitle":
    "Tanpa setup. Tanpa repot dengan alat penerjemah. Tanpa salin-tempel ke tab lain. Lempar, tunggu selama satu kopi, baca.",
  "how.step1.title": "Lempar bukumu",
  "how.step1.body":
    "PDF atau EPUB hingga 200 MB. Buku pelajaran, novel, jurnal, buku anak — apa pun yang bisa dibaca.",
  "how.step2.title": "Pilih bahasa",
  "how.step2.body":
    "Pilih dari 14 bahasa. Kami bangun ulang tiap halaman dalam bahasa tujuanmu, tata letak asli tetap utuh.",
  "how.step3.title": "Baca, ngobrol, kuis",
  "how.step3.body":
    "Buka bukunya, tanya pakai bahasa sehari-hari, dan biarkan kuis dadakan menguatkan apa yang sudah kamu pelajari.",

  "feat.badge": "Yang sebenarnya kamu dapatkan",
  "feat.title.1": "Semua alat untuk",
  "feat.title.2": "menyelesaikan",
  "feat.title.3": "bukunya.",
  "feat.translate.eyebrow": "Terjemahan",
  "feat.translate.title": "Buku yang sama. Bentuk yang sama. Bahasamu.",
  "feat.translate.body":
    "Tabel tetap tabel. Judul tetap judul. Kami bangun ulang tiap halaman seolah-olah penerbit aslinya yang membuatnya — termasuk untuk aksara dari kanan ke kiri, CJK, Devanagari, dan semua 14 bahasa yang didukung.",
  "feat.translate.h1": "Mode baca berdampingan",
  "feat.translate.h2": "Intip teks asli saat hover",
  "feat.translate.h3": "Ekspor PDF terjemahan dengan catatan",
  "feat.chat.eyebrow": "Obrolan",
  "feat.chat.title": "Tanyakan ke buku. Jawaban bersumber.",
  "feat.chat.body":
    "Setiap balasan terhubung ke kutipan persisnya — nomor halaman, cuplikan disorot, tombol lompat. Tidak ada halusinasi yang menyamar jadi jawaban.",
  "feat.chat.h1": "Tanya-jawab natural di 14 bahasa",
  "feat.chat.h2": "Ringkasan otomatis tiap bab",
  "feat.chat.h3": "Sorot untuk bertanya: pilih kalimat, ajukan pertanyaan",
  "feat.quiz.eyebrow": "Kuis",
  "feat.quiz.title": "Salah? Ini halamannya.",
  "feat.quiz.body":
    "Kuis dadakan dari yang benar-benar kamu baca. Salah satu? Kami antar ke halaman penjelasannya — bukan lambaian samar.",
  "feat.quiz.h1": "5, 8, atau 12 soal per ronde",
  "feat.quiz.h2": "Pilihan ganda, dengan sumber tiap jawaban",
  "feat.quiz.h3": "Lacak rentetan, titik lemah, dan kemajuan",

  "audience.badge": "Satu rak, semua pembaca",
  "audience.title.1": "Dirancang untuk cara",
  "audience.title.2": "rumahmu",
  "audience.title.3": "membaca.",
  "audience.students.who": "Pelajar",
  "audience.students.line":
    "Baca silabus dalam bahasa terkuatmu. Kuis sebelum ujian. Kutip halaman tanpa membuka kovernya.",
  "audience.students.tag1": "Universitas",
  "audience.students.tag2": "SMA",
  "audience.students.tag3": "Belajar mandiri",
  "audience.readers.who": "Pembaca seumur hidup",
  "audience.readers.line":
    "Akhirnya selesaikan novel Prancis itu. Sapu sekilas paper Jerman. Baca manga Jepang dengan iramamu, bahasamu sendiri.",
  "audience.readers.tag1": "Hobi",
  "audience.readers.tag2": "Poliglot",
  "audience.readers.tag3": "Perjalanan",
  "audience.children.who": "Anak-anak",
  "audience.children.line":
    "Maskot lebih ramah, usia baca disesuaikan, obrolan aman, dan orang tua bisa lihat persis apa yang dibaca.",
  "audience.children.tag1": "7+ tahun",
  "audience.children.tag2": "Rak keluarga",
  "audience.children.tag3": "Dasbor orang tua",

  "langs.badge": "14 bahasa, semua aksara",
  "langs.title":
    "Latin, Sirilik, Arab, CJK, Devanagari — kami urus tipografinya supaya halaman tetap terasa seperti buku.",
  "langs.body":
    "Termasuk arah kanan-ke-kiri untuk Arab dan Ibrani, dukungan vertikal CJK saat sumbernya begitu, dan font tertanam supaya tidak ada yang muncul sebagai deretan tanda tanya.",

  "testimonials.badge": "Disukai pembaca",
  "testimonials.title": "Apa kata para pembaca.",

  "cta.badge": "Saat kamu siap",
  "cta.title.1": "Berhenti berharap kamu sudah membacanya.",
  "cta.title.2": "Baca saja.",
  "cta.body":
    "Pilih paket, lemparkan buku pertamamu, dan baca seperti niatmu semula. Kalau dalam 30 hari kamu tidak suka, kami kembalikan penuh — tanpa formulir, tanpa ribet.",
  "cta.primary": "Coba 30 hari",
  "cta.secondary": "Bandingkan paket",
  "cta.note":
    "Tidak ada paket gratis. Tidak ada biaya kejutan. Berhenti kapan saja, uang kembali dalam 30 hari.",

  "pricing.badge": "Harga jujur · berhenti kapan saja",
  "pricing.title.1": "Pilih paket.",
  "pricing.title.2": "Baca lebih baik dalam 30 hari",
  "pricing.title.3": "— atau dapat semua uangmu kembali.",
  "pricing.preamble":
    "Kami tidak tawarkan tier gratis karena menerjemahkan buku dengan baik juga tidak gratis bagi kami — tapi kami berdiri di belakang hasilnya. Kalau Translify tidak mengubah cara kamu membaca di bulan pertama, kirim email dan kami kembalikan uangmu. Tanpa formulir.",
  "pricing.monthly": "Bulanan",
  "pricing.yearly": "Tahunan",
  "pricing.save": "Hemat 20%",
  "pricing.month": "/bln",
  "pricing.billed.monthly": "ditagih bulanan",
  "pricing.billed.yearly.before": "ditagih €",
  "pricing.billed.yearly.after": " per tahun",
  "pricing.best": "★ Paling disukai",
  "pricing.guarantee": "Uang kembali 30 hari · berhenti kapan saja",
  "pricing.refund.title": "Tanpa risiko, refund penuh — titik.",
  "pricing.refund.body":
    "Kamu punya satu bulan penuh untuk coba semua fitur, di paket apa pun. Kalau ternyata tidak cocok, balas email selamat datang dan kami kembalikan uangmu — biasanya hari yang sama.",
  "pricing.refund.cta": "Coba 30 hari",
  "pricing.days": "hari",

  "plan.reader.name": "Reader",
  "plan.reader.tagline":
    "Untuk yang penasaran — selesaikan beberapa buku tiap bulan dalam bahasa baru.",
  "plan.reader.cta": "Mulai sebagai Reader",
  "plan.reader.f1": "Hingga 10 buku / bulan",
  "plan.reader.f2": "Semua 14 bahasa",
  "plan.reader.f3": "Baca berdampingan",
  "plan.reader.f4": "Obrolan dengan sumber",
  "plan.reader.f5": "Mode kuis (10 soal / buku)",
  "plan.reader.f6": "PDF & EPUB",
  "plan.scholar.name": "Scholar",
  "plan.scholar.tagline":
    "Untuk pelajar dan pembaca serius — seluruh silabusmu, diterjemahkan.",
  "plan.scholar.cta": "Jadi Scholar",
  "plan.scholar.f1": "Buku tak terbatas",
  "plan.scholar.f2": "Semua 14 bahasa — antrean prioritas",
  "plan.scholar.f3": "Kuis & paket belajar tak terbatas",
  "plan.scholar.f4": "Ekspor terjemahan beranotasi (PDF)",
  "plan.scholar.f5": "Daftar kosakata cerdas",
  "plan.scholar.f6": "Dukungan email · balas dalam 1 hari",
  "plan.family.name": "Family",
  "plan.family.tagline":
    "Bagi rak — satu perpustakaan, hingga lima pembaca, anak-anak dipersilakan.",
  "plan.family.cta": "Pilih Family",
  "plan.family.f1": "Semua di Scholar",
  "plan.family.f2": "5 profil pembaca",
  "plan.family.f3": "Mode aman anak + kontrol usia baca",
  "plan.family.f4": "Perpustakaan keluarga bersama",
  "plan.family.f5": "Dasbor kemajuan orang tua",
  "plan.family.f6": "Dukungan prioritas",

  "faq.badge": "Pertanyaan, dijawab",
  "faq.title": "Jawaban yang jujur.",
  "faq.note":
    "Kalau ada yang belum terjawab di sini, kirim ke hello@translify.app — manusia sungguhan baca tiap email.",

  "footer.tagline":
    "Teman membaca yang menerjemahkan buku utuh, menjawab pertanyaanmu dengan sumber, dan menguji supaya benar-benar nempel.",
  "footer.col.product": "Produk",
  "footer.col.company": "Perusahaan",
  "footer.col.help": "Bantuan",
  "footer.link.how": "Cara kerjanya",
  "footer.link.features": "Fitur",
  "footer.link.pricing": "Harga",
  "footer.link.languages": "Bahasa",
  "footer.link.manifesto": "Manifesto",
  "footer.link.blog": "Blog",
  "footer.link.careers": "Karier",
  "footer.link.press": "Pers",
  "footer.link.faq": "FAQ",
  "footer.link.refund": "Kebijakan refund",
  "footer.link.contact": "Kontak",
  "footer.link.status": "Status",
  "footer.bottom": "Dibuat dengan sabar untuk pembaca di mana pun",
  "footer.privacy": "Privasi",
  "footer.terms": "Ketentuan",
  "footer.cookies": "Cookies",

  "auth.login.eyebrow": "Selamat datang kembali",
  "auth.login.title": "Lanjutkan dari yang terhenti.",
  "auth.login.subtitle":
    "Bukumu, sorotanmu, bab yang setengah jalan — semuanya menunggu.",
  "auth.login.email": "Email",
  "auth.login.password": "Kata sandi",
  "auth.login.submit": "Masuk",
  "auth.login.submitting": "Sebentar ya…",
  "auth.login.new": "Baru di sini?",
  "auth.login.makeAccount": "Buat akun",

  "auth.register.eyebrow": "Halo, pembaca",
  "auth.register.title": "Buat rakmu.",
  "auth.register.subtitle":
    "Sudut hangat dan pribadi untuk buku yang kamu baca, pertanyaanmu, dan hal-hal yang kamu pelajari.",
  "auth.register.name": "Mau dipanggil apa?",
  "auth.register.nameOptional": "Opsional",
  "auth.register.email": "Email",
  "auth.register.password": "Kata sandi",
  "auth.register.passwordHint": "Minimal 8 karakter",
  "auth.register.submit": "Buat rakku",
  "auth.register.submitting": "Menyiapkan rakmu…",
  "auth.register.have": "Sudah punya rak?",
  "auth.register.login": "Masuk",

  "auth.shell.badge": "Untuk pelajar segala usia",
  "auth.shell.quote.1": "“Bukunya tetap sama.",
  "auth.shell.quote.2": "Pemahamanku tentangnya",
  "auth.shell.quote.3": "tidak.”",
  "auth.shell.body":
    "Terjemahkan PDF apa pun, ngobrol dengannya, lalu kuis dirimu. Untuk kelas, PR, dan sore Minggu yang hujan.",
  "auth.shell.foot": "Baca · Terjemahkan · Ngobrol · Kuis",

  // Onboarding — top nav + step controls
  "ob.skip": "Masuk",
  "ob.back": "Kembali",
  "ob.next": "Lanjut",
  "ob.finish": "Jadikan milikku",

  // Onboarding · Step 1 — persona
  "ob.s1.eyebrow": "Pertama, alasannya",
  "ob.s1.title": "Kenapa kamu di sini?",
  "ob.s1.subtitle":
    "Pilih yang paling mirip dirimu. Setup selanjutnya akan kami sesuaikan dengan itu.",
  "ob.s1.opt.student": "Aku lagi belajar",
  "ob.s1.opt.student.body": "Buku pelajaran, paper, persiapan ujian — baca dalam bahasa terkuatmu.",
  "ob.s1.opt.curious": "Aku baca buat senang-senang",
  "ob.s1.opt.curious.body": "Novel, esai, sesekali manga. Selesaikan lebih banyak, dalam bahasa apa pun.",
  "ob.s1.opt.pro": "Aku baca buat kerja",
  "ob.s1.opt.pro.body": "Laporan, manual, PDF padat. Langsung ke intinya — dan kutip sumbernya.",
  "ob.s1.opt.family": "Aku baca bareng anak",
  "ob.s1.opt.family.body": "Cerita sebelum tidur dan PR, dalam bahasa apa pun, aman buat anak.",

  // Onboarding · Step 2 — language
  "ob.s2.eyebrow": "Sekarang, bahasanya",
  "ob.s2.title": "Kamu baca dalam bahasa apa?",
  "ob.s2.subtitle":
    "Setiap buku yang kamu unggah akan kami terjemahkan ke bahasa ini — tata letak aslinya tetap utuh.",
  "ob.s2.rtl": "Kanan ke kiri",
  "ob.s2.more": "+ 8 bahasa lainnya — Italiano, Português, Nederlands, 中文, 한국어, Русский, हिन्दी, Türkçe",

  // Onboarding · Step 3 — volume slider
  "ob.s3.eyebrow": "Seberapa banyak kamu baca?",
  "ob.s3.title": "Kira-kira berapa buku per bulan?",
  "ob.s3.subtitle":
    "Tidak harus presisi. Kami cocokkan paket dengan iramamu.",
  "ob.s3.unit.books": "Buku / bulan",

  // Onboarding · Step 4 — personality reveal
  "ob.s4.eyebrow": "Karakter membacamu",
  "ob.s4.title.pre": "Kamu membaca seperti seorang",
  "ob.s4.title.post": ".",
  "ob.s4.recommended": "Direkomendasikan untukmu",
  "ob.s4.timer": "Penawaran berakhir dalam",
  "ob.s4.planRec": "Rekomendasi paket",
  "ob.s4.firstMonth": "bulan pertama",
  "ob.s4.then": "lalu €%price%/bln · berhenti kapan saja · uang kembali 30 hari",
  "ob.s4.match.books": "Cocok dengan %books% buku / bulanmu",
  "ob.s4.match.lang": "Membaca dalam %lang% — dukungan aksara penuh",
  "ob.s4.match.reader": "Hingga 10 buku / bulan, semua 14 bahasa",
  "ob.s4.match.scholar": "Buku tak terbatas, antrean prioritas, kosakata cerdas",
  "ob.s4.match.family": "5 profil pembaca, obrolan aman anak, dasbor orang tua",
  "ob.s4.match.basics": "Kuis & obrolan dengan sumber — milikmu sejak hari pertama",
  "ob.s4.lock.pre": "Kunci",
  "ob.s4.lock.discount": "diskon 40%",
  "ob.s4.lock.post": "untuk bulan pertamamu — diterapkan saat checkout.",
  "ob.s4.tone.saffron": "scholar",
  "ob.s4.tone.sage": "penjelajah poliglot",
  "ob.s4.tone.coral": "pembaca keluarga",
  "ob.s4.tone.plum": "pikiran tajam",
  "ob.s4.alsoA": "juga seorang",
  "ob.s4.quote.saffron":
    "Aku baca Tolstoy dengan iramanya — dengan iramaku. Paket Scholar balik modal dalam satu semester.",
  "ob.s4.quote.sage":
    "Dua belas novel, tiga bahasa, enam bulan. Sudah lama aku tidak baca sebanyak ini sejak kecil.",
  "ob.s4.quote.coral":
    "Cerita sebelum tidur dalam bahasa Spanyol. Kuis dalam bahasa Inggris pas sarapan. Dia menang, aku juga.",
  "ob.s4.quote.plum":
    "Paper Mandarin 600 halaman, diringkas dan bisa dikutip. Paket Scholar adalah keuntungan tak adilku.",

  // Onboarding · Personality body copy
  "personality.scholar.name": "Scholar",
  "personality.scholar.body":
    "Kamu membaca dengan pulpen di tangan. Kamu mau silabus selesai dalam bahasa terkuatmu, kutipan yang bisa dipercaya, dan kuis yang benar-benar nempel.",
  "personality.curious.name": "Pembaca Penasaran",
  "personality.curious.body":
    "Kamu menyelesaikan lebih banyak buku saat mereka menyambutmu di tengah jalan. Beberapa terjemahan tiap bulan, semua aksara didukung, tanpa ribet.",
  "personality.pro.name": "Pikiran Tajam",
  "personality.pro.body":
    "Kamu baca buat kerja — laporan, manual, paper. Kamu mau menyapu sekilas dengan cepat dan mengutip lebih cepat lagi, tanpa jawaban halusinasi.",
  "personality.family.name": "Pembaca Keluarga",
  "personality.family.body":
    "Kamu baca bareng anak. Kamu mau cerita sebelum tidur dalam bahasa apa pun, obrolan aman anak, dan visibilitas orang tua — semuanya di satu rak.",

  // Onboarding · Step 5 — account creation + summary
  "ob.s5.eyebrow": "Hampir sampai",
  "ob.s5.title": "Buat rakmu.",
  "ob.s5.subtitle":
    "Sudut pribadi untuk buku yang kamu baca, pertanyaanmu, dan hal-hal yang kamu pelajari.",
  "ob.s5.name": "Mau dipanggil apa?",
  "ob.s5.optional": "Opsional",
  "ob.s5.email": "Email",
  "ob.s5.password": "Kata sandi",
  "ob.s5.passwordHint": "Minimal 8 karakter",
  "ob.s5.start": "Mulai uji coba 30 hariku",
  "ob.s5.submitting": "Menyiapkan rakmu…",
  "ob.s5.terms":
    "Dengan memulai uji coba kamu setuju dengan ketentuan kami · ",
  "ob.s5.terms.haveAccount": "Sudah punya akun? Masuk",
  "ob.s5.order": "Pesananmu",
  "ob.s5.row.monthly": "%plan% · bulanan",
  "ob.s5.row.firstDiscount": "Diskon bulan pertama",
  "ob.s5.row.trial": "Uji coba gratis",
  "ob.s5.row.trialDays": "30 hari",
  "ob.s5.row.today": "Hari ini",
  "ob.s5.charge.pre": "Hari ini kamu belum ditagih. Setelah uji coba 30 harimu, kamu bayar ",
  "ob.s5.charge.post":
    " untuk bulan pertama, lalu €%price%/bln. Berhenti kapan saja, refund penuh dalam 30 hari.",
  "ob.s5.trust.cancel": "Berhenti kapan saja",
  "ob.s5.trust.refund": "Refund ≤30h",
  "ob.s5.trust.secure": "Checkout aman",
  "ob.s5.join": "Gabung 42.000+ pembaca yang menyelesaikan bukunya.",
  "ob.error.register": "Pendaftaran gagal. Silakan coba lagi.",
};

export const idTestimonials: Testimonial[] = [
  {
    quote:
      "Aku baca Tolstoy dengan iramanya, dalam bahasaku. Chat-nya bilangin yang tadinya kelewat dan nganterin balik ke halamannya. Akhirnya bukunya selesai.",
    name: "Rina Wijaya",
    role: "Mahasiswi sastra, Yogyakarta",
  },
  {
    quote:
      "Anakku yang sepuluh tahun sekarang baca cerita sebelum tidur dalam bahasa Spanyol, terus paginya nguji aku. Aku selalu kalah, tapi seneng banget.",
    name: "Budi Santoso",
    role: "Bapak dua anak, Jakarta",
    highlight: true,
  },
  {
    quote:
      "Aku punya buku Mandarin 600 halaman yang sudah setahun aku hindari. Translify bikin sore itu kebaca habis — kutipannya pas semua.",
    name: "Sari Pramudita",
    role: "Kandidat doktor, Universitas Indonesia",
  },
];

export const idFaq: FaqItem[] = [
  {
    q: "Apakah ada paket gratis?",
    a: "Tidak, dan rasanya tidak jujur kalau pura-pura iya — menjalankan model terjemahan dengan baik benar-benar memakan biaya buat kami. Sebagai gantinya, kami beri jaminan 30 hari. Coba semua fitur di paket apa pun, kalau dalam sebulan kamu tidak baca lebih baik, uangmu kami kembalikan penuh.",
  },
  {
    q: "Bagaimana sebenarnya refund 30 hari bekerja?",
    a: "Balas email selamat datangmu kapan saja dalam 30 hari pertama, bilang kamu mau refund — kami tidak tanya alasan, tidak ada formulir, dan dananya biasanya sampai keesokan harinya. Kamu tetap bisa pakai akun sampai akhir periode tagihanmu.",
  },
  {
    q: "Format dan bahasa apa saja yang didukung?",
    a: "PDF dan EPUB hingga 200 MB per buku. Kami menerjemahkan ke Inggris, Prancis, Spanyol, Jerman, Italia, Portugis, Belanda, Arab, Mandarin (Sederhana & Tradisional), Jepang, Korea, Rusia, Hindi, dan Turki — dengan render aksara yang benar untuk kanan-ke-kiri dan CJK.",
  },
  {
    q: "Apakah tata letak buku tetap utuh saat diterjemahkan?",
    a: "Iya — kami bangun ulang tiap halaman dengan bentuk yang sama: paragraf di tempatnya, gambar di posisi semula, hierarki judul tetap. Kelihatannya seperti dibuat penerbit aslinya. Mode berdampingan juga selalu ada untuk balik ke teks asli.",
  },
  {
    q: "Seberapa akurat kutipan di obrolan?",
    a: "Setiap jawaban di obrolan terhubung ke kutipan persis di PDF aslinya, dengan nomor halaman dan cuplikan disorot. Kalau kami tidak menemukan kutipan yang setia, kami beri tahu daripada menebak — itu aturannya.",
  },
  {
    q: "Apakah aman untuk anak-anak?",
    a: "Paket Family punya mode aman anak dengan kontrol usia baca, nada obrolan yang dilembutkan, dan dasbor orang tua yang menampilkan apa yang dibaca anak-anak serta hasil kuisnya. Profil anak tidak melihat buku yang tidak ditugaskan untuknya.",
  },
  {
    q: "Bisa berhenti kapan saja?",
    a: "Bisa. Satu klik di pengaturan akun. Kamu tetap punya akses sampai akhir periode yang sudah dibayar, dan kami tidak pernah otomatis menagih keesokan harinya.",
  },
  {
    q: "Apakah bukuku dipakai untuk melatih AI?",
    a: "Tidak. Yang kamu unggah bersifat pribadi untuk akunmu, terenkripsi saat disimpan, dan tidak pernah dipakai untuk melatih model — baik milik kami maupun siapa pun. Kamu bisa hapus buku beserta semua turunannya kapan pun.",
  },
];
