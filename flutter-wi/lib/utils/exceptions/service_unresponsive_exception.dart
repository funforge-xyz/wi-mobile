class ServiceUnresponsiveException implements Exception {
  ServiceUnresponsiveException(this.message);

  String message;

  @override
  String toString() => '${this.runtimeType}: ${message ?? '?'}';
}
