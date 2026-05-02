import 'package:flutter/material.dart';

import '../theme/tokens.dart';

enum OwlMood { happy, thinking, cheer, sad, sleepy }

/// Polyglot — the Translify Quest mascot. Drawn entirely in shapes, no images.
class OwlMascot extends StatefulWidget {
  const OwlMascot({super.key, this.mood = OwlMood.happy, this.size = 96});
  final OwlMood mood;
  final double size;

  @override
  State<OwlMascot> createState() => _OwlMascotState();
}

class _OwlMascotState extends State<OwlMascot> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 2200))
        ..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final t = _c.value;
        final bob = (widget.mood == OwlMood.cheer ? 6.0 : 3.0) * (t - 0.5);
        final tilt = widget.mood == OwlMood.thinking ? -0.08 : 0.0;
        return Transform.translate(
          offset: Offset(0, bob),
          child: Transform.rotate(
            angle: tilt,
            child: SizedBox(
              width: widget.size,
              height: widget.size,
              child: CustomPaint(
                painter: _OwlPainter(mood: widget.mood, blink: t),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _OwlPainter extends CustomPainter {
  _OwlPainter({required this.mood, required this.blink});
  final OwlMood mood;
  final double blink;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final cx = w / 2;

    // Drop shadow (sticker shadow)
    final shadow = Paint()
      ..color = T.ink.withValues(alpha: 0.25)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
    canvas.drawOval(
      Rect.fromCenter(center: Offset(cx, h * 0.92), width: w * 0.7, height: h * 0.08),
      shadow,
    );

    // Body
    final body = Paint()..color = T.violet;
    final bodyPath = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(cx, h * 0.55),
        width: w * 0.86,
        height: h * 0.78,
      ));
    canvas.drawPath(bodyPath, body);

    // Tummy patch
    final tummy = Paint()..color = T.paper;
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(cx, h * 0.62),
        width: w * 0.5,
        height: h * 0.5,
      ),
      tummy,
    );

    // Ears (tufts)
    final tuft = Paint()..color = T.violet;
    final lt = Path()
      ..moveTo(cx - w * 0.32, h * 0.18)
      ..lineTo(cx - w * 0.18, h * 0.02)
      ..lineTo(cx - w * 0.10, h * 0.22)
      ..close();
    final rt = Path()
      ..moveTo(cx + w * 0.32, h * 0.18)
      ..lineTo(cx + w * 0.18, h * 0.02)
      ..lineTo(cx + w * 0.10, h * 0.22)
      ..close();
    canvas.drawPath(lt, tuft);
    canvas.drawPath(rt, tuft);

    // Eye discs
    final disc = Paint()..color = T.paper;
    final lEye = Offset(cx - w * 0.18, h * 0.40);
    final rEye = Offset(cx + w * 0.18, h * 0.40);
    final discR = w * 0.16;
    canvas.drawCircle(lEye, discR, disc);
    canvas.drawCircle(rEye, discR, disc);

    // Eye outlines
    final ring = Paint()
      ..color = T.ink.withValues(alpha: 0.18)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.012;
    canvas.drawCircle(lEye, discR, ring);
    canvas.drawCircle(rEye, discR, ring);

    // Pupils — react to mood
    final pupil = Paint()..color = T.ink;
    final closed = (mood != OwlMood.sleepy) && blink > 0.96;
    final pupilOffset = switch (mood) {
      OwlMood.thinking => Offset(-w * 0.03, -h * 0.01),
      OwlMood.cheer => Offset(0, -h * 0.02),
      OwlMood.sad => Offset(0, h * 0.02),
      _ => Offset.zero,
    };
    if (closed || mood == OwlMood.sleepy) {
      // closed eye lines
      final lid = Paint()
        ..color = T.ink
        ..strokeWidth = w * 0.022
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round;
      canvas.drawLine(
        lEye + Offset(-w * 0.05, 0),
        lEye + Offset(w * 0.05, 0),
        lid,
      );
      canvas.drawLine(
        rEye + Offset(-w * 0.05, 0),
        rEye + Offset(w * 0.05, 0),
        lid,
      );
    } else {
      canvas.drawCircle(lEye + pupilOffset, w * 0.05, pupil);
      canvas.drawCircle(rEye + pupilOffset, w * 0.05, pupil);
      // Sparkle
      final sparkle = Paint()..color = T.paper;
      canvas.drawCircle(lEye + pupilOffset + Offset(w * 0.018, -h * 0.018), w * 0.014, sparkle);
      canvas.drawCircle(rEye + pupilOffset + Offset(w * 0.018, -h * 0.018), w * 0.014, sparkle);
    }

    // Beak
    final beak = Paint()..color = T.saffron;
    final beakPath = Path()
      ..moveTo(cx, h * 0.50)
      ..lineTo(cx - w * 0.06, h * 0.58)
      ..lineTo(cx + w * 0.06, h * 0.58)
      ..close();
    canvas.drawPath(beakPath, beak);

    // Cheek blush (cheer / happy)
    if (mood == OwlMood.cheer || mood == OwlMood.happy) {
      final blush = Paint()..color = T.candy.withValues(alpha: 0.55);
      canvas.drawCircle(Offset(cx - w * 0.30, h * 0.55), w * 0.06, blush);
      canvas.drawCircle(Offset(cx + w * 0.30, h * 0.55), w * 0.06, blush);
    }

    // Tear (sad)
    if (mood == OwlMood.sad) {
      final tear = Paint()..color = T.sky;
      final p = Path()
        ..moveTo(cx + w * 0.18, h * 0.46)
        ..quadraticBezierTo(
            cx + w * 0.20, h * 0.55, cx + w * 0.22, h * 0.50)
        ..quadraticBezierTo(
            cx + w * 0.24, h * 0.46, cx + w * 0.18, h * 0.46)
        ..close();
      canvas.drawPath(p, tear);
    }
  }

  @override
  bool shouldRepaint(covariant _OwlPainter old) => old.mood != mood || old.blink != blink;
}
