import 'dart:async';

import 'package:wi/data/remote/resource.dart';
import 'package:wi/widgets/resource_stream_builder.dart';
import 'package:flutter/foundation.dart';
import 'package:rxdart/rxdart.dart';

typedef Future<T> FutureProvider<T>();

/// Takes in a [Future] which returns a [Resource] and provides a [Stream] through
/// which it emits every change in [Resource] status.
///
/// This stream can be then plugged into a [StreamBuilder]. Specifically, into
/// [ResourceStreamBuilder], to effortlessly build UI with states for loading, error,
/// empty, and content. See [ResourceStreamBuilder] for more info.
class Fetcher<T> {
  FutureProvider<Resource<T>> _future;

  Fetcher();

  factory Fetcher.using(
    FutureProvider<Resource<T>> future, {
    bool silent = false,
    List<Stream> dependencies,
  }) {
    final fetcher = Fetcher();
    fetcher.use(future, dependencies: dependencies);
    return fetcher;
  }

  final _dataController = BehaviorSubject<Resource<T>>();

  Stream<Resource<T>> get data => _dataController.stream;

  final _subscriptions = <StreamSubscription>[];

  _emit(Resource<T> resource) {
    _dataController.sink.add(resource);
  }

  /// Loads [future] reult and emits relevant progress events such as loading,
  /// error, success, and empty.
  _load([bool silent = false]) async {
    if (!silent) {
      _emit(Resource.loading());
    }

    Resource<T> response;
    try {
      response = await _future();
      if (response != null) {
        _emit(response);
      } else {
        _emit(Resource.error('Unknown error'));
      }
    } catch (error, stack) {
      print('$error - $stack');
      if (error is Error) throw error; // Throw if developer error
      _emit(Resource.exceptionWithStack(error, stack));
    }
  }

  load({bool silent = false}) => _load(silent);

  /// Gives [Fetcher] a [FutureProvider] to work with and optionally
  /// some strems to listen to so that it can reload for you when needed.
  Fetcher<T> use(
    FutureProvider<Resource<T>> future, {
    List<Stream> dependencies,
  }) {
    _future = future;

    if (dependencies?.isNotEmpty == true) {
      final distincDependencies =
          dependencies.map((stream) => stream.distinct());
      Rx.combineLatestList(distincDependencies)
          .distinct()
          .listen((_) => load());
    }

    return this;
  }

  /// Executes [function] [once] or more depending on whether the value returned
  /// by [shouldDoFor] is true or not.
  _doOn(Function(Resource) shouldDoFor, Function function, bool once) {
    StreamSubscription subscription;
    subscription = _dataController.listen((value) {
      if (shouldDoFor(value)) {
        function?.call(value);
        if (once == true) {
          subscription.cancel();
        }
      }
      if (once != true) {
        _subscriptions.add(subscription);
      }
    });
  }

  doOnChange(Function function, {bool once = false}) =>
      _doOn((_) => true, function, once);

  doOnSuccess(Function(Resource<T>) function, {bool once}) =>
      _doOn((res) => res.isSuccess(), function, once);

  doOnError(Function(Resource<T>) function, {bool once}) =>
      _doOn((_) => _.isError(), function, once);

  doOnEmpty(Function(Resource<T>) function, {bool once}) =>
      _doOn((_) => _.isEmpty(), function, once);

  doOnLoading(Function(Resource<T>) function, {bool once}) =>
      _doOn((_) => _.isLoading(), function, once);

  /// Closes the data stream controller.
  dispose() {
    _dataController.close();
    _subscriptions.forEach((sub) => sub.cancel());
  }
}

/// Extension methods to easily set ValueNotifier value to new
/// emissions in this [Fetcher]'s data stream.
extension ValueNotifierExt on Fetcher {
  pipeIntoValueNotifier(ValueNotifier<Resource> valueNotifier) {
    this.data.listen((event) => valueNotifier.value = event);
  }
}
