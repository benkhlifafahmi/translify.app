import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// Chunky button with stacked-paper shadow that depresses on tap.
class QuestButton extends StatefulWidget {
  const QuestButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.color = T.saffron,
    this.foreground = T.ink,
    this.icon,
    this.iconRight,
    this.expand = true,
    this.size = QuestButtonSize.regular,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final Color color;
  final Color foreground;
  final IconData? icon;
  final IconData? iconRight;
  final bool expand;
  final QuestButtonSize size;
  final bool loading;

  @override
  State<QuestButton> createState() => _QuestButtonState();
}

enum QuestButtonSize { small, regular, large }

class _QuestButtonState extends State<QuestButton> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    final disabled = widget.onPressed == null || widget.loading;
    final lift = disabled ? 0.0 : (_down ? 0.0 : 6.0);
    final pad = switch (widget.size) {
      QuestButtonSize.small => const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
      QuestButtonSize.regular => const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      QuestButtonSize.large => const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
    };
    final fontSize = switch (widget.size) {
      QuestButtonSize.small => 14.0,
      QuestButtonSize.regular => 16.0,
      QuestButtonSize.large => 18.0,
    };
    final rect = ClipRRect(
      borderRadius: BorderRadius.circular(T.radiusPill),
      child: GestureDetector(
        onTapDown: (_) => setState(() => _down = true),
        onTapUp: (_) => setState(() => _down = false),
        onTapCancel: () => setState(() => _down = false),
        onTap: disabled ? null : widget.onPressed,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 80),
          curve: Curves.easeOut,
          transform: Matrix4.translationValues(0, -lift, 0),
          padding: pad,
          decoration: BoxDecoration(
            color: disabled ? widget.color.withValues(alpha: 0.5) : widget.color,
            borderRadius: BorderRadius.circular(T.radiusPill),
            border: Border.all(color: T.ink, width: 2),
          ),
          child: Row(
            mainAxisSize: widget.expand ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.icon != null) ...[
                Icon(widget.icon, color: widget.foreground, size: fontSize + 4),
                const SizedBox(width: 8),
              ],
              if (widget.loading)
                SizedBox(
                  width: fontSize + 2,
                  height: fontSize + 2,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.4,
                    color: widget.foreground,
                  ),
                )
              else
                Text(
                  widget.label,
                  style: TextStyle(
                    color: widget.foreground,
                    fontSize: fontSize,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                    fontFamily: 'Nunito',
                  ),
                ),
              if (widget.iconRight != null) ...[
                const SizedBox(width: 8),
                Icon(widget.iconRight, color: widget.foreground, size: fontSize + 4),
              ],
            ],
          ),
        ),
      ),
    );

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(T.radiusPill),
        boxShadow: disabled ? null : T.stickerShadow(y: 4),
      ),
      child: rect,
    );
  }
}
