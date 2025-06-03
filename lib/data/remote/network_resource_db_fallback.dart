import 'dart:developer';

import 'package:flutter/foundation.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/exts/all.dart';

typedef Stream<Resource<T>> NetworkResourceDbFallbackRequest<T>();
typedef bool NetworkResourceDbFallbackExistsInDb();
typedef bool NetworkResourceDbFallbackShouldFetchPredicate();
typedef T NetworkResourceDbFallbackGetter<T>();

/// Makes a given network [request] and saves it to a database with [saveToDb]
/// if successful. If unsuccessful, it returns data from db using [getFromDb].
/// If db doesn't contain the data either, then it returns the error.
class NetworkResourceDbFallback<T> {
  final NetworkResourceDbFallbackRequest<T> request;
  final Function(T data) saveToDb;
  final NetworkResourceDbFallbackExistsInDb existsInDb;
  final NetworkResourceDbFallbackGetter<T> getFromDb;
  final NetworkResourceDbFallbackShouldFetchPredicate shouldFetch;
  final bool preferDb;

  NetworkResourceDbFallback({
    @required this.request,
    @required this.saveToDb,
    @required this.existsInDb,
    @required this.getFromDb,
    this.shouldFetch,
    this.preferDb = false,
  });

  int timestamp() => DateTime.now().millisecondsSinceEpoch;

  Stream<Resource<T>> load() async* {
    if (shouldFetch?.call() ?? true) {
      if (preferDb && existsInDb()) {
        yield Resource.success(getFromDb());
        return;
      }
      final stream = request();

      await for (var value in stream) {
        if (value.isSuccess()) {
          saveToDb(value.data);
          yield value;
        } else if (value.isError()) {
          if (existsInDb()) {
            yield Resource.success(getFromDb());
          } else {
            yield value;
          }
        }
      }
    } else {
      // Fake delay to make it look like a real request happened.
      await Future.delayed(400.milliseconds);
      if (existsInDb()) {
        yield Resource.success(getFromDb());
      } else {
        yield Resource.error(null);
      }
    }
  }
}
