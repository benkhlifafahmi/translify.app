import 'package:flutter/material.dart';

import '../api/models.dart';
import '../theme/tokens.dart';

/// Editorial growth journal — date column + per-kind icon + entry + delta,
/// laid out around a dashed vertical timeline rail.
/// Port of apps/web/src/components/garden/growth-journal.tsx.
class GrowthJournal extends StatelessWidget {
  const GrowthJournal({super.key, required this.entries});
  final List<GardenJournalEntry> entries;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Headline + "last seven days"
        Container(
          padding: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: T.paper3, width: 1)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Expanded(
                child: Text(
                  'Growth Journal',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontStyle: FontStyle.italic,
                        fontSize: 30,
                        fontWeight: FontWeight.w300,
                      ),
                ),
              ),
              Text(
                'LAST SEVEN DAYS',
                style: TextStyle(
                  color: T.inkMuted,
                  fontSize: 10,
                  letterSpacing: 1.8,
                  fontWeight: FontWeight.w700,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
        if (entries.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Text(
              'No entries yet — read or quiz to fill the journal.',
              style: TextStyle(
                color: T.inkMuted,
                fontStyle: FontStyle.italic,
                fontWeight: FontWeight.w500,
              ),
            ),
          )
        else
          _JournalList(entries: entries),
      ],
    );
  }
}

class _JournalList extends StatelessWidget {
  const _JournalList({required this.entries});
  final List<GardenJournalEntry> entries;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Dashed vertical timeline rail behind the icon column
        Positioned(
          left: 84,
          top: 14,
          bottom: 14,
          width: 1,
          child: IgnorePointer(
            child: CustomPaint(painter: _DashedRailPainter()),
          ),
        ),
        Column(
          children: entries.map((e) => _JournalRow(entry: e)).toList(),
        ),
      ],
    );
  }
}

class _JournalRow extends StatelessWidget {
  const _JournalRow({required this.entry});
  final GardenJournalEntry entry;

