import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/storage/feeds_storage.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/pages/camera/camera_page.dart';
import 'package:wi/services/compression.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/widgets/common_progress_indicator.dart';
import 'package:wi/widgets/submit_button.dart';

enum _ProgressStatus { idle, processing, uploading }

class AddPostPage extends StatefulWidget {
  final CameraResult result;

  AddPostPage._(this.result);

  static Future show(BuildContext context, CameraResult result) {
    return Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => AddPostPage._(result)),
    );
  }

  @override
  _AddPostPageState createState() => _AddPostPageState();
}

class _AddPostPageState extends State<AddPostPage>
    with TickerProviderStateMixin {
  final _credentials = getIt<Credentials>();
  final _compression = getIt<Compression>();
  final _storage = getIt<FeedsStorage>();
  final _api = getIt<Api>();

  Animation<double> _playPauseAnim;
  AnimationController _playPauseAnimCtrl;

  UploadTask _uploadTask;
  UploadTask _thumbUploadTask;

  TaskState _uploadTaskState;
  TaskState _thumbUploadTaskState;

  VideoPlayerController _videoPreviewController;
  final _textController = TextEditingController();

  _ProgressStatus status = _ProgressStatus.idle;

  File pickedMedia;
  File pickedMediaThumb;

  bool commentsAllowed = true;
  bool likesAllowed = true;

  bool get canPost => status == _ProgressStatus.idle;

  @override
  void initState() {
    super.initState();
    _playPauseAnimCtrl = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 100),
    );
    _playPauseAnim = 0.0
        .tweenTo(1.0)
        .animatedBy(_playPauseAnimCtrl)
        .curve(Curves.fastOutSlowIn);

    // Load only after the route transition animation completes to avoid jank.
    // A bit of a hacky solution but I couldn't find anything better.
    // Delay a tiny bit to avoid "initState not complete" error.
    Future.delayed(50.milliseconds, () {
      final modalRoute = ModalRoute.of(context);
      AnimationStatusListener listener;
      listener = (status) {
        print(status);
        if (status == AnimationStatus.completed) {
          _loadFile();
          modalRoute.animation.removeStatusListener(listener);
        }
      };
      modalRoute.animation.addStatusListener(listener);
    });
  }

  _loadFile() async {
    final camResult = widget.result;
    final file = camResult.file;
    final isImage = file.path.isImage;
    if (isImage) {
      setState(() {
        pickedMedia = file;
        status = _ProgressStatus.idle;
      });
    } else {
      final thumb = await _compression.getVideoThumbnail(file);
      setState(() {
        pickedMediaThumb = thumb;
        status = _ProgressStatus.processing;
      });
      final result = await _compression.compressVideo(file);
      _videoPreviewController = VideoPlayerController.file(result);
      await _videoPreviewController.initialize();
      await _videoPreviewController.setLooping(true);
      setState(() {
        pickedMedia = result;
        status = _ProgressStatus.idle;
      });
    }
  }

  @override
  void dispose() {
    // Cancel upload if still in progress but the user navigates away.
    if (_uploadTaskState?.isRunning == true) {
      _uploadTask.cancel();
    }
    if (_thumbUploadTaskState?.isRunning == true) {
      _thumbUploadTask.cancel();
    }
    super.dispose();
  }

  _onPostTap(BuildContext context) async {
    _videoPreviewController?.pause();
    setState(() {
      status = _ProgressStatus.uploading;
    });
    _uploadTask = _storage.uploadMedia(pickedMedia, _credentials.userId);
    if (pickedMediaThumb != null) {
      _thumbUploadTask =
          _storage.uploadThumb(pickedMediaThumb, _credentials.userId);
    }
    String mediaURL;
    String thumbURL;
    _uploadTask.snapshotEvents.listen((event) async {
      _uploadTaskState = event.state;
      if (event.state.isSuccess) {
        mediaURL = await event.ref.getDownloadURL();
        _onUploadComplete(context, mediaURL: mediaURL, thumbURL: thumbURL);
      }
    });
    _thumbUploadTask?.snapshotEvents?.listen((event) async {
      _thumbUploadTaskState = event.state;
      if (event.state.isSuccess) {
        final snapshot = await _thumbUploadTask.whenComplete(() {});
        thumbURL = await snapshot.ref.getDownloadURL();
        _onUploadComplete(context, mediaURL: mediaURL, thumbURL: thumbURL);
      }
    });
  }

  _onUploadComplete(
    BuildContext context, {
    String mediaURL,
    String thumbURL,
  }) async {
    if (!_uploadTaskState.isSuccess) return;
    if (pickedMediaThumb != null && !_thumbUploadTaskState.isSuccess) return;
    final res = await _api
        .addPost(
          content: _textController.text,
          mediaURL: mediaURL,
          thumbURL: thumbURL,
          authorId: _credentials.userId,
          allowComments: commentsAllowed,
          allowLikes: likesAllowed,
        )
        .execute();
    if (res.isSuccess()) {
      if (_videoPreviewController != null) {
        _videoPreviewController = null;
      }
      _textController.clear();
      Navigator.of(context).pop(res.data);
    } else if (res.isError()) {
      setState(() {
        status = _ProgressStatus.idle;
      });
      final e = res.error.message;
      print(e);
      print(res.error.stackTrace);
      Scaffold.of(context).showSnackBarFast(
        context,
        message: 'Error adding post: $e',
      );
    }
  }

  _onPlayPauseTap() async {
    if (_videoPreviewController == null) return;
    if (_videoPreviewController.value.isPlaying) {
      _playPauseAnimCtrl.reverse();
      await _videoPreviewController.pause();
    } else {
      _playPauseAnimCtrl.forward();
      await _videoPreviewController.play();
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final size = MediaQuery.of(context).size;
    final colorSet = ColorSet.of(context);
    return Scaffold(
      appBar: AppAppBar(
        leading: AppBarBackButton(),
        title: Text(s.titleNewPostPost),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        physics: ClampingScrollPhysics(),
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: Container(
              color: colorSet.surface,
              child: Stack(
                children: [
                  Container(
                    width: size.width,
                    height: size.width,
                    child: Center(
                      child: CommonProgressIndicator(),
                    ),
                  ),
                  if (pickedMedia != null || pickedMediaThumb != null)
                    (pickedMedia ?? pickedMediaThumb).path.isImage
                        ? Container(
                            constraints: BoxConstraints(
                              maxHeight: size.height / 2,
                            ),
                            child: Image.file(
                              pickedMedia ?? pickedMediaThumb,
                              fit: BoxFit.cover,
                              width: size.width,
                            ),
                          )
                        : Positioned.fill(
                            child: _videoPreviewController
                                        ?.value?.initialized ==
                                    true
                                ? FittedBox(
                                    fit: BoxFit.cover,
                                    child: SizedBox(
                                      height: size.height,
                                      width: size.height *
                                          (_videoPreviewController
                                                  ?.value?.aspectRatio ??
                                              1.0),
                                      child:
                                          VideoPlayer(_videoPreviewController),
                                    ),
                                  )
                                : Container(),
                          ),
                  if (_videoPreviewController != null &&
                      status == _ProgressStatus.idle) ...[
                    Container(
                      width: size.width,
                      height: size.width,
                      color: Colors.black26,
                      child: Center(
                        child: Material(
                          color: Colors.white12,
                          shape: CircleBorder(),
                          child: InkWell(
                            onTap: _onPlayPauseTap,
                            customBorder: CircleBorder(),
                            splashColor: Colors.white24,
                            highlightColor: Colors.white24,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: AnimatedIcon(
                                icon: AnimatedIcons.play_pause,
                                progress: _playPauseAnim,
                                color: Colors.white,
                                size: 40,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                  if (status != _ProgressStatus.idle) ...[
                    Container(color: Colors.black45),
                    Positioned.fill(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                              SizedBox(width: 16),
                              Text(
                                status == _ProgressStatus.processing
                                    ? s.labelNewPostMediaProcessing
                                    : s.labelNewPostMediaUploading,
                                style: TextStyle(
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (pickedMedia != null || pickedMediaThumb != null)
            Column(
              mainAxisAlignment: MainAxisAlignment.end,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: 16),
                Text(
                  widget.result.file.path.isImage
                      ? s.labelNewPostDescribeYourPhoto
                      : s.labelNewPostDescribeYourVideo,
                ),
                TextField(
                  enabled: status != _ProgressStatus.uploading,
                  controller: _textController,
                  decoration: InputDecoration(
                    contentPadding: EdgeInsets.symmetric(vertical: 8),
                    fillColor: Colors.transparent,
                    hintText: s.labelNewPostWriteSomething,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                  ),
                ),
                SizedBox(height: 16),
                Divider(height: 1),
                SwitchListTile(
                  value: commentsAllowed,
                  contentPadding: EdgeInsets.symmetric(vertical: 8),
                  title: Text(
                    s.labelNewPostCommentsAllowed,
                    style: TextStyle(fontSize: 14),
                  ),
                  onChanged: !canPost
                      ? null
                      : (value) {
                          setState(() => commentsAllowed = !commentsAllowed);
                        },
                ),
                Divider(height: 1),
                SwitchListTile(
                  value: likesAllowed,
                  contentPadding: EdgeInsets.symmetric(vertical: 8),
                  title: Text(
                    s.labelNewPostLikesAllowed,
                    style: TextStyle(fontSize: 14),
                  ),
                  onChanged: !canPost
                      ? null
                      : (value) {
                          setState(() => likesAllowed = !likesAllowed);
                        },
                ),
                Divider(height: 1),
                SizedBox(height: 16),
                Builder(builder: (context) {
                  return SubmitButton(
                    onPressed: canPost ? () => _onPostTap(context) : null,
                    child: Text(s.actionNewPostPostNow),
                    loading: status == _ProgressStatus.processing ||
                        status == _ProgressStatus.uploading,
                  );
                }),
              ],
            ),
        ],
      ),
    );
  }
}
