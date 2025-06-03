/// Simple class to log messages, errors and exceptions to the console.
class Logger {
  Logger._();

  static void log(String message) {
    print('${DateTime.now()} :: $message');
  }

  static void logError(String message) {
    // TODO: log to Crashlytics
    log('[ERROR] $message');
  }

  static void logException(dynamic exception, StackTrace stackTrace) {
    // TODO: log to Crashlytics
    log('$exception\n$stackTrace');
  }
}
