import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../state/progress.dart';
import '../../state/session.dart';
import '../../theme/tokens.dart';
import '../../widgets/lumi_mascot.dart';
import '../../widgets/quest_button.dart';

class ChatPanel extends StatefulWidget {
  const ChatPanel({super.key, required this.bookId, this.translationId, this.onTourMessageSent});
  final String bookId;
  final String? translationId;
  final VoidCallback? onTourMessageSent;
  @override
  State<ChatPanel> createState() => _ChatPanelState();
}

class _ChatPanelState extends State<ChatPanel> {
  Chat? _chat;
  List<ChatMessage> _messages = [];
  final _input = TextEditingController();
  final _scroll = ScrollController();
  bool _sending = false;
  bool _booting = true;
  String? _error;

  static const _starters = [
    'Summarize this book in 3 sentences',
    "What's the main idea so far?",
    'Quiz me on this chapter',
    'Explain page 12 like I\'m 10',
  ];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    final session = context.read<Session>();
    try {
      final chats = await session.chats.list(widget.bookId);
      _chat = chats.isNotEmpty ? chats.first : await session.chats.create(widget.bookId);
      _messages = await session.chats.messages(_chat!.id);
    } catch (e) {
      _error = describeError(e);
    }
    if (!mounted) return;
    setState(() => _booting = false);
    _jumpToEnd();
  }

  Future<void> _send([String? overrideContent]) async {
    final content = (overrideContent ?? _input.text).trim();
    if (content.isEmpty || _sending || _chat == null) return;
    setState(() {
      _sending = true;
      if (overrideContent == null) _input.clear();
    });
    final placeholder = ChatMessage(
      id: 'pending-${DateTime.now().microsecondsSinceEpoch}',
      role: 'user',
      content: content,
      createdAt: DateTime.now(),
    );
    setState(() => _messages = [..._messages, placeholder]);
    _jumpToEnd();
    try {
      final res = await context.read<Session>().chats.send(
            _chat!.id,
            content,
            translationId: widget.translationId,
          );
      if (!mounted) return;
      setState(() {
        _messages = [..._messages.where((m) => m.id != placeholder.id), res.user, res.assistant];
      });
      await context.read<Progress>().addXp(5);
      widget.onTourMessageSent?.call();
      _jumpToEnd();
    } catch (e) {
      if (!mounted) return;
      setState(() => _messages = _messages.where((m) => m.id != placeholder.id).toList());
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Chat failed: $e')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _jumpToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_booting) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            LumiMascot(mood: LumiMood.thinking, size: 80),
            SizedBox(height: 6),
            Text('warming up the librarian…',
                style: TextStyle(
                  color: T.inkSoft,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w800,
                )),
          ],
        ),
      );
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(_error!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: T.candyDeep,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w800,
              )),
        ),
      );
    }
    return Column(
      children: [
        Expanded(
          child: ListView(
            controller: _scroll,
            padding: const EdgeInsets.fromLTRB(18, 6, 18, 12),
            children: [
              if (_messages.isEmpty) _StarterGrid(onPick: (s) => _send(s)),
              ..._messages.map((m) => _Bubble(message: m)),
              if (_sending) const _ThinkingBubble(),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(14, 8, 14, 14),
          decoration: BoxDecoration(
            color: T.paper.withValues(alpha: 0.85),
            border: Border(top: BorderSide(color: T.ink.withValues(alpha: 0.12))),
          ),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: T.paper,
                      borderRadius: BorderRadius.circular(T.radiusPill),
                      border: Border.all(color: T.ink, width: 1.6),
                      boxShadow: T.stickerShadow(y: 2),
                    ),
                    child: TextField(
                      controller: _input,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      style: const TextStyle(
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w700,
                        color: T.ink,
                        fontSize: 15,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Ask about this book…',
                        hintStyle: TextStyle(
                          fontFamily: 'Nunito',
                          color: T.inkMuted,
                          fontWeight: FontWeight.w700,
                        ),
                        border: InputBorder.none,
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                QuestButton(
                  label: 'Send',
                  iconRight: Icons.send_rounded,
                  color: T.mint,
                  size: QuestButtonSize.regular,
                  expand: false,
                  loading: _sending,
                  onPressed: _sending ? null : _send,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _StarterGrid extends StatelessWidget {
  const _StarterGrid({required this.onPick});
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 12),
      child: Column(
        children: [
          const LumiMascot(mood: LumiMood.cheer, size: 90),
          const SizedBox(height: 8),
          Text('Ask me anything about your book.',
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center),
          const SizedBox(height: 4),
          const Text(
            'I cite real pages so you never have to guess.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: T.inkSoft,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: _ChatPanelState._starters
                .map((s) => GestureDetector(
                      onTap: () => onPick(s),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: T.paper,
                          borderRadius: BorderRadius.circular(T.radiusPill),
                          border: Border.all(color: T.ink, width: 1.4),
                          boxShadow: T.stickerShadow(y: 2),
                        ),
                        child: Text(
                          s,
                          style: const TextStyle(
                            color: T.ink,
                            fontFamily: 'Nunito',
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message});
  final ChatMessage message;
  @override
  Widget build(BuildContext context) {
    final isUser = message.role == 'user';
    final bg = isUser ? T.ink : T.paper;
    final fg = isUser ? T.paper : T.ink;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              padding: const EdgeInsets.all(2),
              child: const LumiMascot(mood: LumiMood.happy, size: 36),
            ),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.78,
              ),
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(isUser ? 20 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 20),
                ),
                border: Border.all(color: T.ink, width: 1.4),
                boxShadow: T.stickerShadow(y: 2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isUser)
                    Text(
                      message.content,
                      style: TextStyle(
                        color: fg,
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w700,
                        height: 1.5,
                        fontSize: 15,
                      ),
                    )
                  else
                    MarkdownBody(
                      data: message.content,
                      styleSheet: MarkdownStyleSheet(
                        p: TextStyle(
                          color: fg,
                          fontFamily: 'Nunito',
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          height: 1.55,
                        ),
                        strong: TextStyle(
                          color: fg,
                          fontFamily: 'Nunito',
                          fontWeight: FontWeight.w900,
                        ),
                        em: TextStyle(
                          color: fg,
                          fontFamily: 'Nunito',
                          fontStyle: FontStyle.italic,
                          fontWeight: FontWeight.w700,
                        ),
                        listBullet: TextStyle(
                          color: fg,
                          fontFamily: 'Nunito',
                          fontWeight: FontWeight.w700,
                        ),
                        code: TextStyle(
                          backgroundColor: T.paper3,
                          fontFamily: 'monospace',
                          color: fg,
                        ),
                      ),
                    ),
                  if ((message.citations?.isNotEmpty ?? false)) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: message.citations!
                          .asMap()
                          .entries
                          .map((entry) => _CiteChip(
                                index: entry.key + 1,
                                citation: entry.value,
                              ))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CiteChip extends StatelessWidget {
  const _CiteChip({required this.index, required this.citation});
  final int index;
  final Citation citation;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: T.saffron.withValues(alpha: 0.30),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: T.saffronDeep, width: 1.2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: const BoxDecoration(
                color: T.saffronDeep, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(
              '$index',
              style: const TextStyle(
                color: T.paper,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w900,
                fontSize: 10,
              ),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            citation.pageStart != null
                ? 'page ${citation.pageStart}'
                : 'cite',
            style: const TextStyle(
              color: T.ink,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w900,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

class _ThinkingBubble extends StatefulWidget {
  const _ThinkingBubble();
  @override
  State<_ThinkingBubble> createState() => _ThinkingBubbleState();
}

class _ThinkingBubbleState extends State<_ThinkingBubble>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
        ..repeat();
  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          const LumiMascot(mood: LumiMood.thinking, size: 36),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: T.paper,
              borderRadius: BorderRadius.circular(20).copyWith(
                bottomLeft: const Radius.circular(4),
              ),
              border: Border.all(color: T.ink, width: 1.4),
              boxShadow: T.stickerShadow(y: 2),
            ),
            child: AnimatedBuilder(
              animation: _c,
              builder: (context, _) {
                final v = _c.value;
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _dot((v + 0) % 1),
                    const SizedBox(width: 4),
                    _dot((v + 0.33) % 1),
                    const SizedBox(width: 4),
                    _dot((v + 0.66) % 1),
                    const SizedBox(width: 8),
                    const Text(
                      'flipping pages…',
                      style: TextStyle(
                        color: T.inkSoft,
                        fontFamily: 'Nunito',
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _dot(double t) {
    final scale = 0.7 + 0.6 * (0.5 + 0.5 * (1 - (t - 0.5).abs() * 2));
    return Transform.scale(
      scale: scale,
      child: Container(
        width: 6,
        height: 6,
        decoration: const BoxDecoration(color: T.candyDeep, shape: BoxShape.circle),
      ),
    );
  }
}
