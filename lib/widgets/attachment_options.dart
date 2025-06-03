import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/widgets/attachment_upload.dart';
import 'package:wi/widgets/custom_icon.dart';

typedef void PickCallback(List<AttachmentPick> picks);

class AttachmentOptions extends StatefulWidget {
  final OverlayEntry overlayEntry;
  final Offset position;
  final PickCallback onPick;
  final Function onLoading;
  final Function onDismiss;

  AttachmentOptions._(
    this.overlayEntry,
    this.position, {
    @required this.onPick,
    this.onLoading,
    this.onDismiss,
  });

  static OverlayEntry show(
    BuildContext context, {
    @required PickCallback onPick,
    Function onLoading,
    Function onDismiss,
  }) {
    final RenderBox renderObject = context.findRenderObject();
    final position = renderObject.localToGlobal(Offset.zero);
    OverlayEntry entry;
    entry = OverlayEntry(
      builder: (context) {
        return AttachmentOptions._(
          entry,
          position,
          onPick: (files) {
            entry.remove();
            onPick(files);
          },
          onLoading: onLoading,
          onDismiss: onDismiss,
        );
      },
    );
    Overlay.of(context).insert(entry);
    return entry;
  }

  @override
  _AttachmentOptionsState createState() => _AttachmentOptionsState();
}

class _AttachmentOptionsState extends State<AttachmentOptions>
    with SingleTickerProviderStateMixin {
  AnimationController animation;

  bool loading = false;

  @override
  void initState() {
    super.initState();
    animation = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 200),
    );
    animation.forward();
  }

  _setLoading() {
    widget.onLoading?.call();
    setState(() => loading = true);
  }

  _onDocumentPick() async {
    _setLoading();
    final picks = await FilePicker.getMultiFile();
    widget.onPick(
      picks?.map((pick) => AttachmentPick(file: pick))?.toList() ?? [],
    );
  }

  _onImagePick() async {
    _setLoading();
    final picker = ImagePicker();
    final pick = await picker.getImage(source: ImageSource.gallery);
    widget.onPick(pick == null ? [] : [AttachmentPick(file: File(pick.path))]);
  }

  _onCameraPick() async {
    _setLoading();
    final picker = ImagePicker();
    final pick = await picker.getImage(source: ImageSource.camera);
    widget.onPick(pick == null ? [] : [AttachmentPick(file: File(pick.path))]);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Stack(
      children: [
        GestureDetector(
          onTap: () async {
            await animation.reverse();
            widget.overlayEntry.remove();
            widget.onDismiss?.call();
          },
          child: Container(
            height: double.infinity,
            width: double.infinity,
            color: Colors.transparent,
            child: SizedBox.expand(),
          ),
        ),
        Positioned(
          top: widget.position.dy - 96,
          left: widget.position.dx / 2 - 48,
          child: AnimatedBuilder(
            animation: animation,
            builder: (context, child) {
              final value = Curves.easeOutQuint.transform(animation.value);
              return Transform.scale(
                scale: value,
                alignment: AlignmentDirectional.bottomEnd,
                child: SizedBox(
                  width: 240,
                  child: Material(
                    elevation: 4 * value,
                    borderRadius: BorderRadius.circular(8),
                    color: theme.colorScheme.surface,
                    child: child,
                  ),
                ),
              );
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: <Widget>[
                  _buildAnimatedIcon(
                    2,
                    IconButton(
                      icon: CustomIcon(I.attachmentFile),
                      onPressed: loading ? null : _onDocumentPick,
                    ),
                  ),
                  _buildAnimatedIcon(
                    1,
                    IconButton(
                      icon: CustomIcon(I.attachmentImage),
                      onPressed: loading ? null : _onImagePick,
                    ),
                  ),
                  _buildAnimatedIcon(
                    0,
                    IconButton(
                      icon: CustomIcon(I.attachmentCamera),
                      onPressed: loading ? null : _onCameraPick,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  _buildAnimatedIcon(int order, Widget child) {
    return TweenAnimationBuilder<double>(
      key: ValueKey('$order-icon-animation-builder'),
      curve: Interval(0.1 + (order * 0.2), 1.0, curve: Curves.ease),
      duration: Duration(milliseconds: 300),
      tween: Tween<double>(begin: 0, end: 1),
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, -10 * (1 - value)),
          child: Opacity(
            opacity: value,
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}
