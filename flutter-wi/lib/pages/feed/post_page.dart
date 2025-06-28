import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:wi/pages/feed/post_item.dart';
import 'package:wi/theme.dart';

class PostPage extends StatelessWidget {
  final String id;
  PostPage(this.id);

  static Future show(BuildContext context, String id) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PostPage(id),
        fullscreenDialog: true,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Theme(
        data: AppTheme.dark,
        child: Scaffold(
          backgroundColor: Colors.black,
          body: PostItem(
            id: id,
            showCloseButton: true,
            onDelete: () {
              Navigator.of(context).pop();
            },
          ),
        ),
      ),
    );
  }
}
