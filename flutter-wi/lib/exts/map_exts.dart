extension ListMapExts<K, V> on Map<K, List<V>> {
  /// Adds given [value] to the list in this map at [key]. If the list hasn't
  /// been created, it creates one and then adds.
  void addToList(key, value) {
    if (this[key] == null) this[key] = <V>[];
    this[key].add(value);
  }
}
