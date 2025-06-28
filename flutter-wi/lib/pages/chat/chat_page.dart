import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:rxdart/rxdart.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/local/blocked_info.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/models/attachment.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/message.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/data/repo/threads_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/data/storage/attachments_storage.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/pages/chat/images_page.dart';
import 'package:wi/pages/chat/message_item.dart';
import 'package:wi/pages/common/fullscreen_photo_page.dart';
import 'package:wi/pages/profile/profile_view_page.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/widgets/attachment_options.dart';
import 'package:wi/widgets/attachment_upload.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/common_progress_indicator.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/widgets/resource_stream_builder.dart';
import 'package:wi/widgets/sticky_grouped_list.dart';
import 'package:wi/widgets/sup/quick_sup.dart';

class ChatPage extends StatefulWidget {
  final String threadId;
  final String userId;

  ChatPage._(this.threadId, this.userId);

  static Future open(
    BuildContext context, {
    @required String userId,
    String threadId,
  }) async {
    String thrdId = threadId ??
        await getIt<ThreadsRepo>().getExistingThreadId(
          myId: getIt<Credentials>().userId,
          partnerId: userId,
        );
    Navigator.push(context, MaterialPageRoute(builder: (context) {
      return ChatPage._(thrdId, userId);
    }));
  }

  @override
  _ChatPageState createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> with TickerProviderStateMixin {
  final _credentials = getIt<Credentials>();
  final _usersRepo = getIt<UsersRepo>();
  final _threadsRepo = getIt<ThreadsRepo>();
  final _storage = getIt<AttachmentsStorage>();

  final _inputController = TextEditingController();
  final _inputStreamController = BehaviorSubject<String>();

  final _attachmentsLoadingController = BehaviorSubject<bool>();
  final _attachmentsController =
      BehaviorSubject<List<AttachmentPick>>.seeded([]);

  final _userFetcher = StreamFetcher<Document<ProfileModel>>();
  final _selfUserFetcher = StreamFetcher<Document<ProfileModel>>();
  final _messagesFetcher =
      PaginatingStreamFetcher<List<MessageDocument>, DocumentSnapshot>();
  final _blockedInfoFetcher = ResourceStreamFetcher<BlockedInfo>();

  final _scrollController = GroupedItemScrollController();

  OverlayEntry _attachmentPickerEntry;

  String threadId;

  bool get threadExists => threadId != null;

  @override
  void initState() {
    super.initState();
    threadId = widget.threadId;
    _userFetcher.use(() => _usersRepo.getProfileByIdLive(widget.userId)).load();
    _selfUserFetcher
        .use(() => _usersRepo.getProfileByIdLive(_credentials.userId))
        .load();
    _messagesFetcher.usePagination(
      (cursor) =>
          _threadsRepo.getThreadMessages(threadId, cursorDocument: cursor),
      (data) => data.lastOrNull()?.snapshot,
    );
    if (threadExists) _messagesFetcher.load();
    _inputController.addListener(() {
      _inputStreamController.sink.add(_inputController.text);
    });
    _blockedInfoFetcher.use(() => _usersRepo.getBlockedInfo()).load();
  }

  @override
  dispose() {
    _inputStreamController.close();
    _attachmentsLoadingController.close();
    _attachmentsController.close();
    _userFetcher.dispose();
    _messagesFetcher.dispose();
    super.dispose();
  }

  bool _allAttachmentsUploaded(BuildContext context) {
    final t = _attachmentsController.value.where((a) => a.ref == null).isEmpty;
    if (!t) {
      Scaffold.of(context).showSnackBarFast(
        context,
        message: strings().messageChatPleaseWaitForUploads,
      );
    }
    return t;
  }

  _onSendTap(BuildContext context) async {
    if (!_allAttachmentsUploaded(context)) return;
    final text = _inputController.text;
    final attachments = _attachmentsController.value;
    if ((text == null || text.isEmpty) && attachments.isEmpty) return;
    final myId = _credentials.userId;
    _setTreadIdIfNotExist(myId);
    _threadsRepo.addMessage(threadId, myId, text, attachments);
    _attachmentsController.sink.add([]);
    _inputController.clear();
    _threadsRepo.updateThreadLastUpdated(threadId);
  }

  _onAttachTap(BuildContext context) async {
    _attachmentPickerEntry = AttachmentOptions.show(
      context,
      onPick: (files) {
        _attachmentPickerEntry = null;
        _attachmentsController.sink.add(_attachmentsController.value + files);
        _attachmentsLoadingController.sink.add(false);
      },
      onLoading: () {
        _attachmentsLoadingController.sink.add(true);
      },
      onDismiss: () {
        _attachmentPickerEntry = null;
      },
    );
  }

  _onUserTap(String userId) {
    ProfileViewPage.show(context, userId);
  }

  _onShowImageTap(BuildContext context, String image) async {
    final file = await _storage.getImageFile(
      image,
      source: CacheSource.messageImages,
    );
    FullscreenPhotoPage.show(context, file.path, isFile: true);
  }

  _onShowImagesTap(BuildContext context, List<Attachment> images) {
    ImagesPage.show(context, images);
  }

  _onAttachmentTap(Attachment attachment) async {
    if (await canLaunch(attachment.url)) {
      launch(attachment.url);
    }
  }

  _onMarkMessageAsSeen(Document<Message> message) {
    _threadsRepo.markMessageAsSeen(message);
  }

  _setTreadIdIfNotExist(String id) {
    if (!threadExists) {
      threadId =
          _threadsRepo.startThread(myId: id, partnerId: widget.userId).id;
      // Wait a bit to avoid a weird permission issue with Firebase.
      Future.delayed(200.milliseconds, () => _messagesFetcher.load());
    }
  }

  Future<bool> _shouldPop() async {
    if (_attachmentPickerEntry == null) return true;
    _attachmentPickerEntry.remove();
    _attachmentPickerEntry = null;
    return false;
  }

  double _lastScrollPixels = 0;

  Future _handleScroll(double pixels, double maxExtent) async {
    final diff = (pixels - _lastScrollPixels).abs();
    if (diff < 200) return;
    _lastScrollPixels = pixels;
    if (pixels > maxExtent - 200) {
      _messagesFetcher.loadNext();
    }
  }

  _showBlockDialog(String userId) {
    showDialog<Null>(
      context: context,
      builder: (BuildContext context) {
        final s = strings();
        return AlertDialog(
          title: Text(s.actionBlockUser),
          content: Text(s.messageBlockUser),
          actions: <Widget>[
            FlatButton(
              child: Text(s.actionCommonCancel),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            FlatButton(
              child: Text(s.actionBlockUser),
              onPressed: () {
                Navigator.of(context).pop();
                _blockUser(userId);
              },
            ),
          ],
        );
      },
    );
  }

  _showUnblockDialog(String userId) {
    showDialog<Null>(
      context: context,
      builder: (BuildContext context) {
        final s = strings();
        return AlertDialog(
          title: Text(s.actionUnblockUser),
          content: Text(s.messageUnblockUser),
          actions: <Widget>[
            FlatButton(
              child: Text(s.actionCommonCancel),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            FlatButton(
              child: Text(s.actionUnblockUser),
              onPressed: () {
                Navigator.of(context).pop();
                _unblockUser(userId);
              },
            ),
          ],
        );
      },
    );
  }

  _blockUser(String userId) async {
    await _usersRepo.blockUser(userId);
    _blockedInfoFetcher.load();
  }

  _unblockUser(String userId) async {
    await _usersRepo.unblockUser(userId);
    _blockedInfoFetcher.load();
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);
    final size = MediaQuery.of(context).size;

    return WillPopScope(
      onWillPop: _shouldPop,
      child: StreamBuilder<Resource<Document<ProfileModel>>>(
        stream: _selfUserFetcher.stream,
        builder: (context, snapshot) {
          final self = snapshot.data?.data?.data;
          return StreamBuilder<Resource<Document<ProfileModel>>>(
            stream: _userFetcher.stream,
            builder: (context, snapshot) {
              final userId = snapshot.data?.data?.ref?.id;
              final user = snapshot.data?.data?.data;
              return StreamBuilder<Resource<BlockedInfo>>(
                  stream: _blockedInfoFetcher.stream,
                  builder: (context, snapshot) {
                    final blockedInfo = snapshot.data?.data;
                    final isBlocked = blockedInfo?.isBlocked(userId) ?? false;
                    final isBlockedOrBlockedBy =
                        blockedInfo?.isBlockedOrBlockedBy(userId) ?? false;
                    print(blockedInfo);

                    return Scaffold(
                      appBar: AppAppBar(
                        showDivider: true,
                        leading: AppBarBackButton(),
                        titleSpacing: 8,
                        title: Center(
                          child: _UserButton(
                            user: user,
                            onTap: () => _onUserTap(userId),
                          ),
                        ),
                        actions: <Widget>[
                          PopupMenuButton<int>(
                            itemBuilder: (context) => [
                              if (blockedInfo != null)
                                PopupMenuItem(
                                  value: 1,
                                  child: Text(isBlocked
                                      ? s.actionUnblockUser
                                      : s.actionBlockUser),
                                ),
                            ],
                            onSelected: (value) {
                              switch (value) {
                                case 1:
                                  if (isBlocked) {
                                    _showUnblockDialog(userId);
                                  } else {
                                    _showBlockDialog(userId);
                                  }
                                  break;

                                default:
                                  throw ArgumentError.value(value);
                              }
                            },
                          ),
                        ],
                      ),
                      body: Column(
                        children: <Widget>[
                          Expanded(
                            child: ResourceStreamBuilder<List<MessageDocument>>(
                              stream: _messagesFetcher.stream,
                              initialData: Resource.empty(),
                              contentBuilder: (context, data) {
                                return NotificationListener<ScrollNotification>(
                                  onNotification: (scrollNotification) {
                                    final metrics = scrollNotification.metrics;
                                    final maxExtent = metrics.maxScrollExtent;
                                    _handleScroll(metrics.pixels, maxExtent);
                                    return true;
                                  },
                                  child: StickyGroupedListView<
                                      Document<Message>, DateTime>(
                                    padding: const EdgeInsets.all(16),
                                    elements: data,
                                    groupBy: (item) => item.data.createdDay,
                                    floatingHeader: true,
                                    reverse: true,
                                    itemScrollController: _scrollController,
                                    order: StickyGroupedListOrder.DESC,
                                    separator: SizedBox(height: 4),
                                    groupSeparatorBuilder: (item) {
                                      return Padding(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 8),
                                        child: Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Material(
                                              color: theme.backgroundColor,
                                              borderRadius:
                                                  BorderRadius.circular(20),
                                              child: Padding(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                  horizontal: 8,
                                                  vertical: 4,
                                                ),
                                                child: Text(
                                                  item.data.created
                                                          .toDate()
                                                          .readable(
                                                              showTime: false,
                                                              showTimeIfToday:
                                                                  false) ??
                                                      '?',
                                                  style: TextStyle(
                                                    color: colorSet.textLighter,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                    itemBuilder: (context, item) {
                                      final message = item.data;
                                      return MessageItem(
                                        item.ref.id,
                                        senderId: message.senderId,
                                        senderImageUrl: user?.imageUrl,
                                        selfImageUrl: self?.imageUrl,
                                        text: message.content,
                                        images: message.images,
                                        files: message.files,
                                        created: message.created,
                                        delivered: message.delivered,
                                        seen: message.seen,
                                        onImageTap: (image) =>
                                            _onShowImageTap(context, image),
                                        onShowImagesTap: () => _onShowImagesTap(
                                            context, message.images),
                                        onAttachmentTap: _onAttachmentTap,
                                        onMarkAsSeen: () =>
                                            _onMarkMessageAsSeen(item),
                                      );
                                    },
                                  ),
                                );
                              },
                              emptyBuilder: (context) {
                                return Center(
                                  child: QuickSup.empty(
                                    title: s.labelChatNoMessages,
                                    subtitle: s.messageChatNoMessages,
                                  ),
                                );
                              },
                            ),
                          ),
                          if (!isBlockedOrBlockedBy)
                            Container(
                              decoration: BoxDecoration(
                                color: colorSet.background,
                                boxShadow: [
                                  BoxShadow(
                                    offset: Offset(0, -2),
                                    blurRadius: 2,
                                    color: Colors.black.withOpacity(
                                        theme.isDark ? 0.15 : 0.08),
                                  ),
                                ],
                              ),
                              child: Padding(
                                padding: const EdgeInsets.only(
                                    left: 10, right: 10, bottom: 10),
                                child: Column(
                                  children: <Widget>[
                                    ConstrainedBox(
                                      constraints: BoxConstraints(
                                          maxHeight: size.height * 0.3),
                                      child: AnimatedSize(
                                        key: ValueKey('input-field'),
                                        vsync: this,
                                        duration: Duration(milliseconds: 200),
                                        curve: Curves.easeOutQuint,
                                        child:
                                            StreamBuilder<List<AttachmentPick>>(
                                          stream: _attachmentsController.stream,
                                          builder: (context, snapshot) {
                                            final attachments =
                                                snapshot.data ?? [];
                                            return ListView(
                                              shrinkWrap: true,
                                              padding: EdgeInsets.only(
                                                top: attachments.isEmpty
                                                    ? 0
                                                    : 10,
                                              ),
                                              physics: ClampingScrollPhysics(),
                                              children: attachments
                                                  .map((attachment) {
                                                    return AttachmentUpload(
                                                      key: ValueKey(
                                                          attachment.file.path),
                                                      file: attachment.file,
                                                      threadId: threadId,
                                                      onRemove: (ref) {
                                                        _attachmentsController
                                                            .sink
                                                            .add(
                                                          _attachmentsController
                                                              .value
                                                            ..remove(
                                                                attachment),
                                                        );
                                                      },
                                                      onSuccess: (ref) {
                                                        attachment.ref = ref;
                                                      },
                                                    );
                                                  })
                                                  .toList()
                                                  .withDividers(
                                                      SizedBox(height: 8)),
                                            );
                                          },
                                        ),
                                      ),
                                    ),
                                    SizedBox(height: 10),
                                    Row(
                                      children: <Widget>[
                                        Expanded(
                                          child: TextField(
                                            controller: _inputController,
                                            decoration: InputDecoration(
                                              fillColor: colorSet.background,
                                              hintText: s.labelTypeAMessage,
                                              border: InputBorder.none,
                                              disabledBorder: InputBorder.none,
                                              enabledBorder: InputBorder.none,
                                              errorBorder: InputBorder.none,
                                              focusedBorder: InputBorder.none,
                                              focusedErrorBorder:
                                                  InputBorder.none,
                                            ),
                                            maxLines: null,
                                            textCapitalization:
                                                TextCapitalization.sentences,
                                          ),
                                        ),
                                        StreamBuilder<bool>(
                                          stream: _attachmentsLoadingController
                                              .stream,
                                          builder: (context, snapshot) {
                                            final loadingAttachment =
                                                snapshot.data == true;
                                            return AnimatedSwitcher(
                                              child: loadingAttachment
                                                  ? CommonProgressIndicator()
                                                  : IconButton(
                                                      icon: CustomIcon(
                                                        I.attachment,
                                                        color: theme
                                                            .iconTheme.color
                                                            .withOpacity(0.7),
                                                      ),
                                                      onPressed: () =>
                                                          _onAttachTap(context),
                                                    ),
                                              duration:
                                                  Duration(milliseconds: 200),
                                              switchInCurve: Curves.bounceInOut,
                                              transitionBuilder:
                                                  (child, animation) {
                                                return ScaleTransition(
                                                  scale: animation,
                                                  child: child,
                                                );
                                              },
                                            );
                                          },
                                        ),
                                        StreamBuilder<List<AttachmentPick>>(
                                          stream: _attachmentsController.stream,
                                          builder: (context, snapshot) {
                                            final hasAttachments =
                                                snapshot.data?.isNotEmpty ==
                                                    true;
                                            return StreamBuilder<String>(
                                              stream:
                                                  _inputStreamController.stream,
                                              builder: (context, snapshot) {
                                                final isNotEmpty = snapshot
                                                        ?.data?.isNotEmpty ==
                                                    true;
                                                final enabled = isNotEmpty ||
                                                    hasAttachments;
                                                return AnimatedSwitcher(
                                                  // child: isTyping
                                                  child: true
                                                      ? IconButton(
                                                          key: ValueKey(
                                                              'send-button'),
                                                          padding:
                                                              EdgeInsets.zero,
                                                          color: theme
                                                              .primaryColor,
                                                          icon: Icon(
                                                            Icons.send,
                                                            color: theme
                                                                .accentColor
                                                                .withOpacity(
                                                              enabled ? 1 : 0.5,
                                                            ),
                                                          ),
                                                          onPressed: enabled
                                                              ? () =>
                                                                  _onSendTap(
                                                                      context)
                                                              : null,
                                                        )
                                                      : IconButton(
                                                          key: ValueKey(
                                                              'mic-button'),
                                                          icon: Icon(Icons.mic),
                                                          onPressed: () {},
                                                        ),
                                                  duration: Duration(
                                                      milliseconds: 200),
                                                  switchInCurve:
                                                      Curves.bounceInOut,
                                                  transitionBuilder:
                                                      (child, animation) {
                                                    return ScaleTransition(
                                                      scale: animation,
                                                      child: child,
                                                    );
                                                  },
                                                );
                                              },
                                            );
                                          },
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  });
            },
          );
        },
      ),
    );
  }
}

class _UserButton extends StatelessWidget {
  final ProfileModel user;
  final Function onTap;

  _UserButton({this.user, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Avatar(
              user?.imageUrl ?? '',
              size: 24,
              circle: true,
            ),
            SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  user?.name ?? '?',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
            SizedBox(width: 4),
          ],
        ),
      ),
    );
  }
}
