import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:get_it/get_it.dart';
import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/data/local/database.dart';
import 'package:wi/data/models/nearby_users.dart';
import 'package:wi/data/models/posts.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/repo/notifications_repo.dart';
import 'package:wi/data/repo/posts_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/data/repo/threads_repo.dart';
import 'package:wi/data/repo/user_settings_repo.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/permissions.dart';
import 'package:wi/data/local/settings.dart';
import 'package:wi/data/local/wifi_info.dart';
import 'package:wi/data/storage/attachments_storage.dart';
import 'package:wi/data/storage/cache_managers.dart';
import 'package:wi/data/storage/feeds_storage.dart';
import 'package:wi/data/storage/images_storage.dart';
import 'package:wi/pages/feed/data_provider.dart';
import 'package:wi/services/background.dart';
import 'package:wi/services/compression.dart';
import 'package:wi/services/image_manipulator.dart';
import 'package:wi/services/location.dart';
import 'package:wi/services/notifications_service.dart';
import 'package:wi/services/remote_config.dart';
import 'package:wi/utils/rate_limiter.dart';

final getIt = GetIt.instance;

S strings() => getIt<S>();

class Di {
  static bool _initialized = false;

  static init() async {
    if (_initialized) return;

    await Firebase.initializeApp();

    await Hive.initFlutter();
    Hive.registerAdapter(PostsAdapter());
    Hive.registerAdapter(PostInfoAdapter());
    Hive.registerAdapter(NearbyUsersAdapter());
    Hive.registerAdapter(NearbyUserAdapter());
    Hive.registerAdapter(ProfileModelAdapter());

    getIt.registerSingleton<S>(S());

    // Register an instance of Dio for API calls
    getIt.registerSingleton(Dio());

    // Register an instance of rate limited
    getIt.registerSingleton<RateLimiter>(RateLimiterImpl());

    // Credentials
    final credentials = Credentials();
    await credentials.init();
    getIt.registerSingleton(credentials);

    // Auth
    getIt.registerSingleton(Auth());

    // Settings
    final settings = Settings();
    await settings.init();
    getIt.registerSingleton(settings);

    // Database
    final db = DatabaseImpl();
    await db.init();
    getIt.registerSingleton<Database>(db);

    // Remote Configuration
    getIt.registerSingleton<RemoteConfig>(RemoteConfigImpl());

    // Cache Managers
    getIt.registerLazySingleton(() => ImageCacheManager());
    getIt.registerLazySingleton(() => MessageImageCacheManager());
    getIt.registerLazySingleton(() => FeedCache());

    // Image/Video compression
    getIt.registerSingleton<Compression>(CompressionImpl());

    // Image manipulation
    getIt.registerSingleton<ImageManipulator>(ImageManipulatorImpl());

    // API client
    getIt.registerSingleton(Api());

    // Storage
    getIt.registerLazySingleton(() => ImagesStorage());
    getIt.registerLazySingleton(() => AttachmentsStorage());
    getIt.registerLazySingleton(() => FeedsStorage());

    // Repository
    getIt.registerLazySingleton(() => UsersRepo());
    getIt.registerLazySingleton(() => UserSettingsRepo());
    getIt.registerLazySingleton(() => ThreadsRepo());
    getIt.registerLazySingleton(() => PostsRepo());
    getIt.registerLazySingleton(() => NotificationsRepo());

    getIt.registerSingleton(FeedDataProvider());

    // Permissions management
    getIt.registerLazySingleton<Permissions>(() => PermissionsImpl());

    // WiFi information
    getIt.registerLazySingleton<WifiInfo>(() => WifiInfoImpl());

    // Location service
    getIt.registerSingleton<LocationService>(LocationServiceImpl());

    // Notifications
    getIt.registerLazySingleton<NotificationsService>(
      () => NotificationsServiceImpl(),
    );

    _initialized = true;
  }
}
