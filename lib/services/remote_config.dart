import 'package:firebase_remote_config/firebase_remote_config.dart' as frc;

class _Keys {
  /// The minimum distance (in meters) the device must move horizontally before
  /// a location update happens.
  static const LOCATION_DISTANCE_FILTER = 'location_distance_filter';
}

abstract class RemoteConfig {
  int getLocationDistanceFilter();
}

class RemoteConfigImpl extends RemoteConfig {
  frc.RemoteConfig _instance;

  RemoteConfigImpl() {
    _init();
  }

  _init() async {
    _instance = await frc.RemoteConfig.instance;
    final defaults = <String, dynamic>{
      _Keys.LOCATION_DISTANCE_FILTER: 100,
    };
    _instance.setDefaults(defaults);
  }

  @override
  int getLocationDistanceFilter() {
    return _instance.getInt(_Keys.LOCATION_DISTANCE_FILTER);
  }
}
