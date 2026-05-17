import 'dart:io';
import 'package:dio/dio.dart';

import 'api_client.dart';
import 'models.dart';

class AuthService {
  AuthService(this._api);
  final ApiClient _api;

  Future<User> login(String email, String password) async {
    final res = await _api.postForm<Map<String, dynamic>>(
      '/auth/jwt/login',
      {'username': email, 'password': password},
    );
    await _api.writeToken(res['access_token'] as String);
    return me();
  }

  Future<User> register(String email, String password, {String? displayName}) async {
    await _api.post<dynamic>('/auth/register', body: {
      'email': email,
      'password': password,
      'display_name': displayName,
    });
    return login(email, password);
  }

  Future<User> me() async {
    final res = await _api.get<Map<String, dynamic>>('/users/me');
    return User.fromJson(res);
  }

  Future<User> updateMe({
    String? displayName,
    String? preferredLanguage,
    bool? familySafeMode,
    String? password,
    String? email,
  }) async {
    final body = <String, dynamic>{};
    if (displayName != null) body['display_name'] = displayName;
    if (preferredLanguage != null) body['preferred_language'] = preferredLanguage;
    if (familySafeMode != null) body['family_safe_mode'] = familySafeMode;
    if (password != null && password.isNotEmpty) body['password'] = password;
    if (email != null && email.isNotEmpty) body['email'] = email;
    final res = await _api.patch<Map<String, dynamic>>('/users/me', body: body);
    return User.fromJson(res);
  }

  Future<User> loginWithGoogleToken(String idToken) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/auth/mobile/google',
      body: {'id_token': idToken},
    );
    await _api.writeToken(res['access_token'] as String);
    return me();
  }

  Future<void> logout() async {
    try {
      await _api.post<dynamic>('/auth/jwt/logout');
    } catch (_) {/* drop token regardless */}
    await _api.writeToken(null);
  }
}

class BookService {
  BookService(this._api);
  final ApiClient _api;

