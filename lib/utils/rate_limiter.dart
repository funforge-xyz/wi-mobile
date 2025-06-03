import 'package:wi/exts/all.dart';

abstract class RateLimiter {
  bool shouldFetch(dynamic key, {Duration timeout});
  int getLastFetched(dynamic key);
  void setLastFetched(dynamic key, int timestamp);
  void reset(dynamic key);
}

/// A simple rate limiter implementation. Used with API calls.
class RateLimiterImpl extends RateLimiter {
  Map<dynamic, int> timestamps = {};

  @override
  bool shouldFetch(dynamic key, {Duration timeout}) {
    final lastFetched = timestamps[key];
    final now = DateTime.now().millisecondsSinceEpoch;
    if (lastFetched == null) {
      setLastFetched(key, now);
      return true;
    }
    final tout = timeout ?? 30.seconds;
    if (now - lastFetched > tout.inMilliseconds) {
      setLastFetched(key, now);
      return true;
    }
    return false;
  }

  @override
  int getLastFetched(dynamic key) {
    return timestamps[key];
  }

  @override
  setLastFetched(dynamic key, int timestamp) {
    timestamps[key] = timestamp;
  }

  @override
  void reset(dynamic key) {
    timestamps.remove(key);
  }
}

class RateLimiterKeys {
  static const FEED_POSTS = 'feed_posts';
  static const NEARBY_USERS = 'nearby_users';
}