  @override
  Widget build(BuildContext context) {
    final k = _kindStyle(entry.kind);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: T.paper3.withValues(alpha: 0.5),
            width: 1,
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Date column (~74w + 8 gap)
          SizedBox(
            width: 74,
            child: Text(
              _formatJournalDate(entry.at),
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: T.inkMuted,
                fontSize: 11,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Icon disc — centered over the rail
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: k.bg,
              shape: BoxShape.circle,
              border: Border.all(color: T.paper3, width: 1),
            ),
            alignment: Alignment.center,
            child: CustomPaint(
              size: const Size(14, 14),
              painter: _KindGlyphPainter(kind: entry.kind, color: k.fg),
            ),
          ),
          const SizedBox(width: 10),
          // What text — italic <em> highlights via simple split
          Expanded(
            child: _RichWhatText(entry.what),
          ),
          // Delta — sage/coral tabular nums
          if (entry.delta.isNotEmpty) ...[
            const SizedBox(width: 6),
            Text(
              entry.delta,
              style: TextStyle(
                color: entry.warn ? T.coralDeep : T.sageDeep,
                fontSize: 14,
                fontWeight: FontWeight.w500,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Renders journal "what" text with very simple `<em>…</em>` support.
/// The API returns plain strings most of the time but occasionally uses
/// <em> tags for inline emphasis.
class _RichWhatText extends StatelessWidget {
  const _RichWhatText(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    final spans = <TextSpan>[];
    var i = 0;
    while (i < text.length) {
      final emOpen = text.indexOf('<em>', i);
      if (emOpen < 0) {
        spans.add(TextSpan(text: text.substring(i)));
        break;
      }
      if (emOpen > i) spans.add(TextSpan(text: text.substring(i, emOpen)));
      final emClose = text.indexOf('</em>', emOpen + 4);
      if (emClose < 0) {
        spans.add(TextSpan(text: text.substring(emOpen)));
        break;
      }
      spans.add(TextSpan(
        text: text.substring(emOpen + 4, emClose),
        style: const TextStyle(
          fontStyle: FontStyle.italic,
          color: T.inkSoft,
        ),
      ));
      i = emClose + 5;
    }
    return RichText(
      text: TextSpan(
        style: const TextStyle(
          color: T.ink,
          fontSize: 14,
          height: 1.4,
        ),
        children: spans,
      ),
    );
  }
}

// ─── styles / painters / helpers ───────────────────────────────────────

({Color bg, Color fg}) _kindStyle(GardenEventKind kind) => switch (kind) {
      GardenEventKind.read => (bg: T.ink, fg: T.paper),
      GardenEventKind.quiz => (bg: T.saffron, fg: T.ink),
      GardenEventKind.water => (bg: T.paper3, fg: T.sageDeep),
      GardenEventKind.skip => (bg: T.coral, fg: T.paper),
      GardenEventKind.translate => (bg: T.sageDeep, fg: T.paper),
      GardenEventKind.tend => (bg: T.saffronDeep, fg: T.paper),
    };

class _KindGlyphPainter extends CustomPainter {
  _KindGlyphPainter({required this.kind, required this.color});
  final GardenEventKind kind;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final w = size.width;
    final h = size.height;
    switch (kind) {
      case GardenEventKind.read:
        // Book bookmark
        final p = Path()
          ..moveTo(3 / 14 * w, 2 / 14 * h)
          ..lineTo(11 / 14 * w, 2 / 14 * h)
          ..lineTo(11 / 14 * w, 12 / 14 * h)
          ..lineTo(7 / 14 * w, 10 / 14 * h)
          ..lineTo(3 / 14 * w, 12 / 14 * h)
          ..close();
        canvas.drawPath(p, paint);
        break;
      case GardenEventKind.quiz:
      case GardenEventKind.tend:
        // 5-point star
        final p = Path()
          ..moveTo(7 / 14 * w, 1 / 14 * h)
          ..lineTo(9 / 14 * w, 5 / 14 * h)
          ..lineTo(13 / 14 * w, 6 / 14 * h)
          ..lineTo(10 / 14 * w, 9 / 14 * h)
          ..lineTo(11 / 14 * w, 13 / 14 * h)
          ..lineTo(7 / 14 * w, 11 / 14 * h)
          ..lineTo(3 / 14 * w, 13 / 14 * h)
          ..lineTo(4 / 14 * w, 9 / 14 * h)
          ..lineTo(1 / 14 * w, 6 / 14 * h)
          ..lineTo(5 / 14 * w, 5 / 14 * h)
          ..close();
        canvas.drawPath(p, paint);
        break;
      case GardenEventKind.water:
        canvas.drawCircle(Offset(7 / 14 * w, 7 / 14 * h), 3 / 14 * w, paint);
        break;
      case GardenEventKind.skip:
        // teardrop
        final p = Path()
          ..moveTo(7 / 14 * w, 2 / 14 * h)
          ..cubicTo(3 / 14 * w, 6 / 14 * h, 3 / 14 * w, 9 / 14 * h,
              7 / 14 * w, 12 / 14 * h)
          ..cubicTo(11 / 14 * w, 9 / 14 * h, 11 / 14 * w, 6 / 14 * h,
              7 / 14 * w, 2 / 14 * h)
          ..close();
        canvas.drawPath(p, paint);
        break;
      case GardenEventKind.translate:
        // two side-by-side rectangles
        canvas.drawRect(
            Rect.fromLTWH(2 / 14 * w, 4 / 14 * h, 4 / 14 * w, 6 / 14 * h),
            stroke);
        canvas.drawRect(
            Rect.fromLTWH(8 / 14 * w, 4 / 14 * h, 4 / 14 * w, 6 / 14 * h),
            stroke);
        break;
    }
  }

  @override
  bool shouldRepaint(covariant _KindGlyphPainter old) =>
      old.kind != kind || old.color != color;
}

class _DashedRailPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = T.paper3
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;
    double y = 0;
    while (y < size.height) {
      canvas.drawLine(Offset(0, y), Offset(0, y + 3), paint);
      y += 6;
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRailPainter old) => false;
}

const _monthAbbr = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

String _formatJournalDate(DateTime at) {
  final day = at.day.toString().padLeft(2, '0');
  final month = _monthAbbr[at.month - 1];
  final hh = at.hour.toString().padLeft(2, '0');
  final mm = at.minute.toString().padLeft(2, '0');
  return '$day $month · $hh:$mm';
}
