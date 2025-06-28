import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:wi/config/assets.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/auth/login_page.dart';
import 'package:wi/widgets/app_bar_wi_footer.dart';

class WelcomePage extends StatelessWidget {
  TextSpan _buildTextSpan({@required String text, @required ThemeData theme}) {
    return TextSpan(
      text: text,
      style: TextStyle(
        fontSize: 16,
        color: theme.textTheme.caption.color,
      ),
    );
  }

  TextSpan _buildTextSpanLink({
    @required ThemeData theme,
    @required String text,
    @required Function onTap,
  }) {
    return TextSpan(
      text: text,
      style: TextStyle(
        color: theme.primaryColor,
        fontSize: 16,
      ),
      recognizer: TapGestureRecognizer()..onTap = onTap,
    );
  }

  Widget _buildPrivacyPolicyAndToS(ThemeData theme, S s) {
    return RichText(
      text: TextSpan(
        children: [
          _buildTextSpan(
            theme: theme,
            text: s.labelWelcomeReadOur,
          ),
          _buildTextSpanLink(
            theme: theme,
            text: s.labelWelcomePrivacyPolicy,
            onTap: () {
              launch('https://google.com');
            },
          ),
          _buildTextSpan(
            theme: theme,
            text: s.messageWelcomeTapAgreeAndContinue,
          ),
          _buildTextSpanLink(
            theme: theme,
            text: s.labelWelcomeTermsOfServices,
            onTap: () {
              launch('https://google.com');
            },
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context, ThemeData theme, S s, Size size) {
    return Container(
        height: size.height,
        width: double.infinity,
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.only(top: 80),
              child: Text(
                s.titleWelcome,
                style: TextStyle(fontSize: 24),
              ),
            ),
            SizedBox(height: size.height * 0.1),
            Container(
              height: size.height * 0.35,
              decoration: BoxDecoration(
                shape: BoxShape.rectangle,
                image: DecorationImage(
                  image: AssetImage(A.image('welcome')),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            SizedBox(height: size.height * 0.1),
            SizedBox(
              width: size.width * 0.9,
              child: _buildPrivacyPolicyAndToS(theme, s),
            ),
            SizedBox(height: size.height * 0.05),
            SizedBox(
              width: size.width * 0.9,
              height: 56,
              child: RaisedButton(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    Text(s.actionWelcomeAgreeContinue),
                    SizedBox(width: 10),
                    Icon(I.arrowForward),
                  ],
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) {
                        return LoginPage();
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ));
  }

  @override
  Widget build(BuildContext context) {
    Size size = MediaQuery.of(context).size;
    final s = strings();
    final theme = Theme.of(context);

    return Scaffold(
      body: _buildContent(context, theme, s, size),
      bottomNavigationBar: AppBarWIFooter(),
    );
  }
}
