import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/config/icons.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/data/local/database.dart';
import 'package:wi/data/models/profile.dart';
import 'package:wi/di.dart';
import 'package:wi/pages/profile/profile_avatar.dart';
import 'package:wi/pages/routes.dart';
import 'package:wi/utils/validators.dart';
import 'package:wi/widgets/custom_text_form_field.dart';
import 'package:wi/widgets/info_text.dart';
import 'package:wi/widgets/submit_button.dart';

class ProfileDetails extends StatefulWidget {
  final ProfileModel profileModel;
  final onProfileChange;
  final isRegistrationFlow;

  ProfileDetails(
      this.profileModel, this.onProfileChange, this.isRegistrationFlow);

  @override
  _ProfileDetailsState createState() => _ProfileDetailsState();
}

class _ProfileDetailsState extends State<ProfileDetails> {
  final _database = getIt<Database>();

  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  _submitForm(S s) async {
    final FormState form = _formKey.currentState;
    setState(() {
      _isLoading = true;
    });

    if (!form.validate()) {
      showMessage(s.messageCommonSomethingWentWrong);
    } else {
      form.save();
      await widget.onProfileChange(widget.profileModel);
      // Update our profile cache
      _database.putProfile(widget.profileModel);
      showMessage(s.messageProfileUpdatedSuccessfully, Colors.green);

      if (widget.isRegistrationFlow) {
        Navigator.of(context).pushReplacementNamed(Routes.HOME);
      }
    }

    setState(() {
      _isLoading = false;
    });
  }

  void showMessage(String message, [MaterialColor color = Colors.red]) {
    Scaffold.of(context).showSnackBar(
      new SnackBar(
        backgroundColor: color,
        content: Text(message),
      ),
    );
  }

  Widget _submitText(S s) {
    if (widget.isRegistrationFlow) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Text(s.actionCommonContinue),
          SizedBox(width: 10),
          Icon(I.arrowForward),
        ],
      );
    }

    return Text(s.labelCommonSave);
  }

  Widget _submitButton(S s) {
    return SubmitButton(
      onPressed: () => _submitForm(s),
      child: _submitText(s),
      loading: _isLoading,
    );
  }

  Widget _nameTextField(S s) {
    return CustomTextFormField(
      initialValue: widget.profileModel.name,
      textCapitalization: TextCapitalization.words,
      decoration: InputDecoration(
        hintText: 'Name',
      ),
      validator: (value) {
        if (value.isEmpty) {
          return s.errorProfileNameRequired;
        }
        return null;
      },
      onSaved: (val) => widget.profileModel.name = val,
    );
  }

  Widget _aboutTextField(ThemeData theme) {
    return CustomTextFormField(
      initialValue: widget.profileModel.about,
      textCapitalization: TextCapitalization.sentences,
      keyboardType: TextInputType.multiline,
      decoration: InputDecoration(
        hintText: 'About me',
      ),
      minLines: 1,
      maxLines: 5,
      maxLength: 200,
      textInputAction: TextInputAction.done,
      onSaved: (val) => widget.profileModel.about = val,
      padBottom: true,
    );
  }

  Widget _phoneTextField() {
    return CustomTextFormField(
      initialValue: widget.profileModel.phone,
      keyboardType: TextInputType.phone,
      decoration: InputDecoration(
        hintText: 'Phone',
      ),
      onSaved: (val) => widget.profileModel.phone = val,
    );
  }

  Widget _emailTextField(S s) {
    return CustomTextFormField(
      initialValue: widget.profileModel.email,
      keyboardType: TextInputType.emailAddress,
      decoration: InputDecoration(
        hintText: 'Email address',
      ),
      validator: (value) =>
          isValidEmail(value) ? null : s.errorProfileEmailRequired,
      onSaved: (val) => widget.profileModel.email = val,
    );
  }

  Widget _profileForm(S s, ThemeData theme) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          _nameTextField(s),
          SizedBox(height: 16),
          InfoText(s.messageProfileNameDescription),
          SizedBox(height: 16),
          _aboutTextField(theme),
          SizedBox(height: 16),
          _phoneTextField(),
          SizedBox(height: 16),
          _emailTextField(s),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = strings();
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);

    return Container(
      child: ListView(
        padding: const EdgeInsets.all(16),
        physics: ClampingScrollPhysics(),
        children: [
          if (widget.isRegistrationFlow == true) ...[
            Text(
              s.messageLoginThankYouCompleteProfile,
              style: TextStyle(
                color: colorSet.textLight,
                fontSize: 20,
              ),
            ),
          ],
          SizedBox(height: 32),
          ProfileAvatar(
            widget.profileModel,
            widget.onProfileChange,
          ),
          SizedBox(height: 32),
          _profileForm(s, theme),
          SizedBox(height: 32),
          _submitButton(s),
        ],
      ),
    );
  }
}
