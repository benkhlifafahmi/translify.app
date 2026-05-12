import 'package:flutter/material.dart';

import '../api/models.dart';
import '../theme/tokens.dart';
import 'farmer_painter.dart';
import 'plant_painter.dart';

/// Editorial herbarium "plate" — the visual hero on the Garden tab.
/// Direct port of apps/web/src/components/garden/garden-plate.tsx, tuned for
/// portrait phone widths.
class GardenPlate extends StatelessWidget {
  const GardenPlate({super.key, required this.garden});
  final Garden garden;

  static const _stageNames = [
    'seed',
    'sprout',
    'seedling',
    'stem',
    'bud forming',
    'in flower',
    'full bloom',
  ];

  String get _speciesName => switch (garden.species) {
        GardenSpecies.ficus => 'Ficus litteraria',
        GardenSpecies.helianthus => 'Helianthus',
        GardenSpecies.lavandula => 'Lavandula',
        GardenSpecies.monstera => 'Monstera',
      };

  String get _soilFlavor => switch (garden.species) {
        GardenSpecies.ficus => 'magical realism',
        GardenSpecies.helianthus => 'long verse',
        GardenSpecies.lavandula => 'careful essay',
        GardenSpecies.monstera => 'epic prose',
      };

  @override
  Widget build(BuildContext context) {
    final wilting = garden.vitality <= 1;
    final day = garden.daysSinceStart;
    final stageRoman = _romanize(garden.stage);
    final lastFour = garden.bookId.length >= 4
        ? garden.bookId.substring(garden.bookId.length - 4).toUpperCase()
        : garden.bookId.toUpperCase();

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFFCF3), T.paper2],
        ),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: T.paper3, width: 1),
        boxShadow: [
          BoxShadow(
            color: T.ink.withValues(alpha: 0.18),
            blurRadius: 30,
            offset: const Offset(0, 18),
            spreadRadius: -16,
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
      child: Column(
        children: [
          // ── Specimen header line ──
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Expanded(
                child: RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      color: T.sageDeep,
                      fontStyle: FontStyle.italic,
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                    ),
                    children: [
                      const TextSpan(text: 'specimen — '),
                      TextSpan(
                        text: _speciesName,
                        style: const TextStyle(
                          fontStyle: FontStyle.normal,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Text(
                '№ 04 · $lastFour',
                style: const TextStyle(
                  color: T.inkMuted,
                  fontSize: 11,
                  letterSpacing: 2.2,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          // ── Soil-of italic sub-line ──
          Align(
            alignment: Alignment.centerLeft,
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                  color: T.inkMuted,
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  height: 1.4,
                ),
                children: [
                  const TextSpan(text: 'cultivated in the soil of '),
                  TextSpan(
                    text: _soilFlavor,
                    style: const TextStyle(
                      decoration: TextDecoration.underline,
                      decorationStyle: TextDecorationStyle.dotted,
                    ),
                  ),
                  TextSpan(text: ' · stage $stageRoman of VII'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 6),
          // ── Scene (dashed frame + dome + plant + farmer + soil) ──
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
            ),
            child: SizedBox(
              height: 320,
              child: Stack(
                children: [
                  // dashed inner frame
                  Positioned.fill(
                    child: IgnorePointer(
                      child: CustomPaint(
                        painter: _DashedFramePainter(),
                      ),
                    ),
                  ),
                  // glass dome
                  Positioned(
                    left: 24,
                    right: 24,
                    top: 10,
                    bottom: 60,
                    child: IgnorePointer(
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(160),
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
                        // highlight streak
                        child: Stack(
                          children: [
                            Positioned(
                              left: 42,
                              top: 18,
                              child: Transform.rotate(
                                angle: -0.14,
                                child: Container(
                                  width: 22,
                                  height: 110,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(99),
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [
                                        Colors.white.withValues(alpha: 0.55),
                                        Colors.white.withValues(alpha: 0.0),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  // PLANT
                  Positioned(
                    left: 0,
                    right: 0,
                    top: 12,
                    bottom: 70,
                    child: Center(
                      child: PlantSvg(
                        species: garden.species,
                        stage: garden.stage,
                        wilting: wilting,
                        width: 220,
                        height: 250,
                      ),
                    ),
                  ),
                  // FARMER
                  Positioned(
                    right: 22,
                    bottom: 36,
                    child: FarmerSvg(
                      farmer: garden.farmer,
                      width: 60,
                      height: 92,
                    ),
                  ),
                  // SOIL with dirt dots
                  Positioned(
                    left: 24,
                    right: 24,
                    bottom: 16,
                    child: SizedBox(
                      height: 42,
                      child: CustomPaint(
                        painter: _SoilPainter(),
                      ),
                    ),
                  ),
                  // ── Margin annotations (handwritten Fraunces italic) ──
                  if (garden.newLeaves > 0)
                    const Positioned(
                      right: 6,
                      top: 90,
                      child: _MarginNote(
                        text: 'new bud\nthis morning',
                        color: T.coralDeep,
                        rotation: 0.05,
                        align: TextAlign.right,
                        glyph: '↩',
                      ),
                    ),
                  Positioned(
                    left: 8,
                    bottom: 130,
                    child: _MarginNote(
                      text:
                          '※ watered by ch. ${garden.pagesRead < 200 ? 1 : (garden.pagesRead - 200)}',
                      color: T.sageDeep,
                      rotation: -0.04,
                      align: TextAlign.left,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // ── Caption strip ──
          Container(
            margin: const EdgeInsets.only(top: 4),
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: T.paper3.withValues(alpha: 0.6),
                  width: 1,
                ),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _CaptionBlock(
                    label: 'Drawn from life',
                    body: garden.farmer.name.isEmpty
                        ? 'The Garden of ${garden.bookTitle}, day $day'
                        : 'The Garden of ${garden.farmer.name}, day $day',
                  ),
                ),
                Expanded(
                  child: _CaptionBlock(
                    label: 'Hand · Translify Almanac',
                    body:
                        'fig. ${stageRoman.toLowerCase()} · ${_stageNames[garden.stage.clamp(0, 6)]}',
                    align: TextAlign.right,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _romanize(int n) {
    const map = ['O', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    return n >= 0 && n < map.length ? map[n] : '$n';
  }
}

class _CaptionBlock extends StatelessWidget {
  const _CaptionBlock({
    required this.label,
    required this.body,
    this.align = TextAlign.left,
  });
  final String label;
  final String body;
  final TextAlign align;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: align == TextAlign.right
          ? CrossAxisAlignment.end
          : CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          textAlign: align,
          style: const TextStyle(
            color: T.inkMuted,
            fontWeight: FontWeight.w600,
            fontSize: 10,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          body,
          textAlign: align,
          style: const TextStyle(
            color: T.inkSoft,
            fontSize: 12,
            fontStyle: FontStyle.italic,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}

class _MarginNote extends StatelessWidget {
  const _MarginNote({
    required this.text,
    required this.color,
    required this.rotation,
    required this.align,
    this.glyph,
  });
  final String text;
  final Color color;
  final double rotation;
  final TextAlign align;
  final String? glyph;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: rotation,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 130),
        child: Column(
          crossAxisAlignment: align == TextAlign.right
              ? CrossAxisAlignment.end
              : CrossAxisAlignment.start,
          children: [
            Text(
              text,
              textAlign: align,
              style: TextStyle(
                color: color.withValues(alpha: 0.85),
                fontStyle: FontStyle.italic,
                fontSize: 14,
                height: 1.1,
              ),
            ),
            if (glyph != null)
              Transform.rotate(
                angle: -2.79, // ~-160°
                child: Text(
                  glyph!,
                  style: TextStyle(
                    color: color.withValues(alpha: 0.85),
                    fontSize: 22,
                    height: 1,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _DashedFramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = T.paper3.withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final rect = Rect.fromLTWH(6, 6, size.width - 12, size.height - 12);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(2));
    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      double dist = 0;
      while (dist < metric.length) {
        final next = (dist + 4).clamp(0.0, metric.length);
        canvas.drawPath(metric.extractPath(dist, next), paint);
        dist = next + 4;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedFramePainter old) => false;
}

class _SoilPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndCorners(
      Rect.fromLTWH(0, 0, size.width, size.height),
      topLeft: const Radius.circular(6),
      topRight: const Radius.circular(6),
      bottomLeft: const Radius.circular(10),
      bottomRight: const Radius.circular(10),
    );
    // Gradient fill
    final fill = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF8B6939), Color(0xFF5A4423)],
      ).createShader(rrect.outerRect);
    canvas.drawRRect(rrect, fill);
    // Top highlight line
    final top = Paint()..color = const Color(0xFFA38456);
    canvas.drawLine(
        const Offset(2, 1), Offset(size.width - 2, 1), top..strokeWidth = 1.6);
    // Dirt dots (deterministic positions)
    final dots = [
      Offset(size.width * 0.12, size.height * 0.40),
      Offset(size.width * 0.28, size.height * 0.70),
      Offset(size.width * 0.47, size.height * 0.30),
      Offset(size.width * 0.63, size.height * 0.64),
      Offset(size.width * 0.81, size.height * 0.38),
      Offset(size.width * 0.92, size.height * 0.72),
    ];
    final dark = Paint()..color = const Color(0xFF2C1F0D);
    final dim = Paint()..color = const Color(0xFF3A2A14);
    for (var i = 0; i < dots.length; i++) {
      canvas.drawCircle(dots[i], 1.2, i.isEven ? dim : dark);
    }
  }

  @override
  bool shouldRepaint(covariant _SoilPainter old) => false;
}
