import 'package:hive/hive.dart';

class Settings {
  static const _KEY_ONBOARDING_DONE = 'onboarding_done';
  static const _KEY_GUIDE_LEARNED_FEED_SWIPE = 'guide_learned_feed_swipe';
  static const _KEY_ASKED_FOR_BG_LOC_PERM_ON_PAUSE =
      'asked_for_bg_loc_perm_on_pause';
  static const _KEY_LAST_LOC_UPDATE_TIMESTAMP = 'last_loc_update_timestamp';
  static const _KEY_LAST_TIMEZEONE_NAME_UPDATE = 'last_timezone_name_update';
  static const _KEY_LAST_TIMEZEONE_OFFSET_UPDATE =
      'last_timezone_offset_update';

  Box _box;

  init() async {
    _box = await Hive.openBox('settings');
  }

  bool get onboardingDone =>
      _box?.get(_KEY_ONBOARDING_DONE, defaultValue: false);
  set onboardingDone(bool value) => _box?.put(_KEY_ONBOARDING_DONE, value);

  bool get guideLearnedFeedSwipe =>
      _box?.get(_KEY_GUIDE_LEARNED_FEED_SWIPE, defaultValue: false);
  set guideLearnedFeedSwipe(bool value) =>
      _box?.put(_KEY_GUIDE_LEARNED_FEED_SWIPE, value);

  bool get askedForBgLocPermOnPause =>
      _box?.get(_KEY_ASKED_FOR_BG_LOC_PERM_ON_PAUSE, defaultValue: false);
  set askedForBgLocPermOnPause(bool value) =>
      _box?.put(_KEY_ASKED_FOR_BG_LOC_PERM_ON_PAUSE, value);

  int get lastLocationUpdateTimestamp =>
      _box?.get(_KEY_LAST_LOC_UPDATE_TIMESTAMP, defaultValue: 0);
  set lastLocationUpdateTimestamp(int value) =>
      _box?.put(_KEY_LAST_LOC_UPDATE_TIMESTAMP, value);

  String get lastTimezoneNameUpdate =>
      _box?.get(_KEY_LAST_TIMEZEONE_NAME_UPDATE);
  set lastTimezoneNameUpdate(String value) =>
      _box?.put(_KEY_LAST_TIMEZEONE_NAME_UPDATE, value);

  String get lastTimezoneOffsetUpdate =>
      _box?.get(_KEY_LAST_TIMEZEONE_OFFSET_UPDATE);
  set lastTimezoneOffsetUpdate(String value) =>
      _box?.put(_KEY_LAST_TIMEZEONE_OFFSET_UPDATE, value);

  clear() => _box.clear();
}
