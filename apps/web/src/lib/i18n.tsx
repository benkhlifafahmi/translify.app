"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "fr" | "es" | "de" | "ar" | "ja";

export const LOCALES: { code: Locale; label: string; flag: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English",  flag: "🇬🇧", dir: "ltr" },
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "es", label: "Español",  flag: "🇪🇸", dir: "ltr" },
  { code: "de", label: "Deutsch",  flag: "🇩🇪", dir: "ltr" },
  { code: "ja", label: "日本語",     flag: "🇯🇵", dir: "ltr" },
  { code: "ar", label: "العربية",   flag: "🇸🇦", dir: "rtl" },
];

type Dict = Record<string, string>;

const en: Dict = {
  // Nav
  "nav.how": "How it works",
  "nav.features": "Features",
  "nav.pricing": "Pricing",
  "nav.faq": "FAQ",
  "nav.login": "Log in",
  "nav.cta": "Get started",

  // Hero
  "hero.badge": "For curious readers, big & small",
  "hero.title.1": "Read any book,",
  "hero.title.2": "in your language",
  "hero.subtitle": "Drop in a PDF or EPUB and Translify keeps the layout exactly the same — just translated. Then chat with your book and quiz yourself, so you actually remember what you read.",
  "hero.cta.primary": "Start your 30-day trial",
  "hero.cta.secondary": "See plans",
  "hero.bullet.1": "Layout preserved, page by page",
  "hero.bullet.2": "14 languages, every script",
  "hero.bullet.3": "Money-back in 30 days, no questions",

  // Pricing
  "pricing.badge": "Honest pricing · cancel anytime",
  "pricing.title.1": "Pick a plan.",
  "pricing.title.2": "Read better in 30 days",
  "pricing.title.3": "— or get every cent back.",
  "pricing.monthly": "Monthly",
  "pricing.yearly": "Yearly",
  "pricing.save": "Save 20%",
  "pricing.month": "/mo",

  // Onboarding
  "ob.skip": "Skip — already a member",
  "ob.back": "Back",
  "ob.next": "Continue",
  "ob.finish": "Unlock my plan",

  "ob.s1.eyebrow": "Step 1 of 5 · Tell us about you",
  "ob.s1.title": "Who are you reading for?",
  "ob.s1.subtitle": "We tailor the experience — quizzes, vocabulary, even the mascot.",
  "ob.s1.opt.student": "I'm a student",
  "ob.s1.opt.student.body": "Textbooks, papers, syllabi. Pass the exam.",
  "ob.s1.opt.curious": "I'm a lifelong reader",
  "ob.s1.opt.curious.body": "Novels, essays, classics. Read for pleasure.",
  "ob.s1.opt.pro": "I'm a professional",
  "ob.s1.opt.pro.body": "Reports, technical docs, research. Stay sharp.",
  "ob.s1.opt.family": "Reading with kids",
  "ob.s1.opt.family.body": "Bedtime stories, school books, kid-safe chat.",

  "ob.s2.eyebrow": "Step 2 of 5 · Pick your language",
  "ob.s2.title": "What language do you want to read in?",
  "ob.s2.subtitle": "We rebuild every page in your target language, keeping the original layout intact.",

  "ob.s3.eyebrow": "Step 3 of 5 · Your reading life",
  "ob.s3.title": "How many books a month?",
  "ob.s3.subtitle": "Slide to your honest number — not your aspirational one.",
  "ob.s3.unit.books": "books / month",

  "ob.s4.eyebrow": "Step 4 of 5 · The reveal",
  "ob.s4.title.pre": "You're a",
  "ob.s4.title.post": ".",
  "ob.s4.subtitle": "Based on your answers, here is your reading personality and the plan that fits it.",
  "ob.s4.recommended": "Your match",
  "ob.s4.savings": "First month %d% off",
  "ob.s4.timer": "Offer expires in",

  "ob.s5.eyebrow": "Step 5 of 5 · Make your shelf",
  "ob.s5.title": "One last thing.",
  "ob.s5.subtitle": "Create your shelf and start your 30-day trial. Cancel any time, refund within 30 days.",
  "ob.s5.email": "Email",
  "ob.s5.password": "Password",
  "ob.s5.name": "What should we call you?",
  "ob.s5.optional": "Optional",
  "ob.s5.start": "Start my 30-day trial →",

  // Reveal personality types
  "personality.scholar.name": "Scholar",
  "personality.scholar.body": "You read to master. Quizzes and citations are your friends. The Scholar plan keeps your syllabus translated in every language you study.",
  "personality.curious.name": "Polyglot Explorer",
  "personality.curious.body": "You read to wander. You'd finish more books if they were in a language that flowed. The Reader plan is your quiet companion.",
  "personality.pro.name": "Sharp Mind",
  "personality.pro.body": "You read to stay ahead. Reports, papers, dense docs — translated, summarised, and citable. The Scholar plan is built for you.",
  "personality.family.name": "Family Reader",
  "personality.family.body": "You read together. The Family plan gives kid-safe chat, parent dashboards, and five reader profiles for your house.",
};

