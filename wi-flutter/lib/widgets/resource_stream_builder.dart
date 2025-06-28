import 'package:flutter/material.dart';
import 'package:sup/sup.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/di.dart';
import 'package:wi/widgets/common_progress_indicator.dart';
import 'package:wi/widgets/error_configs.dart';

class ResourceStreamBuilder<T> extends StatelessWidget {
  final Stream<Resource<T>> stream;
  final WidgetBuilder loadingBuilder;
  final Function(BuildContext context, ErrorInfo error) errorBuilder;
  final WidgetBuilder emptyBuilder;
  final Function(BuildContext context, T data) contentBuilder;
  final Function onRetry;
  final Resource<T> initialData;

  ResourceStreamBuilder({
    @required this.stream,
    this.loadingBuilder,
    this.errorBuilder,
    this.emptyBuilder,
    @required this.contentBuilder,
    this.onRetry,
    this.initialData,
  }) : assert(stream != null);

  @override
  Widget build(BuildContext context) {
    final initialData = this.initialData ?? Resource<T>.loading();
    return StreamBuilder<Resource<T>>(
      stream: stream.distinct(),
      initialData: initialData,
      builder: (context, snapshot) {
        final res = snapshot.data;
        if (snapshot.hasError) {
          final error = snapshot.error;
          if (error is Exception) {
            return errorBuilder(context, ErrorInfo(exception: error));
          } else {
            throw error;
          }
        }
        if (snapshot.hasData) {
          if (res.isLoading()) {
            return buildLoading(context);
          } else if (res.isEmpty()) {
            return buildEmpty(context);
          } else if (res.isError()) {
            return buildError(context, res.error);
          } else if (res.data != null) {
            return buildContent(context, res.data);
          } else {
            return Container();
          }
        }
        return Container();
      },
    );
  }

  Widget buildLoading(BuildContext context) {
    if (loadingBuilder != null) {
      return loadingBuilder(context);
    } else {
      return Center(child: CommonProgressIndicator());
    }
  }

  Widget buildError(BuildContext context, ErrorInfo error) {
    if (errorBuilder != null) {
      return errorBuilder(context, error);
    } else {
      return Center(
        child: Sup.from(
          ErrorConfigs.error(error, onRetry: onRetry),
        ),
      );
    }
  }

  Widget buildEmpty(BuildContext context) {
    if (emptyBuilder != null) {
      return emptyBuilder(context);
    } else {
      return Center(
        child: QuickSup.empty(
          subtitle: strings().errorCommonNoItems,
        ),
      );
    }
  }

  Widget buildContent(BuildContext context, T data) {
    return contentBuilder(context, data);
  }
}
