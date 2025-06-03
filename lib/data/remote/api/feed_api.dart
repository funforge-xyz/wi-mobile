import 'package:wi/data/models/posts.dart';
import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/remote/api/api_call.dart';

extension FeedApi on Api {
  ApiCall<Posts> getPosts(String myId) {
    return ApiCall<Posts>.using(dio)
        .get('/api/users/$myId/nearby-posts')
        .parseWith((json) => Posts.fromJson(json));
  }

  /// Note: This request returns more info about the post than just the ID, but
  /// we don't parse it all because we don't need to right now.
  ApiCall<String> addPost({
    String authorId,
    String content,
    String mediaUrl,
    String thumbUrl,
    bool allowComments,
    bool allowLikes,
  }) {
    return ApiCall<String>.using(dio).post('/api/posts').body({
      'authorId': authorId,
      'content': content,
      'mediaUrl': mediaUrl,
      'thumbUrl': thumbUrl,
      'allowComments': allowComments,
      'allowLikes': allowLikes,
    }).parseWith((json) => json['id'] as String);
  }
}
