import 'package:hive/hive.dart';
import 'package:json_annotation/json_annotation.dart';

part 'example_hive_json_model.g.dart';

@JsonSerializable()
@HiveType(typeId: 2)
class ExampleHiveJsonModel {
  @HiveField(0)
  final int id;
  @HiveField(1)
  final String location;
  @HiveField(2)
  final String name;
  @HiveField(3)
  final String timeZoneId;

  ExampleHiveJsonModel({
    this.id,
    this.location,
    this.name,
    this.timeZoneId,
  });

  factory ExampleHiveJsonModel.fromJson(Map<String, dynamic> json) =>
      _$ExampleHiveJsonModelFromJson(json);
  Map<String, dynamic> toJson() => _$ExampleHiveJsonModelToJson(this);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ExampleHiveJsonModel &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
