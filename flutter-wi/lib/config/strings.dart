import 'package:wi/di.dart';

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
    return strings().get(template, {'value': value});
  }
}

/// All human readable strings in the app.
class S {
  String get(String text, Map<String, dynamic> args) {
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
  final actionCommonYes = 'Yes';
  final actionCommonNo = 'No';
  final actionCommonRetry = 'Retry';
  final actionCommonCancel = 'Cancel';
  final actionCommonDelete = 'Delete';
  final actionCommonContinue = 'Continue';
  final actionCommonAllow = 'Allow';
  final actionCommonSeeMore = 'See more';
  final actionCommonStartChat = 'Start chat';
  final actionCommonViewProfile = 'View profile';
  final actionCommonGotIt = 'Got it';
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
  final messageLastSeen = 'Last seen {{time}}';

  // Permissions page
  final labelPermsWiNeedsAccessTo = 'Wi needs access to...';
  final labelPermsLocation = 'Location (Background optional)';
  final messagePermsLocation =
      'Wi App collects location data to identify nearby people, even when the app is closed or not in use (optional). This could be also used to supports ads.';
  final messagePermsNeedsAllPerms = 'Sorry, Wi needs these permissions to be '
      'able to function. Please grant them.';
  final labelPermsNotifications = 'Notifications';
  final messagePermsOther =
      'Other permissions may be requested when you use certain app features';
  final messagePermsNotifications =
      'for letting you know when you receive a message';
  final messagePermsLocationDenied =
      'Location permissions have been denied. Wi requests access to your '
      'location "Always" to find people around you and make you visible to '
      'others. If you opt out of this, you can choose to grant location '
      'permissions "only when in use". However, using Wi without any location '
      'permissions granted is not possible.';
  final actionPermsOpenSettings = 'Open settings';
  final labelPermsOptional = '(Optional)';
  final titlePermsLocationServicesDisabled = 'Location services disabled';
  final messagePermsLocationServicesDisabled =
      'Wi needs access to your location to be able to show you content from nearby people. Please enable location services.';
  final actionSkipForNow = 'Skip for now';

  // Relative time strings
  final labelTimeXYearsAgo = PluralString(
    one: '{{value}} year',
    other: '{{value}} years',
  );
  final labelTimeXMonthsAgo = PluralString(
    one: '{{value}} month',
    other: '{{value}} months',
  );
  final labelTimeXWeeksAgo = PluralString(
    one: '{{value}} week',
    other: '{{value}} weeks',
  );
  final labelTimeXDaysAgo = PluralString(
    one: '{{value}} day',
    other: '{{value}} days',
  );
  final labelTimeXHoursAgo = PluralString(
    one: '{{value}} hour',
    other: '{{value}} hours',
  );
  final labelTimeXMinsAgo = PluralString(
    one: '{{value}} minute',
    other: '{{value}} minutes',
  );
  final labelTimeXYearsAgoShort = PluralString(
    one: '{{value}}y',
    other: '{{value}}y',
  );
  final labelTimeXMonthsAgoShort = PluralString(
    one: '{{value}}mo',
    other: '{{value}}mo',
  );
  final labelTimeXWeeksAgoShort = PluralString(
    one: '{{value}}w',
    other: '{{value}}w',
  );
  final labelTimeXDaysAgoShort = PluralString(
    one: '{{value}}d',
    other: '{{value}}d',
  );
  final labelTimeXHoursAgoShort = PluralString(
    one: '{{value}}h',
    other: '{{value}}h',
  );
  final labelTimeXMinsAgoShort = PluralString(
    one: '{{value}}m',
    other: '{{value}}m',
  );
  final labelTimeJustNow = 'Just now';
  final labelTimeInXYears = PluralString(
    one: '{{value}} year',
    other: 'in {{value}} years',
  );
  final labelTimeInXMonths = PluralString(
    one: '{{value}} month',
    other: 'in {{value}} months',
  );
  final labelTimeInXWeeks = PluralString(
    one: '{{value}} week',
    other: 'in {{value}} weeks',
  );
  final labelTimeInXDays = PluralString(
    one: '{{value}} day',
    other: 'in {{value}} days',
  );
  final labelTimeInXHours = PluralString(
    one: '{{value}} hour',
    other: 'in {{value}} hours',
  );
  final labelTimeInXMins = PluralString(
    one: '{{value}} minute',
    other: 'in {{value}} minutes',
  );
  final labelTimeInXYearsShort = PluralString(
    one: '{{value}}y',
    other: 'in {{value}}y',
  );
  final labelTimeInXMonthsShort = PluralString(
    one: '{{value}}mo',
    other: 'in {{value}}m',
  );
  final labelTimeInXWeeksShort = PluralString(
    one: '{{value}}w',
    other: 'in {{value}}w',
  );
  final labelTimeInXDaysShort = PluralString(
    one: '{{value}}d',
    other: 'in {{value}}d',
  );
  final labelTimeInXHoursShort = PluralString(
    one: '{{value}}h',
    other: 'in {{value}}h',
  );
  final labelTimeInXMinsShort = PluralString(
    one: '{{value}}m',
    other: 'in {{value}}m',
  );

  // Onboarding
  final onboardingTitleFindPeople = 'Find people nearby';
  final onboardingMessageFindPeople =
      'Wi helps you find new people nearby who share your interests and want to chat!';
  final onboardingTitleMakeFriends = 'Make friends';
  final onboardingMessageMakeFriends =
      'Chat & Meet New People! See who is nearby!';
  final onboardingTitleDetectPeople = 'Detect people on your WiFi or via GPS';
  final onboardingMessageDetectPeople =
      'Wi is bringing you closer to exciting people around you.';
  final onboardingActionGetStarted = 'Get started';
  final onboardingActionSkip = 'Skip';

  // Login
  final titleLoginWelcome = 'Welcome';
  final titleLoginWelcomeToApp = 'Welcome to Wi Chat';
  final labelLoginSignin = 'Sign in';
  final labelLoginSignUp = 'Sign up';
  final labelLoginSignInWithGoogle = "Sign in with Google";
  final labelLoginSignInWithFacebook = "Continue with Facebook";
  final messageLoginDontHaveAccount = "Don't have an account?";
  final messageLoginHaveAccount = "Have an account?";
  final errorLoginEmailRequired = 'Email is required';
  final errorLoginPasswordRequired = 'Password is required';
  final errorLoginRepeatPasswordRequired = 'Repeat password is required';
  final errorLoginPasswordsDontMatch = 'Passwords don\'t match';
  final errorLoginAccountDeleted = 'Account deleted. Please contact support.';
  final errorLoginUnknown = 'Error logging in. Please try again later.';
  final messageLoginThankYouCompleteProfile =
      'Thank you!\nPlease complete your profile.';

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

  // Camera
  final labelCameraPhoto = 'Photo';
  final labelCameraVideo = 'Video';

  // Messages
  final titleMessagesMessages = 'Messages';
  final labelMessagesInbox = 'Inbox';
  final labelMessagesNotifications = 'Inbox';

  // Nearby
  final titleNearby = 'People around you';
  final labelNearbyLocationPermissions = 'Location Permissions';
  final titmeNearbyLocationNeed = 'Location Access';
  final messageNearbyLocationNeed =
      'We need your location to find people near you.';
  final titleNearbyLocationRestricted = 'Location Restricted';
  final messageNearbyLocationRestricted =
      'Location access was blocked by restrictions on your device. '
      'Do you have Parental Controls turned on?'
      'We need your location to find people near you.';
  final titleNearbyLocationPermanentlyDenied = 'Location Denied';
  final messageNearbyLocationPermanentlyDenied =
      'Looks like location permissions were denied.'
      'We need your location to find people near you.';
  final titleNearbyLocationServiceDisabled = 'Service Disabled';
  final messageNearbyLocationServiceDisabled =
      'Looks like location services have been disabled. '
      'We need your location to find people near you.';
  final actionNearbyLocationGrant = 'Grant';
  final actionNearbyLocationReenableInSettings = 'Enable in Settings';
  final actionNearbyLocationTurnOn = 'Turn on';
  final titleNearbyNobodyAround = 'Oooops! Seems like there is no one here!';
  final messageNearbyNobodyAround =
      'Make sure that you are connected to a nearby network to explore';
  final messageNearbySameWifi = 'On the same WiFi network';
  final titleLocationPermissionNeeded = 'Location Permission Needed';
  final messageLocationPermissionNeededPosts =
      'To see posts around you, we need your location permission.';
  final titleLocationServiceDisabled = 'Location Service Disabled';
  final messageLocationServiceDisabledPosts =
      'To see posts around you, please enable location service.';
  final messageLocationPermissionNeededUsers =
      'To see people around you, we need your location permission.';
  final messageLocationServiceDisabledUsers =
      'To see people around you, please enable location service.';

  // Chats
  final titleChats = 'Chats';
  final titleChatsPeoplearoundYou = 'People around you';
  final titleChatsFriends = 'Friends';
  final labelChatsNoChats = 'No chats yet';
  final messageChatsNoChats =
      'Start a chat with a nearby person and you\'ll see the conversation here';

  // Chat
  final labelTypeAMessage = 'Type a message';
  final messageChatPleaseWaitForUploads =
      'Please wait for all uploads to complete';
  final labelChatNoMessages = 'No messages yet';
  final messageChatNoMessages = 'Why not initiate a conversation?';
  final actionBlockUser = 'Block User';
  final actionUnblockUser = 'Unblock User';
  final messageBlockUser = 'Are you sure you want to block this user? Once blocked, you will not be able to send messages to each other.';
  final messageUnblockUser = 'Are you sure you want to unblock this user? Once unblocked, you will be able to send messages to each other again.';

  // Notifications
  final labelNotifssNoNotifs = 'Nothing yet';
  final messageNotifsNoNotifs =
      'Notifications will start appearing here as people like your posts or comment on them';

  // Welcome
  final titleWelcome = 'Welcome to Wi,\nPlease enter your email.';
  final actionWelcomeAgreeContinue = 'Agree and Continue';
  final labelWelcomeReadOur = 'Read our ';
  final labelWelcomePrivacyPolicy = 'Privacy Policy. ';
  final labelWelcomeTermsOfServices = 'Terms of Services';
  final messageWelcomeTapAgreeAndContinue =
      'Tap "Agree and Continue" to accept the ';

  // Settings
  final titleSettings = 'Settings';
  final labelSettingsApp = 'App';
  final labelSettingsAppBackgroundLocation = 'Background location tracking';
  final messageSettingsAppBackgroundLocationEnabled =
      'Enabled. People around you will be able to find you. Tap to go to the Settings app if you would like to disable.';
  final messageSettingsAppBackgroundLocationDisabled =
      'Disabled. People around you may not be able to find you. Tap to go to the Settings app and set location permissions to "Always" to enable.';
  final labelSettingsAccount = 'Account';
  final labelSettingsAccountDescription = "Privacy, Security, change number";
  final labelSettingsNotifications = 'Notifications';
  final labelSettingsNotificationsDescription = "Message, group & call tones";
  final labelSettingsInviteFriends = "Invite Friends";
  final labelSettingsInviteFriendsDescription = "Invite new friends and earn";
  final labelSettingsLogout = "Log out";
  final labelSettingsDeveloper = 'Developer';
  final labelSettingsDeveloperUpdateLocation = 'Update location';
  final messageSettingsDeveloperUpdateLocation =
      'Manually trigger a location update to the server';

  // Account
  final titleAccount = 'Account';
  final labelAccountChangePassword = 'Change password';
  final labelAccountChangePasswordDescription = 'Change your login password';
  final labelAccountDelete = 'Delete account';
  final labelAccountDeleteDescription =
      'Delete account, chat and your contacts';

  // Delete account
  final titleDeleteAccount = 'Delete Account';
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
  final titleChangePassword = 'Change Password';
  final labelChangePasswordSubmit = 'Change password';
  final labelChangePasswordPasswordInput = 'Password';
  final labelChangePasswordConfirmationPasswordInput = 'Confirm password';
  final messageChangePasswordSuccess = 'Password has been changed successfully';
  final messageChangePasswordConfirmationRequired =
      "Confirmation password is required";
  final messageChangePasswordDoesNotMatch = 'Password does not match';
  final messageChangePasswordPasswordRequired = 'Password is required';
  final messageChangePasswordError = 'Invalid password. Please try again.';

  // Profile view
  final titleProfileViewProfile = 'Profile';
  final labelProfileViewMuteNotifications = 'Mute notifications';
  final labelProfileViewEncryption = 'Encryption';
  final labelProfileViewEncryptionDescription =
      'Message to this chat and calls are secured with end-to-end encryption.';

  // Feed
  final titlePostComments = 'Comments';
  final titlePostCommentReplies = 'Replies';
  final actionPostReply = 'Reply';
  final labelCommentViewRepliesX = 'View replies ({{value}})';
  final labelPostNoComments = 'No comments';
  final messagePostNoComments = 'Why not be the first?';
  final actionFeedMessage = 'Message';
  final titleFeedDeletePost = 'Delete post';
  final titleFeedNoPosts = 'No posts around you';
  final labelFeedNewCommentOnYourPost = 'New comment on your post:';
  final messageFeedNoPosts =
      'Seems like there are no posts of people nearby. Would you like to share something with people nearby?';
  final actionFeedNoPosts = 'Create Post';

  // Add post page
  final titleNewPostPost = 'Post';
  final labelNewPostWriteSomething = 'Write something...';
  final labelNewPostMediaProcessing = 'Processing';
  final labelNewPostMediaUploading = 'Uploading';
  final labelNewPostDescribeYourVideo = 'Describe your video';
  final labelNewPostDescribeYourPhoto = 'Describe your photo';
  final actionNewPostPostNow = 'Post now';
  final labelNewPostCommentsAllowed = 'Comments allowed';
  final labelNewPostLikesAllowed = 'Likes allowed';

  // Likes page
  final titleLikesPost = 'People who liked your post';
  final titleLikesComment = 'People who liked your comment';
  final titleLikesReply = 'People who liked your reply';
  final messageLikesEmptyTitle = 'No likes';
  final messageLikesEmptySubtitlePost =
      'Nobody has liked your post yet. Check back later.';
  final messageLikesEmptySubtitleComment =
      'Nobody has liked your comment yet. Check back later.';
  final messageLikesEmptySubtitleReply =
      'Nobody has liked your reply yet. Check back later.';
}
