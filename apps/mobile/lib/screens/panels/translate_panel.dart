import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../state/progress.dart';
import '../../state/session.dart';
import '../../theme/tokens.dart';
import '../../widgets/lumi_mascot.dart';
import '../../widgets/quest_button.dart';
import '../../widgets/sticker_card.dart';

class TranslatePanel extends StatefulWidget {
  const TranslatePanel({
    super.key,
    required this.bookId,
    this.sourceLanguage,
    this.selectedTranslationId,
    required this.onSelect,
  });

  final String bookId;
  final String? sourceLanguage;
  final String? selectedTranslationId;
  final ValueChanged<String?> onSelect;

  @override
  State<TranslatePanel> createState() => _TranslatePanelState();
}

class _TranslatePanelState extends State<TranslatePanel> {
  static const _languages = [
    ('en', '🇬🇧', 'English'),
    ('fr', '🇫🇷', 'Français'),
    ('es', '🇪🇸', 'Español'),
    ('de', '🇩🇪', 'Deutsch'),
    ('it', '🇮🇹', 'Italiano'),
    ('pt', '🇵🇹', 'Português'),
    ('nl', '🇳🇱', 'Nederlands'),
    ('ar', '🇸🇦', 'العربية'),
    ('zh', '🇨🇳', '中文'),
    ('ja', '🇯🇵', '日本語'),
    ('ko', '🇰🇷', '한국어'),
    ('ru', '🇷🇺', 'Русский'),
  ];

  List<Translation> _translations = const [];
  bool _loading = true;
  String? _error;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 3), (_) {
      if (!mounted) return;
      if (_translations.any((t) =>
          t.status == TranslationStatus.queued ||
          t.status == TranslationStatus.inProgress)) {
        _refresh(silent: true);
      }
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _refresh({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final list =
          await context.read<Session>().translations.list(widget.bookId);
      if (!mounted) return;
      setState(() {
        _translations = list;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = describeError(e);
      });
    }
  }

  Future<void> _start(String code) async {
    try {
      await context.read<Session>().translations.create(widget.bookId, code);
      await context.read<Progress>().addXp(10);
      await _refresh(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(describeError(e))));
    }
  }

  Future<void> _retry(String id) async {
    try {
      await context.read<Session>().translations.retry(id);
      await _refresh(silent: true);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final byCode = {for (final t in _translations) t.targetLanguage: t};
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 28),
      children: [
        StickerCard(
          color: T.sky.withValues(alpha: 0.18),
          tilt: -0.008,
          child: Row(
            children: [
              const LumiMascot(mood: LumiMood.cheer, size: 56),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pick a language',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.sourceLanguage == null
                          ? 'I\'ll translate the whole book.'
                          : 'Original: ${widget.sourceLanguage!.toUpperCase()} · I\'ll handle the rest.',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: T.inkSoft),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ..._languages.map((lang) {
          final code = lang.$1;
          final t = byCode[code];
          if (widget.sourceLanguage?.toLowerCase() == code) {
            return _OriginalRow(flag: lang.$2, name: lang.$3);
          }
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _LangRow(
              flag: lang.$2,
              name: lang.$3,
              code: code,
              translation: t,
              isSelected: t != null && t.id == widget.selectedTranslationId,
              onStart: () => _start(code),
              onSelect: () => widget.onSelect(t?.id),
              onRetry: t == null ? null : () => _retry(t.id),
            ),
          );
        }),
        if (_loading) ...[
          const SizedBox(height: 8),
          const Center(child: CircularProgressIndicator(color: T.skyDeep)),
        ],
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(
            _error!,
            style: const TextStyle(color: T.candyDeep, fontFamily: 'Nunito'),
          ),
        ],
      ],
    );
  }
}

