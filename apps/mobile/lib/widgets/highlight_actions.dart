import 'package:flutter/material.dart';

import '../api/models.dart';
import '../theme/tokens.dart';
import 'lumi_mascot.dart';
import 'quest_button.dart';

/// Bottom sheet for adding a note to a highlighted passage. Returns the
/// entered note text (may be empty), or null if dismissed.
Future<String?> showHighlightNoteSheet(
  BuildContext context, {
  required String passage,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _NoteSheet(passage: passage),
  );
}

/// Highlight ink color used in viewers + the note card. Matches the
/// web app's HIGHLIGHT_COLOR_CLASS palette (Tailwind 200/300 with alpha).
Color highlightInkColor(HighlightColor c) => switch (c) {
      HighlightColor.yellow => const Color(0xFFFDE68A),
      HighlightColor.green => const Color(0xFFBBF7D0),
      HighlightColor.blue => const Color(0xFFBFDBFE),
      HighlightColor.pink => const Color(0xFFFBCFE8),
    };

/// Result of the note card — what the caller should reconcile after.
enum HighlightCardResult { updated, deleted, dismissed }

/// Bottom sheet listing all saved highlights for the book; returns the
/// tapped Highlight (or null if dismissed).
Future<Highlight?> showHighlightsListSheet(
  BuildContext context, {
  required List<Highlight> highlights,
  String pageLabel = 'page',
}) {
  return showModalBottomSheet<Highlight>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _HighlightsListSheet(
      highlights: highlights,
      pageLabel: pageLabel,
    ),
  );
}

/// Bottom sheet showing a saved highlight in detail: the passage, the
/// note (editable), the AI question + answer if any, the four color
/// chips and a delete button. The sheet mutates the highlight through
/// [onUpdate] / [onDelete] and returns the resulting action.
Future<HighlightCardResult> showHighlightNoteCard(
  BuildContext context, {
  required Highlight highlight,
  required Future<Highlight> Function({String? note, HighlightColor? color})
      onUpdate,
  required Future<void> Function() onDelete,
  required Future<Highlight> Function(String? question) onAskAi,
}) async {
  final res = await showModalBottomSheet<HighlightCardResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _NoteCard(
      initial: highlight,
      onUpdate: onUpdate,
      onDelete: onDelete,
      onAskAi: onAskAi,
    ),
  );
  return res ?? HighlightCardResult.dismissed;
}

/// Bottom sheet that creates a highlight + calls the ask-AI endpoint and
/// shows the answer in-place. [runAsk] receives the user's question and
/// must return a populated Highlight (creating the highlight and calling
/// the ask endpoint is the caller's responsibility).
Future<void> showHighlightAskAiSheet(
  BuildContext context, {
  required String passage,
  required Future<Highlight> Function(String question) runAsk,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _AskAiSheet(passage: passage, runAsk: runAsk),
  );
}

/// Compact floating pill — Highlight / Note / Ask AI — anchored to a
/// selection rect. Coordinates are local to the parent Stack.
///
/// Pass [containerSize] when the parent Stack does not fill the screen, so
/// the toolbar clamps to the right bounds. Defaults to the screen size.
class HighlightSelectionToolbar extends StatelessWidget {
  const HighlightSelectionToolbar({
    super.key,
    required this.anchor,
    required this.onHighlight,
    required this.onNote,
    required this.onAskAi,
    this.containerSize,
    this.containerTopPadding = 0,
  });

  /// Rect of the selection, in the parent Stack's local coordinates.
  final Rect anchor;
  final VoidCallback onHighlight;
  final VoidCallback onNote;
  final VoidCallback onAskAi;

  /// Size of the parent Stack. Defaults to MediaQuery.size if null.
  final Size? containerSize;

  /// Minimum top inset (e.g. safe-area top) the toolbar must respect.
  final double containerTopPadding;

  static const double _toolbarHeight = 42;
  static const double _toolbarWidth = 240;