  Future<List<Book>> list() async {
    final res = await _api.get<List<dynamic>>('/books');
    return res.map((e) => Book.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Book> get(String id) async {
    final res = await _api.get<Map<String, dynamic>>('/books/$id');
    return Book.fromJson(res);
  }

  Future<void> delete(String id) => _api.delete<dynamic>('/books/$id');

  Future<FileUrl> fileUrl(String id) async {
    final res = await _api.get<Map<String, dynamic>>('/books/$id/file-url');
    return FileUrl.fromJson(res);
  }

  Future<UploadReservation> requestUpload({
    required String filename,
    required String contentType,
    required int sizeBytes,
  }) async {
    final res = await _api.post<Map<String, dynamic>>('/books/upload-url', body: {
      'filename': filename,
      'content_type': contentType,
      'size_bytes': sizeBytes,
    });
    return UploadReservation.fromJson(res);
  }

  Future<void> uploadToPresigned(
    String url,
    File file, {
    void Function(int sent, int total)? onProgress,
  }) async {
    final fresh = Dio();
    final stream = file.openRead();
    final length = await file.length();
    final res = await fresh.put<dynamic>(
      url,
      data: stream,
      options: Options(
        headers: {
          Headers.contentLengthHeader: length,
          if (file.path.toLowerCase().endsWith('.pdf'))
            'Content-Type': 'application/pdf'
          else if (file.path.toLowerCase().endsWith('.epub'))
            'Content-Type': 'application/epub+zip'
          else
            'Content-Type': 'application/octet-stream',
        },
      ),
      onSendProgress: onProgress,
    );
    if ((res.statusCode ?? 0) >= 300) {
      throw ApiException(res.statusCode ?? 0, 'Upload failed');
    }
  }

  Future<Book> finalize({required String uploadId, String? title, String? author}) async {
    final res = await _api.post<Map<String, dynamic>>('/books/finalize', body: {
      'upload_id': uploadId,
      'title': title,
      'author': author,
      'source_language': null,
    });
    return Book.fromJson(res);
  }
}

class TranslationService {
  TranslationService(this._api);
  final ApiClient _api;

  Future<List<Translation>> list(String bookId) async {
    final res = await _api.get<List<dynamic>>('/books/$bookId/translations');
    return res.map((e) => Translation.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Translation> create(String bookId, String targetLanguage) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/books/$bookId/translations',
      body: {'target_language': targetLanguage},
    );
    return Translation.fromJson(res);
  }

  Future<Translation> get(String id) async {
    final res = await _api.get<Map<String, dynamic>>('/translations/$id');
    return Translation.fromJson(res);
  }

  Future<Translation> retry(String id) async {
    final res = await _api.post<Map<String, dynamic>>('/translations/$id/retry');
    return Translation.fromJson(res);
  }

  Future<FileUrl> fileUrl(String id) async {
    final res = await _api.get<Map<String, dynamic>>('/translations/$id/file-url');
    return FileUrl.fromJson(res);
  }
}

class ChatService {
  ChatService(this._api);
  final ApiClient _api;

  Future<List<Chat>> list(String bookId) async {
    final res = await _api.get<List<dynamic>>('/books/$bookId/chats');
    return res.map((e) => Chat.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Chat> create(String bookId) async {
    final res = await _api.post<Map<String, dynamic>>('/books/$bookId/chats');
    return Chat.fromJson(res);
  }

  Future<void> delete(String chatId) => _api.delete<dynamic>('/chats/$chatId');

  Future<List<ChatMessage>> messages(String chatId) async {
    final res = await _api.get<List<dynamic>>('/chats/$chatId/messages');
    return res.map((e) => ChatMessage.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<({ChatMessage user, ChatMessage assistant})> send(
    String chatId,
    String content, {
    String? translationId,
  }) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/chats/$chatId/messages',
      body: {'content': content, 'translation_id': translationId},
    );
    return (
      user: ChatMessage.fromJson(res['user_message'] as Map<String, dynamic>),
      assistant: ChatMessage.fromJson(res['assistant_message'] as Map<String, dynamic>),
    );
  }
}

class QuizService {
  QuizService(this._api);
  final ApiClient _api;

  Future<Quiz> create(
    String bookId, {
    int questionCount = 8,
    String? translationId,
  }) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/books/$bookId/quizzes',
      body: {'question_count': questionCount, 'translation_id': translationId},
    );
    return Quiz.fromJson(res);
  }

  Future<QuizAttempt> submit(
    String quizId,
    List<({String questionId, int answerIndex})> answers,
  ) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/quizzes/$quizId/attempts',
      body: {
        'answers': answers
            .map((a) => {'question_id': a.questionId, 'answer_index': a.answerIndex})
            .toList(),
      },
    );
    return QuizAttempt.fromJson(res);
  }

  /// Peek at the correct answer for a single question without persisting an
  /// attempt — used by the card-by-card mobile flow so Lumi can react
  /// immediately. The final attempt is still submitted via [submit] at the end.
  Future<AnswerResult> gradeOne(
    String quizId, {
    required String questionId,
    required int answerIndex,
  }) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/quizzes/$quizId/grade',
      body: {'question_id': questionId, 'answer_index': answerIndex},
    );
    return AnswerResult.fromJson(res);
  }
}

class GardenService {
  GardenService(this._api);
  final ApiClient _api;

