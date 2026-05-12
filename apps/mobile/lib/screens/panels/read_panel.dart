import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:epub_view/epub_view.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart' show SelectedContent;
import 'package:flutter/services.dart' show HapticFeedback;
import 'package:provider/provider.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart' as pdf;
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../state/reading_tracker.dart';
import '../../state/session.dart';
import '../../theme/tokens.dart';
import '../../widgets/highlight_actions.dart';
import '../../widgets/lumi_mascot.dart';
import '../../widgets/pdf_highlights.dart';
import '../../widgets/quest_button.dart';
import '../../widgets/sticker_card.dart';
import '../epub_reader_screen.dart';
import '../pdf_reader_screen.dart';

class ReadPanel extends StatefulWidget {
  const ReadPanel({
    super.key,
    required this.bookId,
    required this.format,
    this.translationId,
  });

  final String bookId;
  final BookFormat format;
  final String? translationId;

  @override
  State<ReadPanel> createState() => _ReadPanelState();
}

class _ReadPanelState extends State<ReadPanel> {
  // PDF state
  PdfViewerController? _pdf;
  GlobalKey<SfPdfViewerState>? _pdfKey;
  PdfHighlightOverlay? _pdfOverlay;
  pdf.PdfDocument? _pdfDocument;
  int _page = 1;
  int _total = 1;
  double _pdfZoom = 1.0;
  String? _pdfSelectedText;
  Rect? _pdfSelectionRect; // in stack-local coords

  // EPUB state
  EpubController? _epubInline;
  int _chapter = 1;
  int _chapterTotal = 1;
  double _epubTextScale = 1.0;
  SelectedContent? _epubSelected;

  // Shared cache of saved highlights for this book (loaded on open and
  // refreshed when the fullscreen reader returns).
  List<Highlight> _savedHighlights = const [];

  Uint8List? _bytes;
  String? _error;
  String? _resolvedKey;
  ReadingTracker? _tracker;

  final GlobalKey _viewerStackKey = GlobalKey();

  static const double _minZoom = 1.0;
  static const double _maxZoom = 3.0;
  static const double _zoomStep = 0.25;
  static const double _minTextScale = 0.8;
  static const double _maxTextScale = 1.8;
  static const double _textScaleStep = 0.1;
  static const int _minSelectionChars = 2;

  @override
  void initState() {
    super.initState();
    _tracker = ReadingTracker(
      gardens: context.read<Session>().gardens,
      bookId: widget.bookId,
    );
    _open();
  }

  @override
  void didUpdateWidget(covariant ReadPanel old) {
    super.didUpdateWidget(old);
    final key = '${widget.bookId}/${widget.translationId ?? ''}';
    if (key != _resolvedKey) _open();
    if (old.bookId != widget.bookId) {
      final prev = _tracker;
      _tracker = ReadingTracker(
        gardens: context.read<Session>().gardens,
        bookId: widget.bookId,
      );
      if (prev != null) {
        () async {
          await prev.flush();
          prev.dispose();
        }();
      }
    }
  }

  @override
  void dispose() {
    final t = _tracker;
    if (t != null) {
      () async {
        await t.flush();
        t.dispose();
      }();
    }
    _pdfDocument?.dispose();
    _pdf?.dispose();
    _epubInline?.currentValueListenable.removeListener(_onEpubChapter);
    _epubInline?.dispose();
    super.dispose();
  }

