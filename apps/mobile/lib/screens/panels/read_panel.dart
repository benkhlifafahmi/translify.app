import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:pdfx/pdfx.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../state/session.dart';
import '../../theme/tokens.dart';
import '../../widgets/lumi_mascot.dart';
import '../../widgets/quest_button.dart';
import '../../widgets/sticker_card.dart';
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
  PdfControllerPinch? _pdf;
  Uint8List? _bytes;
  String? _error;
  String? _resolvedKey;
  int _page = 1;
  int _total = 1;

  @override
  void initState() {
    super.initState();
    _open();
  }

  @override
  void didUpdateWidget(covariant ReadPanel old) {
    super.didUpdateWidget(old);
    final key = '${widget.bookId}/${widget.translationId ?? ''}';
    if (key != _resolvedKey) _open();
  }

  @override
  void dispose() {
    _pdf?.dispose();
    super.dispose();
  }

  Future<void> _open() async {
    final session = context.read<Session>();
    final key = '${widget.bookId}/${widget.translationId ?? ''}';
    setState(() {
      _resolvedKey = key;
      _error = null;
      _bytes = null;
    });
    try {
      if (widget.format == BookFormat.epub) {
        setState(() => _error = 'EPUB preview is on the way.');
        return;
      }
      final url = widget.translationId != null
          ? (await session.translations.fileUrl(widget.translationId!)).url
          : (await session.books.fileUrl(widget.bookId)).url;
      if (!mounted) return;
      final bytes = await _downloadBytes(url);
      if (!mounted) return;
      final doc = await PdfDocument.openData(bytes);
      _pdf?.dispose();
      _pdf = PdfControllerPinch(document: Future.value(doc));
      if (!mounted) return;
      setState(() {
        _bytes = bytes;
        _total = doc.pagesCount;
        _page = 1;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    }
  }

  Future<Uint8List> _downloadBytes(String url) async {
    // Fresh Dio — presigned MinIO URLs reject requests with an Authorization header.
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

  Future<void> _expandToFullscreen() async {
    final bytes = _bytes;
    if (bytes == null) return;
    final returnPage = await Navigator.push<int>(
      context,
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => PdfReaderScreen(
          bytes: bytes,
          totalPages: _total,
          initialPage: _page,
        ),
      ),
    );
    if (returnPage != null && returnPage != _page) {
      _pdf?.jumpToPage(returnPage);
      setState(() => _page = returnPage);
    }
  }

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

    if (_pdf == null) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            LumiMascot(mood: LumiMood.thinking, size: 80),
            SizedBox(height: 6),
            Text(
              'Loading pages…',
              style: TextStyle(
                color: T.inkSoft,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      );
    }

    return Stack(
      children: [
        // Inline PDF viewer
        PdfViewPinch(
          controller: _pdf!,
          onPageChanged: (p) => setState(() => _page = p),
        ),

        // Transparent tap layer — opens fullscreen reader on tap.
        // HitTestBehavior.translucent lets pinch/pan pass through to PdfViewPinch.
        GestureDetector(
          behavior: HitTestBehavior.translucent,
          onTap: _expandToFullscreen,
          child: const SizedBox.expand(),
        ),

        // Page counter pill (bottom-centre)
        Positioned(
          left: 16,
          right: 16,
          bottom: 14,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: T.paper.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: T.ink, width: 1.4),
                boxShadow: T.stickerShadow(y: 2),
              ),
              child: Text(
                'page $_page / $_total',
                style: const TextStyle(
                  color: T.ink,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  letterSpacing: 0.4,
                ),
              ),
            ),
          ),
        ),

        // Expand hint (top-right)
        Positioned(
          top: 10,
          right: 12,
          child: GestureDetector(
            onTap: _expandToFullscreen,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: T.paper.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: T.ink, width: 1.4),
                boxShadow: T.stickerShadow(y: 2),
              ),
              child: const Icon(Icons.fullscreen_rounded,
                  size: 20, color: T.ink),
            ),
          ),
        ),
      ],
    );
  }
}
