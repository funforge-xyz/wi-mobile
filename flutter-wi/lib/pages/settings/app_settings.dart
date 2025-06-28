import 'package:flutter/material.dart';
import 'package:wi/data/local/permissions.dart';
import 'package:wi/di.dart';

class AppSettings extends StatefulWidget {
  @override
  _AppSettingsState createState() => _AppSettingsState();
}

class _AppSettingsState extends State<AppSettings> with WidgetsBindingObserver {
  final _permissions = getIt<Permissions>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      setState(() {
        // Do nothing. Lazy way to reload bg location tracking permission.
      });
      // Don't bother syncing change to server as HomePage will do that.
    }
  }

  Future<bool> _bgLocationEnabled() async {
    final status = await _permissions.locationAlwaysStatus();
    print(status);
    return status.isGranted();
  }

  _openLocationSettings() {
    _permissions.openAppSettings();
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    return Column(
      children: <Widget>[
        FutureBuilder<bool>(
          future: _bgLocationEnabled(),
          builder: (context, snapshot) {
            final enabled = snapshot.data == true;
            return ListTile(
              onTap: _openLocationSettings,
              title: Text(s.labelSettingsAppBackgroundLocation),
              subtitle: Text(
                enabled
                    ? s.messageSettingsAppBackgroundLocationEnabled
                    : s.messageSettingsAppBackgroundLocationDisabled,
              ),
            );
          },
        ),
      ],
    );
  }
}
