import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/svg.dart';
import 'package:wi/config/assets.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/database.dart';
import 'package:wi/data/local/permissions.dart';
import 'package:wi/data/local/settings.dart';
import 'package:wi/data/models/posts.dart';
import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/pages/feed/post_item.dart';
import 'package:wi/theme.dart';
import 'package:wi/utils/rate_limiter.dart';
import 'package:wi/widgets/extents_page_view.dart';
import 'package:wi/widgets/guide_overlay.dart';
import 'package:wi/widgets/requires_location_permission.dart';
import 'package:wi/widgets/resource_stream_builder.dart';
import 'package:wi/widgets/submit_button.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FeedPageNew extends StatefulWidget {
  /// ID of post to jump to. Used to automatically scroll to post when the user
  /// adds it.
  final String postToJumpTo;
  final Function onCreatePostTap;

  FeedPageNew({
    Key key,
    this.postToJumpTo,
    this.onCreatePostTap,
  }) : super(key: key);

  @override
  _FeedPageState createState() => _FeedPageState();
}

class _FeedPageState extends State<FeedPageNew> {
  final _settings = getIt<Settings>();
  final _credentials = getIt<Credentials>();
  final _db = getIt<Database>();
  final _api = getIt<Api>();
  final _rateLimiter = getIt<RateLimiter>();

  final _controller = PageController(keepPage: true);

  Set<String> _failedAdsIds = {};

  bool loading = false;
  Posts data;
  ErrorInfo error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  _load() {
    _loadFromCache();
    _loadFromApi();
  }

  Future _reload() async {
    if (!_rateLimiter.shouldFetch(RateLimiterKeys.FEED_POSTS)) {
      return Future.delayed(2.seconds);
    }
    return _loadFromApi(replaceAll: true);
  }

  _loadFromCache() async {
    // We want to load the latest data if the user added a new post before
    // coming here.
    final shouldUseCache = _db.postsExist && widget.postToJumpTo == null;
    if (shouldUseCache) {
      // If data exists in cache, load that right away.
      final data = _db.getPosts();
      setState(() {
        this.data = data;
      });
    } else {
      // Show loading if can't display quickly from cache.
      setState(() {
        loading = true;
      });
    }
  }

  _getReportedItem(String itemId) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    final item = await prefs.getString(itemId);

