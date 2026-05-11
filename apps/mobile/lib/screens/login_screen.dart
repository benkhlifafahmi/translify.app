import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';
import '../widgets/quest_input.dart';

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
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context
          .read<Session>()
          .login(_email.text.trim(), _password.text);
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