const fr: Dict = {
  "nav.how": "Comment ça marche",
  "nav.features": "Fonctionnalités",
  "nav.pricing": "Tarifs",
  "nav.faq": "FAQ",
  "nav.login": "Se connecter",
  "nav.cta": "Commencer",

  "hero.badge": "Pour les lecteurs curieux, petits et grands",
  "hero.title.1": "Lisez n'importe quel livre,",
  "hero.title.2": "dans votre langue",
  "hero.subtitle": "Déposez un PDF ou EPUB et Translify garde la mise en page identique — simplement traduite. Discutez ensuite avec votre livre et faites des quiz pour vraiment vous souvenir de ce que vous lisez.",
  "hero.cta.primary": "Essai de 30 jours",
  "hero.cta.secondary": "Voir les forfaits",
  "hero.bullet.1": "Mise en page préservée, page par page",
  "hero.bullet.2": "14 langues, toutes les écritures",
  "hero.bullet.3": "Remboursé sous 30 jours, sans question",

  "pricing.badge": "Tarifs honnêtes · annulez à tout moment",
  "pricing.title.1": "Choisissez un forfait.",
  "pricing.title.2": "Lisez mieux en 30 jours",
  "pricing.title.3": "— ou récupérez chaque centime.",
  "pricing.monthly": "Mensuel",
  "pricing.yearly": "Annuel",
  "pricing.save": "Économisez 20%",
  "pricing.month": "/mois",

  "ob.skip": "Passer — déjà inscrit",
  "ob.back": "Retour",
  "ob.next": "Continuer",
  "ob.finish": "Débloquer mon forfait",

  "ob.s1.eyebrow": "Étape 1 sur 5 · Parlez-nous de vous",
  "ob.s1.title": "Pour qui lisez-vous ?",
  "ob.s1.subtitle": "Nous adaptons l'expérience — quiz, vocabulaire, même la mascotte.",
  "ob.s1.opt.student": "Je suis étudiant",
  "ob.s1.opt.student.body": "Manuels, articles, programme. Réussir l'examen.",
  "ob.s1.opt.curious": "Je suis un lecteur passionné",
  "ob.s1.opt.curious.body": "Romans, essais, classiques. Lire pour le plaisir.",
  "ob.s1.opt.pro": "Je suis un professionnel",
  "ob.s1.opt.pro.body": "Rapports, docs techniques, recherche. Restez affûté.",
  "ob.s1.opt.family": "Lecture avec les enfants",
  "ob.s1.opt.family.body": "Histoires du soir, manuels, chat sécurisé.",

  "ob.s2.eyebrow": "Étape 2 sur 5 · Choisissez votre langue",
  "ob.s2.title": "Dans quelle langue voulez-vous lire ?",
  "ob.s2.subtitle": "Nous reconstruisons chaque page dans votre langue cible, en gardant la mise en page d'origine.",

  "ob.s3.eyebrow": "Étape 3 sur 5 · Votre vie de lecteur",
  "ob.s3.title": "Combien de livres par mois ?",
  "ob.s3.subtitle": "Glissez jusqu'à votre nombre honnête — pas celui de vos rêves.",
  "ob.s3.unit.books": "livres / mois",

  "ob.s4.eyebrow": "Étape 4 sur 5 · La révélation",
  "ob.s4.title.pre": "Vous êtes un",
  "ob.s4.title.post": ".",
  "ob.s4.subtitle": "D'après vos réponses, voici votre personnalité de lecteur et le forfait qui vous correspond.",
  "ob.s4.recommended": "Votre correspondance",
  "ob.s4.savings": "%d% de réduction le premier mois",
  "ob.s4.timer": "L'offre expire dans",

  "ob.s5.eyebrow": "Étape 5 sur 5 · Créez votre étagère",
  "ob.s5.title": "Un dernier détail.",
  "ob.s5.subtitle": "Créez votre étagère et commencez votre essai de 30 jours. Annulez à tout moment, remboursé sous 30 jours.",
  "ob.s5.email": "E-mail",
  "ob.s5.password": "Mot de passe",
  "ob.s5.name": "Comment doit-on vous appeler ?",
  "ob.s5.optional": "Optionnel",
  "ob.s5.start": "Démarrer mon essai de 30 jours →",

  "personality.scholar.name": "Érudit",
  "personality.scholar.body": "Vous lisez pour maîtriser. Quiz et citations sont vos amis. Le forfait Scholar garde votre programme traduit dans chaque langue.",
  "personality.curious.name": "Explorateur Polyglotte",
  "personality.curious.body": "Vous lisez pour vagabonder. Vous finiriez plus de livres dans une langue fluide. Le forfait Reader est votre compagnon discret.",
  "personality.pro.name": "Esprit Affûté",
  "personality.pro.body": "Vous lisez pour avoir une longueur d'avance. Rapports et docs denses — traduits, résumés, citables. Le Scholar est fait pour vous.",
  "personality.family.name": "Lecteur de Famille",
  "personality.family.body": "Vous lisez ensemble. Le forfait Family offre un chat sécurisé, un tableau de bord parental et cinq profils.",
};

