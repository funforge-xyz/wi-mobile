extension ExceptionExts on Exception {
  /// Returns the exception message without the "Exception: " part.
  String cleanMessage() {
    return this.toString().replaceAll(RegExp(r'\w*Exception\b[:]?[\s]+'), '');
  }
}
