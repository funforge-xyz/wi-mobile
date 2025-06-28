import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:wi/config/icons.dart';

import 'package:wi/di.dart';
import 'package:wi/pages/chats/chats_page.dart';
import 'package:wi/pages/nearby/nearby_page.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_action.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/widgets/segmented_control.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _tabs = <String>[
    strings().titleNearby,
    strings().titleChats,
  ];

  final _pageController = PageController();

  String currentTab = 'Nearby';

  _onSearchTap() async {
    // TODO
  }

  _onMenuTap() {
    // TODO
    Navigator.pushNamed(context, Routes.SETTINGS);
  }

  _onNewChatTap() {
    // TODO
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    return Scaffold(
      appBar: AppAppBar(
        title: Text(s.appName),
        leading: Padding(
          padding: const EdgeInsetsDirectional.only(start: 8),
          child: AppBarAction(
            child: CustomIcon(I.search),
            attractive: true,
            onTap: _onSearchTap,
          ),
        ),
        actions: <Widget>[
          AppBarAction(
            child: Icon(I.overflowMenu),
            onTap: _onMenuTap,
          ),
          SizedBox(width: 8),
        ],
      ),
      floatingActionButton: currentTab != 'Chats'
          ? null
          : FloatingActionButton(
              child: Icon(I.newChat),
              onPressed: _onNewChatTap,
            ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SegmentedControl<String>(
              items: _tabs,
              onValueChanged: (item) {
                setState(() => currentTab = item);
                final index = _tabs.indexOf(item);
                _pageController.animateToPage(
                  index,
                  duration: Duration(milliseconds: 400),
                  curve: Curves.easeOutQuint,
                );
              },
              labelProvider: (context, item, _) => item,
              value: currentTab,
            ),
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: PageScrollPhysics(parent: ClampingScrollPhysics()),
              onPageChanged: (page) {
                setState(() {
                  currentTab = _tabs[page];
                });
              },
              children: <Widget>[
                NearbyPage(),
                ChatsPage(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
