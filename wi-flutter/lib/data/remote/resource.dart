import 'dart:io';

import 'package:wi/exts/exception_exts.dart';

enum ResourceStatus { success, error, loading, empty }

/// A container for error information
class ErrorInfo {
  final Exception exception;
  final StackTrace stackTrace;

  ErrorInfo({
    this.exception,
    this.stackTrace,
  });

  String get message => exception?.cleanMessage();

  bool get isConnectionError => exception is SocketException;
}

/// Represents a resource (usually network) of type [T] which can be in a
/// state one of the following: loading, error, empty, or success.
class Resource<T> {
  const Resource(this.status, this.data, this.error);

  final ResourceStatus status;
  final T data;
  final ErrorInfo error;

  bool isLoading() => status == ResourceStatus.loading;

  bool isEmpty() => status == ResourceStatus.empty;

  bool isError() => status == ResourceStatus.error;

  bool isSuccess() => status == ResourceStatus.success;

  factory Resource.success(T data) {
    return Resource(ResourceStatus.success, data, null);
  }

  factory Resource.error(String error, [T data]) {
    return Resource.exception(Exception(error), data);
  }

  factory Resource.exception(Exception exception, [T data]) {
    return Resource(
      ResourceStatus.error,
      data,
      ErrorInfo(exception: exception),
    );
  }

  factory Resource.exceptionWithStack(
    Exception exception,
    StackTrace stackTrace, [
    T data,
  ]) {
    return Resource(
      ResourceStatus.error,
      data,
      ErrorInfo(exception: exception, stackTrace: stackTrace),
    );
  }

  factory Resource.loading([T data]) {
    return Resource(ResourceStatus.loading, data, null);
  }

  factory Resource.empty() {
    return Resource(ResourceStatus.empty, null, null);
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Resource &&
          runtimeType == other.runtimeType &&
          status == other.status &&
          data == other.data &&
          error == other.error;

  @override
  int get hashCode => status.hashCode ^ data.hashCode ^ error.hashCode;

  /// Transforms the data of this Resource using given [transformer] if
  /// data isn't null, and keeps the status and error information.
  ///
  /// Just do existingResource.transform(() { ... }) and you don't need to
  /// worry about states other than success.
  Resource<NewType> transform<NewType>(NewType transformer(T data)) {
    return Resource<NewType>(
      this.status,
      data == null ? null : transformer(data),
      this.error,
    );
  }
}
