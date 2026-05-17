import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_client.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';
import '../widgets/quest_input.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _page = PageController();
  int _current = 0;
  static const _total = 4;

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  void _goTo(int page) {
    _page.animateToPage(
      page,
      duration: const Duration(milliseconds: 380),
      curve: Curves.easeInOut,
    );
  }

  Future<void> _markDone() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_v1_done', true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PaperBackground(
        child: SafeArea(
          child: Column(
            children: [
              _Header(
                current: _current,
                onSkip: _current < _total - 1 ? () => _goTo(_total - 1) : null,
              ),
              Expanded(
                child: PageView(
                  controller: _page,
                  physics: const BouncingScrollPhysics(),
                  onPageChanged: (i) => setState(() => _current = i),
                  children: [
                    _ReadSlide(onNext: () => _goTo(1)),
                    _ChatSlide(onNext: () => _goTo(2)),
                    _QuizSlide(onNext: () => _goTo(3)),
                    _SignUpSlide(
                      onDone: () async {
                        final nav = Navigator.of(context);
                        await _markDone();
                        if (!mounted) return;
                        nav.pushReplacementNamed('/paywall');
                      },
                      onLogin: () {
                        Navigator.of(context).pushReplacementNamed('/login');
                      },
                    ),
                  ],
                ),
              ),
              _DotBar(current: _current, total: _total),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.current, this.onSkip});
  final int current;
  final VoidCallback? onSkip;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 12, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Translify',
            style: TextStyle(
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w900,
              fontSize: 18,
              color: T.ink,
              letterSpacing: -0.3,
            ),
          ),
          if (onSkip != null)
            TextButton(
              onPressed: onSkip,
              style: TextButton.styleFrom(
                foregroundColor: T.inkMuted,
                textStyle: const TextStyle(
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
              child: const Text('Skip →'),
            ),
        ],
      ),
    );
  }
}

// ── Dot indicator ─────────────────────────────────────────────────────────────

class _DotBar extends StatelessWidget {
  const _DotBar({required this.current, required this.total});
  final int current;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18, top: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(total, (i) {
          final active = i == current;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeInOut,
            margin: const EdgeInsets.symmetric(horizontal: 3.5),
            width: active ? 22 : 6,
            height: 6,
            decoration: BoxDecoration(
              color: active ? T.saffron : T.paper3,
              borderRadius: BorderRadius.circular(99),
              border: active ? Border.all(color: T.saffronDeep, width: 1.2) : null,
            ),
          );
        }),
      ),
    );
  }
}

// ── Slide 0: Reading experience ───────────────────────────────────────────────

class _ReadSlide extends StatefulWidget {
  const _ReadSlide({required this.onNext});
  final VoidCallback onNext;
  @override
  State<_ReadSlide> createState() => _ReadSlideState();
}

