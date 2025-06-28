import 'package:flutter/material.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/nearby/nearby_person.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/widgets/custom_card.dart';
import 'package:wi/widgets/section_header.dart';

class NearbyPage extends StatefulWidget {
  @override
  _NearbyPageState createState() => _NearbyPageState();
}

class _NearbyPageState extends State<NearbyPage> {
  _onStartChatTap(String userId) {
    // TODO
  }

  _onViewProfileTap(String userId) {
    Navigator.of(context).pushNamed(
      Routes.USER_PROFILE,
      arguments: {userId: userId},
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    return ListView(
      padding: const EdgeInsets.all(16),
      physics: ClampingScrollPhysics(),
      children: <Widget>[
        SectionHeader(s.labelNearbyPeopleAroundYou),
        SizedBox(height: 16),
        CustomCard(
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              children: <Widget>[
                NearbyPerson(
                  image:
                      'https://cdn.zeplin.io/5ef24fc03f256a45b8d887de/assets/52dc7c72-4932-466f-8dc5-92ba111e24fe.png',
                  name: 'Logan Piers',
                  summary:
                      'Hello! I would like to add. Hello! I would like to add. Hello! I would like to add.',
                  onStartChatTap: () => _onStartChatTap(null), // TODO
                  onViewProfileTap: () => _onViewProfileTap(null), // TODO,
                ),
                SizedBox(height: 16),
                NearbyPerson(
                  image:
                      'https://cdn.zeplin.io/5ef24fc03f256a45b8d887de/assets/2ce94352-724e-47cd-b917-3cdf70936983.png',
                  name: 'Nicky Parsons',
                  summary: 'Hi! Let\'s connect on WI?',
                  onStartChatTap: () => _onStartChatTap(null), // TODO
                  onViewProfileTap: () => _onViewProfileTap(null), // TODO,
                ),
                SizedBox(height: 16),
                NearbyPerson(
                  image:
                      'https://cdn.zeplin.io/5ef24fc03f256a45b8d887de/assets/bb680c6a-5a88-4453-a91a-e10a698f38f8.png',
                  name: 'Ema Heart',
                  summary: 'I sent you a request!',
                  onStartChatTap: () => _onStartChatTap(null), // TODO
                  onViewProfileTap: () => _onViewProfileTap(null), // TODO,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
