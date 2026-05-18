import 'package:flutter/material.dart';

import '../theme/tokens.dart';

class StickerCard extends StatelessWidget {
  const StickerCard({
    super.key,
    required this.child,
    this.color = T.paper,
    this.tilt = 0.0,
    this.padding = const EdgeInsets.all(20),
    this.radius = T.radiusLg,
    this.borderColor,
    this.onTap,
    this.onLongPress,
  });

  final Widget child;
  final Color color;
  final double tilt; // radians
  final EdgeInsets padding;
  final double radius;
  final Color? borderColor;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: borderColor ?? T.ink, width: 2),
        boxShadow: T.stickerShadow(y: 4),
      ),
      child: child,
    );

    return Transform.rotate(
      angle: tilt,
      child: (onTap == null && onLongPress == null)
          ? card
          : Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onTap,
                onLongPress: onLongPress,
                borderRadius: BorderRadius.circular(radius),
                child: card,
              ),
            ),
    );
  }
}

class Pill extends StatelessWidget {
  const Pill({
    super.key,
    required this.label,
    this.color = T.paper,
    this.foreground = T.ink,
    this.icon,
    this.bordered = true,
  });
  final String label;
  final Color color;
  final Color foreground;
  final IconData? icon;
  final bool bordered;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(T.radiusPill),
        border: bordered ? Border.all(color: T.ink, width: 1.4) : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: foreground),
            const SizedBox(width: 6),
          ],
          Text(
            label,
            style: TextStyle(
              color: foreground,
              fontWeight: FontWeight.w800,
              fontSize: 12,
              letterSpacing: 0.3,
              fontFamily: 'Nunito',
            ),
          ),
        ],
      ),
    );
  }
}
