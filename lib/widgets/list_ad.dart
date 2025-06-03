import 'dart:io';

import 'package:admob_flutter/admob_flutter.dart';
import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';

class ListAd extends StatelessWidget {
  final String androidAdUnit;
  final String iosAdUnit;

  ListAd({
    @required this.androidAdUnit,
    @required this.iosAdUnit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: ColorSet.of(context).surface,
      child: LayoutBuilder(builder: (context, constraints) {
        return AdmobBanner(
          adUnitId: Platform.isAndroid ? androidAdUnit : iosAdUnit,
          adSize: AdmobBannerSize.ADAPTIVE_BANNER(
            width: constraints.maxWidth.toInt(),
          ),
        );
      }),
    );
  }
}
