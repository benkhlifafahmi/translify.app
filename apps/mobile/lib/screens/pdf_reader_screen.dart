import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pdfx/pdfx.dart';

class PdfReaderScreen extends StatefulWidget {
  const PdfReaderScreen({
    super.key,
    required this.bytes,
    required this.totalPages,
    this.title,
    this.initialPage = 1,
  });

  final Uint8List bytes;
  final int totalPages;
  final String? title;
  final int initialPage;

  @override
  State<PdfReaderScreen> createState() => _PdfReaderScreenState();
}

class _PdfReaderScreenState extends State<PdfReaderScreen> {
  // PdfView (PageView-based) handles horizontal swiping without the
  // NaN-in-viewport bug that PdfViewPinch has with Axis.horizontal.
  late final PdfController _pdf;
  int _page = 1;
  late int _total;
  bool _overlayVisible = true;
  Timer? _hideTimer;

  @override
  void initState() {
    super.initState();
    _total = widget.totalPages;
    _page = widget.initialPage;
    _pdf = PdfController(
      document: PdfDocument.openData(widget.bytes),
      initialPage: widget.initialPage,
    );
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _scheduleHide();
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _pdf.dispose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
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

  void _jumpTo(int page) {
    final p = page.clamp(1, _total);
    _pdf.jumpToPage(p);
    setState(() => _page = p);
    _scheduleHide();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // PdfView uses PageView internally → horizontal page swiping
          // with no NaN issue. Each page also supports pinch-to-zoom.
          PdfView(
            controller: _pdf,
            scrollDirection: Axis.horizontal,
            onPageChanged: (p) => setState(() => _page = p),
            builders: PdfViewBuilders<DefaultBuilderOptions>(
              options: const DefaultBuilderOptions(),
              documentLoaderBuilder: (_) => const Center(
                child: CircularProgressIndicator(
                    color: Colors.white38, strokeWidth: 2),
              ),
              pageLoaderBuilder: (_) => const SizedBox.shrink(),
              errorBuilder: (_, err) => Center(
                child: Text(
                  err.toString(),
                  style: const TextStyle(color: Colors.white54),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),

          // Transparent tap catcher — onTap toggles overlay without
          // blocking the PageView's horizontal swipe gestures.
          GestureDetector(
            behavior: HitTestBehavior.translucent,
            onTap: _toggleOverlay,
            child: const SizedBox.expand(),
          ),

          // ── Top bar ──────────────────────────────────────────────
          AnimatedSlide(
            offset: _overlayVisible ? Offset.zero : const Offset(0, -1),
            duration: const Duration(milliseconds: 240),
            curve: Curves.easeInOut,
            child: _TopBar(
              title: widget.title,
              page: _page,
              total: _total,
              onClose: () => Navigator.of(context).pop(_page),
            ),
          ),

          // ── Bottom bar ───────────────────────────────────────────
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: AnimatedSlide(
              offset: _overlayVisible ? Offset.zero : const Offset(0, 1),
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeInOut,
              child: _BottomBar(
                page: _page,
                total: _total,
                onChanged: (v) => _jumpTo(v.round()),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Top bar
// ─────────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.title,
    required this.page,
    required this.total,
    required this.onClose,
  });

  final String? title;
  final int page;
  final int total;
  final VoidCallback onClose;

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
                  '$page / $total',
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

// ─────────────────────────────────────────────────────────────
// Bottom bar — page slider
// ─────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  const _BottomBar({
    required this.page,
    required this.total,
    required this.onChanged,
  });

  final int page;
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
                    value: page.toDouble().clamp(1.0, total.toDouble()),
                    label: '$page',
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
