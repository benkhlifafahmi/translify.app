import 'dart:math' as math;

import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../state/progress.dart';
import '../../state/session.dart';
import '../../theme/tokens.dart';
import '../../widgets/owl_mascot.dart';
import '../../widgets/quest_button.dart';
import '../../widgets/sticker_card.dart';

class QuizPanel extends StatefulWidget {
  const QuizPanel({super.key, required this.bookId, this.translationId});
  final String bookId;
  final String? translationId;
  @override
  State<QuizPanel> createState() => _QuizPanelState();
}

class _QuizPanelState extends State<QuizPanel> {
  Quiz? _quiz;
  bool _generating = false;
  int _count = 8;
  final Map<String, int> _answers = {};
  QuizAttempt? _attempt;
  bool _submitting = false;
  late final ConfettiController _confetti =
      ConfettiController(duration: const Duration(seconds: 2));

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
      _answers.clear();
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

  Future<void> _submit() async {
    if (_quiz == null) return;
    final all = _quiz!.questions.every((q) => _answers.containsKey(q.id));
    if (!all) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Pick an answer for every question first.'),
      ));
      return;
    }
    setState(() => _submitting = true);
    try {
      final answers = _quiz!.questions
          .map((q) => (questionId: q.id, answerIndex: _answers[q.id]!))
          .toList();
      final attempt =
          await context.read<Session>().quizzes.submit(_quiz!.id, answers);
      if (!mounted) return;
      setState(() => _attempt = attempt);
      final pct = attempt.total == 0
          ? 0.0
          : attempt.score / attempt.total;
      final progress = context.read<Progress>();
      await progress.addXp(10 + attempt.score * 5);
      if (pct >= 0.9) {
        await progress.addXp(15, badge: 'sharpshooter');
        _confetti.play();
      } else if (pct < 0.5) {
        await progress.spendHeart();
      }
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
                T.candy,
                T.mint,
                T.sky,
                T.violet,
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
      answers: _answers,
      onPick: (qId, idx) => setState(() => _answers[qId] = idx),
      submitting: _submitting,
      onSubmit: _submit,
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
          color: T.candy.withValues(alpha: 0.18),
          tilt: 0.012,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const OwlMascot(mood: OwlMood.cheer, size: 64),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Quiz time!',
                            style: Theme.of(context).textTheme.headlineMedium),
                        const SizedBox(height: 2),
                        const Text(
                          'Earn ⭐ XP for every correct answer.',
                          style: TextStyle(
                            color: T.inkSoft,
                            fontFamily: 'Nunito',
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Text(
                'HOW MANY QUESTIONS?',
                style: TextStyle(
                  color: T.inkSoft,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w900,
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
                            color: active ? T.candy : T.paper,
                            borderRadius: BorderRadius.circular(T.radiusMd),
                            border: Border.all(color: T.ink, width: 2),
                            boxShadow: T.stickerShadow(y: 3),
                          ),
                          child: Center(
                            child: Text(
                              '$c',
                              style: TextStyle(
                                color: active ? T.paper : T.ink,
                                fontFamily: 'LilitaOne',
                                fontSize: 22,
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
                color: T.candy,
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

class _PlayScreen extends StatelessWidget {
  const _PlayScreen({
    required this.quiz,
    required this.answers,
    required this.onPick,
    required this.submitting,
    required this.onSubmit,
  });

  final Quiz quiz;
  final Map<String, int> answers;
  final void Function(String qId, int idx) onPick;
  final bool submitting;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final answered = answers.length;
    final total = quiz.questions.length;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 6, 20, 4),
          child: Container(
            height: 12,
            decoration: BoxDecoration(
              color: T.paper3,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: T.ink, width: 1.4),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: total == 0 ? 0 : answered / total),
                duration: const Duration(milliseconds: 360),
                builder: (context, v, _) => Align(
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(
                    widthFactor: v,
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(colors: [T.saffron, T.candy]),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
            itemCount: quiz.questions.length,
            itemBuilder: (context, i) {
              final q = quiz.questions[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: _QuestionCard(
                  index: i + 1,
                  question: q,
                  selected: answers[q.id],
                  onPick: (idx) => onPick(q.id, idx),
                ),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
          child: SafeArea(
            top: false,
            child: QuestButton(
              label: submitting ? 'Tallying…' : 'Submit answers',
              iconRight: Icons.check_circle_rounded,
              color: T.mint,
              size: QuestButtonSize.large,
              loading: submitting,
              onPressed: submitting ? null : onSubmit,
            ),
          ),
        ),
      ],
    );
  }
}

class _QuestionCard extends StatelessWidget {
  const _QuestionCard({
    required this.index,
    required this.question,
    required this.selected,
    required this.onPick,
  });

  final int index;
  final QuizQuestion question;
  final int? selected;
  final ValueChanged<int> onPick;

  @override
  Widget build(BuildContext context) {
    return StickerCard(
      tilt: index.isEven ? -0.005 : 0.005,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: const BoxDecoration(
                    color: T.saffron, shape: BoxShape.circle),
                alignment: Alignment.center,
                child: Text(
                  '$index',
                  style: const TextStyle(
                    color: T.ink,
                    fontFamily: 'LilitaOne',
                    fontSize: 16,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  question.prompt,
                  style: const TextStyle(
                    color: T.ink,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    height: 1.35,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...List.generate(
            question.choices.length,
            (i) => _Choice(
              label: question.choices[i],
              letter: String.fromCharCode(65 + i),
              selected: selected == i,
              onTap: () => onPick(i),
            ),
          ),
        ],
      ),
    );
  }
}

class _Choice extends StatelessWidget {
  const _Choice({
    required this.label,
    required this.letter,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final String letter;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: selected ? T.saffron.withValues(alpha: 0.30) : T.paper,
            borderRadius: BorderRadius.circular(T.radiusSm),
            border: Border.all(
              color: selected ? T.saffronDeep : T.ink.withValues(alpha: 0.4),
              width: 1.6,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: selected ? T.saffronDeep : T.paper3,
                  shape: BoxShape.circle,
                  border: Border.all(color: T.ink, width: 1.2),
                ),
                alignment: Alignment.center,
                child: Text(
                  letter,
                  style: TextStyle(
                    color: selected ? T.paper : T.ink,
                    fontFamily: 'LilitaOne',
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
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
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

class _ResultScreen extends StatelessWidget {
  const _ResultScreen({
    required this.attempt,
    required this.quiz,
    required this.onAgain,
  });
  final QuizAttempt attempt;
  final Quiz quiz;
  final VoidCallback onAgain;

  ({String kicker, String message, Color tone, OwlMood mood}) _flavor(double pct) {
    if (pct >= 0.9) {
      return (
        kicker: '★ Perfect aim',
        message: 'You absolutely nailed it.',
        tone: T.saffron,
        mood: OwlMood.cheer,
      );
    }
    if (pct >= 0.7) {
      return (
        kicker: 'Strong work',
        message: 'Smooth and steady — keep going.',
        tone: T.mint,
        mood: OwlMood.happy,
      );
    }
    if (pct >= 0.5) {
      return (
        kicker: 'Halfway there',
        message: 'Re-read the tricky bits and try again.',
        tone: T.sky,
        mood: OwlMood.thinking,
      );
    }
    return (
      kicker: 'Keep going',
      message: "Mistakes are part of the quest.",
      tone: T.candy,
      mood: OwlMood.sad,
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
              OwlMascot(mood: f.mood, size: 110),
              const SizedBox(height: 8),
              Text(
                f.kicker,
                style: TextStyle(
                  color: T.ink,
                  fontFamily: 'LilitaOne',
                  fontSize: 14,
                  letterSpacing: 1.6,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${attempt.score} / ${attempt.total}',
                style: const TextStyle(
                  color: T.ink,
                  fontFamily: 'LilitaOne',
                  fontSize: 56,
                  height: 1.0,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                f.message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: T.inkSoft,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w800,
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
              borderColor: r.correct ? T.mintDeep : T.candyDeep,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: r.correct ? T.mint : T.candy,
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
                            fontFamily: 'Nunito',
                            fontWeight: FontWeight.w900,
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
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w700,
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
