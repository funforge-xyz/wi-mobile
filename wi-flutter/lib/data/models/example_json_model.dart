import 'package:json_annotation/json_annotation.dart';

part 'example_json_model.g.dart';

@JsonSerializable()
class ExampleJsonModel {
  final int id;
  final String location;
  final String name;
  final String timeZoneId;

  ExampleJsonModel({
    this.id,
    this.location,
    this.name,
    this.timeZoneId,
  });

  factory ExampleJsonModel.fromJson(Map<String, dynamic> json) =>
      _$ExampleJsonModelFromJson(json);
  Map<String, dynamic> toJson() => _$ExampleJsonModelToJson(this);
}