const es: Dict = {
  "nav.how": "Cómo funciona",
  "nav.features": "Funciones",
  "nav.pricing": "Precios",
  "nav.faq": "Preguntas",
  "nav.login": "Iniciar sesión",
  "nav.cta": "Empezar",

  "hero.badge": "Para lectores curiosos, grandes y pequeños",
  "hero.title.1": "Lee cualquier libro,",
  "hero.title.2": "en tu idioma",
  "hero.subtitle": "Sube un PDF o EPUB y Translify mantiene el diseño exactamente igual — solo traducido. Luego chatea con tu libro y haz quizzes, para que recuerdes lo que lees.",
  "hero.cta.primary": "Prueba 30 días",
  "hero.cta.secondary": "Ver planes",
  "hero.bullet.1": "Diseño preservado, página por página",
  "hero.bullet.2": "14 idiomas, toda escritura",
  "hero.bullet.3": "Reembolso a 30 días, sin preguntas",

  "pricing.badge": "Precios honestos · cancela cuando quieras",
  "pricing.title.1": "Elige un plan.",
  "pricing.title.2": "Lee mejor en 30 días",
  "pricing.title.3": "— o recupera tu dinero.",
  "pricing.monthly": "Mensual",
  "pricing.yearly": "Anual",
  "pricing.save": "Ahorra 20%",
  "pricing.month": "/mes",

  "ob.skip": "Saltar — ya soy miembro",
  "ob.back": "Atrás",
  "ob.next": "Continuar",
  "ob.finish": "Desbloquear mi plan",

  "ob.s1.eyebrow": "Paso 1 de 5 · Cuéntanos sobre ti",
  "ob.s1.title": "¿Para quién lees?",
  "ob.s1.subtitle": "Adaptamos la experiencia — quizzes, vocabulario, incluso la mascota.",
  "ob.s1.opt.student": "Soy estudiante",
  "ob.s1.opt.student.body": "Libros de texto, artículos, programa. Aprobar el examen.",
  "ob.s1.opt.curious": "Soy lector apasionado",
  "ob.s1.opt.curious.body": "Novelas, ensayos, clásicos. Leer por placer.",
  "ob.s1.opt.pro": "Soy profesional",
  "ob.s1.opt.pro.body": "Informes, docs técnicos, investigación. Mantente al día.",
  "ob.s1.opt.family": "Leyendo con niños",
  "ob.s1.opt.family.body": "Cuentos, libros escolares, chat seguro.",

  "ob.s2.eyebrow": "Paso 2 de 5 · Elige tu idioma",
  "ob.s2.title": "¿En qué idioma quieres leer?",
  "ob.s2.subtitle": "Reconstruimos cada página en tu idioma objetivo, manteniendo el diseño original.",

  "ob.s3.eyebrow": "Paso 3 de 5 · Tu vida de lector",
  "ob.s3.title": "¿Cuántos libros al mes?",
  "ob.s3.subtitle": "Desliza hasta tu número honesto — no el aspiracional.",
  "ob.s3.unit.books": "libros / mes",

  "ob.s4.eyebrow": "Paso 4 de 5 · La revelación",
  "ob.s4.title.pre": "Eres un",
  "ob.s4.title.post": ".",
  "ob.s4.subtitle": "Según tus respuestas, esta es tu personalidad lectora y el plan que te conviene.",
  "ob.s4.recommended": "Tu coincidencia",
  "ob.s4.savings": "Primer mes %d% de descuento",
  "ob.s4.timer": "La oferta expira en",

  "ob.s5.eyebrow": "Paso 5 de 5 · Tu estantería",
  "ob.s5.title": "Una última cosa.",
  "ob.s5.subtitle": "Crea tu estantería y empieza tu prueba de 30 días. Cancela cuando quieras, reembolso a 30 días.",
  "ob.s5.email": "Correo",
  "ob.s5.password": "Contraseña",
  "ob.s5.name": "¿Cómo te llamamos?",
  "ob.s5.optional": "Opcional",
  "ob.s5.start": "Empezar mi prueba de 30 días →",

  "personality.scholar.name": "Erudito",
  "personality.scholar.body": "Lees para dominar. Los quizzes y citas son tus amigos. El plan Scholar mantiene tu programa traducido en cada idioma.",
  "personality.curious.name": "Explorador Políglota",
  "personality.curious.body": "Lees para vagar. Terminarías más libros si fluyeran. El plan Reader es tu compañero silencioso.",
  "personality.pro.name": "Mente Aguda",
  "personality.pro.body": "Lees para ir un paso adelante. Informes, papers, docs densos — traducidos y citables. El Scholar es para ti.",
  "personality.family.name": "Lector de Familia",
  "personality.family.body": "Leen juntos. El plan Family ofrece chat seguro, panel parental y cinco perfiles.",
};

