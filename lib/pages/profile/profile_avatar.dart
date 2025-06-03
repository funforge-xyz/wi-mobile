import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/data/storage/images_storage.dart';
import 'package:wi/di.dart';
import 'package:wi/services/compression.dart';
import 'package:wi/widgets/cache_image.dart';
import 'package:wi/widgets/common_progress_indicator.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/exts/all.dart';

const CIRCULAR_RADIUS = Radius.circular(32);
typedef void ProfileChangeCallback(ProfileModel profileModel);

class ProfileAvatar extends StatefulWidget {
  final ProfileModel profileModel;
  final ProfileChangeCallback onProfileChange;

  ProfileAvatar(this.profileModel, this.onProfileChange);

  @override
  _ProfileAvatarState createState() => _ProfileAvatarState();
}

class _ProfileAvatarState extends State<ProfileAvatar> {
  final credentials = getIt<Credentials>();
  final imagesStorage = getIt<ImagesStorage>();
  final _compression = getIt<Compression>();

  String get imageName => "profile-${credentials.userId}";

  UploadTask _uploadTask;

  File _imageFile;

  final picker = ImagePicker();

  /// Select an image via gallery or camera
  Future<void> _pickImage(ImageSource source) async {
    final pickedImage = await picker.getImage(source: source);
    if (pickedImage == null) return;
    final compressed = await _compression.compressImage(File(pickedImage.path));
    setState(() {
      _imageFile = compressed;
      _uploadTask = imagesStorage.upload(
        'profile-${credentials.userId}',
        _imageFile,
      );
    });
    _uploadTask.snapshotEvents.listen((event) {
      if (event.state.isSuccess) {
        _handleUploadCompleted();
      }
    });
  }

  _showPickerDialog(BuildContext context) {
    final s = strings();
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return SimpleDialog(
            title: Text(s.titleImageCaptureOption),
            children: <Widget>[
              SimpleDialogOption(
                onPressed: () async {
                  Navigator.pop(context); //close the dialog box
                  _pickImage(ImageSource.gallery);
                },
                child: Row(
                  children: <Widget>[
                    Icon(Icons.photo_library),
                    SizedBox(width: 16),
                    Text(s.labelImageCaptureGallery)
                  ],
                ),
              ),
              SimpleDialogOption(
                onPressed: () async {
                  Navigator.pop(context); //close the dialog box
                  _pickImage(ImageSource.camera);
                },
                child: Row(
                  children: <Widget>[
                    Icon(Icons.photo_camera),
                    SizedBox(width: 16),
                    Text(s.labelImageCaptureCamera)
                  ],
                ),
              ),
            ]);
      },
    );
  }

  _handleUploadCompleted() async {
    final response = await _uploadTask.whenComplete(() {});
    final imageUrl = await response.ref.getDownloadURL();
    widget.profileModel.imageUrl = imageUrl;
    widget.onProfileChange(widget.profileModel);
    setState(() {
      _imageFile = null;
      _uploadTask = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);

    return Container(
      alignment: Alignment.center,
      width: 124.0,
      height: 124.0,
      child: Stack(
        fit: StackFit.loose,
        alignment: Alignment.bottomRight,
        children: <Widget>[
          ClipRRect(
            borderRadius: BorderRadius.all(CIRCULAR_RADIUS),
            child: Container(
              width: 124.0,
              height: 124.0,
              decoration: BoxDecoration(
                shape: BoxShape.rectangle,
                color: (theme.brightness == Brightness.light
                        ? Colors.black
                        : Colors.white)
                    .withOpacity(0.06),
              ),
              child: CacheImage(
                image: imagesStorage.getImageFile(widget.profileModel.imageUrl),
                fit: BoxFit.cover,
              ),
            ),
          ),
          Container(
            width: 74.0,
            height: 44.0,
            child: Material(
              color: theme.primaryColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.only(
                  topLeft: CIRCULAR_RADIUS,
                  bottomRight: CIRCULAR_RADIUS,
                ),
              ),
              child: StreamBuilder<TaskSnapshot>(
                  stream: _uploadTask?.snapshotEvents,
                  builder: (_, snapshot) {
                    final event = snapshot?.data;

                    if (event?.state?.isRunning == true) {
                      return Center(
                        child: SizedBox(
                          width: 40,
                          height: 40,
                          child: CommonProgressIndicator(color: Colors.white),
                        ),
                      );
                    }

                    return InkWell(
                      borderRadius: BorderRadius.only(
                        topLeft: CIRCULAR_RADIUS,
                        bottomRight: CIRCULAR_RADIUS,
                      ),
                      onTap: () => _showPickerDialog(context),
                      child: CircleAvatar(
                        child: CustomIcon(
                          I.camera,
                          color: Colors.white,
                        ),
                        backgroundColor: Colors.transparent,
                      ),
                    );
                  }),
            ),
          ),
        ],
      ),
    );
  }
}
