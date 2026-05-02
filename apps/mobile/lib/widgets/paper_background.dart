import 'dart:math' as math;
import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// Warm paper canvas — radial sun glow + faint grain dots.
class PaperBackground extends StatelessWidget {
  const PaperBackground({super.key, this.child, this.glow = T.saffron});
  final Widget? child;
  final Color glow;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [T.paper, T.paper2],
              ),
            ),
          ),
        ),
        Positioned(
          top: -120,
          right: -80,
          child: _glowOrb(glow.withValues(alpha: 0.55), 320),
        ),
        Positioned(
          bottom: -160,
          left: -100,
          child: _glowOrb(T.candy.withValues(alpha: 0.18), 360),
        ),
        Positioned.fill(
          child: IgnorePointer(
            child: CustomPaint(painter: _GrainPainter()),
          ),
        ),
        if (child != null) Positioned.fill(child: child!),
      ],
    );
  }

  Widget _glowOrb(Color color, double size) => IgnorePointer(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [color, color.withValues(alpha: 0)]),
          ),
        ),
      );
}

class _GrainPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rng = math.Random(42);
    final paint = Paint()..color = T.ink.withValues(alpha: 0.03);
    final count = (size.width * size.height / 800).round().clamp(80, 1200);
    for (int i = 0; i < count; i++) {
      final x = rng.nextDouble() * size.width;
      final y = rng.nextDouble() * size.height;
      final r = rng.nextDouble() * 0.9 + 0.2;
      canvas.drawCircle(Offset(x, y), r, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
