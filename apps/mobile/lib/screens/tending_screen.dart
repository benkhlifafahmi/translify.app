import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/plant_stage.dart';
import '../widgets/quest_button.dart';
import '../widgets/sticker_card.dart';

/// Weekly tending rite — answer N questions in a row, then receive the
/// verdict (growth + vitality) and a per-question review.
class TendingScreen extends StatefulWidget {
  const TendingScreen({super.key, required this.garden});
  final Garden garden;

  @override
  State<TendingScreen> createState() => _TendingScreenState();
}

enum _Phase { loading, intro, asking, submitting, result }

class _TendingScreenState extends State<TendingScreen> {
  _Phase _phase = _Phase.loading;
  List<TendingQuestion>? _questions;
  String? _error;

  final Map<String, int> _answers = {}; // questionId → choiceIndex
  int _current = 0;
  TendingResult? _result;

  @override
  void initState() {
    super.initState();
    _loadPack();
  }

  Future<void> _loadPack() async {
    try {
      final qs = await context.read<Session>().gardens.getTending(
            widget.garden.bookId,
          );
      if (!mounted) return;
      setState(() {
        _questions = qs;
        _phase = _Phase.intro;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = _Phase.intro;
        _error = describeError(e);
      });
    }
  }

  void _begin() => setState(() => _phase = _Phase.asking);

  Future<void> _pick(int choiceIdx) async {
    final q = _questions![_current];
    setState(() => _answers[q.id] = choiceIdx);
    if (_current < _questions!.length - 1) {
      // tiny delay so the user sees their pick before the card slides.
      await Future<void>.delayed(const Duration(milliseconds: 220));
      if (!mounted) return;
      setState(() => _current++);
    } else {
      await _submit();
    }
  }

  Future<void> _submit() async {
    if (_questions == null) return;
    setState(() => _phase = _Phase.submitting);
    try {
      final answers = _questions!
          .map((q) => (questionId: q.id, choiceIndex: _answers[q.id] ?? -1))
          .toList();
      final r = await context.read<Session>().gardens.submitTending(
            widget.garden.bookId,
            answers,
          );
      if (!mounted) return;
      setState(() {
        _result = r;
        _phase = _Phase.result;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = _Phase.asking;
        _error = describeError(e);
      });
    }
  }

