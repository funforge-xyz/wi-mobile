import 'package:flutter/material.dart';
import 'package:wi/data/models/attachment.dart';
import 'package:wi/data/storage/attachments_storage.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/common/fullscreen_photo_page.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/widgets/cache_image.dart';
import 'package:wi/widgets/frame_builder.dart';
import 'package:wi/widgets/image_background.dart';

class ImagesPage extends StatelessWidget {
  final _storage = getIt<AttachmentsStorage>();

  static Future show(BuildContext context, List<Attachment> images) {
    return Navigator.of(context).pushNamed(
      Routes.CHAT_IMAGES,
      arguments: {
        'images': images,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    List<Attachment> images =
        (ModalRoute.of(context).settings.arguments as Map)['images'];

    return Scaffold(
      appBar: AppAppBar(
        leading: AppBarBackButton(),
      ),
      body: ListView.separated(
        itemCount: images.length,
        separatorBuilder: (context, index) => SizedBox(height: 16),
        itemBuilder: (context, index) {
          final image = images[index];
          return Material(
            elevation: 2,
            child: Stack(
              children: <Widget>[
                AspectRatio(
                  aspectRatio:
                      image.aspectRatio != null ? 1 / image.aspectRatio : 4 / 3,
                  child: ImageBackground(
                    child: Hero(
                      tag: image,
                      child: CacheImage(
                        image: _storage.getImageFile(
                          image.url,
                          source: CacheSource.messageImages,
                        ),
                        frameBuilder: FrameBuilder.fadeIn,
                      ),
                    ),
                  ),
                ),
                Positioned.fill(
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () async {
                        final file = await _storage.getImageFile(
                          image.url,
                          source: CacheSource.messageImages,
                        );
                        FullscreenPhotoPage.show(
                          context,
                          file.path,
                          isFile: true,
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