const de: Dict = {
  "nav.how": "So funktioniert's",
  "nav.features": "Funktionen",
  "nav.pricing": "Preise",
  "nav.faq": "FAQ",
  "nav.login": "Anmelden",
  "nav.cta": "Loslegen",

  "hero.badge": "Für neugierige Leser, groß und klein",
  "hero.title.1": "Lies jedes Buch,",
  "hero.title.2": "in deiner Sprache",
  "hero.subtitle": "Lade ein PDF oder EPUB hoch und Translify behält das Layout exakt bei — nur übersetzt. Chatte dann mit deinem Buch und teste dich selbst, damit du wirklich behältst, was du liest.",
  "hero.cta.primary": "30-Tage-Test starten",
  "hero.cta.secondary": "Pläne ansehen",
  "hero.bullet.1": "Layout erhalten, Seite für Seite",
  "hero.bullet.2": "14 Sprachen, jede Schrift",
  "hero.bullet.3": "30 Tage Rückgabe, ohne Fragen",

  "pricing.badge": "Faire Preise · jederzeit kündbar",
  "pricing.title.1": "Wähle einen Plan.",
  "pricing.title.2": "Lies besser in 30 Tagen",
  "pricing.title.3": "— oder bekomme jeden Cent zurück.",
  "pricing.monthly": "Monatlich",
  "pricing.yearly": "Jährlich",
  "pricing.save": "20% sparen",
  "pricing.month": "/Mon",

  "ob.skip": "Überspringen — schon Mitglied",
  "ob.back": "Zurück",
  "ob.next": "Weiter",
  "ob.finish": "Plan freischalten",

  "ob.s1.eyebrow": "Schritt 1 von 5 · Erzähl uns von dir",
  "ob.s1.title": "Für wen liest du?",
  "ob.s1.subtitle": "Wir passen das Erlebnis an — Quizze, Vokabeln, sogar das Maskottchen.",
  "ob.s1.opt.student": "Ich bin Student",
  "ob.s1.opt.student.body": "Lehrbücher, Aufsätze, Lehrplan. Prüfung bestehen.",
  "ob.s1.opt.curious": "Ich bin leidenschaftlicher Leser",
  "ob.s1.opt.curious.body": "Romane, Essays, Klassiker. Lesen aus Freude.",
  "ob.s1.opt.pro": "Ich bin Profi",
  "ob.s1.opt.pro.body": "Berichte, technische Docs, Forschung. Bleib scharf.",
  "ob.s1.opt.family": "Lesen mit Kindern",
  "ob.s1.opt.family.body": "Gute-Nacht-Geschichten, Schulbücher, sicherer Chat.",

  "ob.s2.eyebrow": "Schritt 2 von 5 · Wähle deine Sprache",
  "ob.s2.title": "In welcher Sprache willst du lesen?",
  "ob.s2.subtitle": "Wir bauen jede Seite in deiner Zielsprache nach und behalten das Originallayout.",

  "ob.s3.eyebrow": "Schritt 3 von 5 · Dein Leseleben",
  "ob.s3.title": "Wie viele Bücher pro Monat?",
  "ob.s3.subtitle": "Schiebe zur ehrlichen Zahl — nicht zur Wunschzahl.",
  "ob.s3.unit.books": "Bücher / Monat",

  "ob.s4.eyebrow": "Schritt 4 von 5 · Die Enthüllung",
  "ob.s4.title.pre": "Du bist ein",
  "ob.s4.title.post": ".",
  "ob.s4.subtitle": "Basierend auf deinen Antworten — deine Lesepersönlichkeit und der passende Plan.",
  "ob.s4.recommended": "Dein Match",
  "ob.s4.savings": "Ersten Monat %d% Rabatt",
  "ob.s4.timer": "Angebot endet in",

  "ob.s5.eyebrow": "Schritt 5 von 5 · Erstelle dein Regal",
  "ob.s5.title": "Noch eine Sache.",
  "ob.s5.subtitle": "Erstelle dein Regal und starte deinen 30-Tage-Test. Jederzeit kündbar, 30 Tage Rückgabe.",
  "ob.s5.email": "E-Mail",
  "ob.s5.password": "Passwort",
  "ob.s5.name": "Wie sollen wir dich nennen?",
  "ob.s5.optional": "Optional",
  "ob.s5.start": "30-Tage-Test starten →",

  "personality.scholar.name": "Gelehrter",
  "personality.scholar.body": "Du liest, um zu meistern. Quizze und Zitate sind deine Freunde. Der Scholar-Plan hält deinen Lehrplan in jeder Sprache übersetzt.",
  "personality.curious.name": "Polyglotter Entdecker",
  "personality.curious.body": "Du liest, um zu wandern. Du würdest mehr Bücher beenden, wenn sie flössen. Reader ist dein leiser Begleiter.",
  "personality.pro.name": "Scharfer Geist",
  "personality.pro.body": "Du liest, um vorne zu bleiben. Berichte, Papers — übersetzt, zusammengefasst, zitierbar. Scholar ist für dich gemacht.",
  "personality.family.name": "Familienleser",
  "personality.family.body": "Ihr lest gemeinsam. Family bietet sicheren Chat, Eltern-Dashboard und fünf Profile.",
};

