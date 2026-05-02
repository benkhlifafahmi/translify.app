import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/owl_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';
import '../widgets/quest_input.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
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
      await context.read<Session>().register(
            _email.text.trim(),
            _password.text,
            displayName: _name.text.trim().isEmpty ? null : _name.text.trim(),
          );
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed('/library');
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PaperBackground(
        glow: T.mint,
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  icon: const Icon(Icons.arrow_back, color: T.ink),
                  style: IconButton.styleFrom(
                    backgroundColor: T.paper,
                    side: const BorderSide(color: T.ink, width: 1.6),
                    shape: const CircleBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                const Center(child: OwlMascot(mood: OwlMood.cheer, size: 120)),
                const SizedBox(height: 16),
                Text('Make my shelf.',
                    style: Theme.of(context).textTheme.displaySmall),
                const SizedBox(height: 4),
                Text('Earn your first 🌟 in under a minute.',
                    style: Theme.of(context)
                        .textTheme
                        .bodyLarge
                        ?.copyWith(color: T.inkSoft)),
                const SizedBox(height: 22),
                QuestInput(
                  controller: _name,
                  label: 'WHAT SHOULD WE CALL YOU?',
                  hint: 'e.g. Maya',
                  autofillHints: const [AutofillHints.givenName],
                ),
                const SizedBox(height: 14),
                QuestInput(
                  controller: _email,
                  label: 'EMAIL',
                  hint: 'reader@translify.app',
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.newUsername],
                ),
                const SizedBox(height: 14),
                QuestInput(
                  controller: _password,
                  label: 'PASSWORD',
                  hint: 'pick a strong one',
                  obscure: true,
                  autofillHints: const [AutofillHints.newPassword],
                ),
                if (_error != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: T.candy.withValues(alpha: 0.20),
                      borderRadius: BorderRadius.circular(T.radiusSm),
                      border:
                          Border.all(color: T.candyDeep, width: 1.4),
                    ),
                    child: Text(
                      _error!,
                      style: const TextStyle(
                        color: T.candyDeep,
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 22),
                QuestButton(
                  label: 'Begin the quest',
                  iconRight: Icons.bolt_rounded,
                  loading: _busy,
                  color: T.mint,
                  onPressed: _busy ? null : _submit,
                  size: QuestButtonSize.large,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
