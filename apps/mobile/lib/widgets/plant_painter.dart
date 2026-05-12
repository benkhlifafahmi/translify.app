import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../api/models.dart';

/// Botanical illustration of the chosen species at the given stage.
/// Direct port of apps/web/src/components/garden/plant-svg.tsx — viewBox
/// 280×380 so coordinates line up with the web source.
class PlantSvg extends StatelessWidget {
  const PlantSvg({
    super.key,
    required this.species,
    required this.stage,
    this.wilting = false,
    this.width = 240,
    this.height = 320,
  });

  final GardenSpecies species;
  final int stage;
  final bool wilting;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: CustomPaint(
        painter: _PlantPainter(
          species: species,
          stage: stage.clamp(0, 6),
          wilting: wilting,
        ),
      ),
    );
  }
}

class _PlantPainter extends CustomPainter {
  _PlantPainter({
    required this.species,
    required this.stage,
    required this.wilting,
  });

  final GardenSpecies species;
  final int stage;
  final bool wilting;

  static const double _vbW = 280;
  static const double _vbH = 380;

  // Palette mirrored from the web component.
  Color get _leafA => wilting ? const Color(0xFFA89060) : const Color(0xFF7A9858);
  Color get _leafB => wilting ? const Color(0xFFB79E6E) : const Color(0xFF8FAD68);
  Color get _leafC => wilting ? const Color(0xFF9C8554) : const Color(0xFF6E8C4E);
  Color get _leafLight =>
      wilting ? const Color(0xFFC7B584) : const Color(0xFFA4BD7E);
  Color get _stem => wilting ? const Color(0xFF7A6A4A) : const Color(0xFF3F5A2D);

  bool get _showMid => stage >= 2;
  bool get _showHigh => stage >= 3;
  bool get _showBud => stage >= 3;
  bool get _showPetals => stage >= 4;
  bool get _showCrown => stage >= 5;

  @override
  void paint(Canvas canvas, Size size) {
    final scale = math.min(size.width / _vbW, size.height / _vbH);
    final drawnW = _vbW * scale;
    final drawnH = _vbH * scale;
    canvas.save();
    canvas.translate((size.width - drawnW) / 2, (size.height - drawnH) / 2);
    canvas.scale(scale);

    switch (species) {
      case GardenSpecies.helianthus:
        _paintHelianthus(canvas);
        break;
      case GardenSpecies.lavandula:
        _paintLavandula(canvas);
        break;
      case GardenSpecies.monstera:
        _paintMonstera(canvas);
        break;
      case GardenSpecies.ficus:
        _paintFicus(canvas);
        break;
    }

    canvas.restore();
  }

  // ─── small helpers ────────────────────────────────────────────────────

  Paint _stroke(double width, Color color) => Paint()
    ..color = color
    ..style = PaintingStyle.stroke
    ..strokeWidth = width
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round;

  Paint _fill(Color color) => Paint()..color = color;

  /// Draw an ellipse rotated around its centre (matches SVG `transform="rotate(a cx cy)"`).
  void _rotEllipse(
    Canvas canvas, {
    required double cx,
    required double cy,
    required double rx,
    required double ry,
    required double angleDeg,
    required Paint fill,
    Paint? stroke,
  }) {
    canvas.save();
    canvas.translate(cx, cy);
    canvas.rotate(angleDeg * math.pi / 180);
    final rect = Rect.fromCenter(
        center: Offset.zero, width: rx * 2, height: ry * 2);
    canvas.drawOval(rect, fill);
    if (stroke != null) canvas.drawOval(rect, stroke);
    canvas.restore();
  }

  // ─── Helianthus ──────────────────────────────────────────────────────

