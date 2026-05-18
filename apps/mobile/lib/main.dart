import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'api/api_client.dart';
import 'screens/book_detail_screen.dart';
import 'screens/gardens_index_screen.dart';
import 'screens/library_screen.dart';
import 'screens/login_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/paywall_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/register_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/upload_screen.dart';
import 'state/progress.dart';
import 'state/session.dart';
import 'theme/tokens.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Edge-to-edge: content renders behind status bar and navigation bar.
  // SafeArea widgets in each screen keep interactive elements in the safe zone.
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.transparent,
    ),
  );
  runApp(const TranslifyApp());
}

class TranslifyApp extends StatefulWidget {
  const TranslifyApp({super.key});
  @override
  State<TranslifyApp> createState() => _TranslifyAppState();
}

class _TranslifyAppState extends State<TranslifyApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = ApiClient();
    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        ChangeNotifierProvider<Session>(
          create: (_) => Session(api)..bootstrap(),
        ),
        ChangeNotifierProvider<Progress>(
          create: (_) => Progress()..load(),
        ),
      ],
      child: MaterialApp(
        title: 'Translify',
        debugShowCheckedModeBanner: false,
        theme: buildTheme(),
        routes: {
          '/': (_) => const SplashScreen(),
          '/onboarding': (_) => const OnboardingScreen(),
          '/paywall': (_) => const PaywallScreen(),
          '/login': (_) => const LoginScreen(),
          '/register': (_) => const RegisterScreen(),
          '/library': (_) => const LibraryScreen(),
          '/upload': (_) => const UploadScreen(),
          '/gardens': (_) => const GardensIndexScreen(),
          '/profile': (_) => const ProfileScreen(),
        },
        onGenerateRoute: (settings) {
          if (settings.name == '/book') {
            final args = settings.arguments;
            final String id;
            final bool tour;
            if (args is Map) {
              id = args['id'] as String;
              tour = args['tour'] as bool? ?? false;
            } else {
              id = args as String;
              tour = false;
            }
            return MaterialPageRoute(
              builder: (_) => BookDetailScreen(bookId: id, isOnboardingTour: tour),
            );
          }
          return null;
        },
      ),
    );
  }
}
