extension DynamicExts<T> on T {
  void use(Function(T) doStuff) {
    if (this != null) doStuff(this);
  }

  T or(T value) => this ?? value;
}
