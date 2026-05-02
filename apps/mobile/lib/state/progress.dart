import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Local-only gamification state — XP, streak, hearts, badges.
/// Lives outside the API: this is the "feel" layer that makes reading rewarding.
class Progress extends ChangeNotifier {
  static const _kXp = 'tq_xp';
  static const _kStreak = 'tq_streak';
  static const _kLastDay = 'tq_last_day';
  static const _kHearts = 'tq_hearts';
  static const _kHeartTs = 'tq_heart_ts';
  static const _kBadges = 'tq_badges';

  static const int maxHearts = 5;
  static const Duration heartRegen = Duration(minutes: 20);

  int xp = 0;
  int streak = 0;
  int hearts = maxHearts;
  Set<String> badges = {};

  int get level => 1 + (xp ~/ 100);
  int get xpInLevel => xp % 100;

  Future<void> load() async {
    final p = await SharedPreferences.getInstance();
    xp = p.getInt(_kXp) ?? 0;
    streak = p.getInt(_kStreak) ?? 0;
    hearts = p.getInt(_kHearts) ?? maxHearts;
    badges = (p.getStringList(_kBadges) ?? const []).toSet();

    final lastDay = p.getString(_kLastDay);
    final today = _todayKey();
    if (lastDay == null) {
      await p.setString(_kLastDay, today);
    } else if (lastDay != today) {
      final diff = _daysBetween(lastDay, today);
      if (diff == 1) {
        streak += 1;
      } else if (diff > 1) {
        streak = 1;
      }
      await p.setString(_kLastDay, today);
      await p.setInt(_kStreak, streak);
    }
    await _regenHearts(p);
    notifyListeners();
  }

  Future<void> addXp(int amount, {String? badge}) async {
    final p = await SharedPreferences.getInstance();
    xp += amount;
    await p.setInt(_kXp, xp);
    if (badge != null && !badges.contains(badge)) {
      badges = {...badges, badge};
      await p.setStringList(_kBadges, badges.toList());
    }
    notifyListeners();
  }

  Future<bool> spendHeart() async {
    if (hearts <= 0) return false;
    final p = await SharedPreferences.getInstance();
    hearts -= 1;
    await p.setInt(_kHearts, hearts);
    if (hearts == maxHearts - 1) {
      await p.setInt(_kHeartTs, DateTime.now().millisecondsSinceEpoch);
    }
    notifyListeners();
    return true;
  }

  Future<void> refillHearts() async {
    final p = await SharedPreferences.getInstance();
    hearts = maxHearts;
    await p.setInt(_kHearts, hearts);
    notifyListeners();
  }

  Future<void> _regenHearts(SharedPreferences p) async {
    if (hearts >= maxHearts) return;
    final tsMs = p.getInt(_kHeartTs);
    if (tsMs == null) return;
    final last = DateTime.fromMillisecondsSinceEpoch(tsMs);
    final elapsed = DateTime.now().difference(last);
    final regenerated = elapsed.inMicroseconds ~/ heartRegen.inMicroseconds;
    if (regenerated <= 0) return;
    hearts = (hearts + regenerated).clamp(0, maxHearts);
    await p.setInt(_kHearts, hearts);
    if (hearts < maxHearts) {
      await p.setInt(
          _kHeartTs,
          last
              .add(heartRegen * regenerated)
              .millisecondsSinceEpoch);
    } else {
      await p.remove(_kHeartTs);
    }
  }

  String _todayKey() {
    final n = DateTime.now();
    return '${n.year}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}';
  }

  int _daysBetween(String a, String b) {
    final pa = a.split('-').map(int.parse).toList();
    final pb = b.split('-').map(int.parse).toList();
    final da = DateTime(pa[0], pa[1], pa[2]);
    final db = DateTime(pb[0], pb[1], pb[2]);
    return db.difference(da).inDays;
  }
}
