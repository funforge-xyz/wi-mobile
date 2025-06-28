class A {
  static String icon(String name, [String extension = 'svg']) =>
      'assets/icons/$name.$extension';

  static String image(String name, [String extension = 'png']) =>
      'assets/images/$name.$extension';
}
