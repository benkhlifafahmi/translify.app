import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/coach_mark.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/sticker_card.dart';
import '../widgets/xp_bar.dart';
import 'panels/chat_panel.dart';
import 'panels/garden_panel.dart';
import 'panels/quiz_panel.dart';
import 'panels/read_panel.dart';
import 'panels/translate_panel.dart';

class BookDetailScreen extends StatefulWidget {
  const BookDetailScreen({super.key, required this.bookId, this.isOnboardingTour = false});
  final String bookId;
  final bool isOnboardingTour;
  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  Book? _book;
  String? _error;
  Timer? _poll;
  String? _selectedTranslationId;
  int _tab = 0;

  // Tour
  TourController? _tour;
  OverlayEntry? _overlay;
  final _tabKeys = List<GlobalKey>.generate(5, (_) => GlobalKey());

  static const _tabs = ['Read', 'Translate', 'Chat', 'Quiz', 'Garden'];
  static const _tabIcons = [
    Icons.menu_book_rounded,
    Icons.public_rounded,
    Icons.forum_rounded,
    Icons.bolt_rounded,
    Icons.local_florist_rounded,
  ];
  static const _tabColors = [T.saffron, T.sky, T.mint, T.candy, T.plum];

  @override
  void initState() {
    super.initState();
    if (widget.isOnboardingTour) {
      _tour = TourController()..addListener(_onTourStep);
    }
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 3), (_) => _maybeRefresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    _tour?.removeListener(_onTourStep);
    _tour?.dispose();
    _removeOverlay();
    super.dispose();
  }

  void _onTourStep() {
    if (!mounted) return;
    final step = _tour!.step;
    switch (step) {
      case TourStep.chatActive:
        setState(() => _tab = 2);
        _refreshOverlay();
      case TourStep.highlightHint:
        // Return to read so the user can select text.
        setState(() => _tab = 0);
        _refreshOverlay();
      case TourStep.quizActive:
        setState(() => _tab = 3);
        _removeOverlay();
      case TourStep.done:
        _removeOverlay();
        // Mark onboarding complete so splash doesn't send user here again.
        _setOnboardingDone();
        Navigator.of(context).pushReplacementNamed('/paywall');
      default:
        _refreshOverlay();
    }
  }

  Future<void> _setOnboardingDone() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_v1_done', true);
  }

  void _mountOverlay() {
    if (_overlay != null || !mounted) return;
    _overlay = OverlayEntry(
      builder: (_) => TourOverlayContent(
        controller: _tour!,
        tabKeys: _tabKeys,
        onSwitchTab: (i) => setState(() => _tab = i),
        onDone: () {
          _removeOverlay();
          Navigator.of(context).pushReplacementNamed('/paywall');
        },
        onAutoHighlight: _createTourHighlight,
      ),
    );
    Overlay.of(context).insert(_overlay!);
  }

  void _removeOverlay() {
    _overlay?.remove();
    _overlay = null;
  }

  void _refreshOverlay() {
    _overlay?.markNeedsBuild();
  }

  Future<void> _createTourHighlight() async {
    if (_book == null) return;
    // Use a short meaningful excerpt so the saved highlight makes sense in
    // context. The tour advances as soon as the API call succeeds.
    const passage = 'This is a key passage I want to remember from this book.';
    try {
      await context.read<Session>().highlights.create(
        _book!.id,
        page: 1,
        text: passage,
      );
      if (!mounted) return;
      _tour?.onHighlightCreated();
      _refreshOverlay();
    } catch (_) {
      // Best-effort — advance the tour anyway so a network hiccup doesn't trap
      // the user on this step.
      if (!mounted) return;
      _tour?.onHighlightCreated();
      _refreshOverlay();
    }
  }

  Future<void> _refresh() async {
    try {
      final b = await context.read<Session>().books.get(widget.bookId);
      if (!mounted) return;
      setState(() {
        _book = b;
        _error = null;
      });
      if (_tour != null && b.status == BookStatus.ready && _overlay == null) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _mountOverlay());
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    }
  }

  void _maybeRefresh() {
    if (!mounted) return;
    final b = _book;
    if (b == null) return;
    if (b.status == BookStatus.uploaded || b.status == BookStatus.processing) {
      _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final ready = _book?.status == BookStatus.ready;
    return Scaffold(
      extendBody: true,
      body: PaperBackground(
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              _Header(book: _book, onBack: () => Navigator.of(context).pop()),
              if (_book == null && _error == null)
                const Expanded(child: _Loading())
              else if (_error != null)
                Expanded(child: _Error(error: _error!, onRetry: _refresh))
              else if (!ready)
                Expanded(child: _NotReady(book: _book!))
              else
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    switchInCurve: Curves.easeOutCubic,
                    transitionBuilder: (child, anim) => FadeTransition(
                      opacity: anim,
                      child: SlideTransition(
                        position: Tween(
                          begin: const Offset(0, 0.04),
                          end: Offset.zero,
                        ).animate(anim),
                        child: child,
                      ),
                    ),
                    child: KeyedSubtree(
                      key: ValueKey(_tab),
                      child: _buildPanel(),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: ready
          ? _TabBar(
              current: _tab,
              onTap: (i) => setState(() => _tab = i),
              tabs: _tabs,
              icons: _tabIcons,
              colors: _tabColors,
              tabKeys: _tabKeys,
            )
          : null,
    );
  }

  Widget _buildPanel() {
    final b = _book!;
    switch (_tab) {
      case 0:
        return ReadPanel(
          bookId: b.id,
          format: b.format,
          translationId: _selectedTranslationId,
          onTourHighlightCreated: _tour == null ? null : () {
            _tour!.onHighlightCreated();
            _refreshOverlay();
          },
        );
      case 1:
        return TranslatePanel(
          bookId: b.id,
          sourceLanguage: b.sourceLanguage,
          selectedTranslationId: _selectedTranslationId,
          onSelect: (id) => setState(() => _selectedTranslationId = id),
        );
      case 2:
        return ChatPanel(
          bookId: b.id,
          translationId: _selectedTranslationId,
          onTourMessageSent: _tour == null ? null : () {
            _tour!.onChatSent();
            _refreshOverlay();
          },
        );
      case 3:
        return QuizPanel(
          bookId: b.id,
          translationId: _selectedTranslationId,
          tourMode: _tour != null,
          onTourComplete: _tour == null ? null : (score, total) {
            _tour!.onQuizComplete(score, total);
          },
        );
      case 4:
        return GardenPanel(bookId: b.id);
    }
    return const SizedBox.shrink();
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.book, required this.onBack});
  final Book? book;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
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
                  book?.title ?? '...',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                if (book != null)
                  Text(
                    [
                      if (book!.author != null) book!.author!,
                      book!.format == BookFormat.pdf ? 'PDF' : 'EPUB',
                      if (book!.pageCount != null) '${book!.pageCount}p',
                    ].join(' · '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: T.inkSoft,
                      fontSize: 12,
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w700,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          const HudBar(),
        ],
      ),
    );
  }
}

