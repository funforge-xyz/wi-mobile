import 'package:flutter/material.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/data/repo/users_repo.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/storage/cache_managers.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/profile/profile_details.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_action.dart';
import 'package:wi/widgets/app_bar_back_button.dart';

class ProfilePageArguments {
  final bool isRegistrationFlow;
  final bool allowNavigateBack;

  ProfilePageArguments(
    this.isRegistrationFlow, {
    this.allowNavigateBack = false,
  });
}

class ProfilePage extends StatefulWidget {
  ProfilePage({Key key}) : super(key: key);
  @override
  _ProfilePageState createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Future<ProfileModel> profileModelFuture;

  final usersRepo = getIt<UsersRepo>();
  final _cacheManager = getIt<ImageCacheManager>();
  final auth = getIt<Auth>();

  @override
  void initState() {
    super.initState();

    profileModelFuture = _setCurrentProfile();
  }

  Future<String> _getCurrentUserId() async {
    var firebaseUser = await auth.getCurrentUser();
    return firebaseUser.uid;
  }

  Future<ProfileModel> _setCurrentProfile() async {
    final userId = await _getCurrentUserId();
    return await usersRepo.getProfileById(userId);
  }

  Future updateProfile(ProfileModel profileModel) async {
    final userId = await _getCurrentUserId();
    await _cacheManager.invalidate(profileModel.imageUrl);
    usersRepo.updateProfile(userId, profileModel);
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final ProfilePageArguments args =
        ModalRoute.of(context).settings.arguments ??
            ProfilePageArguments(false);
    final isRegFlow = args.isRegistrationFlow;
    return Scaffold(
      appBar: isRegFlow
          ? PreferredSize(
              child: Container(),
              preferredSize: Size(double.infinity, 24),
            )
          : AppAppBar(
              title: Text(s.titleProfileNavbar),
              leading: args.allowNavigateBack ? AppBarBackButton() : null,
            ),
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          FocusScope.of(context).unfocus();
        },
        child: _buildContent(s, args),
      ),
    );
  }

  Widget _buildContent(S s, ProfilePageArguments args) {
    return FutureBuilder(
      future: profileModelFuture,
      builder: (BuildContext context, AsyncSnapshot<ProfileModel> snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text(s.messageProfileUnableToFetch));
        }

        if (snapshot.hasData) {
          return ProfileDetails(
            snapshot.data,
            updateProfile,
            args.isRegistrationFlow,
          );
        }

        return Center(child: CircularProgressIndicator());
      },
    );
  }
}
