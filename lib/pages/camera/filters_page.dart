import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;
import 'package:image_cropper/image_cropper.dart';
import 'package:path/path.dart' as p;
import 'package:photofilters/photofilters.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/pages/camera/camera_page.dart';
import 'package:wi/services/compression.dart';
import 'package:wi/services/image_manipulator.dart';
import 'package:wi/widgets/common_progress_indicator.dart';

class FiltersPage extends StatefulWidget {
  final CameraResult result;

  FiltersPage({
    @required this.result,
  });

  @override
  _FiltersPageState createState() => _FiltersPageState();
}

class _FiltersPageState extends State<FiltersPage> {
  static final _availableFilters = [
    NoFilter(),
    GinghamFilter(),
    MoonFilter(),
    AddictiveRedFilter(),
    LarkFilter(),
    ReyesFilter(),
    JunoFilter(),
    SlumberFilter(),
    CremaFilter(),
    PerpetuaFilter(),
    LudwigFilter(),
    AdenFilter(),
    AmaroFilter(),
    RiseFilter(),
    HudsonFilter(),
    ValenciaFilter(),
    XProIIFilter(),
    WillowFilter(),
    NashvilleFilter(),
    InkwellFilter(),
    ToasterFilter(),
  ];

  final _imgManipulator = getIt<ImageManipulator>();
  final _compression = getIt<Compression>();

  final _filterFutures = <Future<List<int>>>[];
  Future<List<int>> _imageFuture;

  File _imageFile;
  img.Image _image;
  String _fileName;

  bool _loading = false;

  @override
  void initState() {
    _initFilters();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    final isLight = Theme.of(context).isLight;

    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          title: IconButton(
            icon: Icon(I.edit),
            onPressed: _cropImage,
          ),
          actions: <Widget>[
            _loading
                ? Container()
                : IconButton(
                    icon: Icon(I.arrowForward),
                    onPressed: _returnFilteredImage,
                  ),
          ],
        ),
        body: Container(
          width: double.infinity,
          height: double.infinity,
          color: colorSet.surface,
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              SizedBox.expand(
                child: _fileName == null
                    ? Center(child: CommonProgressIndicator())
                    : _FilteredThumbnail(future: _imageFuture, circle: false),
              ),
              Container(
                height: 150,
                decoration: isLight
                    ? BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [
                            Colors.white38,
                            Colors.transparent,
                            Colors.transparent,
                          ],
                        ),
                      )
                    : null,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _availableFilters.length,
                  shrinkWrap: true,
                  itemBuilder: (BuildContext context, int index) {
                    final filter = _availableFilters[index];
                    return InkWell(
                      child: Padding(
                        padding: EdgeInsets.all(8),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            _FilteredThumbnail(
                              future: _filterFutures[index],
                              circle: true,
                            ),
                            SizedBox(height: 5.0),
                            Text(filter.name),
                          ],
                        ),
                      ),
                      onTap: () => setState(() {
                        _imageFuture = compute(_applyFilter, {
                          'image': _image,
                          'filter': _availableFilters[index],
                          'fileName': _fileName,
                        });
                      }),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _initFilters() {
    final completers = List<Completer<List<int>>>.generate(
      _availableFilters.length,
      (index) => Completer(),
    );

    _filterFutures
      ..clear()
      ..addAll(completers.map((e) => e.future));

    _resizeImage().then((_) async {
      if (!mounted) return;

      setState(() {
        final selectedFilter = _availableFilters.first;
        _imageFuture = compute(_applyFilter, {
          'image': _image,
          'filter': selectedFilter,
          'fileName': _fileName,
        });
        _loading = false;
      });

      for (var i = 0; i < _availableFilters.length; i++) {
        final bytes = await compute(_buildThumbnail, {
          'image': _image,
          'fileName': _fileName,
          'filter': _availableFilters[i],
        });

        if (!mounted) return;

        setState(() {
          completers[i].complete(bytes);
        });
      }
    });
  }

  Future<void> _resizeImage() async {
    if (_fileName != null) {
      // Image already resized
      return;
    }

    final crop = await _imgManipulator.flipAndCropFeedPost(
      widget.result.file,
      widget.result.previewAspectRatio,
      flip: widget.result.isFrontCamera,
    );

    final imageFile = await _compression.compressImage(crop);
    _imageFile = imageFile;
    final bytes = await imageFile.readAsBytes();
    _image = img.decodeImage(bytes);
    _fileName = p.basename(imageFile.path);
  }

  _returnFilteredImage() async {
    if (_loading) {
      return;
    }

    setState(() {
      _loading = true;
    });

    await _imageFile.writeAsBytes(await _imageFuture);

    Navigator.pop(context, _imageFile);
  }

  _cropImage() async {
    final croppedFile = await ImageCropper.cropImage(
      sourcePath: _imageFile.path,
      androidUiSettings: AndroidUiSettings(
        lockAspectRatio: false,
      ),
    );
    if (croppedFile != null) {
      final bytes = await croppedFile.readAsBytes();
      setState(() {
        _loading = true;
        _imageFile = croppedFile;
        _image = img.decodeImage(bytes);
        _fileName = p.basename(croppedFile.path);

        _initFilters();
      });
    }
  }
}

class _FilteredThumbnail extends StatelessWidget {
  final Future<List<int>> future;
  final bool circle;

  _FilteredThumbnail({
    @required this.future,
    @required this.circle,
  });

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);

    return FutureBuilder<List<int>>(
      future: future,
      builder: (BuildContext context, AsyncSnapshot<List<int>> snapshot) {
        switch (snapshot.connectionState) {
          case ConnectionState.none:
          case ConnectionState.active:
          case ConnectionState.waiting:
            return CircleAvatar(
              radius: 50.0,
              child: Center(
                child: CommonProgressIndicator(),
              ),
              backgroundColor: colorSet.surface,
            );
          case ConnectionState.done:
            if (snapshot.hasError)
              return Center(child: Text('Error: ${snapshot.error}'));

            if (circle)
              return CircleAvatar(
                radius: 50.0,
                backgroundImage: MemoryImage(
                  snapshot.data,
                ),
                backgroundColor: colorSet.surface,
              );

            return Image.memory(
              snapshot.data,
              fit: BoxFit.cover,
            );
        }

        // Unreachable
        return null;
      },
    );
  }
}

/// This function needs to have 1 parameter
/// and needs to be top-level function.
/// See [compute] documentation for more info.
///
/// Params: image, filter, fileName.
List<int> _applyFilter(Map<String, dynamic> params) {
  final img.Image image = params['image'];
  final Filter filter = params['filter'];
  final String fileName = params['fileName'];
  List<int> bytes = Uint8List.fromList(image.getBytes());

  filter.apply(bytes, image.width, image.height);
  final img.Image _image =
      img.Image.fromBytes(image.width, image.height, bytes);
  bytes = img.encodeNamedImage(_image, fileName);

  return bytes;
}

/// This function needs to have 1 parameter
/// and needs to be top-level function.
/// See [compute] documentation for more info.
///
/// Params: image, filter, fileName.
List<int> _buildThumbnail(Map<String, dynamic> params) {
  params['image'] = img.copyResize(params['image'], width: 200);
  return _applyFilter(params);
}
