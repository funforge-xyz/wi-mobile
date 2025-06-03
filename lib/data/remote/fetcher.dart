import 'dart:async';

import 'package:rxdart/rxdart.dart';
import 'package:wi/data/remote/resource.dart';

typedef T FetcherDataLoader<T>();
typedef T PaginatedFetcherDataLoader<T, C>(C cursor);
typedef CursorType PaginatedFetcherCursorProvider<DataType, CursorType>(
    DataType cursor);

abstract class Fetcher<InputType, DataType> {
  Fetcher<InputType, DataType> use(FetcherDataLoader<InputType> loader);
  Fetcher<InputType, DataType> reloadOn(List<Stream> dependencies);
  Future load([bool silent = false]);
  dispose();
}

abstract class ListenableFetcher<InputType, DataType>
    extends Fetcher<InputType, DataType> {
  doOnChange(Function(Resource<DataType>) function, {bool once});
  doOnSuccess(Function(Resource<DataType>) function, {bool once});
  doOnError(Function(Resource<DataType>) function, {bool once});
  doOnEmpty(Function(Resource<DataType>) function, {bool once});
  doOnLoading(Function(Resource<DataType>) function, {bool once});
}

abstract class PaginatingFetcher<InputType, DataType, CursorType>
    extends Fetcher<InputType, DataType> {
  Future loadNext();
  PaginatingFetcher<InputType, DataType, CursorType> usePagination(
    PaginatedFetcherDataLoader<InputType, CursorType> loader,
    PaginatedFetcherCursorProvider<DataType, CursorType> cursorProvider,
  );
}

abstract class BaseFetcher<InputType, DataType>
    implements ListenableFetcher<InputType, DataType> {
  FetcherDataLoader<InputType> loader;

  BaseFetcher([this.loader]);

  final _controller = BehaviorSubject<Resource<DataType>>();
  StreamSubscription _dependenciesSubscription;
  final _subscribers = <StreamSubscription>[];

  dispose() {
    _controller.close();
  }

  Stream<Resource<DataType>> get stream => _controller.stream;

  @override
  Fetcher<InputType, DataType> use(FetcherDataLoader<InputType> loader) {
    this.loader = loader;
    return this;
  }

  @override
  Fetcher<InputType, DataType> reloadOn(List<Stream> dependencies) {
    if (dependencies == null || dependencies.isEmpty) return this;
    final distincDependencies = dependencies.map((stream) => stream.distinct());
    _dependenciesSubscription?.cancel(); // Cancel previous ones if any.
    _dependenciesSubscription = Rx.combineLatestList(distincDependencies)
        .distinct()
        .listen((_) => load());
    return this;
  }

  _emit(Resource<DataType> event) {
    if (_controller.isClosed) return;
    _controller.sink.add(event);
  }

  @override
  Future load([bool silent = false]);

  /// Executes [function] [once] or more depending on whether the value returned
  /// by [shouldDoFor] is true or not.
  _doIf(Function(Resource) shouldDoFor, Function function, bool once) {
    StreamSubscription subscription;
    subscription = _controller.listen((value) {
      if (shouldDoFor(value)) {
        function?.call(value);
        if (once == true) {
          subscription.cancel();
        }
      }
      if (once != true) {
        _subscribers.add(subscription);
      }
    });
  }

  @override
  doOnChange(Function(Resource<DataType>) function, {bool once = false}) =>
      _doIf((it) => true, function, once);

  @override
  doOnSuccess(Function(Resource<DataType>) function, {bool once}) =>
      _doIf((res) => res.isSuccess(), function, once);

  @override
  doOnError(Function(Resource<DataType>) function, {bool once}) =>
      _doIf((it) => it.isError(), function, once);

  @override
  doOnEmpty(Function(Resource<DataType>) function, {bool once}) =>
      _doIf((it) => it.isEmpty(), function, once);

  @override
  doOnLoading(Function(Resource<DataType>) function, {bool once}) =>
      _doIf((it) => it.isLoading(), function, once);
}

