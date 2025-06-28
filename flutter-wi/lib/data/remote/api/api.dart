import 'package:dio/dio.dart';
import 'package:wi/data/auth.dart';
import 'package:wi/data/remote/api/interceptors/auth_interceptor.dart';
import 'package:wi/di.dart';

export 'feed_api.dart';
export 'locations_api.dart';
export 'users_api.dart';

const _kBaseUrl =
    'https://europe-west1-wichat-2684e.cloudfunctions.net/restApiFunction';

class Api {
  final dio = getIt<Dio>();
  final _auth = getIt<Auth>();

  Api() {
    init();
  }

  init() async {
    dio.interceptors.clear();

    dio.options.baseUrl = _kBaseUrl;
    dio.options.responseType = ResponseType.plain;
    await updateAuthHeader();

    dio.interceptors.add(AuthInterceptor(dio: dio, api: this));

    // DEBUG LOG
    if (true) {
      dio.interceptors.add(LogInterceptor(responseBody: true));
    }
  }

  Future updateAuthHeader() async {
    dio.options.headers['Authorization'] = 'Bearer ${await _auth.getIdToken()}';
  }
}
