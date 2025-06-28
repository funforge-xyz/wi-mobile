import 'package:flutter/material.dart';
import 'package:wi/data/local/permissions.dart';
import 'package:wi/di.dart';

class RequiresLocationPermission extends StatelessWidget {
  final WidgetBuilder permissionNotGrantedBuilder;
  final WidgetBuilder serviceDisabledBuilder;
  final WidgetBuilder builder;

  RequiresLocationPermission({
    @required this.permissionNotGrantedBuilder,
    @required this.serviceDisabledBuilder,
    @required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    final permissions = getIt<Permissions>();

    return FutureBuilder(
      future: Future.wait([
        permissions.locationWhenInUseStatus(),
        permissions.locationServiceEnabled(),
      ]),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return Container();
        }

        final PermissionStatus permissionStatus = snapshot.data[0];
        final bool serviceEnabled = snapshot.data[1];

        if (!permissionStatus.isGranted()) {
          return permissionNotGrantedBuilder(context);
        }

        if (!serviceEnabled) {
          return serviceDisabledBuilder(context);
        }

        return builder(context);
      },
    );
  }
}