  Future<void> _open() async {
    final session = context.read<Session>();
    final key = '${widget.bookId}/${widget.translationId ?? ''}';
    setState(() {
      _resolvedKey = key;
      _error = null;
      _bytes = null;
      _pdfSelectedText = null;
      _pdfSelectionRect = null;
      _epubSelected = null;
      _savedHighlights = const [];
    });
    try {
      final url = widget.translationId != null
          ? (await session.translations.fileUrl(widget.translationId!)).url
          : (await session.books.fileUrl(widget.bookId)).url;
      if (!mounted) return;
      final bytes = await _downloadBytes(url);
      if (!mounted) return;

      if (widget.format == BookFormat.epub) {
        _epubInline?.currentValueListenable.removeListener(_onEpubChapter);
        _epubInline?.dispose();
        final controller = EpubController(
          document: EpubDocument.openData(bytes),
        );
        controller.currentValueListenable.addListener(_onEpubChapter);
        if (!mounted) {
          controller.dispose();
          return;
        }
        setState(() {
          _bytes = bytes;
          _epubInline = controller;
          _chapter = 1;
          _chapterTotal = 1;
          _epubTextScale = 1.0;
        });
        _refreshSavedHighlights();
      } else {
        _pdfDocument?.dispose();
        _pdfDocument = null;
        _pdf?.dispose();
        final controller = PdfViewerController();
        if (!mounted) return;
        setState(() {
          _bytes = bytes;
          _pdf = controller;
          _pdfKey = GlobalKey<SfPdfViewerState>();
          _pdfOverlay = PdfHighlightOverlay(controller);
          _page = 1;
          _total = 1;
          _pdfZoom = 1.0;
        });
        // Saved highlights will be loaded once onDocumentLoaded fires.
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    }
  }

  Future<void> _refreshSavedHighlights() async {
    final session = context.read<Session>();
    try {
      final saved = await session.highlights.listForBook(widget.bookId);
      if (!mounted) return;
      setState(() => _savedHighlights = saved);
      final doc = _pdfDocument;
      final overlay = _pdfOverlay;
      if (doc != null && overlay != null) {
        overlay.clear();
        overlay.renderAll(doc, saved);
      }
    } catch (_) {
      // Non-blocking.
    }
  }

  void _onEpubChapter() {
    final c = _epubInline;
    if (c == null) return;
    final v = c.currentValue;
    if (v == null) return;
    final n = v.chapterNumber;
    if (n <= 0) return;
    final tocCount = c.tableOfContents().length;
    final newTotal = tocCount == 0 ? _chapterTotal : tocCount;
    if (n != _chapter || newTotal != _chapterTotal) {
      setState(() {
        _chapter = n;
        _chapterTotal = newTotal;
      });
      _tracker?.markReached(n);
    }
  }

  Future<Uint8List> _downloadBytes(String url) async {
    final res = await Dio().get<List<int>>(
      url,
      options: Options(responseType: ResponseType.bytes),
    );
    if ((res.statusCode ?? 0) >= 300) {
      throw ApiException(
          res.statusCode ?? 0, 'Could not download file (${res.statusCode}).');
    }
    return Uint8List.fromList(res.data ?? const <int>[]);
  }

  // ────────────────────────────── Zoom ───────────────────────────────

  void _bumpZoom(double delta) {
    if (widget.format == BookFormat.epub) {
      final next =
          (_epubTextScale + delta).clamp(_minTextScale, _maxTextScale);
      if (next == _epubTextScale) return;
      setState(() => _epubTextScale = next);
    } else {
      final pdf = _pdf;
      if (pdf == null) return;
      final next = (_pdfZoom + delta).clamp(_minZoom, _maxZoom);
      if (next == _pdfZoom) return;
      pdf.zoomLevel = next;
      setState(() => _pdfZoom = next);
    }
  }

  bool get _canZoomIn => widget.format == BookFormat.epub
      ? _epubTextScale < _maxTextScale
      : _pdfZoom < _maxZoom;
  bool get _canZoomOut => widget.format == BookFormat.epub
      ? _epubTextScale > _minTextScale
      : _pdfZoom > _minZoom;

  // ────────────────────────────── Fullscreen ─────────────────────────

  Future<void> _expandToFullscreen() async {
    final bytes = _bytes;
    if (bytes == null) return;
    if (widget.format == BookFormat.epub) {
      final returned = await Navigator.push<int>(
        context,
        MaterialPageRoute(
          fullscreenDialog: true,
          builder: (_) => EpubReaderScreen(
            bookId: widget.bookId,
            bytes: bytes,
            initialChapter: _chapter,
            onChapterReached: (c) => _tracker?.markReached(c),
          ),
        ),
      );
      if (!mounted) return;
      if (returned != null && returned != _chapter && _epubInline != null) {
        _epubInline!.scrollTo(index: (returned - 1).clamp(0, _chapterTotal));
        setState(() => _chapter = returned);
        _tracker?.markReached(returned);
      }
      _refreshSavedHighlights();
      return;
    }
    final returnPage = await Navigator.push<int>(
      context,
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => PdfReaderScreen(
          bookId: widget.bookId,
          bytes: bytes,
          totalPages: _total,
          initialPage: _page,
          onPageReached: (p) => _tracker?.markReached(p),
        ),
      ),
    );
    if (!mounted) return;
    if (returnPage != null && returnPage != _page) {
      _pdf?.jumpToPage(returnPage);
      setState(() => _page = returnPage);
      _tracker?.markReached(returnPage);
    }
    _refreshSavedHighlights();
  }

