import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    if (!_routed && session.phase != SessionPhase.unknown) {
      _routed = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (session.phase == SessionPhase.signedIn) {
          Navigator.of(context).pushReplacementNamed('/library');
        } else {
          Navigator.of(context).pushReplacementNamed('/login');
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
