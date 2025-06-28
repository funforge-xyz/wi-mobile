import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:photo_view/photo_view.dart';
import 'package:share/share.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/widgets/fading_material_route.dart';
import 'package:wi/exts/all.dart';

class FullscreenPhotoPage extends StatelessWidget {
  FullscreenPhotoPage(
    this.path, {
    this.isFile = false,
    this.showOpenInBrowserButton = true,
  });

  final String path;
  final bool isFile;
  final bool showOpenInBrowserButton;

  /// Creates and navigates to a new search page with given params.
  static show(
    BuildContext context,
    String url, {
    bool isFile = false,
    bool showOpenInBrowserButton = true,
  }) {
    Navigator.of(context).push(FadingMaterialRoute(
      builder: (BuildContext context) => FullscreenPhotoPage(
        url,
        isFile: isFile,
        showOpenInBrowserButton: showOpenInBrowserButton,
      ),
      fullscreenDialog: true,
    ));
  }

  _share(BuildContext context) async {
    if (isFile) {
      final RenderBox box = context.findRenderObject();
      Share.shareFiles(
        [path],
        sharePositionOrigin: box.localToGlobal(Offset.zero) & box.size,
      );
    } else {
      if (await canLaunch(path)) {
        await launch(path);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          elevation: 0.0,
          backgroundColor: Colors.black12,
          leading: AppBarBackButton(color: Colors.white),
          actions: showOpenInBrowserButton
              ? <Widget>[
                  Builder(
                    builder: (context) => IconButton(
                      icon: Icon(Icons.share),
                      onPressed: () => _share(context),
                      color: Colors.white,
                    ),
                  ),
                ]
              : [],
        ),
        body: Container(
          child: PhotoView(
            imageProvider: isFile
                ? FileImage(
                    File(path),
                  )
                : NetworkImage(path),
            heroAttributes: PhotoViewHeroAttributes(tag: path),
            minScale: PhotoViewComputedScale.contained,
            maxScale: PhotoViewComputedScale.covered * 2.0,
            loadingBuilder: (context, _) {
              return Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation(Colors.white),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