  void _paintHelianthus(Canvas canvas) {
    canvas.drawLine(const Offset(140, 360), const Offset(140, 90),
        _stroke(6, _stem));

    if (_showMid) {
      canvas.drawLine(
          const Offset(140, 200), const Offset(110, 178), _stroke(3, _stem));
      canvas.drawLine(
          const Offset(140, 180), const Offset(170, 162), _stroke(3, _stem));
      canvas.drawLine(
          const Offset(140, 160), const Offset(102, 142), _stroke(3, _stem));
      _rotEllipse(canvas,
          cx: 100, cy: 178, rx: 22, ry: 9, angleDeg: -18,
          fill: _fill(_leafA), stroke: _stroke(1.4, _stem));
      _rotEllipse(canvas,
          cx: 180, cy: 162, rx: 22, ry: 9, angleDeg: 18,
          fill: _fill(_leafB), stroke: _stroke(1.4, _stem));
    }

    if (_showHigh) {
      _rotEllipse(canvas,
          cx: 92, cy: 138, rx: 20, ry: 8, angleDeg: -22,
          fill: _fill(_leafLight), stroke: _stroke(1.4, _stem));
      _rotEllipse(canvas,
          cx: 188, cy: 120, rx: 20, ry: 8, angleDeg: 22,
          fill: _fill(_leafA), stroke: _stroke(1.4, _stem));
    }

    if (_showPetals) {
      // 12 petals at 30° increments
      canvas.save();
      canvas.translate(140, 78);
      final petalFill =
          _fill(wilting ? const Color(0xFFC99846) : const Color(0xFFE8C56A));
      for (var i = 0; i < 12; i++) {
        final angleRad = i * 30 * math.pi / 180;
        final x = math.cos(angleRad) * 28;
        final y = math.sin(angleRad) * 28;
        _rotEllipse(canvas,
            cx: x, cy: y, rx: 14, ry: 6, angleDeg: i * 30.0,
            fill: petalFill, stroke: _stroke(1.2, _stem));
      }
      // Disk
      canvas.drawCircle(Offset.zero, 14,
          _fill(wilting ? const Color(0xFF7A4A2E) : const Color(0xFF5A3A22)));
      canvas.drawCircle(Offset.zero, 14, _stroke(1.4, _stem));
      // Seed dots
      final seed = _fill(const Color(0xFF3A2410));
      for (var i = 0; i < 9; i++) {
        final a = i * 40 * math.pi / 180;
        canvas.drawCircle(Offset(math.cos(a) * 8, math.sin(a) * 8), 1.2, seed);
      }
      canvas.restore();
    } else if (_showBud) {
      canvas.drawCircle(const Offset(140, 78), 10, _fill(_leafC));
      canvas.drawCircle(const Offset(140, 78), 10, _stroke(1.4, _stem));
    }
  }

  // ─── Lavandula ──────────────────────────────────────────────────────

  void _paintLavandula(Canvas canvas) {
    final stemPaint = _stroke(4.5, _stem);
    // Three stems splay from soil
    final left = Path()
      ..moveTo(140, 360)
      ..cubicTo(132, 280, 110, 220, 90, 140);
    final right = Path()
      ..moveTo(140, 360)
      ..cubicTo(148, 280, 170, 220, 192, 140);
    canvas.drawPath(left, stemPaint);
    canvas.drawPath(right, stemPaint);
    canvas.drawLine(
        const Offset(140, 360), const Offset(140, 100), _stroke(5, _stem));

    if (_showMid) {
      _rotEllipse(canvas,
          cx: 116, cy: 240, rx: 9, ry: 20, angleDeg: -22,
          fill: _fill(_leafA), stroke: _stroke(1.2, _stem));
      _rotEllipse(canvas,
          cx: 164, cy: 240, rx: 9, ry: 20, angleDeg: 22,
          fill: _fill(_leafB), stroke: _stroke(1.2, _stem));
    }
    if (_showHigh) {
      _rotEllipse(canvas,
          cx: 106, cy: 180, rx: 8, ry: 16, angleDeg: -30,
          fill: _fill(_leafLight), stroke: _stroke(1.2, _stem));
      _rotEllipse(canvas,
          cx: 174, cy: 180, rx: 8, ry: 16, angleDeg: 30,
          fill: _fill(_leafA), stroke: _stroke(1.2, _stem));
    }

    if (_showBud) {
      final spikeColor = wilting
          ? const Color(0xFF9D8FBE).withValues(alpha: 0.6)
          : const Color(0xFF9B8FBE);
      const spots = [Offset(90, 100), Offset(140, 70), Offset(190, 100)];
      final budCount = _showPetals ? 6 : 3;
      for (final c in spots) {
        for (var j = 0; j < budCount; j++) {
          final cx = c.dx;
          final cy = c.dy + j * -7;
          final rect = Rect.fromCenter(
              center: Offset(cx, cy), width: 12, height: 10);
          canvas.drawOval(rect, _fill(spikeColor));
          canvas.drawOval(rect, _stroke(1.0, _stem));
        }
      }
    }
  }