class FutureFetcher<DataType> extends BaseFetcher<Future<DataType>, DataType> {
  @override
  Future load([bool silent = false]) async {
    if (!silent) _emit(Resource<DataType>.loading());
    try {
      final res = await loader();
      if (res is List && res.isEmpty) {
        _emit(Resource<DataType>.empty());
      } else {
        _emit(Resource<DataType>.success(res));
      }
    } catch (e, stack) {
      _emit(
        Resource<DataType>.exceptionWithStack(
          e is Exception ? e : Exception(e?.toString()),
          stack,
        ),
      );
      print(e);
      print(stack);
    }
  }
}

class ResourceFutureFetcher<DataType>
    extends BaseFetcher<Future<Resource<DataType>>, DataType> {
  @override
  Future load([bool silent = false]) async {
    if (!silent) _emit(Resource<DataType>.loading());
    _emit(await loader());
  }
}

class StreamFetcher<DataType> extends BaseFetcher<Stream<DataType>, DataType> {
  @override
  Future load([bool silent = false]) async {
    if (!silent) _emit(Resource<DataType>.loading());
    try {
      final res = loader();
      await for (final event in res) {
        if (event is List && event.isEmpty) {
          _emit(Resource<DataType>.empty());
        } else {
          _emit(Resource<DataType>.success(event));
        }
      }
    } catch (e, stack) {
      _emit(
        Resource<DataType>.exceptionWithStack(
          e is Exception ? e : Exception(e?.toString()),
          stack,
        ),
      );
      print(e);
      print(stack);
    }
  }
}

class PaginatingStreamFetcher<DataType, CursorType>
    extends BaseFetcher<Stream<DataType>, DataType>
    implements PaginatingFetcher<Stream<DataType>, DataType, CursorType> {
  PaginatedFetcherDataLoader<Stream<DataType>, CursorType> _paginatedLoader;
  PaginatedFetcherCursorProvider<DataType, CursorType> _cursorProvider;

  CursorType _cursor;

  @override
  Fetcher<Stream<DataType>, DataType> use(
      FetcherDataLoader<Stream<DataType>> loader) {
    throw UnsupportedError('$use is not supported in $PaginatingStreamFetcher. '
        'Please use $usePagination instead.');
  }

  @override
  PaginatingFetcher<Stream<DataType>, DataType, CursorType> usePagination(
    PaginatedFetcherDataLoader<Stream<DataType>, CursorType> loader,
    PaginatedFetcherCursorProvider<DataType, CursorType> cursorProvider,
  ) {
    _paginatedLoader = loader;
    _cursorProvider = cursorProvider;
    return this;
  }

  _updateCursor(DataType data) {
    _cursor = _cursorProvider(data);
  }

  Stream<Resource<DataType>> _load() async* {
    try {
      final res = _paginatedLoader(_cursor);
      await for (final event in res) {
        if (event is List && event.isEmpty) {
          yield Resource<DataType>.empty();
        } else {
          yield Resource<DataType>.success(event);
        }
      }
    } catch (e, stack) {
      print(e);
      print(stack);
      yield Resource<DataType>.exceptionWithStack(
        e is Exception ? e : Exception(e?.toString()),
        stack,
      );
    }
  }

  @override
  Future load([bool silent = false]) async {
    if (!silent) _emit(Resource<DataType>.loading());
    final res = _load();
    await for (final event in res) {
      _emit(event);
      if (event.isSuccess()) {
        _updateCursor(event.data);
      }
    }
  }

  @override
  Future loadNext() async {
    final isListType = '$DataType'.contains('List<');
    if (!isListType) return;
    final data = _controller.value;
    final res = _load();
    await for (final event in res) {
      if (event.isSuccess()) {
        final combinedData =
            ((data.data as List) + (event.data as List)) as DataType;
        _emit(Resource<DataType>.success(combinedData));
        _updateCursor(combinedData);
      } else if (event.isEmpty() && _cursor != null) {
        // Reached end.
        _emit(Resource<DataType>.success(data.data));
      } else {
        _emit(event);
      }
    }
  }
}

class ResourceStreamFetcher<DataType>
    extends BaseFetcher<Stream<Resource<DataType>>, DataType> {
  @override
  Future load([bool silent = false]) async {
    if (!silent) _emit(Resource<DataType>.loading());
    final res = loader();
    await for (final event in res) {
      _emit(event);
    }
  }
}
