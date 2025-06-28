import 'package:flutter/material.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/data/models/user_settings.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/settings/settings_action_item.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/widgets/custom_card.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/database/user_settings_repository.dart';

class NotificationsPage extends StatefulWidget {
  @override
  _NotificationsPageState createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final userSettingsRepository = getIt<UserSettingsRepository>();
  Future<UserSettingsModel> userSettingsModelFuture;
  final credentials = getIt<Credentials>();

  @override
  void initState() {
    userSettingsModelFuture = userSettingsRepository.getUserSettings(
      credentials.userId,
    );

    super.initState();
  }

  Widget _buildNotificationsItems(
    UserSettingsModel userSettings,
    S s,
  ) {
    return CustomCard(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(children: <Widget>[
          SettingsActionItem(
            name: s.labelNotificationsUseNotifications,
            description: s.labelNotificationsUseNotificationsDescription,
            actionItem: Switch(
              value: userSettings.notifications.notifyMe,
              onChanged: (value) {
                setState(() {
                  userSettings.notifications.notifyMe = value;
                  userSettingsRepository.updateUserSettings(
                    credentials.userId,
                    userSettings,
                  );
                });
              },
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildContent(S s) {
    return FutureBuilder(
      future: userSettingsModelFuture,
      builder:
          (BuildContext context, AsyncSnapshot<UserSettingsModel> snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text(s.messageProfileUnableToFetch));
        }

        if (snapshot.hasData) {
          return ListView(
            padding: EdgeInsets.all(12),
            children: [
              _buildNotificationsItems(snapshot.data, s),
            ],
          );
        }

        return Center(child: CircularProgressIndicator());
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();

    return Scaffold(
      appBar: AppAppBar(
        title: Text(s.titleNotifications),
        leading: Padding(
          padding: const EdgeInsetsDirectional.only(start: 8),
          child: AppBarBackButton(),
        ),
      ),
      body: _buildContent(s),
    );
  }
}
