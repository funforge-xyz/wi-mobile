import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/utils/exceptions/service_unavailable_exception.dart';
import 'package:wi/utils/exceptions/service_unresponsive_exception.dart';

typedef T ResponseParseFunction<T>(dynamic json);

enum HttpMethod { GET, POST, PUT, DELETE, PATCH }

class ApiCall<T> {
  final Dio dio;

  ApiCall._(this.dio);

  factory ApiCall.using(Dio dio) => ApiCall._(dio);

  HttpMethod _method;
  String _endpoint;
  Map<String, dynamic> _params = {};
  Map<String, String> _headers = {};
  Map<String, dynamic> _body = {};
  ResponseParseFunction<T> _parseFunction;

  ApiCall<T> get(String endpoint) {
    _method = HttpMethod.GET;
    _endpoint = endpoint;
    return this;
  }

  ApiCall<T> post(String endpoint) {
    _method = HttpMethod.POST;
    _endpoint = endpoint;
    return this;
  }

  ApiCall<T> put(String endpoint) {
    _method = HttpMethod.PUT;
    _endpoint = endpoint;
    return this;
  }

  ApiCall<T> patch(String endpoint) {
    _method = HttpMethod.PATCH;
    _endpoint = endpoint;
    return this;
  }

  ApiCall<T> delete(String endpoint) {
    _method = HttpMethod.DELETE;
    _endpoint = endpoint;
    return this;
  }

  ApiCall<T> params(Map<String, dynamic> params) {
    _params = params;
    _params.removeWhere((key, value) => value == null);
    return this;
  }

  ApiCall<T> headers(Map<String, String> headers) {
    _headers = headers;
    _headers.removeWhere((key, value) => value == null);
    return this;
  }

  ApiCall<T> body(Map<String, dynamic> body) {
    _body = body;
    _body.removeWhere((key, value) => value == null);
    return this;
  }

  ApiCall<T> parseWith(ResponseParseFunction parseFunction) {
    _parseFunction = parseFunction;
    return this;
  }

  Future<Resource<T>> execute({bool allowEmptyResponseBody = false}) async {
    Response response;

    final options = Options(
      headers: _headers,
    );

    try {
      switch (_method) {
        case HttpMethod.GET:
          response = await dio.get(
            _endpoint,
            options: options,
            queryParameters: _params,
          );
          break;
        case HttpMethod.POST:
          response = await dio.post(
            _endpoint,
            options: options,
            data: _body,
            queryParameters: _params,
          );
          break;
        case HttpMethod.PUT:
          response = await dio.put(
            _endpoint,
            options: options,
            data: _body,
            queryParameters: _params,
          );
          break;
        case HttpMethod.DELETE:
          response = await dio.delete(
            _endpoint,
            options: options,
            queryParameters: _params,
          );
          break;
        case HttpMethod.PATCH:
          response = await dio.patch(
            _endpoint,
            options: options,
            data: _body,
            queryParameters: _params,
          );
          break;
      }
    } catch (e, s) {
      if (e is DioError) {
        if (e.response?.data == null) {
          return Resource<T>.exceptionWithStack(Exception(e.error), s);
        }

        response ??= e.response;
      } else {
        return Resource<T>.exceptionWithStack(e, s);
      }
    }

    dynamic jsonBodyResponse;

    if (response.data?.isNotEmpty == true) {
      try {
        jsonBodyResponse = await compute(_parseJson, response.data);
      } catch (e, s) {
        print(e.toString());
        return Resource<T>.exceptionWithStack(e, s);
      }
    }

    var responseException = allowEmptyResponseBody
        ? null
        : _checkForKnownErrors(response, jsonBodyResponse);

    if (response.statusCode != 200 && jsonBodyResponse != null) {
      if (jsonBodyResponse is String) {
        responseException = Exception(jsonBodyResponse);
      } else {
        responseException = Exception(
          jsonBodyResponse['message'] ??
              jsonBodyResponse['content'] ??
              jsonBodyResponse['data'] ??
              '?',
        );
      }
    }
    if (responseException != null) {
      return Resource<T>.exception(responseException);
    } else {
      T finalResponse = _parseFunction(jsonBodyResponse);
      if (!allowEmptyResponseBody &&
          (finalResponse == null ||
              (finalResponse is List && finalResponse.isEmpty))) {
        return Resource<T>.empty();
      }
      return Resource<T>.success(finalResponse);
    }
  }

  _checkForKnownErrors(Response r, dynamic jsonResponse) {
    if (r?.data == null) {
      return ServiceUnavailableException('Response body was null.');
    } else if (r.data.isEmpty) {
      return ServiceUnavailableException('Response body was empty.');
    } else if (jsonResponse == null) {
      return ServiceUnresponsiveException('JSON response was null.');
    }
  }
}

/// Global function to pass to [compute] to parse JSON in an isolate.
dynamic _parseJson(dynamic data) {
  return json.decode(data);
}
