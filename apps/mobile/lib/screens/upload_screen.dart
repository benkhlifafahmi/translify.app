import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../state/progress.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';
import '../widgets/sticker_card.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});
  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  File? _picked;
  String? _filename;
  int _sizeBytes = 0;
  double _progress = 0;
  bool _busy = false;
  String? _error;

  Future<void> _pick() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'epub'],
      withData: false,
    );
    if (result == null || result.files.isEmpty) return;
    final f = result.files.single;
    if (f.path == null) return;
    setState(() {
      _picked = File(f.path!);
      _filename = f.name;
      _sizeBytes = f.size;
      _progress = 0;
      _error = null;
    });
  }

  Future<void> _go() async {
    if (_picked == null || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final svc = context.read<Session>().books;
      final reservation = await svc.requestUpload(
        filename: _filename!,
        contentType: _filename!.toLowerCase().endsWith('.epub')
            ? 'application/epub+zip'
            : 'application/pdf',
        sizeBytes: _sizeBytes,
      );
      await svc.uploadToPresigned(
        reservation.uploadUrl,
        _picked!,
        onProgress: (sent, total) {
          if (total <= 0) return;
          setState(() => _progress = sent / total);
        },
      );
      await svc.finalize(uploadId: reservation.uploadId);
      if (!mounted) return;
      await context.read<Progress>().addXp(15, badge: 'first_upload');
      if (!mounted) return;
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PaperBackground(
        glow: T.candy,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).maybePop(),
                      icon: const Icon(Icons.close_rounded),
                      style: IconButton.styleFrom(
                        backgroundColor: T.paper,
                        side: const BorderSide(color: T.ink, width: 1.4),
                        shape: const CircleBorder(),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Drop a book',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                    ),
                    const LumiMascot(mood: LumiMood.cheer, size: 60),
                  ],
                ),
                const SizedBox(height: 20),
                Expanded(
                  child: GestureDetector(
                    onTap: _busy ? null : _pick,
                    child: StickerCard(
                      tilt: -0.01,
                      color: _picked == null ? T.paper : T.mint.withValues(alpha: 0.18),
                      padding: const EdgeInsets.all(28),
                      child: Center(
                        child: _picked == null
                            ? _PickPrompt(onTap: _pick)
                            : _Picked(
                                filename: _filename ?? '',
                                bytes: _sizeBytes,
                                progress: _busy ? _progress : null,
                              ),
                      ),
                    ),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: T.candy.withValues(alpha: 0.20),
                      borderRadius: BorderRadius.circular(T.radiusSm),
                      border: Border.all(color: T.candyDeep, width: 1.4),
                    ),
                    child: Text(
                      _error!,
                      style: const TextStyle(
                        color: T.candyDeep,
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: QuestButton(
                        label: _picked == null ? 'Choose a file' : 'Pick another',
                        icon: Icons.folder_open_rounded,
                        color: T.paper,
                        onPressed: _busy ? null : _pick,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: QuestButton(
                        label: _busy ? 'Uploading…' : 'Send it',
                        iconRight: Icons.rocket_launch_rounded,
                        color: T.candy,
                        foreground: T.paper,
                        loading: _busy,
                        onPressed: (_picked == null || _busy) ? null : _go,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PickPrompt extends StatelessWidget {
  const _PickPrompt({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            color: T.candy.withValues(alpha: 0.15),
            shape: BoxShape.circle,
            border: Border.all(color: T.candyDeep, width: 2),
          ),
          child: const Icon(Icons.upload_rounded,
              size: 44, color: T.candyDeep),
        ),
        const SizedBox(height: 18),
        Text(
          'Tap to pick',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 4),
        const Text(
          'PDF or EPUB · up to 200 MB',
          style: TextStyle(
            color: T.inkSoft,
            fontFamily: 'Nunito',
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}

class _Picked extends StatelessWidget {
  const _Picked({
    required this.filename,
    required this.bytes,
    this.progress,
  });
  final String filename;
  final int bytes;
  final double? progress;

  String _fmtBytes(int n) {
    if (n < 1024) return '$n B';
    if (n < 1024 * 1024) return '${(n / 1024).toStringAsFixed(1)} KB';
    return '${(n / 1024 / 1024).toStringAsFixed(1)} MB';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            color: T.mint.withValues(alpha: 0.25),
            shape: BoxShape.circle,
            border: Border.all(color: T.mintDeep, width: 2),
          ),
          child: const Icon(Icons.check_circle_rounded,
              size: 48, color: T.mintDeep),
        ),
        const SizedBox(height: 16),
        Text(
          filename,
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 4),
        Text(
          _fmtBytes(bytes),
          style: const TextStyle(
            color: T.inkSoft,
            fontFamily: 'Nunito',
            fontWeight: FontWeight.w700,
          ),
        ),
        if (progress != null) ...[
          const SizedBox(height: 18),
          Container(
            height: 12,
            decoration: BoxDecoration(
              color: T.paper3,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: T.ink, width: 1.4),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: progress!.clamp(0.0, 1.0)),
                duration: const Duration(milliseconds: 200),
                builder: (context, v, _) => Align(
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(
                    widthFactor: v,
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [T.candy, T.saffron],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text('${(progress! * 100).toStringAsFixed(0)} %',
              style: const TextStyle(
                color: T.candyDeep,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w900,
              )),
        ],
      ],
    );
  }
}
