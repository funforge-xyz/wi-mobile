// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'posts.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PostsAdapter extends TypeAdapter<Posts> {
  @override
  final int typeId = 0;

  @override
  Posts read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Posts(
      data: (fields[0] as List)?.cast<PostInfo>(),
    );
  }

  @override
  void write(BinaryWriter writer, Posts obj) {
    writer
      ..writeByte(1)
      ..writeByte(0)
      ..write(obj.data);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PostsAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class PostInfoAdapter extends TypeAdapter<PostInfo> {
  @override
  final int typeId = 1;

  @override
  PostInfo read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PostInfo(
      id: fields[0] as String,
      createdAt: fields[1] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, PostInfo obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.createdAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PostInfoAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Posts _$PostsFromJson(Map json) {
  return Posts(
    data: (json['resultList'] as List)
        ?.map((e) => e == null
            ? null
            : PostInfo.fromJson((e as Map)?.map(
                (k, e) => MapEntry(k as String, e),
              )))
        ?.toList(),
  );
}

Map<String, dynamic> _$PostsToJson(Posts instance) => <String, dynamic>{
      'resultList': instance.data?.map((e) => e?.toJson())?.toList(),
    };

PostInfo _$PostInfoFromJson(Map json) {
  return PostInfo(
    id: json['externalPostId'] as String,
    createdAt: json['createdAt'] == null
        ? null
        : DateTime.parse(json['createdAt'] as String),
  );
}

Map<String, dynamic> _$PostInfoToJson(PostInfo instance) => <String, dynamic>{
      'externalPostId': instance.id,
      'createdAt': instance.createdAt?.toIso8601String(),
    };
