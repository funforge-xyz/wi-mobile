import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/di.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/data/storage/images_storage.dart';
import 'package:wi/widgets/app_bar_back_button.dart';

class ImageCapture extends StatefulWidget {
  final String imageName;
  final Function onUploadCompleted;

  ImageCapture({this.imageName, this.onUploadCompleted});

  createState() => _ImageCaptureState();
}

class _ImageCaptureState extends State<ImageCapture> {
  File _imageFile;
  final picker = ImagePicker();

  /// Select an image via gallery or camera
  Future<void> _pickImage(ImageSource source) async {
    final pickedImage = await picker.getImage(source: source);
    if (pickedImage == null) {
      return;
    }

    setState(() {
      _imageFile = File(pickedImage.path);
    });
  }

  /// Remove image
  void _clear() {
    setState(() => _imageFile = null);
  }

  Widget buildImageCapturer(BuildContext context, S s, ThemeData theme) {
    if (_imageFile != null)
      return ListView(
        children: <Widget>[
          SizedBox(height: 32),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: MediaQuery.of(context).size.width * 0.8,
                height: MediaQuery.of(context).size.height * 0.6,
                decoration: BoxDecoration(
                  shape: BoxShape.rectangle,
                  borderRadius: BorderRadius.all(
                    Radius.elliptical(16, 32),
                  ),
                  image: DecorationImage(
                    image: FileImage(_imageFile),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ],
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              FlatButton(
                child: Icon(Icons.refresh),
                onPressed: _clear,
              ),
            ],
          ),
          SizedBox(height: 32),
          Uploader(
            file: _imageFile,
            imageName: widget.imageName,
            onUploadCompleted: widget.onUploadCompleted,
          )
        ],
      );

    return Container(
      alignment: Alignment.center,
      child: FlatButton(
        child: Text(s.actionImageCaptureSelectImage),
        color: theme.primaryColor,
        textColor: theme.textSelectionColor,
        onPressed: () {
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
              });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppAppBar(
        title: Text(s.titleImageCaptureNavbar),
        leading: AppBarBackButton(),
      ),
      body: Container(
        child: buildImageCapturer(context, s, theme),
      ),
    );
  }
}

class Uploader extends StatefulWidget {
  final File file;
  final imageName;
  final onUploadCompleted;

  Uploader({this.file, this.imageName, this.onUploadCompleted});

  createState() => _UploaderState();
}

class _UploaderState extends State<Uploader> {
  final imagesStorage = getIt<ImagesStorage>();

  StorageUploadTask _uploadTask;

  /// Starts an upload task
  void _startUpload() {
    setState(() {
      _uploadTask = imagesStorage.upload(widget.imageName, widget.file);
    });
  }

  void uploadCompleted() async {
    final response = await _uploadTask.onComplete;
    final imageUrl = await response.ref.getDownloadURL();
    widget.onUploadCompleted(imageUrl);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = strings();

    if (_uploadTask != null) {
      /// Manage the task state and event subscription with a StreamBuilder
      return StreamBuilder<StorageTaskEvent>(
          stream: _uploadTask.events,
          builder: (_, snapshot) {
            var event = snapshot?.data?.snapshot;

            double progressPercent = event != null
                ? event.bytesTransferred / event.totalByteCount
                : 0;

            if (_uploadTask.isComplete) {
              uploadCompleted();
            }

            return Column(
              children: [
                if (_uploadTask.isComplete)
                  Text(s.labelImageCaptureUploadComplete),
                // Progress bar
                LinearProgressIndicator(value: progressPercent),
                Text('${(progressPercent * 100).toStringAsFixed(2)} % '),
              ],
            );
          });
    }

    // Allows user to decide when to start the upload
    return FlatButton.icon(
      label: Text(s.actionImageCaputreUpload),
      icon: Icon(Icons.cloud_upload),
      onPressed: _startUpload,
      textColor: theme.primaryColor,
    );
  }
}
