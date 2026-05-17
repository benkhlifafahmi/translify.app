import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'lumi_mascot.dart';
import 'quest_button.dart';

// ── Tour step machine ─────────────────────────────────────────────────────────

enum TourStep {
  welcome,        // full-screen Lumi card, no spotlight
  readHint,       // spotlight Read tab → button
  chatHint,       // spotlight Chat tab → button switches tab
  chatActive,     // spotlight chat area → requires: user sends a message
  highlightHint,  // spotlight reader area → requires: user creates a highlight
  highlightsDone, // celebration card → button
  quizHint,       // spotlight Quiz tab → button switches tab
  quizActive,     // no overlay (quiz running)
  done,           // caller navigates away
}

class TourController extends ChangeNotifier {
  TourStep _step = TourStep.welcome;
  int quizScore = 0;
  int quizTotal = 0;
  bool chatSent = false; // true after message sent; banner switches to "Next →"

  TourStep get step => _step;

  bool get showsOverlay =>
      _step != TourStep.quizActive && _step != TourStep.done;

  void advance() {
    if (_step.index < TourStep.done.index) {
      _step = TourStep.values[_step.index + 1];
      notifyListeners();
    }
  }

  /// Called when the user sends a chat message. Shows the "Next →" button
  /// instead of auto-advancing, so they can read Lumi's reply first.
  void onChatSent() {
    if (_step == TourStep.chatActive) {
      chatSent = true;
      notifyListeners();
    }
  }

  void onHighlightCreated() {
    if (_step == TourStep.highlightHint) advance();
  }

  void onQuizComplete(int score, int total) {
    if (_step == TourStep.quizActive) {
      quizScore = score;
      quizTotal = total;
      advance();
    }
  }
}

// ── Overlay content (rendered inside OverlayEntry) ────────────────────────────

class TourOverlayContent extends StatelessWidget {
  const TourOverlayContent({
    super.key,
    required this.controller,
    required this.tabKeys,
    required this.onSwitchTab,
    required this.onDone,
    this.onAutoHighlight,
  });

  final TourController controller;

  /// GlobalKeys for each tab button in order [Read, Translate, Chat, Quiz, Garden].
  final List<GlobalKey> tabKeys;
  final ValueChanged<int> onSwitchTab;
  final VoidCallback onDone;

  /// Called when the user taps "Highlight a passage" in the tour.
  /// Programmatically creates a highlight so Samsung's clipboard manager
  /// cannot intercept the native text-selection flow.
  final VoidCallback? onAutoHighlight;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controller,
      builder: (ctx, _) {
        final step = controller.step;
        if (!controller.showsOverlay) return const SizedBox.shrink();

        final spotlight = _spotlightRect(step);
        final cfg = _configFor(step, context);

        return _CoachMarkLayer(
          spotlight: spotlight,
          title: cfg.title,
          body: cfg.body,
          buttonLabel: cfg.buttonLabel,
          waitingHint: cfg.waitingHint,
          onButton: cfg.onButton,
          isFloatingHint: cfg.isFloatingHint,
        );
      },
    );
  }

  // ── Spotlight positioning ───────────────────────────────────────────────────

  Rect? _spotlightRect(TourStep step) {
    switch (step) {
      // readHint: no spotlight — we show the card at the bottom of the
      // reading area so the user can see the actual book behind it.
      case TourStep.chatHint:
        return _keyRect(tabKeys[2]);
      case TourStep.quizHint:
        return _keyRect(tabKeys[3]);
      default:
        return null;
    }
  }

  Rect? _keyRect(GlobalKey key) {
    final box = key.currentContext?.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) return null;
    final offset = box.localToGlobal(Offset.zero);
    return Rect.fromLTWH(offset.dx, offset.dy, box.size.width, box.size.height);
  }

  // ── Step content ────────────────────────────────────────────────────────────

  _StepCfg _configFor(TourStep step, BuildContext context) {
    switch (step) {
      case TourStep.welcome:
        return _StepCfg(
          title: 'Welcome to your book!',
          body: "I'm Lumi — your AI reading companion. Let me show you what I can do.",
          buttonLabel: "Let's go →",
          onButton: controller.advance,
        );

      case TourStep.readHint:
        return _StepCfg(
          title: 'Scroll to read',
          body: 'Scroll down to read through the book. Tap the fullscreen icon (top-right) to expand the reader.',
          buttonLabel: 'Got it →',
          onButton: controller.advance,
        );

      case TourStep.chatHint:
        return _StepCfg(
          title: 'Read as much as you like',
          body: 'When you\'re ready, open chat and ask Lumi anything about this book.',
          buttonLabel: 'Open chat →',
          onButton: () {
            onSwitchTab(2);
            controller.advance();
          },
          isFloatingHint: true,
        );

      case TourStep.chatActive:
        // After the user sends a message, show a "Next →" button so they can
        // read Lumi's reply before the tour moves on.
        if (controller.chatSent) {
          return _StepCfg(
            title: '💬 Lumi replied!',
            body: 'Read the response, then continue when you\'re ready.',
            buttonLabel: 'Continue →',
            onButton: controller.advance,
            isFloatingHint: true,
          );
        }
        return _StepCfg(
          title: 'Send Lumi a message',
          body: 'Try "What is this book about?" — then tap send.',
          waitingHint: 'Waiting for your message…',
          isFloatingHint: true,
        );

      case TourStep.highlightHint:
        // Use a button-triggered highlight instead of native text selection —
        // Samsung's clipboard manager intercepts long-press on SelectionArea,
        // making the custom highlight toolbar unreachable.
        return _StepCfg(
          title: 'Save a highlight',
          body: 'Tap the button below to highlight a key passage from this book.',
          buttonLabel: 'Highlight a passage →',
          onButton: onAutoHighlight,
          isFloatingHint: true,
        );

      case TourStep.highlightsDone:
        return _StepCfg(
          title: '✨ Highlight saved!',
          body: 'All your highlights appear in the Notes section of the Read panel. Now let\'s test what you know.',
          buttonLabel: 'Next →',
          onButton: controller.advance,
        );

      case TourStep.quizHint:
        return _StepCfg(
          title: 'Quick quiz',
          body: 'Three questions generated from this book. Ready?',
          buttonLabel: 'Start quiz →',
          onButton: () {
            onSwitchTab(3);
            controller.advance();
          },
        );

      default:
        return _StepCfg(title: '', body: '');
    }
  }
}

