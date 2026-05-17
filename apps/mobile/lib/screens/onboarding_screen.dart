import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';
import '../widgets/quest_input.dart';

// ── Phase machine ─────────────────────────────────────────────────────────────

enum _Phase { bookPicker, trial, signup }

// ── Per-book display + content ────────────────────────────────────────────────

class _BookMeta {
  const _BookMeta({
    required this.gradStart,
    required this.gradEnd,
    required this.emoji,
    required this.excerpt,
    required this.highlightPassage,
    required this.chatPrompt,
  });
  final Color gradStart;
  final Color gradEnd;
  final String emoji;
  final String excerpt;
  final String highlightPassage;
  final String chatPrompt;
}

const _kMeta = <String, _BookMeta>{
  'pride-and-prejudice': _BookMeta(
    gradStart: Color(0xFF6B5B95), gradEnd: Color(0xFF3D2D5C), emoji: '💃',
    excerpt: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.',
    highlightPassage: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    chatPrompt: 'What does this opening line reveal about 19th-century social expectations?',
  ),
  'alice-in-wonderland': _BookMeta(
    gradStart: Color(0xFF94C48A), gradEnd: Color(0xFF3D6B44), emoji: '🐇',
    excerpt: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, and what is the use of a book without pictures or conversations?',
    highlightPassage: 'What is the use of a book, thought Alice, without pictures or conversations?',
    chatPrompt: 'What does Alice\'s curiosity tell us about the spirit of childhood and wonder?',
  ),
  'meditations': _BookMeta(
    gradStart: Color(0xFFE2786C), gradEnd: Color(0xFF9B3B2D), emoji: '🏛️',
    excerpt: 'Begin the morning by saying to thyself, I shall meet with the busy-body, the ungrateful, arrogant, deceitful, envious, unsocial. All these things happen to them by reason of their ignorance of what is good and evil.',
    highlightPassage: 'All these things happen to them by reason of their ignorance of what is good and evil.',
    chatPrompt: 'How can I apply Marcus Aurelius\'s morning mindset practice in my daily life?',
  ),
  'art-of-war': _BookMeta(
    gradStart: Color(0xFF4A3C1E), gradEnd: Color(0xFF1F1808), emoji: '⚔️',
    excerpt: 'The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.',
    highlightPassage: 'The art of war is of vital importance to the State. It is a matter of life and death.',
    chatPrompt: 'How does Sun Tzu\'s concept of strategy apply to modern business decisions?',
  ),
  'origin-of-species': _BookMeta(
    gradStart: Color(0xFF7BA17C), gradEnd: Color(0xFF3F5C40), emoji: '🐢',
    excerpt: 'When on board H.M.S. Beagle, as naturalist, I was much struck with certain facts in the distribution of the inhabitants of South America, and in the geological relations of the present to the past inhabitants of that continent.',
    highlightPassage: 'I was much struck with certain facts in the distribution of the inhabitants of South America.',
    chatPrompt: 'How did Darwin\'s Beagle voyage lead to his theory of natural selection?',
  ),
  'tao-te-ching': _BookMeta(
    gradStart: Color(0xFF5A8C5A), gradEnd: Color(0xFF2A4530), emoji: '☯️',
    excerpt: 'The Tao that can be told is not the eternal Tao. The name that can be named is not the eternal name. The nameless is the beginning of heaven and earth. The named is the mother of ten thousand things.',
    highlightPassage: 'The Tao that can be told is not the eternal Tao. The name that can be named is not the eternal name.',
    chatPrompt: 'What does Laozi mean when he says the Tao that can be told is not the eternal Tao?',
  ),
  'shakespeares-sonnets': _BookMeta(
    gradStart: Color(0xFFE0A450), gradEnd: Color(0xFF8E5C18), emoji: '🪶',
    excerpt: 'Shall I compare thee to a summer\'s day? Thou art more lovely and more temperate: Rough winds do shake the darling buds of May, and summer\'s lease hath all too short a date.',
    highlightPassage: 'Shall I compare thee to a summer\'s day? Thou art more lovely and more temperate.',
    chatPrompt: 'What makes Sonnet 18 one of the most celebrated love poems ever written?',
  ),
  'walden': _BookMeta(
    gradStart: Color(0xFF3D6B44), gradEnd: Color(0xFF1E3A24), emoji: '🌲',
    excerpt: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.',
    highlightPassage: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life.',
    chatPrompt: 'What did Thoreau mean by "living deliberately" and how does it apply today?',
  ),
};

