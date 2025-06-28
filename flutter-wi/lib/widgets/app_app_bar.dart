import 'package:flutter/material.dart';
import 'package:wi/config/assets.dart';

class AppAppBar extends StatelessWidget implements PreferredSizeWidget {
  final Widget leading;
  final bool automaticallyImplyLeading;
  final Widget title;
  final List<Widget> actions;
  final Widget flexibleSpace;
  final PreferredSizeWidget bottom;
  final IconThemeData iconTheme;
  final TextTheme textTheme;
  final double titleSpacing;
  final double toolbarOpacity;
  final double bottomOpacity;
  final bool showDivider;
  final bool centerTitle;
  final Color color;
  final Color backgroundColor;

  @override
  final Size preferredSize;

  AppAppBar({
    Key key,
    this.leading,
    this.automaticallyImplyLeading = true,
    this.title,
    this.actions,
    this.flexibleSpace,
    this.bottom,
    this.iconTheme,
    this.textTheme,
    this.titleSpacing = NavigationToolbar.kMiddleSpacing,
    this.toolbarOpacity = 1.0,
    this.bottomOpacity = 1.0,
    this.showDivider = false,
    this.color,
    this.backgroundColor,
    this.centerTitle = true,
  }) : preferredSize =
            Size.fromHeight(56 + (bottom?.preferredSize?.height ?? 0.0));

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = backgroundColor ?? theme.appBarTheme.color;
    return AppBar(
      key: key,
      backgroundColor: color,
      leading: leading,
      automaticallyImplyLeading: automaticallyImplyLeading,
      title: title,
      actions: actions,
      flexibleSpace: flexibleSpace,
      bottom: bottom,
      elevation: showDivider ? 1 : 0,
      centerTitle: centerTitle,
      titleSpacing: titleSpacing,
      toolbarOpacity: toolbarOpacity,
      bottomOpacity: bottomOpacity,
    );
  }
}