  void _goBack() {
    if (_current > 0) setState(() => _current--);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PaperBackground(
        child: SafeArea(
          child: Column(
            children: [
              _Header(onClose: () => Navigator.of(context).pop(_result)),
              Expanded(child: _buildBody()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_phase == _Phase.loading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            LumiMascot(mood: LumiMood.thinking, size: 110),
            SizedBox(height: 8),
            Text(
              'Preparing the questions…',
              style: TextStyle(color: T.inkSoft, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      );
    }
    if (_error != null && _questions == null) {
      return _IntroError(error: _error!, onRetry: () {
        setState(() {
          _phase = _Phase.loading;
          _error = null;
        });
        _loadPack();
      });
    }
    if (_phase == _Phase.intro) {
      return _IntroPanel(
        garden: widget.garden,
        count: _questions?.length ?? 0,
        onBegin: _begin,
      );
    }
    if (_phase == _Phase.result && _result != null) {
      return _ResultPanel(
        garden: widget.garden,
        questions: _questions!,
        result: _result!,
        onDone: () => Navigator.of(context).pop(_result),
      );
    }
    return _AskingPanel(
      garden: widget.garden,
      questions: _questions!,
      current: _current,
      answers: _answers,
      onPick: _pick,
      onBack: _goBack,
      submitting: _phase == _Phase.submitting,
    );
  }
}

// ───────────────────── Sub-panels ─────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.onClose});
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 14, 4),
      child: Row(
        children: [
          IconButton(
            onPressed: onClose,
            icon: const Icon(Icons.close_rounded, color: T.ink),
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
                  'WEEKLY TENDING',
                  style: TextStyle(
                    color: T.inkSoft.withValues(alpha: 0.9),
                    fontWeight: FontWeight.w800,
                    fontSize: 10,
                    letterSpacing: 2.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'The Rite',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _IntroPanel extends StatelessWidget {
  const _IntroPanel({
    required this.garden,
    required this.count,
    required this.onBegin,
  });
  final Garden garden;
  final int count;
  final VoidCallback onBegin;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      children: [
        PlantStage(
          species: garden.species,
          stage: garden.stage,
          farmer: garden.farmer,
          wilting: garden.vitality <= 1,
          caption: 'the rite begins',
          height: 280,
        ),
        const SizedBox(height: 18),
        Text(
          'Five questions stand between you and a thriving plant.',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'Drawn from chapters you have read since the last tending. '
          'Answer three or more correctly and the watering can fills; '
          'miss and ${_speciesShort(garden.species)} will begin to wilt.',
          style: const TextStyle(
            color: T.inkSoft,
            fontWeight: FontWeight.w500,
            height: 1.55,
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 18),
        Row(
          children: [
            _Stat(label: 'QUESTIONS', value: '$count'),
            _Stat(label: 'TIME', value: '~3 min', divider: true),
            _Stat(label: 'PASS', value: '3 / 5'),
          ],
        ),
        const SizedBox(height: 20),
        QuestButton(
          label: 'Begin the rite',
          iconRight: Icons.arrow_forward_rounded,
          color: T.ink,
          foreground: T.paper,
          size: QuestButtonSize.large,
          onPressed: onBegin,
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, this.divider = false});
  final String label;
  final String value;
  final bool divider;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
        decoration: divider
            ? BoxDecoration(
                border: Border(
                  left: BorderSide(
                      color: T.paper3.withValues(alpha: 0.6), width: 1),
                  right: BorderSide(
                      color: T.paper3.withValues(alpha: 0.6), width: 1),
                ),
              )
            : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: T.inkSoft,
                fontWeight: FontWeight.w800,
                fontSize: 10,
                letterSpacing: 1.4,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _AskingPanel extends StatelessWidget {
  const _AskingPanel({
    required this.garden,
    required this.questions,
    required this.current,
    required this.answers,
    required this.onPick,
    required this.onBack,
    required this.submitting,
  });
  final Garden garden;
  final List<TendingQuestion> questions;
  final int current;
  final Map<String, int> answers;
  final ValueChanged<int> onPick;
  final VoidCallback onBack;
  final bool submitting;

  @override
  Widget build(BuildContext context) {
    final q = questions[current];
    final picked = answers[q.id];
    final progress =
        (current + (picked != null ? 1 : 0)) / questions.length;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
          child: PlantStage(
            species: garden.species,
            stage: garden.stage,
            farmer: garden.farmer,
            wilting: garden.vitality <= 1,
            caption: submitting
                ? 'the verdict is being weighed…'
                : 'question ${current + 1} of ${questions.length}',
            height: 200,
          ),
        ),
        // progress bar
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 6),
          child: Row(
            children: [
              Text(
                '${current + 1} / ${questions.length}',
                style: const TextStyle(
                  color: T.inkSoft,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                  letterSpacing: 1.4,
                ),
              ),
              const Spacer(),
              Text(
                '${answers.length} answered',
                style: const TextStyle(
                  color: T.inkMuted,
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 6),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: progress.clamp(0, 1)),
              duration: const Duration(milliseconds: 400),
              builder: (context, v, _) {
                return LinearProgressIndicator(
                  value: v,
                  minHeight: 4,
                  backgroundColor: T.paper3,
                  valueColor: const AlwaysStoppedAnimation(T.ink),
                );
              },
            ),
          ),
        ),
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 280),
            transitionBuilder: (child, anim) => FadeTransition(
              opacity: anim,
              child: SlideTransition(
                position: Tween(
                  begin: const Offset(0.15, 0),
                  end: Offset.zero,
                ).animate(anim),
                child: child,
              ),
            ),
            child: KeyedSubtree(
              key: ValueKey('tq_$current'),
              child: _AskCard(
                index: current,
                question: q,
                picked: picked,
                disabled: submitting,
                onPick: onPick,
                onBack: current == 0 ? null : onBack,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AskCard extends StatelessWidget {
  const _AskCard({
    required this.index,
    required this.question,
    required this.picked,
    required this.disabled,
    required this.onPick,
    required this.onBack,
  });
  final int index;
  final TendingQuestion question;
  final int? picked;
  final bool disabled;
  final ValueChanged<int> onPick;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${_romanize(index)}.',
              style: const TextStyle(
                color: T.coralDeep,
                fontWeight: FontWeight.w700,
                fontSize: 22,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                question.prompt,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      height: 1.25,
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        ...List.generate(question.choices.length, (i) {
          final letter = String.fromCharCode(65 + i);
          final isPicked = picked == i;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GestureDetector(
              onTap: disabled ? null : () => onPick(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                decoration: BoxDecoration(
                  color: isPicked ? T.ink : T.paper,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(
                    color: isPicked ? T.ink : T.paper3,
                    width: 1.4,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isPicked
                              ? T.paper
                              : T.paper3,
                          width: 1.4,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        letter,
                        style: TextStyle(
                          color: isPicked ? T.paper : T.inkSoft,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        question.choices[i],
                        style: TextStyle(
                          color: isPicked ? T.paper : T.ink,
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
        }),
        if (onBack != null)
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: onBack,
              child: const Text(
                '← previous question',
                style: TextStyle(
                  color: T.inkSoft,
                  fontWeight: FontWeight.w500,
                  fontStyle: FontStyle.italic,
                  decoration: TextDecoration.underline,
                  decorationStyle: TextDecorationStyle.dashed,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ResultPanel extends StatelessWidget {
  const _ResultPanel({
    required this.garden,
    required this.questions,
    required this.result,
    required this.onDone,
  });
  final Garden garden;
  final List<TendingQuestion> questions;
  final TendingResult result;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final flavor = _pickFlavor(result);
    final color = result.passed ? T.sageDeep : T.coralDeep;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      children: [
        PlantStage(
          species: garden.species,
          stage: result.newStage,
          farmer: garden.farmer,
          wilting: !result.passed && garden.vitality + result.vitalityRestored <= 1,
          caption: result.passed ? 'watered, and growing' : 'thirsty, but standing',
          stamp: result.passed ? 'TENDED' : 'MISSED',
          stampWarn: !result.passed,
          height: 280,
        ),
        const SizedBox(height: 18),
        Text(
          'THE RITE · CONCLUDED',
          style: TextStyle(
            color: T.inkSoft,
            fontWeight: FontWeight.w800,
            fontSize: 11,
            letterSpacing: 2.0,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          flavor.headline,
          style: Theme.of(context).textTheme.displaySmall?.copyWith(
                color: color,
                fontStyle: FontStyle.italic,
              ),
        ),
        const SizedBox(height: 10),
        Text(
          flavor.body,
          style: const TextStyle(
            color: T.inkSoft,
            fontStyle: FontStyle.italic,
            fontSize: 15,
            height: 1.5,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${result.score}',
              style: Theme.of(context).textTheme.displayMedium,
            ),
            Text(
              '/${result.total}',
              style: const TextStyle(
                color: T.inkMuted,
                fontSize: 32,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 10),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: (result.passed ? T.sage : T.coral).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: color, width: 1),
              ),
              child: Text(
                result.passed ? 'PASSED' : 'BELOW THRESHOLD',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w800,
                  fontSize: 10,
                  letterSpacing: 1.4,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            _Stat(label: 'GROWTH', value: '+${result.growthGained}%'),
            _Stat(
              label: 'VITALITY',
              value: result.passed ? 'full' : '+${result.vitalityRestored}',
              divider: true,
            ),
            _Stat(label: 'NEXT RITE', value: 'in 7d'),
          ],
        ),
        const SizedBox(height: 18),
        StickerCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          color: T.paper2.withValues(alpha: 0.6),
          child: Theme(
            data: Theme.of(context)
                .copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(
                '※ Review the questions',
                style: TextStyle(
                  color: T.inkSoft,
                  fontStyle: FontStyle.italic,
                  fontWeight: FontWeight.w500,
                ),
              ),
              iconColor: T.inkSoft,
              children: questions.asMap().entries.map((e) {
                final idx = e.key;
                final q = e.value;
                final r = result.perQuestion.firstWhere(
                  (p) => p.id == q.id,
                  orElse: () => TendingPerQuestion(
                      id: q.id, correct: false, givenIndex: -1),
                );
                return _ReviewRow(index: idx, question: q, result: r);
              }).toList(),
            ),
          ),
        ),
        const SizedBox(height: 16),
        QuestButton(
          label: 'Return to the garden',
          iconRight: Icons.arrow_forward_rounded,
          color: T.ink,
          foreground: T.paper,
          size: QuestButtonSize.large,
          onPressed: onDone,
        ),
      ],
    );
  }
}

class _ReviewRow extends StatelessWidget {
  const _ReviewRow({
    required this.index,
    required this.question,
    required this.result,
  });
  final int index;
  final TendingQuestion question;
  final TendingPerQuestion result;

  @override
  Widget build(BuildContext context) {
    final correct = result.correct;
    final ai = result.correctIndex;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: T.paper3.withValues(alpha: 0.6),
            width: 1,
            style: BorderStyle.solid,
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: (correct ? T.sage : T.coral).withValues(alpha: 0.2),
            ),
            alignment: Alignment.center,
            child: Icon(
              correct ? Icons.check_rounded : Icons.close_rounded,
              size: 14,
              color: correct ? T.sageDeep : T.coralDeep,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      color: T.ink,
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                      height: 1.4,
                    ),
                    children: [
                      TextSpan(
                        text: '${_romanize(index)}. ',
                        style: const TextStyle(
                          fontStyle: FontStyle.italic,
                          color: T.inkMuted,
                        ),
                      ),
                      TextSpan(text: question.prompt),
                    ],
                  ),
                ),
                if (!correct && ai != null && ai >= 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Answer: ${question.choices[ai]}',
                      style: const TextStyle(
                        color: T.inkSoft,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                if (result.explanation != null && result.explanation!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      result.explanation!,
                      style: const TextStyle(
                        color: T.inkSoft,
                        fontStyle: FontStyle.italic,
                        fontSize: 12,
                        height: 1.5,
                      ),
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

class _IntroError extends StatelessWidget {
  const _IntroError({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: StickerCard(
          color: T.coral.withValues(alpha: 0.14),
          borderColor: T.coral,
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const LumiMascot(mood: LumiMood.sad, size: 100),
              const SizedBox(height: 8),
              Text(
                "Lumi couldn't fetch the rite",
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 6),
              Text(
                error,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: T.inkSoft,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              QuestButton(
                label: 'Try again',
                iconRight: Icons.refresh_rounded,
                color: T.coral,
                foreground: T.paper,
                onPressed: onRetry,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────── helpers ───────────────

String _romanize(int i) {
  const map = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  return i < map.length ? map[i] : '${i + 1}';
}

String _speciesShort(GardenSpecies s) => switch (s) {
      GardenSpecies.ficus => 'the fig',
      GardenSpecies.helianthus => 'the sunflower',
      GardenSpecies.lavandula => 'the lavender',
      GardenSpecies.monstera => 'the monstera',
    };

({String headline, String body}) _pickFlavor(TendingResult r) {
  if (r.score == r.total) {
    return (
      headline: 'A perfect tending.',
      body: 'Every stem accounted for. Your plant lifts toward the light.',
    );
  }
  if (r.passed && r.score >= 4) {
    return (
      headline: 'Cleanly done.',
      body:
          'The watering can is filled and the leaves are dark. One careful page or two will keep it this way.',
    );
  }
  if (r.passed) {
    return (
      headline: 'Just enough.',
      body:
          'The rite passes, but a few stems remember less than they should. A second reading would not be wasted.',
    );
  }
  return (
    headline: 'The plant goes thirsty.',
    body:
        'Not enough of the chapters held. Wilt will begin by the weekend — go back to the pages you missed.',
  );
}
