import 'dart:async';

import 'package:epub_view/epub_view.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart' show SelectedContent;
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/highlight_actions.dart';

const int _minSelectionChars = 2;

class EpubReaderScreen extends StatefulWidget {
  const EpubReaderScreen({
    super.key,
    required this.bookId,
    required this.bytes,
    this.title,
    this.initialChapter = 1,
    this.onChapterReached,
  });

  final String bookId;
  final Uint8List bytes;
  final String? title;
  final int initialChapter;

  /// Fires whenever the user advances onto a new chapter. Used by the Garden
  /// reading tracker — for EPUBs we treat each spine item as one "page".
  final void Function(int chapter)? onChapterReached;

  @override
  State<EpubReaderScreen> createState() => _EpubReaderScreenState();
}

class _EpubReaderScreenState extends State<EpubReaderScreen> {
  late final EpubController _epub;
  int _chapter = 1;
  int _total = 1;
  bool _ready = false;
  bool _overlayVisible = true;
  Timer? _hideTimer;
  SelectedContent? _selected;
  List<Highlight> _savedHighlights = const [];

  @override
  void initState() {
    super.initState();
    _epub = EpubController(
      document: EpubDocument.openData(widget.bytes),
    );
    _epub.currentValueListenable.addListener(_onChapter);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _scheduleHide();
    _refreshSavedHighlights();
  }

