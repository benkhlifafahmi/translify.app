import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';
import '../widgets/quest_input.dart';

// Same constant as login_screen.dart — your Web Client ID from Google Cloud Console.
const _kGoogleWebClientId =
    '8606664851-4tqh3fogdbtgpg0qsmiv7irdok6n82vr.apps.googleusercontent.com';

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

  bool get _needsAuth {
    final s = context.read<Session>();
    return s.isAnonymous || s.phase != SessionPhase.signedIn;
  }

  Future<void> _startTrial() async {
    if (_busy) return;

    // Gate: require a real account before opening Stripe checkout.
    if (_needsAuth) {
      final authed = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => const _AuthSheet(),
      );
      if (authed != true || !mounted) return;
    }

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
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _Header(animation: _celebrate),
                      const SizedBox(height: 16),
                      const _FeatureList(),
                      const SizedBox(height: 16),
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
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 4),
                child: QuestButton(
                  label: 'Start 7-day free trial',
                  iconRight: Icons.bolt_rounded,
                  color: T.saffron,
                  loading: _busy,
                  onPressed: _busy ? null : _startTrial,
                  size: QuestButtonSize.large,
                ),
              ),
              TextButton(
                onPressed: _skip,
                style: TextButton.styleFrom(foregroundColor: T.inkMuted),
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
              const Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: Text(
                  'Cancel anytime before trial ends. No charge today.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: T.inkMuted,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
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

// ── Hero header — compact horizontal layout ───────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.animation});
  final Animation<double> animation;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        ScaleTransition(
          scale: CurvedAnimation(parent: animation, curve: Curves.elasticOut),
          child: const LumiMascot(mood: LumiMood.cheer, size: 80),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: FadeTransition(
            opacity: animation,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "You're in!",
                  style: Theme.of(context)
                      .textTheme
                      .headlineMedium
                      ?.copyWith(color: T.sageDeep, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Unlock everything with a 7-day free trial.',
                  style: TextStyle(
                    color: T.inkSoft,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w700,
                    fontSize: 13.5,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── Auth gate sheet ───────────────────────────────────────────────────────────

class _AuthSheet extends StatefulWidget {
  const _AuthSheet();
  @override
  State<_AuthSheet> createState() => _AuthSheetState();
}

class _AuthSheetState extends State<_AuthSheet> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;
  bool _showEmailForm = false;
  bool _isLogin = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _googleSignIn() async {
    setState(() { _busy = true; _error = null; });
    try {
      final googleSignIn = GoogleSignIn(serverClientId: _kGoogleWebClientId);
      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) { setState(() => _busy = false); return; }
      final auth = await googleUser.authentication;
      final idToken = auth.idToken;
      if (idToken == null) throw Exception('Could not get Google ID token.');
      if (!mounted) return;
      await context.read<Session>().loginWithGoogle(idToken);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = describeError(e); _busy = false; });
    }
  }

  Future<void> _emailSubmit() async {
    setState(() { _busy = true; _error = null; });
    try {
      final session = context.read<Session>();
      if (_isLogin) {
        await session.login(_email.text.trim(), _password.text);
      } else {
        await session.register(_email.text.trim(), _password.text);
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = describeError(e); _busy = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(24, 20, 24, 24 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: T.paper3,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
          Row(
            children: [
              const LumiMascot(mood: LumiMood.cheer, size: 36),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'One last step!',
                      style: TextStyle(
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w900,
                        fontSize: 17,
                        color: T.ink,
                      ),
                    ),
                    Text(
                      _showEmailForm
                          ? (_isLogin ? 'Sign in to continue.' : 'Create your free account.')
                          : 'Create an account to start your trial.',
                      style: const TextStyle(
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: T.inkSoft,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (!_showEmailForm) ...[
            // Google button
            _GoogleButton(onPressed: _busy ? null : _googleSignIn, loading: _busy),
            const SizedBox(height: 12),
            _OrDivider(),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _busy ? null : () => setState(() { _showEmailForm = true; _isLogin = false; }),
              style: OutlinedButton.styleFrom(
                foregroundColor: T.ink,
                side: const BorderSide(color: T.ink, width: 1.4),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(T.radiusMd)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text(
                'Create account with email',
                style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 14),
              ),
            ),
            const SizedBox(height: 10),
            Center(
              child: TextButton(
                onPressed: _busy ? null : () => setState(() { _showEmailForm = true; _isLogin = true; }),
                child: const Text(
                  'Already have an account? Sign in',
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: T.skyDeep,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ),
          ] else ...[
            QuestInput(
              controller: _email,
              label: 'EMAIL',
              hint: 'reader@translify.app',
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
            ),
            const SizedBox(height: 12),
            QuestInput(
              controller: _password,
              label: 'PASSWORD',
              hint: '••••••••',
              obscure: true,
              autofillHints: _isLogin
                  ? const [AutofillHints.password]
                  : const [AutofillHints.newPassword],
            ),
            const SizedBox(height: 16),
            QuestButton(
              label: _isLogin ? 'Sign in' : 'Create account',
              iconRight: Icons.arrow_forward_rounded,
              loading: _busy,
              onPressed: _busy ? null : _emailSubmit,
              size: QuestButtonSize.large,
            ),
            const SizedBox(height: 10),
            Center(
              child: TextButton(
                onPressed: () => setState(() => _showEmailForm = false),
                child: const Text(
                  '← Back',
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: T.inkSoft,
                  ),
                ),
              ),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 10),
            _ErrorBanner(text: _error!),
          ],
        ],
      ),
    );
  }
}

class _GoogleButton extends StatelessWidget {
  const _GoogleButton({this.onPressed, this.loading = false});
  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: T.ink,
          side: const BorderSide(color: T.ink, width: 1.4),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(T.radiusMd)),
        ),
        child: loading
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: T.ink))
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _GoogleLogo(),
                  SizedBox(width: 10),
                  Text(
                    'Continue with Google',
                    style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 15, color: T.ink),
                  ),
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
        const Expanded(child: Divider(color: T.paper3, thickness: 1.4)),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text('or', style: TextStyle(color: T.inkMuted, fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 12)),
        ),
        const Expanded(child: Divider(color: T.paper3, thickness: 1.4)),
      ],
    );
  }
}

