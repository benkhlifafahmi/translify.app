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
}