  /// GET /gardens — all gardens this user has started, one per book.
  Future<List<GardenSummary>> list() async {
    final res = await _api.get<List<dynamic>>('/gardens');
    return res
        .map((e) => GardenSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /gardens/{book_id} — the API auto-creates a garden the first time
  /// it's fetched for a book, so this also doubles as "start garden".
  Future<Garden> get(String bookId) async {
    final res = await _api.get<Map<String, dynamic>>('/gardens/$bookId');
    return Garden.fromJson(res);
  }

  /// POST /gardens/{book_id}/events — append a journal event and update
  /// growth/vitality counters on the server. Returns the fresh GardenRead
  /// payload so callers can refresh their local view without an extra GET.
  ///
  /// Common kinds:
  ///   read     → `{pages: int, minutes?: int, chapter?: int}`
  ///   quiz     → `{correct: int, total: int}`
  ///   water    → `{}`
  ///   skip     → `{}`
  ///   translate→ `{pages?: int, pair?: string}`
  Future<Garden> recordEvent(
    String bookId,
    GardenEventKind kind, {
    Map<String, dynamic> payload = const {},
  }) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/gardens/$bookId/events',
      body: {'kind': _eventKindToWire(kind), 'payload': payload},
    );
    return Garden.fromJson(res);
  }

  /// PATCH /gardens/{book_id} — update species, farmer, or both.
  /// Returns the fresh GardenRead payload.
  Future<Garden> update(
    String bookId, {
    GardenSpecies? species,
    Farmer? farmer,
  }) async {
    final body = <String, dynamic>{};
    if (species != null) body['species'] = speciesToWire(species);
    if (farmer != null) body['farmer'] = farmer.toJson();
    final res = await _api.patch<Map<String, dynamic>>(
      '/gardens/$bookId',
      body: body,
    );
    return Garden.fromJson(res);
  }

  /// GET /gardens/{book_id}/tending — fetch this week's tending pack.
  Future<List<TendingQuestion>> getTending(String bookId) async {
    final res =
        await _api.get<List<dynamic>>('/gardens/$bookId/tending');
    return res
        .map((e) => TendingQuestion.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static String _eventKindToWire(GardenEventKind k) => switch (k) {
        GardenEventKind.read => 'read',
        GardenEventKind.quiz => 'quiz',
        GardenEventKind.water => 'water',
        GardenEventKind.skip => 'skip',
        GardenEventKind.translate => 'translate',
        GardenEventKind.tend => 'tend',
      };

  /// POST /gardens/{book_id}/tending — submit answers and receive the verdict.
  Future<TendingResult> submitTending(
    String bookId,
    List<({String questionId, int choiceIndex})> answers,
  ) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/gardens/$bookId/tending',
      body: {
        'answers': answers
            .map((a) =>
                {'question_id': a.questionId, 'choice_index': a.choiceIndex})
            .toList(),
      },
    );
    return TendingResult.fromJson(res);
  }
}

class ProfileService {
  ProfileService(this._api);
  final ApiClient _api;

