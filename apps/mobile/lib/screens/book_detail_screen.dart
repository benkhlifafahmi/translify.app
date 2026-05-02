import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/owl_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/sticker_card.dart';
import '../widgets/xp_bar.dart';
import 'panels/chat_panel.dart';
import 'panels/quiz_panel.dart';
import 'panels/read_panel.dart';
import 'panels/translate_panel.dart';

class BookDetailScreen extends StatefulWidget {
  const BookDetailScreen({super.key, required this.bookId});
  final String bookId;
  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  Book? _book;
  Object? _error;
  Timer? _poll;
  String? _selectedTranslationId;
  int _tab = 0;

  static const _tabs = ['Read', 'Translate', 'Chat', 'Quiz'];
  static const _tabIcons = [
    Icons.menu_book_rounded,
    Icons.public_rounded,
    Icons.forum_rounded,
    Icons.bolt_rounded,
  ];
  static const _tabColors = [T.saffron, T.sky, T.mint, T.candy];

  @override
  void initState() {
    super.initState();
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 3), (_) => _maybeRefresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      final b = await context.read<Session>().books.get(widget.bookId);
      if (!mounted) return;
      setState(() {
        _book = b;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e);
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
    return Scaffold(
      body: PaperBackground(
        child: SafeArea(
          child: Column(
            children: [
              _Header(book: _book, onBack: () => Navigator.of(context).pop()),
              if (_book == null && _error == null)
                const Expanded(child: _Loading())
              else if (_error != null)
                Expanded(child: _Error(error: _error!, onRetry: _refresh))
              else if (_book!.status != BookStatus.ready)
                Expanded(child: _NotReady(book: _book!))
              else ...[
                _TabBar(
                  current: _tab,
                  onTap: (i) => setState(() => _tab = i),
                  tabs: _tabs,
                  icons: _tabIcons,
                  colors: _tabColors,
                ),
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
            ],
          ),
        ),
      ),
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
        );
      case 3:
        return QuizPanel(
          bookId: b.id,
          translationId: _selectedTranslationId,
        );
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
  });

  final int current;
  final ValueChanged<int> onTap;
  final List<String> tabs;
  final List<IconData> icons;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: T.paper,
          borderRadius: BorderRadius.circular(T.radiusPill),
          border: Border.all(color: T.ink, width: 1.6),
          boxShadow: T.stickerShadow(y: 3),
        ),
        child: Row(
          children: List.generate(tabs.length, (i) {
            final active = i == current;
            return Expanded(
              child: GestureDetector(
                onTap: () => onTap(i),
                behavior: HitTestBehavior.opaque,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutCubic,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: active ? colors[i] : Colors.transparent,
                    borderRadius: BorderRadius.circular(T.radiusPill),
                    border: active
                        ? Border.all(color: T.ink, width: 1.4)
                        : null,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        icons[i],
                        size: 18,
                        color: active ? T.ink : T.inkSoft,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        tabs[i],
                        style: TextStyle(
                          color: active ? T.ink : T.inkSoft,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Nunito',
                          letterSpacing: 0.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
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
          OwlMascot(mood: OwlMood.thinking, size: 100),
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
  final Object error;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: StickerCard(
          color: T.candy.withValues(alpha: 0.12),
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const OwlMascot(mood: OwlMood.sad, size: 80),
              const SizedBox(height: 8),
              Text('Couldn\'t open this book',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 6),
              Text(
                '$error',
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
                const OwlMascot(mood: OwlMood.sad, size: 90),
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
            const OwlMascot(mood: OwlMood.thinking, size: 100),
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
