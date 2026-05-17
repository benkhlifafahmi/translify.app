import 'dart:math' as math;

import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../state/progress.dart';
import '../../state/session.dart';
import '../../theme/tokens.dart';
import '../../widgets/lumi_mascot.dart';
import '../../widgets/quest_button.dart';
import '../../widgets/sticker_card.dart';

class QuizPanel extends StatefulWidget {
  const QuizPanel({
    super.key,
    required this.bookId,
    this.translationId,
    this.onTourComplete,
    this.tourMode = false,
  });
  final String bookId;
  final String? translationId;
  final void Function(int score, int total)? onTourComplete;
  final bool tourMode;
  @override
  State<QuizPanel> createState() => _QuizPanelState();
}

class _QuizPanelState extends State<QuizPanel> {
  Quiz? _quiz;
  bool _generating = false;
  int _count = 8;
  // Per-question pick — keyed by question.id so submit is order-agnostic.
  final Map<String, int> _picks = {};
  QuizAttempt? _attempt;
  bool _submitting = false;
  late final ConfettiController _confetti =
      ConfettiController(duration: const Duration(seconds: 2));

  @override
  void initState() {
    super.initState();
    if (widget.tourMode) {
      _count = 3;
      WidgetsBinding.instance.addPostFrameCallback((_) => _generate());
    }
  }

  @override
  void dispose() {
    _confetti.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    setState(() {
      _generating = true;
      _quiz = null;
      _attempt = null;
      _picks.clear();
    });
    try {
      final q = await context.read<Session>().quizzes.create(
            widget.bookId,
            questionCount: _count,
            translationId: widget.translationId,
          );
      if (!mounted) return;
      setState(() => _quiz = q);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(describeError(e))));
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  Future<void> _finish() async {
    if (_quiz == null) return;
    setState(() => _submitting = true);
    try {
      final answers = _quiz!.questions
          .map((q) => (questionId: q.id, answerIndex: _picks[q.id] ?? -1))
          .toList();
      final session = context.read<Session>();
      final attempt = await session.quizzes.submit(_quiz!.id, answers);
      if (!mounted) return;
      setState(() => _attempt = attempt);
      widget.onTourComplete?.call(attempt.score, attempt.total);
      final pct = attempt.total == 0 ? 0.0 : attempt.score / attempt.total;
      final progress = context.read<Progress>();
      await progress.addXp(10 + attempt.score * 5);
      if (pct >= 0.9) {
        await progress.addXp(15, badge: 'sharpshooter');
        _confetti.play();
      } else if (pct < 0.5) {
        await progress.spendHeart();
      }
      // Feed the garden — server adds growth proportional to correctness and
      // bumps the quiz counter. Best-effort: a network failure here shouldn't
      // poison the result screen.
      try {
        await session.gardens.recordEvent(
          widget.bookId,
          GardenEventKind.quiz,
          payload: {'correct': attempt.score, 'total': attempt.total},
        );
      } catch (_) {}
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(describeError(e))));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_quiz == null) {
      return _StartScreen(
        count: _count,
        onCountChange: (c) => setState(() => _count = c),
        onStart: _generate,
        loading: _generating,
      );
    }
    if (_attempt != null) {
      return Stack(
        children: [
          _ResultScreen(
            attempt: _attempt!,
            quiz: _quiz!,
            onAgain: _generate,
          ),
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confetti,
              blastDirectionality: BlastDirectionality.explosive,
              shouldLoop: false,
              colors: const [
                T.saffron,
                T.coral,
                T.sage,
                T.plum,
              ],
              numberOfParticles: 28,
              gravity: 0.25,
              emissionFrequency: 0.04,
            ),
          ),
        ],
      );
    }
    return _PlayScreen(
      quiz: _quiz!,
      picks: _picks,
      onPicked: (qId, idx) => _picks[qId] = idx,
      onFinish: _finish,
      submitting: _submitting,
    );
  }
}

class _StartScreen extends StatelessWidget {
  const _StartScreen({
    required this.count,
    required this.onCountChange,
    required this.onStart,
    required this.loading,
  });