_BookMeta _metaFor(String slug) => _kMeta[slug] ?? const _BookMeta(
  gradStart: Color(0xFF4A3C1E), gradEnd: Color(0xFF20283A), emoji: '📖',
  excerpt: 'A timeless classic awaits you. Open the pages and discover a world of ideas, stories, and wisdom that will stay with you long after you turn the final page.',
  highlightPassage: 'A timeless classic awaits.',
  chatPrompt: 'What can I learn from this book?',
);

// ── Root screen ───────────────────────────────────────────────────────────────

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  _Phase _phase = _Phase.bookPicker;
  Book? _book;
  String _slug = '';

  Future<void> _markDone() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_v1_done', true);
  }

  void _onBookChosen(Book book, String slug) {
    setState(() { _book = book; _slug = slug; _phase = _Phase.trial; });
  }

  void _onTrialComplete() => setState(() => _phase = _Phase.signup);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PaperBackground(
        child: SafeArea(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 380),
            transitionBuilder: (child, anim) => FadeTransition(
              opacity: anim,
              child: SlideTransition(
                position: Tween(begin: const Offset(0.04, 0), end: Offset.zero).animate(
                  CurvedAnimation(parent: anim, curve: Curves.easeOut),
                ),
                child: child,
              ),
            ),
            child: switch (_phase) {
              _Phase.bookPicker => _BookPickerPhase(
                  key: const ValueKey('picker'),
                  onChosen: _onBookChosen,
                ),
              _Phase.trial => _TrialPhase(
                  key: ValueKey('trial-${_book!.id}'),
                  book: _book!,
                  slug: _slug,
                  onComplete: _onTrialComplete,
                ),
              _Phase.signup => _SignupPhase(
                  key: const ValueKey('signup'),
                  slug: _slug,
                  onDone: () async {
                    final nav = Navigator.of(context);
                    await _markDone();
                    if (!mounted) return;
                    nav.pushReplacementNamed('/paywall');
                  },
                  onLogin: () => Navigator.of(context).pushReplacementNamed('/login'),
                ),
            },
          ),
        ),
      ),
    );
  }
}

// ── Phase 1: Book picker ──────────────────────────────────────────────────────

class _BookPickerPhase extends StatefulWidget {
  const _BookPickerPhase({super.key, required this.onChosen});
  final void Function(Book book, String slug) onChosen;
  @override
  State<_BookPickerPhase> createState() => _BookPickerPhaseState();
}

class _BookPickerPhaseState extends State<_BookPickerPhase> {
  List<Seed>? _seeds;
  String? _error;
  String? _cloningSlug;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final session = context.read<Session>();
    try {
      if (!session.isAnonymous && session.user == null) {
        await session.anonymousSignIn();
      }
      if (!mounted) return;
      final seeds = await session.onboarding.listSeeds();
      if (!mounted) return;
      setState(() => _seeds = seeds);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    }
  }

  Future<void> _pick(Seed seed) async {
    if (_cloningSlug != null) return;
    HapticFeedback.lightImpact();
    setState(() => _cloningSlug = seed.slug);
    try {
      final session = context.read<Session>();
      final book = await session.onboarding.cloneSeed(seed.slug);
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      widget.onChosen(book, seed.slug);
    } catch (e) {
      if (!mounted) return;
      setState(() => _cloningSlug = null);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(describeError(e))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 24),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const LumiMascot(mood: LumiMood.happy, size: 52),
              const SizedBox(height: 14),
              Text(
                'Pick a book\nto explore.',
                style: Theme.of(context).textTheme.displaySmall,
              ),
              const SizedBox(height: 6),
              const Text(
                'No sign-up yet. Just dive in — we\'ll save your progress at the end.',
                style: TextStyle(
                  color: T.inkSoft, fontFamily: 'Nunito',
                  fontWeight: FontWeight.w600, fontSize: 14, height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Expanded(child: _buildBody()),
      ],
    );
  }

  Widget _buildBody() {
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const LumiMascot(mood: LumiMood.thinking, size: 64),
              const SizedBox(height: 14),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: T.inkSoft, fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 14),
              ),
              const SizedBox(height: 16),
              QuestButton(label: 'Try again', onPressed: () { setState(() => _error = null); _init(); }),
            ],
          ),
        ),
      );
    }

    if (_seeds == null) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        children: List.generate(6, (i) => _SeedSkeleton(delay: i * 60)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      itemCount: _seeds!.length,
      itemBuilder: (_, i) {
        final seed = _seeds![i];
        final meta = _metaFor(seed.slug);
        final isLoading = _cloningSlug == seed.slug;
        return _SeedRow(
          seed: seed,
          meta: meta,
          isLoading: isLoading,
          disabled: _cloningSlug != null && !isLoading,
          onTap: () => _pick(seed),
        );
      },
    );
  }
}