class _TabBar extends StatelessWidget {
  const _TabBar({
    required this.current,
    required this.onTap,
    required this.tabs,
    required this.icons,
    required this.colors,
    this.tabKeys,
  });

  final int current;
  final ValueChanged<int> onTap;
  final List<String> tabs;
  final List<IconData> icons;
  final List<Color> colors;
  final List<GlobalKey>? tabKeys;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
        child: Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: T.paper,
            borderRadius: BorderRadius.circular(T.radiusPill),
            border: Border.all(color: T.ink, width: 1.4),
            boxShadow: T.stickerShadow(y: 3),
          ),
          // Active tab expands (flex 2) with icon + label; inactive collapses
          // to icon-only (flex 1). Lets all 5 fit on a phone width comfortably.
          child: Row(
            children: List.generate(tabs.length, (i) {
              final active = i == current;
              return Expanded(
                flex: active ? 22 : 11,
                child: GestureDetector(
                  key: tabKeys?[i],
                  onTap: () => onTap(i),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 240),
                    curve: Curves.easeOutCubic,
                    padding: EdgeInsets.symmetric(
                      vertical: 10,
                      horizontal: active ? 10 : 0,
                    ),
                    decoration: BoxDecoration(
                      color: active ? colors[i] : Colors.transparent,
                      borderRadius: BorderRadius.circular(T.radiusPill),
                      border: active
                          ? Border.all(color: T.ink, width: 1.2)
                          : null,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          icons[i],
                          size: 18,
                          color: active ? T.ink : T.inkSoft,
                        ),
                        if (active) ...[
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              tabs[i],
                              maxLines: 1,
                              overflow: TextOverflow.fade,
                              softWrap: false,
                              style: const TextStyle(
                                color: T.ink,
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _Loading extends StatelessWidget {
  const _Loading();
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          LumiMascot(mood: LumiMood.thinking, size: 100),
          SizedBox(height: 10),
          Text(
            'Opening your book…',
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
}

class _Error extends StatelessWidget {
  const _Error({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: StickerCard(
            color: T.candy.withValues(alpha: 0.12),
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const LumiMascot(mood: LumiMood.sad, size: 80),
                const SizedBox(height: 8),
                Text('Couldn\'t open this book',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 6),
                Text(
                  error,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w700,
                    color: T.inkSoft,
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: onRetry,
                  child: const Text(
                    'Try again',
                    style: TextStyle(
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w900,
                      color: T.skyDeep,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NotReady extends StatelessWidget {
  const _NotReady({required this.book});
  final Book book;
  @override
  Widget build(BuildContext context) {
    if (book.status == BookStatus.failed) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: StickerCard(
            color: T.candy.withValues(alpha: 0.18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const LumiMascot(mood: LumiMood.sad, size: 90),
                const SizedBox(height: 8),
                Text('We hit a snag.',
                    style: Theme.of(context).textTheme.titleLarge),
                if (book.errorMessage != null) ...[
                  const SizedBox(height: 6),
                  Text(book.errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: 'Nunito',
                        color: T.candyDeep,
                        fontWeight: FontWeight.w700,
                      )),
                ],
              ],
            ),
          ),
        ),
      );
    }
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const LumiMascot(mood: LumiMood.thinking, size: 100),
            const SizedBox(height: 6),
            Text('Reading your book…',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 6),
            const Text(
              "I'm noting every page so chat and quizzes work great.\nBig books take a few minutes.",
              textAlign: TextAlign.center,
              style: TextStyle(
                color: T.inkSoft,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w700,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 14),
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                color: T.saffronDeep,
                strokeWidth: 3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
