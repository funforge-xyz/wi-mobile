import 'package:flutter/material.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/config/assets.dart';
import 'package:wi/di.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/widgets/image_capture.dart';
import 'package:wi/data/local/credentials.dart';

const CIRCULAR_RADIUS = Radius.circular(32);
typedef void ProfileChangeCallback(ProfileModel profileModel);

class ProfileAvatar extends StatelessWidget {
  final ProfileModel profileModel;
  final ProfileChangeCallback onProfileChange;
  final credentials = getIt<Credentials>();

  ProfileAvatar(this.profileModel, this.onProfileChange);

  String get imageName => "profile-${credentials.userId}";

  // TODO: Issue with refreshing the screen after image is uploaded
  _handleUploadCompleted(BuildContext context, String imageUrl) {
    Navigator.pop(context);
    profileModel.imageUrl = imageUrl;
    onProfileChange(profileModel);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      alignment: Alignment.center,
      width: 124.0,
      height: 124.0,
      child: Stack(
        fit: StackFit.loose,
        alignment: Alignment.bottomRight,
        children: <Widget>[
          Container(
            width: 124.0,
            height: 124.0,
            decoration: BoxDecoration(
              shape: BoxShape.rectangle,
              borderRadius: BorderRadius.all(CIRCULAR_RADIUS),
              image: DecorationImage(
                image: (profileModel.imageUrl != null
                    ? NetworkImage(profileModel.imageUrl)
                    : AssetImage(A.image('user'))),
                fit: BoxFit.cover,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: theme.primaryColor,
              borderRadius: BorderRadius.only(
                topLeft: CIRCULAR_RADIUS,
                bottomRight: CIRCULAR_RADIUS,
              ),
            ),
            width: 74.0,
            height: 44.0,
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ImageCapture(
                      imageName: imageName,
                      onUploadCompleted: (imageUrl) =>
                          _handleUploadCompleted(context, imageUrl),
                    ),
                  ),
                );
              },
              child: CircleAvatar(
                child: CustomIcon(I.camera),
                backgroundColor: Colors.transparent,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
