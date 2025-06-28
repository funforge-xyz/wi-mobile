import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:wi/config/app_config.dart';
import 'package:wi/config/assets.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/local/database.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/circle_button.dart';
import 'package:wi/pages/permissions/permissions_page.dart';
import 'package:wi/pages/profile/profile_page.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/services/location.dart';
import 'package:wi/utils/logger.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/custom_text_form_field.dart';
import 'package:wi/widgets/input_label.dart';
import 'package:wi/widgets/passive_text_button.dart';
import 'package:wi/widgets/submit_button.dart';

const _kTransitionDuration = Duration(milliseconds: 400);
const _kTransitionCurve = Curves.fastOutSlowIn;

class LoginPage extends StatefulWidget {
  LoginPage();

  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final authService = getIt<Auth>();
  final usersRepo = getIt<UsersRepo>();
  final credentials = getIt<Credentials>();
  final _api = getIt<Api>();
  final _database = getIt<Database>();
  final _location = getIt<LocationService>();
  final _strings = getIt<S>();

  String _email;
  String _password;
  String _repeatPassword;
  String _errorMessage;

  bool _isLoginForm = true;
  bool _isLoading = false;

  // Check if form is valid before perform login or signup
  bool validateAndSave() {
    final form = _formKey.currentState;
    if (form.validate()) {
      form.save();
      return true;
    }
    return false;
  }

  Future _processLoginRegister(String userId) async {
    final user = await usersRepo.getProfileById(userId);
    // Kick user out if they are trying to log into a deleted user.
    if (user?.isDeleted == true) {
      setState(() {
        _errorMessage = _strings.errorLoginAccountDeleted;
        _isLoading = false;
      });
      authService.signOut();
    } else {
      credentials.userId = userId;
      // Cache our profile. We use some of this information to avoid extra reads
      // later.
      _database.putProfile(user);
      usersRepo.setUserOnline(userId);
      await _api.updateAuthHeader();
    }
  }

  void _goToNextStep(String route, {dynamic nextRouteArgs}) {
    Navigator.of(context).popUntil((route) => route.isFirst);
    PermissionsPage.show(
      context,
      nextRoute: route,
      nextRouteArgs: nextRouteArgs,
      replaceRoute: true,
    );
  }

  Future _onUsernamePasswordRegistration() async {
    final userId = await authService.signUp(_email, _password);
    authService.sendEmailVerification();

    ProfileModel profileModel = ProfileModel(email: _email);
    await usersRepo.createProfileFromAuthUser(
      userId,
      profileModel,
    );
    await _processLoginRegister(userId);
    _goToNextStep(
      Routes.MY_PROFILE,
      nextRouteArgs: ProfilePageArguments(true, allowNavigateBack: false),
    );
  }

  _onChangeFormTypeTap(BuildContext context) {
    resetForm();
    setState(() => _isLoginForm = !_isLoginForm);
  }

  // Perform login or signup
  void validateAndSubmit(BuildContext context) async {
    setState(() {
      _errorMessage = "";
      _isLoading = true;
    });
    if (validateAndSave()) {
      try {
        if (_isLoginForm) {
          final userId = await authService.signIn(_email, _password);
          await _processLoginRegister(userId);
          _goToNextStep(Routes.HOME);
        } else {
          await _onUsernamePasswordRegistration();
        }
      } catch (e) {
        setState(() {
          _errorMessage = e?.message;
        });
      }
    }

    setState(() {
      _isLoading = false;
    });
  }

  /// Returns true if user was created.
  Future<bool> _createUserFromSocialIfNotExists(User firebaseUser) async {
    final profileExists = await usersRepo.profileExists(firebaseUser.uid);

    if (!profileExists) {
      await usersRepo.createProfileFromAuthUser(
        firebaseUser.uid,
        ProfileModel(
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          imageUrl: firebaseUser.photoURL,
          phone: firebaseUser.phoneNumber,
        ),
      );
      return true;
    }
    return false;
  }

  _googleLogin() async {
    setState(() => _isLoading = true);

    User firebaseUser;
    try {
      firebaseUser = await authService.signInWithGoogle();
    } catch (e, s) {
      _onLoginError(e, s);
      return;
    }

    await _onSocialLogin(firebaseUser);
  }

