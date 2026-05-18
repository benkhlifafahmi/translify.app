import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../api/services.dart';

enum SessionPhase { unknown, signedOut, signedIn }

class Session extends ChangeNotifier {
  Session(this.api)
      : auth = AuthService(api),
        books = BookService(api),
        folders = FolderService(api),
        translations = TranslationService(api),
        chats = ChatService(api),
        quizzes = QuizService(api),
        gardens = GardenService(api),
        profiles = ProfileService(api),
        billing = BillingService(api),
        highlights = HighlightService(api),
        progress = ProgressService(api),
        onboarding = OnboardingService(api);

  final ApiClient api;
  final AuthService auth;
  final BookService books;
  final FolderService folders;
  final TranslationService translations;
  final ChatService chats;
  final QuizService quizzes;
  final GardenService gardens;
  final ProfileService profiles;
  final BillingService billing;
  final HighlightService highlights;
  final ProgressService progress;
  final OnboardingService onboarding;

  SessionPhase phase = SessionPhase.unknown;
  User? user;
  bool get isAnonymous => user?.isAnonymous ?? false;

  Future<void> bootstrap() async {
    final token = await api.readToken();
    if (token == null) {
      phase = SessionPhase.signedOut;
      notifyListeners();
      return;
    }
    try {
      user = await auth.me();
      phase = SessionPhase.signedIn;
    } catch (_) {
      await api.writeToken(null);
      phase = SessionPhase.signedOut;
    }
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    user = await auth.login(email, password);
    phase = SessionPhase.signedIn;
    notifyListeners();
  }

  Future<void> register(String email, String password, {String? displayName}) async {
    user = await auth.register(email, password, displayName: displayName);
    phase = SessionPhase.signedIn;
    notifyListeners();
  }

  Future<void> loginWithGoogle(String idToken) async {
    user = await auth.loginWithGoogleToken(idToken);
    phase = SessionPhase.signedIn;
    notifyListeners();
  }

  /// Silently mint a ghost-account JWT. The phase stays signedOut so splash
  /// doesn't redirect; the token is stored and authorises seed/chat calls.
  Future<void> anonymousSignIn() async {
    await onboarding.anonymousSession();
    try {
      user = await auth.me();
    } catch (_) {}
    notifyListeners();
  }

  Future<void> logout() async {
    await auth.logout();
    user = null;
    phase = SessionPhase.signedOut;
    notifyListeners();
  }

  /// Replace [user] with a fresh copy (e.g. after editing /users/me) and
  /// notify listeners so screens that show the profile re-render.
  void setUser(User next) {
    user = next;
    notifyListeners();
  }

  Future<User> refreshUser() async {
    final next = await auth.me();
    user = next;
    notifyListeners();
    return next;
  }
}
