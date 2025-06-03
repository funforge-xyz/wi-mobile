import 'package:cloud_firestore/cloud_firestore.dart';

class TimestampSerializer {
  static Timestamp deserialize(dynamic data) => data as Timestamp;
  static Timestamp serialize(Timestamp timestamp) => timestamp;
}
