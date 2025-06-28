// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'example_hive_json_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ExampleHiveJsonModelAdapter extends TypeAdapter<ExampleHiveJsonModel> {
  @override
  final typeId = 2;

  @override
  ExampleHiveJsonModel read(BinaryReader reader) {
    var numOfFields = reader.readByte();
    var fields = <int, dynamic>{
      for (var i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ExampleHiveJsonModel(
      id: fields[0] as int,
      location: fields[1] as String,
      name: fields[2] as String,
      timeZoneId: fields[3] as String,
    );
  }

  @override
  void write(BinaryWriter writer, ExampleHiveJsonModel obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.location)
      ..writeByte(2)
      ..write(obj.name)
      ..writeByte(3)
      ..write(obj.timeZoneId);
  }
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ExampleHiveJsonModel _$ExampleHiveJsonModelFromJson(Map<String, dynamic> json) {
  return ExampleHiveJsonModel(
    id: json['id'] as int,
    location: json['location'] as String,
    name: json['name'] as String,
    timeZoneId: json['timeZoneId'] as String,
  );
}

Map<String, dynamic> _$ExampleHiveJsonModelToJson(
        ExampleHiveJsonModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'location': instance.location,
      'name': instance.name,
      'timeZoneId': instance.timeZoneId,
    };