// ── Reused from login_screen — Google logo painter ────────────────────────────

class _GoogleLogo extends StatelessWidget {
  const _GoogleLogo();
  @override
  Widget build(BuildContext context) {
    return SizedBox(width: 20, height: 20, child: CustomPaint(painter: _GoogleLogoPainter()));
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width / 2;
    Paint arc(Color c) => Paint()..color = c..strokeWidth = r * 0.36..style = PaintingStyle.stroke..strokeCap = StrokeCap.butt;
    canvas.drawArc(Rect.fromCircle(center: Offset(cx, cy), radius: r), -1.57, 1.57, false, arc(const Color(0xFF4285F4)));
    canvas.drawArc(Rect.fromCircle(center: Offset(cx, cy), radius: r), -3.14, 1.57, false, arc(const Color(0xFFEA4335)));
    canvas.drawArc(Rect.fromCircle(center: Offset(cx, cy), radius: r), 1.57, 0.79, false, arc(const Color(0xFFFBBC05)));
    canvas.drawArc(Rect.fromCircle(center: Offset(cx, cy), radius: r), 2.36, 0.78, false, arc(const Color(0xFF34A853)));
    canvas.drawLine(Offset(cx, cy), Offset(cx + r, cy),
        Paint()..color = Colors.white..strokeWidth = r * 0.36..strokeCap = StrokeCap.round..style = PaintingStyle.stroke);
  }
  @override
  bool shouldRepaint(_GoogleLogoPainter old) => false;
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
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: T.paper,
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.paper3, width: 1.5),
        boxShadow: T.stickerShadow(y: 4),
      ),
      child: Column(
        children: [
          for (var i = 0; i < _items.length; i++) ...[
            if (i > 0) const Divider(height: 12, color: T.paper3, thickness: 1),
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
  const _FeatureRow({required this.icon, required this.color, required this.title, required this.subtitle});
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(9),
            border: Border.all(color: color.withValues(alpha: 0.35), width: 1.2),
          ),
          child: Icon(icon, color: color, size: 16),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 13, color: T.ink)),
              Text(subtitle, style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 11, color: T.inkSoft)),
            ],
          ),
        ),
        const Icon(Icons.check_circle_rounded, color: T.sage, size: 18),
      ],
    );
  }
}

// ── Plan selector ─────────────────────────────────────────────────────────────

class _PlanSelector extends StatelessWidget {
  const _PlanSelector({required this.plan, required this.cycle, required this.onPlanChanged, required this.onCycleChanged});
  final Plan plan;
  final Cycle cycle;
  final ValueChanged<Plan> onPlanChanged;
  final ValueChanged<Cycle> onCycleChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: _CycleChip(label: 'Monthly', selected: cycle == Cycle.monthly, onTap: () => onCycleChanged(Cycle.monthly))),
            const SizedBox(width: 8),
            Expanded(child: _CycleChip(label: 'Yearly', badge: 'Save 40%', selected: cycle == Cycle.yearly, onTap: () => onCycleChanged(Cycle.yearly))),
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
  const _CycleChip({required this.label, this.badge, required this.selected, required this.onTap});
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
          border: Border.all(color: selected ? T.saffronDeep : T.paper3, width: selected ? 2 : 1.5),
        ),
        child: Column(
          children: [
            Text(label, textAlign: TextAlign.center,
                style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 13, color: selected ? T.saffronDeep : T.inkSoft)),
            if (badge != null) ...[
              const SizedBox(height: 3),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(color: T.sage, borderRadius: BorderRadius.circular(99)),
                child: Text(badge!, style: const TextStyle(color: T.paper, fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 9)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.name, required this.price, required this.description, required this.selected, required this.onTap, this.badge});
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
          border: Border.all(color: selected ? T.saffronDeep : T.paper3, width: selected ? 2 : 1.5),
          boxShadow: selected ? T.stickerShadow(y: 3) : null,
        ),
        child: Row(
          children: [
            Container(
              width: 22, height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? T.saffron : T.paper2,
                border: Border.all(color: selected ? T.saffronDeep : T.paper3, width: 2),
              ),
              child: selected ? const Icon(Icons.check_rounded, size: 13, color: T.ink) : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(name, style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 15, color: T.ink)),
                      if (badge != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: T.coral, borderRadius: BorderRadius.circular(99), border: Border.all(color: T.ink, width: 1)),
                          child: Text(badge!, style: const TextStyle(color: T.paper, fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 9)),
                        ),
                      ],
                    ],
                  ),
                  Text(description, style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 11, color: T.inkSoft)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(price, style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 16, color: T.ink)),
                const Text('/mo', style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w600, fontSize: 11, color: T.inkMuted)),
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
            child: Text(text, style: const TextStyle(color: T.coralDeep, fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
