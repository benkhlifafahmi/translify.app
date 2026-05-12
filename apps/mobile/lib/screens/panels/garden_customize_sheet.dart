import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../state/session.dart';
import '../../theme/tokens.dart';
import '../../widgets/farmer_painter.dart';
import '../../widgets/plant_painter.dart';
import '../../widgets/quest_button.dart';

/// Bottom sheet for choosing the plant species + customizing the farmer.
/// Returns the updated [Garden] when the user saves (or null on cancel).
Future<Garden?> showGardenCustomizeSheet({
  required BuildContext context,
  required Garden garden,
}) {
  return showModalBottomSheet<Garden>(
    context: context,
    isScrollControlled: true,
    backgroundColor: T.paper,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) => _CustomizeSheet(garden: garden),
  );
}

class _CustomizeSheet extends StatefulWidget {
  const _CustomizeSheet({required this.garden});
  final Garden garden;

  @override
  State<_CustomizeSheet> createState() => _CustomizeSheetState();
}

class _CustomizeSheetState extends State<_CustomizeSheet> {
  late GardenSpecies _species = widget.garden.species;
  late Farmer _farmer = widget.garden.farmer;
  bool _saving = false;
  String? _error;

  bool get _dirty =>
      _species != widget.garden.species ||
      _farmer.hat != widget.garden.farmer.hat ||
      _farmer.coat != widget.garden.farmer.coat ||
      _farmer.skin != widget.garden.farmer.skin ||
      _farmer.tool != widget.garden.farmer.tool;

