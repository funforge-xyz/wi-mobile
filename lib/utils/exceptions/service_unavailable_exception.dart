class ServiceUnavailableException implements Exception {
  ServiceUnavailableException(this.message);

  String message;

  @override
  String toString() => '${this.runtimeType}: ${message ?? '?'}';
}
