import 'package:flutter/widgets.dart';

extension WidgetListExts on List<Widget> {
  List<Widget> withDividers(Widget divider) {
    if (this == null) return null;
    if (this.isEmpty) return [];
    final result = <Widget>[];
    this.forEach((item) {
      result.add(item);
      result.add(divider);
    });
    result.removeLast();
    return result;
  }
}

extension IterableExts<T> on Iterable<T>{

  bool get isNullOrEmpty => this == null || this.isEmpty;
  bool get isNotNullOrEmpty => this != null && this.isNotEmpty;
  Iterable<T> orEmpty() => this ?? <T>[];
  T get firstOrNull => this.isNotNullOrEmpty ? this.first : null;
  T find(bool test(T)) {
    if (this.isNullOrEmpty) return null;
    return this.firstWhere(test, orElse: () => null);
  }
}