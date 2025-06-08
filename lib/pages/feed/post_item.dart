import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:admob_flutter/admob_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/database.dart';
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
import 'package:wi/exts/all.dart';
import 'package:wi/pages/feed/comments_page.dart';
import 'package:wi/pages/feed/data_provider.dart';
import 'package:wi/pages/likes/likes_page.dart';
import 'package:wi/pages/profile/profile_view_page.dart';
import 'package:wi/utils/logger.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/cache_image.dart';
import 'package:wi/widgets/common_progress_indicator.dart';
import 'package:wi/widgets/custom_button_builder.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/widgets/delete_dialog.dart';
import 'package:wi/widgets/frame_builder.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PostItem extends StatefulWidget {
  final String id;
  final bool showCloseButton;
  final Function onDelete;

  PostItem({
    Key key,
    this.id,
    this.showCloseButton = false,
    this.onDelete,
  }) : super(key: key);

  @override
  _PostItemState createState() => _PostItemState();
}

class _PostItemState extends State<PostItem>
    with AutomaticKeepAliveClientMixin {
  final _credentials = getIt<Credentials>();
  final _userRepo = getIt<UsersRepo>();
  final _postRepo = getIt<PostsRepo>();
  final _dataProvider = getIt<FeedDataProvider>();
  final _db = getIt<Database>();
  final _strings = strings();

  VideoPlayerController _controller;

  final _likesFetcher = StreamFetcher<List<Document<Like>>>();
  final _commentsFetcher = StreamFetcher<List<Document<Comment>>>();

  Future<Post> data;

  bool showActionButtons = false;

  @override
  void initState() {
    super.initState();
    data = _dataProvider.get(widget.id);
    data.then((post) {
      if (post != null) {
        _initVideo(post);
      }
    });

    _likesFetcher.use(() => _postRepo.getPostLikes(widget.id)).load();
    _commentsFetcher.use(() => _postRepo.getPostComments(widget.id)).load();
  }

  @override
  dispose() {
    _controller?.pause();
    _controller?.dispose();
    _controller = null;
    super.dispose();
  }

  @override
  bool get wantKeepAlive => true;

  _initVideo(Post post) async {
    if (post.isImage) return;
    _controller = VideoPlayerController.file(
      _dataProvider.getMediaFile(widget.id),
    );
    await _controller.initialize();
    _controller.setLooping(true);
    Function listener;
    listener = () {
      if (_controller.value.isPlaying) {
        setState(() {});
        _controller.removeListener(listener);
      }
    };
    _controller.addListener(listener);

    // If we are showing a close button, we are in a single post view, and
    // have no page swipes, so our main play trigger, item being swiped into
    // visibility won't happen. We need to start playign manually.
    if (widget.showCloseButton == true) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _controller.play();
      });
    }
  }

  _onItemVisibilityChanged(double visibility) {
    if (_controller == null) return;
    final isPlaying = _controller.value.isPlaying;
    if (visibility > 0.5 && !isPlaying) _controller.play();
    if (visibility < 0.5) _controller.pause();
  }

  _onLikeTap(BuildContext context, bool currentlyLiked, bool isOwner) {
    final userId = _credentials.userId;
    if (isOwner) {
      LikesPage.show(context, LikesPageType.post, widget.id);
      return;
    }
    if (currentlyLiked) {
      _postRepo.removeLike(widget.id, userId);
    } else {
      _postRepo.addLike(widget.id, userId);
    }
  }

  _onCommentTap(BuildContext context) {
    CommentsPage.show(context, widget.id);
  }

  _onAuthorTap(BuildContext context, Post post) {
    ProfileViewPage.show(context, post.authorId);
  }

  _onLongPress() {
    HapticFeedback.lightImpact();
    setState(() => showActionButtons = !showActionButtons);
  }

  _onDeleteTap() {
    DeleteDialog.show(
      context: context,
      title: _strings.titleFeedDeletePost,
      onYes: () {
        _postRepo.removePost(widget.id);
        _db.removePost(widget.id);
        widget.onDelete();
        showActionButtons = false;
      },
    );
  }

  _saveReportedItem(String itemId) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(itemId, itemId);

    Scaffold.of(context).showSnackBarFast(
      context,
      message: 'Thank you for your feedback.',
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final s = strings();
    final colorSet = ColorSet.of(context);
    final size = MediaQuery.of(context).size;
    return VisibilityDetector(
      key: ObjectKey(data),
      onVisibilityChanged: (info) {
        _onItemVisibilityChanged(info.visibleFraction);
      },
      child: ClipRect(
        child: FutureBuilder<Post>(
            future: data,
            builder: (context, snapshot) {
              final post = snapshot.data;
              final isOwned = post?.authorId == _credentials.userId;
              if (post == null) return Center(child: CommonProgressIndicator());

              return CustomButtonBuilder(
                onLongPress: !isOwned ? null : _onLongPress,
                builder: (context, tapping, child) {
                  return TweenAnimationBuilder(
                    tween: 1.0.tweenTo(tapping ? 0.98 : 1.0),
                    curve: Curves.easeInQuart,
                    duration: 150.milliseconds,
                    builder: (context, value, child) {
                      return Transform.scale(
                        scale: value,
                        child: child,
                      );
                    },
                    child: child,
                  );
                },
                child: Stack(
                  children: [
                    if (post.isImage)
                      Positioned.fill(
                        child: CacheImage(
                          image: Future.value(
                            _dataProvider.getMediaFile(widget.id),
                          ),
                          fit: BoxFit.cover,
                        ),
                      ),
                    if (post.isVideo)
                      Positioned.fill(
                        child: FittedBox(
                          fit: BoxFit.cover,
                          child: _controller?.value?.initialized == true
                              ? SizedBox(
                                  height: size.height,
                                  width: size.height *
                                      _controller.value.aspectRatio,
                                  child: VideoPlayer(_controller),
                                )
                              : ImageFiltered(
                                  imageFilter: ImageFilter.blur(
                                    sigmaX: 5,
                                    sigmaY: 5,
                                  ),
                                  child: Image.network(
                                    post.thumbURL ?? '',
                                    frameBuilder: FrameBuilder.fadeIn200ms,
                                  ),
                                ),
                        ),
                      ),
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.black.withOpacity(0.7),
                            Colors.transparent,
                          ],
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                        ),
                      ),
                    ),
                    Align(
                      alignment: AlignmentDirectional.topStart,
                      child: SafeArea(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(
                                top: 16,
                                left: 16,
                                right: 16,
                              ),
                              child: true
                                  ? null // TODO: Maybe turn back on later
                                  : Material(
                                      color: Colors.black26,
                                      borderRadius: BorderRadius.circular(24),
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                          vertical: 6,
                                          horizontal: 12,
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.wifi, size: 16),
                                            SizedBox(width: 8),
                                            Text(
                                              'Annie is on the same wifi as you',
                                              style: TextStyle(fontSize: 12),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                            ),
                            Expanded(child: SizedBox.shrink()),
                            if (widget.showCloseButton)
                              Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Material(
                                  color: Colors.black26,
                                  shape: CircleBorder(),
                                  child: InkWell(
                                    customBorder: CircleBorder(),
                                    onTap: () {
                                      Navigator.of(context).pop();
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.all(8.0),
                                      child: Icon(Icons.close),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                    Align(
                      alignment: Alignment.bottomCenter,
                      child: SafeArea(
                        child: Material(
                          color: Colors.transparent,
                          child: FutureBuilder<ProfileModel>(
                            future: _userRepo.getProfileById(post.authorId),
                            builder: (context, snapshot) {
                              final author = snapshot.data;
                              return Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8),
                                    child: InkWell(
                                      onTap: () => _onAuthorTap(context, post),
                                      borderRadius: BorderRadius.circular(8),
                                      child: Padding(
                                        padding: const EdgeInsets.all(8),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Avatar(author?.imageUrl ?? '',
                                                size: 32),
                                            SizedBox(width: 16),
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(author?.name ?? ''),
                                                Text(
                                                  post.createdAt
                                                          ?.toDate()
                                                          ?.relativeReadable(
                                                            shortForm: false,
                                                          ) ??
                                                      '',
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: colorSet.text
                                                        .withOpacity(0.8),
                                                  ),
                                                ),
                                              ],
                                            )
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                  if (post?.content?.isNotEmpty == true) ...[
                                    SizedBox(height: 16),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 16),
                                      child: Text(
                                        post?.content ?? '',
                                        style: TextStyle(
                                          height: 1.5,
                                        ),
                                      ),
                                    ),
                                  ],
                                  SizedBox(height: 8),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 4),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            if (post.allowLikes != false) ...[
                                              StreamBuilder<
                                                  Resource<
                                                      List<Document<Like>>>>(
                                                stream: _likesFetcher.stream,
                                                builder: (context, snapshot) {
                                                  final userId =
                                                      _credentials.userId;
                                                  final likes =
                                                      snapshot.data?.data?.map(
                                                              (d) => d.data) ??
                                                          [];
                                                  final liked = likes
                                                      .containsUser(userId);
                                                  final isOwner =
                                                      post.authorId == userId;
                                                  return IconButtonWithLabel(
                                                    icon: CustomIcon(
                                                      liked
                                                          ? I.feedLike
                                                          : I.feedLikeOutline,
                                                      color: liked
                                                          ? colorSet.like
                                                          : null,
                                                    ),
                                                    label: Text(
                                                      likes.length.toString(),
                                                      style: TextStyle(
                                                        color: null,
                                                      ),
                                                    ),
                                                    onTap: () => _onLikeTap(
                                                      context,
                                                      liked,
                                                      isOwner,
                                                    ),
                                                  );
                                                },
                                              ),
                                              SizedBox(width: 8),
                                            ],
                                            if (post?.allowComments !=
                                                false) ...[
                                              StreamBuilder<
                                                  Resource<
                                                      List<Document<Comment>>>>(
                                                stream: _commentsFetcher.stream,
                                                builder: (context, snapshot) {
                                                  final comments =
                                                      snapshot.data?.data?.map(
                                                              (d) => d.data) ??
                                                          [];
                                                  return IconButtonWithLabel(
                                                    icon: CustomIcon(
                                                        I.feedComment),
                                                    label: Text(
                                                      comments.length
                                                          ?.toString(),
                                                    ),
                                                    onTap: () =>
                                                        _onCommentTap(context),
                                                  );
                                                },
                                              ),
                                            ],
                                            SizedBox(width: 8),
                                          ],
                                        ),
                                        IconButtonWithLabel(
                                          icon: Icon(
                                            Icons.announcement,
                                            color: colorSet.textOnSecondary,
                                          ),
                                          label: Text(''),
                                          onTap: () => showDialog(
                                              context: context,
                                              builder: (BuildContext context) =>
                                                  _buildPopupDialog(
                                                      context,
                                                      _saveReportedItem,
                                                      widget.id)),
                                        )
                                      ],
                                    ),
                                  ),
                                  SizedBox(height: 16),
                                ],
                              );
                            },
                          ),
                        ),
                      ),
                    ),
                    _buildActionButtons()
                  ],
                ),
              );
            }),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Center(
      child: TweenAnimationBuilder(
        duration: 300.milliseconds,
        curve: Curves.elasticOut,
        tween: (showActionButtons ? 0.0 : 1.0)
            .tweenTo(showActionButtons ? 1.0 : 0.0),
        builder: (context, value, child) {
          return Transform.scale(scale: value, child: child);
        },
        child: Material(
          color: Colors.black26,
          shape: CircleBorder(),
          child: InkWell(
            onTap: _onDeleteTap,
            onLongPress: () {},
            customBorder: CircleBorder(),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Icon(Icons.delete),
            ),
          ),
        ),
      ),
    );
  }
}

