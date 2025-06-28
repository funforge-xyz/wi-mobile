import 'package:flutter/material.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/nearby/nearby_person.dart';
import 'package:wi/widgets/custom_card.dart';
import 'package:wi/widgets/person_box.dart';
import 'package:wi/widgets/section_header.dart';

class ChatsPage extends StatefulWidget {
  @override
  _ChatsPageState createState() => _ChatsPageState();
}

class _ChatsPageState extends State<ChatsPage> {
  _onChatTap(dynamic id) {
    // TODO
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    return ListView(
      padding: const EdgeInsets.all(16),
      physics: ClampingScrollPhysics(),
      children: <Widget>[
        SectionHeader(s.titleChatsPeoplearoundYou),
        SizedBox(height: 16),
        CustomCard(
          child: Column(
            children: <Widget>[
              PersonBox(
                image:
                    'https://cdn.zeplin.io/5ef24fc03f256a45b8d887de/assets/636b06a2-17f1-4583-9b88-6ac17031da0d.png',
                name: 'Deborah Jones',
                summary: 'Hello! You look kinda...',
                date: DateTime.now().subtract(Duration(hours: 3)),
                onTap: () => _onChatTap(null), // TODO
              ),
              PersonBox(
                image:
                    'https://cdn.zeplin.io/5ef24fc03f256a45b8d887de/assets/63a71f83-1bed-4f2d-8399-08c4175b7550.png',
                name: 'Raymond',
                summary: 'Nooo! No way bro!',
                date: DateTime.now().subtract(Duration(hours: 5)),
                onTap: () => _onChatTap(null), // TODO
              ),
              PersonBox(
                image:
                    'https://cdn.zeplin.io/5ef24fc03f256a45b8d887de/assets/899818a5-44a1-476a-a25f-e67f326ea734.png',
                name: 'Lizy',
                summary: 'Thank you for the drink!',
                date: DateTime.now().subtract(Duration(days: 3)),
                onTap: () => _onChatTap(null), // TODO
              ),
            ],
          ),
        ),
        SizedBox(height: 24),
        SectionHeader(s.titleChatsFriends),
        SizedBox(height: 16),
        CustomCard(
          child: Column(
            children: <Widget>[
              PersonBox(
                image:
                    'https://cdn.zeplin.io/5ef24fc03f256a45b8d887de/assets/7952eff2-a339-4c7d-b9f6-912cceb40269.png',
                name: 'Logan Piers',
                summary: 'Yes, I will be waiting.',
                date: DateTime.now().subtract(Duration(days: 3)),
                onTap: () => _onChatTap(null), // TODO
              ),
              PersonBox(
                image:
                    'https://cdn.zeplin.io/5ef24fc03f256a45b8d887de/assets/3ad420be-9a79-4ac8-84ac-f76ab4f8ff57.png',
                name: 'Nicky Parsons',
                summary: 'Cinema City 8:00 PM?',
                date: DateTime.now().subtract(Duration(days: 3)),
                onTap: () => _onChatTap(null), // TODO
              ),
              PersonBox(
                image:
                    'https://cdn.zeplin.io/5ef24fc03f256a45b8d887de/assets/95647adc-575b-40d0-b360-fc24ba578d47.png',
                name: 'Ema Heart',
                summary: 'Happy birthday friend!',
                date: DateTime.now().subtract(Duration(days: 3)),
                onTap: () => _onChatTap(null), // TODO
              ),
              PersonBox(
                image:
                    'https://cdn.zeplin.io/5ef24fc03f256a45b8d887de/assets/a5a6e8ae-4517-475f-8d87-7aa7c64b3003.png',
                name: 'Ema Heart',
                summary: 'Very nice, love it.',
                date: DateTime.now().subtract(Duration(days: 3)),
                onTap: () => _onChatTap(null), // TODO
              ),
            ],
          ),
        ),
      ],
    );
  }
}
