import 'package:flutter/material.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/user_settings.dart';
import 'package:wi/di.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/repo/user_settings_repo.dart';

class NotificationsSettings extends StatelessWidget {
  final _settingsRepo = getIt<UserSettingsRepo>();
  final _credentials = getIt<Credentials>();

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final userId = _credentials.userId;
    return StreamBuilder<Document<UserSettingsModel>>(
      stream: _settingsRepo.getUserSettingsLive(userId),
      builder: (context, snapshot) {
        final checked = snapshot.data?.data?.notifications?.notifyMe == true;
        return SwitchListTile(
          title: Text(s.labelNotificationsUseNotifications),
          subtitle: Text(s.labelNotificationsUseNotificationsDescription),
          value: checked,
          onChanged: (value) {
            _settingsRepo.toggleNotifications(userId, value);
          },
        );
      },
    );
  }
}
