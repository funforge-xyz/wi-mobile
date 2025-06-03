import 'dart:async';

import 'package:wi/data/local/settings.dart';
import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:geolocator/geolocator.dart' as geoloc;
import 'package:json_annotation/json_annotation.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/di.dart';
import 'package:wi/services/remote_config.dart';
import 'package:wi/exts/all.dart';

enum LocationSource { foreground, background }

extension LocationSourceExts on LocationSource {
  String get value =>
      this == LocationSource.foreground ? 'foreground' : 'background';
}

@JsonSerializable()
class Location {
  final double latitude;
  final double longitude;
  LocationSource source;

  Location({
    this.longitude,
    this.latitude,
    this.source,
  });

  factory Location._fromPluginPosition(
    geoloc.Position position,
    LocationSource source,
  ) {
    return Location(
      longitude: position?.longitude,
      latitude: position?.latitude,
      source: source,
    );
  }

  factory Location.fromJson(Map<String, dynamic> json) => Location(
        latitude: json['latitude'],
        longitude: json['longitude'],
        source: json['source'] == 'foreground'
            ? LocationSource.foreground
            : LocationSource.background,
      );
  Map<String, dynamic> toJson() => {
        'latitude': latitude,
        'longitude': longitude,
        'source': source.value,
      };
}

abstract class LocationService {
  Future<Location> getCurrentLocation();
  Future<Location> getLastKnownLocation();
  Future<Resource> reportLastKnownLocation(String userId);
  Future startTracking();
  Future stopTracking();
}

class LocationServiceImpl extends LocationService {
  final _credentials = getIt<Credentials>();
  final _settings = getIt<Settings>();
  final _remoteConf = getIt<RemoteConfig>();
  final _api = getIt<Api>();

  StreamSubscription _subscription;

  @override
  Future<Location> getCurrentLocation() async {
    final current = await geoloc.getCurrentPosition();
    return Location._fromPluginPosition(current, LocationSource.foreground);
  }

  @override
  Future<Location> getLastKnownLocation() async {
    final lastKnown = await geoloc.getLastKnownPosition();
    return Location._fromPluginPosition(lastKnown, LocationSource.foreground);
  }

  @override
  Future<Resource> reportLastKnownLocation(String userId) async {
    final loc = await getLastKnownLocation();
    return await _api.reportLocation(userId, loc);
  }

  /// Starts foreground tracking.
  @override
  Future startTracking() async {
    print('TRACK START');
    final stream = geoloc.getPositionStream(
      distanceFilter: _remoteConf.getLocationDistanceFilter(),
    );
    _subscription = stream.listen((position) {
      print('FOREGROUND LOCATION PING: $position');
      _handleLocationUpdateEvent(
        Location._fromPluginPosition(position, LocationSource.foreground),
      );
    });
  }

  /// Stops foreground tracking.
  @override
  Future stopTracking() async {
    print('TRACK STOP');
    _subscription?.cancel();
  }

  _handleLocationUpdateEvent(Location location) {
    print('''
      
      
      [location] - ${location.toJson()}
      
      
      ''');
    if (location == null) return;

    final fiveMinutesAgo = DateTime.now().subtract(5.minutes);
    final lastUpdate = DateTime.fromMillisecondsSinceEpoch(
        _settings.lastLocationUpdateTimestamp);
    if (lastUpdate.isAfter(fiveMinutesAgo)) {
      print(
        '\tIgnoring foreground location update because we updated '
        'within the last 5 minutes.',
      );
      return;
    }

    final userId = _credentials.userId;
    _api.reportLocation(userId, location);
  }
}
