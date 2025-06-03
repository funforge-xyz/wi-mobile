import 'package:flutter/material.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/exts/all.dart';

class CounterBadge extends StatelessWidget {
  final int count;
  CounterBadge(this.count);

  @override
  Widget build(BuildContext context) {
    final colorSet = ColorSet.of(context);
    return TweenAnimationBuilder<double>(
      tween: count > 0 ? 0.0.tweenTo(1.0) : 1.0.tweenTo(0.0),
      curve: Curves.bounceOut,
      duration: 400.milliseconds,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: child,
        );
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(100),
          color: colorSet.background,
        ),
        child: Padding(
          padding: const EdgeInsets.all(2),
          child: Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: colorSet.primary,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Padding(
              padding: const EdgeInsets.all(2),
              child: Center(
                child: count < 100
                    ? FittedBox(
                        fit: BoxFit.contain,
                        child: Text(
                          '$count',
                          style: TextStyle(
                            fontSize: 12,
                            color: colorSet.textOnPrimary,
                          ),
                        ),
                      )
                    : Padding(
                        padding: const EdgeInsets.only(bottom: 1),
                        child: Text(
                          '⬤',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 6,
                            color: colorSet.textOnPrimary,
                          ),
                        ),
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
