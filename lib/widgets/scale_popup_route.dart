import 'dart:math';

import 'package:flutter/material.dart';
import 'package:meta/meta.dart';

const double IMAGINARY_FINGER_HEIGHT = 20.0;

class ScalePopupRoute extends PopupRoute {
  /// [context] is used to calculate the point on screen to anchor this popup.
  ///
  /// If calculation from context doesn't yield good results, [position]
  /// can be passed to manually set global coordinates..
  ScalePopupRoute({
    BuildContext context,
    @required this.child,
    this.position,
    this.preferAbove,
    this.centerChildHorizontally,
    this.overlayArea,
    this.overlayPadding,
  }) {
    // Find tap child position
    if (position == null) {
      final RenderBox box = context.findRenderObject();
      position = box.localToGlobal(Offset.zero);
    }
  }

  final bool preferAbove;
  final bool centerChildHorizontally;
  final Rect overlayArea;
  final EdgeInsets overlayPadding;
  final Widget child;

  Offset position;

  @override
  Animation<double> createAnimation() {
    return CurvedAnimation(
      parent: super.createAnimation(),
      curve: Curves.easeOutQuart,
      reverseCurve: Curves.easeOutCubic.flipped,
    );
  }

  @override
  Widget buildTransitions(BuildContext context, Animation<double> animation,
      Animation<double> secondaryAnimation, Widget child) {
    final media = MediaQuery.of(context);
    final width = media.size.width;
    final height = media.size.height;

    // Find the centre of the cartesian coordinate plane on the screen.
    final originY = height / 2;
    final originX = width / 2;
    // Find the distance from the origin on both axes.
    final diffFromX = position.dx - originX;
    final diffFromY = position.dy - originY;
    // Convert absolute distance values to 0-1 from origin to end of the plane.
    final diffPercentX = diffFromX / originX;
    final diffPercentY = diffFromY / originY;

    return ScaleTransition(
      alignment: Alignment(diffPercentX, diffPercentY),
      scale: Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(animation),
      child: FadeTransition(
        opacity: Tween<double>(
          begin: 0.0,
          end: 1.0,
        ).animate(animation),
        child: child,
      ),
    );
  }

  @override
  Duration get transitionDuration => const Duration(milliseconds: 200);

  @override
  bool get barrierDismissible => true;

  @override
  Color get barrierColor => Colors.black26;

  @override
  final String barrierLabel = '';

  @override
  Widget buildPage(BuildContext context, Animation<double> animation,
      Animation<double> secondaryAnimation) {
    final statusBarHeight = MediaQuery.of(context).padding.top;
    return MediaQuery.removePadding(
      context: context,
      removeTop: true,
      removeBottom: true,
      removeLeft: true,
      removeRight: true,
      child: Builder(
        builder: (BuildContext context) {
          return CustomSingleChildLayout(
            delegate: _PopupMenuRouteLayout(
              position,
              statusBarHeight: statusBarHeight,
              preferAbove: preferAbove == true,
              centerChildHorizontally: centerChildHorizontally == true,
              overlayArea: overlayArea,
              overlayPadding: overlayPadding ?? const EdgeInsets.all(8),
            ),
            child: child,
          );
        },
      ),
    );
  }
}

// Positioning of the popup on the screen.
class _PopupMenuRouteLayout extends SingleChildLayoutDelegate {
  _PopupMenuRouteLayout(
    this.position, {
    this.statusBarHeight,
    this.preferAbove,
    this.centerChildHorizontally,
    this.overlayArea,
    this.overlayPadding,
  });

  /// Used to account for top padding if [overlayArea] not passed.
  final double statusBarHeight;

  /// Rectangle of underlying button, relative to the overlay's dimensions.
  final Offset position;

  /// Whether we should try placing the child above point y first.
  final bool preferAbove;

  /// Whether popup should be centered from [position] or not.
  final bool centerChildHorizontally;

  /// Rectangle in which the popup can be displayed.
  final Rect overlayArea;

  /// Amount of padding from the edge of the [overlayArea].
  final EdgeInsets overlayPadding;

  @override
  BoxConstraints getConstraintsForChild(BoxConstraints constraints) {
    return BoxConstraints.loose(
      Size(
        min(constraints.biggest.width * 0.6, 260.0),
        constraints.biggest.height * 0.4,
      ),
    );
  }

  /// Returns the position to show the popup at.
  ///
  /// size: The size of the overlay.
  /// childSize: The size of the popup, when fully open, as determined by
  /// [getConstraintsForChild].
  @override
  Offset getPositionForChild(Size size, Size childSize) {
    final areaWithoutPadding = overlayArea ??
        Rect.fromLTWH(0, statusBarHeight, size.width, size.height);
    final area = Rect.fromLTWH(
      areaWithoutPadding.left + overlayPadding.left,
      areaWithoutPadding.top + overlayPadding.top,
      areaWithoutPadding.right - overlayPadding.left - overlayPadding.right,
      areaWithoutPadding.bottom - overlayPadding.top - overlayPadding.bottom,
    );

    double y = position.dy;
    double x = position.dx;

    final childBottom = y + childSize.height;
    final childRightX = x + childSize.width / (centerChildHorizontally ? 2 : 1);

    if (preferAbove) {
      y = y - childSize.height - IMAGINARY_FINGER_HEIGHT;
    }
    if (centerChildHorizontally) {
      x = position.dx - childSize.width / 2;
    }

    // Avoid going outside an area defined as the rectangle 8.0 pixels from the
    // edge of the screen in every direction.
    if (x < area.left) {
      x = area.left;
    } else if (childRightX > area.right) {
      x = area.right - childSize.width;
    }
    if (y < area.top) {
      y = area.top;
    } else if (childBottom > area.bottom) {
      y = area.bottom - childSize.height;
    }

    return Offset(x, y);
  }

  @override
  bool shouldRelayout(_PopupMenuRouteLayout oldDelegate) {
    return position != oldDelegate.position;
  }
}
