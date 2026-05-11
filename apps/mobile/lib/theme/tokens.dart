import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Translify brand tokens — paper-and-ink with saffron/sage/coral/plum accents.
class T {
  // Paper / ink — from design/brand.html
  static const paper = Color(0xFFFAF6EE);
  static const paper2 = Color(0xFFF4ECDB);
  static const paper3 = Color(0xFFE5D8BC); // border / divider
  static const ink = Color(0xFF20283A);
  static const inkSoft = Color(0xFF4A5263);
  static const inkMuted = Color(0xFF8A8E96);

  // Brand accents
  static const saffron = Color(0xFFE0A458);
  static const saffronDeep = Color(0xFFC8893E);
  static const sage = Color(0xFF7BA17C);
  static const sageDeep = Color(0xFF5F8763);
  static const coral = Color(0xFFE2786C);
  static const coralDeep = Color(0xFFC95A4E);
  static const plum = Color(0xFF6B5B95);
  static const plumSoft = Color(0xFF95A4C7);

  // Compatibility aliases — keep old token names mapped to brand colors so
  // existing screens auto-pick up the new palette without invasive edits.
  static const mint = sage;
  static const mintDeep = sageDeep;
  static const candy = coral;
  static const candyDeep = coralDeep;
  static const sky = plumSoft;
  static const skyDeep = plum;
  static const violet = plum;

  static const heart = coral;
  static const xp = saffron;

  /// Subtle layered shadow — softer than the old stacked-sticker look,
  /// matched to the brand card treatment.
  static List<BoxShadow> stickerShadow({double y = 4, Color color = ink}) => [
        BoxShadow(
          color: color.withValues(alpha: 0.04),
          offset: Offset(0, y * 0.5),
          blurRadius: 0,
        ),
        BoxShadow(
          color: ink.withValues(alpha: 0.14),
          offset: Offset(0, y + 6),
          blurRadius: 22,
          spreadRadius: -6,
        ),
      ];

  static const radiusLg = 28.0;
  static const radiusMd = 20.0;
  static const radiusSm = 14.0;
  static const radiusPill = 999.0;
}

ThemeData buildTheme() {
  final base = ThemeData.light(useMaterial3: true);
  final display = GoogleFonts.fraunces(color: T.ink);
  final body = GoogleFonts.hankenGrotesk(color: T.ink);

  return base.copyWith(
    scaffoldBackgroundColor: T.paper,
    colorScheme: ColorScheme.fromSeed(
      seedColor: T.saffron,
      primary: T.saffron,
      secondary: T.sage,
      tertiary: T.coral,
      surface: T.paper,
      onSurface: T.ink,
    ),
    textTheme: TextTheme(
      // Fraunces is a contrast serif — let it breathe with tight tracking.
      displayLarge: display.copyWith(
          fontSize: 52, height: 1.02, letterSpacing: -1.6, fontWeight: FontWeight.w400),
      displayMedium: display.copyWith(
          fontSize: 40, height: 1.05, letterSpacing: -1.2, fontWeight: FontWeight.w400),
      displaySmall: display.copyWith(
          fontSize: 30, height: 1.1, letterSpacing: -0.8, fontWeight: FontWeight.w400),
      headlineMedium: display.copyWith(
          fontSize: 24, height: 1.15, letterSpacing: -0.4, fontWeight: FontWeight.w500),
      headlineSmall: display.copyWith(
          fontSize: 20, height: 1.2, letterSpacing: -0.3, fontWeight: FontWeight.w500),
      titleLarge: GoogleFonts.hankenGrotesk(
          fontWeight: FontWeight.w700, fontSize: 18, color: T.ink),
      titleMedium: GoogleFonts.hankenGrotesk(
          fontWeight: FontWeight.w700, fontSize: 16, color: T.ink),
      bodyLarge: body.copyWith(fontSize: 16, height: 1.55),
      bodyMedium: body.copyWith(fontSize: 14, height: 1.55),
      labelLarge: GoogleFonts.hankenGrotesk(
        fontWeight: FontWeight.w700,
        fontSize: 14,
        color: T.ink,
        letterSpacing: 0.3,
      ),
    ),
    splashFactory: NoSplash.splashFactory,
    highlightColor: Colors.transparent,
    snackBarTheme: SnackBarThemeData(
      backgroundColor: T.ink,
      contentTextStyle: GoogleFonts.hankenGrotesk(
        color: T.paper, fontWeight: FontWeight.w600),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );
}
