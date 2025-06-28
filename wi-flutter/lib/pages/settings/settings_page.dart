import 'package:flutter/material.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/pages/settings/settings_item.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_action.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/data/database/profile_repository.dart';
import 'package:wi/widgets/custom_card.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/data/local/credentials.dart';

class SettingsPage extends StatefulWidget {
  @override
  _SettingsPageState createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  Future<ProfileModel> profileModelFuture;
  final credentials = getIt<Credentials>();

  final profileRepository = getIt<ProfileRepository>();
  final auth = getIt<Auth>();

  @override
  void initState() {
    profileModelFuture = _setCurrentProfile();

    super.initState();
  }

  Future<ProfileModel> _setCurrentProfile() async {
    final userId = credentials.userId;
    return await profileRepository.getProfileById(userId);
  }

  _onLogoutTap() async {
    await auth.signOut();
    Navigator.of(context).pushReplacementNamed(Routes.WELCOME);
  }

  Widget _buildContent(S s, ThemeData theme) {
    return FutureBuilder(
      future: profileModelFuture,
      builder: (BuildContext context, AsyncSnapshot<ProfileModel> snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text(s.messageProfileUnableToFetch));
        }

        if (snapshot.hasData) {
          return ListView(
            padding: EdgeInsets.all(12),
            children: [
              _buildProfileItem(snapshot.data),
              SizedBox(height: 16),
              _buildSettingsItems(s, theme),
              SizedBox(height: 16),
              _buildInviteFriendsItem(s),
            ],
          );
        }

        return Center(child: CircularProgressIndicator());
      },
    );
  }

  Widget _buildItemImage(Widget child, {Color backgroundColor = Colors.white}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: SizedBox(
        width: 56,
        height: 56,
        child: Container(
          child: child,
          decoration: BoxDecoration(color: backgroundColor),
        ),
      ),
    );
  }

  Widget _buildProfileItem(ProfileModel profileModel) {
    return CustomCard(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(children: <Widget>[
          SettingsItem(
            image: _buildItemImage(Image.network(profileModel.imageUrl)),
            name: profileModel.name,
            description: profileModel.about,
            onTap: () => Navigator.of(context).pushNamed(Routes.MY_PROFILE),
          )
        ]),
      ),
    );
  }

  Widget _buildSettingsItems(S s, ThemeData theme) {
    final backgroundColor = theme.brightness == Brightness.light
        ? Color(0xff262a50)
        : Color(0xfffbfbfb);
    final iconColor = theme.brightness == Brightness.light
        ? Color(0xffffffff)
        : Color(0xff262a50);

    return CustomCard(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(children: <Widget>[
          SettingsItem(
            image: _buildItemImage(
              CustomIcon(
                I.key,
                color: iconColor,
              ),
              backgroundColor: backgroundColor,
            ),
            name: s.labelSettingsAccount,
            description: s.labelSettingsAccountDescription,
            onTap: () => Navigator.of(context).pushNamed(Routes.ACCOUNT),
          ),
          SettingsItem(
            image: _buildItemImage(
              Icon(
                I.notifications,
                color: iconColor,
              ),
              backgroundColor: backgroundColor,
            ),
            name: s.labelSettingsNotifications,
            description: s.labelSettingsNotificationsDescription,
            onTap: () => Navigator.of(context).pushNamed(Routes.NOTIFICATIONS),
          ),
        ]),
      ),
    );
  }

  Widget _buildInviteFriendsItem(S s) {
    return CustomCard(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(children: <Widget>[
          SettingsItem(
            image: _buildItemImage(
              Icon(
                I.people,
                color: Color(0xffffffff),
              ),
              backgroundColor: Color(0xffffdb4a),
            ),
            name: s.labelSettingsInviteFriends,
            description: s.labelSettingsInviteFriendsDescription,
          ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppAppBar(
        title: Text(s.titleSettings),
        leading: Padding(
          padding: const EdgeInsetsDirectional.only(start: 8),
          child: AppBarBackButton(),
        ),
        actions: <Widget>[
          AppBarAction(
            child: Icon(I.logout),
            onTap: _onLogoutTap,
          ),
          SizedBox(width: 8),
        ],
      ),
      body: _buildContent(s, theme),
    );
  }
}
