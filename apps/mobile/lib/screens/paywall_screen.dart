import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';

class PaywallScreen extends StatefulWidget {
  const PaywallScreen({super.key});
  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen>
    with SingleTickerProviderStateMixin {
  Plan _plan = Plan.reader;
  Cycle _cycle = Cycle.yearly;
  bool _busy = false;
  String? _error;

  late final AnimationController _celebrate = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 600),
  )..forward();

  @override
  void dispose() {
    _celebrate.dispose();
    super.dispose();
  }

  Future<void> _startTrial() async {
    if (_busy) return;
    setState(() { _busy = true; _error = null; });
    try {
      final url = await context.read<Session>().billing.checkoutUrl(
            plan: _plan,
            cycle: _cycle,
            applyFirstMonthDiscount: true,
          );
      if (!mounted) return;
      final uri = Uri.tryParse(url);
      if (uri == null) throw Exception('Invalid checkout URL');
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && mounted) _toast("Couldn't open the browser.");
      // Navigate to library after launching checkout — user returns via deep link
      // or manually after completing payment.
      if (mounted) Navigator.of(context).pushReplacementNamed('/library');
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _skip() => Navigator.of(context).pushReplacementNamed('/library');

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PaperBackground(
        glow: T.sage,
        child: SafeArea(
          child: Column(
            children: [
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(0, 10, 14, 0),
                  child: TextButton(
                    onPressed: _skip,
                    style: TextButton.styleFrom(
                      foregroundColor: T.inkMuted,
                      textStyle: const TextStyle(
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    child: const Text('Skip'),
                  ),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _Header(animation: _celebrate),
                      const SizedBox(height: 22),
                      const _FeatureList(),
                      const SizedBox(height: 20),
                      _PlanSelector(
                        plan: _plan,
                        cycle: _cycle,
                        onPlanChanged: (p) => setState(() => _plan = p),
                        onCycleChanged: (c) => setState(() => _cycle = c),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 14),
                        _ErrorBanner(text: _error!),
                      ],
                      const SizedBox(height: 20),
                      QuestButton(
                        label: 'Start 7-day free trial',
                        iconRight: Icons.bolt_rounded,
                        color: T.saffron,
                        loading: _busy,
                        onPressed: _busy ? null : _startTrial,
                        size: QuestButtonSize.large,
                      ),
                      const SizedBox(height: 10),
                      Center(
                        child: TextButton(
                          onPressed: _skip,
                          style: TextButton.styleFrom(
                            foregroundColor: T.inkMuted,
                          ),
                          child: const Text(
                            'Maybe later — use the free plan',
                            style: TextStyle(
                              fontFamily: 'Nunito',
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Cancel anytime before trial ends. No charge today.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: T.inkMuted,
                          fontFamily: 'Nunito',
                          fontWeight: FontWeight.w600,
                          fontSize: 11,
                        ),
                      ),
                    ],
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

// ── Hero header ───────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.animation});
  final Animation<double> animation;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ScaleTransition(
          scale: CurvedAnimation(
            parent: animation,
            curve: Curves.elasticOut,
          ),
          child: const LumiMascot(mood: LumiMood.cheer, size: 100),
        ),
        const SizedBox(height: 14),
        FadeTransition(
          opacity: animation,
          child: Column(
            children: [
              Text(
                "You're in!",
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .displaySmall
                    ?.copyWith(color: T.sageDeep),
              ),
              const SizedBox(height: 6),
              const Text(
                'Unlock everything with a 7-day free trial.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: T.inkSoft,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Feature list ──────────────────────────────────────────────────────────────

class _FeatureList extends StatelessWidget {
  const _FeatureList();

  static const _items = [
    (Icons.auto_awesome_rounded, T.saffron, 'AI Book Chat',
        "Ask Lumi anything about what you're reading"),
    (Icons.translate_rounded, T.sage, 'Full Translation',
        'Every word, every page — any language'),
    (Icons.quiz_rounded, T.coral, 'Smart Quizzes',
        'Spaced repetition that actually makes it stick'),
    (Icons.cloud_upload_rounded, T.plum, 'Unlimited Uploads',
        'All your EPUBs and PDFs, synced everywhere'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: T.paper,
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.paper3, width: 1.5),
        boxShadow: T.stickerShadow(y: 4),
      ),
      child: Column(
        children: [
          for (var i = 0; i < _items.length; i++) ...[
            if (i > 0)
              const Divider(height: 14, color: T.paper3, thickness: 1),
            _FeatureRow(
              icon: _items[i].$1,
              color: _items[i].$2,
              title: _items[i].$3,
              subtitle: _items[i].$4,
            ),
          ],
        ],
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  const _FeatureRow(
      {required this.icon,
      required this.color,
      required this.title,
      required this.subtitle});
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withValues(alpha: 0.35), width: 1.2),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: T.ink,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                  color: T.inkSoft,
                ),
              ),
            ],
          ),
        ),
        const Icon(Icons.check_circle_rounded, color: T.sage, size: 20),
      ],
    );
  }
}

// ── Plan selector ─────────────────────────────────────────────────────────────

class _PlanSelector extends StatelessWidget {
  const _PlanSelector({
    required this.plan,
    required this.cycle,
    required this.onPlanChanged,
    required this.onCycleChanged,
  });
  final Plan plan;
  final Cycle cycle;
  final ValueChanged<Plan> onPlanChanged;
  final ValueChanged<Cycle> onCycleChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Billing cycle toggle
        Row(
          children: [
            Expanded(
              child: _CycleChip(
                label: 'Monthly',
                selected: cycle == Cycle.monthly,
                onTap: () => onCycleChanged(Cycle.monthly),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _CycleChip(
                label: 'Yearly',
                badge: 'Save 40%',
                selected: cycle == Cycle.yearly,
                onTap: () => onCycleChanged(Cycle.yearly),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        _PlanCard(
          name: 'Reader',
          price: cycle == Cycle.monthly ? '\$9.99' : '\$5.99',
          description: 'Chat, translate & quiz — one reader.',
          selected: plan == Plan.reader,
          onTap: () => onPlanChanged(Plan.reader),
        ),
        const SizedBox(height: 8),
        _PlanCard(
          name: 'Scholar',
          price: cycle == Cycle.monthly ? '\$19.99' : '\$11.99',
          description: 'Everything + family sharing + priority AI.',
          selected: plan == Plan.scholar,
          badge: 'Popular',
          onTap: () => onPlanChanged(Plan.scholar),
        ),
      ],
    );
  }
}

class _CycleChip extends StatelessWidget {
  const _CycleChip(
      {required this.label,
      this.badge,
      required this.selected,
      required this.onTap});
  final String label;
  final String? badge;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? T.saffron.withValues(alpha: 0.14) : T.paper,
          borderRadius: BorderRadius.circular(T.radiusSm),
          border: Border.all(
            color: selected ? T.saffronDeep : T.paper3,
            width: selected ? 2 : 1.5,
          ),
        ),
        child: Column(
          children: [
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: selected ? T.saffronDeep : T.inkSoft,
              ),
            ),
            if (badge != null) ...[
              const SizedBox(height: 3),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: T.sage,
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(
                  badge!,
                  style: const TextStyle(
                    color: T.paper,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 9,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.name,
    required this.price,
    required this.description,
    required this.selected,
    required this.onTap,
    this.badge,
  });
  final String name;
  final String price;
  final String description;
  final bool selected;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? T.saffron.withValues(alpha: 0.09) : T.paper,
          borderRadius: BorderRadius.circular(T.radiusMd),
          border: Border.all(
            color: selected ? T.saffronDeep : T.paper3,
            width: selected ? 2 : 1.5,
          ),
          boxShadow: selected ? T.stickerShadow(y: 3) : null,
        ),
        child: Row(
          children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? T.saffron : T.paper2,
                border: Border.all(
                  color: selected ? T.saffronDeep : T.paper3,
                  width: 2,
                ),
              ),
              child: selected
                  ? const Icon(Icons.check_rounded, size: 13, color: T.ink)
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontFamily: 'Nunito',
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                          color: T.ink,
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: T.coral,
                            borderRadius: BorderRadius.circular(99),
                            border: Border.all(color: T.ink, width: 1),
                          ),
                          child: Text(
                            badge!,
                            style: const TextStyle(
                              color: T.paper,
                              fontFamily: 'Nunito',
                              fontWeight: FontWeight.w900,
                              fontSize: 9,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  Text(
                    description,
                    style: const TextStyle(
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                      color: T.inkSoft,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  price,
                  style: const TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    color: T.ink,
                  ),
                ),
                const Text(
                  '/mo',
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                    color: T.inkMuted,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Error banner ──────────────────────────────────────────────────────────────

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
