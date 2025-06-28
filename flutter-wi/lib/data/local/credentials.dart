import 'package:hive/hive.dart';

class Credentials {
  static const _KEY_USER_ID = 'user_id';
  static const _KEY_NOTIF_TOKEN = 'notif_token';

  Box _box;

  init() async {
    _box = await Hive.openBox('credentials');
  }

  String get userId => _box?.get(_KEY_USER_ID);
  set userId(value) => _box?.put(_KEY_USER_ID, value);

  String get notifToken => _box?.get(_KEY_NOTIF_TOKEN);
  set notifToken(value) => _box?.put(_KEY_NOTIF_TOKEN, value);

  bool isAuthenticated() => userId != null;

  clear() => _box.clear();
}