  _appleLogin() async {
    setState(() => _isLoading = true);

    User firebaseUser;
    try {
      firebaseUser = await authService.signInWithApple();
    } catch (e, s) {
      _onLoginError(e, s);
      return;
    }

    await _onSocialLogin(firebaseUser);
  }

  _facebookLogin() async {
    setState(() => _isLoading = true);

    User firebaseUser;
    try {
      firebaseUser = await authService.signInWithFacebook();
    } catch (e, s) {
      _onLoginError(e, s);
      return;
    }

    await _onSocialLogin(firebaseUser);
  }

  void _onLoginError(dynamic exception, StackTrace stackTrace) {
    Logger.logException(exception, stackTrace);
    setState(() {
      _isLoading = false;
      _errorMessage = _strings.errorLoginUnknown;
    });
  }

  Future<void> _onSocialLogin(User firebaseUser) async {
    if (firebaseUser == null) {
      setState(() {
        _isLoading = false;
        _errorMessage = '';
      });
      return;
    }

    final created = await _createUserFromSocialIfNotExists(firebaseUser);
    _processLoginRegister(firebaseUser.uid);
    // Ask user to update profile if profile was just created.
    if (created) {
      _goToNextStep(
        Routes.MY_PROFILE,
        nextRouteArgs: ProfilePageArguments(true, allowNavigateBack: false),
      );
    }
    _goToNextStep(Routes.HOME);
  }

  @override
  void initState() {
    _errorMessage = "";
    _isLoading = false;
    super.initState();
  }

  void resetForm() {
    _email = null;
    _password = null;
    _repeatPassword = null;
    _formKey.currentState.reset();
    _errorMessage = "";
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);
    final size = MediaQuery.of(context).size;

