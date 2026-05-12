import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../api/models.dart';

/// Direct port of apps/web/src/components/garden/farmer-svg.tsx (viewBox 78×120).
class FarmerSvg extends StatelessWidget {
  const FarmerSvg({
    super.key,
    required this.farmer,
    this.width = 66,
    this.height = 102,
  });

  final Farmer farmer;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: CustomPaint(painter: _FarmerPainter(farmer: farmer)),
    );
  }
}

class _FarmerPainter extends CustomPainter {
  _FarmerPainter({required this.farmer});
  final Farmer farmer;

  static const double _vbW = 78;
  static const double _vbH = 120;
  static const Color _ink = Color(0xFF1F1A14);

  Color get _skin => switch (farmer.skin) {
        FarmerSkin.fair => const Color(0xFFF2D2B0),
        FarmerSkin.tan => const Color(0xFFE2B98A),
        FarmerSkin.umber => const Color(0xFF9C6B45),
        FarmerSkin.sepia => const Color(0xFF704428),
      };

  Color get _coat => switch (farmer.coat) {
        FarmerCoat.denim => const Color(0xFF3E5878),
        FarmerCoat.linen => const Color(0xFFE8DDC4),
        FarmerCoat.earth => const Color(0xFFB85A3A),
        FarmerCoat.moss => const Color(0xFF5F8763),
      };

  ({Color brim, Color crown})? get _hat => switch (farmer.hat) {
        FarmerHat.straw =>
          (brim: const Color(0xFFC99846), crown: const Color(0xFFE2B26A)),
        FarmerHat.wool =>
          (brim: const Color(0xFF3D2A18), crown: const Color(0xFF5C4128)),
        FarmerHat.scholar =>
          (brim: const Color(0xFF20283A), crown: const Color(0xFF3A4763)),
        FarmerHat.none => null,
      };

  @override
  void paint(Canvas canvas, Size size) {
    final scale = math.min(size.width / _vbW, size.height / _vbH);
    final drawnW = _vbW * scale;
    final drawnH = _vbH * scale;
    canvas.save();
    canvas.translate((size.width - drawnW) / 2, (size.height - drawnH) / 2);
    canvas.scale(scale);

    _drawShadow(canvas);
    _drawLegs(canvas);
    _drawBody(canvas);
    _drawArm(canvas);
    _drawTool(canvas);
    _drawHead(canvas);
    _drawHat(canvas);

    canvas.restore();
  }

  Paint _stroke(double w, Color color, {double opacity = 1}) => Paint()
    ..color = color.withValues(alpha: opacity)
    ..style = PaintingStyle.stroke
    ..strokeWidth = w
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round;

  Paint _fill(Color color) => Paint()..color = color;

