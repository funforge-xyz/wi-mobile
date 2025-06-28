import 'dart:math';

import 'package:flutter/material.dart';
import 'package:vector_math/vector_math_64.dart' as vector;
import 'package:wi/config/colors.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/permissions.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/services/location.dart';
import 'package:wi/services/notifications_service.dart';
import 'package:wi/widgets/submit_button.dart';

class PermissionsPage extends StatefulWidget {
  final String nextRoute;
  final dynamic nextRouteArgs;
  final bool replaceRoute;

  PermissionsPage._({
    @required this.nextRoute,
    @required this.nextRouteArgs,
    @required this.replaceRoute,
  });

  static bool _showing = false;

  static Future show(
    BuildContext context, {
    @required String nextRoute,
    dynamic nextRouteArgs,
    bool replaceRoute = false,
  }) async {
    if (_showing) return;
    final location = await getIt<Permissions>().locationWhenInUseStatus();
    if (location.isGranted()) {
      _proceed(context, nextRoute, nextRouteArgs, replaceRoute);
      return;
    }
    final route = MaterialPageRoute(
      builder: (_) => PermissionsPage._(
        nextRoute: nextRoute,
        nextRouteArgs: nextRouteArgs,
        replaceRoute: replaceRoute,
      ),
    );
    _showing = true;
    if (replaceRoute) {
      return Navigator.of(context).pushReplacement(route);
    } else {
      return Navigator.of(context).push(route);
    }
  }

  static _proceed(
    BuildContext context,
    String nextRoute,
    dynamic nextRouteArgs,
    bool replaceRoute,
  ) async {
    // Upload location to ensure the user's initial home screen experience
    // works well.
    await _reportLastKnownLocation();

    // We perform this check here to ensure notif registration takes place
    // even if the permissions page is skipped when all permissions are already
    // granted (e.g. when the user logged out and is logging back in).
    final permissions = getIt<Permissions>();
    final notifications = getIt<NotificationsService>();
    final notifPerm = await permissions.notificationsStatus();
    if (notifPerm.isGranted()) {
      await notifications.register();
    }

    if (nextRoute == 'pop') {
      Navigator.of(context).pop();
    } else {
      if (replaceRoute) {
        Navigator.of(context).pushReplacementNamed(
          nextRoute,
          arguments: nextRouteArgs,
        );
      } else {
        Navigator.of(context).pushNamed(
          nextRoute,
          arguments: nextRouteArgs,
        );
      }
    }

    _showing = false;
  }

  static Future<void> _reportLastKnownLocation() async {
    final permissions = getIt<Permissions>();
    final locationService = getIt<LocationService>();
    final credentials = getIt<Credentials>();

    final locationWhenInUse = await permissions.locationWhenInUseStatus();
    final serviceEnabled = await permissions.locationServiceEnabled();
    if (locationWhenInUse.isGranted() && serviceEnabled) {
      await locationService.reportLastKnownLocation(credentials.userId);
    }
  }

  @override
  PermissionsPageState createState() => PermissionsPageState();
}

class PermissionsPageState extends State<PermissionsPage>
    with TickerProviderStateMixin {
  final _permissions = getIt<Permissions>();
  final _notifications = getIt<NotificationsService>();

  Animation<double> _shakeAnim;
  AnimationController _shakeAnimCtrl;

  PermissionStatus storagePerm;
  PermissionStatus notifPerm;
  PermissionStatus locationPerm;
  PermissionStatus motionPerm;

  @override
  initState() {
    _shakeAnimCtrl = AnimationController(vsync: this, duration: 0.5.seconds);
    _shakeAnim = 0.0.tweenTo(10.0).animatedBy(_shakeAnimCtrl);
    super.initState();
  }

  _request(BuildContext context) async {
    final locationAlways = await _permissions.requestLocationAlways();
    final notif = await _permissions.requestNotifications();
    if (notif.isGranted()) {
      await _notifications.register();
    }
    if (locationAlways.isDenied()) {
      final locationWhenInUse = await _permissions.requestLocationWhenInUse();
      if (locationWhenInUse.isDenied()) {
        _showLocationPermDeniedErrorMessage(context);
      } else {
        await _proceed(context);
      }
    } else {
      await _proceed(context);
    }
  }

  Future _proceed(BuildContext context) async {
    PermissionsPage._proceed(
      context,
      widget.nextRoute,
      widget.nextRouteArgs,
      widget.replaceRoute,
    );
  }

  _showLocationPermDeniedErrorMessage(BuildContext context) {
    final s = strings();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(
          s.messagePermsLocationDenied,
        ),
        actions: [
          FlatButton(
            child: Text(s.actionPermsOpenSettings),
            onPressed: () async {
              await _permissions.openAppSettings();
              Navigator.of(context).pop();
              final status = await _permissions.locationWhenInUseStatus();
              if (status.isGranted()) {
                _proceed(context);
              }
            },
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final colorSet = ColorSet.of(context);
    return WillPopScope(
      onWillPop: () async {
        _shakeAnimCtrl.forward(from: 0);
        return false;
      },
      child: Scaffold(
        body: AnimatedBuilder(
          animation: _shakeAnim,
          builder: (context, child) {
            double progress = _shakeAnimCtrl.value;
            double offset = sin(progress * pi * 10);
            return Transform(
              transform:
                  Matrix4.translation(vector.Vector3(2 * offset, 0.0, 0.0)),
              child: child,
            );
          },
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    s.labelPermsWiNeedsAccessTo,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: colorSet.textLight,
                    ),
                  ),
                  SizedBox(height: 16),
                  _PermissionRow(
                    icon: Icons.location_on,
                    title: s.labelPermsLocation,
                    text: s.messagePermsLocation,
                  ),
                  _PermissionRow(
                    icon: Icons.notifications,
                    title: s.labelPermsNotifications,
                    text: s.messagePermsNotifications,
                    optional: true,
                  ),
                  _PermissionRow(
                    icon: Icons.more_horiz,
                    text: s.messagePermsOther,
                    passive: true,
                  ),
                  SizedBox(height: 16),
                  SubmitButton(
                    onPressed: () => _request(context),
                    child: Text(s.actionCommonAllow),
                  ),
                  SizedBox(height: 8),
                  SizedBox(
                    width: double.maxFinite,
                    child: FlatButton(
                      child: Text(
                        s.actionSkipForNow,
                        style: TextStyle(
                          color: colorSet.textLighter,
                        ),
                      ),
                      onPressed: () => _proceed(context),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PermissionRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String text;
  final bool optional;
  final bool passive;

  _PermissionRow({
    @required this.icon,
    this.title,
    @required this.text,
    this.optional = false,
    this.passive = false,
  });

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final colorSet = ColorSet.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(4),
              color: passive != true
                  ? colorSet.primary.withOpacity(0.9)
                  : colorSet.textLighter.withOpacity(0.14),
            ),
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Icon(
                icon,
                color: passive != true
                    ? Colors.white.withOpacity(0.9)
                    : colorSet.textLighter,
              ),
            ),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (title != null)
                      Text(
                        title,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    if (optional) ...[
                      SizedBox(width: 4),
                      Text(
                        s.labelPermsOptional,
                        style: TextStyle(
                          color: colorSet.textLighter,
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  text,
                  style: TextStyle(
                    color: colorSet.textLighter,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
