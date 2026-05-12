import 'dart:async';

import '../api/models.dart';
import '../api/services.dart';

/// Tracks reading sessions and flushes "read" events to the garden API.
///
/// Mirrors apps/web/src/lib/reading-tracker.ts: we record the *furthest page
/// reached* and flush a batched event when the unflushed delta crosses the
/// threshold, or on explicit flush (e.g. screen dispose / app backgrounded).
/// Rapid page-swipes don't generate one event per page — the server-side
/// growth rules are tuned for chunky reads, not single-page taps.
class ReadingTracker {
  ReadingTracker({
    required this.gardens,
    required this.bookId,
    this.flushPagesThreshold = 10,
    this.minSession = const Duration(seconds: 8),
  });

  final GardenService gardens;
  final String bookId;
  final int flushPagesThreshold;
  final Duration minSession;

  DateTime? _startedAt;
  int _furthest = 0;
  int _flushedThrough = 0;
  bool _inFlight = false;
  bool _disposed = false;

  /// Call whenever the user reaches a page. Idempotent for non-advancing
  /// reads (e.g. swiping back then forward doesn't double-count).
  void markReached(int page) {
    if (_disposed || page <= 0) return;
    _startedAt ??= DateTime.now();
    if (page <= _furthest) return;
    _furthest = page;
    if (_furthest - _flushedThrough >= flushPagesThreshold) {
      unawaited(flush());
    }
  }

  /// Force any unflushed pages out. Safe to call on dispose / app pause.
  Future<void> flush() async {
    if (_disposed) return;
    final started = _startedAt;
    if (started == null) return;
    final pages = _furthest - _flushedThrough;
    if (pages <= 0) return;
    if (_inFlight) return;
    final elapsed = DateTime.now().difference(started);
    final minutes = elapsed.inMinutes;
    if (elapsed < minSession && minutes == 0) return;
    _inFlight = true;
    final flushingTo = _furthest;
    try {
      await gardens.recordEvent(
        bookId,
        GardenEventKind.read,
        payload: {'pages': pages, 'minutes': minutes},
      );
      _flushedThrough = flushingTo;
      _startedAt = DateTime.now();
    } catch (_) {
      // Network failures shouldn't break reading — drop this flush, the
      // next one will catch up with the same furthest-page water mark.
    } finally {
      _inFlight = false;
    }
  }

  /// Stop accepting events. Final flush is the caller's responsibility —
  /// usually `await tracker.flush(); tracker.dispose();` in dispose().
  void dispose() {
    _disposed = true;
  }
}