  @override
  Widget build(BuildContext context) {
    final size = containerSize ?? MediaQuery.of(context).size;

    double top = anchor.top - _toolbarHeight - 10;
    if (top < containerTopPadding + 8) {
      top = anchor.bottom + 10;
    }
    double left = anchor.center.dx - _toolbarWidth / 2;
    left = left.clamp(8.0, size.width - _toolbarWidth - 8.0);

    return Positioned(
      left: left,
      top: top,
      child: Material(
        color: Colors.transparent,
        child: Container(
          height: _toolbarHeight,
          width: _toolbarWidth,
          decoration: BoxDecoration(
            color: T.ink,
            borderRadius: BorderRadius.circular(T.radiusPill),
            border: Border.all(color: T.ink, width: 1.4),
            boxShadow: T.stickerShadow(y: 3),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _ToolbarButton(
                icon: Icons.highlight_rounded,
                label: 'Highlight',
                onTap: onHighlight,
              ),
              _ToolbarButton(
                icon: Icons.bookmark_add_rounded,
                label: 'Note',
                onTap: onNote,
              ),
              _ToolbarButton(
                icon: Icons.auto_awesome_rounded,
                label: 'Ask AI',
                onTap: onAskAi,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ToolbarButton extends StatelessWidget {
  const _ToolbarButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(T.radiusPill),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w900,
                fontSize: 12,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────── Note sheet ───────────────────────────

class _NoteSheet extends StatefulWidget {
  const _NoteSheet({required this.passage});
  final String passage;

  @override
  State<_NoteSheet> createState() => _NoteSheetState();
}

class _NoteSheetState extends State<_NoteSheet> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final insets = MediaQuery.of(context).viewInsets;
    return Padding(
      padding: EdgeInsets.only(bottom: insets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: T.paper,
          borderRadius: BorderRadius.vertical(top: Radius.circular(T.radiusLg)),
          border: Border(top: BorderSide(color: T.ink, width: 1.4)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _SheetHandle(),
            Text('Add a note', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 10),
            _Passage(text: widget.passage),
            const SizedBox(height: 14),
            TextField(
              controller: _ctrl,
              autofocus: true,
              minLines: 3,
              maxLines: 6,
              decoration: _inputDeco(hint: "What's worth remembering here?"),
              style: const TextStyle(
                fontFamily: 'Nunito',
                fontSize: 14,
                color: T.ink,
              ),
            ),
            const SizedBox(height: 14),
            QuestButton(
              label: 'Save note',
              icon: Icons.bookmark_add_rounded,
              color: T.saffron,
              onPressed: () => Navigator.of(context).pop(_ctrl.text),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────── Ask AI sheet ─────────────────────────

class _AskAiSheet extends StatefulWidget {
  const _AskAiSheet({required this.passage, required this.runAsk});
  final String passage;
  final Future<Highlight> Function(String question) runAsk;

  @override
  State<_AskAiSheet> createState() => _AskAiSheetState();
}

class _AskAiSheetState extends State<_AskAiSheet> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _answer;
  String? _error;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _ask() async {
    if (_loading) return;
    setState(() {
      _loading = true;
      _answer = null;
      _error = null;
    });
    try {
      final h = await widget.runAsk(_ctrl.text);
      if (!mounted) return;
      setState(() {
        _answer = h.aiAnswer ?? '(no answer)';
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final insets = MediaQuery.of(context).viewInsets;
    return Padding(
      padding: EdgeInsets.only(bottom: insets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: T.paper,
          borderRadius: BorderRadius.vertical(top: Radius.circular(T.radiusLg)),
          border: Border(top: BorderSide(color: T.ink, width: 1.4)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _SheetHandle(),
              Row(
                children: [
                  const LumiMascot(mood: LumiMood.thinking, size: 36),
                  const SizedBox(width: 8),
                  Text('Ask Lumi',
                      style: Theme.of(context).textTheme.titleMedium),
                ],
              ),
              const SizedBox(height: 10),
              _Passage(text: widget.passage),
              const SizedBox(height: 12),
              if (_answer == null && _error == null) ...[
                TextField(
                  controller: _ctrl,
                  autofocus: true,
                  minLines: 2,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _ask(),
                  decoration: _inputDeco(
                      hint: 'Optional — what do you want to know?'),
                  style: const TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 14,
                    color: T.ink,
                  ),
                ),
                const SizedBox(height: 12),
                QuestButton(
                  label: _loading ? 'Thinking…' : 'Ask',
                  icon: Icons.auto_awesome_rounded,
                  color: T.sage,
                  loading: _loading,
                  onPressed: _loading ? null : _ask,
                ),
              ],
              if (_answer != null)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: T.paper2,
                    borderRadius: BorderRadius.circular(T.radiusSm),
                    border: Border.all(color: T.ink, width: 1.2),
                  ),
                  child: Text(
                    _answer!,
                    style: const TextStyle(
                      fontFamily: 'Nunito',
                      fontSize: 14,
                      height: 1.5,
                      color: T.ink,
                    ),
                  ),
                ),
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: T.coral.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(T.radiusSm),
                    border: Border.all(color: T.coralDeep, width: 1.2),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w700,
                      color: T.coralDeep,
                    ),
                  ),
                ),
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text(
                    'Close',
                    style: TextStyle(
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w900,
                      color: T.inkSoft,
                    ),
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

class _SheetHandle extends StatelessWidget {
  const _SheetHandle();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 44,
        height: 4,
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: T.paper3,
          borderRadius: BorderRadius.circular(99),
        ),
      ),
    );
  }
}

class _Passage extends StatelessWidget {
  const _Passage({required this.text, this.color = HighlightColor.yellow});
  final String text;
  final HighlightColor color;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: highlightInkColor(color).withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(T.radiusSm),
        border: Border.all(color: T.ink.withValues(alpha: 0.18), width: 1),
      ),
      child: Text(
        text,
        maxLines: 6,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontFamily: 'Nunito',
          fontStyle: FontStyle.italic,
          fontSize: 13.5,
          height: 1.45,
          color: T.ink,
        ),
      ),
    );
  }
}

// ─────────────────────────────── Note card ───────────────────────────

class _NoteCard extends StatefulWidget {
  const _NoteCard({
    required this.initial,
    required this.onUpdate,
    required this.onDelete,
    required this.onAskAi,
  });
  final Highlight initial;
  final Future<Highlight> Function({String? note, HighlightColor? color})
      onUpdate;
  final Future<void> Function() onDelete;
  final Future<Highlight> Function(String? question) onAskAi;

  @override
  State<_NoteCard> createState() => _NoteCardState();
}

class _NoteCardState extends State<_NoteCard> {
  late Highlight _h;
  late final TextEditingController _noteCtrl;
  final TextEditingController _askCtrl = TextEditingController();
  bool _saving = false;
  bool _asking = false;
  bool _showAskField = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _h = widget.initial;
    _noteCtrl = TextEditingController(text: _h.note ?? '');
  }

  @override
  void dispose() {
    _noteCtrl.dispose();
    _askCtrl.dispose();
    super.dispose();
  }

  bool get _noteDirty => _noteCtrl.text.trim() != (_h.note ?? '').trim();

  Future<void> _saveNote() async {
    if (_saving) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final next = await widget.onUpdate(
        note: _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        _h = next;
        _saving = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _saving = false;
      });
    }
  }

  Future<void> _setColor(HighlightColor c) async {
    if (c == _h.color || _saving) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final next = await widget.onUpdate(color: c);
      if (!mounted) return;
      setState(() {
        _h = next;
        _saving = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _saving = false;
      });
    }
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: T.paper,
        title: const Text('Delete this highlight?',
            style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w900)),
        content: const Text(
          'The passage, note, and AI answer will all be removed.',
          style: TextStyle(fontFamily: 'Nunito', color: T.inkSoft),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel',
                style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w800,
                    color: T.inkSoft)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete',
                style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    color: T.coralDeep)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await widget.onDelete();
      if (!mounted) return;
      Navigator.of(context).pop(HighlightCardResult.deleted);
    } catch (e) {
      if (!mounted) return;
      setState(
          () => _error = e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _runAskAi() async {
    if (_asking) return;
    setState(() {
      _asking = true;
      _error = null;
    });
    try {
      final question = _askCtrl.text.trim();
      final next = await widget.onAskAi(question.isEmpty ? null : question);
      if (!mounted) return;
      setState(() {
        _h = next;
        _asking = false;
        _showAskField = false;
        _askCtrl.clear();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _asking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final insets = MediaQuery.of(context).viewInsets;
    return Padding(
      padding: EdgeInsets.only(bottom: insets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: T.paper,
          borderRadius: BorderRadius.vertical(top: Radius.circular(T.radiusLg)),
          border: Border(top: BorderSide(color: T.ink, width: 1.4)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _SheetHandle(),
              Row(
                children: [
                  Text('Highlight',
                      style: Theme.of(context).textTheme.titleMedium),
                  const Spacer(),
                  IconButton(
                    onPressed: _saving ? null : _delete,
                    tooltip: 'Delete',
                    icon: const Icon(Icons.delete_outline_rounded,
                        color: T.coralDeep),
                  ),
                ],
              ),
              _Passage(text: _h.text, color: _h.color),
              const SizedBox(height: 12),
              _ColorPickerRow(
                value: _h.color,
                disabled: _saving,
                onPick: _setColor,
              ),
              const SizedBox(height: 14),
              const _Label(text: 'Note'),
              TextField(
                controller: _noteCtrl,
                minLines: 2,
                maxLines: 6,
                onChanged: (_) => setState(() {}),
                decoration: _inputDeco(hint: 'Add a note for this passage'),
                style: const TextStyle(
                  fontFamily: 'Nunito',
                  fontSize: 14,
                  color: T.ink,
                ),
              ),
              if (_noteDirty) ...[
                const SizedBox(height: 10),
                QuestButton(
                  label: _saving ? 'Saving…' : 'Save note',
                  icon: Icons.check_rounded,
                  color: T.saffron,
                  loading: _saving,
                  onPressed: _saving ? null : _saveNote,
                ),
              ],
              const SizedBox(height: 16),
              const _Label(text: 'Lumi'),
              if (_h.aiAnswer != null) ...[
                if (_h.aiQuestion != null && _h.aiQuestion!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      'Q: ${_h.aiQuestion}',
                      style: const TextStyle(
                        fontFamily: 'Nunito',
                        fontStyle: FontStyle.italic,
                        color: T.inkSoft,
                        fontSize: 13,
                      ),
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: T.paper2,
                    borderRadius: BorderRadius.circular(T.radiusSm),
                    border: Border.all(color: T.ink, width: 1.2),
                  ),
                  child: Text(
                    _h.aiAnswer!,
                    style: const TextStyle(
                      fontFamily: 'Nunito',
                      fontSize: 14,
                      height: 1.5,
                      color: T.ink,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
              ],
              if (_showAskField) ...[
                TextField(
                  controller: _askCtrl,
                  autofocus: true,
                  minLines: 2,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _runAskAi(),
                  decoration: _inputDeco(
                      hint: 'Optional — what do you want to know?'),
                  style: const TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 14,
                    color: T.ink,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: QuestButton(
                        label: _asking ? 'Thinking…' : 'Ask',
                        icon: Icons.auto_awesome_rounded,
                        color: T.sage,
                        loading: _asking,
                        onPressed: _asking ? null : _runAskAi,
                      ),
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: _asking
                          ? null
                          : () => setState(() {
                                _showAskField = false;
                                _askCtrl.clear();
                              }),
                      child: const Text(
                        'Cancel',
                        style: TextStyle(
                          fontFamily: 'Nunito',
                          fontWeight: FontWeight.w900,
                          color: T.inkSoft,
                        ),
                      ),
                    ),
                  ],
                ),
              ] else
                QuestButton(
                  label: _h.aiAnswer != null ? 'Ask again' : 'Ask Lumi',
                  icon: Icons.auto_awesome_rounded,
                  color: T.sage,
                  onPressed: () => setState(() => _showAskField = true),
                ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: T.coral.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(T.radiusSm),
                    border: Border.all(color: T.coralDeep, width: 1.2),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w700,
                      color: T.coralDeep,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () =>
                      Navigator.of(context).pop(HighlightCardResult.updated),
                  child: const Text(
                    'Close',
                    style: TextStyle(
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w900,
                      color: T.inkSoft,
                    ),
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

class _Label extends StatelessWidget {
  const _Label({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: 'Nunito',
          fontWeight: FontWeight.w900,
          fontSize: 12,
          color: T.inkSoft,
          letterSpacing: 0.6,
        ),
      ),
    );
  }
}

class _ColorPickerRow extends StatelessWidget {
  const _ColorPickerRow({
    required this.value,
    required this.onPick,
    required this.disabled,
  });
  final HighlightColor value;
  final ValueChanged<HighlightColor> onPick;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final c in HighlightColor.values) ...[
          GestureDetector(
            onTap: disabled ? null : () => onPick(c),
            child: Container(
              width: 28,
              height: 28,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: highlightInkColor(c),
                shape: BoxShape.circle,
                border: Border.all(
                  color: c == value ? T.ink : T.ink.withValues(alpha: 0.25),
                  width: c == value ? 2.2 : 1.2,
                ),
              ),
              child: c == value
                  ? const Icon(Icons.check_rounded, size: 16, color: T.ink)
                  : null,
            ),
          ),
        ],
      ],
    );
  }
}

InputDecoration _inputDeco({required String hint}) => InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: T.paper2,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(T.radiusSm),
        borderSide: const BorderSide(color: T.ink, width: 1.2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(T.radiusSm),
        borderSide: const BorderSide(color: T.ink, width: 1.2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(T.radiusSm),
        borderSide: const BorderSide(color: T.saffronDeep, width: 1.6),
      ),
    );

// ─────────────────────────── Highlights list sheet ────────────────────

class _HighlightsListSheet extends StatelessWidget {
  const _HighlightsListSheet({
    required this.highlights,
    required this.pageLabel,
  });

  final List<Highlight> highlights;
  final String pageLabel;

  @override
  Widget build(BuildContext context) {
    final sorted = [...highlights]..sort((a, b) {
        final byPage = a.page.compareTo(b.page);
        return byPage != 0 ? byPage : a.createdAt.compareTo(b.createdAt);
      });
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.3,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scroll) {
        return Container(
          decoration: const BoxDecoration(
            color: T.paper,
            borderRadius:
                BorderRadius.vertical(top: Radius.circular(T.radiusLg)),
            border: Border(top: BorderSide(color: T.ink, width: 1.4)),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
                child: Column(
                  children: [
                    Center(
                      child: Container(
                        width: 44,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 10),
                        decoration: BoxDecoration(
                          color: T.paper3,
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        Text('Notes & highlights',
                            style: Theme.of(context).textTheme.titleMedium),
                        const Spacer(),
                        Text(
                          '${sorted.length}',
                          style: const TextStyle(
                            fontFamily: 'Nunito',
                            fontWeight: FontWeight.w900,
                            color: T.inkSoft,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: T.paper3),
              Expanded(
                child: ListView.separated(
                  controller: scroll,
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
                  itemCount: sorted.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final h = sorted[i];
                    return _HighlightTile(
                      highlight: h,
                      pageLabel: pageLabel,
                      onTap: () => Navigator.of(context).pop(h),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _HighlightTile extends StatelessWidget {
  const _HighlightTile({
    required this.highlight,
    required this.pageLabel,
    required this.onTap,
  });
  final Highlight highlight;
  final String pageLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final preview = highlight.text.replaceAll(RegExp(r'\s+'), ' ').trim();
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(T.radiusSm),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: T.paper2,
            borderRadius: BorderRadius.circular(T.radiusSm),
            border: Border.all(color: T.ink.withValues(alpha: 0.18), width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: highlightInkColor(highlight.color),
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: T.ink.withValues(alpha: 0.35), width: 1),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '$pageLabel ${highlight.page}',
                    style: const TextStyle(
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w900,
                      fontSize: 11,
                      letterSpacing: 0.5,
                      color: T.inkSoft,
                    ),
                  ),
                  const Spacer(),
                  if (highlight.note != null && highlight.note!.isNotEmpty)
                    const Icon(Icons.sticky_note_2_outlined,
                        size: 14, color: T.inkSoft),
                  if (highlight.aiAnswer != null) ...[
                    const SizedBox(width: 4),
                    const Icon(Icons.auto_awesome_rounded,
                        size: 14, color: T.sageDeep),
                  ],
                ],
              ),
              const SizedBox(height: 6),
              Text(
                preview,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontFamily: 'Nunito',
                  fontSize: 13,
                  height: 1.4,
                  color: T.ink,
                ),
              ),
              if (highlight.note != null && highlight.note!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  highlight.note!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                    color: T.inkSoft,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
