import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/progress.dart';
import '../theme/tokens.dart';

class HudBar extends StatelessWidget {
  const HudBar({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.watch<Progress>();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: T.paper.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(T.radiusPill),
        border: Border.all(color: T.ink, width: 1.6),
        boxShadow: T.stickerShadow(y: 3),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _Lvl(level: p.level, fill: p.xpInLevel / 100),
          const SizedBox(width: 12),
          _Streak(count: p.streak),
          const SizedBox(width: 10),
          _Hearts(count: p.hearts),
        ],
      ),
    );
  }
}

class _Lvl extends StatelessWidget {
  const _Lvl({required this.level, required this.fill});
  final int level;
  final double fill;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: T.violet,
            shape: BoxShape.circle,
            border: Border.all(color: T.ink, width: 1.6),
          ),
          alignment: Alignment.center,
          child: Text(
            '$level',
            style: const TextStyle(
              color: T.paper,
              fontWeight: FontWeight.w900,
              fontSize: 13,
              fontFamily: 'Nunito',
            ),
          ),
        ),
        const SizedBox(width: 8),
        Container(
          width: 84,
          height: 10,
          decoration: BoxDecoration(
            color: T.paper3,
            borderRadius: BorderRadius.circular(99),
            border: Border.all(color: T.ink, width: 1.2),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: fill.clamp(0.0, 1.0)),
              duration: const Duration(milliseconds: 600),
              curve: Curves.easeOut,
              builder: (context, v, _) => Align(
                alignment: Alignment.centerLeft,
                child: FractionallySizedBox(
                  widthFactor: v,
                  child: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [T.saffron, T.candy],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _Streak extends StatelessWidget {
  const _Streak({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text('🔥', style: TextStyle(fontSize: 18)),
        const SizedBox(width: 4),
        Text(
          '$count',
          style: const TextStyle(
            color: T.ink,
            fontWeight: FontWeight.w900,
            fontFamily: 'Nunito',
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}

class _Hearts extends StatelessWidget {
  const _Hearts({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.favorite, color: count > 0 ? T.heart : T.inkMuted, size: 18),
        const SizedBox(width: 4),
        Text(
          '$count',
          style: const TextStyle(
            color: T.ink,
            fontWeight: FontWeight.w900,
            fontFamily: 'Nunito',
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}
