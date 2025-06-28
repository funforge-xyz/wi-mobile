/// A class that can be used as list item to inform users of whether a given
/// item should be rendered as an ad or a normal list item. Used, for example,
/// in Chats Page where we display ads between threads.
class AdSupportedListItem<T> {
  final bool isAd;
  final T item;
  AdSupportedListItem(this.isAd, this.item);
}
