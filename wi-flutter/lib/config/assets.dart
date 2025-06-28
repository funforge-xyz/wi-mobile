class A {
  static icon(String name, [String extension = 'svg']) =>
      'assets/icons/$name.$extension';

  static image(String name, [String extension = 'png']) =>
      'assets/images/$name.$extension';
}
