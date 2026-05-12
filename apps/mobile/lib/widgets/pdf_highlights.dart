import 'package:syncfusion_flutter_pdf/pdf.dart' as pdf;
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

import '../api/models.dart';
import 'highlight_actions.dart';

/// Owns the syncfusion HighlightAnnotation objects mirrored from saved
/// [Highlight] records, and keeps the two-way mapping needed to handle
/// taps + color/note updates.
///
/// Layout: one overlay per [PdfViewerController]. The inline panel and
/// the fullscreen reader each own their own instance.
class PdfHighlightOverlay {
  PdfHighlightOverlay(this.controller);

  final PdfViewerController controller;

  final Map<String, Annotation> _byId = {};
  final Map<Annotation, String> _idByAnnotation = {};

  /// Renders every highlight whose page exists in [document]. Skips any
  /// whose text we can't locate on the page — better to silently miss
  /// one outlier than to crash the whole load.
  void renderAll(pdf.PdfDocument document, Iterable<Highlight> highlights) {
    for (final h in highlights) {
      add(document, h);
    }
  }

  /// Adds a single highlight. Returns the resulting Annotation, or null
  /// if the text could not be located on its page.
  Annotation? add(pdf.PdfDocument document, Highlight h) {
    if (_byId.containsKey(h.id)) return _byId[h.id];
    final lines = _findLinesForHighlight(document, h);
    if (lines.isEmpty) return null;
    final annotation = HighlightAnnotation(textBoundsCollection: lines)
      ..name = h.id
      ..color = highlightInkColor(h.color);
    controller.addAnnotation(annotation);
    _byId[h.id] = annotation;
    _idByAnnotation[annotation] = h.id;
    return annotation;
  }

  /// Adds an annotation built from a fresh selection. The caller is
  /// responsible for collecting the [PdfTextLine]s (typically via
  /// `SfPdfViewerState.getSelectedTextLines()`).
  Annotation addFromTextLines(
    Highlight h,
    List<PdfTextLine> textLines,
  ) {
    final annotation = HighlightAnnotation(textBoundsCollection: textLines)
      ..name = h.id
      ..color = highlightInkColor(h.color);
    controller.addAnnotation(annotation);
    _byId[h.id] = annotation;
    _idByAnnotation[annotation] = h.id;
    return annotation;
  }

  void updateColor(String id, HighlightColor color) {
    final a = _byId[id];
    if (a != null) a.color = highlightInkColor(color);
  }

  void removeById(String id) {
    final a = _byId.remove(id);
    if (a == null) return;
    _idByAnnotation.remove(a);
    controller.removeAnnotation(a);
  }

  void clear() {
    for (final a in _byId.values.toList()) {
      controller.removeAnnotation(a);
    }
    _byId.clear();
    _idByAnnotation.clear();
  }

  String? idOf(Annotation a) => _idByAnnotation[a];
}

// ─────────────────────────── Text-bounds matching ─────────────────────

/// Finds the [PdfTextLine]s on `h.page` whose text overlaps `h.text`.
///
/// Strategy: extract the page's lines in reading order, then accumulate
/// consecutive lines whose normalized text appears inside the normalized
/// highlight text. This handles both single-line and multi-line spans
/// without needing offset-level alignment.
List<PdfTextLine> _findLinesForHighlight(
  pdf.PdfDocument document,
  Highlight h,
) {
  final pageIndex = h.page - 1;
  if (pageIndex < 0 || pageIndex >= document.pages.count) return const [];

  final lines = pdf.PdfTextExtractor(document).extractTextLines(
    startPageIndex: pageIndex,
    endPageIndex: pageIndex,
  );
  if (lines.isEmpty) return const [];

  final target = _normalize(h.text);
  if (target.isEmpty) return const [];

  // Build a list of (normalized text, original TextLine) once.
  final entries = <_LineEntry>[
    for (final l in lines) _LineEntry(_normalize(l.text), l),
  ];

  // Try each starting index and walk forward as long as the accumulated
  // text remains a prefix of the target (modulo whitespace).
  for (int i = 0; i < entries.length; i++) {
    final first = entries[i];
    if (first.normalized.isEmpty) continue;
    if (!target.contains(first.normalized)) continue;

    // Find target's start position from this line's text — required so
    // multi-line walks measure progress from the right offset.
    final startInTarget = target.indexOf(first.normalized);
    if (startInTarget < 0) continue;

    final chosen = <pdf.TextLine>[first.line];
    int consumed = startInTarget + first.normalized.length;

    if (consumed >= target.length) {
      return _toViewerLines(chosen, pageIndex);
    }

    for (int j = i + 1; j < entries.length; j++) {
      final next = entries[j];
      if (next.normalized.isEmpty) continue;
      // Skip pure whitespace gap.
      if (consumed < target.length && target[consumed] == ' ') consumed++;
      if (!target.substring(consumed).startsWith(next.normalized)) {
        // Mismatch — this walk fails, abandon.
        break;
      }
      chosen.add(next.line);
      consumed += next.normalized.length;
      if (consumed >= target.length) {
        return _toViewerLines(chosen, pageIndex);
      }
    }
  }

  // Fall back to fuzzy: any line whose normalized text appears inside the
  // target. Imperfect (the highlight rectangle may cover slightly more
  // text than was actually selected), but better than nothing.
  final fallback = <pdf.TextLine>[
    for (final e in entries)
      if (e.normalized.isNotEmpty && target.contains(e.normalized)) e.line,
  ];
  return _toViewerLines(fallback, pageIndex);
}

List<PdfTextLine> _toViewerLines(List<pdf.TextLine> lines, int pageIndex) {
  // SfPdfViewer's PdfTextLine uses 1-based page numbers; PdfTextExtractor
  // returns 0-based pageIndex.
  return <PdfTextLine>[
    for (final l in lines) PdfTextLine(l.bounds, l.text, pageIndex + 1),
  ];
}

String _normalize(String s) =>
    s.replaceAll(RegExp(r'\s+'), ' ').trim().toLowerCase();

class _LineEntry {
  _LineEntry(this.normalized, this.line);
  final String normalized;
  final pdf.TextLine line;
}
