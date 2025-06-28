part of 'profile.dart';

ProfileModel _$ProfileModelFromJson(Map<String, dynamic> json) {
  return ProfileModel(
    name: json['name'] as String,
    about: json['about'] as String,
    email: json['email'] as String,
    phone: json['phone'] as String,
    imageUrl: json['imageUrl'] as String,
    isDeleted: json['isDeleted'] as bool,
  );
}

Map<String, dynamic> _$ProfileModelToJson(ProfileModel instance) =>
    <String, dynamic>{
      'name': instance.name,
      'about': instance.about,
      'email': instance.email,
      'phone': instance.phone,
      'imageUrl': instance.imageUrl,
      'isDeleted': instance.isDeleted,
    };
