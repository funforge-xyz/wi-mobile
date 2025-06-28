import 'package:flutter/material.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/database.dart';
import 'package:wi/data/local/permissions.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/services/notifications_service.dart';

class LocationServiceDialog {
  static Future show(BuildContext context) {
    final permissions = getIt<Permissions>();
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        final s = strings();
        return AlertDialog(
          title: Text(s.titlePermsLocationServicesDisabled),
          content: Text(s.messagePermsLocationServicesDisabled),
          actions: <Widget>[
            FlatButton(
              child: Text(s.actionPermsOpenSettings),
              onPressed: () {
                permissions.openLocationSettings();
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  static _doLogout(BuildContext context) async {
    final nav = Navigator.of(context, rootNavigator: true);
    final database = getIt<Database>();
    final credentials = getIt<Credentials>();
    final notifs = getIt<NotificationsService>();
    final auth = getIt<Auth>();
    final usersRepo = getIt<UsersRepo>();
    final userId = credentials.userId;

    await database.clear();
    await notifs.unregister();
    usersRepo.setUserOffline(userId);
    await auth.signOut();
    nav.popUntil((route) => route.isFirst);
    nav.pushReplacementNamed(Routes.LOGIN);
  }
}
