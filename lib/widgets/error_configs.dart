import 'package:flutter/material.dart';
import 'package:wi/config/app_config.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/di.dart';
import 'package:wi/widgets/custom_icon.dart';
import 'package:wi/widgets/sup/sup_config.dart';

class ErrorConfigs {
  static const _titleFontSize = 18.0;
  static const _subtitleFontSize = 14.0;

  static Widget _buildImage(CustomIconData image, [MaterialColor color]) {
    return Material(
      color: color[50],
      borderRadius: BorderRadius.circular(100),
      child: SizedBox(
        width: 104,
        height: 104,
        child: Center(
          child: SizedBox(
            width: 48,
            height: 48,
            child: CustomIcon(image, color: color),
          ),
        ),
      ),
    );
  }

  static SupConfig error(ErrorInfo error, {Function onRetry}) {
    final s = strings();
    final color = error.isConnectionError ? Colors.red : Colors.grey;
    final image = error.isConnectionError ? I.connectionError : I.error;
    final title =
        error.isConnectionError ? s.errorCommonConnection : s.errorCommonError;
    return SupConfig(
      image: _buildImage(image, color),
      title: Text(
        title,
        style: TextStyle(fontSize: _titleFontSize),
      ),
      subtitle: Text(
        error.message ?? '?',
        style: TextStyle(fontSize: _subtitleFontSize),
      ),
      bottom: onRetry == null
          ? null
          : FlatButton(
              child: Text(s.actionCommonRetry),
              onPressed: onRetry,
              textColor: color,
            ),
    );
  }

  static Widget errorBox(ErrorInfo error, {Function onRetry}) {
    final s = strings();
    final color = Colors.red;
    final image = error.isConnectionError ? I.connectionError : I.error;
    final title =
        error.isConnectionError ? s.errorCommonConnection : s.errorCommonError;
    return Material(
      color: color[50],
      borderRadius: BorderRadius.circular(AppConfig.STANDARD_CORNER_RADIUS),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            SizedBox(
              width: 40,
              height: 40,
              child: CustomIcon(image, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    title,
                    style: TextStyle(
                      color: color,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    error.message ?? '?',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: color[400],
                    ),
                  ),
                ],
              ),
            ),
            if (onRetry != null)
              FlatButton(
                child: Text(s.actionCommonRetry),
                onPressed: onRetry,
                textColor: color,
              ),
          ],
        ),
      ),
    );
  }
}