  Future<void> _save() async {
    if (!_dirty) {
      Navigator.of(context).pop();
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final fresh = await context.read<Session>().gardens.update(
            widget.garden.bookId,
            species: _species != widget.garden.species ? _species : null,
            farmer: _farmer,
          );
      if (!mounted) return;
      Navigator.of(context).pop(fresh);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = describeError(e);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInset = MediaQuery.of(context).viewInsets.bottom;
    final maxH = MediaQuery.of(context).size.height * 0.9;
    return Padding(
      padding: EdgeInsets.only(bottom: viewInset),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxH),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // grabber
            Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(top: 10, bottom: 4),
              decoration: BoxDecoration(
                color: T.paper3,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tend your garden',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const Text(
                          'Pick the plant and dress the keeper.',
                          style: TextStyle(
                            color: T.inkSoft,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: T.inkSoft),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                children: [
                  const _SectionLabel('CHOOSE A SPECIES'),
                  const SizedBox(height: 8),
                  _SpeciesGrid(
                    selected: _species,
                    onSelect: (s) => setState(() => _species = s),
                  ),
                  const SizedBox(height: 24),
                  const _SectionLabel('THE KEEPER'),
                  const SizedBox(height: 8),
                  _FarmerDesigner(
                    farmer: _farmer,
                    onChange: (f) => setState(() => _farmer = f),
                  ),
                ],
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Text(
                  _error!,
                  style: const TextStyle(
                    color: T.coralDeep,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 14),
                child: QuestButton(
                  label: _saving ? 'Saving…' : (_dirty ? 'Save changes' : 'Close'),
                  iconRight:
                      _dirty ? Icons.check_rounded : Icons.close_rounded,
                  color: _dirty ? T.sage : T.paper3,
                  foreground: _dirty ? T.paper : T.inkSoft,
                  size: QuestButtonSize.large,
                  loading: _saving,
                  onPressed: _saving ? null : _save,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: T.inkSoft,
        fontWeight: FontWeight.w800,
        fontSize: 11,
        letterSpacing: 1.6,
      ),
    );
  }
}

// ─────────────────────── Species grid ───────────────────────

class _SpeciesGrid extends StatelessWidget {
  const _SpeciesGrid({required this.selected, required this.onSelect});
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
                borderRadius: BorderRadius.circular(T.radiusSm),
                border: Border.all(
                  color: active ? T.ink : T.paper3,
                  width: 1.4,
                ),
                boxShadow: active
                    ? [
                        BoxShadow(
                          color: T.ink.withValues(alpha: 0.18),
                          blurRadius: 14,
                          offset: const Offset(0, 6),
                        ),
                      ]
                    : null,
              ),
              child: Column(
                children: [
                  Expanded(
                    child: ColorFiltered(
                      colorFilter: ColorFilter.mode(
                        active
                            ? T.paper.withValues(alpha: 0.05)
                            : Colors.transparent,
                        BlendMode.lighten,
                      ),
                      child: PlantSvg(
                        species: s.id,
                        stage: 4,
                        width: 64,
                        height: 92,
                      ),
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
                      fontWeight: FontWeight.w700,
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

// ─────────────────────── Farmer designer ───────────────────────

class _FarmerDesigner extends StatelessWidget {
  const _FarmerDesigner({required this.farmer, required this.onChange});
  final Farmer farmer;
  final ValueChanged<Farmer> onChange;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: T.paper2,
        borderRadius: BorderRadius.circular(T.radiusSm),
        border: Border.all(color: T.paper3, width: 1),
      ),
      child: Column(
        children: [
          // Preview
          Center(
            child: FarmerSvg(farmer: farmer, width: 90, height: 130),
          ),
          const SizedBox(height: 8),
          _OptionRow<FarmerHat>(
            label: 'HAT',
            value: farmer.hat,
            options: FarmerHat.values,
            labelOf: _hatLabel,
            onChange: (v) => onChange(farmer.copyWith(hat: v)),
          ),
          const SizedBox(height: 8),
          _OptionRow<FarmerCoat>(
            label: 'COAT',
            value: farmer.coat,
            options: FarmerCoat.values,
            labelOf: _coatLabel,
            onChange: (v) => onChange(farmer.copyWith(coat: v)),
          ),
          const SizedBox(height: 8),
          _OptionRow<FarmerSkin>(
            label: 'SKIN',
            value: farmer.skin,
            options: FarmerSkin.values,
            labelOf: _skinLabel,
            onChange: (v) => onChange(farmer.copyWith(skin: v)),
          ),
          const SizedBox(height: 8),
          _OptionRow<FarmerTool>(
            label: 'TOOL',
            value: farmer.tool,
            options: FarmerTool.values,
            labelOf: _toolLabel,
            onChange: (v) => onChange(farmer.copyWith(tool: v)),
          ),
        ],
      ),
    );
  }
}

class _OptionRow<O extends Object> extends StatelessWidget {
  const _OptionRow({
    required this.label,
    required this.value,
    required this.options,
    required this.labelOf,
    required this.onChange,
  });
  final String label;
  final O value;
  final List<O> options;
  final String Function(O) labelOf;
  final ValueChanged<O> onChange;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SizedBox(
          width: 46,
          child: Text(
            label,
            style: const TextStyle(
              color: T.inkSoft,
              fontWeight: FontWeight.w800,
              fontSize: 10,
              letterSpacing: 1.4,
            ),
          ),
        ),
        Expanded(
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            children: options.map((o) {
              final active = o == value;
              return GestureDetector(
                onTap: () => onChange(o),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: active ? T.ink : Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(
                      color: active ? T.ink : T.paper3,
                      width: 1.2,
                    ),
                  ),
                  child: Text(
                    labelOf(o),
                    style: TextStyle(
                      color: active ? T.paper : T.ink,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

String _hatLabel(FarmerHat h) => switch (h) {
      FarmerHat.straw => 'Straw',
      FarmerHat.wool => 'Wool',
      FarmerHat.scholar => 'Scholar',
      FarmerHat.none => 'None',
    };

String _coatLabel(FarmerCoat c) => switch (c) {
      FarmerCoat.denim => 'Denim',
      FarmerCoat.linen => 'Linen',
      FarmerCoat.earth => 'Earth',
      FarmerCoat.moss => 'Moss',
    };

String _skinLabel(FarmerSkin s) => switch (s) {
      FarmerSkin.fair => 'Fair',
      FarmerSkin.tan => 'Tan',
      FarmerSkin.umber => 'Umber',
      FarmerSkin.sepia => 'Sepia',
    };

String _toolLabel(FarmerTool t) => switch (t) {
      FarmerTool.wateringCan => 'Watering can',
      FarmerTool.shears => 'Shears',
      FarmerTool.lantern => 'Lantern',
      FarmerTool.book => 'Book',
    };
