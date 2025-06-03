import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:wi/data/models/ad_supported_list_item.dart';
import 'package:wi/data/repo/threads_repo.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/thread.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/chat/chat_page.dart';
import 'package:wi/pages/chats/chat_item.dart';
import 'package:wi/widgets/infinite_loader_mixin.dart';
import 'package:wi/widgets/list_ad.dart';
import 'package:wi/widgets/resource_stream_builder.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/sup/quick_sup.dart';

class ChatsPage extends StatefulWidget {
  ChatsPage({Key key}) : super(key: key);
  @override
  _ChatsPageState createState() => _ChatsPageState();
}

class _ChatsPageState extends State<ChatsPage> with InfiniteLoaderMixin {
  final _credentials = getIt<Credentials>();
  final _threadsRepo = getIt<ThreadsRepo>();

  final _fetcher =
      PaginatingStreamFetcher<List<Document<Thread>>, DocumentSnapshot>();

  @override
  initState() {
    _fetcher.usePagination(
      (cursor) => _threadsRepo.getThreadsWithUser(
        _credentials.userId,
        cursor: cursor,
      ),
      (data) => data.lastOrNull()?.snapshot,
    );
    _fetcher.load();

    initInfiniteLoad(() => _fetcher.loadNext());

    super.initState();
  }

  @override
  dispose() {
    _fetcher.dispose();
    super.dispose();
  }

  _onChatTap(String threadId, String userId) {
    ChatPage.open(context, threadId: threadId, userId: userId);
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    return ResourceStreamBuilder<List<Document<Thread>>>(
      stream: _fetcher.stream,
      onRetry: _fetcher.load,
      emptyBuilder: (context) {
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: QuickSup.empty(
              title: s.labelChatsNoChats,
              subtitle: s.messageChatsNoChats,
            ),
          ),
        );
      },
      contentBuilder: (context, data) {
        final dataWithAds = data.expand((thread) {
          final index = data.indexOf(thread);
          final wrappedThread = AdSupportedListItem(false, thread);
          if (index != 0 && index % 3 == 0) {
            final ad = AdSupportedListItem(true, null);
            return [wrappedThread, ad];
          } else {
            return [wrappedThread];
          }
        }).toList();
        return ListView.builder(
          controller: infiniteScrollController,
          shrinkWrap: true,
          physics: ClampingScrollPhysics(),
          itemCount: dataWithAds.length,
          itemBuilder: (context, index) {
            final item = dataWithAds[index];

            if (item.isAd) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ListAd(
                  androidAdUnit: 'ca-app-pub-8274717328460787/1857426865',
                  iosAdUnit: 'ca-app-pub-8274717328460787/5544572198',
                ),
              );
            }

            final thread = item.item.data;
            final threadId = item.item.ref.id;
            final partnerId =
                thread.users.firstWhere((id) => id != _credentials.userId);
            return ChatItem(
              key: ValueKey(threadId),
              threadId: threadId,
              userId: partnerId,
              onTap: () => _onChatTap(threadId, partnerId),
            );
          },
        );
      },
    );
  }
}
