import 'package:flutter/widgets.dart';

mixin InfiniteLoaderMixin {
  final infiniteScrollController = ScrollController();

  _load(Future<bool> loader(), ScrollController controller) async {
    final loaded = await loader();
    if (loaded) {
      controller?.animateTo(
        controller.position.pixels + 100,
        duration: Duration(milliseconds: 600),
        curve: Curves.easeOut,
      );
    }
  }

  initInfiniteLoad(
    Future<bool> loader(), [
    ScrollController controllerOverride,
  ]) {
    final controller = controllerOverride ?? infiniteScrollController;
    double lastPosition = 0;
    controller.addListener(() {
      final position = controller.position;
      final diff = (lastPosition - position.pixels).abs();
      if (diff < 200) return;
      lastPosition = position.pixels;
      if (position.pixels > position.maxScrollExtent - 200) {
        _load(loader, controller);
      }
    });
  }
}
