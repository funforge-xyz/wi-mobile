import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/models/comment.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/like.dart';
import 'package:wi/data/models/post.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/data/repo/posts_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/feed/comments_replies_page.dart';
import 'package:wi/pages/feed/data_provider.dart';
import 'package:wi/pages/feed/post_item.dart';
import 'package:wi/theme.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/common_progress_indicator.dart';
import 'package:wi/widgets/custom_icon.dart';

class PostCommentSummaryPage extends StatefulWidget {
  final String postId;
  final String commentId;

  PostCommentSummaryPage._({
    @required this.postId,
    @required this.commentId,
  });

  static Future show(BuildContext context, String postId, String commentId) {
    return Navigator.of(context).push(MaterialPageRoute(
      builder: (_) =>
          PostCommentSummaryPage._(postId: postId, commentId: commentId),
    ));
  }

  @override
  PostCommentSummaryPageState createState() => PostCommentSummaryPageState();
}

class PostCommentSummaryPageState extends State<PostCommentSummaryPage> {
  final _dataProvider = getIt<FeedDataProvider>();
  final _postsRepo = getIt<PostsRepo>();
  final _usersRepo = getIt<UsersRepo>();
  final _credentials = getIt<Credentials>();
  final _strings = strings();

  final _postFetcher = FutureFetcher<Post>();
  final _commentFetcher = FutureFetcher<Document<Comment>>();
  final _likesFetcher = StreamFetcher<List<Document<Like>>>();

  @override
  void initState() {
    super.initState();
    _postFetcher.use(() => _dataProvider.get(widget.postId)).load();
    _commentFetcher
        .use(() => _postsRepo.getCommentById(widget.postId, widget.commentId))
        .load();
    _likesFetcher
        .use(() => _postsRepo.getCommentLikes(widget.postId, widget.commentId))
        .load();
  }

  _onReplyTap() {
    CommentRepliesPage.show(
      context,
      widget.postId,
      widget.commentId,
      focusOnInputField: true,
    );
  }

  _onLikeTap(bool liked) {
    if (liked) {
      _postsRepo.removeCommentLike(
        widget.postId,
        widget.commentId,
        _credentials.userId,
      );
    } else {
      _postsRepo.addCommentLike(
          widget.postId, widget.commentId, _credentials.userId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return Scaffold(
      appBar: AppAppBar(
        leading: AppBarBackButton(),
      ),
      body: StreamBuilder<Resource<Post>>(
        stream: _postFetcher.stream,
        builder: (context, snapshot) {
          final post = snapshot.data?.data;
          return Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPostCard(context, post),
                SizedBox(height: 16),
                Text(
                  _strings.labelFeedNewCommentOnYourPost,
                  style: TextStyle(color: colorSet.textLighter),
                ),
                SizedBox(height: 8),
                _buildComment(context),
              ],
            ),
          );
        },
      ),
    );
  }

  _buildPostCard(BuildContext context, Post post) {
    return Expanded(
      child: Theme(
        data: AppTheme.dark,
        child: Material(
          borderRadius: BorderRadius.circular(8),
          color: Colors.grey[800],
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: PostItem(id: widget.postId),
          ),
        ),
      ),
    );
  }

  _buildComment(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return StreamBuilder<Resource<Document<Comment>>>(
      stream: _commentFetcher.stream,
      builder: (context, snapshot) {
        final comment = snapshot.data?.data?.data;
        if (comment == null) return Center(child: CommonProgressIndicator());
        return FutureBuilder<ProfileModel>(
          future: _usersRepo.getProfileById(comment.authorId),
          builder: (context, snapshot) {
            final author = snapshot.data;
            return Material(
              borderRadius: BorderRadius.circular(8),
              color: colorSet.surface,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _buildCommentRow(context, comment, author),
              ),
            );
          },
        );
      },
    );
  }

  _buildCommentRow(BuildContext context, Comment comment, ProfileModel author) {
    final colorSet = ColorSet.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 16),
        Padding(
          padding: const EdgeInsets.only(top: 16),
          child: Avatar(author?.imageUrl ?? '', size: 32),
        ),
        SizedBox(width: 16),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(author?.name ?? ''),
                SizedBox(height: 8),
                Text(
                  comment.content,
                  style: TextStyle(color: colorSet.textLighter),
                ),
                SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      comment.createdAt?.toDate()?.relativeReadable() ?? '',
                      style: TextStyle(
                        color: colorSet.textLighter,
                        fontSize: 12,
                      ),
                    ),
                    SizedBox(width: 24),
                    InkWell(
                      onTap: _onReplyTap,
                      borderRadius: BorderRadius.circular(4),
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Text(
                          _strings.actionPostReply,
                          style: TextStyle(
                            color: colorSet.textLighter,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        StreamBuilder<Resource<List<Document<Like>>>>(
          stream: _likesFetcher.stream,
          builder: (context, snapshot) {
            final userId = _credentials.userId;
            final likes = snapshot.data?.data?.map((d) => d.data) ?? [];
            final liked = likes.containsUser(userId);
            return InkWell(
              onTap: () => _onLikeTap(liked),
              customBorder: CircleBorder(),
              child: Padding(
                padding: const EdgeInsets.only(
                  top: 16,
                  right: 16,
                  left: 16,
                  bottom: 24,
                ),
                child: Row(
                  children: [
                    Text(
                      likes.length?.toString(),
                      style: TextStyle(fontSize: 12),
                    ),
                    SizedBox(width: 4),
                    CustomIcon(
                      liked ? I.feedLike : I.feedLikeOutline,
                      size: 16,
                      color: liked ? colorSet.like : null,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
