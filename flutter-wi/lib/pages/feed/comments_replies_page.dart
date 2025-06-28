import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/models/like.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/data/repo/posts_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/models/comment.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/likes/likes_page.dart';
import 'package:wi/pages/profile/profile_view_page.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/exts/all.dart';

class CommentRepliesPage extends StatefulWidget {
  final String postId;
  final String commentId;
  final bool focusOnInputField;

  CommentRepliesPage._(
    this.postId,
    this.commentId,
    this.focusOnInputField,
  );

  static Future show(
    BuildContext context,
    String postId,
    String commentId, {
    bool focusOnInputField = false,
  }) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            CommentRepliesPage._(postId, commentId, focusOnInputField),
      ),
    );
  }

  @override
  _CommentRepliesPageState createState() => _CommentRepliesPageState();
}

class _CommentRepliesPageState extends State<CommentRepliesPage> {
  final _credentials = getIt<Credentials>();
  final _postRepo = getIt<PostsRepo>();

  final _inputController = TextEditingController();

  final _repliesFetcher = StreamFetcher<List<Document<Comment>>>();

  @override
  initState() {
    super.initState();
    _repliesFetcher
        .use(() => _postRepo.getCommentReplies(widget.postId, widget.commentId))
        .load();
  }

  _onPostCommentTap() {
    if (_inputController.text.isEmpty) return;
    _postRepo.addCommentReply(
      widget.postId,
      widget.commentId,
      _inputController.text,
      _credentials.userId,
    );
    _inputController.clear();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);
    final s = strings();
    return StreamBuilder<Resource<List<Document<Comment>>>>(
      stream: _repliesFetcher.stream,
      builder: (context, snapshot) {
        final replies = snapshot.data?.data;
        return Scaffold(
          appBar: AppAppBar(
            showDivider: true,
            leading: AppBarBackButton(),
            title: Text(
              replies == null
                  ? s.titlePostCommentReplies
                  : '${s.titlePostCommentReplies} (${replies.length})',
            ),
          ),
          body: Column(
            children: [
              Expanded(
                child: ListView.builder(
                  physics: ClampingScrollPhysics(),
                  itemCount: replies?.length ?? 0,
                  itemBuilder: (context, index) => ReplyItem(
                    widget.postId,
                    widget.commentId,
                    replies[index],
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: colorSet.background,
                  boxShadow: [
                    BoxShadow(
                      offset: Offset(0, -2),
                      blurRadius: 2,
                      color:
                          Colors.black.withOpacity(theme.isDark ? 0.15 : 0.08),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _inputController,
                          autofocus: widget.focusOnInputField,
                          decoration: InputDecoration(
                            fillColor: Colors.transparent,
                            hintText: s.labelTypeAMessage,
                            border: InputBorder.none,
                            disabledBorder: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            errorBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            focusedErrorBorder: InputBorder.none,
                            contentPadding: const EdgeInsets.all(24),
                          ),
                          maxLines: null,
                          textCapitalization: TextCapitalization.sentences,
                        ),
                      ),
                      IconButton(
                        key: ValueKey('send-button'),
                        padding: EdgeInsets.zero,
                        color: theme.primaryColor,
                        icon: Icon(Icons.send),
                        onPressed: _onPostCommentTap,
                      ),
                      SizedBox(width: 8),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class ReplyItem extends StatefulWidget {
  final String postId;
  final String commentId;
  final Document<Comment> reply;
  ReplyItem(this.postId, this.commentId, this.reply);
  @override
  _ReplyItemState createState() => _ReplyItemState();
}

class _ReplyItemState extends State<ReplyItem> {
  final _credentials = getIt<Credentials>();
  final _userRepo = getIt<UsersRepo>();
  final _postRepo = getIt<PostsRepo>();

  final _likesFetcher = StreamFetcher<List<Document<Like>>>();

  @override
  initState() {
    super.initState();
    _likesFetcher.use(() => _postRepo.getCommentReplyLikes(
          widget.postId,
          widget.commentId,
          widget.reply.ref.id,
        ));
    _likesFetcher.load();
  }

  _onLikeTap(bool currentlyLiked, bool isOwner) {
    final replyId = widget.reply.ref.id;
    if (isOwner) {
      LikesPage.show(
        context,
        LikesPageType.reply,
        widget.postId,
        widget.commentId,
        replyId,
      );
      return;
    }
    if (currentlyLiked) {
      _postRepo.removeCommentReplyLike(
        widget.postId,
        widget.commentId,
        replyId,
        _credentials.userId,
      );
    } else {
      _postRepo.addCommentReplyLike(
        widget.postId,
        widget.commentId,
        replyId,
        _credentials.userId,
      );
    }
  }

  _onAvatarTap(BuildContext context) {
    ProfileViewPage.show(context, widget.reply.data.authorId);
  }

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    final data = widget.reply.data;
    return FutureBuilder<ProfileModel>(
      future: _userRepo.getProfileById(data.authorId),
      builder: (context, snapshot) {
        final author = snapshot.data;
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 16),
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Avatar(
                author?.imageUrl ?? '',
                size: 32,
                onTap: () => _onAvatarTap(context),
              ),
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
                      data.content,
                      style: TextStyle(color: colorSet.textLighter),
                    ),
                    SizedBox(height: 8),
                    Text(
                      data.createdAt?.toDate()?.relativeReadable() ?? '',
                      style: TextStyle(
                        color: colorSet.textLighter,
                        fontSize: 12,
                      ),
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
                final liked = likes.containsUser(_credentials.userId);
                final isOwner = widget.reply.data.authorId == userId;
                return InkWell(
                  onTap: () => _onLikeTap(liked, isOwner),
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
      },
    );
  }
}