class _SeedRow extends StatelessWidget {
  const _SeedRow({required this.seed, required this.meta, required this.isLoading, required this.disabled, required this.onTap});
  final Seed seed;
  final _BookMeta meta;
  final bool isLoading;
  final bool disabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: disabled || isLoading ? null : onTap,
        child: AnimatedOpacity(
          opacity: disabled ? 0.5 : 1.0,
          duration: const Duration(milliseconds: 200),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(T.radiusMd),
              border: Border.all(color: T.paper3, width: 1.5),
              boxShadow: T.stickerShadow(y: 4),
            ),
            child: Row(
              children: [
                // Mini cover
                Container(
                  width: 54, height: 74,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft, end: Alignment.bottomRight,
                      colors: [meta.gradStart, meta.gradEnd],
                    ),
                    boxShadow: [BoxShadow(color: meta.gradEnd.withValues(alpha: 0.4), blurRadius: 8, offset: const Offset(2, 4))],
                  ),
                  child: Center(
                    child: Text(meta.emoji, style: const TextStyle(fontSize: 24)),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        seed.title,
                        style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 15, color: T.ink),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        seed.author,
                        style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 13, color: T.inkSoft),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Chat · Quiz · AI Highlights',
                        style: TextStyle(
                          fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 11,
                          color: meta.gradStart,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color: T.saffron,
                    shape: BoxShape.circle,
                    border: Border.all(color: T.ink, width: 1.5),
                  ),
                  child: isLoading
                      ? const Padding(
                          padding: EdgeInsets.all(8),
                          child: CircularProgressIndicator(strokeWidth: 2, color: T.ink),
                        )
                      : const Icon(Icons.arrow_forward_rounded, size: 16, color: T.ink),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SeedSkeleton extends StatefulWidget {
  const _SeedSkeleton({required this.delay});
  final int delay;
  @override
  State<_SeedSkeleton> createState() => _SeedSkeletonState();
}

class _SeedSkeletonState extends State<_SeedSkeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _ac = AnimationController(
    vsync: this, duration: const Duration(milliseconds: 1200),
  )..repeat(reverse: true);

  @override
  void dispose() { _ac.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AnimatedBuilder(
        animation: _ac,
        builder: (_, child) => Opacity(opacity: 0.4 + 0.3 * _ac.value, child: child),
        child: Container(
          height: 98,
          decoration: BoxDecoration(
            color: T.paper2,
            borderRadius: BorderRadius.circular(T.radiusMd),
            border: Border.all(color: T.paper3, width: 1.5),
          ),
        ),
      ),
    );
  }
}

// ── Phase 2: Trial reader ─────────────────────────────────────────────────────

enum _Spotlight { chat, quiz, highlight }

class _TrialPhase extends StatefulWidget {
  const _TrialPhase({super.key, required this.book, required this.slug, required this.onComplete});
  final Book book;
  final String slug;
  final VoidCallback onComplete;
  @override
  State<_TrialPhase> createState() => _TrialPhaseState();
}

class _TrialPhaseState extends State<_TrialPhase> {
  _Spotlight _spotlight = _Spotlight.chat;

  void _advance() {
    HapticFeedback.selectionClick();
    setState(() {
      switch (_spotlight) {
        case _Spotlight.chat:     _spotlight = _Spotlight.quiz;      break;
        case _Spotlight.quiz:     _spotlight = _Spotlight.highlight; break;
        case _Spotlight.highlight: widget.onComplete();             break;
      }
    });
  }

  String get _stepLabel => switch (_spotlight) {
    _Spotlight.chat      => '1 of 3 · Chat',
    _Spotlight.quiz      => '2 of 3 · Quiz',
    _Spotlight.highlight => '3 of 3 · AI Highlights',
  };

