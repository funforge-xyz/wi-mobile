import 'package:app_settings/app_settings.dart';
import 'package:permission_handler/permission_handler.dart' as ph;

enum PermissionStatus {
  granted,
  denied,
  restricted,
  permanentlyDenied,
  serviceDisabled,
}

extension PermissionStatusExts on PermissionStatus {
  bool isGranted() => this == PermissionStatus.granted;

  bool isDenied() =>
      this == PermissionStatus.denied ||
      this == PermissionStatus.permanentlyDenied;

  bool isRestricted() => this == PermissionStatus.restricted;

  bool isPermanentlyDenied() => this == PermissionStatus.permanentlyDenied;

  bool isServiceDisabled() => this == PermissionStatus.serviceDisabled;
}

extension _PermissionStatusExts on ph.PermissionStatus {
  PermissionStatus convert() {
    switch (this) {
      case ph.PermissionStatus.granted:
        return PermissionStatus.granted;
      case ph.PermissionStatus.restricted:
        return PermissionStatus.restricted;
      case ph.PermissionStatus.permanentlyDenied:
        return PermissionStatus.permanentlyDenied;
      case ph.PermissionStatus.undetermined:
      case ph.PermissionStatus.denied:
      default:
        return PermissionStatus.denied;
    }
  }
}

PermissionStatus _getPermissionStatus(
  ph.PermissionStatus permStatus,
  ph.ServiceStatus serviceStatus,
) {
  final status = permStatus.convert();
  final serviceIsOn = serviceStatus == ph.ServiceStatus.notApplicable ||
      serviceStatus == ph.ServiceStatus.enabled;
  return status != PermissionStatus.granted
      ? status
      : serviceIsOn
          ? status
          : PermissionStatus.serviceDisabled;
}

abstract class Permissions {
  Future<PermissionStatus> locationStatus();

  Future<bool> locationServiceEnabled();

  Future<PermissionStatus> requestLocationAlways();

  Future<PermissionStatus> requestLocationWhenInUse();

  Future<PermissionStatus> locationAlwaysStatus();

  Future<PermissionStatus> locationWhenInUseStatus();

  Future<PermissionStatus> notificationsStatus();

  Future<PermissionStatus> requestNotifications();

  Future openAppSettings();

  Future openLocationSettings();
}

class PermissionsImpl extends Permissions {
  @override
  Future<PermissionStatus> locationStatus() async {
    final permStatus = await ph.Permission.locationAlways.status;
    final serviceStatus = await ph.Permission.locationAlways.serviceStatus;
    return _getPermissionStatus(permStatus, serviceStatus);
  }

  @override
  Future<bool> locationServiceEnabled() async {
    final serviceStatus = await ph.Permission.locationWhenInUse.serviceStatus;
    return serviceStatus.isEnabled || serviceStatus.isNotApplicable;
  }

  @override
  Future<PermissionStatus> requestLocationAlways() async {
    final status = await ph.Permission.locationAlways.request();
    return status.convert();
  }

  @override
  Future<PermissionStatus> requestLocationWhenInUse() async {
    final status = await ph.Permission.locationWhenInUse.request();
    return status.convert();
  }

  @override
  Future<PermissionStatus> locationAlwaysStatus() async {
    final status = await ph.Permission.locationAlways.status;
    return status.convert();
  }

  @override
  Future<PermissionStatus> locationWhenInUseStatus() async {
    final status = await ph.Permission.locationWhenInUse.status;
    return status.convert();
  }

  @override
  Future<PermissionStatus> notificationsStatus() async {
    final status = await ph.Permission.notification.status;
    return status.convert();
  }

  @override
  Future<PermissionStatus> requestNotifications() async {
    final status = await ph.Permission.notification.request();
    return status.convert();
  }

  @override
  Future openAppSettings() {
    return ph.openAppSettings();
  }

  @override
  Future openLocationSettings() {
    return AppSettings.openLocationSettings();
  }
}
