// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'example_json_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ExampleJsonModel _$ExampleJsonModelFromJson(Map<String, dynamic> json) {
  return ExampleJsonModel(
    id: json['id'] as int,
    location: json['location'] as String,
    name: json['name'] as String,
    timeZoneId: json['timeZoneId'] as String,
  );
}

Map<String, dynamic> _$ExampleJsonModelToJson(ExampleJsonModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'location': instance.location,
      'name': instance.name,
      'timeZoneId': instance.timeZoneId,
    };