  @override
  Widget build(BuildContext context) {
    final meta = _metaFor(widget.slug);
    return Column(
      children: [
        // ── Top bar ──────────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  widget.book.title,
                  style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 14, color: T.ink),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: T.saffron.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(99),
                  border: Border.all(color: T.saffron.withValues(alpha: 0.4)),
                ),
                child: Text(
                  _stepLabel,
                  style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 11, color: T.saffronDeep),
                ),
              ),
            ],
          ),
        ),
        // ── Book excerpt area ─────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(T.radiusMd),
              gradient: LinearGradient(
                begin: Alignment.topLeft, end: Alignment.bottomRight,
                colors: [meta.gradStart, meta.gradEnd],
              ),
              boxShadow: [BoxShadow(color: meta.gradEnd.withValues(alpha: 0.35), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: Row(
              children: [
                Text(meta.emoji, style: const TextStyle(fontSize: 28)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    meta.excerpt,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 12.5,
                      color: Colors.white70, height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        // ── Spotlight card ────────────────────────────────────────────────────
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 320),
              transitionBuilder: (child, anim) => SlideTransition(
                position: Tween(begin: const Offset(0, 0.12), end: Offset.zero)
                    .animate(CurvedAnimation(parent: anim, curve: Curves.easeOut)),
                child: FadeTransition(opacity: anim, child: child),
              ),
              child: switch (_spotlight) {
                _Spotlight.chat => _ChatSpotlight(
                    key: const ValueKey('chat'),
                    bookId: widget.book.id,
                    prompt: _metaFor(widget.slug).chatPrompt,
                    onNext: _advance,
                  ),
                _Spotlight.quiz => _QuizSpotlight(
                    key: const ValueKey('quiz'),
                    bookId: widget.book.id,
                    onNext: _advance,
                  ),
                _Spotlight.highlight => _HighlightSpotlight(
                    key: const ValueKey('hl'),
                    bookId: widget.book.id,
                    passage: _metaFor(widget.slug).highlightPassage,
                    onNext: _advance,
                  ),
              },
            ),
          ),
        ),
      ],
    );
  }
}

// ── Spotlight: Chat ───────────────────────────────────────────────────────────

class _ChatSpotlight extends StatefulWidget {
  const _ChatSpotlight({super.key, required this.bookId, required this.prompt, required this.onNext});
  final String bookId;
  final String prompt;
  final VoidCallback onNext;
  @override
  State<_ChatSpotlight> createState() => _ChatSpotlightState();
}

class _ChatSpotlightState extends State<_ChatSpotlight> {
  Chat? _chat;
  String? _reply;
  bool _loading = false;
  bool _sent = false;
  String? _error;

