import 'dart:io';

import 'package:wi/data/local/database.dart';
import 'package:wi/data/models/post.dart';
import 'package:wi/data/repo/posts_repo.dart';
import 'package:wi/data/storage/cache_managers.dart';
import 'package:wi/di.dart';

/// Manages data loading/caching and serving for the Feed feature.
///
/// Offline persistence is handled by different solutions at different points.
/// Post data (e.g. title, author, media url, etc.) is stored by Firestore,
/// with its own caching mechanism; media files (images and video) are
/// stored by us, in our own cache manager; and the top level post IDs list
/// returned by our own API is cached in a local database.
///
/// See [Database], [PostsRepo.getPosts], and [FeedCache] for more info.
class FeedDataProvider {
  final _repo = getIt<PostsRepo>();
  final _cache = getIt<FeedCache>();

  /// Map of post IDs to local cache File objects. If a post has a corresponding
  /// file here, it was downloaded to device and is ready to be used.
  final _loadedMedia = <String, File>{};

  bool loaded(String postId) => _loadedMedia.containsKey(postId);

  /// Load this post. By getting the post from Firestore once, we ensure it'll
  /// be available offline. We then get its media file through cache,
  /// effectively ensuring it is downloaded.
  load(String postId) async {
    if (loaded(postId)) return;
    final post = await _repo.getPostById(postId);
    final media = await _cache.getSingleFile(post.data.mediaURL);
    _loadedMedia[postId] = media;
  }

  Future<Post> get(String postId) async {
    if (!loaded(postId)) await load(postId);
    return (await _repo.getPostById(postId)).data;
  }

  File getMediaFile(String postId) {
    return _loadedMedia[postId];
  }
}
