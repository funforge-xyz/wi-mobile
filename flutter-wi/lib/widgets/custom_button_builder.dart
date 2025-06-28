import 'package:flutter/material.dart';

/// [tapping] whether there is an ongoing tap gesture or not.
/// [child] child widget passed to [CustomButtonBuilder] earlier, provided for
/// convenience.
typedef Widget CustomButtonChildBuilder(
    BuildContext context, bool tapping, Widget child);

/// A builder widget that passes a bool to indicate whether there is an ongoing
/// tap gesture on this widget.
class CustomButtonBuilder extends StatefulWidget {
  /// Builder function.
  final CustomButtonChildBuilder builder;

  /// A widget that will be provided passed back to you in the builder function.
  /// Can be used to avoid rebuilding parts of the tree unaffected by the tap
  /// state.
  final Widget child;

  // Tap callback.
  final Function onTap;

  // Long press callback.
  final Function onLongPress;

  CustomButtonBuilder({
    this.builder,
    this.child,
    this.onTap,
    this.onLongPress,
  });

  @override
  _CustomButtonBuilderState createState() => _CustomButtonBuilderState();
}

class _CustomButtonBuilderState extends State<CustomButtonBuilder> {
  bool tapping = false;

  _set(bool tapping) {
    if (widget.onTap == null && widget.onLongPress == null) {
      return; // Ignore all events if button disabled.
    }
    setState(() => this.tapping = tapping);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _set(true),
      onTapUp: (_) => _set(false),
      onTapCancel: () => _set(false),
      onTap: widget.onTap,
      onLongPress: widget.onLongPress,
      child: widget.builder(context, tapping, widget.child),
    );
  }
}
