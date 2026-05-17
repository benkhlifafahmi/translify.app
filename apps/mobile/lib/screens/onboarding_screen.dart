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

// ── Genre metadata for seed books ────────────────────────────────────────────

const _kSeedGenres = <String, List<String>>{
  'pride-and-prejudice': ['Fiction', 'Classic', 'Romance'],
  'alice-in-wonderland': ['Classic', 'Fiction', 'Fantasy'],
  'meditations': ['Philosophy', 'History', 'Self-help'],
  'art-of-war': ['History', 'Philosophy', 'Strategy'],
  'origin-of-species': ['Science', 'History', 'Nature'],
  'tao-te-ching': ['Philosophy', 'Spirituality'],
  'shakespeares-sonnets': ['Classic', 'Poetry'],
  'walden': ['Philosophy', 'Nature', 'Classic'],
};

const _kSeedGradients = <String, List<Color>>{
  'pride-and-prejudice': [Color(0xFF6B5B95), Color(0xFF3D2D5C)],
  'alice-in-wonderland': [Color(0xFF4A90D9), Color(0xFF235B8C)],
  'meditations': [Color(0xFF2D6A4F), Color(0xFF1B4332)],
  'art-of-war': [Color(0xFFB5451B), Color(0xFF7A2E0E)],
  'origin-of-species': [Color(0xFF2D6B7D), Color(0xFF1A4A5B)],
  'tao-te-ching': [Color(0xFF6B4226), Color(0xFF3D2314)],
  'shakespeares-sonnets': [Color(0xFF8B5E3C), Color(0xFF5C3D22)],
  'walden': [Color(0xFF3A6B3A), Color(0xFF1E3D1E)],
};

const _kSeedEmoji = <String, String>{
  'pride-and-prejudice': '💃',
  'alice-in-wonderland': '🐇',
  'meditations': '🏛',
  'art-of-war': '⚔️',
  'origin-of-species': '🦋',
  'tao-te-ching': '☯️',
  'shakespeares-sonnets': '🎭',
  'walden': '🌲',
};

const _kInterests = [
  'Fiction', 'Classic', 'History', 'Science',
  'Philosophy', 'Poetry', 'Fantasy', 'Nature',
];

// ── Screen ────────────────────────────────────────────────────────────────────

enum _Phase { intro, interests, books }

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  _Phase _phase = _Phase.intro;
  final Set<String> _interests = {};
  List<Seed> _seeds = [];
  bool _loadingSeeds = false;
  bool _cloning = false;

  void _nextPhase() {
    setState(() => _phase = _Phase.values[_phase.index + 1]);
    if (_phase == _Phase.books) _fetchSeeds();
  }

  Future<void> _fetchSeeds() async {
    if (_loadingSeeds || _seeds.isNotEmpty) return;
    setState(() => _loadingSeeds = true);
    try {
      final session = context.read<Session>();
      if (session.user == null) await session.anonymousSignIn();
      final seeds = await session.onboarding.listSeeds();
      if (!mounted) return;
      setState(() { _seeds = seeds; _loadingSeeds = false; });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingSeeds = false);
    }
  }

  Future<void> _pickBook(Seed seed) async {
    if (_cloning) return;
    HapticFeedback.lightImpact();
    setState(() => _cloning = true);
    try {
      final session = context.read<Session>();
      final String bookId;
      if (seed.cloneId != null) {
        bookId = seed.cloneId!;
      } else {
        final book = await session.onboarding.cloneSeed(seed.slug);
        bookId = book.id;
      }
      if (!mounted) return;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('onboarding_v1_done', true);
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed(
        '/book',
        arguments: {'id': bookId, 'tour': true},
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _cloning = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(describeError(e))),
      );
    }
  }

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
                position: Tween(
                  begin: const Offset(0.06, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOut)),
                child: child,
              ),
            ),
            child: switch (_phase) {
              _Phase.intro => _IntroPage(key: const ValueKey('intro'), onNext: _nextPhase),
              _Phase.interests => _InterestsPage(
                  key: const ValueKey('interests'),
                  selected: _interests,
                  onToggle: (g) => setState(() =>
                      _interests.contains(g) ? _interests.remove(g) : _interests.add(g)),
                  onNext: _nextPhase,
                ),
              _Phase.books => _BooksPage(
                  key: const ValueKey('books'),
                  seeds: _seeds,
                  interests: _interests,
                  loading: _loadingSeeds,
                  cloning: _cloning,
                  onPick: _pickBook,
                ),
            },
          ),
        ),
      ),
    );
  }
}