  final int count;
  final ValueChanged<int> onCountChange;
  final VoidCallback onStart;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
      children: [
        StickerCard(
          color: T.coral.withValues(alpha: 0.16),
          tilt: 0.012,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const LumiMascot(mood: LumiMood.cheer, size: 64),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Quiz time',
                            style: Theme.of(context).textTheme.headlineMedium),
                        const SizedBox(height: 2),
                        const Text(
                          'One card at a time — Lumi will react to each answer.',
                          style: TextStyle(
                            color: T.inkSoft,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Text(
                'HOW MANY QUESTIONS',
                style: TextStyle(
                  color: T.inkSoft,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                  letterSpacing: 1.4,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [5, 8, 12].map((c) {
                  final active = c == count;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: GestureDetector(
                        onTap: () => onCountChange(c),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: active ? T.coral : T.paper,
                            borderRadius: BorderRadius.circular(T.radiusMd),
                            border: Border.all(color: T.ink, width: 1.6),
                            boxShadow: T.stickerShadow(y: 3),
                          ),
                          child: Center(
                            child: Text(
                              '$c',
                              style: TextStyle(
                                color: active ? T.paper : T.ink,
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),
              QuestButton(
                label: 'Start the quiz',
                iconRight: Icons.play_arrow_rounded,
                color: T.coral,
                foreground: T.paper,
                size: QuestButtonSize.large,
                loading: loading,
                onPressed: loading ? null : onStart,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ────────────────────────── Card-by-card play ───────────────────────────

class _PlayScreen extends StatefulWidget {
  const _PlayScreen({
    required this.quiz,
    required this.picks,
    required this.onPicked,
    required this.onFinish,
    required this.submitting,
  });

  final Quiz quiz;
  final Map<String, int> picks;
  final void Function(String questionId, int choiceIndex) onPicked;
  final Future<void> Function() onFinish;
  final bool submitting;

  @override
  State<_PlayScreen> createState() => _PlayScreenState();
}

class _PlayScreenState extends State<_PlayScreen> {
  int _index = 0;
  // Cached per-question grade so Lumi's reaction sticks if the user goes back.
  final Map<int, AnswerResult> _grades = {};
  bool _grading = false;

  QuizQuestion get _q => widget.quiz.questions[_index];
  AnswerResult? get _grade => _grades[_index];
  bool get _isLast => _index == widget.quiz.questions.length - 1;

  Future<void> _pickChoice(int choiceIdx) async {
    if (_grade != null || _grading) return;
    setState(() {
      widget.picks[_q.id] = choiceIdx;
      _grading = true;
    });
    try {
      final r = await context.read<Session>().quizzes.gradeOne(
            widget.quiz.id,
            questionId: _q.id,
            answerIndex: choiceIdx,
          );
      if (!mounted) return;
      setState(() {
        _grades[_index] = r;
        _grading = false;
      });
      widget.onPicked(_q.id, choiceIdx);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        widget.picks.remove(_q.id);
        _grading = false;
      });
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(describeError(e))));
    }
  }

  Future<void> _next() async {
    if (_isLast) {
      await widget.onFinish();
      return;
    }
    setState(() => _index++);
  }

  @override
  Widget build(BuildContext context) {
    final total = widget.quiz.questions.length;
    return Column(
      children: [
        _ProgressDots(current: _index, total: total, grades: _grades),
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 320),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, anim) {
              return FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween(
                    begin: const Offset(0.18, 0),
                    end: Offset.zero,
                  ).animate(anim),
                  child: child,
                ),
              );
            },
            child: KeyedSubtree(
              key: ValueKey('q_$_index'),
              child: _grade == null
                  ? _QuestionCard(
                      index: _index + 1,
                      total: total,
                      question: _q,
                      pickedIndex: widget.picks[_q.id],
                      grading: _grading,
                      onPick: _pickChoice,
                    )
                  : _RevealCard(
                      index: _index + 1,
                      total: total,
                      question: _q,
                      grade: _grade!,
                    ),
            ),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: QuestButton(
              label: _grade == null
                  ? (_grading ? 'Lumi is checking…' : 'Pick an answer')
                  : (_isLast
                      ? (widget.submitting ? 'Tallying…' : 'See results')
                      : 'Next card'),
              iconRight: _grade == null
                  ? Icons.touch_app_rounded
                  : (_isLast
                      ? Icons.flag_rounded
                      : Icons.arrow_forward_rounded),
              color: _grade == null
                  ? T.paper3
                  : (_grade!.correct ? T.sage : T.coral),
              foreground: _grade == null ? T.inkSoft : T.paper,
              size: QuestButtonSize.large,
              loading: widget.submitting,
              onPressed:
                  _grade == null || widget.submitting ? null : _next,
            ),
          ),
        ),
      ],
    );
  }
}

// ───── Progress dots ─────

class _ProgressDots extends StatelessWidget {
  const _ProgressDots({
    required this.current,
    required this.total,
    required this.grades,
  });
  final int current;
  final int total;
  final Map<int, AnswerResult> grades;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(total, (i) {
          final g = grades[i];
          final color = g == null
              ? (i == current ? T.ink : T.paper3)
              : (g.correct ? T.sage : T.coral);
          final isCurrent = i == current;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              width: isCurrent ? 22 : 10,
              height: 10,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: T.ink.withValues(alpha: 0.5), width: 1),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ───── Question (unanswered) ─────

class _QuestionCard extends StatelessWidget {
  const _QuestionCard({
    required this.index,
    required this.total,
    required this.question,
    required this.pickedIndex,
    required this.grading,
    required this.onPick,
  });

  final int index;
  final int total;
  final QuizQuestion question;
  final int? pickedIndex;
  final bool grading;
  final ValueChanged<int> onPick;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 14),
      children: [
        StickerCard(
          tilt: index.isEven ? -0.006 : 0.006,
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: T.saffron,
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(color: T.ink, width: 1.2),
                    ),
                    child: Text(
                      '$index / $total',
                      style: const TextStyle(
                        color: T.ink,
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                question.prompt,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      height: 1.3,
                    ),
              ),
              const SizedBox(height: 18),
              ...List.generate(question.choices.length, (i) {
                return _Choice(
                  label: question.choices[i],
                  letter: String.fromCharCode(65 + i),
                  selected: pickedIndex == i,
                  disabled: grading,
                  onTap: () => onPick(i),
                );
              }),
            ],
          ),
        ),
      ],
    );
  }
}