  Future<List<ReaderProfile>> list() async {
    final res = await _api.get<List<dynamic>>('/profiles');
    return res
        .map((e) => ReaderProfile.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ReaderProfile> create({
    required String name,
    ProfileKind kind = ProfileKind.adult,
    String avatarSeed = 'lumi',
  }) async {
    final res = await _api.post<Map<String, dynamic>>('/profiles', body: {
      'name': name,
      'kind': profileKindToWire(kind),
      'avatar_seed': avatarSeed,
    });
    return ReaderProfile.fromJson(res);
  }

  Future<ReaderProfile> update(
    String id, {
    String? name,
    ProfileKind? kind,
    String? avatarSeed,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (kind != null) body['kind'] = profileKindToWire(kind);
    if (avatarSeed != null) body['avatar_seed'] = avatarSeed;
    final res =
        await _api.patch<Map<String, dynamic>>('/profiles/$id', body: body);
    return ReaderProfile.fromJson(res);
  }

  Future<void> delete(String id) => _api.delete<dynamic>('/profiles/$id');

  Future<ReaderProfile> activate(String id) async {
    final res =
        await _api.post<Map<String, dynamic>>('/profiles/$id/activate');
    return ReaderProfile.fromJson(res);
  }
}

class BillingService {
  BillingService(this._api);
  final ApiClient _api;

  Future<Subscription> me() async {
    final res = await _api.get<Map<String, dynamic>>('/billing/me');
    return Subscription.fromJson(res);
  }

  Future<String> checkoutUrl({
    required Plan plan,
    required Cycle cycle,
    bool applyFirstMonthDiscount = false,
  }) async {
    if (plan == Plan.free) {
      throw ArgumentError('Cannot checkout for the free plan');
    }
    final res = await _api.post<Map<String, dynamic>>('/billing/checkout',
        body: {
          'plan': planToWire(plan),
          'cycle': cycleToWire(cycle),
          'apply_first_month_discount': applyFirstMonthDiscount,
        });
    return res['url'] as String;
  }

  Future<String> portalUrl() async {
    final res = await _api.post<Map<String, dynamic>>('/billing/portal');
    return res['url'] as String;
  }
}

class HighlightService {
  HighlightService(this._api);
  final ApiClient _api;

  Future<List<Highlight>> listForBook(String bookId) async {
    final res = await _api.get<List<dynamic>>('/books/$bookId/highlights');
    return res
        .map((e) => Highlight.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Highlight> create(
    String bookId, {
    required int page,
    required String text,
    HighlightColor color = HighlightColor.yellow,
    String? note,
    String? positionCfi,
  }) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/books/$bookId/highlights',
      body: {
        'page': page,
        'text': text,
        'color': hlColorToWire(color),
        'note': note,
        'position_cfi': positionCfi,
      },
    );
    return Highlight.fromJson(res);
  }

  Future<Highlight> update(
    String id, {
    String? note,
    HighlightColor? color,
  }) async {
    final body = <String, dynamic>{};
    if (note != null) body['note'] = note;
    if (color != null) body['color'] = hlColorToWire(color);
    final res =
        await _api.patch<Map<String, dynamic>>('/highlights/$id', body: body);
    return Highlight.fromJson(res);
  }

  Future<void> delete(String id) => _api.delete<dynamic>('/highlights/$id');

  Future<Highlight> askAi(String id, {String? question}) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/highlights/$id/ask-ai',
      body: {'question': question},
    );
    return Highlight.fromJson(res);
  }
}

class OnboardingService {
  OnboardingService(this._api);
  final ApiClient _api;

  Future<void> anonymousSession() async {
    final res = await _api.post<Map<String, dynamic>>('/onboarding/anonymous-session');
    final token = res['access_token'] as String?;
    if (token != null) await _api.writeToken(token);
  }

  Future<List<Seed>> listSeeds() async {
    final res = await _api.get<List<dynamic>>('/seeds');
    return res.map((e) => Seed.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Book> cloneSeed(String slug) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/seeds/${Uri.encodeComponent(slug)}/clone',
    );
    return Book.fromJson(res);
  }
}

class ProgressService {
  ProgressService(this._api);
  final ApiClient _api;

  Future<BookProgress> get(String bookId) async {
    final res = await _api.get<Map<String, dynamic>>('/books/$bookId/progress');
    return BookProgress.fromJson(res);
  }

  /// Upsert the user's reading position. Null fields are not modified server-
  /// side; the server stamps last_read_at on every write.
  Future<BookProgress> put(
    String bookId, {
    int? currentPage,
    String? currentCfi,
    int readingTimeDeltaSeconds = 0,
  }) async {
    final body = <String, dynamic>{
      'current_page': currentPage,
      'current_cfi': currentCfi,
      'reading_time_delta_seconds': readingTimeDeltaSeconds,
    };
    final res = await _api.put<Map<String, dynamic>>(
      '/books/$bookId/progress',
      body: body,
    );
    return BookProgress.fromJson(res);
  }

  Future<List<BookProgressListItem>> list() async {
    final res = await _api.get<List<dynamic>>('/books/progress');
    return res
        .map((e) => BookProgressListItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