class _ReadSlideState extends State<_ReadSlide>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ac = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );

  @override
  void initState() {
    super.initState();
    _loop();
  }

  Future<void> _loop() async {
    await Future.delayed(const Duration(milliseconds: 700));
    while (mounted) {
      await _ac.forward();
      if (!mounted) return;
      await Future.delayed(const Duration(milliseconds: 2200));
      if (!mounted) return;
      await _ac.reverse();
      if (!mounted) return;
      await Future.delayed(const Duration(milliseconds: 600));
    }
  }

  @override
  void dispose() {
    _ac.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 3,
            child: Center(child: _BookCard(animation: _ac)),
          ),
          const SizedBox(height: 20),
          Text('Read smarter.',
              style: Theme.of(context).textTheme.displaySmall),
          const SizedBox(height: 8),
          const Text(
            'Upload any EPUB or PDF. Tap any word for instant translation and context.',
            style: TextStyle(
              color: T.inkSoft,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w600,
              fontSize: 15,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 22),
          QuestButton(
            label: 'Next',
            iconRight: Icons.arrow_forward_rounded,
            onPressed: widget.onNext,
            size: QuestButtonSize.large,
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

class _BookCard extends StatelessWidget {
  const _BookCard({required this.animation});
  final Animation<double> animation;

  @override
  Widget build(BuildContext context) {
    final highlightA = CurvedAnimation(
      parent: animation,
      curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
    );
    final popupA = CurvedAnimation(
      parent: animation,
      curve: const Interval(0.45, 0.85, curve: Curves.easeOut),
    );

    return Container(
      constraints: const BoxConstraints(maxWidth: 310),
      decoration: BoxDecoration(
        color: T.paper2,
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.paper3, width: 1.5),
        boxShadow: T.stickerShadow(y: 8),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: -28,
            right: 4,
            child: const LumiMascot(mood: LumiMood.happy, size: 58),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: T.saffron.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'CHAPTER 3 · THE GARDEN',
                    style: TextStyle(
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w900,
                      fontSize: 10,
                      color: T.saffronDeep,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _FakeLines(count: 3),
                const SizedBox(height: 6),
                _HighlightLine(highlight: highlightA, popup: popupA),
                const SizedBox(height: 6),
                _FakeLines(count: 2, widthFactors: [0.9, 0.6]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FakeLines extends StatelessWidget {
  const _FakeLines({this.count = 3, this.widthFactors});
  final int count;
  final List<double>? widthFactors;

  @override
  Widget build(BuildContext context) {
    final defaults = [1.0, 0.88, 0.65];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(count, (i) {
        final f = widthFactors != null
            ? widthFactors![i % widthFactors!.length]
            : defaults[i % defaults.length];
        return Padding(
          padding: const EdgeInsets.only(bottom: 7),
          child: FractionallySizedBox(
            widthFactor: f,
            alignment: Alignment.centerLeft,
            child: Container(
              height: 9,
              decoration: BoxDecoration(
                color: T.paper3,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        );
      }),
    );
  }
}

class _HighlightLine extends StatelessWidget {
  const _HighlightLine({required this.highlight, required this.popup});
  final Animation<double> highlight;
  final Animation<double> popup;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 55,
          height: 9,
          decoration: BoxDecoration(
            color: T.paper3,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 6),
        Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            AnimatedBuilder(
              animation: highlight,
              builder: (_, child) => Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: T.saffron.withValues(alpha: highlight.value * 0.38),
                  borderRadius: BorderRadius.circular(5),
                  border: highlight.value > 0.05
                      ? Border.all(
                          color: T.saffron
                              .withValues(alpha: highlight.value * 0.7),
                          width: 1,
                        )
                      : null,
                ),
                child: Text(
                  'تُراب',
                  style: TextStyle(
                    color: Color.lerp(T.ink, T.saffronDeep, highlight.value),
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: 28,
              left: -16,
              child: FadeTransition(
                opacity: popup,
                child: SlideTransition(
                  position: Tween(
                    begin: const Offset(0, 0.6),
                    end: Offset.zero,
                  ).animate(popup),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 7),
                    decoration: BoxDecoration(
                      color: T.ink,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: T.stickerShadow(y: 4),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'تُراب · turāb',
                          style: TextStyle(
                            color: T.saffron,
                            fontFamily: 'Nunito',
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
                          ),
                        ),
                        Text(
                          'soil · earth  (Arabic)',
                          style: TextStyle(
                            color: T.paper2,
                            fontFamily: 'Nunito',
                            fontWeight: FontWeight.w600,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Container(
            height: 9,
            decoration: BoxDecoration(
              color: T.paper3,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Slide 1: Chat demo ────────────────────────────────────────────────────────

class _ChatSlide extends StatefulWidget {
  const _ChatSlide({required this.onNext});
  final VoidCallback onNext;
  @override
  State<_ChatSlide> createState() => _ChatSlideState();
}

class _ChatSlideState extends State<_ChatSlide> {
  int _visible = 0;
  bool _typing = false;

  static const _msgs = [
    (true, "What's the main theme of this chapter?"),
    (false,
        "This chapter explores resilience — the protagonist finds strength not through certainty, but by accepting the unknown."),
    (true, "Quiz me on the symbolism!"),
    (false,
        "Sure! What does the garden represent in the story?\n\nA) Hope    B) Loss    C) Renewal    D) Control"),
  ];

  @override
  void initState() {
    super.initState();
    _loop();
  }

  Future<void> _loop() async {
    while (mounted) {
      if (mounted) setState(() { _visible = 0; _typing = false; });
      await Future.delayed(const Duration(milliseconds: 900));
      for (var i = 0; i < _msgs.length; i++) {
        if (!mounted) return;
        setState(() => _typing = true);
        await Future.delayed(const Duration(milliseconds: 900));
        if (!mounted) return;
        setState(() { _typing = false; _visible = i + 1; });
        await Future.delayed(const Duration(milliseconds: 600));
      }
      await Future.delayed(const Duration(milliseconds: 3000));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const LumiMascot(mood: LumiMood.thinking, size: 50),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Ask anything.',
                        style: Theme.of(context).textTheme.headlineMedium),
                    const Text(
                      'Lumi reads every book with you.',
                      style: TextStyle(
                        color: T.inkSoft,
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: T.paper,
                borderRadius: BorderRadius.circular(T.radiusMd),
                border: Border.all(color: T.paper3, width: 1.5),
                boxShadow: T.stickerShadow(y: 4),
              ),
              clipBehavior: Clip.hardEdge,
              child: Column(
                children: [
                  _ChatHeader(typing: _typing),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.all(12),
                      children: [
                        for (var i = 0;
                            i < _visible.clamp(0, _msgs.length);
                            i++)
                          _ChatBubble(
                            isUser: _msgs[i].$1,
                            text: _msgs[i].$2,
                          ),
                      ],
                    ),
                  ),
                  _ChatInputBar(),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          QuestButton(
            label: 'Next',
            iconRight: Icons.arrow_forward_rounded,
            onPressed: widget.onNext,
            size: QuestButtonSize.large,
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

class _ChatHeader extends StatelessWidget {
  const _ChatHeader({required this.typing});
  final bool typing;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: const BoxDecoration(
        color: T.paper2,
        border: Border(bottom: BorderSide(color: T.paper3, width: 1)),
      ),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: T.sage,
              shape: BoxShape.circle,
              border: Border.all(color: T.ink, width: 1.5),
            ),
            child: const Icon(Icons.auto_awesome_rounded,
                size: 14, color: T.paper),
          ),
          const SizedBox(width: 8),
          const Text(
            'Lumi · Book Chat',
            style: TextStyle(
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w800,
              fontSize: 13,
              color: T.ink,
            ),
          ),
          const Spacer(),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: typing
                ? const _TypingDots(key: ValueKey('typing'))
                : const SizedBox.shrink(key: ValueKey('idle')),
          ),
        ],
      ),
    );
  }
}

class _ChatInputBar extends StatelessWidget {
  const _ChatInputBar();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(10),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: T.paper2,
                borderRadius: BorderRadius.circular(T.radiusPill),
                border: Border.all(color: T.paper3, width: 1.5),
              ),
              child: const Text(
                'Ask about this book…',
                style: TextStyle(
                  color: T.inkMuted,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: T.saffron,
              shape: BoxShape.circle,
              border: Border.all(color: T.ink, width: 1.5),
            ),
            child:
                const Icon(Icons.arrow_upward_rounded, size: 14, color: T.ink),
          ),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.isUser, required this.text});
  final bool isUser;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: T.sage,
                shape: BoxShape.circle,
                border: Border.all(color: T.ink, width: 1.2),
              ),
              child: const Icon(Icons.auto_awesome_rounded,
                  size: 11, color: T.paper),
            ),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isUser ? T.saffron : T.paper2,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(14),
                  topRight: const Radius.circular(14),
                  bottomLeft: Radius.circular(isUser ? 14 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 14),
                ),
                border: Border.all(
                  color: isUser ? T.saffronDeep : T.paper3,
                  width: 1.2,
                ),
              ),
              child: Text(
                text,
                style: TextStyle(
                  color: T.ink,
                  fontFamily: 'Nunito',
                  fontWeight: isUser ? FontWeight.w700 : FontWeight.w600,
                  fontSize: 12,
                  height: 1.45,
                ),
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 6),
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: T.paper2,
                shape: BoxShape.circle,
                border: Border.all(color: T.paper3, width: 1.2),
              ),
              child: const Icon(Icons.person_outline_rounded,
                  size: 13, color: T.inkSoft),
            ),
          ],
        ],
      ),
    );
  }
}

