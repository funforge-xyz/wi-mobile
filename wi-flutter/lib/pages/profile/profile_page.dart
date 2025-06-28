import 'package:flutter/material.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/data/database/profile_repository.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/profile/profile_details.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';

class ProfilePageArguments {
  final bool isRegistrationFlow;

  ProfilePageArguments(this.isRegistrationFlow);
}

class ProfilePage extends StatefulWidget {
  @override
  _ProfilePageState createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Future<ProfileModel> profileModelFuture;

  final profileRepository = getIt<ProfileRepository>();
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
    return await profileRepository.getProfileById(userId);
  }

  Future updateProfile(ProfileModel profileModel) async {
    final userId = await _getCurrentUserId();

    await profileRepository.updateProfile(userId, profileModel);
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

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final ProfilePageArguments args =
        ModalRoute.of(context).settings.arguments ??
            ProfilePageArguments(false);

    return Scaffold(
      appBar: AppAppBar(
        title: Text(s.titleProfileNavbar),
        leading: AppBarBackButton(),
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
}