  Future<void> _send() async {
    if (_loading) return;
    HapticFeedback.lightImpact();
    setState(() { _loading = true; _sent = true; _error = null; });
    try {
      final session = context.read<Session>();
      _chat ??= await session.chats.create(widget.bookId);
      final res = await session.chats.send(_chat!.id, widget.prompt);
      if (!mounted) return;
      HapticFeedback.selectionClick();
      setState(() { _reply = res.assistant.content; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _loading = false; _sent = false; _error = describeError(e); });
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SpotlightCard(
      icon: Icons.chat_bubble_rounded,
      iconColor: T.sage,
      label: 'Chat with Lumi',
      hint: 'Ask anything about this book. Lumi has read every page.',
      child: Expanded(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (!_sent)
                      _QuestionChip(label: widget.prompt, onTap: _send),
                    if (_sent) ...[
                      _BubbleRow(isUser: true, text: widget.prompt),
                      const SizedBox(height: 8),
                      if (_loading)
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: _TypingIndicator(),
                        )
                      else if (_error != null)
                        _ErrorRow(error: _error!, onRetry: () { setState(() { _sent = false; _error = null; }); })
                      else if (_reply != null)
                        _BubbleRow(isUser: false, text: _reply!),
                    ],
                  ],
                ),
              ),
            ),
            if (_reply != null) ...[
              const SizedBox(height: 10),
              QuestButton(
                label: 'Next: Quiz yourself →',
                iconRight: Icons.arrow_forward_rounded,
                onPressed: widget.onNext,
                size: QuestButtonSize.large,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Spotlight: Quiz ───────────────────────────────────────────────────────────

class _QuizSpotlight extends StatefulWidget {
  const _QuizSpotlight({super.key, required this.bookId, required this.onNext});
  final String bookId;
  final VoidCallback onNext;
  @override
  State<_QuizSpotlight> createState() => _QuizSpotlightState();
}

class _QuizSpotlightState extends State<_QuizSpotlight> {
  Quiz? _quiz;
  bool _loading = true;
  String? _error;
  int _qi = 0;
  final List<AnswerResult> _results = [];
  int? _pending; // selected index awaiting grade
  bool _grading = false;
  AnswerResult? _grade;

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    try {
      final quiz = await context.read<Session>().quizzes.create(widget.bookId, questionCount: 3);
      if (!mounted) return;
      setState(() { _quiz = quiz; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = describeError(e); _loading = false; });
    }
  }

  Future<void> _answer(int idx) async {
    if (_grading || _grade != null) return;
    HapticFeedback.lightImpact();
    final q = _quiz!.questions[_qi];
    setState(() { _pending = idx; _grading = true; });
    try {
      final result = await context.read<Session>().quizzes.gradeOne(_quiz!.id, questionId: q.id, answerIndex: idx);
      if (!mounted) return;
      if (result.correct) HapticFeedback.heavyImpact();
      setState(() { _grade = result; _grading = false; _results.add(result); });
    } catch (e) {
      if (!mounted) return;
      setState(() { _grading = false; _pending = null; });
    }
  }

  void _next() {
    if (_qi < _quiz!.questions.length - 1) {
      setState(() { _qi++; _pending = null; _grade = null; });
    } else {
      widget.onNext();
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SpotlightCard(
      icon: Icons.quiz_rounded,
      iconColor: T.plum,
      label: 'Quick Quiz',
      hint: 'Generated from the book. See how much you got.',
      child: Expanded(
        child: _loading
            ? const Center(child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  LumiMascot(mood: LumiMood.thinking, size: 52),
                  SizedBox(height: 8),
                  Text('Generating quiz…', style: TextStyle(color: T.inkSoft, fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 13)),
                ],
              ))
            : _error != null
                ? _ErrorRow(error: _error!, onRetry: () { setState(() { _loading = true; _error = null; }); _loadQuiz(); })
                : SingleChildScrollView(child: _buildQuestion()),
      ),
    );
  }

  Widget _buildQuestion() {
    final q = _quiz!.questions[_qi];
    final isLast = _qi == _quiz!.questions.length - 1;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Progress dots
        Row(
          children: List.generate(_quiz!.questions.length, (i) {
            Color c;
            if (i < _results.length) {
              c = _results[i].correct ? T.sage : T.coral;
            } else if (i == _qi) {
              c = T.saffron;
            } else {
              c = T.paper3;
            }
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: i < _quiz!.questions.length - 1 ? 4 : 0),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 4,
                  decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(99)),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 12),
        Text(
          q.prompt,
          style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 14.5, color: T.ink, height: 1.4),
        ),
        const SizedBox(height: 12),
        ...List.generate(q.choices.length, (i) {
          final isSelected = _pending == i;
          final graded = _grade;
          Color bg = Colors.white;
          Color border = T.paper3;
          Color text = T.ink;
          if (graded != null) {
            if (i == graded.correctIndex) { bg = T.sage.withValues(alpha: 0.15); border = T.sage; text = T.sageDeep; }
            else if (i == graded.givenIndex && !graded.correct) { bg = T.coral.withValues(alpha: 0.12); border = T.coral; text = T.coralDeep; }
          } else if (isSelected && _grading) {
            bg = T.saffron.withValues(alpha: 0.15); border = T.saffron;
          }
          return Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: GestureDetector(
              onTap: graded == null && !_grading ? () => _answer(i) : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                decoration: BoxDecoration(
                  color: bg, borderRadius: BorderRadius.circular(T.radiusSm),
                  border: Border.all(color: border, width: 1.5),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(q.choices[i],
                        style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 13.5, color: text),
                      ),
                    ),
                    if (graded != null && i == graded.correctIndex)
                      const Icon(Icons.check_circle_rounded, size: 16, color: T.sage),
                    if (graded != null && i == graded.givenIndex && !graded.correct)
                      const Icon(Icons.cancel_rounded, size: 16, color: T.coral),
                  ],
                ),
              ),
            ),
          );
        }),
        if (_grade != null) ...[
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: _grade!.correct ? T.sage.withValues(alpha: 0.10) : T.coral.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(T.radiusSm),
            ),
            child: Text(
              _grade!.explanation,
              style: TextStyle(
                fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 12.5,
                color: _grade!.correct ? T.sageDeep : T.coralDeep, height: 1.4,
              ),
            ),
          ),
          const SizedBox(height: 10),
          QuestButton(
            label: isLast ? 'Next: AI Highlights →' : 'Next question →',
            iconRight: Icons.arrow_forward_rounded,
            color: _grade!.correct ? T.sage : T.saffron,
            onPressed: _next,
            size: QuestButtonSize.large,
          ),
        ],
      ],
    );
  }
}