class _TypingDots extends StatefulWidget {
  const _TypingDots({super.key});
  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ac = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..repeat();

  @override
  void dispose() {
    _ac.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Text(
          'typing',
          style: TextStyle(
            color: T.inkMuted,
            fontFamily: 'Nunito',
            fontWeight: FontWeight.w600,
            fontSize: 11,
          ),
        ),
        const SizedBox(width: 4),
        ...List.generate(3, (i) {
          return AnimatedBuilder(
            animation: _ac,
            builder: (_, child) {
              final v = (((_ac.value * 3) - i).clamp(0, 1) *
                      (1 - (_ac.value * 3 - i - 0.5).clamp(0, 1)))
                  .clamp(0.2, 1.0);
              return Container(
                margin: const EdgeInsets.only(left: 2),
                width: 4,
                height: 4,
                decoration: BoxDecoration(
                  color: T.inkMuted.withValues(alpha: v.toDouble()),
                  shape: BoxShape.circle,
                ),
              );
            },
          );
        }),
      ],
    );
  }
}

// ── Slide 2: Translate + Quiz demo ────────────────────────────────────────────

class _QuizSlide extends StatefulWidget {
  const _QuizSlide({required this.onNext});
  final VoidCallback onNext;
  @override
  State<_QuizSlide> createState() => _QuizSlideState();
}