const ja: Dict = {
  "nav.how": "仕組み",
  "nav.features": "機能",
  "nav.pricing": "料金",
  "nav.faq": "よくある質問",
  "nav.login": "ログイン",
  "nav.cta": "はじめる",

  "hero.badge": "好奇心旺盛な読者へ、大人も子どもも",
  "hero.title.1": "どんな本でも、",
  "hero.title.2": "あなたの言葉で",
  "hero.subtitle": "PDFやEPUBをアップロードすれば、Translifyはレイアウトをそのまま保ち、翻訳だけを行います。本とチャットして、クイズで定着させ、本当に「読んだ」を実感できます。",
  "hero.cta.primary": "30日間無料で試す",
  "hero.cta.secondary": "プランを見る",
  "hero.bullet.1": "レイアウトをページごとに保持",
  "hero.bullet.2": "14言語、すべての文字体系",
  "hero.bullet.3": "30日以内なら全額返金",

  "pricing.badge": "明朗な価格 · いつでも解約可",
  "pricing.title.1": "プランを選ぶ。",
  "pricing.title.2": "30日でより良く読む",
  "pricing.title.3": "— または全額返金。",
  "pricing.monthly": "月額",
  "pricing.yearly": "年額",
  "pricing.save": "20%オフ",
  "pricing.month": "/月",

  "ob.skip": "スキップ — 既に会員",
  "ob.back": "戻る",
  "ob.next": "続ける",
  "ob.finish": "プランを解放する",

  "ob.s1.eyebrow": "5ステップ中の1 · あなたについて",
  "ob.s1.title": "誰のために読みますか？",
  "ob.s1.subtitle": "クイズ、語彙、マスコットまで — 体験をあなたに合わせます。",
  "ob.s1.opt.student": "学生です",
  "ob.s1.opt.student.body": "教科書、論文、シラバス。試験合格へ。",
  "ob.s1.opt.curious": "熱心な読者です",
  "ob.s1.opt.curious.body": "小説、エッセイ、古典。楽しみのために。",
  "ob.s1.opt.pro": "プロフェッショナルです",
  "ob.s1.opt.pro.body": "レポート、技術文書、研究。常に最先端へ。",
  "ob.s1.opt.family": "子どもと一緒に読みます",
  "ob.s1.opt.family.body": "おやすみ前のお話、教科書、安全なチャット。",

  "ob.s2.eyebrow": "5ステップ中の2 · 言語を選ぶ",
  "ob.s2.title": "どの言語で読みたいですか？",
  "ob.s2.subtitle": "元のレイアウトを保ちながら、対象言語で各ページを再構築します。",

  "ob.s3.eyebrow": "5ステップ中の3 · あなたの読書",
  "ob.s3.title": "月に何冊読みますか？",
  "ob.s3.subtitle": "理想ではなく、正直な数字までスライドしてください。",
  "ob.s3.unit.books": "冊 / 月",

  "ob.s4.eyebrow": "5ステップ中の4 · 結果発表",
  "ob.s4.title.pre": "あなたは",
  "ob.s4.title.post": "です。",
  "ob.s4.subtitle": "あなたの回答から、読書パーソナリティと最適なプランをご紹介します。",
  "ob.s4.recommended": "あなたにぴったり",
  "ob.s4.savings": "初月 %d% オフ",
  "ob.s4.timer": "オファー終了まで",

  "ob.s5.eyebrow": "5ステップ中の5 · 本棚を作る",
  "ob.s5.title": "最後にひとつだけ。",
  "ob.s5.subtitle": "本棚を作って30日間無料体験を開始。いつでも解約、30日以内なら全額返金。",
  "ob.s5.email": "メール",
  "ob.s5.password": "パスワード",
  "ob.s5.name": "お名前は？",
  "ob.s5.optional": "任意",
  "ob.s5.start": "30日間体験を開始 →",

  "personality.scholar.name": "学究の徒",
  "personality.scholar.body": "あなたは「習得」のために読みます。クイズと引用が頼りです。Scholarプランは全言語であなたのシラバスを翻訳し続けます。",
  "personality.curious.name": "多言語の探検家",
  "personality.curious.body": "あなたは「彷徨い」のために読みます。流れる言語ならもっと読み終えるでしょう。Readerは静かな相棒です。",
  "personality.pro.name": "鋭敏な知性",
  "personality.pro.body": "あなたは「先を行く」ために読みます。要約され引用可能な、翻訳されたレポートと文書を。Scholarが最適です。",
  "personality.family.name": "家族の読書家",
  "personality.family.body": "一緒に読む。Familyは安全なチャット、保護者ダッシュボード、5プロフィールを提供します。",
};

