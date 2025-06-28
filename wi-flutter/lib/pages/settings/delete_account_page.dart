import 'package:flutter/material.dart';
import 'package:slider_button/slider_button.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/database/profile_repository.dart';
import 'package:wi/widgets/custom_card.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/data/auth.dart';

class DeleteAccountPage extends StatefulWidget {
  @override
  _DeleteAccountPageState createState() => _DeleteAccountPageState();
}

class _DeleteAccountPageState extends State<DeleteAccountPage> {
  final credentials = getIt<Credentials>();
  final profileRepository = getIt<ProfileRepository>();
  final auth = getIt<Auth>();

  bool _isLoading = false;
  String _errorMessage;

  @override
  void initState() {
    _errorMessage = "";
    _isLoading = false;

    super.initState();
  }

  deleteAccount() async {
    final s = strings();

    setState(() {
      _errorMessage = "";
      _isLoading = true;
    });

    try {
      await profileRepository.deleteProfile(credentials.userId);
      await auth.signOut();
      credentials.userId = null;
      Navigator.of(context).pushReplacementNamed(Routes.WELCOME);
    } catch (e) {
      setState(() {
        _errorMessage = s.messageDeleteAccountError;
        _isLoading = false;
      });
    }

    setState(() {
      _isLoading = false;
    });
  }

  Widget _showErrorMessage() {
    if (_errorMessage.length > 0 && _errorMessage != null) {
      return Text(
        _errorMessage,
        style: TextStyle(
          fontSize: 13.0,
          color: Colors.red,
          height: 1.0,
          fontWeight: FontWeight.w300,
        ),
      );
    }
    return Container(
      height: 0.0,
    );
  }

  Widget _showLoader() {
    if (_isLoading) {
      return CircularProgressIndicator();
    }

    return Container(
      height: 0.0,
    );
  }

  Widget _listItem(S s, String title, ThemeData theme) {
    final textStyle = TextStyle(
      fontSize: 14,
      color: theme.textTheme.caption.color,
    );

    return Container(
      child: Padding(
        padding: EdgeInsets.only(top: 4, bottom: 4),
        child: Row(
          children: [
            Text(
              s.labelCommonBullet,
              style: textStyle,
            ),
            SizedBox(width: 4),
            Text(
              title,
              style: textStyle,
            )
          ],
        ),
      ),
    );
  }

  Widget _buildDeleteDescripion(S s, ThemeData theme) {
    final descriptionItems = [
      s.labelDeleteAccountItemOne,
      s.labelDeleteAccountItemTwo,
      s.labelDeleteAccountItemThree,
      s.labelDeleteAccountItemFour,
    ];
    final listItems = descriptionItems
        .map<Widget>((item) => _listItem(s, item, theme))
        .toList();

    return CustomCard(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            CustomIcon(
              I.error,
              color: theme.errorColor,
              size: 24,
            ),
            SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  s.labelDeleteAccountItems,
                  style: TextStyle(
                    color: theme.errorColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                SizedBox(height: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: listItems,
                )
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildSlider(S s) {
    final sliderColor = Color(0xffff2c00);

    return SliderButton(
      shimmer: false,
      vibrationFlag: false,
      width: 280,
      backgroundColor: sliderColor.withOpacity(0.1),
      action: deleteAccount,
      label: Text(
        s.actionDeleteAccount,
        style: TextStyle(
          color: sliderColor.withOpacity(0.5),
          fontSize: 16,
        ),
      ),
      icon: Container(
        decoration: BoxDecoration(
          color: sliderColor,
          shape: BoxShape.circle,
        ),
      ),
    );
  }

  Widget _buildContent(S s, ThemeData theme) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(12),
      child: Column(
        children: [
          _showErrorMessage(),
          _buildDeleteDescripion(s, theme),
          SizedBox(height: 32),
          _buildSlider(s),
          _showLoader(),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppAppBar(
        title: Text(s.titleDeleteAccount),
        leading: Padding(
          padding: const EdgeInsetsDirectional.only(start: 8),
          child: AppBarBackButton(),
        ),
      ),
      body: _buildContent(s, theme),
    );
  }
}
