class UnexpectedResponseException implements Exception {
  UnexpectedResponseException(this.message);

  String message;

  @override
  String toString() => '${this.runtimeType}: ${message ?? '?'}';
}