class _QuizSlideState extends State<_QuizSlide> {
  int? _selected;
  static const _correct = 2;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Learn & grow.',
              style: Theme.of(context).textTheme.displaySmall),
          const SizedBox(height: 6),
          const Text(
            'Translate any passage, then quiz yourself to make it stick.',
            style: TextStyle(
              color: T.inkSoft,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w600,
              fontSize: 14,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          const _TranslateCard(),
          const SizedBox(height: 10),
          _QuizCard(
            selected: _selected,
            correct: _correct,
            onSelect: (i) => setState(() => _selected = i),
          ),
          const Spacer(),
          QuestButton(
            label: 'Join Translify',
            iconRight: Icons.bolt_rounded,
            color: T.sage,
            onPressed: widget.onNext,
            size: QuestButtonSize.large,
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

class _TranslateCard extends StatelessWidget {
  const _TranslateCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: T.paper,
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.paper3, width: 1.5),
        boxShadow: T.stickerShadow(y: 3),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _LangChip(flag: '🇸🇦', label: 'العربية', color: T.plum),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6),
                child: Icon(Icons.arrow_forward_rounded,
                    size: 13, color: T.inkMuted),
              ),
              _LangChip(flag: '🇬🇧', label: 'English', color: T.sageDeep),
              const Spacer(),
              const Icon(Icons.translate_rounded, size: 15, color: T.inkMuted),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            '"كانَ الحديقةُ تتنفَّسُ حياةً في كلِّ فجر"',
            style: TextStyle(
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: T.inkSoft,
              fontStyle: FontStyle.italic,
            ),
          ),
          const Divider(height: 14, color: T.paper3),
          const Text(
            '"The garden breathed life with every dawn."',
            style: TextStyle(
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: T.ink,
            ),
          ),
        ],
      ),
    );
  }
}

