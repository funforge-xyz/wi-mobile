import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:rxdart/subjects.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/pages/camera/filters_page.dart';
import 'package:wi/pages/camera/live_camera_preview.dart';
import 'package:wi/pages/camera/zoom_buttons.dart';
import 'package:wi/theme.dart';
import 'package:wi/utils/logger.dart';
import 'package:wi/widgets/circle_button.dart';
import 'package:wi/widgets/custom_button_builder.dart';

const _kMaxRecordingSeconds = 30;

enum CameraMode { photo, video }

class CameraResult {
  final File file;
  final CameraMode mode;
  final bool isFrontCamera;
  final double previewAspectRatio;

  CameraResult({
    @required this.file,
    @required this.mode,
    @required this.isFrontCamera,
    @required this.previewAspectRatio,
  });
}

typedef ResultCallback(CameraResult result);

class CameraPage extends StatefulWidget {
  final ResultCallback callback;
  final VoidCallback onCancel;

  CameraPage({
    @required this.callback,
    @required this.onCancel,
  });

  @override
  _CameraPageState createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> with WidgetsBindingObserver {
  static const _minZoomDelta = 0.01;
  static const _minZoomLevel = 1.0;
  static const _maxZoomLevel = 8.0;

  final _previewSizedBoxKey = GlobalKey();

  CameraController _controller;
  double _zoomLevel = 1;
  double _zoomBase = 1;

  List<CameraDescription> _cameras;
  CameraDescription _activeCamera;

  CameraMode mode = CameraMode.photo;

  /// Last horizontal position on which a swipe gesture (to change mode) began.
  double lastSwipePoint;

  Timer recordTimer;
  final _timerController = BehaviorSubject.seeded(_kMaxRecordingSeconds);

  Stream<int> get recordDurationLeft => _timerController.stream;

  final _recordingController = BehaviorSubject.seeded(false);

  Stream<bool> get recording => _recordingController.stream;

  String recordingPath;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    _init();
  }

  @override
  void dispose() {
    _controller?.dispose();
    _timerController?.close();
    _recordingController?.close();
    WidgetsBinding.instance.removeObserver(this);
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeRight,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // App state changed before we got the chance to initialize.
    if (_controller == null || !_controller.value.isInitialized) {
      return;
    }
    if (state == AppLifecycleState.inactive) {
      _controller?.dispose();
    } else if (state == AppLifecycleState.resumed) {
      if (_controller != null) {
        _onNewCameraSelected(_controller.description);
      }
    }
  }

  _init() async {
    await _initCameras();
  }

