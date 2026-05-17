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
    this.familySafeMode = false,
    this.activeProfileId,
    this.isAnonymous = false,
  });
  final String id;
  final String email;
  final String? displayName;
  final String preferredLanguage;
  final bool familySafeMode;
  final String? activeProfileId;
  final bool isAnonymous;

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: j['id'] as String,
        email: j['email'] as String,
        displayName: j['display_name'] as String?,
        preferredLanguage: (j['preferred_language'] as String?) ?? 'en',
        familySafeMode: (j['family_safe_mode'] as bool?) ?? false,
        activeProfileId: j['active_profile_id'] as String?,
        isAnonymous: (j['is_anonymous'] as bool?) ?? false,
      );
}

enum ProfileKind { adult, child }

ProfileKind _profileKindFromString(String s) =>
    s == 'child' ? ProfileKind.child : ProfileKind.adult;

String profileKindToWire(ProfileKind k) =>
    k == ProfileKind.child ? 'child' : 'adult';

class ReaderProfile {
  ReaderProfile({
    required this.id,
    required this.name,
    required this.avatarSeed,
    required this.kind,
    required this.isDefault,
    required this.createdAt,
    required this.updatedAt,
  });
  final String id;
  final String name;
  final String avatarSeed;
  final ProfileKind kind;
  final bool isDefault;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory ReaderProfile.fromJson(Map<String, dynamic> j) => ReaderProfile(
        id: j['id'] as String,
        name: (j['name'] as String?) ?? '',
        avatarSeed: (j['avatar_seed'] as String?) ?? 'lumi',
        kind: _profileKindFromString((j['kind'] as String?) ?? 'adult'),
        isDefault: (j['is_default'] as bool?) ?? false,
        createdAt: DateTime.tryParse(j['created_at'] as String? ?? '') ??
            DateTime.now(),
        updatedAt: DateTime.tryParse(j['updated_at'] as String? ?? '') ??
            DateTime.now(),
      );
}

enum Plan { free, reader, scholar, family }

Plan planFromString(String s) => switch (s) {
      'reader' => Plan.reader,
      'scholar' => Plan.scholar,
      'family' => Plan.family,
      _ => Plan.free,
    };

String planToWire(Plan p) => switch (p) {
      Plan.free => 'free',
      Plan.reader => 'reader',
      Plan.scholar => 'scholar',
      Plan.family => 'family',
    };

String planLabel(Plan p) => switch (p) {
      Plan.free => 'Free',
      Plan.reader => 'Reader',
      Plan.scholar => 'Scholar',
      Plan.family => 'Family',
    };

enum Cycle { monthly, yearly }

Cycle _cycleFromString(String? s) =>
    s == 'yearly' ? Cycle.yearly : Cycle.monthly;

String cycleToWire(Cycle c) => c == Cycle.yearly ? 'yearly' : 'monthly';

enum SubStatus { inactive, trialing, active, pastDue, canceled, unpaid }

SubStatus _subStatusFromString(String s) => switch (s) {
      'trialing' => SubStatus.trialing,
      'active' => SubStatus.active,
      'past_due' => SubStatus.pastDue,
      'canceled' => SubStatus.canceled,
      'unpaid' => SubStatus.unpaid,
      _ => SubStatus.inactive,
    };

String subStatusLabel(SubStatus s) => switch (s) {
      SubStatus.inactive => 'Inactive',
      SubStatus.trialing => 'Trial',
      SubStatus.active => 'Active',
      SubStatus.pastDue => 'Past due',
      SubStatus.canceled => 'Canceled',
      SubStatus.unpaid => 'Unpaid',
    };

class Quota {
  Quota({
    required this.pagesPerMonth,
    required this.maxPagesPerBook,
    required this.quizzesPerBook,
    required this.profiles,
    required this.chatWithCitations,
    required this.annotatedExport,
    required this.priorityQueue,
    required this.familySafeMode,
    required this.literaryTranslation,
  });

  static const int unlimitedSentinel = 1000000;

  final int pagesPerMonth;
  final int maxPagesPerBook;
  final int quizzesPerBook;
  final int profiles;
  final bool chatWithCitations;
  final bool annotatedExport;
  final bool priorityQueue;
  final bool familySafeMode;
  final bool literaryTranslation;

