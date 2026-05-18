import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';
import '../widgets/quest_input.dart';
import '../widgets/sticker_card.dart';
import '../widgets/xp_bar.dart';

// ── Folder colour palette ─────────────────────────────────────────────────────

const _kFolderColors = {
  'saffron': T.saffron,
  'mint': T.mint,
  'candy': T.candy,
  'sky': T.sky,
  'plum': T.plum,
  'sage': T.sage,
  'coral': T.coral,
};

const _kColorNames = ['saffron', 'mint', 'candy', 'sky', 'plum', 'sage', 'coral'];
const _kEmojiOptions = ['📚', '📖', '🔬', '🎭', '💡', '🌍', '🎯', '🏛️', '🌿', '⚡', '🎨', '🔮'];

Color _folderColor(String name) => _kFolderColors[name] ?? T.saffron;

// ── Library screen ────────────────────────────────────────────────────────────

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});
  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  Future<List<Book>>? _booksFuture;
  List<Folder> _folders = [];
  String? _selectedFolderId; // null = All
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted) return;
      _silentRefreshIfPending();
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  void _refresh() {
    final session = context.read<Session>();
    setState(() {
      _booksFuture = session.books.list();
    });
    session.folders.list().then((f) {
      if (!mounted) return;
      setState(() => _folders = f);
    }).catchError((_) {});
  }

  Future<void> _silentRefreshIfPending() async {
    final books = context.read<Session>().books;
    final cur = await _booksFuture;
    if (cur == null) return;
    final pending = cur.any((b) =>
        b.status == BookStatus.uploaded || b.status == BookStatus.processing);
    if (!pending) return;
    try {
      final fresh = await books.list();
      if (!mounted) return;
      setState(() => _booksFuture = Future.value(fresh));
    } catch (_) {}
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 5) return 'Burning the midnight oil,';
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Hello hello,';
    if (h < 21) return 'Evening,';
    return 'Up late,';
  }

  Future<void> _showFolderSheet({Folder? editing}) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FolderSheet(folder: editing),
    );
    if (result == true && mounted) _refresh();
  }

  Future<void> _deleteFolder(Folder folder) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete "${folder.name}"?'),
        content: const Text('Books inside will move back to the unsorted shelf.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await context.read<Session>().folders.delete(folder.id);
      if (_selectedFolderId == folder.id) setState(() => _selectedFolderId = null);
      _refresh();
    } catch (_) {}
  }

  Future<void> _moveBook(Book book) async {
    final chosen = await showModalBottomSheet<String?>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _MoveFolderSheet(folders: _folders, currentFolderId: book.folderId),
    );
    if (!mounted) return;
    // chosen == '' means "remove from folder", null means cancelled
    if (chosen == null) return;
    try {
      await context.read<Session>().folders.assignBook(
        book.id,
        folderId: chosen.isEmpty ? null : chosen,
      );
      _refresh();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final user = session.user;
    final name = (user?.displayName?.split(' ').first.isNotEmpty ?? false)
        ? user!.displayName!.split(' ').first
        : (user?.email.split('@').first ?? 'reader');

    return Scaffold(
      body: PaperBackground(
        child: SafeArea(
          child: RefreshIndicator(
            color: T.candyDeep,
            backgroundColor: T.paper,
            onRefresh: () async => _refresh(),
            child: CustomScrollView(
              slivers: [
                // ── Top bar ──────────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                    child: Row(
                      children: [
                        const Expanded(child: HudBar()),
                        const SizedBox(width: 8),
                        IconButton(
                          tooltip: 'Your gardens',
                          icon: const Icon(Icons.local_florist_rounded, color: T.sageDeep),
                          style: IconButton.styleFrom(
                            backgroundColor: T.paper,
                            side: const BorderSide(color: T.ink, width: 1.4),
                            shape: const CircleBorder(),
                          ),
                          onPressed: () => Navigator.of(context).pushNamed('/gardens'),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          tooltip: 'Profile & settings',
                          icon: const Icon(Icons.person_rounded, color: T.ink),
                          style: IconButton.styleFrom(
                            backgroundColor: T.paper,
                            side: const BorderSide(color: T.ink, width: 1.4),
                            shape: const CircleBorder(),
                          ),
                          onPressed: () => Navigator.of(context).pushNamed('/profile'),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Greeting ─────────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_greeting(), style: Theme.of(context).textTheme.headlineMedium),
                              Text(
                                name,
                                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                                  color: T.candyDeep,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Your shelf, your quest.',
                                style: TextStyle(color: T.inkSoft, fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 14),
                              ),
                            ],
                          ),
                        ),
                        Transform.translate(
                          offset: const Offset(8, -8),
                          child: const LumiMascot(mood: LumiMood.happy, size: 90),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Add book button ───────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 14, 24, 0),
                    child: QuestButton(
                      label: 'Add a new book',
                      icon: Icons.add_rounded,
                      color: T.candy,
                      foreground: T.paper,
                      size: QuestButtonSize.large,
                      onPressed: () async {
                        await Navigator.of(context).pushNamed('/upload');
                        if (mounted) _refresh();
                      },
                    ),
                  ),
                ),

                // ── Folder chips ──────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(0, 16, 0, 4),
                    child: _FolderChipsRow(
                      folders: _folders,
                      selectedId: _selectedFolderId,
                      onSelect: (id) => setState(() => _selectedFolderId = id),
                      onAdd: () => _showFolderSheet(),
                      onEdit: (f) => _showFolderSheet(editing: f),
                      onDelete: _deleteFolder,
                    ),
                  ),
                ),

                // ── Section label ─────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 10, 24, 4),
                    child: Text(
                      _selectedFolderId == null
                          ? 'All books'
                          : _folders.where((f) => f.id == _selectedFolderId).firstOrNull?.name ?? 'Folder',
                      style: const TextStyle(
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                        color: T.inkMuted,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                ),

                // ── Book list ─────────────────────────────────────────────────
                FutureBuilder<List<Book>>(
                  future: _booksFuture,
                  builder: (context, snap) {
                    if (snap.connectionState == ConnectionState.waiting && !snap.hasData) {
                      return const SliverFillRemaining(hasScrollBody: false, child: _ShelfLoading());
                    }
                    if (snap.hasError) {
                      return SliverFillRemaining(
                        hasScrollBody: false,
                        child: _ShelfError(message: snap.error.toString(), onRetry: _refresh),
                      );
                    }
                    final all = snap.data ?? const [];
                    final books = _selectedFolderId == null
                        ? all
                        : all.where((b) => b.folderId == _selectedFolderId).toList();

                    if (books.isEmpty) {
                      return SliverFillRemaining(
                        hasScrollBody: false,
                        child: _selectedFolderId != null
                            ? _EmptyFolder(onAdd: () async {
                                await Navigator.of(context).pushNamed('/upload');
                                if (mounted) _refresh();
                              })
                            : const _EmptyShelf(),
                      );
                    }
                    return SliverPadding(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 40),
                      sliver: SliverList.builder(
                        itemCount: books.length,
                        itemBuilder: (context, i) {
                          final book = books[i];
                          final folder = _folders.where((f) => f.id == book.folderId).firstOrNull;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: BookSticker(
                              book: book,
                              index: i,
                              folder: folder,
                              onTap: () async {
                                await Navigator.of(context).pushNamed('/book', arguments: book.id);
                                if (mounted) _refresh();
                              },
                              onLongPress: () => _moveBook(book),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Folder chips row ──────────────────────────────────────────────────────────

class _FolderChipsRow extends StatelessWidget {
  const _FolderChipsRow({
    required this.folders,
    required this.selectedId,
    required this.onSelect,
    required this.onAdd,
    required this.onEdit,
    required this.onDelete,
  });

  final List<Folder> folders;
  final String? selectedId;
  final ValueChanged<String?> onSelect;
  final VoidCallback onAdd;
  final ValueChanged<Folder> onEdit;
  final ValueChanged<Folder> onDelete;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          // "All" chip
          _Chip(
            label: 'All',
            emoji: '🗂️',
            color: T.ink,
            selected: selectedId == null,
            onTap: () => onSelect(null),
          ),
          const SizedBox(width: 8),
          ...folders.map((f) => Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _Chip(
              label: f.name,
              emoji: f.emoji,
              color: _folderColor(f.color),
              count: f.bookCount,
              selected: selectedId == f.id,
              onTap: () => onSelect(f.id),
              onLongPress: () => _showFolderMenu(context, f),
            ),
          )),
          // Add folder button
          GestureDetector(
            onTap: onAdd,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: T.paper,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: T.ink, width: 1.4),
                boxShadow: T.stickerShadow(y: 2),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.add_rounded, size: 16, color: T.ink),
                  SizedBox(width: 4),
                  Text('New folder', style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 13, color: T.ink)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showFolderMenu(BuildContext context, Folder folder) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: T.ink, width: 1.4),
          boxShadow: T.stickerShadow(y: 6),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Text(folder.emoji, style: const TextStyle(fontSize: 22)),
                  const SizedBox(width: 10),
                  Text(folder.name, style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 16)),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _folderColor(folder.color).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: Text('${folder.bookCount} book${folder.bookCount == 1 ? '' : 's'}',
                        style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 11, color: _folderColor(folder.color))),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: T.paper3),
            ListTile(
              leading: const Icon(Icons.edit_rounded, color: T.ink),
              title: const Text('Edit folder', style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w700)),
              onTap: () { Navigator.pop(context); onEdit(folder); },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline_rounded, color: Colors.red),
              title: const Text('Delete folder', style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w700, color: Colors.red)),
              onTap: () { Navigator.pop(context); onDelete(folder); },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.emoji,
    required this.color,
    this.count,
    required this.selected,
    required this.onTap,
    this.onLongPress,
  });

  final String label;
  final String emoji;
  final Color color;
  final int? count;
  final bool selected;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? color : T.paper,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(
            color: selected ? color.withValues(alpha: 0.0) : T.ink,
            width: 1.4,
          ),
          boxShadow: selected ? T.stickerShadow(y: 3) : T.stickerShadow(y: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: selected ? T.paper : T.ink,
              ),
            ),
            if (count != null) ...[
              const SizedBox(width: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: selected ? Colors.white.withValues(alpha: 0.3) : T.paper3,
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 10,
                    color: selected ? T.paper : T.inkSoft,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Create / Edit folder sheet ────────────────────────────────────────────────

class _FolderSheet extends StatefulWidget {
  const _FolderSheet({this.folder});
  final Folder? folder;
  @override
  State<_FolderSheet> createState() => _FolderSheetState();
}

class _FolderSheetState extends State<_FolderSheet> {
  late final TextEditingController _name;
  late String _color;
  late String _emoji;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.folder?.name ?? '');
    _color = widget.folder?.color ?? 'saffron';
    _emoji = widget.folder?.emoji ?? '📚';
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _name.text.trim();
    if (name.isEmpty) { setState(() => _error = 'Please enter a folder name.'); return; }
    setState(() { _busy = true; _error = null; });
    try {
      final session = context.read<Session>();
      if (widget.folder == null) {
        await session.folders.create(name: name, color: _color, emoji: _emoji);
      } else {
        await session.folders.update(widget.folder!.id, name: name, color: _color, emoji: _emoji);
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString(); _busy = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(24, 12, 24, 24 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: T.paper3, borderRadius: BorderRadius.circular(99)),
            ),
          ),
          Row(
            children: [
              Text(_emoji, style: const TextStyle(fontSize: 28)),
              const SizedBox(width: 10),
              Text(
                widget.folder == null ? 'New folder' : 'Edit folder',
                style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 18, color: T.ink),
              ),
            ],
          ),
          const SizedBox(height: 18),
          QuestInput(controller: _name, label: 'FOLDER NAME', hint: 'e.g. Philosophy'),
          const SizedBox(height: 18),
          const Text('COLOUR', style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 11, color: T.inkMuted, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: _kColorNames.map((c) {
              final selected = _color == c;
              final col = _folderColor(c);
              return GestureDetector(
                onTap: () => setState(() => _color = c),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color: col,
                    shape: BoxShape.circle,
                    border: Border.all(color: selected ? T.ink : Colors.transparent, width: selected ? 3 : 0),
                    boxShadow: selected ? T.stickerShadow(y: 3) : null,
                  ),
                  child: selected ? const Icon(Icons.check_rounded, color: Colors.white, size: 18) : null,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),
          const Text('EMOJI', style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 11, color: T.inkMuted, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _kEmojiOptions.map((e) {
              final selected = _emoji == e;
              return GestureDetector(
                onTap: () => setState(() => _emoji = e),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: selected ? _folderColor(_color).withValues(alpha: 0.15) : T.paper2,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: selected ? _folderColor(_color) : Colors.transparent, width: 2),
                  ),
                  child: Center(child: Text(e, style: const TextStyle(fontSize: 22))),
                ),
              );
            }).toList(),
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(_error!, style: const TextStyle(color: Colors.red, fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 13)),
          ],
          const SizedBox(height: 20),
          QuestButton(
            label: widget.folder == null ? 'Create folder' : 'Save changes',
            iconRight: Icons.check_rounded,
            color: _folderColor(_color),
            loading: _busy,
            onPressed: _busy ? null : _save,
            size: QuestButtonSize.large,
          ),
        ],
      ),
    );
  }
}

