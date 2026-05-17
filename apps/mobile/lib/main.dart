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
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const TranslifyApp());
}

class TranslifyApp extends StatelessWidget {
  const TranslifyApp({super.key});

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
            final id = settings.arguments as String;
            return MaterialPageRoute(
              builder: (_) => BookDetailScreen(bookId: id),
            );
          }
          return null;
        },
      ),
    );
  }
}
