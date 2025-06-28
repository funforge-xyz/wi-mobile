import 'package:hive/hive.dart';
import 'package:wi/data/models/example_hive_json_model.dart';

class Settings {
  static const _KEY_EXAMPLE = 'example';

  Box _box;

  init() async {
    _box = await Hive.openBox('settings');
  }

  ExampleHiveJsonModel get example => _box?.get(_KEY_EXAMPLE);
  set example(value) => _box?.put(_KEY_EXAMPLE, value);

  clear() => _box.clear();
}