  // ─── Monstera ───────────────────────────────────────────────────────

  void _paintMonstera(Canvas canvas) {
    final stemPath = Path()
      ..moveTo(140, 360)
      ..cubicTo(138, 280, 144, 220, 138, 140);
    canvas.drawPath(stemPath, _stroke(6, _stem));

    if (_showMid) {
      _monsteraLeaf(canvas, cx: 92, cy: 232, rotateDeg: -18, fill: _leafA);
    }
    if (_showHigh) {
      _monsteraLeaf(canvas, cx: 196, cy: 206, rotateDeg: 20, fill: _leafC);
      _monsteraLeaf(canvas, cx: 86, cy: 148, rotateDeg: -26, fill: _leafB);
    }
    if (_showCrown) {
      _monsteraLeaf(canvas, cx: 196, cy: 120, rotateDeg: 28, fill: _leafA);
    }
    if (_showPetals) {
      _monsteraLeaf(canvas,
          cx: 140, cy: 68, rotateDeg: 0, fill: _leafLight, scale: 1.1);
    }
  }

  void _monsteraLeaf(
    Canvas canvas, {
    required double cx,
    required double cy,
    required double rotateDeg,
    required Color fill,
    double scale = 1.0,
  }) {
    canvas.save();
    canvas.translate(cx, cy);
    canvas.rotate(rotateDeg * math.pi / 180);
    canvas.scale(scale);
    final leaf = Path()
      ..moveTo(0, 0)
      ..cubicTo(-8, -28, 8, -56, 36, -60)
      ..cubicTo(44, -36, 36, -8, 0, 0)
      ..close();
    canvas.drawPath(leaf, _fill(fill));
    canvas.drawPath(leaf, _stroke(1.4, _stem));
    // slits
    final slit = _stroke(1.2, _stem);
    canvas.drawLine(const Offset(6, -16), const Offset(22, -22), slit);
    canvas.drawLine(const Offset(10, -32), const Offset(28, -36), slit);
    canvas.drawLine(const Offset(14, -46), const Offset(30, -50), slit);
    canvas.restore();
  }

  // ─── Ficus ──────────────────────────────────────────────────────────

