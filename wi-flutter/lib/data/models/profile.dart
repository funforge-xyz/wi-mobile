import 'package:json_annotation/json_annotation.dart';

part 'profile.g.dart';

@JsonSerializable()
class ProfileModel {
  String imageUrl;
  String name;
  String about;
  String phone;
  String email;
  bool isDeleted;

  ProfileModel({
    this.imageUrl,
    this.name,
    this.about,
    this.phone,
    this.email,
    this.isDeleted = false,
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) =>
      _$ProfileModelFromJson(json);
  Map<String, dynamic> toJson() => _$ProfileModelToJson(this);
}