// ── Spotlight: Highlight + AI ─────────────────────────────────────────────────

class _HighlightSpotlight extends StatefulWidget {
  const _HighlightSpotlight({super.key, required this.bookId, required this.passage, required this.onNext});
  final String bookId;
  final String passage;
  final VoidCallback onNext;
  @override
  State<_HighlightSpotlight> createState() => _HighlightSpotlightState();
}

class _HighlightSpotlightState extends State<_HighlightSpotlight> {
  bool _loading = false;
  String? _answer;
  String? _error;
  bool _tapped = false;

  Future<void> _ask() async {
    if (_loading) return;
    HapticFeedback.lightImpact();
    setState(() { _loading = true; _tapped = true; _error = null; });
    try {
      final session = context.read<Session>();
      final hl = await session.highlights.create(widget.bookId, page: 1, text: widget.passage);
      final updated = await session.highlights.askAi(hl.id);
      if (!mounted) return;
      HapticFeedback.selectionClick();
      setState(() { _answer = updated.aiAnswer ?? 'Lumi analyzed this passage.'; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _loading = false; _tapped = false; _error = describeError(e); });
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SpotlightCard(
      icon: Icons.auto_awesome_rounded,
      iconColor: T.saffronDeep,
      label: 'Ask AI about any passage',
      hint: 'Select any text and ask Lumi to explain, expand, or connect ideas.',
      child: Expanded(
        child: SingleChildScrollView(
          child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Highlighted passage
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: T.saffron.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(T.radiusSm),
                border: Border.all(color: T.saffron.withValues(alpha: 0.45), width: 1.5),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 3,
                    height: 36,
                    margin: const EdgeInsets.only(right: 10),
                    decoration: BoxDecoration(color: T.saffronDeep, borderRadius: BorderRadius.circular(2)),
                  ),
                  Expanded(
                    child: Text(
                      '"${widget.passage}"',
                      style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 13.5, color: T.ink, height: 1.5, fontStyle: FontStyle.italic),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            if (!_tapped)
              QuestButton(
                label: 'Ask Lumi about this passage',
                iconRight: Icons.auto_awesome_rounded,
                onPressed: _ask,
                size: QuestButtonSize.large,
              ),
            if (_tapped && _loading)
              const _TypingIndicator(),
            if (_error != null)
              _ErrorRow(error: _error!, onRetry: () { setState(() { _tapped = false; _error = null; }); }),
            if (_answer != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: T.paper,
                  borderRadius: BorderRadius.circular(T.radiusSm),
                  border: Border.all(color: T.paper3, width: 1.5),
                  boxShadow: T.stickerShadow(y: 2),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const LumiMascot(mood: LumiMood.happy, size: 28),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _answer!,
                        style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 13, color: T.ink, height: 1.5),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              QuestButton(
                label: 'Save my progress →',
                iconRight: Icons.bolt_rounded,
                color: T.sage,
                onPressed: widget.onNext,
                size: QuestButtonSize.large,
              ),
            ],
          ],
        ),
        ),
      ),
    );
  }
}

// ── Shared spotlight card shell ───────────────────────────────────────────────

class _SpotlightCard extends StatelessWidget {
  const _SpotlightCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.hint,
    required this.child,
  });
  final IconData icon;
  final Color iconColor;
  final String label;
  final String hint;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.paper3, width: 1.5),
        boxShadow: T.stickerShadow(y: 6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Card header
          Container(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
            decoration: const BoxDecoration(
              color: T.paper2,
              borderRadius: BorderRadius.vertical(top: Radius.circular(T.radiusMd - 1.5)),
              border: Border(bottom: BorderSide(color: T.paper3, width: 1)),
            ),
            child: Row(
              children: [
                Icon(icon, size: 16, color: iconColor),
                const SizedBox(width: 7),
                Text(label, style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 14, color: iconColor)),
                const Spacer(),
                const LumiMascot(mood: LumiMood.thinking, size: 30),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(hint, style: const TextStyle(color: T.inkMuted, fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 12.5)),
                  const SizedBox(height: 10),
                  child,
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared small widgets ──────────────────────────────────────────────────────

class _QuestionChip extends StatelessWidget {
  const _QuestionChip({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: T.paper,
          borderRadius: BorderRadius.circular(T.radiusPill),
          border: Border.all(color: T.saffron.withValues(alpha: 0.6), width: 1.5),
          boxShadow: T.stickerShadow(y: 3),
        ),
        child: Row(
          children: [
            const Icon(Icons.auto_awesome_rounded, size: 14, color: T.saffronDeep),
            const SizedBox(width: 7),
            Expanded(
              child: Text(label, style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 13, color: T.ink)),
            ),
            const Icon(Icons.send_rounded, size: 14, color: T.saffronDeep),
          ],
        ),
      ),
    );
  }
}

