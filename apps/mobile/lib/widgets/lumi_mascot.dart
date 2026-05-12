import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// Lumi's expressive states. Maps to the brand-book mascot states.
enum LumiMood { happy, thinking, cheer, sad, sleepy }

/// Lumi — Translify's paper-owl mascot. Drawn entirely in shapes, no images.
/// Reference: design/brand.html · design/mascot-lumi.svg
class LumiMascot extends StatefulWidget {
  const LumiMascot({super.key, this.mood = LumiMood.happy, this.size = 96});
  final LumiMood mood;
  final double size;

  @override
  State<LumiMascot> createState() => _LumiMascotState();
}

class _LumiMascotState extends State<LumiMascot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 4000),
  )..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Lumi's SVG is 180×200 — preserve that aspect ratio inside the requested
    // square so the owl doesn't squish at small sizes.
    final h = widget.size * (200 / 180);
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final t = _c.value; // 0..1
        // Slow float
        final floatAmp = widget.mood == LumiMood.cheer ? 6.0 : 3.0;
        final bob = math.sin(t * math.pi * 2) * floatAmp;
        // Slight tilt when thinking
        final tilt = widget.mood == LumiMood.thinking ? -0.06 : 0.0;
        return SizedBox(
          width: widget.size,
          height: h,
          child: Transform.translate(
            offset: Offset(0, bob),
            child: Transform.rotate(
              angle: tilt,
              child: CustomPaint(
                painter: _LumiPainter(mood: widget.mood, t: t),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _LumiPainter extends CustomPainter {
  _LumiPainter({required this.mood, required this.t});
  final LumiMood mood;
  final double t;

  // SVG viewBox is 180×200.
  static const double _vbW = 180;
  static const double _vbH = 200;

  @override
  void paint(Canvas canvas, Size size) {
    final scale = math.min(size.width / _vbW, size.height / _vbH);
    final drawnW = _vbW * scale;
    final drawnH = _vbH * scale;
    canvas.save();
    canvas.translate((size.width - drawnW) / 2, (size.height - drawnH) / 2);
    canvas.scale(scale);

    _drawShadow(canvas);
    _drawWing(canvas, mirror: false);
    _drawWing(canvas, mirror: true);
    _drawBody(canvas);
    _drawScarf(canvas);
    _drawHead(canvas);
    _drawEarTufts(canvas);
    _drawFaceDisc(canvas);
    _drawEyes(canvas);
    _drawBeak(canvas);
    _drawCheeks(canvas);
    _drawBellyLines(canvas);
    _drawTalons(canvas);
    _drawMoodExtras(canvas);

    canvas.restore();
  }

  // ── primitives ──────────────────────────────────────────────────────

  void _drawShadow(Canvas canvas) {
    final p = Paint()..color = T.ink.withValues(alpha: 0.10);
    canvas.drawOval(
      const Rect.fromLTWH(52, 190, 76, 12),
      p,
    );
  }

  /// Page-feather wing. Drawn on the left; `mirror` flips horizontally.
  void _drawWing(Canvas canvas, {required bool mirror}) {
    canvas.save();
    if (mirror) {
      canvas.translate(_vbW, 0);
      canvas.scale(-1, 1);
    }
    final fill = Paint()..color = T.paper2;
    final stroke = Paint()
      ..color = const Color(0xFFD4C29C)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final wing = Path()
      ..moveTo(42, 110)
      ..quadraticBezierTo(18, 90, 14, 60)
      ..quadraticBezierTo(20, 72, 30, 78)
      ..quadraticBezierTo(16, 62, 22, 42)
      ..quadraticBezierTo(28, 60, 38, 68)
      ..quadraticBezierTo(26, 50, 36, 32)
      ..quadraticBezierTo(40, 52, 48, 62)
      ..quadraticBezierTo(40, 80, 44, 108)
      ..close();
    canvas.drawPath(wing, fill);
    canvas.drawPath(wing, stroke);

    final featherLine = Paint()
      ..color = const Color(0xFFD4C29C).withValues(alpha: 0.7)
      ..strokeWidth = 0.8
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(const Offset(22, 56), const Offset(36, 64), featherLine);
    canvas.drawLine(const Offset(28, 72), const Offset(40, 78), featherLine);
    canvas.drawLine(const Offset(18, 68), const Offset(30, 74), featherLine);

    canvas.restore();
  }

  void _drawBody(Canvas canvas) {
    final body = Paint()..color = T.paper;
    final border = Paint()
      ..color = T.paper3
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(90, 126), width: 92, height: 108),
      body,
    );
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(90, 126), width: 92, height: 108),
      border,
    );

    // Tummy patch
    final tummy = Paint()..color = T.paper2;
    final tummyBorder = Paint()
      ..color = T.paper3
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(90, 136), width: 56, height: 68),
      tummy,
    );
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(90, 136), width: 56, height: 68),
      tummyBorder,
    );
  }

  void _drawScarf(Canvas canvas) {
    final scarfColor = mood == LumiMood.sleepy
        ? T.sage.withValues(alpha: 0.75)
        : T.sage;
    final scarf = Paint()..color = scarfColor;
    final p = Path()
      ..moveTo(56, 105)
      ..quadraticBezierTo(90, 96, 124, 105)
      ..quadraticBezierTo(118, 116, 90, 118)
      ..quadraticBezierTo(62, 116, 56, 105)
      ..close();
    canvas.drawPath(p, scarf);

    final fold = Paint()
      ..color = T.sageDeep
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    final foldPath = Path()
      ..moveTo(85, 115)
      ..quadraticBezierTo(90, 122, 95, 115);
    canvas.drawPath(foldPath, fold);
  }

  void _drawHead(Canvas canvas) {
    final head = Paint()..color = T.paper;
    final border = Paint()
      ..color = T.paper3
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(90, 84), width: 76, height: 72),
      head,
    );
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(90, 84), width: 76, height: 72),
      border,
    );
  }

  void _drawEarTufts(Canvas canvas) {
    final fill = Paint()..color = T.paper;
    final stroke = Paint()
      ..color = const Color(0xFFD4C29C)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeJoin = StrokeJoin.round;
    final innerSaffron = Paint()
      ..color = T.saffron.withValues(alpha: 0.40);

    final lt = Path()
      ..moveTo(60, 58)
      ..lineTo(54, 42)
      ..lineTo(68, 54)
      ..close();
    final rt = Path()
      ..moveTo(120, 58)
      ..lineTo(126, 42)
      ..lineTo(112, 54)
      ..close();
    canvas.drawPath(lt, fill);
    canvas.drawPath(lt, stroke);
    canvas.drawPath(rt, fill);
    canvas.drawPath(rt, stroke);

    final ltInner = Path()
      ..moveTo(61, 55)
      ..lineTo(57, 46)
      ..lineTo(66, 53)
      ..close();
    final rtInner = Path()
      ..moveTo(119, 55)
      ..lineTo(123, 46)
      ..lineTo(114, 53)
      ..close();
    canvas.drawPath(ltInner, innerSaffron);
    canvas.drawPath(rtInner, innerSaffron);
  }

  void _drawFaceDisc(Canvas canvas) {
    // Dashed feather ring. Flutter has no native dash — emulate with arcs.
    final paint = Paint()
      ..color = T.paper3
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    final rect = Rect.fromCenter(
        center: const Offset(90, 86), width: 60, height: 56);
    const dash = 0.30; // radians per dash
    const gap = 0.20;
    double angle = 0;
    while (angle < math.pi * 2) {
      canvas.drawArc(rect, angle, dash, false, paint);
      angle += dash + gap;
    }
  }

  void _drawEyes(Canvas canvas) {
    // Eye geometry from the SVG.
    const lEye = Offset(75, 82);
    const rEye = Offset(105, 82);

    // Blink: short pulse every cycle.
    final blink = (mood != LumiMood.sleepy) &&
        (math.sin(t * math.pi * 2 + math.pi / 2) > 0.97);
    final closed = blink || mood == LumiMood.sleepy;

    if (mood == LumiMood.happy || mood == LumiMood.cheer) {
      _drawHappyEye(canvas, lEye);
      _drawHappyEye(canvas, rEye);
      return;
    }
    if (mood == LumiMood.thinking) {
      _drawSquintEye(canvas, lEye);
      _drawSquintEye(canvas, rEye);
      return;
    }
    if (closed) {
      _drawClosedEye(canvas, lEye);
      _drawClosedEye(canvas, rEye);
      return;
    }
    // Default open — bi-script flourishes.
    _drawOpenEye(canvas, lEye, leftSide: true);
    _drawOpenEye(canvas, rEye, leftSide: false);
  }

  void _drawOpenEye(Canvas canvas, Offset c, {required bool leftSide}) {
    final ringInk = Paint()..color = T.ink;
    final white = Paint()..color = Colors.white;
    final pupil = Paint()..color = T.ink;
    final glint = Paint()..color = Colors.white;

    canvas.drawCircle(c, 12, ringInk);
    canvas.drawCircle(c, 10, white);

    // Pupil — sad mood droops pupil down.
    final pupilOffset = mood == LumiMood.sad ? const Offset(0, 2) : Offset.zero;
    canvas.drawCircle(c + pupilOffset + const Offset(0, 1), 6, pupil);
    canvas.drawCircle(c + pupilOffset + const Offset(2, -2), 2, glint);

    // Bi-script flourish under the iris.
    final accent = Paint()
      ..color = leftSide ? T.saffron : T.sage
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    if (leftSide) {
      // Arabic-style crescent curl
      final p = Path()
        ..moveTo(c.dx - 4, c.dy + 2)
        ..quadraticBezierTo(c.dx - 2, c.dy + 6, c.dx + 1, c.dy + 2);
      canvas.drawPath(p, accent);
    } else {
      // Latin serif flourish
      final p = Path()
        ..moveTo(c.dx - 3, c.dy + 5)
        ..lineTo(c.dx - 1, c.dy + 2)
        ..lineTo(c.dx + 1, c.dy + 5);
      canvas.drawPath(p, accent);
    }
  }

  void _drawHappyEye(Canvas canvas, Offset c) {
    final paint = Paint()
      ..color = T.ink
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;
    final p = Path()
      ..moveTo(c.dx - 9, c.dy + 3)
      ..quadraticBezierTo(c.dx, c.dy - 4, c.dx + 9, c.dy + 3);
    canvas.drawPath(p, paint);
  }

  void _drawSquintEye(Canvas canvas, Offset c) {
    final paint = Paint()
      ..color = T.ink
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;
    final p = Path()
      ..moveTo(c.dx - 8, c.dy)
      ..quadraticBezierTo(c.dx, c.dy - 5, c.dx + 8, c.dy);
    canvas.drawPath(p, paint);
  }

  void _drawClosedEye(Canvas canvas, Offset c) {
    final paint = Paint()
      ..color = const Color(0xFFD4C29C)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(c + const Offset(-7, 0), c + const Offset(7, 0), paint);
  }

  void _drawBeak(Canvas canvas) {
    final beak = Paint()..color = T.saffron;
    final p = Path()
      ..moveTo(85, 92)
      ..lineTo(90, 100)
      ..lineTo(95, 92)
      ..quadraticBezierTo(90, 89, 85, 92)
      ..close();
    canvas.drawPath(p, beak);
  }

  void _drawCheeks(Canvas canvas) {
    if (mood != LumiMood.happy && mood != LumiMood.cheer) return;
    final blush = Paint()..color = T.coral.withValues(alpha: 0.30);
    canvas.drawCircle(const Offset(63, 92), 6, blush);
    canvas.drawCircle(const Offset(117, 92), 6, blush);
  }

  void _drawBellyLines(Canvas canvas) {
    final ink = Paint()
      ..color = const Color(0xFFD4C29C)
      ..strokeWidth = 1.2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(const Offset(70, 140), const Offset(110, 140), ink);
    canvas.drawLine(const Offset(72, 149), const Offset(108, 149), ink);
    canvas.drawLine(const Offset(75, 158), const Offset(104, 158), ink);
  }

  void _drawTalons(Canvas canvas) {
    final talon = Paint()
      ..color = const Color(0xFFD4C29C)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    for (final cx in [72.0, 108.0]) {
      // Three little curves per foot.
      canvas.drawLine(Offset(cx, 180), Offset(cx - 8, 187), talon);
      canvas.drawLine(Offset(cx, 180), Offset(cx, 188), talon);
      canvas.drawLine(Offset(cx, 180), Offset(cx + 8, 187), talon);
    }
  }

  // ── mood-specific overlays ──────────────────────────────────────────

  void _drawMoodExtras(Canvas canvas) {
    switch (mood) {
      case LumiMood.thinking:
        _drawThoughtDots(canvas);
        break;
      case LumiMood.sad:
        _drawTear(canvas);
        break;
      case LumiMood.sleepy:
        _drawZs(canvas);
        break;
      case LumiMood.cheer:
        _drawSparkles(canvas);
        break;
      case LumiMood.happy:
        break;
    }
  }

  void _drawThoughtDots(Canvas canvas) {
    final dot = Paint()..color = T.saffron;
    canvas.drawCircle(const Offset(128, 54), 3, dot..color = T.saffron.withValues(alpha: 0.7));
    canvas.drawCircle(const Offset(137, 42), 5, dot..color = T.saffron.withValues(alpha: 0.85));
    canvas.drawCircle(const Offset(148, 28), 8, dot..color = T.saffron);
  }

  void _drawTear(Canvas canvas) {
    final tear = Paint()..color = T.plumSoft;
    final p = Path()
      ..moveTo(108, 88)
      ..quadraticBezierTo(110, 96, 112, 92)
      ..quadraticBezierTo(114, 88, 108, 88)
      ..close();
    canvas.drawPath(p, tear);
  }

  void _drawZs(Canvas canvas) {
    final style = TextStyle(
      color: T.inkSoft.withValues(alpha: 0.5),
      fontSize: 12,
      fontStyle: FontStyle.italic,
      fontWeight: FontWeight.w700,
    );
    final positions = [
      (const Offset(124, 60), 12.0, 0.5),
      (const Offset(132, 48), 9.0, 0.4),
      (const Offset(140, 38), 7.0, 0.3),
    ];
    for (final (pos, fs, alpha) in positions) {
      final tp = TextPainter(
        text: TextSpan(
          text: 'z',
          style: style.copyWith(
            fontSize: fs,
            color: T.inkSoft.withValues(alpha: alpha),
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, pos);
    }
  }

  void _drawSparkles(Canvas canvas) {
    // Three sparkles pulsing on different phases.
    final phases = [0.0, 0.33, 0.66];
    final positions = [
      const Offset(28, 36),
      const Offset(150, 50),
      const Offset(40, 130),
    ];
    final colors = [T.saffron, T.sage, T.coral];
    for (var i = 0; i < 3; i++) {
      final phase = (t + phases[i]) % 1.0;
      final scale = math.sin(phase * math.pi);
      if (scale <= 0) continue;
      final paint = Paint()
        ..color = colors[i].withValues(alpha: scale.clamp(0, 1));
      _drawSparkleStar(canvas, positions[i], 4 * scale, paint);
    }
  }

  void _drawSparkleStar(Canvas canvas, Offset c, double r, Paint paint) {
    if (r <= 0) return;
    final p = Path()
      ..moveTo(c.dx, c.dy - r)
      ..lineTo(c.dx + r * 0.3, c.dy - r * 0.3)
      ..lineTo(c.dx + r, c.dy)
      ..lineTo(c.dx + r * 0.3, c.dy + r * 0.3)
      ..lineTo(c.dx, c.dy + r)
      ..lineTo(c.dx - r * 0.3, c.dy + r * 0.3)
      ..lineTo(c.dx - r, c.dy)
      ..lineTo(c.dx - r * 0.3, c.dy - r * 0.3)
      ..close();
    canvas.drawPath(p, paint);
  }

  @override
  bool shouldRepaint(covariant _LumiPainter old) =>
      old.mood != mood || old.t != t;
}