class IconButtonWithLabel extends StatelessWidget {
  final Widget icon;
  final Text label;
  final Function onTap;

  IconButtonWithLabel({
    @required this.icon,
    @required this.label,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: icon,
          onPressed: onTap,
        ),
        label,
      ],
    );
  }
}

Widget _buildPopupDialog(
    BuildContext context, Function onReportClick, String itemId) {
  final colors = ColorSet.of(context);
  return new AlertDialog(
    backgroundColor: colors.text,
    title: Text('Is this content inappropriate?',
        style: TextStyle(
            fontSize: 16,
            color: colors.background,
            fontWeight: FontWeight.bold)),
    content: new Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
            "By clicking the Report this content will be removed from your feed.",
            style: TextStyle(fontSize: 15, color: colors.background)),
      ],
    ),
    actions: <Widget>[
      Row(
        children: [
          TextButton(
            onPressed: () {
              onReportClick(itemId);
              Navigator.of(context).pop();
            },
            child: Text('Report', style: TextStyle(color: colors.accent)),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            child: Text('Not now', style: TextStyle(color: colors.surface)),
          ),
        ],
      )
    ],
  );
}

class AdPost extends StatelessWidget {
  final VoidCallback onAdError;

  AdPost({@required this.onAdError});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth;
          final height = constraints.maxHeight;
          return Container(
            width: width,
            height: height,
            color: Colors.grey[900],
            child: AdmobBanner(
              adUnitId: Platform.isAndroid
                  ? 'ca-app-pub-8274717328460787/1539435503'
                  : 'ca-app-pub-8274717328460787/6558331032',
              adSize: Platform.isAndroid
                  ? AdmobBannerSize.MEDIUM_RECTANGLE
                  : AdmobBannerSize(
                      width: width.toInt(),
                      height: height.toInt(),
                      // DO NOT CHANGE. flutter_admob throws if this value value isn't one of
                      // predefined values.
                      // See: https://github.com/kmcgill88/admob_flutter/blob/master/ios/Classes/AdmobBanner.swift#L110
                      name: 'SMART_BANNER',
                    ),
              listener: (event, _) {
                if (event == AdmobAdEvent.failedToLoad) {
                  Logger.logError('ad failed to load');
                  onAdError();
                }
              },
            ),
          );
        },
      ),
    );
  }
}