class _BubbleRow extends StatelessWidget {
  const _BubbleRow({required this.isUser, required this.text});
  final bool isUser;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 260),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isUser ? T.saffron : T.paper2,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(14),
            topRight: const Radius.circular(14),
            bottomLeft: Radius.circular(isUser ? 14 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 14),
          ),
          border: Border.all(color: isUser ? T.saffronDeep : T.paper3, width: 1.2),
        ),
        child: Text(
          text,
          style: TextStyle(fontFamily: 'Nunito', fontWeight: isUser ? FontWeight.w700 : FontWeight.w600, fontSize: 13, color: T.ink, height: 1.4),
        ),
      ),
    );
  }
}

class _TypingIndicator extends StatefulWidget {
  const _TypingIndicator();
  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator> with SingleTickerProviderStateMixin {
  late final AnimationController _ac = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();
  @override
  void dispose() { _ac.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const LumiMascot(mood: LumiMood.thinking, size: 24),
        const SizedBox(width: 6),
        ...List.generate(3, (i) => AnimatedBuilder(
          animation: _ac,
          builder: (_, child) {
            final v = (((_ac.value * 3) - i).clamp(0.0, 1.0) * (1 - (_ac.value * 3 - i - 0.5).clamp(0.0, 1.0))).clamp(0.25, 1.0);
            return Container(
              margin: const EdgeInsets.only(left: 3),
              width: 5, height: 5,
              decoration: BoxDecoration(color: T.inkMuted.withValues(alpha: v), shape: BoxShape.circle),
            );
          },
        )),
      ],
    );
  }
}

class _ErrorRow extends StatelessWidget {
  const _ErrorRow({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.error_outline_rounded, size: 15, color: T.coralDeep),
        const SizedBox(width: 6),
        Expanded(child: Text(error, style: const TextStyle(color: T.coralDeep, fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 12.5))),
        TextButton(
          onPressed: onRetry,
          style: TextButton.styleFrom(foregroundColor: T.saffronDeep, padding: const EdgeInsets.symmetric(horizontal: 8)),
          child: const Text('Retry', style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 13)),
        ),
      ],
    );
  }
}

// ── Phase 3: Signup gate ──────────────────────────────────────────────────────

class _SignupPhase extends StatefulWidget {
  const _SignupPhase({super.key, required this.slug, required this.onDone, required this.onLogin});
  final String slug;
  final Future<void> Function() onDone;
  final VoidCallback onLogin;
  @override
  State<_SignupPhase> createState() => _SignupPhaseState();
}