class _StepCfg {
  const _StepCfg({
    required this.title,
    required this.body,
    this.buttonLabel,
    this.waitingHint,
    this.onButton,
    this.isFloatingHint = false,
  });
  final String title;
  final String body;
  final String? buttonLabel;
  final String? waitingHint;
  final VoidCallback? onButton;
  /// When true: renders as a compact top banner with NO scrim so the full UI
  /// stays visible and interactive while waiting for the user to act.
  final bool isFloatingHint;
}

// ── Rendering ─────────────────────────────────────────────────────────────────

class _CoachMarkLayer extends StatelessWidget {
  const _CoachMarkLayer({
    required this.title,
    required this.body,
    this.spotlight,
    this.buttonLabel,
    this.waitingHint,
    this.onButton,
    this.isFloatingHint = false,
  });

  final Rect? spotlight;
  final String title;
  final String body;
  final String? buttonLabel;
  final String? waitingHint;
  final VoidCallback? onButton;
  final bool isFloatingHint;

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    // ── Floating hint mode ─────────────────────────────────────────────────
    // Used for action-required steps (chat, highlight). No scrim so the full
    // UI is visible and usable. Shows a compact banner at the top of the screen.
    if (isFloatingHint) {
      return Align(
        alignment: Alignment.topCenter,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            child: _TooltipCard(
              title: title,
              body: body,
              buttonLabel: buttonLabel,
              waitingHint: waitingHint,
              onButton: onButton,
              compact: true,
            ),
          ),
        ),
      );
    }

    // ── Spotlight / scrim mode ─────────────────────────────────────────────
    final spotlightInflated = spotlight?.inflate(10);

    // Is the spotlight in the bottom third of the screen?
    final tooltipAbove = spotlightInflated != null &&
        spotlightInflated.center.dy > size.height * 0.6;

    Widget tooltip = _TooltipCard(
      title: title,
      body: body,
      buttonLabel: buttonLabel,
      waitingHint: waitingHint,
      onButton: onButton,
    );

    Widget positioned;
    if (spotlightInflated == null) {
      // No spotlight: anchor the card near the bottom of the content area
      // (above the tab bar) so the user can still see the book content behind.
      positioned = Positioned(
        left: 20,
        right: 20,
        bottom: 100,
        child: tooltip,
      );
    } else if (tooltipAbove) {
      // Spotlight at bottom → tooltip floats above it
      positioned = Positioned(
        left: 20,
        right: 20,
        bottom: size.height - spotlightInflated.top + 12,
        child: tooltip,
      );
    } else {
      // Spotlight at top → tooltip floats below it
      positioned = Positioned(
        left: 20,
        right: 20,
        top: spotlightInflated.bottom + 12,
        child: tooltip,
      );
    }

    return Stack(
      children: [
        // Scrim with spotlight hole — IgnorePointer so touches still reach the
        // UI (the user can tap the spotlight target without dismissing the card).
        IgnorePointer(
          child: CustomPaint(
            size: size,
            painter: _SpotlightPainter(spotlightInflated),
          ),
        ),
        positioned,
      ],
    );
  }
}

