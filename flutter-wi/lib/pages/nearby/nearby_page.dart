import 'package:flutter/material.dart';
import 'package:wi/config/assets.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/permissions.dart';
import 'package:wi/data/local/wifi_info.dart';
import 'package:wi/data/models/ad_supported_list_item.dart';
import 'package:wi/data/models/nearby_users.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/nearby/nearby_person.dart';
import 'package:wi/pages/profile/profile_view_page.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/list_ad.dart';
import 'package:wi/widgets/requires_location_permission.dart';
import 'package:wi/widgets/resource_stream_builder.dart';
import 'package:wi/widgets/submit_button.dart';
import 'package:wi/widgets/sup/sup.dart';
import 'package:wi/data/local/blocked_info.dart';


class NearbyPage extends StatefulWidget {
  NearbyPage({Key key}) : super(key: key);

  @override
  _NearbyPageState createState() => _NearbyPageState();
}

class _NearbyPageState extends State<NearbyPage> {
  final _credentials = getIt<Credentials>();
  final _wifiInfo = getIt<WifiInfo>();
  final _usersRepo = getIt<UsersRepo>();

  final _fetcher = ResourceStreamFetcher<NearbyUsers>();
  final _blockedInfoFetcher = ResourceStreamFetcher<BlockedInfo>();

  String wifiIdentifier;

  @override
  initState() {
    _fetcher.use(() => _usersRepo.getNearbyUsers()).load();
    _blockedInfoFetcher.use(() => _usersRepo.getBlockedInfo()).load();

    _wifiInfo.onWifiChange().listen(_onWifiIdentifierChange);

    _loadInitialWifiId();

    super.initState();
  }

  @override
  dispose() {
    _fetcher.dispose();
    super.dispose();
  }

  _loadInitialWifiId() async {
    final id = await _wifiInfo.getIdentifier();
    _onWifiIdentifierChange(id);
  }

  _onWifiIdentifierChange(String identifier) {
    if (wifiIdentifier == identifier) return;
    wifiIdentifier = identifier;
    _usersRepo.updateCurrentNetworkId(_credentials.userId, identifier);
    _fetcher.load();
  }

  _onViewProfileTap(String userId) {
    if (userId == null) return;
    ProfileViewPage.show(context, userId);
  }

  _requestLocationPermission() {
    getIt<Permissions>().requestLocationAlways();
  }

  _enableLocationService() {
    getIt<Permissions>().openLocationSettings();
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();

    return Scaffold(
      appBar: AppAppBar(
        title: Text(s.titleNearby),
      ),
      body: RequiresLocationPermission(
        permissionNotGrantedBuilder: (context) {
          return _EmptyState.locationPermissionNotGranted(
            onTap: _requestLocationPermission,
          );
        },
        serviceDisabledBuilder: (context) {
          return _EmptyState.locationServiceDisabled(
            onTap: _enableLocationService,
          );
        },
        builder: (context) {
          return StreamBuilder<Resource<BlockedInfo>>(
            stream: _blockedInfoFetcher.stream,
            builder: (context, snapshot)
          {
            final blockedInfo = snapshot.data?.data;

            return ResourceStreamBuilder<NearbyUsers>(
              stream: _fetcher.stream,
              onRetry: _fetcher.load,
              contentBuilder: (context, data) {
                if (data.data?.isEmpty == true) {
                  return _EmptyState.noUsers(
                    onRefresh: () => _fetcher.load(true),
                  );
                }

                final dataWithAds = data.data.expand((thread) {
                  final index = data.data.indexOf(thread);
                  final wrappedPerson = AdSupportedListItem(false, thread);
                  if (index != 0 && index % 4 == 0) {
                    final ad = AdSupportedListItem(true, null);
                    return [wrappedPerson, ad];
                  } else {
                    return [wrappedPerson];
                  }
                }).toList();
                return RefreshIndicator(
                  onRefresh: () => _fetcher.load(true),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemBuilder: (context, index) {
                      final item = dataWithAds[index];

                      if (item.isAd) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: ListAd(
                            androidAdUnit:
                            'ca-app-pub-8274717328460787/1605327181',
                            iosAdUnit: 'ca-app-pub-8274717328460787/3828984081',
                          ),
                        );
                      }

                      final person = item.item;

                      return NearbyPerson(
                        image: person.imageUrl,
                        name: person.name,
                        summary: person.about,
                        onSameWifi: person.sameWiFi == true,
                        onTap: () => _onViewProfileTap(person.externalUserId),
                        isBlocked: blockedInfo?.isBlocked(person.externalUserId) ?? false
                      );
                    },
                    itemCount: dataWithAds.length,
                  ),
                );
              },
              emptyBuilder: (context) =>
                  _EmptyState.noUsers(
                    onRefresh: () => _fetcher.load(true),
                  ),
            );
          }
          );
        },
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String title;
  final String message;
  final String buttonText;
  final Function onTap;
  final VoidCallback onRefresh;

  _EmptyState._({
    @required this.title,
    @required this.message,
    this.buttonText,
    this.onTap,
    this.onRefresh,
  });

  _EmptyState.noUsers({
    @required VoidCallback onRefresh,
  }) : this._(
          title: strings().titleNearbyNobodyAround,
          message: strings().messageNearbyNobodyAround,
          onRefresh: onRefresh,
        );

  _EmptyState.locationPermissionNotGranted({
    @required Function onTap,
  }) : this._(
          title: strings().titleLocationPermissionNeeded,
          message: strings().messageLocationPermissionNeededUsers,
          buttonText: strings().actionCommonAllow,
          onTap: onTap,
        );

  _EmptyState.locationServiceDisabled({
    @required Function onTap,
  }) : this._(
          title: strings().titleLocationServiceDisabled,
          message: strings().messageLocationServiceDisabledUsers,
          buttonText: strings().actionCommonAllow,
          onTap: onTap,
        );

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    final Widget content = ListView(
      children: [
        Padding(
          padding: EdgeInsets.only(
            left: 16,
            top: size.height * 0.1,
            right: 16,
            bottom: 16,
          ),
          child: Sup(
            image: Image.asset(
              A.image('nearby-empty'),
              width: 264,
            ),
            title: Text(title),
            subtitle: Text(message),
            bottom: buttonText == null || onTap == null
                ? null
                : SubmitButton(
                    onPressed: onTap,
                    child: Text(buttonText),
                  ),
          ),
        ),
      ],
    );

    if (onRefresh != null) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: content,
      );
    }

    return content;
  }
}
