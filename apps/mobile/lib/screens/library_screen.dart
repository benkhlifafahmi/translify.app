import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';
import '../widgets/sticker_card.dart';
import '../widgets/xp_bar.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});
  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  Future<List<Book>>? _booksFuture;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted) return;
      // Re-fetch silently if any book is still processing.
      _silentRefreshIfPending();
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  void _refresh() {
    setState(() {
      _booksFuture = context.read<Session>().books.list();
    });
  }

  Future<void> _silentRefreshIfPending() async {
    final cur = await _booksFuture;
    if (cur == null) return;
    final pending = cur.any((b) =>
        b.status == BookStatus.uploaded || b.status == BookStatus.processing);
    if (!pending) return;
    try {
      final fresh = await context.read<Session>().books.list();
      if (!mounted) return;
      setState(() {
        _booksFuture = Future.value(fresh);
      });
    } catch (_) {/* keep old */}
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 5) return 'Burning the midnight oil,';
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Hello hello,';
    if (h < 21) return 'Evening,';
    return 'Up late,';
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final user = session.user;
    final name = (user?.displayName?.split(' ').first.isNotEmpty ?? false)
        ? user!.displayName!.split(' ').first
        : (user?.email.split('@').first ?? 'reader');

    return Scaffold(
      body: PaperBackground(
        child: SafeArea(
          child: RefreshIndicator(
            color: T.candyDeep,
            backgroundColor: T.paper,
            onRefresh: () async => _refresh(),
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                    child: Row(
                      children: [
                        const Expanded(child: HudBar()),
                        const SizedBox(width: 8),
                        IconButton(
                          tooltip: 'Sign out',
                          icon: const Icon(Icons.logout_rounded, color: T.ink),
                          style: IconButton.styleFrom(
                            backgroundColor: T.paper,
                            side: const BorderSide(color: T.ink, width: 1.4),
                            shape: const CircleBorder(),
                          ),
                          onPressed: () async {
                            await context.read<Session>().logout();
                            if (!mounted) return;
                            Navigator.of(context)
                                .pushNamedAndRemoveUntil('/login', (_) => false);
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 18, 24, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(_greeting(),
                                      style: Theme.of(context)
                                          .textTheme
                                          .headlineMedium),
                                  Text(
                                    name,
                                    style: Theme.of(context)
                                        .textTheme
                                        .displayMedium
                                        ?.copyWith(
                                          color: T.candyDeep,
                                          fontStyle: FontStyle.italic,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                            Transform.translate(
                              offset: const Offset(8, -8),
                              child: const LumiMascot(
                                  mood: LumiMood.happy, size: 90),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Your shelf, your quest.',
                          style: TextStyle(
                            color: T.inkSoft,
                            fontFamily: 'Nunito',
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 14, 24, 8),
                    child: QuestButton(
                      label: 'Add a new book',
                      icon: Icons.add_rounded,
                      color: T.candy,
                      foreground: T.paper,
                      size: QuestButtonSize.large,
                      onPressed: () async {
                        await Navigator.of(context).pushNamed('/upload');
                        if (mounted) _refresh();
                      },
                    ),
                  ),
                ),
                FutureBuilder<List<Book>>(
                  future: _booksFuture,
                  builder: (context, snap) {
                    if (snap.connectionState == ConnectionState.waiting &&
                        !snap.hasData) {
                      return const SliverFillRemaining(
                        hasScrollBody: false,
                        child: _ShelfLoading(),
                      );
                    }
                    if (snap.hasError) {
                      return SliverFillRemaining(
                        hasScrollBody: false,
                        child: _ShelfError(
                          message: snap.error.toString(),
                          onRetry: _refresh,
                        ),
                      );
                    }
                    final books = snap.data ?? const [];
                    if (books.isEmpty) {
                      return const SliverFillRemaining(
                        hasScrollBody: false,
                        child: _EmptyShelf(),
                      );
                    }
                    return SliverPadding(
                      padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
                      sliver: SliverList.builder(
                        itemCount: books.length,
                        itemBuilder: (context, i) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: BookSticker(
                              book: books[i],
                              index: i,
                              onTap: () async {
                                await Navigator.of(context).pushNamed(
                                  '/book',
                                  arguments: books[i].id,
                                );
                                if (mounted) _refresh();
                              },
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class BookSticker extends StatelessWidget {
  const BookSticker({
    super.key,
    required this.book,
    required this.index,
    required this.onTap,
  });

  final Book book;
  final int index;
  final VoidCallback onTap;

  static const _spineTones = [
    [T.saffron, T.saffronDeep],
    [T.mint, T.mintDeep],
    [T.candy, T.candyDeep],
    [T.sky, T.skyDeep],
  ];

  @override
  Widget build(BuildContext context) {
    final tone = _spineTones[index % _spineTones.length];
    final tilt = (index.isEven ? -1 : 1) * 0.012;

    final statusInfo = switch (book.status) {
      BookStatus.uploaded => ('Queued', T.inkMuted),
      BookStatus.processing => ('Reading…', T.skyDeep),
      BookStatus.ready => ('Ready ✦', T.mintDeep),
      BookStatus.failed => ('Hit a snag', T.candyDeep),
    };

    return StickerCard(
      tilt: tilt,
      onTap: book.status == BookStatus.ready ? onTap : onTap,
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Spine
          Container(
            width: 64,
            height: 92,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: tone,
              ),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: T.ink, width: 1.6),
              boxShadow: T.stickerShadow(y: 2),
            ),
            child: Center(
              child: Transform.rotate(
                angle: -math.pi / 2,
                child: SizedBox(
                  width: 80,
                  child: Text(
                    book.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: T.paper,
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  book.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 2),
                Text(
                  book.author ?? '—',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: T.inkSoft,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    Pill(
                      label: book.format == BookFormat.pdf ? 'PDF' : 'EPUB',
                      color: T.paper3,
                    ),
                    if (book.pageCount != null)
                      Pill(label: '${book.pageCount}p', color: T.paper3),
                    Pill(
                      label: statusInfo.$1,
                      color: statusInfo.$2.withValues(alpha: 0.20),
                      foreground: statusInfo.$2,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: T.ink, size: 28),
        ],
      ),
    );
  }
}

class _EmptyShelf extends StatelessWidget {
  const _EmptyShelf();
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 36),
      child: Column(
        children: [
          const SizedBox(height: 8),
          StickerCard(
            color: T.paper,
            tilt: -0.01,
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    LumiMascot(mood: LumiMood.thinking, size: 60),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'No books yet?',
                        style: TextStyle(
                          fontFamily: 'LilitaOne',
                          fontSize: 22,
                          color: T.ink,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Tap "Add a new book" to drop a PDF or EPUB. I will gobble it up and prep page-perfect chat + quizzes.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: T.inkSoft,
                        height: 1.55,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ShelfLoading extends StatelessWidget {
  const _ShelfLoading();
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          LumiMascot(mood: LumiMood.thinking, size: 100),
          SizedBox(height: 12),
          Text(
            'Dusting off your shelf…',
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

class _ShelfError extends StatelessWidget {
  const _ShelfError({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const LumiMascot(mood: LumiMood.sad, size: 100),
            const SizedBox(height: 10),
            Text('Couldn\'t open the shelf',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: T.inkSoft,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            QuestButton(label: 'Try again', onPressed: onRetry, expand: false),
          ],
        ),
      ),
    );
  }
}
