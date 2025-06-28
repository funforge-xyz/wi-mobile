import 'package:flutter/material.dart';

class SubmitButton extends StatelessWidget {
  final Function onPressed;
  final bool loading;
  final Widget child;

  SubmitButton({Key key, this.onPressed, this.loading, this.child})
      : super(key: key);

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
    return RaisedButton(
      onPressed: loading ? null : onPressed,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          this.child,
          this.loading ? _showLoader() : SizedBox.shrink(),
        ],
      ),
    );
  }
}
