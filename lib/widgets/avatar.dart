import 'package:flutter/material.dart';
import 'package:wi/data/storage/attachments_storage.dart';
import 'package:wi/di.dart';
import 'package:wi/widgets/cache_image.dart';
import 'package:wi/widgets/frame_builder.dart';
import 'package:wi/widgets/image_background.dart';
import 'package:wi/widgets/overlay_inkwell.dart';

class Avatar extends StatelessWidget {
  final String url;
  final double size;
  final bool showBorder;
  final bool circle;
  final Function onTap;

  Avatar(
    this.url, {
    this.size = 56.0,
    this.showBorder = false,
    this.circle = true,
    this.onTap,
  });

  final _storage = getIt<AttachmentsStorage>();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(11),
        border: showBorder ? Border.all(color: Colors.white, width: 1) : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(circle ? 1000 : 10),
        child: OverlayInkWell(
          inkWell: InkWell(
            onTap: onTap,
          ),
          children: [
            ImageBackground(
              child: CacheImage(
                image: _storage.getImageFile(url),
                width: size,
                height: size,
                fit: BoxFit.cover,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
