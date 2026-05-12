import 'package:flutter/material.dart';

import '../api/models.dart';
import '../theme/tokens.dart';
import 'farmer_painter.dart';
import 'plant_painter.dart';

/// "Plant stage" diorama — parchment card with the plant, farmer and soil bar.
/// Direct adaptation of the web `PlantStage` (weekly-tending-flow.tsx) tuned
/// for a phone width.
class PlantStage extends StatelessWidget {
  const PlantStage({
    super.key,
    required this.species,
    required this.stage,
    required this.farmer,
    this.wilting = false,
    this.caption,
    this.stamp,
    this.stampWarn = false,
    this.height = 320,
  });

  final GardenSpecies species;
  final int stage;
  final Farmer farmer;
  final bool wilting;
  final String? caption;
  final String? stamp;
  final bool stampWarn;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFFCF3), T.paper2],
        ),
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.paper3, width: 1.4),
        boxShadow: [
          BoxShadow(
            color: T.ink.withValues(alpha: 0.18),
            blurRadius: 30,
            offset: const Offset(0, 18),
            spreadRadius: -16,
          ),
        ],
      ),
      padding: const EdgeInsets.all(14),
      child: SizedBox(
        height: height,
        child: Stack(
          children: [
            // Dashed inner border
            Positioned.fill(
              child: IgnorePointer(
                child: CustomPaint(
                  painter: _DashedBorderPainter(
                    color: T.paper3.withValues(alpha: 0.7),
                    radius: T.radiusSm,
                  ),
                ),
              ),
            ),
            // Glass dome
            Positioned(
              left: 14,
              right: 14,
              top: 12,
              bottom: 50,
              child: IgnorePointer(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(140),
                      bottom: Radius.circular(8),
                    ),
                    border: Border.all(
                      color: const Color(0xFF20283A).withValues(alpha: 0.10),
                      width: 1,
                    ),
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.white.withValues(alpha: 0.36),
                        Colors.white.withValues(alpha: 0.06),
                        const Color(0xFFB4A06E).withValues(alpha: 0.07),
                      ],
                      stops: const [0, 0.3, 1],
                    ),
                  ),
                ),
              ),
            ),
            // Plant — centered
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Center(
                child: PlantSvg(
                  species: species,
                  stage: stage,
                  wilting: wilting,
                  width: 200,
                  height: height - 80,
                ),
              ),
            ),
            // Farmer — bottom-right corner
            Positioned(
              right: 14,
              bottom: 32,
              child: FarmerSvg(farmer: farmer, width: 64, height: 96),
            ),
            // Wooden soil bar
            Positioned(
              left: 14,
              right: 14,
              bottom: 12,
              child: Container(
                height: 36,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(6),
                    bottom: Radius.circular(10),
                  ),
                  gradient: const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFF8B6939), Color(0xFF5A4423)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.25),
                      blurRadius: 8,
                      offset: const Offset(0, -2),
                      blurStyle: BlurStyle.inner,
                    ),
                  ],
                ),
                child: Container(
                  margin: const EdgeInsets.only(top: 2),
                  decoration: const BoxDecoration(
                    border: Border(
                      top: BorderSide(color: Color(0xFFA38456), width: 1.5),
                    ),
                  ),
                ),
              ),
            ),
            // Result stamp (optional)
            if (stamp != null)
              Positioned.fill(
                child: Center(
                  child: _Stamp(text: stamp!, warn: stampWarn),
                ),
              ),
            // Caption underneath
            if (caption != null)
              Positioned(
                left: 0,
                right: 0,
                bottom: -2,
                child: Center(
                  child: Text(
                    caption!,
                    style: const TextStyle(
                      color: T.inkSoft,
                      fontStyle: FontStyle.italic,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Stamp extends StatelessWidget {
  const _Stamp({required this.text, required this.warn});
  final String text;
  final bool warn;

  @override
  Widget build(BuildContext context) {
    final tone = warn ? T.coralDeep : T.sageDeep;
    final bg = (warn ? T.coral : T.sage).withValues(alpha: 0.18);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      curve: Curves.elasticOut,
      duration: const Duration(milliseconds: 700),
      builder: (context, v, child) {
        return Transform.scale(scale: v.clamp(0, 1), child: child);
      },
      child: Transform.rotate(
        angle: -0.16,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 8),
          decoration: BoxDecoration(
            color: bg,
            border: Border.all(color: tone, width: 3),
            borderRadius: BorderRadius.circular(4),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFFFAED).withValues(alpha: 0.4),
                blurRadius: 0,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Text(
            text,
            style: TextStyle(
              color: tone,
              fontWeight: FontWeight.w700,
              fontSize: 22,
              letterSpacing: 3.0,
            ),
          ),
        ),
      ),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  _DashedBorderPainter({required this.color, required this.radius});
  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    // 14-pixel inset matches the design.
    final rect = Rect.fromLTWH(8, 8, size.width - 16, size.height - 16);
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(radius));
    final path = Path()..addRRect(rrect);
    _drawDashed(canvas, path, paint, dash: 4, gap: 4);
  }

  void _drawDashed(Canvas canvas, Path source, Paint paint,
      {required double dash, required double gap}) {
    for (final metric in source.computeMetrics()) {
      double dist = 0;
      while (dist < metric.length) {
        final next = (dist + dash).clamp(0.0, metric.length);
        canvas.drawPath(metric.extractPath(dist, next), paint);
        dist = next + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedBorderPainter old) =>
      old.color != color || old.radius != radius;
}
