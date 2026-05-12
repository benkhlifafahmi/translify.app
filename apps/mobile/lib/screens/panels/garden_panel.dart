import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../state/session.dart';
import '../../theme/tokens.dart';
import '../../widgets/garden_plate.dart';
import '../../widgets/growth_journal.dart';
import '../../widgets/lumi_mascot.dart';
import '../../widgets/plant_painter.dart';
import '../../widgets/quest_button.dart';
import '../../widgets/sticker_card.dart';
import '../../widgets/vitality_panel.dart';
import '../../widgets/weekly_tending_card.dart';
import '../tending_screen.dart';
import 'garden_customize_sheet.dart';

/// Editorial Garden tab — mirrors apps/web/src/components/garden/mobile-garden-panel.tsx.
class GardenPanel extends StatefulWidget {
  const GardenPanel({super.key, required this.bookId});
  final String bookId;

  @override
  State<GardenPanel> createState() => _GardenPanelState();
}

class _GardenPanelState extends State<GardenPanel> {
  Garden? _garden;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final g = await context.read<Session>().gardens.get(widget.bookId);
      if (!mounted) return;
      setState(() => _garden = g);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openCustomize() async {
    if (_garden == null) return;
    final fresh = await showGardenCustomizeSheet(
      context: context,
      garden: _garden!,
    );
    if (fresh != null && mounted) setState(() => _garden = fresh);
  }

  Future<void> _openTending() async {
    if (_garden == null) return;
    final result = await Navigator.of(context).push<TendingResult>(
      MaterialPageRoute(builder: (_) => TendingScreen(garden: _garden!)),
    );
    if (result != null && mounted) _refresh();
  }

  Future<void> _pickSpecies(GardenSpecies s) async {
    if (_garden == null || s == _garden!.species) return;
    try {
      final fresh = await context.read<Session>().gardens.update(
            widget.bookId,
            species: s,
          );
      if (!mounted) return;
      setState(() => _garden = fresh);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(describeError(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _garden == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              LumiMascot(mood: LumiMood.thinking, size: 100),
              SizedBox(height: 10),
              Text(
                'Drawing the specimen…',
                style: TextStyle(
                  color: T.inkSoft,
                  fontWeight: FontWeight.w500,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
      );
    }
    if (_error != null && _garden == null) {
      return _GardenError(error: _error!, onRetry: _refresh);
    }
    final g = _garden!;
    final plateNum = g.bookId.length >= 2
        ? g.bookId.substring(g.bookId.length - 2).toUpperCase()
        : g.bookId.toUpperCase();
    return RefreshIndicator(
      onRefresh: _refresh,
      color: T.sageDeep,
      backgroundColor: T.paper,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          // ── Editorial micro-header ──
          Row(
            children: [
              Expanded(
                child: Text(
                  'Plate № $plateNum · day ${g.daysSinceStart}',
                  style: TextStyle(
                    color: T.inkMuted,
                    fontSize: 11,
                    letterSpacing: 1.8,
                    fontWeight: FontWeight.w700,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
              Text(
                _speciesWire(g.species),
                style: const TextStyle(
                  color: T.sageDeep,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 4),
              IconButton(
                onPressed: _openCustomize,
                icon: const Icon(Icons.tune_rounded,
                    color: T.inkSoft, size: 18),
                tooltip: 'Customize',
                visualDensity: VisualDensity.compact,
                style: IconButton.styleFrom(
                  padding: const EdgeInsets.all(4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // ── Editorial headline: "The Garden of \n {bookTitle}" ──
          RichText(
            text: TextSpan(
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontSize: 28,
                    height: 1.0,
                    letterSpacing: -0.6,
                    fontWeight: FontWeight.w300,
                    fontStyle: FontStyle.italic,
                  ),
              children: [
                TextSpan(
                  text: 'The Garden of\n',
                  style: const TextStyle(color: T.coral),
                ),
                TextSpan(
                  text: g.bookTitle,
                  style: const TextStyle(
                    color: T.ink,
                    fontWeight: FontWeight.w500,
                    fontStyle: FontStyle.normal,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Each page turned waters the soil — neglect, and the green will turn.',
            style: TextStyle(
              color: T.inkSoft,
              fontStyle: FontStyle.italic,
              fontSize: 13,
              height: 1.5,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 18),
          GardenPlate(garden: g),
          const SizedBox(height: 16),
          VitalityPanel(garden: g),
          const SizedBox(height: 16),
          WeeklyTendingCard(garden: g, onBegin: _openTending),
          const SizedBox(height: 22),
          GrowthJournal(entries: g.journal),
          const SizedBox(height: 22),
          // ── Inline species picker (preview tiles) ──
          Container(
            padding: const EdgeInsets.all(16),
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
                Text(
                  'Choose a species',
                  style:
                      Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontStyle: FontStyle.italic,
                          ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Each species rewards different reading habits.',
                  style: TextStyle(
                    color: T.inkMuted,
                    fontStyle: FontStyle.italic,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 12),
                _InlineSpeciesGrid(
                  selected: g.species,
                  onSelect: _pickSpecies,
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          QuestButton(
            label: 'Open the full almanac',
            iconRight: Icons.arrow_forward_rounded,
            color: T.ink,
            foreground: T.paper,
            size: QuestButtonSize.large,
            onPressed: _openCustomize,
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              'plate of ${g.bookTitle}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: T.inkMuted,
                fontStyle: FontStyle.italic,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────── Inline species grid ───────────────────────

class _InlineSpeciesGrid extends StatelessWidget {
  const _InlineSpeciesGrid({required this.selected, required this.onSelect});
  final GardenSpecies selected;
  final ValueChanged<GardenSpecies> onSelect;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: speciesCatalog.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 0.95,
      ),
      itemBuilder: (context, i) {
        final s = speciesCatalog[i];
        final active = s.id == selected;
        return Opacity(
          opacity: s.unlocked ? 1.0 : 0.55,
          child: GestureDetector(
            onTap: s.unlocked ? () => onSelect(s.id) : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: active ? T.ink : T.paper,
                borderRadius: BorderRadius.circular(2),
                border: Border.all(
                  color: active ? T.ink : T.paper3,
                  width: 1.2,
                ),
              ),
              child: Column(
                children: [
                  Expanded(
                    child: PlantSvg(
                      species: s.id,
                      stage: 4,
                      width: 56,
                      height: 80,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    s.name,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: active ? T.paper : T.ink,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  Text(
                    s.unlocked ? s.latin : 'Locked',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: active
                          ? T.paper.withValues(alpha: 0.65)
                          : T.inkMuted,
                      fontSize: 10,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────── Error ───────────────────────

class _GardenError extends StatelessWidget {
  const _GardenError({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        StickerCard(
          color: T.coral.withValues(alpha: 0.16),
          borderColor: T.coral,
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const LumiMascot(mood: LumiMood.sad, size: 90),
              const SizedBox(height: 6),
              Text(
                "Lumi couldn't reach the garden",
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                error,
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
      ],
    );
  }
}

// ─────────────────────── helpers ───────────────────────

String _speciesWire(GardenSpecies s) => switch (s) {
      GardenSpecies.ficus => 'ficus',
      GardenSpecies.helianthus => 'helianthus',
      GardenSpecies.lavandula => 'lavandula',
      GardenSpecies.monstera => 'monstera',
    };