// ── Phase 1: Intro ────────────────────────────────────────────────────────────

class _IntroPage extends StatelessWidget {
  const _IntroPage({super.key, required this.onNext});
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(child: LumiMascot(mood: LumiMood.happy, size: 110)),
                const SizedBox(height: 24),
                const Text(
                  'Meet Lumi',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 34,
                    color: T.ink,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Your AI reading companion.\nI\'ve read every book in your library — ask me anything, anytime.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: T.inkSoft,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 32),
                const _FeaturePill(
                  icon: Icons.forum_rounded,
                  color: T.mint,
                  title: 'Chat',
                  body: 'Ask anything about any book',
                ),
                const SizedBox(height: 10),
                const _FeaturePill(
                  icon: Icons.auto_awesome_rounded,
                  color: T.saffron,
                  title: 'Highlight & Ask AI',
                  body: 'Select text — Lumi explains it',
                ),
                const SizedBox(height: 10),
                const _FeaturePill(
                  icon: Icons.bolt_rounded,
                  color: T.candy,
                  title: 'Quiz',
                  body: 'Test your understanding',
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
          child: QuestButton(
            label: "Let's explore →",
            iconRight: Icons.arrow_forward_rounded,
            onPressed: onNext,
            size: QuestButtonSize.large,
          ),
        ),
      ],
    );
  }
}

class _FeaturePill extends StatelessWidget {
  const _FeaturePill({
    required this.icon,
    required this.color,
    required this.title,
    required this.body,
  });
  final IconData icon;
  final Color color;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.paper3, width: 1.5),
        boxShadow: T.stickerShadow(y: 3),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                style: const TextStyle(
                  fontFamily: 'Nunito', fontWeight: FontWeight.w900,
                  fontSize: 14, color: T.ink,
                )),
              Text(body,
                style: const TextStyle(
                  fontFamily: 'Nunito', fontWeight: FontWeight.w600,
                  fontSize: 12.5, color: T.inkSoft,
                )),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Phase 2: Interests ────────────────────────────────────────────────────────

class _InterestsPage extends StatelessWidget {
  const _InterestsPage({
    super.key,
    required this.selected,
    required this.onToggle,
    required this.onNext,
  });
  final Set<String> selected;
  final ValueChanged<String> onToggle;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'What do you\nlove to read?',
                  style: TextStyle(
                    fontFamily: 'Nunito', fontWeight: FontWeight.w900,
                    fontSize: 30, color: T.ink, height: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Pick your interests — I\'ll find the perfect book for your tour.',
                  style: TextStyle(
                    fontFamily: 'Nunito', fontWeight: FontWeight.w600,
                    fontSize: 14, color: T.inkSoft, height: 1.5,
                  ),
                ),
                const SizedBox(height: 28),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: _kInterests.map((g) {
                    final active = selected.contains(g);
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        onToggle(g);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 160),
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                        decoration: BoxDecoration(
                          color: active ? T.ink : Colors.white,
                          borderRadius: BorderRadius.circular(T.radiusPill),
                          border: Border.all(color: T.ink, width: 1.5),
                          boxShadow: active ? null : T.stickerShadow(y: 2),
                        ),
                        child: Text(
                          g,
                          style: TextStyle(
                            fontFamily: 'Nunito',
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                            color: active ? Colors.white : T.ink,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
          child: QuestButton(
            label: selected.isEmpty ? 'Skip →' : 'Find my book →',
            iconRight: Icons.arrow_forward_rounded,
            onPressed: onNext,
            size: QuestButtonSize.large,
          ),
        ),
      ],
    );
  }
}