class _OriginalRow extends StatelessWidget {
  const _OriginalRow({required this.flag, required this.name});
  final String flag;
  final String name;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: StickerCard(
        color: T.paper3,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Text(flag, style: const TextStyle(fontSize: 26)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                '$name (original)',
                style: const TextStyle(
                  color: T.ink,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                ),
              ),
            ),
            const Pill(label: 'SOURCE', color: T.paper),
          ],
        ),
      ),
    );
  }
}

class _LangRow extends StatelessWidget {
  const _LangRow({
    required this.flag,
    required this.name,
    required this.code,
    required this.translation,
    required this.isSelected,
    required this.onStart,
    required this.onSelect,
    required this.onRetry,
  });

  final String flag;
  final String name;
  final String code;
  final Translation? translation;
  final bool isSelected;
  final VoidCallback onStart;
  final VoidCallback onSelect;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final t = translation;
    final ready = t?.status == TranslationStatus.ready;
    final failed = t?.status == TranslationStatus.failed;

    Color cardColor = T.paper;
    if (isSelected) cardColor = T.mint.withValues(alpha: 0.20);
    if (failed) cardColor = T.candy.withValues(alpha: 0.15);

    return StickerCard(
      color: cardColor,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      onTap: ready ? onSelect : null,
      borderColor: isSelected ? T.mintDeep : T.ink,
      child: Row(
        children: [
          Text(flag, style: const TextStyle(fontSize: 26)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: const TextStyle(
                          color: T.ink,
                          fontFamily: 'Nunito',
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    if (isSelected)
                      const Pill(
                        label: 'READING',
                        color: T.mint,
                        foreground: T.ink,
                        icon: Icons.check_rounded,
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                _statusLine(),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _trailing(),
        ],
      ),
    );
  }

  Widget _statusLine() {
    final t = translation;
    if (t == null) {
      return const Text(
        'Tap to start translation',
        style: TextStyle(
          color: T.inkSoft,
          fontFamily: 'Nunito',
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      );
    }
    switch (t.status) {
      case TranslationStatus.queued:
        return const Text('Queued · waiting in line',
            style: TextStyle(
              color: T.skyDeep,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ));
      case TranslationStatus.inProgress:
        return Row(
          children: [
            Container(
              width: 80,
              height: 8,
              decoration: BoxDecoration(
                color: T.paper3,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: T.ink, width: 1),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(99),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(
                    widthFactor: (t.progressPct / 100).clamp(0.05, 1.0),
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(colors: [T.sky, T.skyDeep]),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '${t.progressPct}%',
              style: const TextStyle(
                color: T.skyDeep,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ],
        );
      case TranslationStatus.ready:
        return const Text(
          'Ready ✦ tap to read in this language',
          style: TextStyle(
            color: T.mintDeep,
            fontFamily: 'Nunito',
            fontWeight: FontWeight.w900,
            fontSize: 12,
          ),
        );
      case TranslationStatus.failed:
        return Text(
          t.errorMessage ?? 'Hit a snag',
          style: const TextStyle(
            color: T.candyDeep,
            fontFamily: 'Nunito',
            fontWeight: FontWeight.w800,
            fontSize: 12,
          ),
        );
    }
  }

  Widget _trailing() {
    final t = translation;
    if (t == null) {
      return QuestButton(
        label: 'Start',
        size: QuestButtonSize.small,
        color: T.saffron,
        expand: false,
        onPressed: onStart,
      );
    }
    if (t.status == TranslationStatus.failed) {
      return QuestButton(
        label: 'Retry',
        size: QuestButtonSize.small,
        color: T.candy,
        foreground: T.paper,
        expand: false,
        onPressed: onRetry,
      );
    }
    if (t.status == TranslationStatus.ready) {
      return Icon(
        isSelected ? Icons.menu_book_rounded : Icons.chevron_right_rounded,
        color: T.ink,
      );
    }
    return const SizedBox(
      width: 22,
      height: 22,
      child: CircularProgressIndicator(strokeWidth: 2.6, color: T.skyDeep),
    );
  }
}
