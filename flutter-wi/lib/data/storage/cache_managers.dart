import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

/// General image cache. Used for images that may change, such as user avatars.
class ImageCacheManager extends BaseCacheManager {
  static const key = 'images';

  ImageCacheManager()
      : super(
          key,
          fileService: HttpFileService(),
          maxAgeCacheObject: Duration(days: 7),
        );

  @override
  Future<String> getFilePath() async {
    final dir = await getTemporaryDirectory();
    return p.join(dir.path, key);
  }

  Future invalidate(String url) async {
    if (url == null) return;
    return removeFile(url);
  }
}

/// Message attachment image cache. Used for images posted in a thread, that
/// will never change.
class MessageImageCacheManager extends BaseCacheManager {
  static const key = 'WiChat Images';

  MessageImageCacheManager()
      : super(
          key,
          fileService: HttpFileService(),
          maxAgeCacheObject: Duration(days: 60),
        );

  @override
  Future<String> getFilePath() async {
    final directory = (await getTemporaryDirectory()).path;
    return p.join(directory, key);
  }
}

/// Feed media cache. Used for images and videos in a Feed.
class FeedCache extends BaseCacheManager {
  static const key = 'feed';

  FeedCache()
      : super(
          key,
          fileService: HttpFileService(),
          maxAgeCacheObject: Duration(days: 15),
        );

  @override
  Future<String> getFilePath() async {
    final dir = await getTemporaryDirectory();
    return p.join(dir.path, key);
  }
}
