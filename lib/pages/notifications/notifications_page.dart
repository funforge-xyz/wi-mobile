import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/data/repo/notifications_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/notification_record.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/profile/profile_view_page.dart';
import 'package:wi/services/notifications_service.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/infinite_loader_mixin.dart';
import 'package:wi/widgets/resource_stream_builder.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/sup/quick_sup.dart';

class NotificationsPage extends StatefulWidget {
  @override
  _NotificationsPageState createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage>
    with InfiniteLoaderMixin {
  final _credentials = getIt<Credentials>();
  final _repo = getIt<NotificationsRepo>();

  final _fetcher = PaginatingStreamFetcher<List<Document<NotificationRecord>>,
      DocumentSnapshot>();

  @override
  void initState() {
    super.initState();
    _fetcher.usePagination(
      (cursor) => _repo.getNotifications(_credentials.userId, cursor: cursor),
      (data) => data.lastOrNull()?.snapshot,
    );
    _fetcher.load();

    initInfiniteLoad(() async {
      _fetcher.loadNext();
      return false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    return ResourceStreamBuilder<List<Document<NotificationRecord>>>(
      stream: _fetcher.stream,
      onRetry: _fetcher.load,
      emptyBuilder: (context) {
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: QuickSup.empty(
              image: Icon(
                Icons.notifications_none_outlined,
                size: 36,
              ),
              title: s.labelNotifssNoNotifs,
              subtitle: s.messageNotifsNoNotifs,
            ),
          ),
        );
      },
      contentBuilder: (context, data) {
        return ListView.builder(
          controller: infiniteScrollController,
          physics: ClampingScrollPhysics(),
          itemCount: data.length,
          itemBuilder: (context, index) => NotificationItem(data[index]),
        );
      },
    );
  }
}

class NotificationItem extends StatelessWidget {
  final Document<NotificationRecord> doc;
  NotificationItem(this.doc);

  final _usersRepo = getIt<UsersRepo>();
  final _notifsRepo = getIt<NotificationsRepo>();
  final _notifsService = getIt<NotificationsService>();

  _onTap(BuildContext context) {
    _notifsService.handleOpen(context, doc.data.toJson());
  }

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    final data = doc.data;
    final opened = data.open != null;
    final read = data.read != null;
    return VisibilityDetector(
      key: ObjectKey(data),
      onVisibilityChanged: (info) {
        if (!read && info.visibleFraction == 1.0) {
          _notifsRepo.markAsRead(doc.ref.id);
        }
      },
      child: Material(
        color: opened ? Colors.transparent : null,
        child: InkWell(
          onTap: () => _onTap(context),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                StreamBuilder<Document<ProfileModel>>(
                  stream: _usersRepo.getProfileByIdLive(data.creatorUserId),
                  builder: (context, snapshot) {
                    final user = snapshot.data?.data;
                    final imageUrl =
                        data?.data != null ? data.data['imageUrl'] : null;
                    return Avatar(
                      user?.imageUrl ?? imageUrl ?? '',
                      size: 36,
                      onTap: () =>
                          ProfileViewPage.show(context, data.creatorUserId),
                    );
                  },
                ),
                SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      data.body ?? '?',
                      style: TextStyle(
                        fontWeight: opened ? null : FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      data.createdAt.toDate().relativeReadable() ?? '',
                      style: TextStyle(
                        fontSize: 12,
                        color: colorSet.textLighter,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
