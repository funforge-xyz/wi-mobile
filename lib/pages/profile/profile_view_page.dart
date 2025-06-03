import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/models/like.dart';
import 'package:wi/data/repo/posts_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/post.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/data/storage/cache_managers.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/chat/chat_page.dart';
import 'package:wi/pages/common/fullscreen_photo_page.dart';
import 'package:wi/pages/feed/comments_page.dart';
import 'package:wi/pages/feed/post_item.dart';
import 'package:wi/pages/feed/post_page.dart';
import 'package:wi/pages/likes/likes_page.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_action.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/cache_image.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/widgets/image_background.dart';
import 'package:wi/widgets/overlay_inkwell.dart';

class ProfileViewPage extends StatefulWidget {
  final String id;
  final bool showBackButton;
  final bool showSettingsButton;

  ProfileViewPage(this.id, this.showBackButton, this.showSettingsButton);

  static Future show(
    BuildContext context,
    String id, {
    bool showBackButton = true,
    bool showSettingsButton = false,
  }) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ProfileViewPage(
          id,
          showBackButton,
          showSettingsButton,
        ),
      ),
    );
  }

  @override
  _ProfileViewPageState createState() => _ProfileViewPageState();
}

class _ProfileViewPageState extends State<ProfileViewPage> {
  final _repo = getIt<UsersRepo>();
  final _postsRepo = getIt<PostsRepo>();

  final _fetcher = StreamFetcher<Document<ProfileModel>>();
  final _postsFetcher = StreamFetcher<List<Document<Post>>>();

  // TODO
  bool muteNotifications = false;

  @override
  void initState() {
    super.initState();
    _fetcher.use(() => _repo.getProfileByIdLive(widget.id)).load();
    _postsFetcher.use(() => _postsRepo.getPostsByUser(widget.id)).load();
  }

  _onAvatarTap(BuildContext context, String avatarUrl) {
    if(avatarUrl!=null){
      FullscreenPhotoPage.show(
        context,
        avatarUrl,
        showOpenInBrowserButton: false,
      );
    }
  }

  _onMessageTap(String userId) async {
    if (userId == null) return;
    ChatPage.open(context, userId: userId);
  }

  _onEditProfileTap() {
    Navigator.of(context).pushNamed(Routes.MY_PROFILE);
  }

