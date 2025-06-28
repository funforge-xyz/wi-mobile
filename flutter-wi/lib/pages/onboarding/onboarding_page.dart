import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:wi/config/assets.dart';
import 'package:wi/data/local/settings.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/theme.dart';
import 'package:wi/widgets/extents_page_view.dart';

class OnboardingPage extends StatefulWidget {
  @override
  _OnboardingPageState createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _settings = getIt<Settings>();

  final _pages = [
    _Page(
      image: AssetImage(A.image('onboarding1', 'jpg')),
      title: strings().onboardingTitleFindPeople,
      message: strings().onboardingMessageFindPeople,
    ),
    _Page(
      image: AssetImage(A.image('onboarding2', 'jpg')),
      title: strings().onboardingTitleMakeFriends,
      message: strings().onboardingMessageMakeFriends,
    ),
    _Page(
      image: AssetImage(A.image('onboarding3', 'jpg')),
      title: strings().onboardingTitleDetectPeople,
      message: strings().onboardingMessageDetectPeople,
    ),
  ];

  int index = 0;

  _onGoClick(BuildContext context) {
    _settings.onboardingDone = true;
    Navigator.of(context).pushReplacementNamed(Routes.ROOT);
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Theme(
        data: AppTheme.dark,
        child: Scaffold(
          body: Stack(
            children: [
              ExtentsPageView.extents(
                extents: 2, // this + 2 to build everything at once
                itemCount: _pages.length,
                itemBuilder: (context, index) => _pages[index],
                onPageChanged: (i) {
                  setState(() => index = i);
                },
              ),
              Align(
                alignment: Alignment.bottomCenter,
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: SizedBox(
                    height: 48,
                    child: Row(
                      children: [
                        ..._pages.mapIndexed((_, i) => _PageDot(i == index)),
                        Expanded(
                          child: Container(),
                        ),
                        TextButton(
                          onPressed: () => _onGoClick(context),
                          child: Text(
                            index == _pages.length - 1
                                ? s.onboardingActionGetStarted
                                : s.onboardingActionSkip,
                          ),
                          style: ButtonStyle(
                            foregroundColor:
                                MaterialStateProperty.all(Colors.white),
                            overlayColor:
                                MaterialStateProperty.all(Colors.white24),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PageDot extends StatelessWidget {
  final bool current;
  _PageDot(this.current);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Material(
        shape: CircleBorder(),
        color: current ? Colors.white38 : Colors.transparent,
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Material(
            shape: CircleBorder(),
            color: current ? Colors.white70 : Colors.white38,
            child: SizedBox(width: 6, height: 6),
          ),
        ),
      ),
    );
  }
}

class _Page extends StatelessWidget {
  final ImageProvider image;
  final String title;
  final String message;
  const _Page({
    @required this.image,
    @required this.title,
    @required this.message,
  });
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: Image(
            image: image,
            fit: BoxFit.cover,
          ),
        ),
        Positioned.fill(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  Colors.black87,
                  Colors.black26,
                ],
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                A.image('app_icon'),
                width: 120,
                height: 120,
              ),
              SizedBox(height: 144),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 24),
              ),
              SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white60,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
