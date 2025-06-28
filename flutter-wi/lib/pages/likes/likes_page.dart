import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/like.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/data/repo/posts_repo.dart';
import 'package:wi/di.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/resource_stream_builder.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/sup/quick_sup.dart';

enum LikesPageType { post, comment, reply }

class LikesPage extends StatefulWidget {
  final LikesPageType type;
  final String postId;
  final String commentId;
  final String replyId;

  LikesPage._(this.type, this.postId, this.commentId, this.replyId);

  static Future show(
    BuildContext context,
    LikesPageType type, [
    String postId,
    String commentId,
    String replyId,
  ]) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => LikesPage._(type, postId, commentId, replyId),
      ),
    );
  }

  @override
  _LikesPageState createState() => _LikesPageState();
}

class _LikesPageState extends State<LikesPage> {
  final _repo = getIt<PostsRepo>();

  final _fetcher = StreamFetcher<List<Document<Like>>>();

  @override
  initState() {
    super.initState();
    final type = widget.type;
    if (type == LikesPageType.post) {
      _fetcher.use(() => _repo.getPostLikes(widget.postId));
    } else if (type == LikesPageType.comment) {
      _fetcher
          .use(() => _repo.getCommentLikes(widget.postId, widget.commentId));
    } else if (type == LikesPageType.reply) {
      _fetcher.use(
        () => _repo.getCommentReplyLikes(
          widget.postId,
          widget.commentId,
          widget.replyId,
        ),
      );
    }
    _fetcher.load();
  }

  String _getTitle() {
    final s = strings();
    switch (widget.type) {
      case LikesPageType.post:
        return s.titleLikesPost;
      case LikesPageType.comment:
        return s.titleLikesComment;
      case LikesPageType.reply:
        return s.titleLikesReply;
      default:
        return '?';
    }
  }

  String _getEmptyStateSubtitle() {
    final s = strings();
    switch (widget.type) {
      case LikesPageType.post:
        return s.messageLikesEmptySubtitlePost;
      case LikesPageType.comment:
        return s.messageLikesEmptySubtitleComment;
      case LikesPageType.reply:
        return s.messageLikesEmptySubtitleReply;
      default:
        return '?';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppAppBar(
        title: Text(_getTitle()),
      ),
      body: ResourceStreamBuilder<List<Document<Like>>>(
        stream: _fetcher.stream,
        contentBuilder: (context, data) {
          return ListView.builder(
            itemCount: data.length,
            itemBuilder: (_, index) => _LikeItem(data[index].data),
          );
        },
        emptyBuilder: (_) {
          return Center(
            child: QuickSup.empty(
              title: strings().messageLikesEmptyTitle,
              subtitle: _getEmptyStateSubtitle(),
            ),
          );
        },
      ),
    );
  }
}

class _LikeItem extends StatelessWidget {
  final Like like;

  _LikeItem(this.like);

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: Row(
        children: [
          Avatar(
            like.userImageUrl ?? '',
            size: 32,
          ),
          SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                like.userName ?? '?',
                style: TextStyle(fontSize: 14),
              ),
              Text(
                like.likedAt?.toDate()?.relative() ?? '?',
                style: TextStyle(fontSize: 12, color: colorSet.textLighter),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
