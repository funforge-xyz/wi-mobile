// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attachment.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Attachment _$AttachmentFromJson(Map json) {
  return Attachment(
    name: json['name'] as String,
    url: json['url'] as String,
    type: json['type'] as String,
    size: json['size'] as int,
    created: json['created'] as int,
    width: json['width'] as int,
    height: json['height'] as int,
    aspectRatio: (json['aspectRatio'] as num)?.toDouble(),
  );
}

Map<String, dynamic> _$AttachmentToJson(Attachment instance) =>
    <String, dynamic>{
      'name': instance.name,
      'url': instance.url,
      'type': instance.type,
      'size': instance.size,
      'created': instance.created,
      'width': instance.width,
      'height': instance.height,
      'aspectRatio': instance.aspectRatio,
    };