class _LangChip extends StatelessWidget {
  const _LangChip({required this.flag, required this.label, required this.color});
  final String flag;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.30), width: 1),
      ),
      child: Text(
        '$flag $label',
        style: TextStyle(
          fontFamily: 'Nunito',
          fontWeight: FontWeight.w800,
          fontSize: 11,
          color: color,
        ),
      ),
    );
  }
}

class _QuizCard extends StatelessWidget {
  const _QuizCard({
    required this.selected,
    required this.correct,
    required this.onSelect,
  });
  final int? selected;
  final int correct;
  final ValueChanged<int> onSelect;

  static const _options = ['Hope', 'Loss', 'Renewal', 'Mystery'];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: T.paper,
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.paper3, width: 1.5),
        boxShadow: T.stickerShadow(y: 3),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: T.saffron.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'QUICK QUIZ',
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 10,
                    color: T.saffronDeep,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'What does the garden symbolize?',
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: T.ink,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(_options.length, (i) {
              final isSelected = selected == i;
              final isCorrect = i == correct;
              Color bg = T.paper2;
              Color border = T.paper3;
              Color textColor = T.ink;
              if (isSelected) {
                if (isCorrect) {
                  bg = T.sage.withValues(alpha: 0.18);
                  border = T.sage;
                  textColor = T.sageDeep;
                } else {
                  bg = T.coral.withValues(alpha: 0.15);
                  border = T.coral;
                  textColor = T.coralDeep;
                }
              }
              return GestureDetector(
                onTap: () => onSelect(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: bg,
                    borderRadius: BorderRadius.circular(T.radiusPill),
                    border: Border.all(color: border, width: 1.5),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (isSelected && isCorrect)
                        const Padding(
                          padding: EdgeInsets.only(right: 4),
                          child:
                              Icon(Icons.check_circle_rounded, size: 13, color: T.sage),
                        ),
                      if (isSelected && !isCorrect)
                        const Padding(
                          padding: EdgeInsets.only(right: 4),
                          child: Icon(Icons.cancel_rounded, size: 13, color: T.coral),
                        ),
                      Text(
                        _options[i],
                        style: TextStyle(
                          fontFamily: 'Nunito',
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                          color: textColor,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
          if (selected == correct) ...[
            const SizedBox(height: 8),
            const Text(
              '🌟 Correct! +10 XP earned',
              style: TextStyle(
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w900,
                fontSize: 13,
                color: T.sageDeep,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Slide 3: Sign Up ─────────────────────────────────────────────────────────

class _SignUpSlide extends StatefulWidget {
  const _SignUpSlide({required this.onDone, required this.onLogin});
  final Future<void> Function() onDone;
  final VoidCallback onLogin;
  @override
  State<_SignUpSlide> createState() => _SignUpSlideState();
}

class _SignUpSlideState extends State<_SignUpSlide> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;
  bool _hidden = true;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (_busy) return;
    final email = _email.text.trim();
    final password = _password.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Email and password are required.');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      final name = _name.text.trim();
      await context.read<Session>().register(
            email,
            password,
            displayName: name.isEmpty ? null : name,
          );
      if (!mounted) return;
      await widget.onDone();
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _socialStub(String provider) {
    // TODO: wire up google_sign_in / sign_in_with_apple packages
    // with platform-specific configuration before shipping.
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$provider sign-in coming soon!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 4, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(child: LumiMascot(mood: LumiMood.cheer, size: 88)),
          const SizedBox(height: 10),
          Text('Make my shelf.',
              style: Theme.of(context).textTheme.displaySmall),
          const SizedBox(height: 4),
          const Text(
            'Join thousands of readers. Free to start.',
            style: TextStyle(
              color: T.inkSoft,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 18),
          _SocialButton(
            label: 'Continue with Google',
            icon: const _GoogleG(),
            onPressed: () => _socialStub('Google'),
          ),
          const SizedBox(height: 10),
          _SocialButton(
            label: 'Continue with Apple',
            icon: const Icon(Icons.apple_rounded, size: 22, color: T.ink),
            onPressed: () => _socialStub('Apple'),
          ),
          const SizedBox(height: 16),
          const _OrDivider(),
          const SizedBox(height: 16),
          QuestInput(
            controller: _name,
            label: 'NAME (optional)',
            hint: 'e.g. Maya',
            autofillHints: const [AutofillHints.givenName],
          ),
          const SizedBox(height: 12),
          QuestInput(
            controller: _email,
            label: 'EMAIL',
            hint: 'reader@translify.app',
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.newUsername],
          ),
          const SizedBox(height: 12),
          QuestInput(
            controller: _password,
            label: 'PASSWORD',
            hint: 'pick a strong one',
            obscure: _hidden,
            autofillHints: const [AutofillHints.newPassword],
            suffix: IconButton(
              icon: Icon(
                _hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                color: T.inkSoft,
              ),
              onPressed: () => setState(() => _hidden = !_hidden),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            _ErrorBanner(text: _error!),
          ],
          const SizedBox(height: 18),
          QuestButton(
            label: 'Create my account',
            iconRight: Icons.bolt_rounded,
            color: T.sage,
            loading: _busy,
            onPressed: _busy ? null : _register,
            size: QuestButtonSize.large,
          ),
          const SizedBox(height: 12),
          Center(
            child: TextButton(
              onPressed: widget.onLogin,
              child: const Text(
                'Already reading? Sign in →',
                style: TextStyle(
                  color: T.skyDeep,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton(
      {required this.label, required this.icon, required this.onPressed});
  final String label;
  final Widget icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
        decoration: BoxDecoration(
          color: T.paper,
          borderRadius: BorderRadius.circular(T.radiusPill),
          border: Border.all(color: T.ink, width: 2),
          boxShadow: T.stickerShadow(y: 4),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(width: 22, height: 22, child: icon),
            const SizedBox(width: 10),
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w800,
                fontSize: 15,
                color: T.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Google "G" drawn in code — four coloured arcs.
class _GoogleG extends StatelessWidget {
  const _GoogleG();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: _GooglePainter());
  }
}

class _GooglePainter extends CustomPainter {
  static const _blue = Color(0xFF4285F4);
  static const _red = Color(0xFFEA4335);
  static const _yellow = Color(0xFFFBBC05);
  static const _green = Color(0xFF34A853);

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width * 0.42;
    final stroke = size.width * 0.22;

    Paint arc(Color c) => Paint()
      ..color = c
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;

    final rect = Rect.fromCircle(center: Offset(cx, cy), radius: r);
    // Blue: right ~330° → 92° (approx -0.52 rad, span 1.55)
    canvas.drawArc(rect, -0.52, 1.57, false, arc(_blue));
    // Red: top ~230° → 330°
    canvas.drawArc(rect, -2.09, 1.57, false, arc(_red));
    // Yellow: bottom-left ~130° → 230°
    canvas.drawArc(rect, 0.96, 1.14, false, arc(_yellow));
    // Green: bottom ~92° → 130°
    canvas.drawArc(rect, 2.10, 0.52, false, arc(_green));

    // White cut through the blue arc (horizontal bar of the G)
    canvas.drawLine(
      Offset(cx, cy),
      Offset(cx + r + stroke * 0.5, cy),
      Paint()
        ..color = Colors.white
        ..strokeWidth = stroke * 0.9
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: T.paper3, thickness: 1.5)),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'or',
            style: TextStyle(
              color: T.inkMuted,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ),
        const Expanded(child: Divider(color: T.paper3, thickness: 1.5)),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: T.coral.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(T.radiusSm),
        border: Border.all(color: T.coralDeep, width: 1.4),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: T.coralDeep, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: T.coralDeep,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