// ── Move to folder sheet ──────────────────────────────────────────────────────

class _MoveFolderSheet extends StatelessWidget {
  const _MoveFolderSheet({required this.folders, this.currentFolderId});
  final List<Folder> folders;
  final String? currentFolderId;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: T.paper3, borderRadius: BorderRadius.circular(99)),
            ),
          ),
          const Text('Move to folder', style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 18, color: T.ink)),
          const SizedBox(height: 14),
          if (currentFolderId != null)
            _FolderTile(
              emoji: '🗂️', name: 'Remove from folder', color: T.inkMuted,
              onTap: () => Navigator.of(context).pop(''),
            ),
          ...folders.where((f) => f.id != currentFolderId).map((f) => _FolderTile(
            emoji: f.emoji,
            name: f.name,
            color: _folderColor(f.color),
            onTap: () => Navigator.of(context).pop(f.id),
          )),
          if (folders.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text('No folders yet — create one first.',
                    style: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w600, color: T.inkSoft)),
              ),
            ),
        ],
      ),
    );
  }
}

class _FolderTile extends StatelessWidget {
  const _FolderTile({required this.emoji, required this.name, required this.color, required this.onTap});
  final String emoji;
  final String name;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(T.radiusMd),
            border: Border.all(color: color.withValues(alpha: 0.3), width: 1.4),
          ),
          child: Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Text(name, style: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 15, color: color == T.inkMuted ? T.inkSoft : T.ink)),
              const Spacer(),
              Icon(Icons.arrow_forward_ios_rounded, size: 14, color: color),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Book sticker card ─────────────────────────────────────────────────────────

