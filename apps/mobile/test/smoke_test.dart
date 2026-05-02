import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:translify/theme/tokens.dart';
import 'package:translify/widgets/owl_mascot.dart';
import 'package:translify/widgets/quest_button.dart';
import 'package:translify/widgets/sticker_card.dart';

void main() {
  testWidgets('OwlMascot renders', (tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: buildTheme(),
      home: const Scaffold(body: Center(child: OwlMascot())),
    ));
    expect(find.byType(OwlMascot), findsOneWidget);
  });

  testWidgets('QuestButton fires onPressed', (tester) async {
    var taps = 0;
    await tester.pumpWidget(MaterialApp(
      theme: buildTheme(),
      home: Scaffold(
        body: Center(
          child: QuestButton(
            label: 'Go',
            expand: false,
            onPressed: () => taps++,
          ),
        ),
      ),
    ));
    await tester.tap(find.text('Go'));
    await tester.pump();
    expect(taps, 1);
  });

  testWidgets('StickerCard wraps a child', (tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: buildTheme(),
      home: const Scaffold(
        body: Center(child: StickerCard(child: Text('hello'))),
      ),
    ));
    expect(find.text('hello'), findsOneWidget);
  });
}
