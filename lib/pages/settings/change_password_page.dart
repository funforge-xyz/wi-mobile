import 'package:flutter/material.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/di.dart';
import 'package:wi/widgets/app_app_bar.dart';
import 'package:wi/widgets/app_bar_back_button.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/widgets/submit_button.dart';

class ChangePasswordPage extends StatefulWidget {
  @override
  _ChangePasswordPageState createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  final auth = getIt<Auth>();
  final _formKey = GlobalKey<FormState>();
  var _passwordKey = GlobalKey<FormFieldState>();

  String _password;
  String _errorMessage;
  bool _isLoading = false;

  @override
  void initState() {
    _errorMessage = "";
    _isLoading = false;
    super.initState();
  }

  Widget _showErrorMessage() {
    if (_errorMessage.length > 0 && _errorMessage != null) {
      return Text(
        _errorMessage,
        style: TextStyle(
          fontSize: 13.0,
          color: Colors.red,
          height: 1.0,
          fontWeight: FontWeight.w300,
        ),
      );
    } else {
      return Container(
        height: 0.0,
      );
    }
  }

  onSubmit() async {
    final s = strings();
    final form = _formKey.currentState;

    if (form.validate()) {
      form.save();
      setState(() {
        _errorMessage = "";
        _isLoading = true;
      });

      final firebaseUser = auth.getCurrentUser();

      firebaseUser.updatePassword(_password).then((_) {
        _scaffoldKey.currentState.showSnackBar(SnackBar(
          content: Text(s.messageChangePasswordSuccess),
          backgroundColor: Colors.green,
        ));

        Future.delayed(const Duration(seconds: 1), () {
          Navigator.pop(context);
        });
      }).catchError((error) {
        setState(() {
          _errorMessage = error.message ?? s.messageChangePasswordError;
          _formKey.currentState.reset();
        });
      }).whenComplete(() => setState(() {
            _isLoading = false;
          }));
    }
  }

  String _passwordValidator(String value) {
    final s = strings();

    if (value.isEmpty) {
      return s.messageChangePasswordPasswordRequired;
    }

    return null;
  }

  _passwordTextField(S s) {
    return TextFormField(
      key: _passwordKey,
      obscureText: true,
      autofocus: false,
      decoration: InputDecoration(
        hintText: s.labelChangePasswordPasswordInput,
      ),
      validator: _passwordValidator,
      onSaved: (value) => _password = value.trim(),
    );
  }

  String _passwordConfirmationValidator(String value) {
    final s = strings();

    if (value.isEmpty) {
      return s.messageChangePasswordConfirmationRequired;
    }

    if (value != _passwordKey.currentState.value) {
      return s.messageChangePasswordDoesNotMatch;
    }

    return null;
  }

  _passwordConfirmationTextField(S s) {
    return TextFormField(
      obscureText: true,
      autofocus: false,
      decoration: InputDecoration(
        hintText: s.labelChangePasswordConfirmationPasswordInput,
      ),
      validator: _passwordConfirmationValidator,
    );
  }

  _submitFormButton(S s) {
    return SubmitButton(
      onPressed: onSubmit,
      child: Text(s.labelChangePasswordSubmit),
      loading: _isLoading,
    );
  }

  Widget _buildContent(S s, ThemeData theme) {
    return SingleChildScrollView(
      padding: EdgeInsets.symmetric(horizontal: 16),
      child: Form(
        key: _formKey,
        child: Column(
          children: <Widget>[
            _showErrorMessage(),
            SizedBox(height: 16),
            _passwordTextField(s),
            SizedBox(height: 16),
            _passwordConfirmationTextField(s),
            SizedBox(height: 16),
            _submitFormButton(s),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppAppBar(
        title: Text(s.titleChangePassword),
        leading: Padding(
          padding: const EdgeInsetsDirectional.only(start: 8),
          child: AppBarBackButton(),
        ),
      ),
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          FocusScope.of(context).unfocus();
        },
        child: _buildContent(s, theme),
      ),
    );
  }
}
