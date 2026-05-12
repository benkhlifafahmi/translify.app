import 'dart:async';

import 'package:flutter/material.dart';

import '../api/models.dart';
import '../theme/tokens.dart';

/// Linen-cream card announcing the weekly tending rite, with a live HH:MM:SS
/// countdown. Port of apps/web/src/components/garden/weekly-tending-card.tsx.
class WeeklyTendingCard extends StatefulWidget {
  const WeeklyTendingCard({
    super.key,
    required this.garden,
    required this.onBegin,
  });
  final Garden garden;
  final VoidCallback onBegin;

  @override
  State<WeeklyTendingCard> createState() => _WeeklyTendingCardState();
}

class _WeeklyTendingCardState extends State<WeeklyTendingCard> {
  Timer? _ticker;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  String _speciesShort() => switch (widget.garden.species) {
        GardenSpecies.ficus => 'Ficus litteraria',
        GardenSpecies.helianthus => 'your sunflower',
        GardenSpecies.lavandula => 'the lavender',
        GardenSpecies.monstera => 'the monstera',
      };

  String _formatCountdown(Duration d) {
    if (d.isNegative) return '00:00:00';
    final hh = d.inHours.toString().padLeft(2, '0');
    final mm = (d.inMinutes % 60).toString().padLeft(2, '0');
    final ss = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$hh:$mm:$ss';
  }

  @override
  Widget build(BuildContext context) {
    final due = widget.garden.weeklyTendingDueAt.difference(_now);
    final overdue = due.isNegative;
    final urgent = due.inHours < 24;
    final dueText = overdue
        ? 'overdue — your plant is thirsty'
        : urgent
            ? 'due in under a day'
            : 'due in ${(due.inHours / 24).ceil()} days';
    final pages = widget.garden.pagesRead;
    final chapters = pages > 200 ? '9 — 14' : '1 — 8';

    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFBF3DD), Color(0xFFF4E9C9)],
          ),
          border: Border.all(color: T.ink, width: 1.2),
        ),
        child: Stack(
          children: [
            // Corner tab (rotated ink square in the top-right)
            Positioned(
              right: -28,
              top: -28,
              child: Transform.rotate(
                angle: 0.785, // 45deg
                child: Container(
                  width: 64,
                  height: 64,
                  color: T.ink,
                ),
              ),
            ),
            // Tab letter
            Positioned(
              right: 10,
              top: 6,
              child: Text(
                'Q',
                style: TextStyle(
                  color: T.paper,
                  fontStyle: FontStyle.italic,
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            // Body
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      style: TextStyle(
                        color: T.ink,
                        fontSize: 20,
                        height: 1.2,
                        letterSpacing: -0.2,
                        fontWeight: FontWeight.w400,
                      ),
                      children: [
                        const TextSpan(text: 'The weekly tending — '),
                        TextSpan(
                          text: dueText,
                          style: TextStyle(
                            color: urgent || overdue
                                ? T.coralDeep
                                : T.coral,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.only(right: 80),
                    child: Text(
                      'Five questions on chapters $chapters. Miss the window and ${_speciesShort()} will begin to wilt.',
                      style: const TextStyle(
                        color: T.inkSoft,
                        fontStyle: FontStyle.italic,
                        fontSize: 13,
                        height: 1.45,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      _BeginButton(onPressed: widget.onBegin),
                      const Spacer(),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            _formatCountdown(due),
                            style: const TextStyle(
                              color: T.ink,
                              fontSize: 22,
                              height: 1.0,
                              fontWeight: FontWeight.w500,
                              letterSpacing: -0.4,
                              fontFeatures: [FontFeature.tabularFigures()],
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'UNTIL THIRST',
                            style: TextStyle(
                              color: T.inkMuted,
                              fontSize: 9,
                              letterSpacing: 1.8,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BeginButton extends StatelessWidget {
  const _BeginButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(
          color: T.ink,
          borderRadius: BorderRadius.circular(2),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'BEGIN THE RITE',
              style: TextStyle(
                color: T.paper,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.6,
              ),
            ),
            const SizedBox(width: 8),
            Icon(Icons.arrow_forward_rounded, color: T.paper, size: 14),
          ],
        ),
      ),
    );
  }
}
