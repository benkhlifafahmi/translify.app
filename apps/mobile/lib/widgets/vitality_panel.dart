import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../api/models.dart';
import '../theme/tokens.dart';

/// Editorial vitality block — droplets row, big days-of-reserve number,
/// growth bar with notches, and a 2×2 stat grid.
/// Port of apps/web/src/components/garden/vitality-panel.tsx.
class VitalityPanel extends StatelessWidget {
  const VitalityPanel({super.key, required this.garden});
  final Garden garden;

  static const _stageLabels = [
    'Stage 0 · seed',
    'Stage I · sprout',
    'Stage II · seedling',
    'Stage III · stem',
    'Stage IV · bud forming',
    'Stage V · in flower',
    'Stage VI · full bloom',
  ];

  @override
  Widget build(BuildContext context) {
    final wilting = garden.vitality <= 1;
    final thriving = garden.vitality >= 4;
    final status = wilting ? 'Wilting' : (thriving ? 'Thriving' : 'Steady');
    final statusColor = wilting ? T.coral : T.sage;

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFFCF3), T.paper2],
        ),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: T.paper3, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Headline + status pill
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                'Vitality',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontStyle: FontStyle.italic,
                    ),
              ),
              const Spacer(),
              _PulsingDot(color: statusColor),
              const SizedBox(width: 6),
              Text(
                status.toUpperCase(),
                style: TextStyle(
                  color: T.sageDeep,
                  fontSize: 11,
                  letterSpacing: 1.8,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Droplets + days-of-reserve
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Wrap(
                  spacing: 6,
                  children: List.generate(
                    garden.vitalityCapacity,
                    (i) => _DropletGlyph(filled: i < garden.vitality),
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  RichText(
                    text: TextSpan(
                      style: TextStyle(
                        color: T.ink,
                        fontSize: 38,
                        height: 1.0,
                        fontWeight: FontWeight.w300,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                      children: [
                        TextSpan(text: '${garden.daysUntilThirst}'),
                        TextSpan(
                          text: '/${garden.vitalityCapacity}',
                          style: const TextStyle(
                            color: T.inkMuted,
                            fontSize: 20,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Text(
                    'days of reserve',
                    style: TextStyle(
                      color: T.inkMuted,
                      fontStyle: FontStyle.italic,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Growth bar with notches
          _GrowthBar(percent: garden.growthPercent),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: Text(
                  _stageLabels[garden.stage.clamp(0, _stageLabels.length - 1)],
                  style: const TextStyle(
                    color: T.sageDeep,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
              Text(
                '${garden.growthPercent}% to bloom',
                style: const TextStyle(
                  color: T.inkMuted,
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          // 2×2 stat grid with dashed dividers
          Container(
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: T.paper3.withValues(alpha: 0.6),
                  width: 1,
                ),
              ),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _StatCell(
                        label: 'Pages turned',
                        val: '${garden.pagesRead}',
                        sup: garden.pageCount > 0 ? '/${garden.pageCount}' : null,
                        sub: garden.pagesReadDelta > 0
                            ? '+${garden.pagesReadDelta} since last visit'
                            : null,
                        rightBorder: true,
                      ),
                    ),
                    Expanded(
                      child: _StatCell(
                        label: 'Quizzes answered',
                        val: '${garden.quizzesAnswered}',
                        sup: garden.quizzesTotal > 0
                            ? '/${garden.quizzesTotal}'
                            : null,
                        sub: garden.quizzesAnswered == 0
                            ? null
                            : '${garden.quizAccuracyPercent}% accuracy',
                      ),
                    ),
                  ],
                ),
                Container(
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: T.paper3.withValues(alpha: 0.6),
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _StatCell(
                          label: 'New leaves',
                          val: '${garden.newLeaves}',
                          sub: garden.lastLeafAt != null
                              ? 'last grown ${_relTime(garden.lastLeafAt!)}'
                              : 'no leaves yet',
                          rightBorder: true,
                        ),
                      ),
                      Expanded(
                        child: _StatCell(
                          label: 'Streak',
                          val: '${garden.streakDays}',
                          sup: 'd',
                          sub:
                              'personal best · ${garden.bestStreakDays}d',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────── helpers ───────────────────

class _DropletGlyph extends StatelessWidget {
  const _DropletGlyph({required this.filled});
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 22,
      height: 28,
      child: CustomPaint(painter: _DropletPainter(filled: filled)),
    );
  }
}

class _DropletPainter extends CustomPainter {
  _DropletPainter({required this.filled});
  final bool filled;

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(11, 2)
      ..cubicTo(4, 12, 2, 18, 11, 26)
      ..cubicTo(20, 18, 18, 12, 11, 2)
      ..close();
    if (filled) {
      canvas.drawPath(path, Paint()..color = const Color(0xFF88B0D8));
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = T.ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2,
    );
  }

  @override
  bool shouldRepaint(covariant _DropletPainter old) => old.filled != filled;
}

class _GrowthBar extends StatelessWidget {
  const _GrowthBar({required this.percent});
  final int percent;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: Container(
            height: 10,
            decoration: BoxDecoration(
              color: T.paper3,
              border: Border.all(color: T.paper3, width: 1),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: (percent / 100).clamp(0, 1)),
                duration: const Duration(milliseconds: 600),
                curve: Curves.easeOutCubic,
                builder: (context, v, _) => Align(
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(
                    widthFactor: v,
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [T.sage, T.sageDeep],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        // 25% notch
        Positioned(
          left: 0,
          top: -3,
          right: 0,
          child: LayoutBuilder(
            builder: (context, c) {
              return SizedBox(
                height: 16,
                child: Stack(
                  children: [
                    Positioned(
                      left: c.maxWidth * 0.25,
                      top: 0,
                      child: Container(width: 2, height: 16, color: T.ink),
                    ),
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(width: 2, height: 16, color: T.ink),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _StatCell extends StatelessWidget {
  const _StatCell({
    required this.label,
    required this.val,
    this.sup,
    this.sub,
    this.rightBorder = false,
  });
  final String label;
  final String val;
  final String? sup;
  final String? sub;
  final bool rightBorder;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: 14,
        bottom: 14,
        right: rightBorder ? 12 : 0,
        left: rightBorder ? 0 : 12,
      ),
      decoration: rightBorder
          ? BoxDecoration(
              border: Border(
                right: BorderSide(
                  color: T.paper3.withValues(alpha: 0.6),
                  width: 1,
                ),
              ),
            )
          : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: T.inkMuted,
              fontStyle: FontStyle.italic,
              fontSize: 12,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 4),
          RichText(
            text: TextSpan(
              style: const TextStyle(
                color: T.ink,
                fontSize: 26,
                height: 1.1,
                fontWeight: FontWeight.w400,
                fontFeatures: [FontFeature.tabularFigures()],
              ),
              children: [
                TextSpan(text: val),
                if (sup != null)
                  TextSpan(
                    text: ' $sup',
                    style: const TextStyle(
                      color: T.inkMuted,
                      fontSize: 13,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
              ],
            ),
          ),
          if (sub != null) ...[
            const SizedBox(height: 2),
            Text(
              sub!,
              style: const TextStyle(
                color: T.inkMuted,
                fontStyle: FontStyle.italic,
                fontSize: 11,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PulsingDot extends StatefulWidget {
  const _PulsingDot({required this.color});
  final Color color;
  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat();

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
        final ringScale = 1.0 + math.sin(t * math.pi * 2) * 0.4;
        final ringAlpha = (1 - t).clamp(0.0, 1.0) * 0.6;
        return SizedBox(
          width: 14,
          height: 14,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 8 * ringScale,
                height: 8 * ringScale,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: widget.color.withValues(alpha: ringAlpha * 0.5),
                ),
              ),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: widget.color,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

String _relTime(DateTime at) {
  final ms = DateTime.now().difference(at).inMilliseconds;
  final minutes = (ms / 60000).round();
  if (minutes < 60) return '${minutes}m ago';
  final hours = (minutes / 60).round();
  if (hours < 24) return '${hours}h ago';
  final days = (hours / 24).round();
  return '${days}d ago';
}
