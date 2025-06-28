import 'package:flutter/material.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/pages/settings/settings_action_item.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/widgets/custom_card.dart';

class AccountPage extends StatefulWidget {
  @override
  _AccountPageState createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  Widget _buildSecurityItems(S s) {
    return CustomCard(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(children: <Widget>[
          SettingsActionItem(
            name: s.labelAccountChangePassword,
            description: s.labelAccountChangePasswordDescription,
            onTap: () =>
                Navigator.of(context).pushNamed(Routes.CHANGE_PASSWORD),
          ),
          SettingsActionItem(
            name: s.labelAccountDelete,
            description: s.labelAccountDeleteDescription,
            onTap: () => Navigator.of(context).pushNamed(Routes.DELETE_ACCOUNT),
          )
        ]),
      ),
    );
  }

  Widget _buildContent(S s) {
    return ListView(
      padding: EdgeInsets.all(12),
      children: [
        _buildSecurityItems(s),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();

    return Scaffold(
      appBar: AppAppBar(
        title: Text(s.titleAccount),
        leading: Padding(
          padding: const EdgeInsetsDirectional.only(start: 8),
          child: AppBarBackButton(),
        ),
      ),
      body: _buildContent(s),
    );
  }
}
