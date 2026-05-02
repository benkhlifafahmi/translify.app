import 'package:flutter/material.dart';

import '../theme/tokens.dart';

class QuestInput extends StatelessWidget {
  const QuestInput({
    super.key,
    required this.controller,
    this.label,
    this.hint,
    this.obscure = false,
    this.keyboardType,
    this.autofillHints,
    this.maxLines = 1,
    this.suffix,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String? label;
  final String? hint;
  final bool obscure;
  final TextInputType? keyboardType;
  final Iterable<String>? autofillHints;
  final int? maxLines;
  final Widget? suffix;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null)
          Padding(
            padding: const EdgeInsets.only(left: 6, bottom: 6),
            child: Text(
              label!,
              style: const TextStyle(
                color: T.inkSoft,
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 1.2,
                fontFamily: 'Nunito',
              ),
            ),
          ),
        Container(
          decoration: BoxDecoration(
            color: T.paper,
            borderRadius: BorderRadius.circular(T.radiusMd),
            border: Border.all(color: T.ink, width: 2),
            boxShadow: T.stickerShadow(y: 3),
          ),
          child: TextField(
            controller: controller,
            obscureText: obscure,
            keyboardType: keyboardType,
            autofillHints: autofillHints,
            maxLines: obscure ? 1 : maxLines,
            onSubmitted: onSubmitted,
            style: const TextStyle(
              fontFamily: 'Nunito',
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: T.ink,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w700,
                color: T.inkMuted,
              ),
              suffixIcon: suffix,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                  horizontal: 18, vertical: 14),
            ),
          ),
        ),
      ],
    );
  }
}
