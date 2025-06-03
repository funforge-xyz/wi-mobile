import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:wi/config/assets.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/permissions.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/repo/user_settings_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/services/location.dart';
import 'package:wi/utils/logger.dart';

class RootPage extends StatefulWidget {
  @override
  _RootPageState createState() => _RootPageState();
}

class _RootPageState extends State<RootPage>
    with WidgetsBindingObserver, SingleTickerProviderStateMixin {
  final _auth = getIt<Auth>();
  final _credentials = getIt<Credentials>();
  final _usersRepo = getIt<UsersRepo>();
  final _userSettingsRepo = getIt<UserSettingsRepo>();
  final _location = getIt<LocationService>();
  final _permissions = getIt<Permissions>();

  AuthStatus authStatus = AuthStatus.UNKNOWN;
  bool showProgressIndicator = false;

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addObserver(this);

    _init();

    Future.delayed(Duration(seconds: 3), () {
      if (mounted) {
        setState(() => showProgressIndicator = true);
      }
    });
  }

  Future _init() async {
    final user = _auth.getCurrentUser();
    final userId = user?.uid;
    if (userId != null) {
      // Store credentials
      _credentials.userId = userId;
      // Set online status
      ProfileModel profileModel = await _usersRepo.getProfileById(
        _credentials.userId,
      );

      profileModel.userActivityStatus.setOnline();
      _usersRepo.updateProfile(_credentials.userId, profileModel);

      // Update timezone
      await _userSettingsRepo.updateTimezoneInfoIfNeeded(userId);

      // Check location permission & service
      final locationStatus = await _permissions.locationWhenInUseStatus();
      final serviceEnabled = await _permissions.locationServiceEnabled();
      Logger.log('location status: $locationStatus, enabled: $serviceEnabled');
      if (locationStatus.isGranted() && serviceEnabled) {
        // Update location
        await _location.reportLastKnownLocation(userId);
      }

      // Navigate to home
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.of(context).pushReplacementNamed(Routes.HOME);
      });
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.of(context).pushReplacementNamed(Routes.LOGIN);
      });
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) async {
    if (_credentials.isAuthenticated()) {
      ProfileModel profileModel = await _usersRepo.getProfileById(
        _credentials.userId,
      );

      if (state == AppLifecycleState.resumed) {
        // user is online
        profileModel.userActivityStatus.setOnline();
      } else {
        // user is offline
        profileModel.userActivityStatus.setOffline();
      }

      _usersRepo.updateProfile(_credentials.userId, profileModel);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return Container(
      color: colorSet.background,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          SvgPicture.asset(
            A.icon('app_icon_color_on_white'),
            width: 64,
          ),
          SizedBox(height: 24),
          AnimatedOpacity(
            opacity: showProgressIndicator ? 1 : 0,
            duration: Duration(milliseconds: 300),
            child: SizedBox(
              width: 80,
              height: 2,
              child: LinearProgressIndicator(),
            ),
          ),
          SizedBox(height: 24),
        ],
      ),
    );
  }
}