class _Choice extends StatelessWidget {
  const _Choice({
    required this.label,
    required this.letter,
    required this.selected,
    required this.disabled,
    required this.onTap,
  });

  final String label;
  final String letter;
  final bool selected;
  final bool disabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    const base = T.saffron;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: disabled ? null : onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: selected ? base.withValues(alpha: 0.32) : T.paper,
            borderRadius: BorderRadius.circular(T.radiusMd),
            border: Border.all(
              color: selected ? base : T.ink.withValues(alpha: 0.35),
              width: 1.6,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: selected ? base : T.paper3,
                  shape: BoxShape.circle,
                  border: Border.all(color: T.ink, width: 1.2),
                ),
                alignment: Alignment.center,
                child: Text(
                  letter,
                  style: TextStyle(
                    color: selected ? T.paper : T.ink,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: T.ink,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    height: 1.4,
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

// ───── Reveal (answered) — BIG Lumi reaction ─────

class _RevealCard extends StatelessWidget {
  const _RevealCard({
    required this.index,
    required this.total,
    required this.question,
    required this.grade,
  });

  final int index;
  final int total;
  final QuizQuestion question;
  final AnswerResult grade;

  @override
  Widget build(BuildContext context) {
    final correct = grade.correct;
    final tone = correct ? T.sage : T.coral;
    final mood = correct ? LumiMood.cheer : LumiMood.sad;
    final kicker = correct ? 'NICE ONE' : 'NOT QUITE';
    final tagline = correct
        ? 'Lumi is doing a little wing-flap.'
        : 'Lumi flipped a page — here\'s why.';

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 14),
      children: [
        _BigLumiReaction(mood: mood, tone: tone, kicker: kicker, tagline: tagline),
        const SizedBox(height: 16),
        StickerCard(
          padding: const EdgeInsets.all(18),
          borderColor: tone,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                question.prompt,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      height: 1.35,
                    ),
              ),
              const SizedBox(height: 14),
              ...List.generate(question.choices.length, (i) {
                final isCorrect = i == grade.correctIndex;
                final isPicked = i == grade.givenIndex;
                return _RevealChoice(
                  letter: String.fromCharCode(65 + i),
                  label: question.choices[i],
                  isCorrect: isCorrect,
                  isPicked: isPicked,
                );
              }),
              if (grade.explanation.isNotEmpty) ...[
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: T.paper2,
                    borderRadius: BorderRadius.circular(T.radiusSm),
                    border: Border.all(color: T.paper3, width: 1),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(top: 2),
                        child: Icon(Icons.auto_stories_rounded,
                            size: 16, color: T.inkSoft),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          grade.explanation,
                          style: const TextStyle(
                            color: T.inkSoft,
                            fontWeight: FontWeight.w500,
                            height: 1.5,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

/// Huge animated Lumi reaction that drops in when an answer is revealed.
class _BigLumiReaction extends StatelessWidget {
  const _BigLumiReaction({
    required this.mood,
    required this.tone,
    required this.kicker,
    required this.tagline,
  });
  final LumiMood mood;
  final Color tone;
  final String kicker;
  final String tagline;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      curve: Curves.elasticOut,
      duration: const Duration(milliseconds: 900),
      builder: (context, v, child) {
        final scale = 0.4 + 0.6 * v.clamp(0, 1);
        final rotation = math.sin(v * math.pi * 2) * 0.06 * (1 - v);
        return Transform.scale(
          scale: scale,
          child: Transform.rotate(angle: rotation, child: child),
        );
      },
      child: StickerCard(
        color: tone.withValues(alpha: 0.18),
        borderColor: tone,
        tilt: -0.01,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
        child: Column(
          children: [
            LumiMascot(mood: mood, size: 180),
            const SizedBox(height: 4),
            Text(
              kicker,
              style: TextStyle(
                color: tone,
                fontWeight: FontWeight.w900,
                fontSize: 14,
                letterSpacing: 2.4,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              tagline,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: T.inkSoft,
                fontWeight: FontWeight.w600,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RevealChoice extends StatelessWidget {
  const _RevealChoice({
    required this.letter,
    required this.label,
    required this.isCorrect,
    required this.isPicked,
  });
  final String letter;
  final String label;
  final bool isCorrect;
  final bool isPicked;

  @override
  Widget build(BuildContext context) {
    Color border = T.ink.withValues(alpha: 0.18);
    Color bg = T.paper;
    Color chipBg = T.paper3;
    Color chipFg = T.ink;
    IconData? icon;
    Color iconColor = T.ink;

    if (isCorrect) {
      border = T.sage;
      bg = T.sage.withValues(alpha: 0.16);
      chipBg = T.sage;
      chipFg = T.paper;
      icon = Icons.check_rounded;
      iconColor = T.sageDeep;
    } else if (isPicked) {
      border = T.coral;
      bg = T.coral.withValues(alpha: 0.16);
      chipBg = T.coral;
      chipFg = T.paper;
      icon = Icons.close_rounded;
      iconColor = T.coralDeep;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(T.radiusMd),
          border: Border.all(color: border, width: 1.6),
        ),
        child: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: chipBg,
                shape: BoxShape.circle,
                border: Border.all(color: T.ink, width: 1.2),
              ),
              alignment: Alignment.center,
              child: Text(
                letter,
                style: TextStyle(
                  color: chipFg,
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: T.ink,
                  fontWeight: isCorrect || isPicked
                      ? FontWeight.w800
                      : FontWeight.w600,
                  fontSize: 15,
                  height: 1.4,
                ),
              ),
            ),
            if (icon != null) Icon(icon, color: iconColor, size: 22),
          ],
        ),
      ),
    );
  }
}

// ────────────────────────── Final result ───────────────────────────

class _ResultScreen extends StatelessWidget {
  const _ResultScreen({
    required this.attempt,
    required this.quiz,
    required this.onAgain,
  });
  final QuizAttempt attempt;
  final Quiz quiz;
  final VoidCallback onAgain;

  ({String kicker, String message, Color tone, LumiMood mood}) _flavor(
      double pct) {
    if (pct >= 0.9) {
      return (
        kicker: '★ Perfect aim',
        message: 'You absolutely nailed it.',
        tone: T.saffron,
        mood: LumiMood.cheer,
      );
    }
    if (pct >= 0.7) {
      return (
        kicker: 'Strong work',
        message: 'Smooth and steady — keep going.',
        tone: T.sage,
        mood: LumiMood.happy,
      );
    }
    if (pct >= 0.5) {
      return (
        kicker: 'Halfway there',
        message: 'Re-read the tricky bits and try again.',
        tone: T.plumSoft,
        mood: LumiMood.thinking,
      );
    }
    return (
      kicker: 'Keep going',
      message: 'Mistakes are part of the practice.',
      tone: T.coral,
      mood: LumiMood.sad,
    );
  }

  @override
  Widget build(BuildContext context) {
    final pct = attempt.total == 0 ? 0.0 : attempt.score / attempt.total;
    final f = _flavor(pct);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 28),
      children: [
        StickerCard(
          color: f.tone.withValues(alpha: 0.20),
          tilt: -0.012,
          padding: const EdgeInsets.all(22),
          child: Column(
            children: [
              LumiMascot(mood: f.mood, size: 120),
              const SizedBox(height: 8),
              Text(
                f.kicker,
                style: const TextStyle(
                  color: T.ink,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  letterSpacing: 2.0,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${attempt.score} / ${attempt.total}',
                style: Theme.of(context).textTheme.displayMedium,
              ),
              const SizedBox(height: 4),
              Text(
                f.message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: T.inkSoft,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              QuestButton(
                label: 'Play again',
                iconRight: Icons.replay_rounded,
                color: f.tone,
                onPressed: onAgain,
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ...attempt.results.asMap().entries.map((e) {
          final idx = e.key;
          final r = e.value;
          final q = quiz.questions[math.min(idx, quiz.questions.length - 1)];
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: StickerCard(
              padding: const EdgeInsets.all(14),
              borderColor: r.correct ? T.sageDeep : T.coralDeep,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: r.correct ? T.sage : T.coral,
                          shape: BoxShape.circle,
                          border: Border.all(color: T.ink, width: 1.2),
                        ),
                        alignment: Alignment.center,
                        child: Icon(
                          r.correct
                              ? Icons.check_rounded
                              : Icons.close_rounded,
                          size: 14,
                          color: T.ink,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          q.prompt,
                          style: const TextStyle(
                            color: T.ink,
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (r.explanation.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      r.explanation,
                      style: const TextStyle(
                        color: T.inkSoft,
                        fontWeight: FontWeight.w500,
                        height: 1.45,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
