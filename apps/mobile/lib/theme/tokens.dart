import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// "Translify Quest" tokens — sticker-stack scrapbook with candy accents.
class T {
  // Paper / ink
  static const paper = Color(0xFFFFF6E5);
  static const paper2 = Color(0xFFFBEBC8);
  static const paper3 = Color(0xFFF3DFA9);
  static const ink = Color(0xFF1F1A2E);
  static const inkSoft = Color(0xFF5A506E);
  static const inkMuted = Color(0xFF8A7E9E);

  // Candy accents
  static const saffron = Color(0xFFFFB627);
  static const saffronDeep = Color(0xFFE69500);
  static const mint = Color(0xFF7CD9B6);
  static const mintDeep = Color(0xFF2EA67E);
  static const candy = Color(0xFFFF7B9C);
  static const candyDeep = Color(0xFFE0426A);
  static const sky = Color(0xFF6FB9F0);
  static const skyDeep = Color(0xFF2F86C9);
  static const violet = Color(0xFFB28DFF);

  static const heart = Color(0xFFFF4D6D);
  static const xp = Color(0xFFFFB627);

  // Stacked-paper shadow used throughout.
  static List<BoxShadow> stickerShadow({double y = 4, Color color = ink}) => [
        BoxShadow(
          color: color.withValues(alpha: 0.18),
          offset: Offset(0, y),
          blurRadius: 0,
        ),
        BoxShadow(
          color: ink.withValues(alpha: 0.12),
          offset: Offset(0, y + 6),
          blurRadius: 14,
        ),
      ];

  static const radiusLg = 28.0;
  static const radiusMd = 20.0;
  static const radiusSm = 14.0;
  static const radiusPill = 999.0;
}

ThemeData buildTheme() {
  final base = ThemeData.light(useMaterial3: true);
  final display = GoogleFonts.lilitaOne(color: T.ink);
  final body = GoogleFonts.nunito(color: T.ink);

  return base.copyWith(
    scaffoldBackgroundColor: T.paper,
    colorScheme: ColorScheme.fromSeed(
      seedColor: T.saffron,
      primary: T.saffron,
      secondary: T.candy,
      tertiary: T.mint,
      surface: T.paper,
      onSurface: T.ink,
    ),
    textTheme: TextTheme(
      displayLarge: display.copyWith(fontSize: 56, height: 1.0, letterSpacing: -1.5),
      displayMedium: display.copyWith(fontSize: 42, height: 1.05, letterSpacing: -1.0),
      displaySmall: display.copyWith(fontSize: 32, height: 1.1, letterSpacing: -0.6),
      headlineMedium: display.copyWith(fontSize: 26, height: 1.15),
      headlineSmall: display.copyWith(fontSize: 20, height: 1.2),
      titleLarge: GoogleFonts.nunito(
        fontWeight: FontWeight.w800, fontSize: 18, color: T.ink),
      titleMedium: GoogleFonts.nunito(
        fontWeight: FontWeight.w800, fontSize: 16, color: T.ink),
      bodyLarge: body.copyWith(fontSize: 16, height: 1.5),
      bodyMedium: body.copyWith(fontSize: 14, height: 1.5),
      labelLarge: GoogleFonts.nunito(
        fontWeight: FontWeight.w800,
        fontSize: 14,
        color: T.ink,
        letterSpacing: 0.4,
      ),
    ),
    splashFactory: NoSplash.splashFactory,
    highlightColor: Colors.transparent,
    snackBarTheme: SnackBarThemeData(
      backgroundColor: T.ink,
      contentTextStyle: GoogleFonts.nunito(
        color: T.paper, fontWeight: FontWeight.w700),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );
}