class _SignupPhaseState extends State<_SignupPhase> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _pass = TextEditingController();
  bool _busy = false;
  String? _error;
  bool _hidden = true;

  @override
  void dispose() { _name.dispose(); _email.dispose(); _pass.dispose(); super.dispose(); }

  Future<void> _register() async {
    if (_busy) return;
    final email = _email.text.trim();
    final password = _pass.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Email and password are required.');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      final name = _name.text.trim();
      await context.read<Session>().register(email, password, displayName: name.isEmpty ? null : name);
      if (!mounted) return;
      await widget.onDone();
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = describeError(e); _busy = false; });
    }
  }

  void _socialStub(String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$provider sign-in coming soon!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final meta = _metaFor(widget.slug);
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Book cover recap
          Center(
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 72, height: 96,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [meta.gradStart, meta.gradEnd]),
                    boxShadow: [BoxShadow(color: meta.gradEnd.withValues(alpha: 0.4), blurRadius: 14, offset: const Offset(0, 6))],
                  ),
                  child: Center(child: Text(meta.emoji, style: const TextStyle(fontSize: 30))),
                ),
                const Positioned(
                  right: -14,
                  bottom: -14,
                  child: LumiMascot(mood: LumiMood.cheer, size: 44),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Achievement recap
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: T.saffron.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(T.radiusSm),
              border: Border.all(color: T.saffron.withValues(alpha: 0.28), width: 1.2),
            ),
            child: Wrap(
              spacing: 14, runSpacing: 6,
              children: [
                _AchievBadge(icon: Icons.chat_bubble_rounded, label: 'Chatted with Lumi', color: T.sage),
                _AchievBadge(icon: Icons.quiz_rounded, label: 'Took a quiz', color: T.plum),
                _AchievBadge(icon: Icons.auto_awesome_rounded, label: 'AI highlight', color: T.saffronDeep),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text('Save your progress.', style: Theme.of(context).textTheme.displaySmall),
          const SizedBox(height: 4),
          const Text(
            'Create a free account — your session is saved and you can pick up exactly where you left off.',
            style: TextStyle(color: T.inkSoft, fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 14, height: 1.5),
          ),
          const SizedBox(height: 18),
          _SocialBtn(label: 'Continue with Google', icon: const _GoogleG(), onPressed: () => _socialStub('Google')),
          const SizedBox(height: 10),
          _SocialBtn(label: 'Continue with Apple', icon: const Icon(Icons.apple_rounded, size: 22, color: T.ink), onPressed: () => _socialStub('Apple')),
          const SizedBox(height: 16),
          _OrDivider(),
          const SizedBox(height: 16),
          QuestInput(controller: _name, label: 'NAME (optional)', hint: 'e.g. Maya', autofillHints: const [AutofillHints.givenName]),
          const SizedBox(height: 12),
          QuestInput(controller: _email, label: 'EMAIL', hint: 'reader@translify.app', keyboardType: TextInputType.emailAddress, autofillHints: const [AutofillHints.newUsername]),
          const SizedBox(height: 12),
          QuestInput(
            controller: _pass, label: 'PASSWORD', hint: 'pick a strong one',
            obscure: _hidden, autofillHints: const [AutofillHints.newPassword],
            suffix: IconButton(
              icon: Icon(_hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: T.inkSoft),
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
                style: TextStyle(color: T.skyDeep, fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 14, decoration: TextDecoration.underline),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AchievBadge extends StatelessWidget {
  const _AchievBadge({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 12, color: T.inkSoft)),
      ],
    );
  }
}

class _SocialBtn extends StatelessWidget {
  const _SocialBtn({required this.label, required this.icon, required this.onPressed});
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
          color: T.paper, borderRadius: BorderRadius.circular(T.radiusPill),
          border: Border.all(color: T.ink, width: 2), boxShadow: T.stickerShadow(y: 4),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(width: 22, height: 22, child: icon),
            const SizedBox(width: 10),
            Text(label, style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 15, color: T.ink)),
          ],
        ),
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: T.paper3, thickness: 1.5)),
        const Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('or', style: TextStyle(color: T.inkMuted, fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 13))),
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
        color: T.coral.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(T.radiusSm),
        border: Border.all(color: T.coralDeep, width: 1.4),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: T.coralDeep, size: 18),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(color: T.coralDeep, fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 13))),
        ],
      ),
    );
  }
}

// ── Google G painter ──────────────────────────────────────────────────────────

class _GoogleG extends StatelessWidget {
  const _GoogleG();
  @override
  Widget build(BuildContext context) => CustomPaint(painter: _GooglePainter());
}

class _GooglePainter extends CustomPainter {
  static const _blue = Color(0xFF4285F4);
  static const _red = Color(0xFFEA4335);
  static const _yellow = Color(0xFFFBBC05);
  static const _green = Color(0xFF34A853);

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2, cy = size.height / 2;
    final r = size.width * 0.42, stroke = size.width * 0.22;
    Paint arc(Color c) => Paint()..color = c..style = PaintingStyle.stroke..strokeWidth = stroke..strokeCap = StrokeCap.butt;
    final rect = Rect.fromCircle(center: Offset(cx, cy), radius: r);
    canvas.drawArc(rect, -0.52, 1.57, false, arc(_blue));
    canvas.drawArc(rect, -2.09, 1.57, false, arc(_red));
    canvas.drawArc(rect, 0.96, 1.14, false, arc(_yellow));
    canvas.drawArc(rect, 2.10, 0.52, false, arc(_green));
    canvas.drawLine(Offset(cx, cy), Offset(cx + r + stroke * 0.5, cy),
      Paint()..color = Colors.white..strokeWidth = stroke * 0.9..strokeCap = StrokeCap.round);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}