  Future<void> _refreshSavedHighlights() async {
    try {
      final session = context.read<Session>();
      final saved = await session.highlights.listForBook(widget.bookId);
      if (!mounted) return;
      setState(() => _savedHighlights = saved);
    } catch (_) {
      // Non-blocking.
    }
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _epub.currentValueListenable.removeListener(_onChapter);
    _epub.dispose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  void _onChapter() {
    final v = _epub.currentValue;
    if (v == null) return;
    final n = v.chapterNumber;
    if (n <= 0) return;
    if (!_ready) {
      final toc = _epub.tableOfContents();
      _total = toc.isEmpty ? 1 : toc.length;
      _ready = true;
      if (widget.initialChapter > 1 && widget.initialChapter <= _total) {
        _epub.scrollTo(index: widget.initialChapter - 1);
      }
    }
    if (n != _chapter) {
      setState(() => _chapter = n);
      widget.onChapterReached?.call(n);
    } else if (_total > 0 && _chapter == 1) {
      widget.onChapterReached?.call(_chapter);
    }
  }

  void _toggleOverlay() {
    setState(() => _overlayVisible = !_overlayVisible);
    if (_overlayVisible) _scheduleHide();
  }

  void _scheduleHide() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => _overlayVisible = false);
    });
  }

  void _jumpTo(int chapter) {
    final c = chapter.clamp(1, _total);
    _epub.scrollTo(index: c - 1);
    setState(() => _chapter = c);
    widget.onChapterReached?.call(c);
    _scheduleHide();
  }

  // ────────────────────────────── Selection actions ────────────────────

  String _currentSelection() => _selected?.plainText.trim() ?? '';

  String? _currentCfi() {
    try {
      return _epub.generateEpubCfi();
    } catch (_) {
      return null;
    }
  }

  Future<Highlight?> _createHighlight(
    String text, {
    HighlightColor color = HighlightColor.yellow,
    String? note,
  }) async {
    final session = context.read<Session>();
    return session.highlights.create(
      widget.bookId,
      page: _chapter,
      text: text,
      color: color,
      note: note,
      positionCfi: _currentCfi(),
    );
  }

  Future<void> _onHighlightAction(
      {HighlightColor color = HighlightColor.yellow}) async {
    final text = _currentSelection();
    if (text.isEmpty) return;
    try {
      final created = await _createHighlight(text, color: color);
      if (created == null || !mounted) return;
      setState(() => _savedHighlights = [..._savedHighlights, created]);
      _flash('Saved highlight');
    } catch (e) {
      if (!mounted) return;
      _flash(describeError(e), error: true);
    }
  }

  Future<void> _onNoteAction() async {
    final text = _currentSelection();
    if (text.isEmpty) return;
    final note = await showHighlightNoteSheet(context, passage: text);
    if (note == null || !mounted) return;
    try {
      final created = await _createHighlight(text,
          note: note.trim().isEmpty ? null : note.trim());
      if (created == null || !mounted) return;
      setState(() => _savedHighlights = [..._savedHighlights, created]);
      _flash('Saved note');
    } catch (e) {
      if (!mounted) return;
      _flash(describeError(e), error: true);
    }
  }

  Future<void> _onAskAiAction() async {
    final text = _currentSelection();
    if (text.isEmpty) return;
    final session = context.read<Session>();
    Highlight? created;
    await showHighlightAskAiSheet(
      context,
      passage: text,
      runAsk: (question) async {
        created ??= await _createHighlight(text);
        if (created == null) {
          throw ApiException(0, 'Could not create highlight.');
        }
        return session.highlights.askAi(
          created!.id,
          question: question.trim().isEmpty ? null : question.trim(),
        );
      },
    );
    if (created != null && mounted) {
      setState(() => _savedHighlights = [..._savedHighlights, created!]);
    }
  }

  Future<void> _openNoteCard(Highlight h) async {
    final session = context.read<Session>();
    await showHighlightNoteCard(
      context,
      highlight: h,
      onUpdate: ({String? note, HighlightColor? color}) async {
        final next = await session.highlights.update(
          h.id,
          note: note,
          color: color,
        );
        if (!mounted) return next;
        setState(() {
          _savedHighlights = [
            for (final x in _savedHighlights)
              if (x.id == next.id) next else x
          ];
        });
        return next;
      },
      onDelete: () async {
        await session.highlights.delete(h.id);
        if (!mounted) return;
        setState(() {
          _savedHighlights = [
            for (final x in _savedHighlights)
              if (x.id != h.id) x
          ];
        });
      },
      onAskAi: (question) async {
        final next =
            await session.highlights.askAi(h.id, question: question);
        if (!mounted) return next;
        setState(() {
          _savedHighlights = [
            for (final x in _savedHighlights)
              if (x.id == next.id) next else x
          ];
        });
        return next;
      },
    );
  }

  Future<void> _openHighlightsList() async {
    final selected = await showHighlightsListSheet(
      context,
      highlights: _savedHighlights,
      pageLabel: 'ch',
    );
    if (selected == null || !mounted) return;
    final cfi = selected.positionCfi;
    if (cfi != null && cfi.isNotEmpty) {
      try {
        _epub.gotoEpubCfi(cfi);
      } catch (_) {
        _epub.scrollTo(index: (selected.page - 1).clamp(0, _total));
      }
    } else {
      _epub.scrollTo(index: (selected.page - 1).clamp(0, _total));
    }
    await _openNoteCard(selected);
  }

  void _flash(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          msg,
          style: const TextStyle(
            fontFamily: 'Nunito',
            fontWeight: FontWeight.w800,
          ),
        ),
        backgroundColor: error ? T.coralDeep : T.ink,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  // ──────────────────────────────── Build ──────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Container(
            color: Colors.white,
            child: SelectionArea(
              onSelectionChanged: (content) {
                final hadSelection =
                    (_selected?.plainText.trim().length ?? 0) >=
                        _minSelectionChars;
                _selected = content;
                final hasSelection =
                    (content?.plainText.trim().length ?? 0) >=
                        _minSelectionChars;
                if (!hadSelection && hasSelection) {
                  HapticFeedback.selectionClick();
                }
              },
              contextMenuBuilder: _buildSelectionToolbar,
              child: EpubView(
                controller: _epub,
                builders: EpubViewBuilders<DefaultBuilderOptions>(
                  options: const DefaultBuilderOptions(
                    textStyle: TextStyle(
                      fontFamily: 'Nunito',
                      fontSize: 16,
                      height: 1.6,
                      color: Color(0xFF20283A),
                    ),
                  ),
                  chapterDividerBuilder: (_) => const SizedBox(height: 24),
                  loaderBuilder: (_) => const Center(
                    child: CircularProgressIndicator(
                        color: Colors.black38, strokeWidth: 2),
                  ),
                  errorBuilder: (_, err) => Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        err.toString(),
                        style: const TextStyle(color: Colors.black54),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          IgnorePointer(
            ignoring: (_selected?.plainText.isNotEmpty ?? false),
            child: GestureDetector(
              behavior: HitTestBehavior.translucent,
              onTap: _toggleOverlay,
              child: const SizedBox.expand(),
            ),
          ),
          AnimatedSlide(
            offset: _overlayVisible ? Offset.zero : const Offset(0, -1),
            duration: const Duration(milliseconds: 240),
            curve: Curves.easeInOut,
            child: _TopBar(
              title: widget.title,
              chapter: _chapter,
              total: _total,
              notesCount: _savedHighlights.length,
              onNotes:
                  _savedHighlights.isEmpty ? null : _openHighlightsList,
              onClose: () => Navigator.of(context).pop(_chapter),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: AnimatedSlide(
              offset: _overlayVisible ? Offset.zero : const Offset(0, 1),
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeInOut,
              child: _BottomBar(
                chapter: _chapter,
                total: _total,
                onChanged: (v) => _jumpTo(v.round()),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectionToolbar(
    BuildContext context,
    SelectableRegionState state,
  ) {
    return AdaptiveTextSelectionToolbar.buttonItems(
      anchors: state.contextMenuAnchors,
      buttonItems: <ContextMenuButtonItem>[
        ...state.contextMenuButtonItems,
        ContextMenuButtonItem(
          label: 'Highlight',
          onPressed: () async {
            state.hideToolbar();
            await _onHighlightAction();
            state.clearSelection();
          },
        ),
        ContextMenuButtonItem(
          label: 'Note',
          onPressed: () async {
            state.hideToolbar();
            await _onNoteAction();
            state.clearSelection();
          },
        ),
        ContextMenuButtonItem(
          label: 'Ask AI',
          onPressed: () async {
            state.hideToolbar();
            await _onAskAiAction();
            state.clearSelection();
          },
        ),
      ],
    );
  }
}

// ─────────────────────────────── Top bar ──────────────────────────────

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.title,
    required this.chapter,
    required this.total,
    required this.onClose,
    this.notesCount = 0,
    this.onNotes,
  });

  final String? title;
  final int chapter;
  final int total;
  final VoidCallback onClose;
  final int notesCount;
  final VoidCallback? onNotes;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withValues(alpha: 0.80),
            Colors.transparent,
          ],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(6, 4, 12, 20),
          child: Row(
            children: [
              IconButton(
                onPressed: onClose,
                icon: const Icon(Icons.arrow_back_rounded,
                    color: Colors.white, size: 22),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.white.withValues(alpha: 0.15),
                  shape: const CircleBorder(),
                  minimumSize: const Size(40, 40),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: title != null
                    ? Text(
                        title!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontFamily: 'Nunito',
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                          shadows: [
                            Shadow(color: Colors.black54, blurRadius: 4),
                          ],
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
              if (onNotes != null) ...[
                IconButton(
                  onPressed: onNotes,
                  tooltip: '$notesCount notes',
                  icon: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      const Icon(Icons.note_alt_outlined,
                          color: Colors.white, size: 22),
                      if (notesCount > 0)
                        Positioned(
                          right: -6,
                          top: -4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 4, vertical: 1),
                            decoration: BoxDecoration(
                              color: T.saffronDeep,
                              borderRadius: BorderRadius.circular(99),
                              border:
                                  Border.all(color: Colors.black, width: 1),
                            ),
                            constraints: const BoxConstraints(minWidth: 14),
                            child: Text(
                              notesCount > 99 ? '99+' : '$notesCount',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
                                fontFamily: 'Nunito',
                                fontWeight: FontWeight.w900,
                                fontSize: 9,
                                height: 1.2,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.white.withValues(alpha: 0.15),
                    shape: const CircleBorder(),
                    minimumSize: const Size(40, 40),
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(99),
                  border: Border.all(
                      color: Colors.white.withValues(alpha: 0.25), width: 1),
                ),
                child: Text(
                  'ch $chapter / $total',
                  style: const TextStyle(
                    color: Colors.white,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    letterSpacing: 0.3,
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

class _BottomBar extends StatelessWidget {
  const _BottomBar({
    required this.chapter,
    required this.total,
    required this.onChanged,
  });

  final int chapter;
  final int total;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withValues(alpha: 0.80),
            Colors.transparent,
          ],
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 20, 12, 6),
          child: total > 1
              ? SliderTheme(
                  data: SliderThemeData(
                    thumbColor: Colors.white,
                    activeTrackColor: Colors.white.withValues(alpha: 0.90),
                    inactiveTrackColor: Colors.white.withValues(alpha: 0.25),
                    overlayColor: Colors.white.withValues(alpha: 0.15),
                    thumbShape:
                        const RoundSliderThumbShape(enabledThumbRadius: 8),
                    trackHeight: 2.5,
                    showValueIndicator: ShowValueIndicator.onDrag,
                    valueIndicatorColor: Colors.white,
                    valueIndicatorTextStyle: const TextStyle(
                      color: Colors.black,
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                    ),
                  ),
                  child: Slider(
                    min: 1,
                    max: total.toDouble(),
                    value: chapter.toDouble().clamp(1.0, total.toDouble()),
                    label: 'ch $chapter',
                    divisions: total > 1 ? total - 1 : null,
                    onChanged: onChanged,
                  ),
                )
              : const SizedBox(height: 8),
        ),
      ),
    );
  }
}