  // ────────────────────────────── PDF selection ──────────────────────

  void _onPdfSelectionChanged(PdfTextSelectionChangedDetails d) {
    final text = d.selectedText;
    final globalRect = d.globalSelectedRegion;
    final hasUsableText =
        text != null && text.trim().length >= _minSelectionChars;
    if (!hasUsableText || globalRect == null) {
      if (_pdfSelectedText != null) {
        setState(() {
          _pdfSelectedText = null;
          _pdfSelectionRect = null;
        });
      }
      return;
    }
    if (_pdfSelectedText == null) HapticFeedback.selectionClick();
    final box =
        _viewerStackKey.currentContext?.findRenderObject() as RenderBox?;
    Rect localRect = globalRect;
    if (box != null) {
      final tl = box.globalToLocal(globalRect.topLeft);
      final br = box.globalToLocal(globalRect.bottomRight);
      localRect = Rect.fromPoints(tl, br);
    }
    setState(() {
      _pdfSelectedText = text;
      _pdfSelectionRect = localRect;
    });
  }

  List<PdfTextLine> _capturePdfLines() {
    final state = _pdfKey?.currentState;
    if (state == null) return const [];
    return state.getSelectedTextLines();
  }

  // ────────────────────────────── Highlight CRUD ─────────────────────

  Future<Highlight?> _createHighlight(
    String text, {
    HighlightColor color = HighlightColor.yellow,
    String? note,
    String? positionCfi,
    required int page,
  }) async {
    final session = context.read<Session>();
    return session.highlights.create(
      widget.bookId,
      page: page,
      text: text,
      color: color,
      note: note,
      positionCfi: positionCfi,
    );
  }

  String? _epubCfi() {
    try {
      return _epubInline?.generateEpubCfi();
    } catch (_) {
      return null;
    }
  }

  Future<void> _runHighlight() async {
    final isPdf = widget.format == BookFormat.pdf;
    final raw = isPdf ? _pdfSelectedText : _epubSelected?.plainText;
    final text = raw?.trim();
    if (text == null || text.isEmpty) return;
    final lines = isPdf ? _capturePdfLines() : const <PdfTextLine>[];
    if (isPdf) _pdf?.clearSelection();
    try {
      final created = await _createHighlight(
        text,
        page: isPdf ? _page : _chapter,
        positionCfi: isPdf ? null : _epubCfi(),
      );
      if (created == null || !mounted) return;
      if (isPdf && lines.isNotEmpty) {
        _pdfOverlay?.addFromTextLines(created, lines);
      }
      setState(() => _savedHighlights = [..._savedHighlights, created]);
      _flash('Saved highlight');
    } catch (e) {
      if (!mounted) return;
      _flash(describeError(e), error: true);
    }
  }