  void _drawShadow(Canvas canvas) {
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(39, 116), width: 44, height: 6),
      _fill(const Color(0x26000000)),
    );
  }

  void _drawLegs(Canvas canvas) {
    final p = _stroke(6, const Color(0xFF3D2A18));
    canvas.drawLine(const Offset(30, 92), const Offset(28, 114), p);
    canvas.drawLine(const Offset(46, 92), const Offset(48, 114), p);
  }

  void _drawBody(Canvas canvas) {
    final path = Path()
      ..moveTo(22, 56)
      ..cubicTo(22, 48, 26, 44, 38, 44)
      ..cubicTo(50, 44, 56, 48, 56, 56)
      ..lineTo(56, 94)
      ..cubicTo(56, 96, 54, 98, 50, 98)
      ..lineTo(26, 98)
      ..cubicTo(22, 98, 22, 96, 22, 94)
      ..close();
    canvas.drawPath(path, _fill(_coat));
    canvas.drawPath(path, _stroke(1.6, _ink));
    // coat seams
    final seam = _stroke(0.8, _ink, opacity: 0.5);
    canvas.drawLine(const Offset(28, 48), const Offset(28, 96), seam);
    canvas.drawLine(const Offset(50, 48), const Offset(50, 96), seam);
  }

  void _drawArm(Canvas canvas) {
    final arm = Path()
      ..moveTo(56, 62)
      ..lineTo(70, 76)
      ..lineTo(68, 86);
    canvas.drawPath(arm, _stroke(6, _coat));
  }

  void _drawTool(Canvas canvas) {
    switch (farmer.tool) {
      case FarmerTool.wateringCan:
        canvas.save();
        canvas.translate(60, 82);
        final body = Rect.fromLTWH(0, 0, 14, 12);
        final rrect = RRect.fromRectAndRadius(body, const Radius.circular(1));
        canvas.drawRRect(rrect, _fill(const Color(0xFF8A8E8C)));
        canvas.drawRRect(rrect, _stroke(1.2, _ink));
        final spout = Path()
          ..moveTo(14, 2)
          ..lineTo(20, -2)
          ..lineTo(20, 4)
          ..lineTo(14, 6)
          ..close();
        canvas.drawPath(spout, _fill(const Color(0xFF8A8E8C)));
        canvas.drawPath(spout, _stroke(1.2, _ink));
        final handle = Path()
          ..moveTo(-1, 0)
          ..cubicTo(-4, -2, -2, -6, 2, -4);
        canvas.drawPath(handle, _stroke(1.2, _ink));
        canvas.restore();
        break;

      case FarmerTool.shears:
        canvas.save();
        canvas.translate(60, 78);
        final blade = _stroke(2.4, const Color(0xFF8A8E8C));
        canvas.drawLine(const Offset(0, 0), const Offset(14, 14), blade);
        canvas.drawLine(const Offset(0, 14), const Offset(14, 0), blade);
        final ring = _stroke(1.4, _ink);
        canvas.drawCircle(const Offset(-1, -1), 3, ring);
        canvas.drawCircle(const Offset(-1, 15), 3, ring);
        canvas.restore();
        break;

      case FarmerTool.lantern:
        canvas.save();
        canvas.translate(58, 78);
        final body = RRect.fromRectAndRadius(
            const Rect.fromLTWH(0, 2, 12, 14), const Radius.circular(1));
        canvas.drawRRect(body, _fill(const Color(0xFFE8C56A)));
        canvas.drawRRect(body, _stroke(1.2, _ink));
        final top = Path()
          ..moveTo(2, 0)
          ..lineTo(10, 0)
          ..lineTo(12, 2)
          ..lineTo(0, 2)
          ..close();
        canvas.drawPath(top, _fill(const Color(0xFF5A3A22)));
        canvas.drawPath(top, _stroke(1, _ink));
        canvas.drawCircle(
            const Offset(6, 9), 3, _fill(const Color(0xFFFFD27A)));
        canvas.restore();
        break;

      case FarmerTool.book:
        canvas.save();
        canvas.translate(58, 80);
        final p = Path()
          ..moveTo(0, 0)
          ..lineTo(14, 0)
          ..lineTo(14, 12)
          ..lineTo(7, 10)
          ..lineTo(0, 12)
          ..close();
        canvas.drawPath(p, _fill(const Color(0xFFB85A3A)));
        canvas.drawPath(p, _stroke(1.2, _ink));
        canvas.drawLine(const Offset(7, 2), const Offset(7, 10),
            _stroke(0.8, _ink));
        canvas.restore();
        break;
    }
  }

  void _drawHead(Canvas canvas) {
    canvas.drawCircle(const Offset(39, 34), 11, _fill(_skin));
    canvas.drawCircle(const Offset(39, 34), 11, _stroke(1.6, _ink));
    // simple hairline
    final hair = Path()
      ..moveTo(30, 28)
      ..cubicTo(32, 22, 46, 22, 48, 28);
    canvas.drawPath(hair, _fill(const Color(0xFF3D2A18)));
    canvas.drawPath(hair, _stroke(2, const Color(0xFF3D2A18)));
    // eyes + smile
    canvas.drawCircle(const Offset(35, 34), 0.9, _fill(_ink));
    canvas.drawCircle(const Offset(43, 34), 0.9, _fill(_ink));
    final smile = Path()
      ..moveTo(35, 39)
      ..quadraticBezierTo(39, 41, 43, 39);
    canvas.drawPath(smile, _stroke(1, _ink));
  }

  void _drawHat(Canvas canvas) {
    final h = _hat;
    if (h == null) return;
    canvas.drawOval(
        Rect.fromCenter(center: const Offset(39, 22), width: 44, height: 10),
        _fill(h.brim));
    canvas.drawOval(
        Rect.fromCenter(center: const Offset(39, 22), width: 44, height: 10),
        _stroke(1.4, _ink));
    final crown = Path()
      ..moveTo(28, 22)
      ..cubicTo(30, 12, 48, 12, 50, 22)
      ..close();
    canvas.drawPath(crown, _fill(h.crown));
    canvas.drawPath(crown, _stroke(1.4, _ink));
    // sage hatband
    final band = Path()
      ..moveTo(28, 21)
      ..cubicTo(32, 24, 46, 24, 50, 21);
    canvas.drawPath(band, _stroke(1.6, const Color(0xFF4D6A3B)));
  }

  @override
  bool shouldRepaint(covariant _FarmerPainter old) => old.farmer != farmer;
}
