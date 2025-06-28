import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/widgets.dart';
import 'package:wi/data/repo/notifications_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/chat/chat_page.dart';
import 'package:wi/pages/feed/post_comment_summary_page.dart';
import 'package:wi/pages/feed/post_page.dart';

typedef void OnMessageCallback(
  Map<String, dynamic> json,
  NotificationSource source,
);

/// Where the notification callback ([OnMessageCallback]) is being called from.
///
/// - [terminated] is when the app was killed and the user launched it by
/// tapping the notification.
/// - [background] when the app was running in the background and the user
/// launched it by tapping the notification.
/// - [foreground] when a notification arrived to the device as the app was in
/// the foreground, so there was no notification pushed to the system tray,
/// and [OnMessageCallback] was called to handle it. If the app doesn't do
/// something here, the user will not be a notification.
enum NotificationSource { terminated, background, foreground }

typedef void NotificationListener(
    String type, Map<String, dynamic> json, bool fromForeground);

abstract class NotificationsService {
  static const TYPE_NEW_MESSAGE = 'new_message';
  static const TYPE_NEW_COMMENT = 'new_comment';
  static const TYPE_NEW_LIKE = 'new_like';
  static const TYPE_COMMENTS_SUMMARY = 'comments_summary';
  static const TYPE_LIKES_SUMMARY = 'likes_summary';

  Future<bool> register();
  Future<bool> unregister();
  start(BuildContext context);
  handleOpen(BuildContext context, Map<String, dynamic> json,
      [bool fromForeground = false]);
  addListener(NotificationListener listener);
  removeListener(NotificationListener listener);
}

class NotificationsServiceImpl extends NotificationsService {
  final _fcm = FirebaseMessaging.instance;
  final _repo = getIt<UsersRepo>();
  final _notifsRepo = getIt<NotificationsRepo>();
  final _credentials = getIt<Credentials>();

  List<NotificationListener> _listeners = [];

  @override
  start(BuildContext context) => _start(context);

  _start(BuildContext context) async {
    print('Notifications start!');
    FirebaseMessaging.onMessage.listen((message) {
      print('onMessage: ${message.data}');
      handleOpen(context, message.data, true);
    });
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      print('onMessageOpenedApp: ${message.data}');
      handleOpen(context, message.data);
    });
    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      print('onTokenRefresh: $token');
      register();
    });
    _handleNotificationThatTriggeredAppOpen(context);
  }

  /// [FirebaseMessaging.getInitialMessage] will return a value if the app was
  /// launched from a terminated state due to the user tapping a notification.
  _handleNotificationThatTriggeredAppOpen(BuildContext context) async {
    final message = await FirebaseMessaging.instance.getInitialMessage();
    if (message != null) {
      handleOpen(context, message.data);
    }
  }

  @override
  handleOpen(BuildContext context, Map<String, dynamic> json,
      [bool fromForeground = false]) {
    print('Handling message open (foreground=$fromForeground)');
    print(json);

    // Fields are directly at root when source is not foreground and on iOS.
    final data = json['data'] ?? json;
    final type = data['type'];
    final notifRecordId = data['notifRecordId'];
    final postId = data['postId'];

    // Notify any listeners
    _listeners.forEach((listener) => listener(type, json, fromForeground));

    switch (type) {
      case NotificationsService.TYPE_NEW_MESSAGE:
        final threadId = data['threadId'];
        final userId = data['userId'];
        if (fromForeground) {
          // TODO: Show notification depending on whether we are in Chat Page
        } else {
          ChatPage.open(context, threadId: threadId, userId: userId);
        }
        break;
      case NotificationsService.TYPE_NEW_COMMENT:
        final commentId = data['commentId'];
        if (fromForeground) {
          // TODO
        } else {
          PostCommentSummaryPage.show(context, postId, commentId);
        }
        break;
      case NotificationsService.TYPE_NEW_LIKE:
        if (fromForeground) {
          // TODO
        } else {
          PostPage.show(context, postId);
        }
        break;
      case NotificationsService.TYPE_COMMENTS_SUMMARY:
        if (fromForeground) {
          // TODO
        } else {
          PostPage.show(context, postId);
        }
        break;
      case NotificationsService.TYPE_LIKES_SUMMARY:
        if (fromForeground) {
          // TODO
        } else {
          PostPage.show(context, postId);
        }
        break;
    }

    if (!fromForeground) {
      _notifsRepo.markAsOpened(notifRecordId);
    }
  }

  @override
  void addListener(NotificationListener listener) {
    if (!_listeners.contains(listener)) _listeners.add(listener);
  }

  @override
  void removeListener(NotificationListener listener) {
    if (_listeners.contains(listener)) _listeners.remove(listener);
  }

  @override
  Future<bool> register() async {
    try {
      final token = await _fcm.getToken();
      print('Registering with token: $token');
      await _fcm.subscribeToTopic('all');
      if (token == null) return false;
      await _repo.addNotificationToken(_credentials.userId, token);
      _credentials.notifToken = token;
      return true;
    } catch (e, s) {
      print(e);
      print(s);
      return false;
    }
  }

  @override
  Future<bool> unregister() async {
    try {
      await _fcm.unsubscribeFromTopic('all');
      await _repo.removeNotificationToken(
        _credentials.userId,
        _credentials.notifToken,
      );
      return true;
    } catch (e, s) {
      print(e);
      print(s);
      return false;
    }
  }
}