  void _paintFicus(Canvas canvas) {
    // Wobbly trunk
    final trunk = Path()
      ..moveTo(140, 360)
      ..cubicTo(134, 300, 152, 250, 138, 200)
      ..cubicTo(126, 160, 154, 130, 142, 80);
    canvas.drawPath(trunk, _stroke(5.5, _stem));

    if (_showMid) {
      final branchA = Path()
        ..moveTo(140, 280)
        ..cubicTo(160, 270, 178, 254, 188, 226);
      final branchB = Path()
        ..moveTo(138, 220)
        ..cubicTo(118, 212, 96, 196, 88, 168);
      canvas.drawPath(branchA, _stroke(3.5, _stem));
      canvas.drawPath(branchB, _stroke(3.5, _stem));

      final leaf1 = Path()
        ..moveTo(188, 226)
        ..cubicTo(214, 218, 232, 200, 230, 178)
        ..cubicTo(212, 188, 196, 206, 188, 226)
        ..close();
      final leaf2 = Path()
        ..moveTo(88, 168)
        ..cubicTo(64, 168, 44, 156, 40, 134)
        ..cubicTo(60, 142, 78, 152, 88, 168)
        ..close();
      canvas.drawPath(leaf1, _fill(_leafA));
      canvas.drawPath(leaf1, _stroke(1.4, _stem));
      canvas.drawPath(leaf2, _fill(_leafB));
      canvas.drawPath(leaf2, _stroke(1.4, _stem));
    }

    if (_showHigh) {
      final branchC = Path()
        ..moveTo(142, 150)
        ..cubicTo(158, 144, 174, 130, 182, 110);
      canvas.drawPath(branchC, _stroke(3, _stem));

      final leaf3 = Path()
        ..moveTo(182, 110)
        ..cubicTo(212, 100, 232, 78, 230, 50)
        ..cubicTo(206, 62, 188, 84, 182, 110)
        ..close();
      final leaf4 = Path()
        ..moveTo(150, 116)
        ..cubicTo(130, 102, 110, 90, 92, 96)
        ..cubicTo(104, 112, 126, 124, 150, 116)
        ..close();
      canvas.drawPath(leaf3, _fill(_leafC));
      canvas.drawPath(leaf3, _stroke(1.4, _stem));
      canvas.drawPath(leaf4, _fill(_leafB));
      canvas.drawPath(leaf4, _stroke(1.4, _stem));
    }

    if (_showCrown) {
      final leaf5 = Path()
        ..moveTo(142, 80)
        ..cubicTo(156, 56, 178, 42, 198, 46)
        ..cubicTo(188, 70, 168, 84, 142, 80)
        ..close();
      final leaf6 = Path()
        ..moveTo(142, 80)
        ..cubicTo(128, 56, 108, 44, 88, 50)
        ..cubicTo(96, 72, 118, 86, 142, 80)
        ..close();
      canvas.drawPath(leaf5, _fill(_leafA));
      canvas.drawPath(leaf5, _stroke(1.4, _stem));
      canvas.drawPath(leaf6, _fill(_leafLight));
      canvas.drawPath(leaf6, _stroke(1.4, _stem));
    }

    if (_showBud) {
      canvas.save();
      canvas.translate(142, 38);
      final budColor =
          wilting ? const Color(0xFFC99846) : const Color(0xFFE8C56A);
      canvas.drawCircle(Offset.zero, 6, _fill(budColor));
      canvas.drawCircle(Offset.zero, 6, _stroke(1.2, _stem));
      if (_showPetals) {
        const coral = Color(0xFFB85A3A);
        canvas.drawCircle(Offset.zero, 2, _fill(coral));
        final flame = _fill(coral);
        // four little flame petals
        final paths = [
          Path()
            ..moveTo(0, -6)
            ..cubicTo(4, -10, 8, -8, 6, -2)
            ..close(),
          Path()
            ..moveTo(-6, 0)
            ..cubicTo(-10, -4, -8, -8, -2, -6)
            ..close(),
          Path()
            ..moveTo(0, 6)
            ..cubicTo(-4, 10, -8, 8, -6, 2)
            ..close(),
          Path()
            ..moveTo(6, 0)
            ..cubicTo(10, 4, 8, 8, 2, 6)
            ..close(),
        ];
        for (final p in paths) {
          canvas.drawPath(p, flame);
          canvas.drawPath(p, _stroke(1, _stem));
        }
      }
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _PlantPainter old) =>
      old.species != species ||
      old.stage != stage ||
      old.wilting != wilting;
}

/// Static species metadata for the picker UI.
class SpeciesMeta {
  const SpeciesMeta({
    required this.id,
    required this.name,
    required this.latin,
    required this.blurb,
    required this.unlocked,
  });
  final GardenSpecies id;
  final String name;
  final String latin;
  final String blurb;
  final bool unlocked;
}

const speciesCatalog = <SpeciesMeta>[
  SpeciesMeta(
    id: GardenSpecies.ficus,
    name: 'Ficus litteraria',
    latin: 'novel-fig',
    blurb: 'Rewards long, immersive sessions.',
    unlocked: true,
  ),
  SpeciesMeta(
    id: GardenSpecies.helianthus,
    name: 'Helianthus',
    latin: "poet's sunflower",
    blurb: 'Loves daily streaks.',
    unlocked: true,
  ),
  SpeciesMeta(
    id: GardenSpecies.lavandula,
    name: 'Lavandula',
    latin: 'essay-lavender',
    blurb: 'Thrives on careful note-taking.',
    unlocked: true,
  ),
  SpeciesMeta(
    id: GardenSpecies.monstera,
    name: 'Monstera',
    latin: 'epic-leaf',
    blurb: 'Unlocks after your first finished book.',
    unlocked: false,
  ),
];
