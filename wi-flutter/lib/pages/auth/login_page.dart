import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_auth_buttons/flutter_auth_buttons.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/data/database/profile_repository.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/pages/profile/profile_page.dart';
import 'package:wi/widgets/submit_button.dart';
import 'package:wi/data/local/credentials.dart';

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final authService = getIt<Auth>();
  final profileRepository = getIt<ProfileRepository>();
  final credentials = getIt<Credentials>();

  String _email;
  String _password;
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

  onLogin({@required String userId, bool isSocialLogin: false}) async {
    final s = strings();
    final profileModel = await profileRepository.getProfileById(userId);

    if (profileModel.isDeleted) {
      setState(() {
        _errorMessage = s.errorLoginAccountDeleted;
        _isLoading = false;
      });
      authService.signOut();
    } else {
      credentials.userId = userId;
      Navigator.pushNamed(context, Routes.HOME);
    }
  }

  onRegistration() async {
    final userId = await authService.signUp(_email, _password);
    authService.sendEmailVerification();

    await profileRepository.createProfileFromAuthUser(
      userId,
      ProfileModel(email: _email),
    );

    credentials.userId = userId;

    Navigator.pushNamed(
      context,
      Routes.MY_PROFILE,
      arguments: ProfilePageArguments(true),
    );
  }

  // Perform login or signup
  void validateAndSubmit() async {
    setState(() {
      _errorMessage = "";
      _isLoading = true;
    });
    if (validateAndSave()) {
      try {
        if (_isLoginForm) {
          final userId = await authService.signIn(_email, _password);
          onLogin(userId: userId);
        } else {
          onRegistration();
        }
      } catch (e) {
        setState(() {
          _errorMessage = e.message;
          _formKey.currentState.reset();
        });
      }
    }

    setState(() {
      _isLoading = false;
    });
  }

  _socialUserRegister(FirebaseUser firebaseUser) async {
    final profileExists =
        await profileRepository.profileExists(firebaseUser.uid);

    if (!profileExists) {
      await profileRepository.createProfileFromAuthUser(
        firebaseUser.uid,
        ProfileModel(
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          imageUrl: firebaseUser.photoUrl,
          phone: firebaseUser.phoneNumber,
        ),
      );
    }
  }

  _googleLogin() async {
    final firebaseUser = await authService.signInWithGoogle();
    if (firebaseUser == null) {
      return;
    }

    _socialUserRegister(firebaseUser);

    onLogin(userId: firebaseUser.uid, isSocialLogin: true);
  }

  _facebookLogin() async {
    final firebaseUser = await authService.signInWithFacebook();
    if (firebaseUser == null) {
      return;
    }

    _socialUserRegister(firebaseUser);

    onLogin(userId: firebaseUser.uid, isSocialLogin: true);
  }

  @override
  void initState() {
    _errorMessage = "";
    _isLoading = false;
    _isLoginForm = true;
    super.initState();
  }

  void resetForm() {
    _formKey.currentState.reset();
    _errorMessage = "";
  }

  void toggleFormMode() {
    resetForm();
    setState(() {
      _isLoginForm = !_isLoginForm;
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppAppBar(
        leading: AppBarBackButton(),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: <Widget>[
            _showWelcomeMessage(s),
            _showForm(theme, s),
          ],
        ),
      ),
    );
  }

  Widget _showWelcomeMessage(S s) => Container(
        padding: EdgeInsets.only(top: 30),
        child: Text(
          s.titleWelcome,
          style: TextStyle(fontSize: 24),
        ),
      );

  Widget _showForm(ThemeData theme, S s) {
    return Container(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            shrinkWrap: true,
            children: <Widget>[
              _showErrorMessage(),
              _showEmailInput(s),
              _showPasswordInput(s),
              _showSubmitButton(s),
              _isLoginForm ? _showSocialLogins(theme, s) : SizedBox.shrink(),
              _createAccountLabel(theme, s),
            ],
          ),
        ));
  }

  Widget _divider(ThemeData theme, S s) {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: <Widget>[
          SizedBox(
            width: 20,
          ),
          Expanded(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 10),
              child: Divider(
                thickness: 1,
              ),
            ),
          ),
          Text(
            s.labelCommonOr,
            style: TextStyle(color: theme.textTheme.caption.color),
          ),
          Expanded(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 10),
              child: Divider(
                thickness: 1,
              ),
            ),
          ),
          SizedBox(
            width: 20,
          ),
        ],
      ),
    );
  }

  Widget _showSocialLogins(ThemeData theme, S s) {
    return Container(
      child: Column(
        children: <Widget>[
          SizedBox(height: 10),
          _divider(theme, s),
          SizedBox(height: 10),
          GoogleSignInButton(
            text: s.labelLoginSignInWithGoogle,
            darkMode: true,
            onPressed: _googleLogin,
          ),
          SizedBox(height: 10),
          FacebookSignInButton(
            text: s.labelLoginSignInWithFacebook,
            onPressed: _facebookLogin,
          )
        ],
      ),
    );
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
    } else {
      return Container(
        height: 0.0,
      );
    }
  }

  Widget _showEmailInput(S s) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0.0, 25.0, 0.0, 0.0),
      child: TextFormField(
        maxLines: 1,
        keyboardType: TextInputType.emailAddress,
        autofocus: false,
        decoration: InputDecoration(
            hintText: 'Email',
            prefixIcon: Icon(
              Icons.mail,
              color: Colors.grey,
            )),
        validator: (value) => value.isEmpty ? s.errorLoginEmailRequired : null,
        onSaved: (value) => _email = value.trim(),
      ),
    );
  }

  Widget _showPasswordInput(S s) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0.0, 15.0, 0.0, 0.0),
      child: TextFormField(
        maxLines: 1,
        obscureText: true,
        autofocus: false,
        decoration: InputDecoration(
            hintText: 'Password',
            prefixIcon: Icon(
              Icons.lock,
              color: Colors.grey,
            )),
        validator: (value) =>
            value.isEmpty ? s.errorLoginPasswordRequired : null,
        onSaved: (value) => _password = value.trim(),
      ),
    );
  }

  Widget _createAccountLabel(ThemeData theme, S s) {
    return GestureDetector(
      onTap: toggleFormMode,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 20),
        padding: EdgeInsets.all(15),
        alignment: Alignment.bottomCenter,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              _isLoginForm
                  ? s.messageLoginDontHaveAccount
                  : s.messageLoginHaveAccount,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(
              width: 10,
            ),
            Text(
              _isLoginForm ? s.labelLoginRegister : s.labelLoginLogin,
              style: TextStyle(
                color: theme.primaryColor,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _showSubmitButton(S s) {
    return Padding(
      padding: EdgeInsets.fromLTRB(0.0, 25.0, 0.0, 0.0),
      child: SizedBox(
          height: 50,
          child: SubmitButton(
            onPressed: validateAndSubmit,
            child: Text(
              _isLoginForm ? s.labelLoginLogin : s.labelLoginCreateAccount,
              style: TextStyle(
                fontSize: 18.0,
              ),
            ),
            loading: _isLoading,
          )),
    );
  }
}