class BookSticker extends StatelessWidget {
  const BookSticker({
    super.key,
    required this.book,
    required this.index,
    required this.onTap,
    this.onLongPress,
    this.folder,
  });

  final Book book;
  final int index;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final Folder? folder;

  static const _spineTones = [
    [T.saffron, T.saffronDeep],
    [T.mint, T.mintDeep],
    [T.candy, T.candyDeep],
    [T.sky, T.skyDeep],
  ];

  @override
  Widget build(BuildContext context) {
    final tone = _spineTones[index % _spineTones.length];
    final tilt = (index.isEven ? -1 : 1) * 0.012;

    final statusInfo = switch (book.status) {
      BookStatus.uploaded => ('Queued', T.inkMuted),
      BookStatus.processing => ('Reading…', T.skyDeep),
      BookStatus.ready => ('Ready ✦', T.mintDeep),
      BookStatus.failed => ('Hit a snag', T.candyDeep),
    };

    return StickerCard(
      tilt: tilt,
      onTap: onTap,
      onLongPress: onLongPress,
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Spine
          Container(
            width: 64,
            height: 92,
            decoration: BoxDecoration(
              gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: tone),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: T.ink, width: 1.6),
              boxShadow: T.stickerShadow(y: 2),
            ),
            child: Center(
              child: Transform.rotate(
                angle: -math.pi / 2,
                child: SizedBox(
                  width: 80,
                  child: Text(
                    book.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: T.paper, fontFamily: 'Nunito', fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.4),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(book.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 2),
                Text(book.author ?? '—', maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: T.inkSoft, fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    Pill(label: book.format == BookFormat.pdf ? 'PDF' : 'EPUB', color: T.paper3),
                    if (book.pageCount != null) Pill(label: '${book.pageCount}p', color: T.paper3),
                    Pill(
                      label: statusInfo.$1,
                      color: statusInfo.$2.withValues(alpha: 0.20),
                      foreground: statusInfo.$2,
                    ),
                    if (folder != null)
                      Pill(
                        label: '${folder!.emoji} ${folder!.name}',
                        color: _folderColor(folder!.color).withValues(alpha: 0.18),
                        foreground: _folderColor(folder!.color),
                      ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.chevron_right_rounded, color: T.ink, size: 28),
              if (onLongPress != null) ...[
                const SizedBox(height: 4),
                Tooltip(
                  message: 'Move to folder',
                  child: Icon(Icons.folder_outlined, size: 16, color: T.inkMuted),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

// ── Empty states ──────────────────────────────────────────────────────────────

class _EmptyShelf extends StatelessWidget {
  const _EmptyShelf();
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 36),
      child: StickerCard(
        color: T.paper,
        tilt: -0.01,
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                LumiMascot(mood: LumiMood.thinking, size: 60),
                SizedBox(width: 12),
                Expanded(child: Text('No books yet?', style: TextStyle(fontFamily: 'LilitaOne', fontSize: 22, color: T.ink))),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Tap "Add a new book" to drop a PDF or EPUB. I will gobble it up and prep page-perfect chat + quizzes.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: T.inkSoft, height: 1.55),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyFolder extends StatelessWidget {
  const _EmptyFolder({required this.onAdd});
  final VoidCallback onAdd;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 36),
      child: StickerCard(
        color: T.paper,
        tilt: -0.01,
        padding: const EdgeInsets.all(22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                LumiMascot(mood: LumiMood.thinking, size: 60),
                SizedBox(width: 12),
                Expanded(child: Text('Folder is empty', style: TextStyle(fontFamily: 'LilitaOne', fontSize: 20, color: T.ink))),
              ],
            ),
            const SizedBox(height: 6),
            Text('Add a book or long-press any book to move it here.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: T.inkSoft)),
          ],
        ),
      ),
    );
  }
}

class _ShelfLoading extends StatelessWidget {
  const _ShelfLoading();
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          LumiMascot(mood: LumiMood.thinking, size: 100),
          SizedBox(height: 12),
          Text('Dusting off your shelf…', style: TextStyle(color: T.inkSoft, fontFamily: 'Nunito', fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class _ShelfError extends StatelessWidget {
  const _ShelfError({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const LumiMascot(mood: LumiMood.sad, size: 100),
            const SizedBox(height: 10),
            Text('Couldn\'t open the shelf', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: T.inkSoft, fontFamily: 'Nunito', fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            QuestButton(label: 'Try again', onPressed: onRetry, expand: false),
          ],
        ),
      ),
    );
  }
}