  bool isUnlimited(int n) => n >= unlimitedSentinel;

  factory Quota.fromJson(Map<String, dynamic> j) => Quota(
        pagesPerMonth: (j['pages_per_month'] as int?) ?? 0,
        maxPagesPerBook: (j['max_pages_per_book'] as int?) ?? 0,
        quizzesPerBook: (j['quizzes_per_book'] as int?) ?? 0,
        profiles: (j['profiles'] as int?) ?? 1,
        chatWithCitations: (j['chat_with_citations'] as bool?) ?? false,
        annotatedExport: (j['annotated_export'] as bool?) ?? false,
        priorityQueue: (j['priority_queue'] as bool?) ?? false,
        familySafeMode: (j['family_safe_mode'] as bool?) ?? false,
        literaryTranslation: (j['literary_translation'] as bool?) ?? false,
      );
}

class Usage {
  Usage({
    this.periodStart,
    required this.pagesUploaded,
    required this.quizzesGenerated,
  });
  final DateTime? periodStart;
  final int pagesUploaded;
  final int quizzesGenerated;

  factory Usage.fromJson(Map<String, dynamic> j) => Usage(
        periodStart: j['period_start'] is String
            ? DateTime.tryParse(j['period_start'] as String)
            : null,
        pagesUploaded: (j['pages_uploaded'] as int?) ?? 0,
        quizzesGenerated: (j['quizzes_generated'] as int?) ?? 0,
      );
}

class Subscription {
  Subscription({
    required this.plan,
    this.cycle,
    required this.status,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    this.trialEnd,
    required this.cancelAtPeriodEnd,
    this.canceledAt,
    required this.hasStripeCustomer,
    required this.quota,
    required this.usage,
  });

  final Plan plan;
  final Cycle? cycle;
  final SubStatus status;
  final DateTime? currentPeriodStart;
  final DateTime? currentPeriodEnd;
  final DateTime? trialEnd;
  final bool cancelAtPeriodEnd;
  final DateTime? canceledAt;
  final bool hasStripeCustomer;
  final Quota quota;
  final Usage usage;