    return Container(
      color: theme.backgroundColor,
      child: Stack(
        children: [
          Center(
            child: SvgPicture.asset(
              A.icon('app_icon'),
              color: theme.isLight
                  ? Colors.black.withOpacity(0.03)
                  : colorSet.surface.withOpacity(0.2),
              width: size.width + 32,
              fit: BoxFit.cover,
            ),
          ),
          Scaffold(
            backgroundColor: Colors.transparent,
            appBar: AppAppBar(automaticallyImplyLeading: false),
            body: Center(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                physics: ClampingScrollPhysics(),
                shrinkWrap: true,
                children: [
                  _buildWelcomeMessage(s),
                  Form(
                    key: _formKey,
                    autovalidate: true,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        if (_errorMessage != null) ...[
                          SizedBox(height: 24),
                          _buildErrorMessage(),
                          SizedBox(height: 24),
                        ],
                        InputLabel('Email address'),
                        SizedBox(height: 10),
                        _buildEmailInput(s),
                        SizedBox(height: 24),
                        InputLabel('Password'),
                        SizedBox(height: 10),
                        _buildPasswordInput(s),
                        _buildRepeatPasswordInput(s),
                        SizedBox(height: 16),
                        Align(
                          alignment: Alignment.centerRight,
                          child: PassiveTextButton(
                            child: Text('Forgot password?'),
                            onTap: () {},
                          ),
                        ),
                        SizedBox(height: 32),
                        _buildSignInButton(context),
                        _buildSocialLogins(theme, s),
                        SizedBox(height: 32),
                        _buildChangeFormTypeButton(context),
                        SizedBox(height: 24),
                        _buildTermAndConds(context),
                        SizedBox(height: 32),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeMessage(S s) {
    final colorSet = ColorSet.of(context);
    return Text(
      s.titleWelcome,
      style: TextStyle(
        fontSize: 20,
        color: colorSet.textLight,
      ),
    );
  }

  Widget _buildSocialLogins(ThemeData theme, S s) {
    return Center(
      child: Column(
        children: <Widget>[
          SizedBox(height: 16),
          Text(_isLoginForm ? 'or log in with' : 'or connect with'),
          SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleButton.custom(
                icon: I.authFacebook,
                onPressed: _facebookLogin,
              ),
              SizedBox(width: 16),
              CircleButton.custom(
                icon: I.authGoogle,
                onPressed: _googleLogin,
              ),
              if (Platform.isIOS) ...[
                SizedBox(width: 16),
                CircleButton.custom(
                  icon: I.authApple,
                  onPressed: _appleLogin,
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildErrorMessage() {
    if (_errorMessage != null && _errorMessage.length > 0) {
      return Text(
        _errorMessage,
        style: TextStyle(
          fontSize: 13.0,
          color: Colors.red,
          height: 1.0,
          fontWeight: FontWeight.w300,
        ),
      );
    } else {
      return Container(
        height: 0.0,
      );
    }
  }

  Widget _buildEmailInput(S s) {
    return CustomTextFormField(
      maxLines: 1,
      keyboardType: TextInputType.emailAddress,
      autofocus: false,
      decoration: InputDecoration(hintText: 'name@example.com'),
      validator: (value) =>
          _email?.isEmpty == true ? s.errorLoginEmailRequired : null,
      onChanged: (value) => _email = value.trim(),
    );
  }

  Widget _buildPasswordInput(S s) {
    return CustomTextFormField(
      maxLines: 1,
      obscureText: true,
      autofocus: false,
      decoration: InputDecoration(hintText: 'Enter password'),
      validator: (value) {
        if (_password?.isEmpty == true) {
          return s.errorLoginPasswordRequired;
        }
        if (!_isLoginForm &&
            _password != null &&
            _repeatPassword != null &&
            value != _repeatPassword) {
          return s.errorLoginPasswordsDontMatch;
        }
        return null;
      },
      onChanged: (value) => _password = value.trim(),
    );
  }

  Widget _buildRepeatPasswordInput(S s) {
    return AnimatedSize(
      duration: Duration(
        // Animate size faster as it is played after the switch animation.
        milliseconds: _kTransitionDuration.inMilliseconds ~/ 2,
      ),
      curve: _kTransitionCurve,
      vsync: this,
      alignment: Alignment.center,
      child: AnimatedSwitcher(
        duration: _kTransitionDuration,
        transitionBuilder: (child, animation) {
          return ScaleTransition(
            scale: CurvedAnimation(
              parent: animation,
              curve: _kTransitionCurve,
            ),
            alignment: Alignment.center,
            child: child,
          );
        },
        child: _isLoginForm
            ? Container()
            : Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: 24),
                  InputLabel('Repeat password'),
                  SizedBox(height: 10),
                  CustomTextFormField(
                    maxLines: 1,
                    obscureText: true,
                    autofocus: false,
                    decoration: InputDecoration(
                      hintText: 'Confirm password',
                    ),
                    validator: (value) {
                      if (_repeatPassword?.isEmpty == true) {
                        return s.errorLoginRepeatPasswordRequired;
                      }
                      if (_password != null &&
                          _repeatPassword != null &&
                          value != _password) {
                        return s.errorLoginPasswordsDontMatch;
                      }
                      return null;
                    },
                    onChanged: (value) => _repeatPassword = value.trim(),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildSignInButton(BuildContext context) {
    final s = strings();
    return SubmitButton(
      onPressed: () => validateAndSubmit(context),
      child: Text(_isLoginForm ? s.labelLoginSignin : s.labelLoginSignUp),
      loading: _isLoading,
    );
  }

  Widget _buildChangeFormTypeButton(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);
    return SubmitButton(
      color: theme.isDark ? Colors.white : Colors.black,
      child: Text(!_isLoginForm ? s.labelLoginSignin : s.labelLoginSignUp),
      onPressed: () => _onChangeFormTypeTap(context),
    );
  }

  Widget _buildTermAndConds(BuildContext context) {
    final colorSet = ColorSet.of(context);
    final tappableTextStyle = TextStyle(
      fontWeight: FontWeight.w600,
      decoration: TextDecoration.underline,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Text.rich(
        TextSpan(
          text: 'By signing in, you are agreeing to our ',
          children: [
            TextSpan(
              text: 'Terms of Use',
              style: tappableTextStyle,
              recognizer: TapGestureRecognizer()
                ..onTap = () {
                  launch(AppConfig.URL_TERMS_OR_SERVICE);
                },
            ),
            TextSpan(
              text: ' and ',
            ),
            TextSpan(
              text: 'Privacy Policy',
              style: tappableTextStyle,
              recognizer: TapGestureRecognizer()
                ..onTap = () {
                  launch(AppConfig.URL_PRIVACY_POLICY);
                },
            ),
            TextSpan(
              text: '.',
            ),
          ],
        ),
        textAlign: TextAlign.center,
        style: TextStyle(color: colorSet.textLighter),
      ),
    );
  }
}