const ar: Dict = {
  "nav.how": "كيف يعمل",
  "nav.features": "الميزات",
  "nav.pricing": "الأسعار",
  "nav.faq": "الأسئلة الشائعة",
  "nav.login": "تسجيل الدخول",
  "nav.cta": "ابدأ الآن",

  "hero.badge": "للقرّاء الفضوليين، صغارًا وكبارًا",
  "hero.title.1": "اقرأ أي كتاب،",
  "hero.title.2": "بلغتك",
  "hero.subtitle": "ضع ملف PDF أو EPUB وسيُبقي Translify التنسيق كما هو تمامًا — مع ترجمة محتواه فقط. ثم تحدّث مع كتابك وأجرِ اختبارات قصيرة لتتذكّر فعلًا ما قرأت.",
  "hero.cta.primary": "ابدأ تجربة 30 يومًا",
  "hero.cta.secondary": "شاهد الخطط",
  "hero.bullet.1": "التنسيق محفوظ، صفحةً صفحة",
  "hero.bullet.2": "14 لغة، بكل أبجدية",
  "hero.bullet.3": "استرداد خلال 30 يومًا، دون أسئلة",

  "pricing.badge": "أسعار صادقة · ألغِ متى شئت",
  "pricing.title.1": "اختر خطة.",
  "pricing.title.2": "اقرأ أفضل في 30 يومًا",
  "pricing.title.3": "— أو استرد كل قرش.",
  "pricing.monthly": "شهريًا",
  "pricing.yearly": "سنويًا",
  "pricing.save": "وفّر 20%",
  "pricing.month": "/شهر",

  "ob.skip": "تخطّى — أنا عضو بالفعل",
  "ob.back": "رجوع",
  "ob.next": "متابعة",
  "ob.finish": "افتح خطتي",

  "ob.s1.eyebrow": "الخطوة 1 من 5 · حدّثنا عن نفسك",
  "ob.s1.title": "لمن تقرأ؟",
  "ob.s1.subtitle": "نُفصّل التجربة — الاختبارات، المفردات، حتى التميمة.",
  "ob.s1.opt.student": "أنا طالب",
  "ob.s1.opt.student.body": "كتب، أبحاث، منهج. اجتيازُ الامتحان.",
  "ob.s1.opt.curious": "أنا قارئ شغوف",
  "ob.s1.opt.curious.body": "روايات، مقالات، كلاسيكيات. القراءة للمتعة.",
  "ob.s1.opt.pro": "أنا محترف",
  "ob.s1.opt.pro.body": "تقارير، وثائق تقنية، أبحاث. ابقَ في الطليعة.",
  "ob.s1.opt.family": "أقرأ مع الأطفال",
  "ob.s1.opt.family.body": "قصص قبل النوم، كتب مدرسية، محادثة آمنة.",

  "ob.s2.eyebrow": "الخطوة 2 من 5 · اختر لغتك",
  "ob.s2.title": "بأي لغة تريد القراءة؟",
  "ob.s2.subtitle": "نُعيد بناء كل صفحة بلغتك الهدف مع الحفاظ على التنسيق الأصلي.",

  "ob.s3.eyebrow": "الخطوة 3 من 5 · حياتك مع القراءة",
  "ob.s3.title": "كم كتابًا في الشهر؟",
  "ob.s3.subtitle": "حرّك للرقم الصادق — لا الطموح.",
  "ob.s3.unit.books": "كتاب / شهر",

  "ob.s4.eyebrow": "الخطوة 4 من 5 · الكشف",
  "ob.s4.title.pre": "أنت",
  "ob.s4.title.post": ".",
  "ob.s4.subtitle": "بناءً على إجاباتك، هذه شخصيتك القرائية والخطة التي تناسبك.",
  "ob.s4.recommended": "اختيارك",
  "ob.s4.savings": "خصم %d% للشهر الأول",
  "ob.s4.timer": "العرض ينتهي خلال",

  "ob.s5.eyebrow": "الخطوة 5 من 5 · أنشئ رفّك",
  "ob.s5.title": "تفصيل أخير.",
  "ob.s5.subtitle": "أنشئ رفّك وابدأ تجربة 30 يومًا. ألغِ متى شئت، استرداد كامل خلال 30 يومًا.",
  "ob.s5.email": "البريد الإلكتروني",
  "ob.s5.password": "كلمة المرور",
  "ob.s5.name": "بماذا نناديك؟",
  "ob.s5.optional": "اختياري",
  "ob.s5.start": "← ابدأ تجربتي لـ 30 يومًا",

  "personality.scholar.name": "العالِم",
  "personality.scholar.body": "تقرأ لتُتقن. الاختبارات والاستشهادات صديقاك. خطة Scholar تُبقي منهجك مترجمًا في كل لغة تدرسها.",
  "personality.curious.name": "المستكشف متعدد اللغات",
  "personality.curious.body": "تقرأ لتسرح. ستُنهي كتبًا أكثر لو انسابت بلغة قريبة منك. خطة Reader رفيقك الهادئ.",
  "personality.pro.name": "العقل الحاد",
  "personality.pro.body": "تقرأ لتسبق. تقارير وأبحاث ووثائق كثيفة — مترجمة وملخّصة وقابلة للاقتباس. Scholar صُمّمت لك.",
  "personality.family.name": "قارئ العائلة",
  "personality.family.body": "تقرأون معًا. خطة Family تمنحك محادثة آمنة، لوحة للوالدين، وخمسة ملفات قارئ.",
};

const DICTS: Record<Locale, Dict> = { en, fr, es, de, ja, ar };

interface I18nValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "translify.locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = (typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null) as Locale | null;
    if (stored && DICTS[stored]) {
      setLocaleState(stored);
      return;
    }
    if (typeof navigator !== "undefined") {
      const nav = navigator.language.slice(0, 2) as Locale;
      if (DICTS[nav]) setLocaleState(nav);
    }
  }, []);

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTS[locale] ?? en;
      let s = dict[key] ?? en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(`%${k}%`, String(v));
        }
      }
      return s;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, dir, setLocale, t }), [locale, dir, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
