import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../api/services.dart';

enum SessionPhase { unknown, signedOut, signedIn }

class Session extends ChangeNotifier {
  Session(this.api)
      : auth = AuthService(api),
        books = BookService(api),
        translations = TranslationService(api),
        chats = ChatService(api),
        quizzes = QuizService(api);

  final ApiClient api;
  final AuthService auth;
  final BookService books;
  final TranslationService translations;
  final ChatService chats;
  final QuizService quizzes;

  SessionPhase phase = SessionPhase.unknown;
  User? user;

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

  Future<void> logout() async {
    await auth.logout();
    user = null;
    phase = SessionPhase.signedOut;
    notifyListeners();
  }
}
