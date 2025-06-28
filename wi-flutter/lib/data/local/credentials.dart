import 'package:hive/hive.dart';

class Credentials {
  static const _KEY_USER_ID = 'user_id';

  Box _box;

  init() async {
    _box = await Hive.openBox('credentials');
  }

  String get userId => _box?.get(_KEY_USER_ID);
  set userId(value) => _box?.put(_KEY_USER_ID, value);

  bool isAuthenticated() => userId != null;

  clear() => _box.clear();
}