  factory Subscription.fromJson(Map<String, dynamic> j) => Subscription(
        plan: planFromString(j['plan'] as String? ?? 'free'),
        cycle: j['cycle'] is String
            ? _cycleFromString(j['cycle'] as String)
            : null,
        status: _subStatusFromString(j['status'] as String? ?? 'inactive'),
        currentPeriodStart: j['current_period_start'] is String
            ? DateTime.tryParse(j['current_period_start'] as String)
            : null,
        currentPeriodEnd: j['current_period_end'] is String
            ? DateTime.tryParse(j['current_period_end'] as String)
            : null,
        trialEnd: j['trial_end'] is String
            ? DateTime.tryParse(j['trial_end'] as String)
            : null,
        cancelAtPeriodEnd: (j['cancel_at_period_end'] as bool?) ?? false,
        canceledAt: j['canceled_at'] is String
            ? DateTime.tryParse(j['canceled_at'] as String)
            : null,
        hasStripeCustomer: (j['has_stripe_customer'] as bool?) ?? false,
        quota: Quota.fromJson(j['quota'] as Map<String, dynamic>? ?? const {}),
        usage: Usage.fromJson(j['usage'] as Map<String, dynamic>? ?? const {}),
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

enum HighlightColor { yellow, green, blue, pink }

HighlightColor _hlColorFromString(String s) => switch (s) {
      'green' => HighlightColor.green,
      'blue' => HighlightColor.blue,
      'pink' => HighlightColor.pink,
      _ => HighlightColor.yellow,
    };

String hlColorToWire(HighlightColor c) => switch (c) {
      HighlightColor.yellow => 'yellow',
      HighlightColor.green => 'green',
      HighlightColor.blue => 'blue',
      HighlightColor.pink => 'pink',
    };

class Highlight {
  Highlight({
    required this.id,
    required this.bookId,
    required this.page,
    required this.text,
    required this.color,
    this.note,
    this.aiQuestion,
    this.aiAnswer,
    this.positionCfi,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String bookId;
  final int page;
  final String text;
  final HighlightColor color;
  final String? note;
  final String? aiQuestion;
  final String? aiAnswer;
  final String? positionCfi;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory Highlight.fromJson(Map<String, dynamic> j) => Highlight(
        id: j['id'] as String,
        bookId: j['book_id'] as String,
        page: (j['page'] as int?) ?? 1,
        text: (j['text'] as String?) ?? '',
        color: _hlColorFromString((j['color'] as String?) ?? 'yellow'),
        note: j['note'] as String?,
        aiQuestion: j['ai_question'] as String?,
        aiAnswer: j['ai_answer'] as String?,
        positionCfi: j['position_cfi'] as String?,
        createdAt: DateTime.tryParse(j['created_at'] as String? ?? '') ??
            DateTime.now(),
        updatedAt: DateTime.tryParse(j['updated_at'] as String? ?? '') ??
            DateTime.now(),
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

class Seed {
  const Seed({
    required this.slug,
    required this.title,
    required this.author,
    this.cloneId,
  });
  final String slug;
  final String title;
  final String author;
  final String? cloneId;

  factory Seed.fromJson(Map<String, dynamic> j) => Seed(
        slug: j['slug'] as String,
        title: (j['title'] as String?) ?? 'Untitled',
        author: (j['author'] as String?) ?? '',
        cloneId: j['clone_id'] as String?,
      );
}

class BookProgress {
  BookProgress({
    this.currentPage,
    this.currentCfi,
    this.readingTimeSeconds = 0,
    this.lastReadAt,
  });

  /// 1-indexed page (PDF) or chapter index (EPUB).
  final int? currentPage;

  /// EPUB CFI (web-only today). Mobile readers ignore on read but pass
  /// through unchanged on write so a CFI saved from the web survives.
  final String? currentCfi;

  final int readingTimeSeconds;
  final DateTime? lastReadAt;

  factory BookProgress.fromJson(Map<String, dynamic> j) => BookProgress(
        currentPage: j['current_page'] as int?,
        currentCfi: j['current_cfi'] as String?,
        readingTimeSeconds: (j['reading_time_seconds'] as int?) ?? 0,
        lastReadAt: j['last_read_at'] != null
            ? DateTime.tryParse(j['last_read_at'] as String)
            : null,
      );
}

class BookProgressListItem {
  BookProgressListItem({
    required this.bookId,
    this.currentPage,
    this.currentCfi,
    this.readingTimeSeconds = 0,
    this.lastReadAt,
  });

  final String bookId;
  final int? currentPage;
  final String? currentCfi;
  final int readingTimeSeconds;
  final DateTime? lastReadAt;

  factory BookProgressListItem.fromJson(Map<String, dynamic> j) =>
      BookProgressListItem(
        bookId: j['book_id'] as String,
        currentPage: j['current_page'] as int?,
        currentCfi: j['current_cfi'] as String?,
        readingTimeSeconds: (j['reading_time_seconds'] as int?) ?? 0,
        lastReadAt: j['last_read_at'] != null
            ? DateTime.tryParse(j['last_read_at'] as String)
            : null,
      );
}

// ───────────────────────────── Garden ─────────────────────────────
// Wire format is camelCase per apps/api/app/schemas/garden.py.

enum FarmerHat { straw, wool, scholar, none }

FarmerHat _hatFromString(String s) => switch (s) {
      'wool' => FarmerHat.wool,
      'scholar' => FarmerHat.scholar,
      'none' => FarmerHat.none,
      _ => FarmerHat.straw,
    };

String hatToWire(FarmerHat h) => switch (h) {
      FarmerHat.straw => 'straw',
      FarmerHat.wool => 'wool',
      FarmerHat.scholar => 'scholar',
      FarmerHat.none => 'none',
    };

enum FarmerCoat { denim, linen, earth, moss }

FarmerCoat _coatFromString(String s) => switch (s) {
      'denim' => FarmerCoat.denim,
      'linen' => FarmerCoat.linen,
      'moss' => FarmerCoat.moss,
      _ => FarmerCoat.earth,
    };

String coatToWire(FarmerCoat c) => switch (c) {
      FarmerCoat.denim => 'denim',
      FarmerCoat.linen => 'linen',
      FarmerCoat.earth => 'earth',
      FarmerCoat.moss => 'moss',
    };

enum FarmerSkin { fair, tan, umber, sepia }

FarmerSkin _skinFromString(String s) => switch (s) {
      'fair' => FarmerSkin.fair,
      'umber' => FarmerSkin.umber,
      'sepia' => FarmerSkin.sepia,
      _ => FarmerSkin.tan,
    };

String skinToWire(FarmerSkin s) => switch (s) {
      FarmerSkin.fair => 'fair',
      FarmerSkin.tan => 'tan',
      FarmerSkin.umber => 'umber',
      FarmerSkin.sepia => 'sepia',
    };

enum FarmerTool { wateringCan, shears, lantern, book }

FarmerTool _toolFromString(String s) => switch (s) {
      'shears' => FarmerTool.shears,
      'lantern' => FarmerTool.lantern,
      'book' => FarmerTool.book,
      _ => FarmerTool.wateringCan,
    };

String toolToWire(FarmerTool t) => switch (t) {
      FarmerTool.wateringCan => 'watering-can',
      FarmerTool.shears => 'shears',
      FarmerTool.lantern => 'lantern',
      FarmerTool.book => 'book',
    };

class Farmer {
  Farmer({
    this.hat = FarmerHat.straw,
    this.coat = FarmerCoat.earth,
    this.skin = FarmerSkin.tan,
    this.tool = FarmerTool.wateringCan,
    this.name = '',
  });
  final FarmerHat hat;
  final FarmerCoat coat;
  final FarmerSkin skin;
  final FarmerTool tool;
  final String name;

  Farmer copyWith({
    FarmerHat? hat,
    FarmerCoat? coat,
    FarmerSkin? skin,
    FarmerTool? tool,
    String? name,
  }) =>
      Farmer(
        hat: hat ?? this.hat,
        coat: coat ?? this.coat,
        skin: skin ?? this.skin,
        tool: tool ?? this.tool,
        name: name ?? this.name,
      );

  factory Farmer.fromJson(Map<String, dynamic> j) => Farmer(
        hat: _hatFromString(j['hat'] as String? ?? 'straw'),
        coat: _coatFromString(j['coat'] as String? ?? 'earth'),
        skin: _skinFromString(j['skin'] as String? ?? 'tan'),
        tool: _toolFromString(j['tool'] as String? ?? 'watering-can'),
        name: (j['name'] as String?) ?? '',
      );

  Map<String, dynamic> toJson() => {
        'hat': hatToWire(hat),
        'coat': coatToWire(coat),
        'skin': skinToWire(skin),
        'tool': toolToWire(tool),
        'name': name,
      };
}

enum GardenSpecies { ficus, helianthus, lavandula, monstera }

String speciesToWire(GardenSpecies s) => switch (s) {
      GardenSpecies.ficus => 'ficus',
      GardenSpecies.helianthus => 'helianthus',
      GardenSpecies.lavandula => 'lavandula',
      GardenSpecies.monstera => 'monstera',
    };

GardenSpecies _speciesFromString(String s) => switch (s) {
      'helianthus' => GardenSpecies.helianthus,
      'lavandula' => GardenSpecies.lavandula,
      'monstera' => GardenSpecies.monstera,
      _ => GardenSpecies.ficus,
    };

enum GardenHealth { thriving, budding, wilting, dying }

GardenHealth _healthFromString(String s) => switch (s) {
      'budding' => GardenHealth.budding,
      'wilting' => GardenHealth.wilting,
      'dying' => GardenHealth.dying,
      _ => GardenHealth.thriving,
    };

enum GardenEventKind { read, quiz, water, skip, translate, tend }

GardenEventKind _eventKindFromString(String s) => switch (s) {
      'quiz' => GardenEventKind.quiz,
      'water' => GardenEventKind.water,
      'skip' => GardenEventKind.skip,
      'translate' => GardenEventKind.translate,
      'tend' => GardenEventKind.tend,
      _ => GardenEventKind.read,
    };

class GardenJournalEntry {
  GardenJournalEntry({
    required this.id,
    required this.at,
    required this.kind,
    required this.what,
    required this.delta,
    required this.warn,
  });
  final String id;
  final DateTime at;
  final GardenEventKind kind;
  final String what;
  final String delta;
  final bool warn;

  factory GardenJournalEntry.fromJson(Map<String, dynamic> j) =>
      GardenJournalEntry(
        id: j['id'] as String,
        at: DateTime.parse(j['at'] as String),
        kind: _eventKindFromString(j['kind'] as String? ?? 'read'),
        what: (j['what'] as String?) ?? '',
        delta: (j['delta'] as String?) ?? '',
        warn: (j['warn'] as bool?) ?? false,
      );
}

class Garden {
  Garden({
    required this.bookId,
    required this.bookTitle,
    this.bookAuthor,
    required this.species,
    required this.farmer,
    required this.stage,
    required this.growthPercent,
    required this.pagesRead,
    required this.pageCount,
    required this.pagesReadDelta,
    required this.quizzesAnswered,
    required this.quizzesTotal,
    required this.quizAccuracyPercent,
    required this.vitality,
    required this.vitalityCapacity,
    required this.daysUntilThirst,
    required this.streakDays,
    required this.bestStreakDays,
    required this.newLeaves,
    required this.health,
    required this.startedAt,
    required this.weeklyTendingDueAt,
    this.lastLeafAt,
    required this.journal,
  });

  final String bookId;
  final String bookTitle;
  final String? bookAuthor;
  final GardenSpecies species;
  final Farmer farmer;
  final int stage;
  final int growthPercent;
  final int pagesRead;
  final int pageCount;
  final int pagesReadDelta;
  final int quizzesAnswered;
  final int quizzesTotal;
  final int quizAccuracyPercent;
  final int vitality;
  final int vitalityCapacity;
  final int daysUntilThirst;
  final int streakDays;
  final int bestStreakDays;
  final int newLeaves;
  final GardenHealth health;
  final DateTime startedAt;
  final DateTime weeklyTendingDueAt;
  final DateTime? lastLeafAt;
  final List<GardenJournalEntry> journal;

  bool get tendingDue => DateTime.now().isAfter(weeklyTendingDueAt);

  /// "Day N of cultivation" — at least 1.
  int get daysSinceStart {
    final ms = DateTime.now().difference(startedAt).inMilliseconds;
    final days = ms ~/ 86400000;
    return days < 1 ? 1 : days;
  }

  factory Garden.fromJson(Map<String, dynamic> j) => Garden(
        bookId: j['bookId'] as String,
        bookTitle: (j['bookTitle'] as String?) ?? '',
        bookAuthor: j['bookAuthor'] as String?,
        species: _speciesFromString(j['species'] as String? ?? 'ficus'),
        farmer: j['farmer'] is Map<String, dynamic>
            ? Farmer.fromJson(j['farmer'] as Map<String, dynamic>)
            : Farmer(),
        stage: (j['stage'] as int?) ?? 0,
        growthPercent: (j['growthPercent'] as int?) ?? 0,
        pagesRead: (j['pagesRead'] as int?) ?? 0,
        pageCount: (j['pageCount'] as int?) ?? 0,
        pagesReadDelta: (j['pagesReadDelta'] as int?) ?? 0,
        quizzesAnswered: (j['quizzesAnswered'] as int?) ?? 0,
        quizzesTotal: (j['quizzesTotal'] as int?) ?? 0,
        quizAccuracyPercent: (j['quizAccuracyPercent'] as int?) ?? 0,
        vitality: (j['vitality'] as int?) ?? 0,
        vitalityCapacity: (j['vitalityCapacity'] as int?) ?? 5,
        daysUntilThirst: (j['daysUntilThirst'] as int?) ?? 0,
        streakDays: (j['streakDays'] as int?) ?? 0,
        bestStreakDays: (j['bestStreakDays'] as int?) ?? 0,
        newLeaves: (j['newLeaves'] as int?) ?? 0,
        // GardenRead payload does not include health — derive from vitality.
        health: j['health'] is String
            ? _healthFromString(j['health'] as String)
            : _deriveHealth(
                vitality: (j['vitality'] as int?) ?? 0,
                capacity: (j['vitalityCapacity'] as int?) ?? 5,
              ),
        startedAt: DateTime.tryParse(j['startedAt'] as String? ?? '') ??
            DateTime.now(),
        weeklyTendingDueAt:
            DateTime.tryParse(j['weeklyTendingDueAt'] as String? ?? '') ??
                DateTime.now().add(const Duration(days: 7)),
        lastLeafAt: j['lastLeafAt'] is String
            ? DateTime.tryParse(j['lastLeafAt'] as String)
            : null,
        journal: ((j['journal'] as List?) ?? const [])
            .map((e) => GardenJournalEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// Lightweight per-book garden tile for the index list. Returned by
/// `GET /gardens` (one per book). Includes `health` directly, which the
/// detail payload (`GET /gardens/{id}`) omits.
class GardenSummary {
  GardenSummary({
    required this.bookId,
    required this.bookTitle,
    this.bookAuthor,
    required this.species,
    required this.stage,
    required this.growthPercent,
    required this.health,
  });
  final String bookId;
  final String bookTitle;
  final String? bookAuthor;
  final GardenSpecies species;
  final int stage;
  final int growthPercent;
  final GardenHealth health;

  factory GardenSummary.fromJson(Map<String, dynamic> j) => GardenSummary(
        bookId: j['bookId'] as String,
        bookTitle: (j['bookTitle'] as String?) ?? '',
        bookAuthor: j['bookAuthor'] as String?,
        species: _speciesFromString(j['species'] as String? ?? 'ficus'),
        stage: (j['stage'] as int?) ?? 0,
        growthPercent: (j['growthPercent'] as int?) ?? 0,
        health: _healthFromString(j['health'] as String? ?? 'thriving'),
      );
}

// ─────────────────────── Weekly tending ───────────────────────

class TendingQuestion {
  TendingQuestion({
    required this.id,
    required this.prompt,
    required this.choices,
  });
  final String id;
  final String prompt;
  final List<String> choices;

  factory TendingQuestion.fromJson(Map<String, dynamic> j) => TendingQuestion(
        id: j['id'] as String,
        prompt: (j['prompt'] as String?) ?? '',
        choices: ((j['choices'] as List?) ?? const [])
            .map((e) => e as String)
            .toList(),
      );
}

class TendingPerQuestion {
  TendingPerQuestion({
    required this.id,
    required this.correct,
    required this.givenIndex,
    this.correctIndex,
    this.explanation,
  });
  final String id;
  final bool correct;
  final int givenIndex;
  final int? correctIndex;
  final String? explanation;

  factory TendingPerQuestion.fromJson(Map<String, dynamic> j) =>
      TendingPerQuestion(
        id: j['id'] as String,
        correct: (j['correct'] as bool?) ?? false,
        givenIndex: (j['givenIndex'] as int?) ?? -1,
        correctIndex: j['correctIndex'] as int?,
        explanation: j['explanation'] as String?,
      );
}

class TendingResult {
  TendingResult({
    required this.score,
    required this.total,
    required this.passed,
    required this.growthGained,
    required this.vitalityRestored,
    required this.newStage,
    required this.nextDueAt,
    required this.perQuestion,
  });
  final int score;
  final int total;
  final bool passed;
  final int growthGained;
  final int vitalityRestored;
  final int newStage;
  final DateTime nextDueAt;
  final List<TendingPerQuestion> perQuestion;

  factory TendingResult.fromJson(Map<String, dynamic> j) => TendingResult(
        score: (j['score'] as int?) ?? 0,
        total: (j['total'] as int?) ?? 0,
        passed: (j['passed'] as bool?) ?? false,
        growthGained: (j['growthGained'] as int?) ?? 0,
        vitalityRestored: (j['vitalityRestored'] as int?) ?? 0,
        newStage: (j['newStage'] as int?) ?? 0,
        nextDueAt: DateTime.tryParse(j['nextDueAt'] as String? ?? '') ??
            DateTime.now().add(const Duration(days: 7)),
        perQuestion: ((j['perQuestion'] as List?) ?? const [])
            .map((e) => TendingPerQuestion.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

GardenHealth _deriveHealth({required int vitality, required int capacity}) {
  if (capacity <= 0) return GardenHealth.thriving;
  final ratio = vitality / capacity;
  if (ratio >= 0.8) return GardenHealth.thriving;
  if (ratio >= 0.5) return GardenHealth.budding;
  if (ratio >= 0.2) return GardenHealth.wilting;
  return GardenHealth.dying;
}
