// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_svg/svg.dart';

class CustomIconData {
  final String data;
  final bool matchTextDirection;

  const CustomIconData(this.data, [this.matchTextDirection = false]);
}

/// An icon that comes from an [ImageProvider], e.g. an [AssetImage].
///
/// See also:
///
///  * [IconButton], for interactive icons.
///  * [IconTheme], which provides ambient configuration for icons.
///  * [Icon], for icons based on glyphs from fonts instead of images
///  * [Icons], a predefined font based set of icons from the material design library.
class CustomIcon extends StatelessWidget {
  /// Creates an image icon.
  ///
  /// The [size] and [color] default to the value given by the current [IconTheme].
  const CustomIcon(
    this.icon, {
    Key key,
    this.size,
    this.color,
    this.semanticLabel,
  }) : super(key: key);

  final CustomIconData icon;

  /// The size of the icon in logical pixels.
  ///
  /// Icons occupy a square with width and height equal to size.
  ///
  /// Defaults to the current [IconTheme] size, if any. If there is no
  /// [IconTheme], or it does not specify an explicit size, then it defaults to
  /// 24.0.
  final double size;

  /// The color to use when drawing the icon.
  ///
  /// Defaults to the current [IconTheme] color, if any. If there is
  /// no [IconTheme], then it defaults to not recolorizing the image.
  ///
  /// The image will additionally be adjusted by the opacity of the current
  /// [IconTheme], if any.
  final Color color;

  /// Semantic label for the icon.
  ///
  /// Announced in accessibility modes (e.g TalkBack/VoiceOver).
  /// This label does not show in the UI.
  ///
  /// See also:
  ///
  ///  * [Semantics.label], which is set to [semanticLabel] in the underlying
  ///    [Semantics] widget.
  final String semanticLabel;

  @override
  Widget build(BuildContext context) {
    final IconThemeData iconTheme = IconTheme.of(context);
    final double iconSize = size ?? iconTheme.size;
    final textDirection = Directionality.of(context);

    if (icon == null) {
      return Semantics(
        label: semanticLabel,
        child: SizedBox(width: iconSize, height: iconSize),
      );
    }

    Widget child = SvgPicture.asset(
      icon.data,
      width: iconSize,
      height: iconSize,
      color: color ?? iconTheme.color,
      fit: BoxFit.scaleDown,
      alignment: Alignment.center,
      excludeFromSemantics: true,
    );

    if (icon.matchTextDirection == true && textDirection == TextDirection.rtl) {
      child = Transform(
        transform: Matrix4.identity()..scale(-1.0, 1.0, 1.0),
        alignment: Alignment.center,
        transformHitTests: false,
        child: child,
      );
    }

    return Semantics(
      label: semanticLabel,
      child: child,
    );
  }
}