    return item;
  }

  _loadFromApi({bool replaceAll = false}) async {
    final response = await _api.getPosts(_credentials.userId).execute();
    final existingData = data?.data;
    final newData = response.data;

    for (int i = 0; i < newData.data.length; i++) {
      var reportedItem = await _getReportedItem(newData.data.elementAt(i).id);
      if (reportedItem != null) {
        newData.data.removeAt(i);
      }
    }

    if (newData != null) {
      setState(() {
        if (existingData?.isNotEmpty == true && !replaceAll) {
          final currentPage = _controller.page.round();
          final currentPost = existingData[currentPage];

          data = Posts(
            data: [
              currentPost,
              // Remove the currently-visible post from the new dataset.
              ...newData.data..removeWhere((it) => it.id == currentPost.id)
            ],
          );
          if (currentPage != 0) _controller.jumpToPage(0);
        } else {
          data = newData;
        }
      });
      _db.putPosts(newData);
      _goToPostWithId(widget.postToJumpTo);
    } else if (response.error != null) {
      setState(() {
        error = response.error;
      });
    }
  }

  _goToPostWithId(String id) {
    if (id == null || data?.data == null) return;
    data.data.forEachIndexed((index, post) {
      if (post.id == id) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _controller.jumpToPage(index);
        });
      }
    });
  }

  _onPostDelete(String id) {
    setState(() {
      data.data.removeWhere((post) => post.id == id);
    });
  }

  _requestLocationPermission() {
    getIt<Permissions>().requestLocationAlways();
  }

  _enableLocationService() {
    getIt<Permissions>().openLocationSettings();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Theme(
        data: AppTheme.dark,
        child: Scaffold(
          backgroundColor: Colors.black,
          body: GuideOverlay(
            onDismiss: () => _settings.guideLearnedFeedSwipe = true,
            learned: () => _settings.guideLearnedFeedSwipe,
            imageBuilder: (context) => SvgPicture.asset(
              A.image('feed_guide_illustration', 'svg'),
              color: ColorSet.of(context).text,
            ),
            titleBuilder: (context) => Text('Swipe left for more'),
            child: RequiresLocationPermission(
              permissionNotGrantedBuilder: (context) {
                return _EmptyState.locationPermissionNotGranted(
                  onTap: _requestLocationPermission,
                );
              },
              serviceDisabledBuilder: (context) {
                return _EmptyState.locationServiceDisabled(
                  onTap: _enableLocationService,
                );
              },
              builder: (context) {
                return ResourceStreamBuilder<Posts>(
                  stream: Stream.value(
                    Resource(
                      data != null
                          ? data.data.isEmpty
                              ? ResourceStatus.empty
                              : ResourceStatus.success
                          : error != null
                              ? ResourceStatus.error
                              : ResourceStatus.loading,
                      data,
                      error,
                    ),
                  ),
                  onRetry: _reload,
                  contentBuilder: (context, data) {
                    final dataWithAds = data.data.expand((post) {
                      final index = data.data.indexOf(post);
                      if (index != 0 && index % 3 == 0) {
                        final adId = '${post.id}_adjacent_ad';
                        if (_failedAdsIds.contains(adId)) {
                          return [post];
                        } else {
                          final ad = PostInfo(id: adId);
                          return [post, ad];
                        }
                      } else {
                        return [post];
                      }
                    }).toList();
                    return RefreshIndicator(
                      onRefresh: _reload,
                      child: SingleChildScrollView(
                        physics: AlwaysScrollableScrollPhysics(),
                        child: SizedBox(
                          height: size.height,
                          // ExtendsPageView was used to be able to render one offscreen
                          // page to fully preload and pre-render media. If this
                          // functionality has been added to the default PageView as you
                          // are reading this, feel free to replace.
                          child: ExtentsPageView.extents(
                            controller: _controller,
                            itemCount: dataWithAds.length,
                            itemBuilder: (context, index) {
                              final item = dataWithAds[index];
                              if (item.id.contains('adjacent_ad')) {
                                return AdPost(
                                  onAdError: () {
                                    setState(() {
                                      _failedAdsIds.add(item.id);
                                    });
                                  },
                                );
                              } else {
                                return PostItem(
                                  key: ValueKey(item.id),
                                  id: item.id,
                                  onDelete: () => _onPostDelete(item.id),
                                );
                              }
                            },
                            extents: 2,
                          ),
                        ),
                      ),
                    );
                  },
                  emptyBuilder: (context) => RefreshIndicator(
                    onRefresh: _reload,
                    child: SingleChildScrollView(
                      physics: AlwaysScrollableScrollPhysics(),
                      child: Container(
                        height: size.height,
                        child: _EmptyState.noPosts(
                          onTap: widget.onCreatePostTap,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String title;
  final String message;
  final String buttonText;
  final Function onTap;

  _EmptyState._({
    @required this.title,
    @required this.message,
    @required this.buttonText,
    @required this.onTap,
  });

  _EmptyState.noPosts({@required Function onTap})
      : this._(
          title: strings().titleFeedNoPosts,
          message: strings().messageFeedNoPosts,
          buttonText: strings().actionFeedNoPosts,
          onTap: onTap,
        );

  _EmptyState.locationPermissionNotGranted({@required Function onTap})
      : this._(
          title: strings().titleLocationPermissionNeeded,
          message: strings().messageLocationPermissionNeededPosts,
          buttonText: strings().actionCommonAllow,
          onTap: onTap,
        );

  _EmptyState.locationServiceDisabled({@required Function onTap})
      : this._(
          title: strings().titleLocationServiceDisabled,
          message: strings().messageLocationServiceDisabledPosts,
          buttonText: strings().actionCommonAllow,
          onTap: onTap,
        );

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return Stack(
      children: [
        Positioned.fill(
          child: Image.asset(
            A.image('feed_empty'),
            fit: BoxFit.cover,
          ),
        ),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.black,
                Colors.black.withOpacity(0.68),
                Colors.black.withOpacity(0.65),
                Colors.transparent,
              ],
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
            ),
          ),
        ),
        Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(fontSize: 20),
                ),
                SizedBox(height: 24),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: colorSet.textLight,
                    height: 1.6,
                  ),
                ),
                SizedBox(height: 24),
                SubmitButton(
                  onPressed: onTap,
                  child: Text(buttonText),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
