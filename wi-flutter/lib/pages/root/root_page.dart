import 'package:flutter/material.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/data/local/credentials.dart';

class RootPage extends StatefulWidget {
  @override
  _RootPageState createState() => _RootPageState();
}

class _RootPageState extends State<RootPage> {
  AuthStatus authStatus = AuthStatus.UNKNOWN;
  Auth auth = getIt<Auth>();
  final credentials = getIt<Credentials>();

  @override
  void initState() {
    super.initState();

    auth.getCurrentUser().then((user) {
      _determineAuthStatus(user?.uid);
    }).catchError((_) => _determineAuthStatus(null));
  }

  _determineAuthStatus(String userId) {
    if (userId != null) {
      credentials.userId = userId;
      Navigator.of(context).pushReplacementNamed(Routes.HOME);
    } else {
      Navigator.of(context).pushReplacementNamed(Routes.WELCOME);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
          alignment: Alignment.center,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              CircularProgressIndicator(),
              Text("Splash Screen here???")
            ],
          )),
    );
  }
}
