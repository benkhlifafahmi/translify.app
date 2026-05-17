import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';
import '../widgets/quest_input.dart';

// TODO: Replace with your Web Client ID from Google Cloud Console.
// APIs & Services → Credentials → your "Web application" OAuth client.
const _kGoogleWebClientId =
    '8606664851-4tqh3fogdbtgpg0qsmiv7irdok6n82vr.apps.googleusercontent.com';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;
  bool _hidden = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    setState(() { _busy = true; _error = null; });
    try {
      await context.read<Session>().login(_email.text.trim(), _password.text);
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed('/library');
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _signInWithGoogle() async {
    if (_busy) return;
    setState(() { _busy = true; _error = null; });
    try {
      final googleSignIn = GoogleSignIn(serverClientId: _kGoogleWebClientId);
      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        // User cancelled the picker.
        setState(() => _busy = false);
        return;
      }
      final auth = await googleUser.authentication;
      final idToken = auth.idToken;
      if (idToken == null) throw Exception('Could not get Google ID token.');
      if (!mounted) return;
      await context.read<Session>().loginWithGoogle(idToken);
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed('/library');
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PaperBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      const LumiMascot(mood: LumiMood.happy, size: 132),
                      Positioned(
                        right: -32,
                        top: -8,
                        child: Transform.rotate(
                          angle: 0.18,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: T.candy,
                              borderRadius: BorderRadius.circular(99),
                              border: Border.all(color: T.ink, width: 1.6),
                              boxShadow: T.stickerShadow(y: 2),
                            ),
                            child: const Text(
                              'hoot!',
                              style: TextStyle(
                                color: T.paper,
                                fontWeight: FontWeight.w900,
                                fontSize: 12,
                                fontFamily: 'Nunito',
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text('Welcome back,',
                    style: Theme.of(context).textTheme.displaySmall),
                Text('reader.',
                    style: Theme.of(context)
                        .textTheme
                        .displaySmall
                        ?.copyWith(color: T.candyDeep)),
                const SizedBox(height: 6),
                const Text(
                  "Pick up where you left off — and don't break that streak.",
                  style: TextStyle(
                    color: T.inkSoft,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 26),
                // Google Sign-In button
                _SocialButton(
                  onPressed: _busy ? null : _signInWithGoogle,
                  loading: _busy,
                  label: 'Continue with Google',
                  logo: _GoogleLogo(),
                ),
                const SizedBox(height: 20),
                const _Divider(),
                const SizedBox(height: 20),
                QuestInput(
                  controller: _email,
                  label: 'EMAIL',
                  hint: 'reader@translify.app',
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                ),
                const SizedBox(height: 14),
                QuestInput(
                  controller: _password,
                  label: 'PASSWORD',
                  hint: '••••••••',
                  obscure: _hidden,
                  autofillHints: const [AutofillHints.password],
                  suffix: IconButton(
                    icon: Icon(
                      _hidden ? Icons.visibility : Icons.visibility_off,
                      color: T.inkSoft,
                    ),
                    onPressed: () => setState(() => _hidden = !_hidden),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 14),
                  _ErrorBanner(text: _error!),
                ],
                const SizedBox(height: 22),
                QuestButton(
                  label: 'Start reading',
                  iconRight: Icons.arrow_forward_rounded,
                  loading: _busy,
                  onPressed: _busy ? null : _submit,
                  size: QuestButtonSize.large,
                ),
                const SizedBox(height: 18),
                Center(
                  child: TextButton(
                    onPressed: () =>
                        Navigator.of(context).pushNamed('/register'),
                    child: const Text(
                      "First time? Make my shelf →",
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
          ),
        ),
      ),
    );
  }
}

// ── Social sign-in button ─────────────────────────────────────────────────────

class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.label,
    required this.logo,
    this.onPressed,
    this.loading = false,
  });
  final String label;
  final Widget logo;
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
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(T.radiusMd),
          ),
          elevation: 0,
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: T.ink),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  logo,
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

class _GoogleLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width / 2;

    // Blue arc (top-right)
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      -1.57, 1.57, false,
      Paint()..color = const Color(0xFF4285F4)..strokeWidth = r * 0.36..style = PaintingStyle.stroke..strokeCap = StrokeCap.butt,
    );
    // Red arc (top-left)
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      -3.14, 1.57, false,
      Paint()..color = const Color(0xFFEA4335)..strokeWidth = r * 0.36..style = PaintingStyle.stroke..strokeCap = StrokeCap.butt,
    );
    // Yellow arc (bottom-left)
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      1.57, 0.79, false,
      Paint()..color = const Color(0xFFFBBC05)..strokeWidth = r * 0.36..style = PaintingStyle.stroke..strokeCap = StrokeCap.butt,
    );
    // Green arc (bottom-right)
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      2.36, 0.78, false,
      Paint()..color = const Color(0xFF34A853)..strokeWidth = r * 0.36..style = PaintingStyle.stroke..strokeCap = StrokeCap.butt,
    );

    // White "G" cutout horizontal bar
    final barPaint = Paint()..color = Colors.white..strokeWidth = r * 0.36..strokeCap = StrokeCap.round..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(cx, cy), Offset(cx + r, cy), barPaint);
  }

  @override
  bool shouldRepaint(_GoogleLogoPainter old) => false;
}

class _Divider extends StatelessWidget {
  const _Divider();
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: T.paper3, thickness: 1.4)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'or sign in with email',
            style: const TextStyle(
              color: T.inkMuted,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ),
        const Expanded(child: Divider(color: T.paper3, thickness: 1.4)),
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
        color: T.candy.withValues(alpha: 0.20),
        borderRadius: BorderRadius.circular(T.radiusSm),
        border: Border.all(color: T.candyDeep, width: 1.4),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: T.candyDeep, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: T.candyDeep,
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