  Future<void> _runNote() async {
    final isPdf = widget.format == BookFormat.pdf;
    final raw = isPdf ? _pdfSelectedText : _epubSelected?.plainText;
    final text = raw?.trim();
    if (text == null || text.isEmpty) return;
    final lines = isPdf ? _capturePdfLines() : const <PdfTextLine>[];
    if (isPdf) _pdf?.clearSelection();
    final note = await showHighlightNoteSheet(context, passage: text);
    if (note == null || !mounted) return;
    try {
      final created = await _createHighlight(
        text,
        page: isPdf ? _page : _chapter,
        note: note.trim().isEmpty ? null : note.trim(),
        positionCfi: isPdf ? null : _epubCfi(),
      );
      if (created == null || !mounted) return;
      if (isPdf && lines.isNotEmpty) {
        _pdfOverlay?.addFromTextLines(created, lines);
      }
      setState(() => _savedHighlights = [..._savedHighlights, created]);
      _flash('Saved note');
    } catch (e) {
      if (!mounted) return;
      _flash(describeError(e), error: true);
    }
  }

  Future<void> _runAskAi() async {
    final isPdf = widget.format == BookFormat.pdf;
    final raw = isPdf ? _pdfSelectedText : _epubSelected?.plainText;
    final text = raw?.trim();
    if (text == null || text.isEmpty) return;
    final lines = isPdf ? _capturePdfLines() : const <PdfTextLine>[];
    if (isPdf) _pdf?.clearSelection();
    final session = context.read<Session>();
    Highlight? created;
    await showHighlightAskAiSheet(
      context,
      passage: text,
      runAsk: (question) async {
        created ??= await _createHighlight(
          text,
          page: isPdf ? _page : _chapter,
          positionCfi: isPdf ? null : _epubCfi(),
        );
        if (created == null) {
          throw ApiException(0, 'Could not create highlight.');
        }
        return session.highlights.askAi(
          created!.id,
          question: question.trim().isEmpty ? null : question.trim(),
        );
      },
    );
    final fresh = created;
    if (fresh == null || !mounted) return;
    if (isPdf && lines.isNotEmpty) {
      _pdfOverlay?.addFromTextLines(fresh, lines);
    }
    setState(() => _savedHighlights = [..._savedHighlights, fresh]);
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
        if (color != null) _pdfOverlay?.updateColor(h.id, color);
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
        _pdfOverlay?.removeById(h.id);
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

  void _onPdfAnnotationSelected(Annotation annotation) async {
    final id = _pdfOverlay?.idOf(annotation);
    if (id == null) return;
    Highlight? hl;
    for (final x in _savedHighlights) {
      if (x.id == id) {
        hl = x;
        break;
      }
    }
    if (hl == null) {
      try {
        final session = context.read<Session>();
        final fresh = await session.highlights.listForBook(widget.bookId);
        if (!mounted) return;
        setState(() => _savedHighlights = fresh);
        for (final x in fresh) {
          if (x.id == id) {
            hl = x;
            break;
          }
        }
      } catch (_) {
        _pdfOverlay?.removeById(id);
        return;
      }
    }
    if (hl != null) await _openNoteCard(hl);
  }

  Future<void> _openEpubHighlightsList() async {
    final selected = await showHighlightsListSheet(
      context,
      highlights: _savedHighlights,
      pageLabel: 'ch',
    );
    if (selected == null || !mounted) return;
    // Jump to its chapter/cfi, then open the note card.
    final ctrl = _epubInline;
    if (ctrl != null) {
      final cfi = selected.positionCfi;
      if (cfi != null && cfi.isNotEmpty) {
        try {
          ctrl.gotoEpubCfi(cfi);
        } catch (_) {
          ctrl.scrollTo(
              index: (selected.page - 1).clamp(0, _chapterTotal));
        }
      } else {
        ctrl.scrollTo(index: (selected.page - 1).clamp(0, _chapterTotal));
      }
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

  // ──────────────────────────────── Build ────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: StickerCard(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const LumiMascot(mood: LumiMood.sad, size: 80),
                  const SizedBox(height: 8),
                  Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 14),
                  QuestButton(
                    label: 'Try again',
                    icon: Icons.refresh_rounded,
                    color: T.saffron,
                    expand: false,
                    onPressed: _open,
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return widget.format == BookFormat.epub ? _buildEpub() : _buildPdf();
  }

  Widget _buildPdf() {
    final bytes = _bytes;
    final controller = _pdf;
    final key = _pdfKey;
    if (bytes == null || controller == null || key == null) {
      return _loading('Loading pages…');
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          key: _viewerStackKey,
          children: [
            SfPdfViewer.memory(
              bytes,
              key: key,
              controller: controller,
              canShowTextSelectionMenu: false,
              canShowPaginationDialog: false,
              canShowScrollHead: false,
              canShowScrollStatus: false,
              onDocumentLoaded: (d) async {
                _pdfDocument = d.document;
                final n = d.document.pages.count;
                if (n != _total) setState(() => _total = n);
                await _refreshSavedHighlights();
              },
              onPageChanged: (d) {
                final p = d.newPageNumber;
                if (p == _page) return;
                setState(() => _page = p);
                _tracker?.markReached(p);
              },
              onTextSelectionChanged: _onPdfSelectionChanged,
              onAnnotationSelected: _onPdfAnnotationSelected,
            ),
            if (_pdfSelectedText != null && _pdfSelectionRect != null)
              HighlightSelectionToolbar(
                anchor: _pdfSelectionRect!,
                containerSize:
                    Size(constraints.maxWidth, constraints.maxHeight),
                onHighlight: _runHighlight,
                onNote: _runNote,
                onAskAi: _runAskAi,
              ),
            Positioned(
              right: 10,
              top: 10,
              child: _ControlRail(
                onZoomIn: _canZoomIn ? () => _bumpZoom(_zoomStep) : null,
                onZoomOut: _canZoomOut ? () => _bumpZoom(-_zoomStep) : null,
                onFullscreen: _expandToFullscreen,
                notesCount: _savedHighlights.length,
                onNotes: _savedHighlights.isEmpty
                    ? null
                    : () => _openPdfHighlightsList(),
              ),
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 14,
              child: Center(
                child: _CounterPill(text: 'page $_page / $_total'),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildEpub() {
    if (_epubInline == null) {
      return _loading('Opening chapters…');
    }
    return Stack(
      key: _viewerStackKey,
      children: [
        Container(
          color: T.paper,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SelectionArea(
            onSelectionChanged: (content) {
              final hadSelection =
                  (_epubSelected?.plainText.isNotEmpty ?? false);
              _epubSelected = content;
              final hasSelection =
                  (content?.plainText.trim().length ?? 0) >= _minSelectionChars;
              if (!hadSelection && hasSelection) {
                HapticFeedback.selectionClick();
              }
            },
            contextMenuBuilder: _buildEpubSelectionToolbar,
            child: EpubView(
              controller: _epubInline!,
              builders: EpubViewBuilders<DefaultBuilderOptions>(
                options: DefaultBuilderOptions(
                  textStyle: TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 15 * _epubTextScale,
                    height: 1.55,
                    color: T.ink,
                  ),
                ),
                chapterDividerBuilder: (_) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Container(height: 1.2, color: T.paper3),
                ),
                loaderBuilder: (_) => _loading('Opening chapters…'),
                errorBuilder: (_, err) => Padding(
                  padding: const EdgeInsets.all(24),
                  child: Center(
                    child: Text(
                      err.toString(),
                      style: const TextStyle(color: T.inkSoft),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        Positioned(
          right: 10,
          top: 10,
          child: _ControlRail(
            onZoomIn: _canZoomIn ? () => _bumpZoom(_textScaleStep) : null,
            onZoomOut: _canZoomOut ? () => _bumpZoom(-_textScaleStep) : null,
            onFullscreen: _expandToFullscreen,
            notesCount: _savedHighlights.length,
            onNotes: _savedHighlights.isEmpty
                ? null
                : () => _openEpubHighlightsList(),
          ),
        ),
        Positioned(
          left: 16,
          right: 16,
          bottom: 14,
          child: Center(
            child: _CounterPill(
              text: _chapterTotal > 1
                  ? 'ch $_chapter / $_chapterTotal'
                  : 'ch $_chapter',
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _openPdfHighlightsList() async {
    final selected = await showHighlightsListSheet(
      context,
      highlights: _savedHighlights,
    );
    if (selected == null || !mounted) return;
    _pdf?.jumpToPage(selected.page);
    setState(() => _page = selected.page);
    await _openNoteCard(selected);
  }

  Widget _buildEpubSelectionToolbar(
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
            await _runHighlight();
            state.clearSelection();
          },
        ),
        ContextMenuButtonItem(
          label: 'Note',
          onPressed: () async {
            state.hideToolbar();
            await _runNote();
            state.clearSelection();
          },
        ),
        ContextMenuButtonItem(
          label: 'Ask AI',
          onPressed: () async {
            state.hideToolbar();
            await _runAskAi();
            state.clearSelection();
          },
        ),
      ],
    );
  }

  Widget _loading(String label) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const LumiMascot(mood: LumiMood.thinking, size: 80),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              color: T.inkSoft,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────── Control rail ─────────────────────────────

class _ControlRail extends StatelessWidget {
  const _ControlRail({
    required this.onZoomIn,
    required this.onZoomOut,
    required this.onFullscreen,
    this.notesCount = 0,
    this.onNotes,
  });
  final VoidCallback? onZoomIn;
  final VoidCallback? onZoomOut;
  final VoidCallback onFullscreen;
  final int notesCount;
  final VoidCallback? onNotes;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: T.paper.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.ink, width: 1.4),
        boxShadow: T.stickerShadow(y: 2),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _RailButton(
            icon: Icons.add_rounded,
            tooltip: 'Zoom in',
            onTap: onZoomIn,
          ),
          const SizedBox(height: 2),
          _RailButton(
            icon: Icons.remove_rounded,
            tooltip: 'Zoom out',
            onTap: onZoomOut,
          ),
          Container(
            margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
            height: 1,
            color: T.paper3,
          ),
          _RailButton(
            icon: Icons.note_alt_outlined,
            tooltip: notesCount == 0
                ? 'No notes yet'
                : '$notesCount note${notesCount == 1 ? '' : 's'}',
            badge: notesCount,
            onTap: onNotes,
          ),
          const SizedBox(height: 2),
          _RailButton(
            icon: Icons.fullscreen_rounded,
            tooltip: 'Fullscreen',
            onTap: onFullscreen,
          ),
        ],
      ),
    );
  }
}

class _RailButton extends StatelessWidget {
  const _RailButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
    this.badge = 0,
  });
  final IconData icon;
  final String tooltip;
  final VoidCallback? onTap;
  final int badge;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    final color = enabled ? T.ink : T.inkMuted;
    final iconWidget = Icon(icon, size: 20, color: color);
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(T.radiusSm),
        child: Container(
          padding: const EdgeInsets.all(7),
          child: badge > 0
              ? Stack(
                  clipBehavior: Clip.none,
                  children: [
                    iconWidget,
                    Positioned(
                      right: -4,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: T.saffronDeep,
                          borderRadius: BorderRadius.circular(99),
                          border: Border.all(color: T.paper, width: 1),
                        ),
                        constraints: const BoxConstraints(minWidth: 14),
                        child: Text(
                          badge > 99 ? '99+' : '$badge',
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
                )
              : iconWidget,
        ),
      ),
    );
  }
}

class _CounterPill extends StatelessWidget {
  const _CounterPill({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: T.paper.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: T.ink, width: 1.4),
        boxShadow: T.stickerShadow(y: 2),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: T.ink,
          fontFamily: 'Nunito',
          fontWeight: FontWeight.w900,
          fontSize: 12,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

