import 'package:flutter/material.dart';

class SubmitButton extends StatelessWidget {
  final Function onPressed;
  final bool loading;
  final Color color;
  final Widget child;

  SubmitButton({
    Key key,
    this.onPressed,
    this.loading = false,
    this.color,
    this.child,
  }) : super(key: key);

  _showLoader() {
    return Row(
      children: <Widget>[
        SizedBox(width: 5),
        SizedBox(
          child: CircularProgressIndicator(strokeWidth: 2.0),
          height: 20.0,
          width: 20.0,
        )
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      height: 48,
      child: RaisedButton(
        onPressed: loading ? null : onPressed,
        elevation: 1,
        color: color,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            DefaultTextStyle(
              child: this.child,
              style: theme.textTheme.button.copyWith(
                fontSize: 14,
                color: color == null
                    ? null
                    : color.computeLuminance() > 0.5
                        ? Colors.black
                        : Colors.white,
              ),
            ),
            this.loading ? _showLoader() : SizedBox.shrink(),
          ],
        ),
      ),
    );
  }
}
