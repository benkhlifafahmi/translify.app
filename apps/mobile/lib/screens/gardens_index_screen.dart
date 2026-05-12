import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/plant_painter.dart';
import '../widgets/quest_button.dart';
import '../widgets/sticker_card.dart';

/// Index of every garden the user is tending — one tile per book.
/// Mirror of apps/web/src/components/garden/other-gardens.tsx + the
/// /garden page header.
class GardensIndexScreen extends StatefulWidget {
  const GardensIndexScreen({super.key});

  @override
  State<GardensIndexScreen> createState() => _GardensIndexScreenState();
}

class _GardensIndexScreenState extends State<GardensIndexScreen> {
  Future<List<GardenSummary>>? _future;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  void _refresh() {
    setState(() {
      _future = context.read<Session>().gardens.list();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PaperBackground(
        child: SafeArea(
          child: Column(
            children: [
              _Header(onBack: () => Navigator.of(context).pop()),
              Expanded(
                child: RefreshIndicator(
                  color: T.sageDeep,
                  backgroundColor: T.paper,
                  onRefresh: () async => _refresh(),
                  child: FutureBuilder<List<GardenSummary>>(
                    future: _future,
                    builder: (context, snap) {
                      if (snap.connectionState == ConnectionState.waiting &&
                          !snap.hasData) {
                        return const _GardensLoading();
                      }
                      if (snap.hasError) {
                        return _GardensError(
                          error: snap.error.toString(),
                          onRetry: _refresh,
                        );
                      }
                      final gardens = snap.data ?? const <GardenSummary>[];
                      if (gardens.isEmpty) {
                        return const _GardensEmpty();
                      }
                      return _GardensGrid(gardens: gardens);
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ────────────────────────── Header ──────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.onBack});
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 14, 6),
      child: Row(
        children: [
          IconButton(
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back_rounded, color: T.ink),
            style: IconButton.styleFrom(
              backgroundColor: T.paper,
              side: const BorderSide(color: T.ink, width: 1.4),
              shape: const CircleBorder(),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'YOUR GARDENS',
                  style: TextStyle(
                    color: T.inkSoft.withValues(alpha: 0.9),
                    fontWeight: FontWeight.w800,
                    fontSize: 10,
                    letterSpacing: 2.0,
                  ),
                ),
                Text(
                  'The almanac',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontStyle: FontStyle.italic,
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

// ────────────────────────── Grid ──────────────────────────

class _GardensGrid extends StatelessWidget {
  const _GardensGrid({required this.gardens});
  final List<GardenSummary> gardens;

  @override
  Widget build(BuildContext context) {
    final thriving = gardens
        .where((g) =>
            g.health == GardenHealth.thriving ||
            g.health == GardenHealth.budding)
        .length;
    final wilting = gardens
        .where((g) =>
            g.health == GardenHealth.wilting ||
            g.health == GardenHealth.dying)
        .length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(2, 0, 2, 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Text(
                  'Under your care',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontStyle: FontStyle.italic,
                      ),
                ),
              ),
              Text(
                '$thriving thriving · $wilting wilting',
                style: const TextStyle(
                  color: T.inkSoft,
                  fontSize: 11,
                  letterSpacing: 1.6,
                  fontStyle: FontStyle.italic,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        const Divider(
          color: T.paper3,
          height: 1,
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: gardens.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            // The tile is plant box (h ≈ 120) + title block + bar.
            childAspectRatio: 0.72,
          ),
          itemBuilder: (context, i) => _GardenTile(garden: gardens[i]),
        ),
      ],
    );
  }
}

class _GardenTile extends StatelessWidget {
  const _GardenTile({required this.garden});
  final GardenSummary garden;

  bool get _dying =>
      garden.health == GardenHealth.wilting ||
      garden.health == GardenHealth.dying;

  String get _healthLabel => switch (garden.health) {
        GardenHealth.thriving => 'thriving',
        GardenHealth.budding => 'budding',
        GardenHealth.wilting => 'wilting',
        GardenHealth.dying => 'dying',
      };

  @override
  Widget build(BuildContext context) {
    final color = _dying ? T.coral : T.sageDeep;
    return GestureDetector(
      onTap: () => Navigator.of(context)
          .pushNamed('/book', arguments: garden.bookId),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        decoration: BoxDecoration(
          color: T.paper.withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(T.radiusSm),
          border: Border.all(color: T.paper3, width: 1),
          boxShadow: [
            BoxShadow(
              color: T.ink.withValues(alpha: 0.10),
              blurRadius: 18,
              offset: const Offset(0, 12),
              spreadRadius: -10,
            ),
          ],
        ),
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Mini diorama
            Container(
              height: 116,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFFFFFCF3), T.paper2],
                ),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: T.paper3,
                  width: 1,
                  style: BorderStyle.solid,
                ),
              ),
              child: Stack(
                children: [
                  // health pill (top-right)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: T.paper.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(3),
                        border: Border.all(color: T.paper3, width: 1),
                      ),
                      child: Text(
                        _healthLabel,
                        style: TextStyle(
                          color: color,
                          fontSize: 9,
                          letterSpacing: 1.4,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  // plant
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 14,
                    child: Center(
                      child: PlantSvg(
                        species: garden.species,
                        stage: garden.stage,
                        wilting: _dying,
                        width: 56,
                        height: 86,
                      ),
                    ),
                  ),
                  // soil
                  Positioned(
                    left: 8,
                    right: 8,
                    bottom: 6,
                    child: Container(
                      height: 12,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(3),
                        gradient: const LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Color(0xFF8B6939), Color(0xFF5A4423)],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              garden.bookTitle,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: T.ink,
                fontStyle: FontStyle.italic,
                fontWeight: FontWeight.w600,
                fontSize: 14,
                height: 1.2,
              ),
            ),
            if (garden.bookAuthor != null && garden.bookAuthor!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 1),
                child: Text(
                  garden.bookAuthor!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: T.inkMuted,
                    fontStyle: FontStyle.italic,
                    fontSize: 11,
                  ),
                ),
              ),
            const Spacer(),
            // growth bar
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: SizedBox(
                height: 4,
                child: LinearProgressIndicator(
                  value: (garden.growthPercent / 100).clamp(0, 1),
                  backgroundColor: T.paper3,
                  valueColor: AlwaysStoppedAnimation(color),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ────────────────────────── States ──────────────────────────

class _GardensLoading extends StatelessWidget {
  const _GardensLoading();
  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        SizedBox(height: 60),
        Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              LumiMascot(mood: LumiMood.thinking, size: 110),
              SizedBox(height: 8),
              Text(
                'Walking the rows…',
                style: TextStyle(
                  color: T.inkSoft,
                  fontWeight: FontWeight.w600,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _GardensEmpty extends StatelessWidget {
  const _GardensEmpty();
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
      children: [
        Center(
          child: StickerCard(
            color: T.sage.withValues(alpha: 0.14),
            borderColor: T.sage,
            padding: const EdgeInsets.all(22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const LumiMascot(mood: LumiMood.happy, size: 110),
                const SizedBox(height: 8),
                Text(
                  'No gardens yet',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontStyle: FontStyle.italic,
                      ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Open any book to plant your first seed.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: T.inkSoft,
                    fontStyle: FontStyle.italic,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 14),
                QuestButton(
                  label: 'Back to library',
                  iconRight: Icons.menu_book_rounded,
                  color: T.sage,
                  foreground: T.paper,
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _GardensError extends StatelessWidget {
  const _GardensError({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
      children: [
        Center(
          child: StickerCard(
            color: T.coral.withValues(alpha: 0.14),
            borderColor: T.coral,
            padding: const EdgeInsets.all(22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const LumiMascot(mood: LumiMood.sad, size: 100),
                const SizedBox(height: 8),
                Text(
                  'The almanac is shut',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontStyle: FontStyle.italic,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  describeError(error),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: T.inkSoft,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 14),
                QuestButton(
                  label: 'Try again',
                  iconRight: Icons.refresh_rounded,
                  color: T.coral,
                  foreground: T.paper,
                  onPressed: onRetry,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
