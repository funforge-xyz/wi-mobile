import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/models/document.dart';
import 'package:wi/data/models/message.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/remote/fetcher.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/data/repo/threads_repo.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/pages/profile/profile_view_page.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/shimmer.dart';
import 'package:wi/widgets/shimmer_text.dart';

class ChatItem extends StatefulWidget {
  final String threadId;
  final String userId;
  final Function onTap;

  ChatItem({
    Key key,
    @required this.threadId,
    @required this.userId,
    this.onTap,
  }) : super(key: key);

  @override
  _ChatItemState createState() => _ChatItemState();
}

class _ChatItemState extends State<ChatItem>
    with AutomaticKeepAliveClientMixin {
  final _usersRepo = getIt<UsersRepo>();
  final _threadsRepo = getIt<ThreadsRepo>();
  final _credentials = getIt<Credentials>();

  final _messagesFetcher = StreamFetcher<List<Document<Message>>>();
  final _userFetcher = FutureFetcher<ProfileModel>();

  @override
  initState() {
    super.initState();
    _messagesFetcher.use(
      () => _threadsRepo.getLastXMessages(widget.threadId, 1),
    );
    _userFetcher.use(() => _usersRepo.getProfileById(widget.userId));
    _messagesFetcher.load();
    _userFetcher.load();
  }

  @override
  void dispose() {
    super.dispose();
    _messagesFetcher.dispose();
    _userFetcher.dispose();
  }

  @override
  bool get wantKeepAlive => true;

  _onAvatarTap(BuildContext context) {
    ProfileViewPage.show(context, widget.userId);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return StreamBuilder<Resource<ProfileModel>>(
      stream: _userFetcher.stream,
      builder: (context, snapshot) {
        final profile = snapshot.data?.data;
        if (profile == null) {
          return _Shimmer.item();
        }
        return StreamBuilder<Resource<List<Document<Message>>>>(
          stream: _messagesFetcher.stream,
          builder: (context, snapshot) {
            final lastMessage = snapshot.data?.data?.firstOrNull()?.data;
            return _buildItem(context, profile, lastMessage);
          },
        );
      },
    );
  }

  Widget _buildItem(
    BuildContext context,
    ProfileModel user,
    Message lastMessage,
  ) {
    final colorSet = ColorSet.of(context);
    final notOwned = lastMessage?.senderId != _credentials.userId;
    final isUnseen = lastMessage != null && lastMessage.seen == null;
    final highlight = notOwned && isUnseen;
    return InkWell(
      onTap: widget.onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Row(
          children: [
            Avatar(
              user?.imageUrl ?? '',
              size: 48,
              onTap: () => _onAvatarTap(context),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    user?.name ?? '?',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: highlight ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                  SizedBox(height: 8),
                  if (lastMessage?.content?.isNotEmpty == true)
                    Text(
                      lastMessage.content,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: colorSet.textLighter,
                        fontWeight:
                            highlight ? FontWeight.w600 : FontWeight.w400,
                      ),
                    )
                ],
              ),
            ),
            if (lastMessage?.created != null) ...[
              SizedBox(width: 16),
              Text(
                lastMessage.created.toDate().readable(showTime: true),
                style: TextStyle(
                  color: colorSet.textLighter,
                  fontSize: 12,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Shimmer {
  static Widget item() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Shimmer(
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: Colors.black,
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  ShimmerText(
                    height: 14,
                    width: 100,
                  ),
                  SizedBox(height: 8),
                  ShimmerText(
                    height: 12,
                    width: 200,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
