import 'package:synchronized/extension.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:wi/data/remote/api/api.dart';

const _kHandledErrorCodes = [401, 403];

/// Intercepts HTTP communication to catch 401 or 403 errors (most likely
/// expired access token), freezez all communication, re-authenticates, retries
/// the original request, then returns the response.
class AuthInterceptor extends InterceptorsWrapper {
  final Dio dio;
  final Api api;

  static DateTime _lastReauth = DateTime.fromMicrosecondsSinceEpoch(0);
  static int _retries = 0;

  AuthInterceptor({
    @required this.dio,
    @required this.api,
  })  : assert(dio != null),
        assert(api != null);

  @override
  Future onResponse(Response response) async {
    if (response?.statusCode == 200) {
      // Reset retry counter if there was a successful request.
      _retries = 0;
    }
    super.onResponse(response);
  }

  @override
  Future onError(DioError error) async {
    print(error);

    // Ignore all other errors.
    if (!_kHandledErrorCodes.contains(error.response?.statusCode)) {
      return super.onError(error);
    }

    print('Caught expired token. Blocking all traffic.');

    // Block all traffic while we check and maybe reauth.
    dio.lock();

    print('Obtaining new token.');

    await synchronized(_reauth);

    print('Done. Unblocking traffic.');

    // Don't forget to unblock traffic.
    dio.unlock();

    print('Done. Retrying failed request.');

    // If we tried 2 times and failed, there's probably another issue, so stop
    // spamming requests.
    if (_retries++ >= 2) {
      // Reset so the mechanism works next time the interceptor is triggered.
      _retries = 0;
      return;
    }

    // Make the original call and return the result as response
    final request = error.request;
    request.headers['Authorization'] = dio.options.headers['Authorization'];
    return dio.request(
      request.path,
      cancelToken: request.cancelToken,
      data: request.data,
      onReceiveProgress: request.onReceiveProgress,
      onSendProgress: request.onSendProgress,
      options: request,
      queryParameters: request.queryParameters,
    );
  }

  Future<bool> _reauth() async {
    // Block duplicate requests by checking if the last reauth was less than a second ago.
    if (DateTime.now().difference(_lastReauth).inSeconds < 1) {
      return true;
    }
    await api.updateAuthHeader();
    return true;
  }
}
