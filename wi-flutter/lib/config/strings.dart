/// A simple implementation of a plural string. Suffictient for our English-only needs.
class PluralString {
  final String one;
  final String other;

  const PluralString({this.one, this.other})
      : assert(one != null),
        assert(other != null);

  String value(num value) {
    final isOne = value.abs() == 1;
    final template = isOne ? one : other;
    return S.get(template, {'value': value});
  }
}

/// All human readable strings in the app.
class S {
  static get(String text, Map<String, dynamic> args) {
    if (args?.isNotEmpty == true) {
      args.forEach((key, value) {
        text = text.replaceAll('{{$key}}', value?.toString());
      });
    }
    return text;
  }

  final appName = 'Wi Chat';
  final appDescription = '?'; // TODO

  // Common
  final actionCommonOk = 'OK';
  final actionCommonYes = 'YES';
  final actionCommonNo = 'NO';
  final actionCommonRetry = 'Retry';
  final actionCommonCancel = 'Cancel';
  final actionCommonContinue = 'Continue';
  final actionCommonSeeMore = 'See more';
  final actionCommonStartChat = 'Start chat';
  final actionCommonViewProfile = 'View profile';
  final errorCommonError = 'Error';
  final errorCommonConnection = 'Connection error';
  final errorCommonUnknown = 'Unknown error';
  final errorCommonNoItems = 'No items';
  final labelCommonToday = 'Today';
  final labelCommonTomorrow = 'Tomorrow';
  final labelCommonYesterday = 'Yesterday';
  final labelComonXDays = PluralString(
    one: '{{value}} day',
    other: '{{value}} days',
  );
  final labelCommonFooter = 'WI Chat';
  final labelCommonSave = 'Save';
  final labelCommonOr = 'or';
  final labelCommonBullet = '\u2022';
  final messageCommonSomethingWentWrong = 'Something went wrong!';

  // Login
  final titleLoginWelcome = 'Welcome';
  final titleLoginWelcomeToApp = 'Welcome to Wi Chat';
  final labelLoginCreateAccount = 'Create account';
  final labelLoginLogin = 'Login';
  final labelLoginRegister = 'Register';
  final labelLoginSignin = 'Sign in';
  final labelLoginSignInWithGoogle = "Sign in with Google";
  final labelLoginSignInWithFacebook = "Continue with Facebook";
  final messageLoginDontHaveAccount = "Don't have an account?";
  final messageLoginHaveAccount = "Have an account?";
  final errorLoginEmailRequired = 'Email is required';
  final errorLoginPasswordRequired = 'Password is required';
  final errorLoginAccountDeleted = 'Account deleted. Please contact support.';

  // Profile
  final titleProfileNavbar = 'PROFILE';
  final messageProfileNameDescription =
      'This is not your username or pin. This name will be visible to your contacts and people nearby.';
  final messageProfileUnableToFetch = "Unable to fetch profile";
  final messageProfileUpdatedSuccessfully = 'Profile updated successfully';
  final errorProfileNameRequired = 'Name is required';
  final errorProfileEmailRequired = 'Please enter a valid email address';

  // ImageCapture
  final titleImageCaptureNavbar = 'IMAGE UPLOAD';
  final actionImageCaptureSelectImage = 'Select your image';
  final actionImageCaputreUpload = 'Upload';
  final titleImageCaptureOption = 'Please select your image source';
  final labelImageCaptureGallery = 'Gallery';
  final labelImageCaptureCamera = 'Camera';
  final labelImageCaptureUploadComplete = 'Upload completed!';

  // Nearby
  final titleNearby = 'Nearby';
  final labelNearbyPeopleAroundYou = 'People around you';

  // Chats
  final titleChats = 'Chats';
  final titleChatsPeoplearoundYou = 'People around you';
  final titleChatsFriends = 'Friends';

  // Welcome
  final titleWelcome = 'Welcome to WI chat';
  final actionWelcomeAgreeContinue = 'Agree and Continue';
  final labelWelcomeReadOur = 'Read our ';
  final labelWelcomePrivacyPolicy = 'Privacy Policy. ';
  final labelWelcomeTermsOfServices = 'Terms of Services';
  final messageWelcomeTapAgreeAndContinue =
      'Tap "Agree and Continue" to accept the ';

  // Settings
  final titleSettings = 'Settings';
  final labelSettingsAccount = 'Account';
  final labelSettingsAccountDescription = "Privacy, Security, change number";
  final labelSettingsNotifications = 'Notifications';
  final labelSettingsNotificationsDescription = "Message, group & call tones";
  final labelSettingsInviteFriends = "Invite Friends";
  final labelSettingsInviteFriendsDescription = "Invite new friends and earn";

  // Account
  final titleAccount = 'Account';
  final labelAccountChangePassword = 'Change password';
  final labelAccountChangePasswordDescription = 'Change your login password';
  final labelAccountDelete = 'Delete account';
  final labelAccountDeleteDescription =
      'Delete account, chat and your contacts';

  // Delete account
  final titleDeleteAccount = 'Delete account';
  final labelDeleteAccountItems = 'Deleting your accont will: ';
  final labelDeleteAccountItemOne = 'Delete your account by WiChat';
  final labelDeleteAccountItemTwo = 'Erase your WiChat message history';
  final labelDeleteAccountItemThree =
      'Delete all your contacts saved in WiChat';
  final labelDeleteAccountItemFour = 'Delete your WiChat media';
  final actionDeleteAccount = 'Slide to delete account';
  final messageDeleteAccountError =
      'Error occurred while deleting your account. Please try again.';

  // Notifications
  final titleNotifications = 'Notifications';
  final labelNotificationsUseNotifications = 'Notifications';
  final labelNotificationsUseNotificationsDescription =
      'Notify for new messages';

  // Change password
  final labelChangePasswordSubmit = 'Update password';
  final labelChangePasswordPasswordInput = 'Password';
  final labelChangePasswordConfirmationPasswordInput = 'Password confirmation';
  final messageChangePasswordSuccess = 'Password has been changed successfully';
  final messageChangePasswordConfirmationRequired =
      "Confirmation password is required";
  final messageChangePasswordDoesNotMatch = 'Password does not match';
  final messageChangePasswordPasswordRequired = 'Password is required';
  final messageChangePasswordError = 'Invalid password. Please try again.';
}
