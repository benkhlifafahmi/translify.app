enum BookStatus { uploaded, processing, ready, failed }

BookStatus _statusFromString(String s) => switch (s) {
      'uploaded' => BookStatus.uploaded,
      'processing' => BookStatus.processing,
      'ready' => BookStatus.ready,
      'failed' => BookStatus.failed,
      _ => BookStatus.uploaded,
    };

enum BookFormat { pdf, epub }

BookFormat _formatFromString(String s) =>
    s == 'epub' ? BookFormat.epub : BookFormat.pdf;

class User {
  User({
    required this.id,
    required this.email,
    this.displayName,
    required this.preferredLanguage,
  });
  final String id;
  final String email;
  final String? displayName;
  final String preferredLanguage;

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: j['id'] as String,
        email: j['email'] as String,
        displayName: j['display_name'] as String?,
        preferredLanguage: (j['preferred_language'] as String?) ?? 'en',
      );
}

class Book {
  Book({
    required this.id,
    required this.title,
    this.author,
    this.sourceLanguage,
    required this.format,
    required this.status,
    this.pageCount,
    this.fileSizeBytes = 0,
    this.errorMessage,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String? author;
  final String? sourceLanguage;
  final BookFormat format;
  final BookStatus status;
  final int? pageCount;
  final int fileSizeBytes;
  final String? errorMessage;
  final DateTime createdAt;

  factory Book.fromJson(Map<String, dynamic> j) => Book(
        id: j['id'] as String,
        title: (j['title'] as String?) ?? 'Untitled',
        author: j['author'] as String?,
        sourceLanguage: j['source_language'] as String?,
        format: _formatFromString(j['format'] as String? ?? 'pdf'),
        status: _statusFromString(j['status'] as String? ?? 'uploaded'),
        pageCount: j['page_count'] as int?,
        fileSizeBytes: (j['file_size_bytes'] as int?) ?? 0,
        errorMessage: j['error_message'] as String?,
        createdAt: DateTime.tryParse(j['created_at'] as String? ?? '') ??
            DateTime.now(),
      );
}

enum TranslationStatus { queued, inProgress, ready, failed }

TranslationStatus _tsFromString(String s) => switch (s) {
      'queued' => TranslationStatus.queued,
      'in_progress' => TranslationStatus.inProgress,
      'ready' => TranslationStatus.ready,
      'failed' => TranslationStatus.failed,
      _ => TranslationStatus.queued,
    };

class Translation {
  Translation({
    required this.id,
    required this.bookId,
    required this.targetLanguage,
    required this.status,
    required this.progressPct,
    this.errorMessage,
  });
  final String id;
  final String bookId;
  final String targetLanguage;
  final TranslationStatus status;
  final int progressPct;
  final String? errorMessage;

  factory Translation.fromJson(Map<String, dynamic> j) => Translation(
        id: j['id'] as String,
        bookId: j['book_id'] as String,
        targetLanguage: j['target_language'] as String,
        status: _tsFromString(j['status'] as String? ?? 'queued'),
        progressPct: (j['progress_pct'] as int?) ?? 0,
        errorMessage: j['error_message'] as String?,
      );
}

class Citation {
  Citation({
    required this.chunkId,
    this.pageStart,
    this.pageEnd,
    required this.snippet,
  });
  final String chunkId;
  final int? pageStart;
  final int? pageEnd;
  final String snippet;

  factory Citation.fromJson(Map<String, dynamic> j) => Citation(
        chunkId: j['chunk_id'] as String,
        pageStart: j['page_start'] as int?,
        pageEnd: j['page_end'] as int?,
        snippet: (j['snippet'] as String?) ?? '',
      );
}

class ChatMessage {
  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    this.citations,
    required this.createdAt,
  });
  final String id;
  final String role; // user | assistant | system
  final String content;
  final List<Citation>? citations;
  final DateTime createdAt;

  factory ChatMessage.fromJson(Map<String, dynamic> j) => ChatMessage(
        id: j['id'] as String,
        role: j['role'] as String,
        content: (j['content'] as String?) ?? '',
        citations: (j['citations'] as List?)
            ?.map((e) => Citation.fromJson(e as Map<String, dynamic>))
            .toList(),
        createdAt: DateTime.tryParse(j['created_at'] as String? ?? '') ??
            DateTime.now(),
      );
}

class Chat {
  Chat({required this.id, this.title, required this.createdAt});
  final String id;
  final String? title;
  final DateTime createdAt;

  factory Chat.fromJson(Map<String, dynamic> j) => Chat(
        id: j['id'] as String,
        title: j['title'] as String?,
        createdAt: DateTime.tryParse(j['created_at'] as String? ?? '') ??
            DateTime.now(),
      );
}

class QuizQuestion {
  QuizQuestion({
    required this.id,
    required this.prompt,
    required this.choices,
  });
  final String id;
  final String prompt;
  final List<String> choices;

  factory QuizQuestion.fromJson(Map<String, dynamic> j) => QuizQuestion(
        id: j['id'] as String,
        prompt: (j['prompt'] as String?) ?? '',
        choices:
            ((j['choices'] as List?) ?? const []).map((e) => e.toString()).toList(),
      );
}

class Quiz {
  Quiz({required this.id, required this.title, required this.questions});
  final String id;
  final String title;
  final List<QuizQuestion> questions;

  factory Quiz.fromJson(Map<String, dynamic> j) => Quiz(
        id: j['id'] as String,
        title: (j['title'] as String?) ?? 'Quiz',
        questions: ((j['questions'] as List?) ?? const [])
            .map((e) => QuizQuestion.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class AnswerResult {
  AnswerResult({
    required this.questionId,
    required this.givenIndex,
    required this.correctIndex,
    required this.correct,
    required this.explanation,
  });
  final String questionId;
  final int givenIndex;
  final int correctIndex;
  final bool correct;
  final String explanation;

  factory AnswerResult.fromJson(Map<String, dynamic> j) => AnswerResult(
        questionId: j['question_id'] as String,
        givenIndex: (j['given_index'] as int?) ?? -1,
        correctIndex: (j['correct_index'] as int?) ?? -1,
        correct: (j['correct'] as bool?) ?? false,
        explanation: (j['explanation'] as String?) ?? '',
      );
}

class QuizAttempt {
  QuizAttempt({
    required this.id,
    required this.score,
    required this.total,
    required this.results,
  });
  final String id;
  final int score;
  final int total;
  final List<AnswerResult> results;

  factory QuizAttempt.fromJson(Map<String, dynamic> j) => QuizAttempt(
        id: j['id'] as String,
        score: (j['score'] as int?) ?? 0,
        total: (j['total'] as int?) ?? 0,
        results: ((j['results'] as List?) ?? const [])
            .map((e) => AnswerResult.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class UploadReservation {
  UploadReservation({
    required this.uploadId,
    required this.uploadUrl,
    required this.fileKey,
    required this.format,
  });
  final String uploadId;
  final String uploadUrl;
  final String fileKey;
  final BookFormat format;

  factory UploadReservation.fromJson(Map<String, dynamic> j) => UploadReservation(
        uploadId: j['upload_id'] as String,
        uploadUrl: j['upload_url'] as String,
        fileKey: j['file_key'] as String,
        format: _formatFromString(j['format'] as String? ?? 'pdf'),
      );
}

class FileUrl {
  FileUrl({required this.url});
  final String url;
  factory FileUrl.fromJson(Map<String, dynamic> j) =>
      FileUrl(url: j['url'] as String);
}