class _TooltipCard extends StatelessWidget {
  const _TooltipCard({
    required this.title,
    required this.body,
    this.buttonLabel,
    this.waitingHint,
    this.onButton,
    this.compact = false,
  });

  final String title;
  final String body;
  final String? buttonLabel;
  final String? waitingHint;
  final VoidCallback? onButton;
  /// Compact mode: smaller padding, horizontal layout — used for floating hints
  /// that must not obscure the UI behind them.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    if (compact) return _buildCompact();
    return _buildFull();
  }

  Widget _buildFull() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.ink, width: 1.5),
        boxShadow: T.stickerShadow(y: 6),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const LumiMascot(mood: LumiMood.happy, size: 36),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: T.ink,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            body,
            style: const TextStyle(
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w600,
              fontSize: 13.5,
              color: T.inkSoft,
              height: 1.5,
            ),
          ),
          if (buttonLabel != null) ...[
            const SizedBox(height: 14),
            QuestButton(
              label: buttonLabel!,
              iconRight: Icons.arrow_forward_rounded,
              onPressed: onButton ?? () {},
              size: QuestButtonSize.large,
            ),
          ],
          if (waitingHint != null && buttonLabel == null) ...[
            const SizedBox(height: 12),
            _WaitingRow(hint: waitingHint!),
          ],
        ],
      ),
    );
  }

  Widget _buildCompact() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.ink, width: 1.5),
        boxShadow: T.stickerShadow(y: 4),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LumiMascot(
                mood: buttonLabel != null ? LumiMood.happy : LumiMood.thinking,
                size: 28,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                        color: T.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      body,
                      style: const TextStyle(
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                        color: T.inkSoft,
                        height: 1.4,
                      ),
                    ),
                    if (waitingHint != null && buttonLabel == null) ...[
                      const SizedBox(height: 6),
                      _WaitingRow(hint: waitingHint!),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (buttonLabel != null) ...[
            const SizedBox(height: 10),
            QuestButton(
              label: buttonLabel!,
              iconRight: Icons.arrow_forward_rounded,
              onPressed: onButton ?? () {},
              size: QuestButtonSize.large,
            ),
          ],
        ],
      ),
    );
  }
}

class _WaitingRow extends StatelessWidget {
  const _WaitingRow({required this.hint});
  final String hint;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const SizedBox(
          width: 13,
          height: 13,
          child: CircularProgressIndicator(strokeWidth: 2, color: T.saffron),
        ),
        const SizedBox(width: 7),
        Text(
          hint,
          style: const TextStyle(
            fontFamily: 'Nunito',
            fontWeight: FontWeight.w700,
            fontSize: 11.5,
            color: T.inkMuted,
          ),
        ),
      ],
    );
  }
}

// ── Spotlight painter ─────────────────────────────────────────────────────────

class _SpotlightPainter extends CustomPainter {
  const _SpotlightPainter(this.spotlight);
  final Rect? spotlight;

  @override
  void paint(Canvas canvas, Size size) {
    final scrimPaint = Paint()..color = const Color(0xCC0D0D0D);
    final spot = spotlight;

    if (spot == null) {
      canvas.drawRect(Offset.zero & size, scrimPaint);
      return;
    }

    // Draw the dark scrim with a transparent hole cut out via saveLayer + BlendMode.clear.
    canvas.saveLayer(Offset.zero & size, Paint());
    canvas.drawRect(Offset.zero & size, scrimPaint);
    canvas.drawRRect(
      RRect.fromRectAndRadius(spot, const Radius.circular(14)),
      Paint()..blendMode = BlendMode.clear,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(_SpotlightPainter old) => old.spotlight != spotlight;
}