  _onSettingsTap() {
    Navigator.pushNamed(context, Routes.SETTINGS);
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    return Scaffold(
      appBar: AppAppBar(
        title: Text(s.titleProfileViewProfile),
        automaticallyImplyLeading: widget.showBackButton,
        leading: widget.showBackButton ? AppBarBackButton() : null,
        actions: <Widget>[
          if (widget.showSettingsButton) ...[
            AppBarAction(
              child: Icon(I.settings),
              onTap: _onSettingsTap,
            ),
            SizedBox(width: 8),
          ],
        ],
      ),
      body: StreamBuilder<Resource<Document<ProfileModel>>>(
        stream: _fetcher.stream,
        initialData: Resource.loading(),
        builder: (context, snapshot) {
          final doc = snapshot.data.data;
          return StreamBuilder<Resource<List<Document<Post>>>>(
            stream: _postsFetcher.stream,
            initialData: Resource.loading(),
            builder: (context, snapshot) {
              final postsRes = snapshot.data;
              final posts = postsRes.data;
              return CustomScrollView(
                physics: ClampingScrollPhysics(),
                slivers: [
                  SliverPersistentHeader(
                    floating: true,
                    pinned: true,
                    delegate: _HeaderDelegate(
                      userId: widget.id,
                      doc: doc,
                      onAvatarTap: _onAvatarTap,
                      onMessageTap: _onMessageTap,
                      onEditProfileTap: _onEditProfileTap,
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Divider(height: 1),
                  ),
                  if (postsRes.isLoading())
                    SliverToBoxAdapter(
                      child: LinearProgressIndicator(),
                    ),
                  if (postsRes.isSuccess())
                    SliverPadding(
                      padding: const EdgeInsets.all(4),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final post = posts[index];
                            return _PostItem(post.ref.id, post.data);
                          },
                          childCount: posts.length,
                        ),
                      ),
                    ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}

class _HeaderDelegate extends SliverPersistentHeaderDelegate {
  final String userId;
  final Document<ProfileModel> doc;
  final Function onAvatarTap;
  final Function onMessageTap;
  final Function onEditProfileTap;

  _HeaderDelegate({
    @required this.userId,
    @required this.doc,
    @required this.onAvatarTap,
    @required this.onMessageTap,
    @required this.onEditProfileTap,
  });

  final _credentials = getIt<Credentials>();
  final _strings = strings();

  @override
  double get maxExtent => 114;

  @override
  double get minExtent => 40;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final double percentage =
            (constraints.maxHeight - minExtent) / (maxExtent - minExtent);
        return _build(context, percentage);
      },
    );
  }

  @override
  bool shouldRebuild(SliverPersistentHeaderDelegate oldDelegate) {
    return this != oldDelegate;
  }

  Widget _build(BuildContext context, double percentage) {
    final colorSet = ColorSet.of(context);
    final isOwnProfile = userId == _credentials.userId;
    final data = doc?.data;
    return Material(
      color: colorSet.background,
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Avatar(
              data?.imageUrl ?? '',
              size: 24.0.tweenTo(56).transform(percentage),
              onTap: () => onAvatarTap(context, data?.imageUrl),
            ),
            SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 4 * 1 - percentage),
                Text(
                  data?.name ?? '',
                  style: TextStyle(
                    fontSize: 16,
                  ),
                ),
                SizedBox(height: 4),
                Opacity(
                  opacity: Curves.easeInCubic.transform(percentage),
                  child: Text(
                    data?.about ?? '',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorSet.textLighter,
                    ),
                  ),
                ),
                Opacity(
                  opacity: Interval(0.7, 1.0).transform(percentage),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (doc?.ref?.id != null && !isOwnProfile) ...[
                        SizedBox(height: 16),
                        SizedBox(
                          height: 38,
                          child: RaisedButton(
                            onPressed: () => onMessageTap(doc.ref.id),
                            child: Text(_strings.actionFeedMessage),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                            ),
                            elevation: 0,
                            disabledElevation: 0,
                            focusElevation: 1,
                            hoverElevation: 2,
                          ),
                        ),
                      ],
                      if (isOwnProfile) ...[
                        SizedBox(height: 16),
                        Material(
                          color: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(40),
                            side: BorderSide(
                              width: 1,
                              color: colorSet.border,
                            ),
                          ),
                          child: InkWell(
                            onTap: onEditProfileTap,
                            borderRadius: BorderRadius.circular(40),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 48,
                                vertical: 10,
                              ),
                              child: Text(
                                'Edit profile',
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PostItem extends StatelessWidget {
  final String postId;
  final Post post;
  _PostItem(this.postId, this.post);

  final _cache = getIt<FeedCache>();
  final _credentials = getIt<Credentials>();
  final _postsRepo = getIt<PostsRepo>();

  _onTap(BuildContext context) {
    PostPage.show(context, postId);
  }

  _onLikeTap(BuildContext context, bool currentlyLiked, bool isOwner) {
    if (isOwner) {
      LikesPage.show(context, LikesPageType.post, postId);
      return;
    }
    if (currentlyLiked) {
      _postsRepo.removeLike(postId, _credentials.userId);
    } else {
      _postsRepo.addLike(postId, _credentials.userId);
    }
  }

  _onCommentTap(BuildContext context) {
    CommentsPage.show(context, postId);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);
    final isImage = post.isImage;
    return Padding(
      padding: const EdgeInsets.all(4),
      child: Container(
        decoration: BoxDecoration(
          color: colorSet.background,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: theme.isDark ? Colors.black38 : Colors.black12,
              offset: Offset(0, 3),
              blurRadius: 6,
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              OverlayInkWell(
                inkWell: InkWell(
                  onTap: () => _onTap(context),
                ),
                children: [
                  SizedBox(
                    width: size.width,
                    height: size.width,
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: BorderRadius.only(
                              topLeft: Radius.circular(8),
                              topRight: Radius.circular(8),
                            ),
                            child: ImageBackground(
                              child: CacheImage(
                                image: _cache.getSingleFile(
                                    isImage ? post.mediaUrl : post.thumbUrl),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ),
                        if (!isImage)
                          Center(
                            child: Container(
                              color: Colors.black45,
                              child: Center(
                                child: Material(
                                  color: Colors.white12,
                                  shape: CircleBorder(),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Icon(
                                      Icons.play_arrow,
                                      color: Colors.white,
                                      size: 40,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  if (post.allowLikes != false) ...[
                    StreamBuilder<List<Document<Like>>>(
                      stream: _postsRepo.getPostLikes(postId),
                      builder: (context, snapshot) {
                        final userId = _credentials.userId;
                        final likes = snapshot.data?.map((d) => d.data) ?? [];
                        final liked = likes.containsUser(userId);
                        final isOwner = post.authorId == userId;
                        return IconButtonWithLabel(
                          icon: CustomIcon(
                            liked ? I.feedLike : I.feedLikeOutline,
                            color: liked ? colorSet.like : null,
                          ),
                          label: Text(
                            likes.length.toString(),
                            style: TextStyle(fontSize: 12),
                          ),
                          onTap: () => _onLikeTap(context, liked, isOwner),
                        );
                      },
                    ),
                    SizedBox(width: 8),
                  ],
                  if (post.allowComments != false) ...[
                    StreamBuilder<List<Document<dynamic>>>(
                      stream: _postsRepo.getPostComments(postId),
                      builder: (context, snapshot) {
                        final comments =
                            snapshot.data?.map((d) => d.data) ?? [];
                        return IconButtonWithLabel(
                          icon: CustomIcon(I.feedComment),
                          label: Text(
                            comments.length?.toString(),
                            style: TextStyle(
                              fontSize: 12,
                            ),
                          ),
                          onTap: () => _onCommentTap(context),
                        );
                      },
                    ),
                  ],
                  Expanded(child: Container()),
                  Text(
                    post.createdAt?.toDate()?.relativeReadable() ?? '',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorSet.textLight,
                    ),
                  ),
                  SizedBox(width: 16),
                ],
              ),
              if (post.content?.isNotEmpty == true) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(post.content),
                ),
                SizedBox(height: 16),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
