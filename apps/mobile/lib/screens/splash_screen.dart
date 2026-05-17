import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _routed = false;

  Future<bool> _onboardingDone() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('onboarding_v1_done') ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    if (!_routed && session.phase != SessionPhase.unknown) {
      _routed = true;
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        if (!mounted) return;
        final nav = Navigator.of(context);
        if (session.phase == SessionPhase.signedIn) {
          nav.pushReplacementNamed('/library');
        } else {
          final done = await _onboardingDone();
          if (!mounted) return;
          nav.pushReplacementNamed(done ? '/login' : '/onboarding');
        }
      });
    }

    return Scaffold(
      body: PaperBackground(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const LumiMascot(mood: LumiMood.happy, size: 140),
              const SizedBox(height: 18),
              Text(
                'Translify',
                style: Theme.of(context).textTheme.displaySmall,
              ),
              const SizedBox(height: 6),
              const Text(
                'loading your shelf…',
                style: TextStyle(
                  color: T.inkSoft,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
