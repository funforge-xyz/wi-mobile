import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/data/repo/notifications_repo.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/repo/threads_repo.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/chats/chats_page.dart';
import 'package:wi/pages/notifications/notifications_page.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/counter_badge.dart';

class MessagesPage extends StatefulWidget {
  final bool startWithNotifications;
  MessagesPage({this.startWithNotifications = false});
  @override
  _MessagesPageState createState() => _MessagesPageState();
}

class _MessagesPageState extends State<MessagesPage> {
  final _notifsRepo = getIt<NotificationsRepo>();
  final _threadsRepo = getIt<ThreadsRepo>();
  final _credentials = getIt<Credentials>();

  final _unreadMessagesFetcher = StreamFetcher<int>();
  final _unopenedNotifsFetcher = StreamFetcher<int>();

  bool startWithNotifications = false;

  @override
  void initState() {
    super.initState();
    startWithNotifications = widget.startWithNotifications;

    _unreadMessagesFetcher.use(
      () => _threadsRepo.getUnreadCount(_credentials.userId),
    );
    _unreadMessagesFetcher.load();
    _unopenedNotifsFetcher.use(
      () => _notifsRepo.getUnopenedCount(_credentials.userId),
    );
    _unopenedNotifsFetcher.load();
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final colorSet = ColorSet.of(context);
    return DefaultTabController(
      initialIndex: startWithNotifications ? 1 : 0,
      length: 2,
      child: Scaffold(
        appBar: AppAppBar(
          title: Text(s.titleMessagesMessages),
          bottom: PreferredSize(
            preferredSize: Size(double.infinity, 48),
            child: TabBar(
              labelStyle: TextStyle(),
              indicatorColor: colorSet.primary,
              labelColor: colorSet.primary,
              unselectedLabelColor: colorSet.text,
              tabs: [
                StreamBuilder<int>(
                  stream: _threadsRepo.getUnreadCount(_credentials.userId),
                  initialData: 0,
                  builder: (context, snapshot) {
                    final count = snapshot.data;
                    return BadgedTab(
                      label: s.labelMessagesNotifications.toUpperCase(),
                      count: count ?? 0,
                    );
                  },
                ),
                StreamBuilder<Resource<int>>(
                  stream: _unopenedNotifsFetcher.stream,
                  initialData: Resource.success(0),
                  builder: (context, snapshot) {
                    final count = snapshot.data?.data;
                    return BadgedTab(
                      label: s.titleNotifications.toUpperCase(),
                      count: count ?? 0,
                    );
                  },
                ),
              ],
            ),
          ),
        ),
        body: TabBarView(
          children: [
            ChatsPage(),
            NotificationsPage(),
          ],
        ),
      ),
    );
  }
}

class BadgedTab extends StatelessWidget {
  final String label;
  final int count;

  BadgedTab({
    @required this.label,
    this.count = 0,
  });

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return Tab(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(label),
          ),
          AnimatedSwitcher(
            duration: Duration(milliseconds: 400),
            transitionBuilder: (child, animation) {
              return ScaleTransition(
                scale: CurvedAnimation(
                  parent: animation,
                  curve: Curves.bounceOut,
                  reverseCurve: Curves.easeOutQuint,
                ),
                child: child,
              );
            },
            child: count <= 0
                ? Container()
                : Padding(
                    padding:
                        const EdgeInsetsDirectional.only(start: 2, bottom: 16),
                    child: CounterBadge(count),
                  ),
          ),
        ],
      ),
    );
  }
}