  _initCameras() async {
    final available = await availableCameras();
    final back = available.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.back,
        orElse: () => null);
    final front = available.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
        orElse: () => null);
    _cameras = [];
    if (back != null) _cameras.add(back);
    if (front != null) _cameras.add(front);
    if (_cameras.isEmpty) {
      _showNoCameraAvailableError();
      return;
    }
    _activeCamera = _cameras[0];
    _initController(_activeCamera);
  }

  _initController(CameraDescription camera) async {
    // Dispose old controller
    await _controller?.dispose();

    _controller = CameraController(camera, ResolutionPreset.veryHigh);
    await _controller.initialize();
    if (!mounted) return;

    setState(() {});
  }

  _showNoCameraAvailableError() {
    // TODO
  }

  _onNewCameraSelected(CameraDescription camera) {
    _activeCamera = camera;
    _zoomLevel = 1.0;
    _zoomBase = 1.0;
    _initController(_activeCamera);
  }

  bool get _multipleCamerasAvailable => _cameras?.length.or(0) > 1;

  _onSwitchCameraTap() {
    final index = _cameras.indexOf(_activeCamera);
    var nextIndex = index + 1;
    if (nextIndex >= _cameras.length) nextIndex = 0;
    _onNewCameraSelected(_cameras[nextIndex]);
  }

  _onShutterTap() {
    if (mode == CameraMode.photo) {
      _takePhoto();
    } else if (mode == CameraMode.video) {
      if (_controller.value.isRecordingVideo) {
        _stopRecording();
      } else {
        _startRecording();
      }
    }
  }

  _takePhoto() async {
    if (_controller.value.isTakingPicture) {
      Logger.log('Already taking picture. Ignoring...');
      return;
    }

    final xFile = await _controller.takePicture();

    final path = xFile.path;
    var imageFile = File(path);

    // Get the aspect ratio of the preview box and crop the image to its
    // rectangle to ensure the final image is the same as what was framed.
    final RenderBox renderBox =
        _previewSizedBoxKey.currentContext.findRenderObject();
    final aspectRatio = renderBox.size.height / renderBox.size.width;

    final result = CameraResult(
      file: imageFile,
      mode: mode,
      previewAspectRatio: 1,
      isFrontCamera: _activeCamera.lensDirection == CameraLensDirection.front,
    );

    imageFile = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => FiltersPage(
          result: result,
        ),
      ),
    );

    if (imageFile == null) {
      return;
    }

    widget.callback?.call(CameraResult(
      file: imageFile,
      mode: mode,
      previewAspectRatio: 1,
      isFrontCamera: _activeCamera.lensDirection == CameraLensDirection.front,
    ));
  }

  _startRecording() async {
    _recordingController.sink.add(true);
    await _controller.prepareForVideoRecording();
    await _controller.startVideoRecording();
    _restartRecordTimer();
  }

  _stopRecording({bool discard = false}) async {
    if (recordTimer?.isActive == true) {
      recordTimer.cancel();
    }
    final xFile = await _controller.stopVideoRecording();
    recordingPath = xFile.path;
    _timerController.sink.add(_kMaxRecordingSeconds); // Reset
    _recordingController.sink.add(false);
    if (discard) return;
    widget.callback?.call(CameraResult(
      file: File(recordingPath),
      mode: mode,
      previewAspectRatio: null,
      isFrontCamera: _activeCamera.lensDirection == CameraLensDirection.front,
    ));
    recordingPath = null;
  }

  _restartRecordTimer() {
    final maxSeconds = _kMaxRecordingSeconds;
    _timerController.sink.add(maxSeconds);
    recordTimer = Timer.periodic(1.seconds, (timer) {
      if (timer.tick == maxSeconds) {
        _stopRecording();
      }
      _timerController.sink.add(maxSeconds - timer.tick - 1);
    });
  }

  _onSwipeStart(DragStartDetails details) {
    lastSwipePoint = details.globalPosition.dx;
  }

  _onSwipeUpdate(DragUpdateDetails details, Size screenSize) {
    final swipeChangeTriggerThreshold = screenSize.width / 6;
    final thisPoint = details.globalPosition.dx;
    final diff = thisPoint - lastSwipePoint;
    if (diff.abs() > swipeChangeTriggerThreshold) {
      if (diff > 0) {
        if (mode == CameraMode.video) {
          _changeMode(CameraMode.photo);
        }
      } else {
        if (mode == CameraMode.photo) {
          _changeMode(CameraMode.video);
        }
      }
      // Update so we can calculate a new gesture even if the user
      // doesn't lift their finger.
      lastSwipePoint = thisPoint;
    }
  }

  _onModeLabelTap(CameraMode mode) {
    _changeMode(mode);
  }

  _changeMode(CameraMode mode) {
    if (this.mode == mode) return;
    if (_controller?.value?.isRecordingVideo == true) {
      _stopRecording(discard: true);
    }
    setState(() => this.mode = mode);
  }

  _setZoomLevel(double level, {bool force = false}) {
    if (force) {
      _zoomBase = level;
    } else {
      level *= _zoomBase;
    }

    level = level.clamp(_minZoomLevel, _maxZoomLevel);

    if (!force) {
      if ((_zoomLevel - level).abs() < _minZoomDelta) {
        // Small delta - ignore!
        return;
      }
    }

    setState(() {
      _zoomLevel = level;
      _controller.setZoomLevel(level);
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final size = MediaQuery.of(context).size;
    final bool cameraInitialized = _controller?.value?.isInitialized == true;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Theme(
        data: AppTheme.dark,
        child: Scaffold(
          backgroundColor: Colors.black,
          body: Stack(
            children: [
              GestureDetector(
                onHorizontalDragStart: _onSwipeStart,
                onHorizontalDragUpdate: (it) => _onSwipeUpdate(it, size),
                onScaleEnd: (details) => _zoomBase = _zoomLevel,
                onScaleUpdate: (details) => _setZoomLevel(details.scale),
                child: SizedBox(
                  key: _previewSizedBoxKey,
                  width: size.width,
                  height: size.height,
                  child: AnimatedSwitcher(
                    duration: 400.milliseconds,
                    transitionBuilder: (child, animation) {
                      return FadeTransition(
                        opacity: CurvedAnimation(
                          curve: Interval(0.5, 1),
                          parent: animation,
                        ),
                        child: child,
                      );
                    },
                    child: cameraInitialized
                        ? SizedBox(
                            height: size.height,
                            width: size.width,
                            child: AspectRatio(
                              aspectRatio: 1,
                              child: Center(
                                child: LiveCameraPreview(_controller),
                              ),
                            )
                          )
                        : SizedBox.shrink(),
                  ),
                ),
              ),
              Align(
                alignment: Alignment.bottomCenter,
                child: SafeArea(
                  child: StreamBuilder<bool>(
                      stream: recording,
                      builder: (context, snapshot) {
                        final recording = snapshot.data == true;
                        return Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Padding(padding:
                                const EdgeInsets.symmetric(vertical: 20),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: ZoomButtons(
                                      selected: _zoomLevel,
                                      onSelected: (level) => _setZoomLevel(
                                        level,
                                        force: true,
                                      ),
                                    ),
                                  ),
                                  ShutterButton(
                                    mode: mode,
                                    recording: recording,
                                    timeLeft: recordDurationLeft,
                                    onTap: _onShutterTap,
                                  ),
                                  Spacer(),
                                ],
                              ),
                            ),
                            Material(
                              color: Colors.black,
                              child: Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: AnimatedPadding(
                                        duration: 300.milliseconds,
                                        curve: Curves.easeInCubic,
                                        padding: EdgeInsetsDirectional.only(
                                          start:
                                              mode == CameraMode.photo ? 32 : 0,
                                          end:
                                              mode == CameraMode.video ? 32 : 0,
                                        ),
                                        child: Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Spacer(),
                                            CameraModeLabel(
                                              label: s.labelCameraPhoto
                                                  .toUpperCase(),
                                              selected:
                                                  mode == CameraMode.photo,
                                              onTap: () => _onModeLabelTap(
                                                  CameraMode.photo),
                                            ),
                                            SizedBox(width: 16),
                                            CameraModeLabel(
                                              label: s.labelCameraVideo
                                                  .toUpperCase(),
                                              selected:
                                                  mode == CameraMode.video,
                                              onTap: () => _onModeLabelTap(
                                                  CameraMode.video),
                                            ),
                                            Spacer(),
                                          ],
                                        ),
                                      ),
                                    ),
                                    if (_multipleCamerasAvailable && !recording)
                                      Padding(
                                        padding: const EdgeInsets.only(
                                          right: 8,
                                        ),
                                        child: AnimatedSwitcher(
                                          duration: 200.milliseconds,
                                          transitionBuilder:
                                              (child, animation) {
                                            return ScaleTransition(
                                              scale: animation,
                                              child: child,
                                            );
                                          },
                                          child: SwitchCameraButton(
                                            onTap: _onSwitchCameraTap,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        );
                      }),
                ),
              ),
              Align(
                alignment: Alignment.topRight,
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: CircleButton(
                      icon: I.clear,
                      onPressed: widget.onCancel,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CameraModeLabel extends StatelessWidget {
  final String label;
  final bool selected;
  final Function onTap;

  CameraModeLabel({
    @required this.label,
    @required this.selected,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(4),
      splashColor: colorSet.primary.withOpacity(0.1),
      highlightColor: colorSet.primary.withOpacity(0.1),
      onTap: selected ? null : onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          vertical: 10,
          horizontal: 10,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: selected ? colorSet.primary : Colors.white,
          ),
        ),
      ),
    );
  }
}

class ShutterButton extends StatelessWidget {
  final CameraMode mode;
  final bool recording;
  final Stream<int> timeLeft;
  final Function onTap;

  ShutterButton({
    this.mode = CameraMode.photo,
    this.recording = false,
    @required this.timeLeft,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return CustomButtonBuilder(
      onTap: onTap,
      builder: (context, tapping, _) {
        return StreamBuilder<int>(
          stream: timeLeft,
          initialData: _kMaxRecordingSeconds,
          builder: (context, snapshot) {
            final timeLeft = snapshot.data;
            return _buildButton(context, tapping, timeLeft);
          },
        );
      },
    );
  }

  Widget _buildButton(BuildContext context, bool tapping, int timeLeft) {
    final isPhoto = mode == CameraMode.photo;
    final transitionDuration = 200.milliseconds;
    final size = 64.0;
    final innerSize = recording
        ? 52.0
        : isPhoto
            ? 52.0
            : 64.0;
    final shadow = [
      BoxShadow(
        blurRadius: 2,
        offset: Offset(0, 2),
        color: Colors.black12,
      ),
      BoxShadow(
        blurRadius: 4,
        color: Colors.black.withOpacity(0.05),
      ),
    ];
    return SizedBox(
      width: size,
      height: size,
      child: Transform.scale(
        scale: tapping ? 1.05 : 1.0,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Ring for photo mode
            AnimatedContainer(
              width: size,
              height: size,
              duration: transitionDuration,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(40),
                border: Border.all(
                  color: isPhoto ? Colors.white : Colors.transparent,
                  width: isPhoto ? 3 : 0,
                ),
                boxShadow: shadow,
              ),
            ),
            // Main background circle
            AnimatedContainer(
              duration: transitionDuration,
              height: innerSize,
              width: innerSize,
              decoration: BoxDecoration(
                color: recording ? Colors.red : Colors.white,
                borderRadius: BorderRadius.circular(64),
                boxShadow: shadow,
              ),
              child: Center(
                child: AnimatedContainer(
                  width: isPhoto ? 0 : 16,
                  height: isPhoto ? 0 : 16,
                  duration: transitionDuration,
                  decoration: BoxDecoration(
                    color: recording ? Colors.white : Colors.red,
                    borderRadius: recording ? null : BorderRadius.circular(40),
                  ),
                ),
              ),
            ),
            // Countdown progress indicator for video recording
            SizedBox(
              height: recording ? size : 0,
              width: recording ? size : 0,
              child: TweenAnimationBuilder<double>(
                duration: 1.seconds,
                tween: 1.0.tweenTo(timeLeft / _kMaxRecordingSeconds),
                builder: (context, value, child) {
                  return CircularProgressIndicator(
                    strokeWidth: 4,
                    valueColor: AlwaysStoppedAnimation(Colors.white70),
                    value: value,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SwitchCameraButton extends StatelessWidget {
  final bool disabled;
  final Function onTap;

  SwitchCameraButton({
    this.disabled = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return CustomButtonBuilder(
      onTap: disabled ? null : onTap,
      builder: (context, tapping, _) {
        final color = tapping ? Colors.white70 : Colors.white;
        return Material(
          color: Colors.transparent,
          shape: CircleBorder(
            side: BorderSide(color: color, width: 2),
          ),
          child: SizedBox(
            height: 40,
            width: 40,
            child: Icon(
              Icons.flip_camera_android_outlined,
              color: color,
              size: tapping ? 22 : 24,
            ),
          ),
        );
      },
    );
  }
}
