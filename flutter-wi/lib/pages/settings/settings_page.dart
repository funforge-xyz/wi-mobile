import 'package:flutter/material.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/settings/account_settings.dart';
import 'package:wi/pages/settings/app_settings.dart';
import 'package:wi/pages/settings/developer_settings.dart';
import 'package:wi/pages/settings/dialog_logout.dart';
import 'package:wi/pages/settings/settings_section_label.dart';
import 'package:wi/pages/settings/notifications_settings.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';

class SettingsPage extends StatefulWidget {
  @override
  _SettingsPageState createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  _onLogoutTap(BuildContext context) => LogoutDialog.show(context);

  @override
  Widget build(BuildContext context) {
    final s = strings();
    return Scaffold(
      appBar: AppAppBar(
        title: Text(s.titleSettings),
        leading: Padding(
          padding: const EdgeInsetsDirectional.only(start: 8),
          child: AppBarBackButton(),
        ),
      ),
      body: ListView(
        physics: ClampingScrollPhysics(),
        children: [
          SettingsSectionLabel(s.labelSettingsApp),
          AppSettings(),
          SizedBox(height: 16),
          SettingsSectionLabel('Account'),
          AccountSettings(),
          SizedBox(height: 16),
          SettingsSectionLabel('Notifications'),
          NotificationsSettings(),
          SizedBox(height: 16),
          SettingsSectionLabel(s.labelSettingsDeveloper),
          DeveloperSettings(),
          SizedBox(height: 16),
          SettingsSectionLabel('Other'),
          ListTile(
            title: Text(s.labelSettingsInviteFriends),
            subtitle: Text(s.labelSettingsInviteFriendsDescription),
            onTap: () {},
          ),
          ListTile(
            title: Text(
              s.labelSettingsLogout,
              style: TextStyle(color: Colors.red[600]),
            ),
            onTap: () => _onLogoutTap(context),
          ),
        ],
      ),
    );
  }
}
