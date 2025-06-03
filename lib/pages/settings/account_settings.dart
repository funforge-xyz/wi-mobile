import 'package:flutter/material.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/routes.dart';

class AccountSettings extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final s = strings();
    return Column(
      children: <Widget>[
        ListTile(
          title: Text(s.labelAccountChangePassword),
          subtitle: Text(s.labelAccountChangePasswordDescription),
          onTap: () => Navigator.of(context).pushNamed(Routes.CHANGE_PASSWORD),
        ),
        ListTile(
          title: Text(s.labelAccountDelete),
          subtitle: Text(s.labelAccountDeleteDescription),
          onTap: () => Navigator.of(context).pushNamed(Routes.DELETE_ACCOUNT),
        )
      ],
    );
  }
}
