import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/storage/attachments_storage.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/common/fullscreen_photo_page.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/exts/all.dart';

class AttachmentPick {
  final File file;
  Reference ref;

  AttachmentPick({
    @required this.file,
    this.ref,
  }) : assert(file != null);
}

typedef UploadSuccessCallback(Reference ref);
typedef UploadRemoveCallback(Reference ref);

class AttachmentUpload extends StatefulWidget {
  final File file;
  final String threadId;
  final UploadSuccessCallback onSuccess;
  final UploadRemoveCallback onRemove;

  AttachmentUpload({
    @required Key key,
    @required this.file,
    @required this.threadId,
    @required this.onSuccess,
    @required this.onRemove,
  })  : assert(key != null),
        assert(file != null),
        assert(threadId != null),
        assert(onSuccess != null),
        assert(onRemove != null),
        super(key: key);

  @override
  _AttachmentUploadState createState() {
    return _AttachmentUploadState();
  }
}

class _AttachmentUploadState extends State<AttachmentUpload>
    with AutomaticKeepAliveClientMixin<AttachmentUpload> {
  final _storage = getIt<AttachmentsStorage>();

  UploadTask _uploadTask;

  TaskState _currentState;

  @override
  void initState() {
    _upload();
    super.initState();
  }

  @override
  void dispose() {
    // Cancel upload if still in progress but the user navigates away.
    if (_currentState?.isRunning == true) {
      _uploadTask.cancel();
    }
    super.dispose();
  }

  @override
  bool get wantKeepAlive => true;

  _upload() {
    _uploadTask = _storage.upload(widget.file, widget.threadId);
    _uploadTask.snapshotEvents.listen((event) {
      _currentState = event.state;
      if (_currentState.isSuccess) widget.onSuccess(event.ref);
    });
  }

  _onCancel(TaskState state, Reference ref) async {
    if (state.isRunning) {
      _uploadTask.cancel();
    }
    if (state.isSuccess) {
      await ref?.delete();
    }
    widget.onRemove(ref);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required by [AutomaticKeepAliveClientMixin]

    final theme = Theme.of(context);
    final isImage = widget.file.path.isImage;
    final isNetworkImage = widget.file.path.isUrl;

    return Container(
      height: 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(width: 1, color: theme.dividerColor),
      ),
      child: Material(
        borderRadius: BorderRadius.circular(8),
        color: theme.colorScheme.surface,
        child: StreamBuilder<TaskSnapshot>(
          stream: _uploadTask.snapshotEvents,
          builder: (context, snapshot) {
            final data = snapshot.data;
            final progress =
                (data?.bytesTransferred ?? 0) / (data?.totalBytes ?? 1);
            final status = snapshot.data?.state;
            final ref = data?.ref;

            String text;
            if (status.isRunning) {
              text = 'Uploading...';
            } else if (status.isFailure) {
              text = 'Couldn\'t upload';
            } else {
              text = widget.file.path.fileNameWithExtension;
            }

            final duration = Duration(milliseconds: 200);

            return Row(
              children: <Widget>[
                SizedBox(width: 8),
                SizedBox(
                  height: 40,
                  width: 40,
                  child: TweenAnimationBuilder<double>(
                    duration: duration,
                    builder: (context, value, child) {
                      return Stack(
                        alignment: Alignment.center,
                        children: <Widget>[
                          AnimatedContainer(
                            duration: duration,
                            height: status.isRunning ? 34 : 40,
                            width: status.isRunning ? 34 : 40,
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(
                                value * 20 + 8,
                              ),
                              child: child,
                            ),
                          ),
                          TweenAnimationBuilder<double>(
                            duration: Duration(milliseconds: 300),
                            tween: Tween<double>(
                              begin: 0,
                              end: progress,
                            ),
                            curve: Curves.easeOutQuint,
                            builder: (context, progressValue, child) {
                              return CircularProgressIndicator(
                                value: progressValue,
                                strokeWidth: value * 3,
                                backgroundColor: value == 0.0
                                    ? Colors.transparent
                                    : theme.primaryColor.withOpacity(0.2),
                                valueColor: value == 0.0
                                    ? AlwaysStoppedAnimation(Colors.transparent)
                                    : null,
                              );
                            },
                          ),
                        ],
                      );
                    },
                    tween: Tween<double>(
                      begin: status.isRunning ? 0 : 1,
                      end: status.isRunning ? 1 : 0,
                    ),
                    child: isImage
                        ? InkWell(
                            onTap: () {
                              FullscreenPhotoPage.show(
                                context,
                                widget.file.path,
                                isFile: true,
                                showOpenInBrowserButton: false,
                              );
                            },
                            child: Hero(
                              tag: widget.file.path,
                              child: isNetworkImage
                                  ? Image.network(
                                      widget.file.path,
                                      width: 40,
                                      height: 40,
                                      fit: BoxFit.cover,
                                    )
                                  : Image.file(
                                      File(widget.file.path),
                                      width: 40,
                                      height: 40,
                                      fit: BoxFit.cover,
                                    ),
                            ),
                          )
                        : SizedBox(
                            height: 40,
                            width: 40,
                            child: Center(
                              child: CustomIcon(I.attachment),
                            ),
                          ),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Text(
                    text ?? '?',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                SizedBox(width: 8),
                if (status.isFailure)
                  IconButton(
                    icon: Icon(Icons.refresh),
                    onPressed: _upload,
                  ),
                if (!status.isFailure)
                  IconButton(
                    icon: Icon(
                      status.isRunning ? Icons.close : Icons.delete_outline,
                    ),
                    onPressed: () => _onCancel(status, ref),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}
