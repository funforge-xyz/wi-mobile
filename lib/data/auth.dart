import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart' as fauth;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_facebook_login/flutter_facebook_login.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/di.dart';
import 'package:wi/utils/logger.dart';

enum AuthStatus {
  UNKNOWN,
  NOT_REGISTERED,
  NOT_LOGGED_IN,
  LOGGED_IN,
}

abstract class BaseAuth {
  Future<String> signIn(String email, String password);

  Future<String> signUp(String email, String password);

  fauth.User getCurrentUser();

  Future<String> getIdToken();

  Future<void> sendEmailVerification();

  Future<void> signOut();

  Future<bool> isEmailVerified();

  Future<fauth.User> signInWithGoogle();

  Future<fauth.User> signInWithApple();

  Future<fauth.User> signInWithFacebook();

  Future sendResetPasswordEmail(String email);
}

class Auth implements BaseAuth {
  final _firebaseAuth = fauth.FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  final credentials = getIt<Credentials>();

  Future<String> signIn(String email, String password) async {
    final result = await _firebaseAuth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    final user = result.user;
    return user.uid;
  }

  Future<String> signUp(String email, String password) async {
    final result = await _firebaseAuth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    final user = result.user;
    return user.uid;
  }

  fauth.User getCurrentUser() => _firebaseAuth.currentUser;

  @override
  Future<String> getIdToken() => getCurrentUser()?.getIdToken();

  Future<void> signOut() async {
    await _firebaseAuth.signOut();
    credentials.userId = null;
  }

  Future<void> sendEmailVerification() {
    final user = _firebaseAuth.currentUser;
    user.sendEmailVerification();
  }

  Future<bool> isEmailVerified() async {
    final user = _firebaseAuth.currentUser;
    return user.emailVerified;
  }

  Future<fauth.User> signInWithGoogle() async {
    // Sign out first to make sure account selection always happens.
    await _googleSignIn.signOut();
    final googleUser = await _googleSignIn.signIn();

    // Return if login was cancelled.
    if (googleUser == null) return null;

    // get the credentials to (access / id token)
    final googleAuth = await googleUser.authentication;

    // to sign in via Firebase Authentication
    final credential = fauth.GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    return _signInWithCredential(credential);
  }

  @override
  Future<fauth.User> signInWithApple() async {
    final result = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
      webAuthenticationOptions: WebAuthenticationOptions(
        clientId: 'com.wichat.app.signin',
        redirectUri:
            Uri.parse('https://wichat-2684e.firebaseapp.com/__/auth/handler'),
      ),
    );

    final credential = OAuthProvider('apple.com').credential(
      accessToken: result.authorizationCode,
      idToken: result.identityToken,
    );

    return _signInWithCredential(credential);
  }

  Future<fauth.User> signInWithFacebook() async {
    final facebookLogin = FacebookLogin();
    final result = await facebookLogin.logIn(['email', 'public_profile']);

    switch (result.status) {
      case FacebookLoginStatus.loggedIn:
        final credential =
            fauth.FacebookAuthProvider.credential(result.accessToken.token);

        return _signInWithCredential(credential);

      case FacebookLoginStatus.cancelledByUser:
        Logger.log('Facebook sign in cancelled by user.');
        break;

      case FacebookLoginStatus.error:
        throw result.errorMessage;
    }

    return null;
  }

  Future sendResetPasswordEmail(String email) async {
    await _firebaseAuth.sendPasswordResetEmail(email: email);
  }

  Future<fauth.User> _signInWithCredential(
    fauth.AuthCredential credential,
  ) async {
    return (await _firebaseAuth.signInWithCredential(credential)).user;
  }
}
