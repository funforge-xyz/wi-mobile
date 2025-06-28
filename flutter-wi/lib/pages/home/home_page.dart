import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/database.dart';
import 'package:wi/data/local/permissions.dart';
import 'package:wi/data/local/settings.dart';
import 'package:wi/data/local/wifi_info.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/data/repo/notifications_repo.dart';
import 'package:wi/data/repo/threads_repo.dart';
import 'package:wi/data/repo/user_settings_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/pages/add/add_post_page.dart';
import 'package:wi/pages/camera/camera_page.dart';
import 'package:wi/pages/feed/feed_page.dart';
import 'package:wi/pages/messages/messages_page.dart';
import 'package:wi/pages/nearby/nearby_page.dart';
import 'package:wi/pages/profile/profile_view_page.dart';
import 'package:wi/services/location.dart';
import 'package:wi/services/notifications_service.dart';
import 'package:wi/utils/logger.dart';
import 'package:wi/widgets/counter_badge.dart';
import 'package:wi/widgets/custom_icon.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage>
    with WidgetsBindingObserver, TickerProviderStateMixin {
  final _notifications = getIt<NotificationsService>();
  final _locationService = getIt<LocationService>();
  final _notifsRepo = getIt<NotificationsRepo>();
  final _threadsRepo = getIt<ThreadsRepo>();
  final _usersRepo = getIt<UsersRepo>();
  final _userSettingsRepo = getIt<UserSettingsRepo>();
  final _permissions = getIt<Permissions>();
  final _credentials = getIt<Credentials>();
  final _wifiInfo = getIt<WifiInfo>();
  final _database = getIt<Database>();
  final _settings = getIt<Settings>();

  final _unopenedNotifsFetcher = StreamFetcher<int>();

  AnimationController _fabAnimCtrl;

  int pageIndex = 0;
  bool showNotificationsPage = false;

  /// Passed on to Feed page to inform it to jump to this post when it loads.
  /// Used when forwarding user after they add a new post.
  String postToJumpTo;

  bool _locationPermissionGranted = true;
  bool _locationServiceEnabled = true;

  @override
  void initState() {
    super.initState();

    _unopenedNotifsFetcher.use(
      () => _notifsRepo.getUnopenedCount(_credentials.userId),
    );
    _unopenedNotifsFetcher.load();

    _checkEssentialPermissionsAndRequestIfNeeded();
    _syncBackgroundLocationStatusWithServer();
    _syncWifiIdChangesWithServer();
    _cacheProfileIfNotAlreadyCached();

    WidgetsBinding.instance.addObserver(this);
    _notifications.start(context);

    _notifications.addListener((type, json, fromForeground) {
      if (fromForeground) return;
      if (type == NotificationsService.TYPE_COMMENTS_SUMMARY ||
          type == NotificationsService.TYPE_LIKES_SUMMARY) {
        setState(() {
          pageIndex = 3;
          showNotificationsPage = true;
        });
        Future.delayed(2.seconds, () {
          // Set it back to false without setting state to prevent opening
          // notifications every time after this. Not great but will do.
          showNotificationsPage = false;
        });
      }
    });

    _fabAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkEssentialPermissionsAndRequestIfNeeded();
      _startLocationTracking();
      _syncBackgroundLocationStatusWithServer();
      _updateWifiIdIfNeeded();
    } else if (state == AppLifecycleState.paused) {
      _locationService.stopTracking();
      // Ask for bg location permission if we haven't before.
      if (!_settings.askedForBgLocPermOnPause) {
        _permissions.requestLocationAlways();
        _settings.askedForBgLocPermOnPause = true;
      }
    }
  }

  _syncBackgroundLocationStatusWithServer() {
    _userSettingsRepo.updateBackgroundTrackingStatus(_credentials.userId);
  }

  _syncWifiIdChangesWithServer() async {
    final userId = _credentials.userId;
    // Record changes. Listening to changes will generate an initial update
    // as well, so no need to update manually here.
    _wifiInfo.onWifiChange().distinct().listen((wifiId) {
      _usersRepo.updateCurrentNetworkId(userId, wifiId);
    });
  }

  _updateWifiIdIfNeeded() async {
    // Getting Wifi name requires location service
    final locationEnabled = await _permissions.locationServiceEnabled();
    if (!locationEnabled) {
      Logger.log('_updateWifiIdIfNeeded - location service disabled');
      return;
    }

    final userId = _credentials.userId;
    final profile = await _usersRepo.getProfileById(userId);
    final lastSavedWifiId = profile.currentNetworkId;
    final currentWifiId = await _wifiInfo.getIdentifier();
    if (currentWifiId != lastSavedWifiId) {
      _usersRepo.updateCurrentNetworkId(userId, currentWifiId);
    }
  }

  _checkEssentialPermissionsAndRequestIfNeeded() async {
    final location = await _permissions.locationWhenInUseStatus();
    final serviceEnabled = await _permissions.locationServiceEnabled();

    if (location.isGranted() != _locationPermissionGranted ||
        serviceEnabled != _locationServiceEnabled) {
      setState(() {
        _locationPermissionGranted = location.isGranted();
        _locationServiceEnabled = serviceEnabled;
      });
    }
  }

  _startLocationTracking() async {
    // Tracking requires location service
    final locationEnabled = await _permissions.locationServiceEnabled();
    if (!locationEnabled) {
      Logger.log('_startLocationTracking - location service disabled');
      return;
    }

    _locationService.startTracking();
  }

  /// Caches the logged in user's profile details in our local storage.
  /// This temporarily done here, when the app starts, as a fix for users who
  /// were logged in when we started depending on local cache and who didn't log
  /// out and back in yet.
  _cacheProfileIfNotAlreadyCached() async {
    if (!_database.profileExists) {
      final profile = await _usersRepo.getProfileById(_credentials.userId);
      _database.putProfile(profile);
    }
  }

  _onNavItemPress(int index) {
    setState(() => pageIndex = index);
    _dismissAddOptions();
  }

  _dismissAddOptions() {
    if (_fabAnimCtrl.isCompleted) {
      _fabAnimCtrl.reverse();
    }
  }

  _onCreatePostTap() {
    setState(() => pageIndex = 2);
  }

  /// Called when the user takes a photo in the camera page and needs to be
  /// redirected to the Add Post page.
  _onCameraResult(BuildContext context, CameraResult result) async {
    final id = await AddPostPage.show(context, result);
    if (id == null) return;
    print('post added: $id');
    postToJumpTo = id;
    _onNavItemPress(0); // Feed

    // Don't forget to reset. Not the best method but 2 seconds should be enough
    // for the state change to cause the FeedPage to load with the correct value.
    Future.delayed(2.seconds, () => postToJumpTo = null);
  }

  @override
  Widget build(BuildContext context) {
    // return Scaffold(body: AddPage());
    final s = strings();
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);
    final showingCamera = pageIndex == 2;
    final showingFeedOrCamera = pageIndex == 0 || showingCamera;
    final iconColor = showingFeedOrCamera ? Colors.white : null;
    return Scaffold(
      extendBody: showingFeedOrCamera,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: showingCamera
          ? null
          : BottomAppBar(
              color: showingFeedOrCamera
                  ? showingCamera
                      ? C.cameraOverlay
                      : Colors.black38
                  : null,
              elevation: showingFeedOrCamera ? 0 : null,
              child: Container(
                height: 64,
                child: Row(
                  children: [
                    Expanded(
                      child: _buildTabItem(
                        context: context,
                        index: 0,
                        iconBuilder: (color) =>
                            CustomIcon(I.feed, color: color),
                        onPressed: _onNavItemPress,
                        color: iconColor,
                      ),
                    ),
                    Expanded(
                      child: _buildTabItem(
                        context: context,
                        index: 1,
                        iconBuilder: (color) =>
                            CustomIcon(I.nearby, color: color),
                        onPressed: _onNavItemPress,
                        color: iconColor,
                      ),
                    ),
                    Expanded(
                      child: _buildTabItem(
                        context: context,
                        index: 2,
                        onPressed: _onNavItemPress,
                        iconBuilder: (color) => CustomIcon(I.add, color: color),
                        color: iconColor,
                      ),
                    ),
                    StreamBuilder<int>(
                      stream: _threadsRepo.getUnreadCount(_credentials.userId),
                      initialData: 0,
                      builder: (context, snapshot) {
                        final unreadMessagesCount = snapshot.data ?? 0;
                        return StreamBuilder<Resource<int>>(
                          stream: _unopenedNotifsFetcher.stream,
                          initialData: Resource.success(0),
                          builder: (context, snapshot) {
                            final unreadNotifsCount = snapshot.data?.data ?? 0;
                            return Expanded(
                              child: _buildBottomNavigationBarItemWithCounter(
                                context: context,
                                index: 3,
                                icon: I.messages,
                                onPress: _onNavItemPress,
                                count: unreadMessagesCount + unreadNotifsCount,
                                color: iconColor,
                              ),
                            );
                          },
                        );
                      },
                    ),
                    Expanded(
                      child: _buildTabItem(
                        context: context,
                        index: 4,
                        iconBuilder: (color) =>
                            CustomIcon(I.myProfile, color: color),
                        onPressed: _onNavItemPress,
                        color: iconColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
      body: [
        FeedPageNew(
          postToJumpTo: postToJumpTo,
          onCreatePostTap: _onCreatePostTap,
        ),
        NearbyPage(),
        CameraPage(
          callback: (result) => _onCameraResult(context, result),
          onCancel: () => setState(() => pageIndex = 0),
        ),
        MessagesPage(startWithNotifications: showNotificationsPage),
        ProfileViewPage(_credentials.userId, false, true),
      ][pageIndex],
    );
  }

  _buildBottomNavigationBarItemWithCounter({
    BuildContext context,
    int index,
    CustomIconData icon,
    ValueChanged<int> onPress,
    int count,
    Color color,
  }) {
    return SizedBox(
      height: 64,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned.fill(
            child: _buildTabItem(
              context: context,
              iconBuilder: (color) => CustomIcon(icon, color: color),
              index: index,
              onPressed: onPress,
              color: color,
            ),
          ),
          Align(
            alignment: AlignmentDirectional.topEnd,
            child: Padding(
              padding: const EdgeInsetsDirectional.only(end: 16, top: 8),
              child: CounterBadge(count ?? 0),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabItem({
    BuildContext context,
    Widget Function(Color) iconBuilder,
    int index,
    ValueChanged<int> onPressed,
    Color color,
  }) {
    final theme = Theme.of(context);
    final c = pageIndex == index ? theme.primaryColor : color;
    return SizedBox(
      height: 64,
      child: InkWell(
        onTap: () => onPressed(index),
        child: Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: iconBuilder(c),
          ),
        ),
      ),
    );
  }
}
