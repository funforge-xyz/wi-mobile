import 'package:flutter/material.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/di.dart';
import 'package:wi/services/location.dart';

class DeveloperSettings extends StatelessWidget {
  final _strings = strings();
  final _credentials = getIt<Credentials>();
  final _location = getIt<LocationService>();

  _updateLocation(BuildContext context) async {
    final result = await _location.reportLastKnownLocation(_credentials.userId);
    if (result.isSuccess()) {
      _showDialog(context, title: 'Success');
    } else {
      final reason =
          result.error?.stackTrace ?? result.error?.message ?? 'Unknown reason';
      _showDialog(context, title: 'Failure', message: reason);
    }
  }

  _showDialog(BuildContext context, {String title, String message}) {
    showDialog(
      context: context,
      builder: (context) {
        return SimpleDialog(
          title: Text(title ?? '?'),
          children: [
            if (message != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(message),
              ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(_strings.labelSettingsDeveloperUpdateLocation),
      subtitle: Text(_strings.messageSettingsDeveloperUpdateLocation),
      onTap: () => _updateLocation(context),
    );
  }
}
