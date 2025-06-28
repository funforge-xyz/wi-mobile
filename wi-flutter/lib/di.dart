import 'package:get_it/get_it.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/data/database/profile_repository.dart';
import 'package:wi/data/database/user_settings_repository.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/storage/images_storage.dart';

final getIt = GetIt.instance;

S strings() => getIt<S>();

class Di {
  static init() async {
    getIt.registerSingleton<S>(S());

    // Credentials
    final credentials = Credentials();
    await credentials.init();
    getIt.registerSingleton(credentials);

    // Repository
    getIt.registerSingleton(ProfileRepository());
    getIt.registerSingleton(UserSettingsRepository());

    // Storage
    getIt.registerSingleton(ImagesStorage());

    // Auth
    getIt.registerSingleton(Auth());
  }
}
