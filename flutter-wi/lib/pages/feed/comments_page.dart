import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/data/models/like.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/data/repo/posts_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/models/comment.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/feed/comments_replies_page.dart';
import 'package:wi/pages/likes/likes_page.dart';
import 'package:wi/pages/profile/profile_view_page.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/sup/quick_sup.dart';

class CommentsPage extends StatefulWidget {
  final String postId;

  CommentsPage(this.postId);

  static Future show(BuildContext context, String postId) {
    return Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => CommentsPage(postId)),
    );
  }

  @override
  _CommentsPageState createState() => _CommentsPageState();
}

class _CommentsPageState extends State<CommentsPage> {
  final _credentials = getIt<Credentials>();
  final _postRepo = getIt<PostsRepo>();

  final _inputController = TextEditingController();

  _onPostCommentTap() {
    if (_inputController.text.isEmpty) return;
    _postRepo.addComment(
      widget.postId,
      _inputController.text,
      _credentials.userId,
    );
    _inputController.clear();
  }

  _onReplyTap(BuildContext context, String commentId) {
    CommentRepliesPage.show(
      context,
      widget.postId,
      commentId,
      focusOnInputField: true,
    );
  }

  _onViewRepliesTap(BuildContext context, String commentId) {
    CommentRepliesPage.show(context, widget.postId, commentId);
  }

  _onCommentDeleteTap(String commentId) {
    _postRepo.removeComment(widget.postId, commentId);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);
    final s = strings();
    return StreamBuilder<List<Document<Comment>>>(
      stream: _postRepo.getPostComments(widget.postId),
      builder: (context, snapshot) {
        final comments = snapshot.data;
        return Scaffold(
          appBar: AppAppBar(
            showDivider: true,
            leading: AppBarBackButton(),
            title: Text(
              comments == null
                  ? s.titlePostComments
                  : '${s.titlePostComments} (${comments.length})',
            ),
          ),
          body: Column(
            children: [
              Expanded(
                child: comments == null || comments.isEmpty
                    ? Center(
                        child: QuickSup.empty(
                        title: s.labelPostNoComments,
                        subtitle: s.messagePostNoComments,
                      ))
                    : ListView.builder(
                        physics: ClampingScrollPhysics(),
                        itemCount: comments?.length ?? 0,
                        itemBuilder: (context, index) => CommentItem(
                          postId: widget.postId,
                          comment: comments[index],
                          onReplyTap: () => _onReplyTap(
                            context,
                            comments[index].ref.id,
                          ),
                          onViewRepliesTap: () => _onViewRepliesTap(
                            context,
                            comments[index].ref.id,
                          ),
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

class CommentItem extends StatefulWidget {
  final String postId;
  final Document<Comment> comment;
  final Function onDeleteTap;
  final Function onReplyTap;
  final Function onViewRepliesTap;
  CommentItem({
    @required this.postId,
    @required this.comment,
    this.onDeleteTap,
    this.onReplyTap,
    this.onViewRepliesTap,
  });
  @override
  _CommentItemState createState() => _CommentItemState();
}

class _CommentItemState extends State<CommentItem> {
  final _credentials = getIt<Credentials>();
  final _userRepo = getIt<UsersRepo>();
  final _postRepo = getIt<PostsRepo>();

  final _likesFetcher = StreamFetcher<List<Document<Like>>>();
  final _repliesFetcher = StreamFetcher<List<Document<Comment>>>();

  @override
  initState() {
    super.initState();
    _likesFetcher.use(
      () => _postRepo.getCommentLikes(widget.postId, widget.comment.ref.id),
    );
    _likesFetcher.load();
    _repliesFetcher
        .use(() => _postRepo.getCommentReplies(widget.postId, commentId))
        .load();
  }

  String get commentId => widget.comment.ref.id;

  _onLikeTap(bool currentlyLiked, bool isOwner) {
    if (isOwner) {
      LikesPage.show(context, LikesPageType.comment, widget.postId, commentId);
      return;
    }
    if (currentlyLiked) {
      _postRepo.removeCommentLike(
        widget.postId,
        commentId,
        _credentials.userId,
      );
    } else {
      _postRepo.addCommentLike(widget.postId, commentId, _credentials.userId);
    }
  }

  _onAvatarTap(BuildContext context) {
    ProfileViewPage.show(context, widget.comment.data.authorId);
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final colorSet = ColorSet.of(context);
    final data = widget.comment.data;
    return InkWell(
      onLongPress: widget.onDeleteTap,
      child: FutureBuilder<ProfileModel>(
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
                      SizedBox(height: 2),
                      Row(
                        children: [
                          Text(
                            data.createdAt?.toDate()?.relativeReadable() ?? '',
                            style: TextStyle(
                              color: colorSet.textLighter,
                              fontSize: 12,
                            ),
                          ),
                          SizedBox(width: 24),
                          InkWell(
                            onTap: widget.onReplyTap,
                            borderRadius: BorderRadius.circular(4),
                            child: Padding(
                              padding: const EdgeInsets.all(8),
                              child: Text(
                                s.actionPostReply,
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
                      StreamBuilder<Resource<List<Document<Comment>>>>(
                        stream: _repliesFetcher.stream,
                        builder: (context, snapshot) {
                          final replies =
                              snapshot.data?.data?.map((d) => d.data) ?? [];
                          return replies.isEmpty
                              ? SizedBox.shrink()
                              : Row(
                                  children: [
                                    SizedBox(
                                      width: 40,
                                      child: Divider(),
                                    ),
                                    SizedBox(width: 4),
                                    InkWell(
                                      onTap: widget.onViewRepliesTap,
                                      borderRadius: BorderRadius.circular(4),
                                      child: Padding(
                                        padding: const EdgeInsets.all(8),
                                        child: Text(
                                          s.get(s.labelCommentViewRepliesX,
                                              {'value': replies.length}),
                                          style: TextStyle(
                                            color: colorSet.textLighter,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                        },
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
                  final isOwner = widget.comment.data.authorId == userId;
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
      ),
    );
  }
}
