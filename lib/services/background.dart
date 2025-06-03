import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/permissions.dart';
import 'package:wi/data/local/settings.dart';
import 'package:wi/data/local/wifi_info.dart';
import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/di.dart';
import 'package:wi/services/location.dart';
import 'package:wi/exts/all.dart';

class BackgroundService {
  static Future<bool> _bgLocPermissionGranted() async {
    final perm = await getIt<Permissions>().locationAlwaysStatus();
    return perm.isGranted();
  }

  static Future handleUpdateTriggerBackgroundMessage(
      RemoteMessage message) async {
    print('NOTIFICATION RECEIVED WHILE APP WAS IN THE BACKGROUND');

    // Make sure to init firebase and dependencies first! Otherwise the code
    // that follows will throw.
    await Firebase.initializeApp();
    await Di.init();

    // Return if background location permissions were denied.
    if (!(await _bgLocPermissionGranted())) {
      print('\tBackground location permissions denied. Returning...');
      return;
    }

    final settings = getIt<Settings>();

    // Prevent multiple updates happening at once (happens when multiple
    // notifications queue up while some android devices sleep and then flood
    // this callback when the device wakes up).
    final fiveMinutesAgo = DateTime.now().subtract(5.minutes);
    final lastUpdate = DateTime.fromMillisecondsSinceEpoch(
        settings.lastLocationUpdateTimestamp);
    if (lastUpdate.isAfter(fiveMinutesAgo)) {
      print(
          '\tCancelling update because we updated within the last 5 minutes.');
      return;
    }

    print('NOTIFICATION TYPE ${message.data['type']}');

    if (message.data['type'] == 'trigger_update_location') {
      print('Starting background task...\n');
      try {
        final credentials = getIt<Credentials>();
        final userId = credentials.userId;

        // Update location
        final locationService = getIt<LocationService>();
        final location = await locationService.getCurrentLocation();
        print('Got location: ${location.toJson()}');
        print('Got ref to location service...\n');
        await getIt<Api>().reportLocation(
          userId,
          location..source = LocationSource.background,
        );
        settings.lastLocationUpdateTimestamp =
            DateTime.now().millisecondsSinceEpoch;
        print('Updated location...\n');

        // Update Wifi ID
        final usersRepo = getIt<UsersRepo>();
        final wifiInfo = getIt<WifiInfo>();
        final currentWifiId = await wifiInfo.getIdentifier();
        print('Got current Wifi ID: $currentWifiId\n');
        final profile = await usersRepo.getProfileById(userId);
        final lastSavedWifiId = profile.currentNetworkId;
        print('Got last saved Wifi ID: $lastSavedWifiId\n');
        if (currentWifiId != lastSavedWifiId) {
          usersRepo.updateCurrentNetworkId(userId, currentWifiId);
          print('Updated Wifi ID to: $currentWifiId\n');
        } else {
          print('Skipped updating Wifi ID as it wasn\'t changed\n');
        }
      } catch (e, s) {
        print('\n\nERROR:\n$e\n\n$s');
      }
    }
  }
}
