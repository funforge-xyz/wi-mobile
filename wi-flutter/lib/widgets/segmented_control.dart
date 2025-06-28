import 'package:flutter/material.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/custom_card.dart';

typedef String LabelProvider<T>(BuildContext context, T item, bool isSelected);

class SegmentedControl<T> extends StatelessWidget {
  final List<T> items;
  final ValueChanged<T> onValueChanged;
  final T value;
  final Widget divider;
  final LabelProvider labelProvider;

  SegmentedControl({
    @required this.items,
    @required this.onValueChanged,
    @required this.value,
    @required this.labelProvider,
    this.divider,
  })  : assert(items != null),
        assert(onValueChanged != null),
        assert(labelProvider != null),
        assert(value != null);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return CustomCard(
      child: Row(
        children: items
            .map((item) {
              final selected = value == item;
              final index = items.indexOf(item);
              final isFirst = index == 0;
              final isLast = index == items.length - 1;
              final radius = Radius.circular(12);
              return Flexible(
                flex: 1,
                child: InkWell(
                  onTap: () => onValueChanged(item),
                  borderRadius: BorderRadius.only(
                    bottomLeft: isFirst ? radius : Radius.zero,
                    topLeft: isFirst ? radius : Radius.zero,
                    bottomRight: isLast ? radius : Radius.zero,
                    topRight: isLast ? radius : Radius.zero,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Center(
                      child: Text(
                        labelProvider(context, item, selected),
                        style: TextStyle(
                          fontSize: 16,
                          color: selected
                              ? null
                              : theme.textTheme.bodyText1.color
                                  .withOpacity(0.3),
                          fontWeight:
                              selected ? FontWeight.w500 : FontWeight.w400,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            })
            .toList()
            .withDividers(Container(
              height: 40,
              width: 1,
              color: theme.dividerColor,
            )),
      ),
    );
  }
}