// ── Phase 3: Book picker ──────────────────────────────────────────────────────

class _BooksPage extends StatelessWidget {
  const _BooksPage({
    super.key,
    required this.seeds,
    required this.interests,
    required this.loading,
    required this.cloning,
    required this.onPick,
  });
  final List<Seed> seeds;
  final Set<String> interests;
  final bool loading;
  final bool cloning;
  final Future<void> Function(Seed) onPick;

  bool _matches(Seed s) {
    if (interests.isEmpty) return false;
    final genres = _kSeedGenres[s.slug] ?? [];
    return genres.any(interests.contains);
  }

  @override
  Widget build(BuildContext context) {
    final matched = seeds.where(_matches).toList();
    final rest = seeds.where((s) => !_matches(s)).toList();
    final ordered = [...matched, ...rest];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(24, 24, 24, 4),
          child: Text(
            'Pick a book to explore',
            style: TextStyle(
              fontFamily: 'Nunito', fontWeight: FontWeight.w900,
              fontSize: 26, color: T.ink,
            ),
          ),
        ),
        const Padding(
          padding: EdgeInsets.fromLTRB(24, 0, 24, 16),
          child: Text(
            'Lumi will guide you through it — chat, highlights, quiz.',
            style: TextStyle(
              fontFamily: 'Nunito', fontWeight: FontWeight.w600,
              fontSize: 13.5, color: T.inkSoft, height: 1.4,
            ),
          ),
        ),
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator(color: T.saffron))
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                  itemCount: ordered.isEmpty ? 0 : ordered.length,
                  separatorBuilder: (ctx2, i2) => const SizedBox(height: 10),
                  itemBuilder: (ctx, i) {
                    final seed = ordered[i];
                    final isMatch = matched.contains(seed);
                    return _SeedCard(
                      seed: seed,
                      isMatch: isMatch,
                      cloning: cloning,
                      onTap: () => onPick(seed),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _SeedCard extends StatelessWidget {
  const _SeedCard({
    required this.seed,
    required this.isMatch,
    required this.cloning,
    required this.onTap,
  });
  final Seed seed;
  final bool isMatch;
  final bool cloning;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = _kSeedGradients[seed.slug] ?? [T.saffron, T.ink];
    final emoji = _kSeedEmoji[seed.slug] ?? '📖';

    return GestureDetector(
      onTap: cloning ? null : onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(T.radiusMd),
          border: Border.all(
            color: isMatch ? T.ink : T.paper3,
            width: isMatch ? 2 : 1.5,
          ),
          boxShadow: T.stickerShadow(y: isMatch ? 5 : 3),
        ),
        child: Row(
          children: [
            // Gradient cover
            Container(
              width: 72,
              height: 88,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: colors,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(T.radiusMd - 1.5),
                  bottomLeft: Radius.circular(T.radiusMd - 1.5),
                ),
              ),
              child: Center(
                child: Text(emoji, style: const TextStyle(fontSize: 28)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isMatch)
                    Container(
                      margin: const EdgeInsets.only(bottom: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: T.saffron.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        '✨ Matches your interests',
                        style: TextStyle(
                          fontFamily: 'Nunito', fontWeight: FontWeight.w800,
                          fontSize: 10.5, color: T.saffronDeep,
                        ),
                      ),
                    ),
                  Text(
                    seed.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: 'Nunito', fontWeight: FontWeight.w900,
                      fontSize: 14, color: T.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    seed.author,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: 'Nunito', fontWeight: FontWeight.w600,
                      fontSize: 12, color: T.inkMuted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            if (cloning)
              const Padding(
                padding: EdgeInsets.only(right: 16),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: T.saffron),
                ),
              )
            else
              const Padding(
                padding: EdgeInsets.only(right: 16),
                child: Icon(Icons.arrow_forward_ios_rounded, size: 14, color: T.inkSoft),
              ),
          ],
        ),
      ),
    );
  }
}
