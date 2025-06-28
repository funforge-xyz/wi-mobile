import 'package:flutter/material.dart';
import 'package:wi/di.dart';

class DeleteDialog {
  static show({
    @required BuildContext context,
    String title,
    String message,
    @required Function onYes,
  }) {
    final s = strings();
    showDialog<Null>(
      context: context,
      builder: (BuildContext ctx) {
        return AlertDialog(
          title: Text(title),
          content: message == null ? null : Text(message),
          actions: <Widget>[
            FlatButton(
              child: Text(s.actionCommonCancel),
              onPressed: () => Navigator.of(context).pop(),
            ),
            FlatButton(
              child: Text(
                s.actionCommonDelete,
                style: TextStyle(
                  color: Colors.red,
                ),
              ),
              onPressed: () {
                onYes();
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }
}
