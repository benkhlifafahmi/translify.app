import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../state/session.dart';
import '../theme/tokens.dart';
import '../widgets/lumi_mascot.dart';
import '../widgets/paper_background.dart';
import '../widgets/quest_button.dart';
import '../widgets/quest_input.dart';
import '../widgets/sticker_card.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Subscription? _sub;
  List<ReaderProfile>? _profiles;
  Object? _loadError;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    final session = context.read<Session>();
    try {
      final results = await Future.wait([
        session.billing.me(),
        session.profiles.list(),
      ]);
      if (!mounted) return;
      setState(() {
        _sub = results[0] as Subscription;
        _profiles = results[1] as List<ReaderProfile>;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadError = e;
        _loading = false;
      });
    }
  }

  Future<void> _openExternalUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      _toast("That link didn't look right.");
      return;
    }
    final ok =
        await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok) _toast("Couldn't open the browser.");
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _editAccount() async {
    final session = context.read<Session>();
    final user = session.user;
    if (user == null) return;
    final next = await showModalBottomSheet<User?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AccountEditSheet(user: user),
    );
    if (next != null && mounted) {
      session.setUser(next);
    }
  }

  Future<void> _changePassword() async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _ChangePasswordSheet(),
    );
    if (ok == true) _toast('Password updated.');
  }

  Future<void> _toggleFamilySafe(bool next) async {
    final session = context.read<Session>();
    final user = session.user;
    if (user == null) return;
    try {
      final updated = await session.auth.updateMe(familySafeMode: next);
      if (mounted) session.setUser(updated);
    } catch (e) {
      _toast(describeError(e));
    }
  }

  Future<void> _addProfile() async {
    final sub = _sub;
    if (sub == null) return;
    final used = _profiles?.length ?? 0;
    if (used >= sub.quota.profiles) {
      _toast(
        'Your ${planLabel(sub.plan)} plan allows ${sub.quota.profiles} '
        '${sub.quota.profiles == 1 ? 'profile' : 'profiles'}. '
        'Upgrade to Family for up to 5.',
      );
      return;
    }
    final session = context.read<Session>();
    final draft = await showModalBottomSheet<_ProfileDraft?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _ProfileEditSheet(initial: null),
    );
    if (draft == null) return;
    try {
      final created = await session.profiles.create(
        name: draft.name,
        kind: draft.kind,
        avatarSeed: draft.avatarSeed,
      );
      if (!mounted) return;
      setState(() => _profiles = [...?_profiles, created]);
      _toast('Welcome aboard, ${created.name}!');
    } catch (e) {
      _toast(describeError(e));
    }
  }

  Future<void> _editProfile(ReaderProfile profile) async {
    final session = context.read<Session>();
    final draft = await showModalBottomSheet<_ProfileDraft?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ProfileEditSheet(initial: profile),
    );
    if (draft == null) return;
    try {
      final updated = await session.profiles.update(
        profile.id,
        name: draft.name,
        kind: draft.kind,
        avatarSeed: draft.avatarSeed,
      );
      if (!mounted) return;
      setState(() {
        _profiles = _profiles
            ?.map((p) => p.id == updated.id ? updated : p)
            .toList();
      });
    } catch (e) {
      _toast(describeError(e));
    }
  }

  Future<void> _deleteProfile(ReaderProfile profile) async {
    if (profile.isDefault) {
      _toast("The default profile can't be removed.");
      return;
    }
    final session = context.read<Session>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => _StickerDialog(
        title: 'Remove ${profile.name}?',
        body:
            'Their highlights and progress stay with the account — they just '
            'lose their own avatar and greeting.',
        confirmLabel: 'Remove',
        confirmColor: T.coral,
      ),
    );
    if (confirmed != true) return;
    try {
      await session.profiles.delete(profile.id);
      if (!mounted) return;
      setState(() {
        _profiles = _profiles?.where((p) => p.id != profile.id).toList();
      });
    } catch (e) {
      _toast(describeError(e));
    }
  }

  Future<void> _openPortal() async {
    final session = context.read<Session>();
    try {
      final url = await session.billing.portalUrl();
      await _openExternalUrl(url);
    } catch (e) {
      _toast(describeError(e));
    }
  }

  Future<void> _startCheckout(Plan plan, Cycle cycle) async {
    final session = context.read<Session>();
    try {
      final url = await session.billing.checkoutUrl(plan: plan, cycle: cycle);
      await _openExternalUrl(url);
    } catch (e) {
      _toast(describeError(e));
    }
  }

  Future<void> _requestAccountDeletion() async {
    final user = context.read<Session>().user;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => _StickerDialog(
        title: 'Delete your account?',
        body:
            'This permanently erases all your books, translations, progress, '
            'quizzes, and account data. This cannot be undone.',
        confirmLabel: 'Continue',
        confirmColor: T.coral,
      ),
    );
    if (confirmed != true) return;
    final email = Uri.encodeQueryComponent(user?.email ?? '');
    await _openExternalUrl('https://translify.app/opt-out?email=$email');
  }

  Future<void> _signOut() async {
    final session = context.read<Session>();
    final navigator = Navigator.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => _StickerDialog(
        title: 'See you soon?',
        body: "You'll keep your streak — just sign back in to pick it up.",
        confirmLabel: 'Sign out',
        confirmColor: T.coral,
      ),
    );
    if (confirmed != true) return;
    await session.logout();
    if (!mounted) return;
    navigator.pushNamedAndRemoveUntil('/login', (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final user = session.user;

    return Scaffold(
      body: PaperBackground(
        glow: T.sage,
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _ProfileHeader(user: user)),
              if (_loading)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: _ProfileLoading(),
                )
              else if (_loadError != null)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _ProfileError(
                    message: describeError(_loadError!),
                    onRetry: _load,
                  ),
                )
              else ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                    child: _SettingsCard(
                      user: user,
                      onEdit: _editAccount,
                      onChangePassword: _changePassword,
                      onToggleFamilySafe:
                          (_sub?.quota.familySafeMode ?? false)
                              ? _toggleFamilySafe
                              : null,
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                    child: _SubscriptionCard(
                      sub: _sub!,
                      onPortal: _openPortal,
                      onCheckout: _startCheckout,
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                    child: _ProfilesCard(
                      profiles: _profiles ?? const [],
                      activeProfileId: user?.activeProfileId,
                      maxProfiles: _sub!.quota.profiles,
                      planLabel: planLabel(_sub!.plan),
                      onAdd: _addProfile,
                      onEdit: _editProfile,
                      onDelete: _deleteProfile,
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                    child: _DangerCard(
                      onDeleteAccount: _requestAccountDeletion,
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 22, 20, 32),
                    child: QuestButton(
                      label: 'Sign out',
                      icon: Icons.logout_rounded,
                      color: T.paper,
                      foreground: T.coralDeep,
                      onPressed: _signOut,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────── Header ───────────────────────────

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.user});
  final User? user;

  @override
  Widget build(BuildContext context) {
    final name = user?.displayName?.trim().isNotEmpty == true
        ? user!.displayName!.trim()
        : (user?.email.split('@').first ?? 'Reader');
    final seed = (user?.activeProfileId ?? user?.id ?? 'lumi');
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                tooltip: 'Back',
                icon: const Icon(Icons.arrow_back_rounded, color: T.ink),
                style: IconButton.styleFrom(
                  backgroundColor: T.paper,
                  side: const BorderSide(color: T.ink, width: 1.4),
                  shape: const CircleBorder(),
                ),
                onPressed: () => Navigator.of(context).maybePop(),
              ),
              const Spacer(),
              const LumiMascot(mood: LumiMood.happy, size: 56),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _AvatarBubble(seed: seed, size: 72),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    if (user?.email != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          user!.email,
                          style: const TextStyle(
                            color: T.inkSoft,
                            fontFamily: 'Nunito',
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Tiny avatar that picks a deterministic emoji + tone from a seed string.
class _AvatarBubble extends StatelessWidget {
  const _AvatarBubble({required this.seed, this.size = 56});
  final String seed;
  final double size;

  static const _palette = <_AvatarChoice>[
    _AvatarChoice('lumi', '🦉', T.saffron),
    _AvatarChoice('fox', '🦊', T.coral),
    _AvatarChoice('bear', '🐻', T.saffronDeep),
    _AvatarChoice('panda', '🐼', T.paper3),
    _AvatarChoice('cat', '🐱', T.plumSoft),
    _AvatarChoice('rabbit', '🐰', T.coral),
    _AvatarChoice('dragon', '🐉', T.sage),
    _AvatarChoice('unicorn', '🦄', T.plum),
  ];

  static _AvatarChoice resolve(String seed) {
    final direct = _palette.firstWhere(
      (p) => p.seed == seed,
      orElse: () => _palette[seed.hashCode.abs() % _palette.length],
    );
    return direct;
  }

  @override
  Widget build(BuildContext context) {
    final choice = resolve(seed);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: choice.tone.withValues(alpha: 0.20),
        shape: BoxShape.circle,
        border: Border.all(color: T.ink, width: 2),
        boxShadow: T.stickerShadow(y: 3),
      ),
      alignment: Alignment.center,
      child: Text(
        choice.emoji,
        style: TextStyle(fontSize: size * 0.5),
      ),
    );
  }
}

class _AvatarChoice {
  const _AvatarChoice(this.seed, this.emoji, this.tone);
  final String seed;
  final String emoji;
  final Color tone;
}

// ─────────────────────────── Settings ───────────────────────────

class _SettingsCard extends StatelessWidget {
  const _SettingsCard({
    required this.user,
    required this.onEdit,
    required this.onChangePassword,
    required this.onToggleFamilySafe,
  });
  final User? user;
  final VoidCallback onEdit;
  final VoidCallback onChangePassword;
  final ValueChanged<bool>? onToggleFamilySafe;

  @override
  Widget build(BuildContext context) {
    return StickerCard(
      tilt: -0.005,
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionLabel(icon: Icons.tune_rounded, label: 'Settings'),
          const SizedBox(height: 4),
          _Row(
            icon: Icons.badge_outlined,
            label: 'Display name',
            value: user?.displayName?.trim().isNotEmpty == true
                ? user!.displayName!
                : '—',
            onTap: onEdit,
          ),
          _Row(
            icon: Icons.language_rounded,
            label: 'Reading language',
            value: _languageLabel(user?.preferredLanguage ?? 'en'),
            onTap: onEdit,
          ),
          _Row(
            icon: Icons.lock_outline_rounded,
            label: 'Password',
            value: '••••••••',
            onTap: onChangePassword,
          ),
          _ToggleRow(
            icon: Icons.shield_outlined,
            label: 'Family-safe mode',
            sub: onToggleFamilySafe == null
                ? 'Available on the Family plan.'
                : 'Hide mature content in chats & quizzes.',
            value: user?.familySafeMode ?? false,
            onChanged: onToggleFamilySafe,
          ),
        ],
      ),
    );
  }
}

String _languageLabel(String code) {
  const map = {
    'en': 'English',
    'fr': 'Français',
    'es': 'Español',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ar': 'العربية',
    'ja': '日本語',
    'ko': '한국어',
    'zh': '中文',
    'nl': 'Nederlands',
    'tr': 'Türkçe',
    'ru': 'Русский',
  };
  return map[code] ?? code.toUpperCase();
}

const _supportedLanguages = <(String, String)>[
  ('en', 'English'),
  ('fr', 'Français'),
  ('es', 'Español'),
  ('de', 'Deutsch'),
  ('it', 'Italiano'),
  ('pt', 'Português'),
  ('ar', 'العربية'),
  ('nl', 'Nederlands'),
  ('tr', 'Türkçe'),
  ('ja', '日本語'),
  ('ko', '한국어'),
  ('zh', '中文'),
  ('ru', 'Русский'),
];

// ─────────────────────────── Subscription ───────────────────────────

class _SubscriptionCard extends StatelessWidget {
  const _SubscriptionCard({
    required this.sub,
    required this.onPortal,
    required this.onCheckout,
  });
  final Subscription sub;
  final VoidCallback onPortal;
  final void Function(Plan, Cycle) onCheckout;

  @override
  Widget build(BuildContext context) {
    final isPaid = sub.plan != Plan.free;
    final usage = sub.usage;
    final quota = sub.quota;
    final pagesCap = quota.pagesPerMonth;
    final pagesUsed = usage.pagesUploaded;
    final pagesFrac = pagesCap <= 0
        ? 0.0
        : (pagesUsed / pagesCap).clamp(0.0, 1.0).toDouble();
    final renewLabel = _renewLabel(sub);

    return StickerCard(
      tilt: 0.006,
      color: T.paper,
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionLabel(
              icon: Icons.workspace_premium_rounded, label: 'Subscription'),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      planLabel(sub.plan),
                      style: Theme.of(context)
                          .textTheme
                          .displaySmall
                          ?.copyWith(color: T.coralDeep),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _statusBlurb(sub),
                      style: const TextStyle(
                        color: T.inkSoft,
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              Pill(
                label: subStatusLabel(sub.status),
                color: _statusTone(sub.status).withValues(alpha: 0.18),
                foreground: _statusTone(sub.status),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Usage meter — pages this period.
          _UsageMeter(
            label: 'Pages translated',
            used: pagesUsed,
            cap: pagesCap,
            fraction: pagesFrac,
          ),
          const SizedBox(height: 14),
          // Renewal / trial line.
          if (renewLabel != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  const Icon(Icons.event_rounded, size: 16, color: T.inkSoft),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      renewLabel,
                      style: const TextStyle(
                        color: T.inkSoft,
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          // Perks chips.
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              if (quota.chatWithCitations)
                const Pill(label: 'Chat + citations', color: T.paper2),
              if (quota.literaryTranslation)
                const Pill(label: 'Literary engine', color: T.paper2),
              if (quota.priorityQueue)
                const Pill(label: 'Priority queue', color: T.paper2),
              if (quota.annotatedExport)
                const Pill(label: 'Annotated export', color: T.paper2),
              if (quota.profiles > 1)
                Pill(label: '${quota.profiles} profiles', color: T.paper2),
            ],
          ),
          const SizedBox(height: 16),
          if (isPaid && sub.hasStripeCustomer)
            QuestButton(
              label: 'Manage in Stripe',
              icon: Icons.open_in_new_rounded,
              color: T.sage,
              foreground: T.paper,
              onPressed: onPortal,
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Pick a plan',
                  style: TextStyle(
                    color: T.inkSoft,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                _PlanCard(
                  plan: Plan.reader,
                  blurb: '2,000 pages / month • chat + citations',
                  isCurrent: sub.plan == Plan.reader,
                  onMonthly: () => onCheckout(Plan.reader, Cycle.monthly),
                  onYearly: () => onCheckout(Plan.reader, Cycle.yearly),
                  tone: T.saffron,
                ),
                const SizedBox(height: 10),
                _PlanCard(
                  plan: Plan.scholar,
                  blurb: 'Unlimited pages • literary engine • priority',
                  isCurrent: sub.plan == Plan.scholar,
                  onMonthly: () => onCheckout(Plan.scholar, Cycle.monthly),
                  onYearly: () => onCheckout(Plan.scholar, Cycle.yearly),
                  tone: T.coral,
                ),
                const SizedBox(height: 10),
                _PlanCard(
                  plan: Plan.family,
                  blurb: '5 reader profiles • family-safe mode • all perks',
                  isCurrent: sub.plan == Plan.family,
                  onMonthly: () => onCheckout(Plan.family, Cycle.monthly),
                  onYearly: () => onCheckout(Plan.family, Cycle.yearly),
                  tone: T.sage,
                ),
              ],
            ),
        ],
      ),
    );
  }

  static String? _renewLabel(Subscription s) {
    if (s.status == SubStatus.trialing && s.trialEnd != null) {
      return 'Free trial ends ${_fmtDate(s.trialEnd!)}';
    }
    if (s.cancelAtPeriodEnd && s.currentPeriodEnd != null) {
      return 'Cancels ${_fmtDate(s.currentPeriodEnd!)}';
    }
    if (s.currentPeriodEnd != null) {
      return 'Renews ${_fmtDate(s.currentPeriodEnd!)}';
    }
    return null;
  }

  static String _statusBlurb(Subscription s) {
    return switch (s.plan) {
      Plan.free => 'Try Translify with up to 2 sample pages.',
      Plan.reader => 'Personal reading, paperback-grade.',
      Plan.scholar => 'For the serious reader.',
      Plan.family => 'Up to 5 readers under one shelf.',
    };
  }

  static Color _statusTone(SubStatus s) => switch (s) {
        SubStatus.active => T.sageDeep,
        SubStatus.trialing => T.saffronDeep,
        SubStatus.pastDue => T.coralDeep,
        SubStatus.canceled => T.coralDeep,
        SubStatus.unpaid => T.coralDeep,
        SubStatus.inactive => T.inkMuted,
      };

  static String _fmtDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final local = d.toLocal();
    return '${months[local.month - 1]} ${local.day}, ${local.year}';
  }
}

class _UsageMeter extends StatelessWidget {
  const _UsageMeter({
    required this.label,
    required this.used,
    required this.cap,
    required this.fraction,
  });
  final String label;
  final int used;
  final int cap;
  final double fraction;

  @override
  Widget build(BuildContext context) {
    final isUnlimited = cap >= Quota.unlimitedSentinel;
    final txt = isUnlimited ? '$used / ∞' : '$used / $cap';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: T.inkSoft,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 1.2,
              ),
            ),
            Text(
              txt,
              style: const TextStyle(
                color: T.ink,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w900,
                fontSize: 13,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(T.radiusPill),
          child: Container(
            height: 10,
            decoration: BoxDecoration(
              color: T.paper3,
              border: Border.all(color: T.ink, width: 1.4),
              borderRadius: BorderRadius.circular(T.radiusPill),
            ),
            child: LayoutBuilder(
              builder: (context, box) {
                final width = isUnlimited ? box.maxWidth * 0.2 : box.maxWidth * fraction;
                return Stack(
                  children: [
                    Container(
                      width: width.clamp(0.0, box.maxWidth),
                      decoration: BoxDecoration(
                        color: fraction > 0.85 ? T.coral : T.sage,
                        borderRadius:
                            BorderRadius.circular(T.radiusPill),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.blurb,
    required this.isCurrent,
    required this.onMonthly,
    required this.onYearly,
    required this.tone,
  });
  final Plan plan;
  final String blurb;
  final bool isCurrent;
  final VoidCallback onMonthly;
  final VoidCallback onYearly;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.ink, width: 1.6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  planLabel(plan),
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(color: T.ink),
                ),
              ),
              if (isCurrent)
                const Pill(
                  label: 'Current',
                  color: T.paper,
                  foreground: T.sageDeep,
                ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            blurb,
            style: const TextStyle(
              color: T.inkSoft,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w700,
              fontSize: 13,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: QuestButton(
                  label: 'Monthly',
                  color: T.paper,
                  foreground: T.ink,
                  size: QuestButtonSize.small,
                  onPressed: isCurrent ? null : onMonthly,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: QuestButton(
                  label: 'Yearly',
                  color: tone,
                  foreground: T.paper,
                  size: QuestButtonSize.small,
                  onPressed: isCurrent ? null : onYearly,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────── Profiles ───────────────────────────

class _ProfilesCard extends StatelessWidget {
  const _ProfilesCard({
    required this.profiles,
    required this.activeProfileId,
    required this.maxProfiles,
    required this.planLabel,
    required this.onAdd,
    required this.onEdit,
    required this.onDelete,
  });

  final List<ReaderProfile> profiles;
  final String? activeProfileId;
  final int maxProfiles;
  final String planLabel;
  final VoidCallback onAdd;
  final void Function(ReaderProfile) onEdit;
  final void Function(ReaderProfile) onDelete;

  @override
  Widget build(BuildContext context) {
    final hasRoom = profiles.length < maxProfiles;
    return StickerCard(
      tilt: -0.004,
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionLabel(
              icon: Icons.group_outlined, label: 'Reader profiles'),
          const SizedBox(height: 4),
          Text(
            maxProfiles <= 1
                ? '$planLabel includes 1 reader profile. Upgrade to Family for up to 5.'
                : '${profiles.length} of $maxProfiles seats used.',
            style: const TextStyle(
              color: T.inkSoft,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w700,
              fontSize: 13,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          for (final p in profiles) ...[
            _ProfileRow(
              profile: p,
              isActive: activeProfileId == p.id,
              onEdit: () => onEdit(p),
              onDelete: p.isDefault ? null : () => onDelete(p),
            ),
            const SizedBox(height: 8),
          ],
          if (maxProfiles > 1) ...[
            const SizedBox(height: 4),
            QuestButton(
              label: hasRoom ? 'Invite another reader' : 'Family seats full',
              icon: Icons.person_add_alt_rounded,
              color: hasRoom ? T.sage : T.paper2,
              foreground: hasRoom ? T.paper : T.inkSoft,
              onPressed: hasRoom ? onAdd : null,
            ),
          ] else
            const SizedBox.shrink(),
        ],
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({
    required this.profile,
    required this.isActive,
    required this.onEdit,
    required this.onDelete,
  });
  final ReaderProfile profile;
  final bool isActive;
  final VoidCallback onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: T.paper2,
        borderRadius: BorderRadius.circular(T.radiusMd),
        border: Border.all(color: T.ink.withValues(alpha: 0.12), width: 1.2),
      ),
      child: Row(
        children: [
          _AvatarBubble(seed: profile.avatarSeed, size: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        profile.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    if (isActive)
                      const Pill(
                        label: 'Active',
                        color: T.paper,
                        foreground: T.sageDeep,
                      ),
                  ],
                ),
                const SizedBox(height: 2),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    Pill(
                      label:
                          profile.kind == ProfileKind.child ? 'Child' : 'Adult',
                      color: T.paper,
                      foreground: profile.kind == ProfileKind.child
                          ? T.coralDeep
                          : T.inkSoft,
                    ),
                    if (profile.isDefault)
                      const Pill(
                        label: 'Default',
                        color: T.paper,
                        foreground: T.inkSoft,
                      ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Edit',
            icon: const Icon(Icons.edit_rounded, color: T.ink, size: 20),
            onPressed: onEdit,
          ),
          if (onDelete != null)
            IconButton(
              tooltip: 'Remove',
              icon: const Icon(Icons.delete_outline_rounded,
                  color: T.coralDeep, size: 20),
              onPressed: onDelete,
            ),
        ],
      ),
    );
  }
}

// ─────────────────────────── Shared bits ───────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: T.inkSoft),
        const SizedBox(width: 6),
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            color: T.inkSoft,
            fontFamily: 'Nunito',
            fontWeight: FontWeight.w900,
            fontSize: 11,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(T.radiusMd),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            Icon(icon, color: T.inkSoft, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      color: T.inkSoft,
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      letterSpacing: 0.4,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: T.ink,
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w900,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: T.inkMuted),
          ],
        ),
      ),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  const _ToggleRow({
    required this.icon,
    required this.label,
    required this.sub,
    required this.value,
    required this.onChanged,
  });
  final IconData icon;
  final String label;
  final String sub;
  final bool value;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final dim = onChanged == null;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: T.inkSoft, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: dim ? T.inkMuted : T.ink,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  sub,
                  style: TextStyle(
                    color: dim ? T.inkMuted : T.inkSoft,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: T.paper,
            activeTrackColor: T.sage,
            inactiveTrackColor: T.paper3,
            inactiveThumbColor: T.paper,
          ),
        ],
      ),
    );
  }
}

class _StickerDialog extends StatelessWidget {
  const _StickerDialog({
    required this.title,
    required this.body,
    required this.confirmLabel,
    required this.confirmColor,
  });
  final String title;
  final String body;
  final String confirmLabel;
  final Color confirmColor;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: StickerCard(
        padding: const EdgeInsets.fromLTRB(22, 22, 22, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 6),
            Text(
              body,
              style: const TextStyle(
                color: T.inkSoft,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w700,
                fontSize: 14,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: QuestButton(
                    label: 'Cancel',
                    color: T.paper,
                    foreground: T.ink,
                    size: QuestButtonSize.small,
                    onPressed: () => Navigator.of(context).pop(false),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: QuestButton(
                    label: confirmLabel,
                    color: confirmColor,
                    foreground: T.paper,
                    size: QuestButtonSize.small,
                    onPressed: () => Navigator.of(context).pop(true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileLoading extends StatelessWidget {
  const _ProfileLoading();
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          LumiMascot(mood: LumiMood.thinking, size: 90),
          SizedBox(height: 10),
          Text(
            'Checking on your shelf…',
            style: TextStyle(
              color: T.inkSoft,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileError extends StatelessWidget {
  const _ProfileError({required this.message, required this.onRetry});
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
            const LumiMascot(mood: LumiMood.sad, size: 90),
            const SizedBox(height: 10),
            Text(
              "Couldn't load your account",
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: T.inkSoft,
                fontFamily: 'Nunito',
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            QuestButton(label: 'Try again', onPressed: onRetry, expand: false),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────── Sheets ───────────────────────────

class _AccountEditSheet extends StatefulWidget {
  const _AccountEditSheet({required this.user});
  final User user;
  @override
  State<_AccountEditSheet> createState() => _AccountEditSheetState();
}

class _AccountEditSheetState extends State<_AccountEditSheet> {
  late final TextEditingController _name =
      TextEditingController(text: widget.user.displayName ?? '');
  late String _lang = widget.user.preferredLanguage;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final updated = await context.read<Session>().auth.updateMe(
            displayName: _name.text.trim(),
            preferredLanguage: _lang,
          );
      if (!mounted) return;
      Navigator.of(context).pop(updated);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding:
          EdgeInsets.fromLTRB(16, 12, 16, 16 + viewInsets),
      child: StickerCard(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _SectionLabel(
                icon: Icons.tune_rounded, label: 'Edit account'),
            const SizedBox(height: 14),
            QuestInput(
              controller: _name,
              label: 'DISPLAY NAME',
              hint: 'Your reading name',
            ),
            const SizedBox(height: 14),
            _LanguagePicker(
              selected: _lang,
              onChanged: (v) => setState(() => _lang = v),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(
                  color: T.coralDeep,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
            const SizedBox(height: 18),
            QuestButton(
              label: 'Save',
              loading: _busy,
              onPressed: _busy ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}

class _LanguagePicker extends StatelessWidget {
  const _LanguagePicker({required this.selected, required this.onChanged});
  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 6, bottom: 6),
          child: Text(
            'READING LANGUAGE',
            style: TextStyle(
              color: T.inkSoft,
              fontWeight: FontWeight.w900,
              fontSize: 11,
              letterSpacing: 1.2,
              fontFamily: 'Nunito',
            ),
          ),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final l in _supportedLanguages)
              _LangChip(
                code: l.$1,
                label: l.$2,
                selected: selected == l.$1,
                onTap: () => onChanged(l.$1),
              ),
          ],
        ),
      ],
    );
  }
}

class _LangChip extends StatelessWidget {
  const _LangChip({
    required this.code,
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String code;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(T.radiusPill),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? T.saffron : T.paper,
          borderRadius: BorderRadius.circular(T.radiusPill),
          border: Border.all(color: T.ink, width: 1.4),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? T.ink : T.inkSoft,
            fontFamily: 'Nunito',
            fontWeight: FontWeight.w800,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _ChangePasswordSheet extends StatefulWidget {
  const _ChangePasswordSheet();
  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final _new = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _new.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    if (_new.text.length < 8) {
      setState(() => _error = 'Use at least 8 characters.');
      return;
    }
    if (_new.text != _confirm.text) {
      setState(() => _error = "Passwords don't match.");
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<Session>().auth.updateMe(password: _new.text);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = describeError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + viewInsets),
      child: StickerCard(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _SectionLabel(
                icon: Icons.lock_outline_rounded, label: 'Change password'),
            const SizedBox(height: 14),
            QuestInput(
              controller: _new,
              label: 'NEW PASSWORD',
              hint: '••••••••',
              obscure: true,
            ),
            const SizedBox(height: 12),
            QuestInput(
              controller: _confirm,
              label: 'CONFIRM',
              hint: '••••••••',
              obscure: true,
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(
                  color: T.coralDeep,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
            const SizedBox(height: 18),
            QuestButton(
              label: 'Update password',
              loading: _busy,
              onPressed: _busy ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileDraft {
  _ProfileDraft({required this.name, required this.kind, required this.avatarSeed});
  final String name;
  final ProfileKind kind;
  final String avatarSeed;
}

class _ProfileEditSheet extends StatefulWidget {
  const _ProfileEditSheet({required this.initial});
  final ReaderProfile? initial;
  @override
  State<_ProfileEditSheet> createState() => _ProfileEditSheetState();
}

class _ProfileEditSheetState extends State<_ProfileEditSheet> {
  late final TextEditingController _name =
      TextEditingController(text: widget.initial?.name ?? '');
  late ProfileKind _kind = widget.initial?.kind ?? ProfileKind.adult;
  late String _seed = widget.initial?.avatarSeed ?? 'lumi';

  static const _seeds = <String>[
    'lumi', 'fox', 'bear', 'panda', 'cat', 'rabbit', 'dragon', 'unicorn'
  ];

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  void _save() {
    final n = _name.text.trim();
    if (n.isEmpty) return;
    Navigator.of(context).pop(
      _ProfileDraft(name: n, kind: _kind, avatarSeed: _seed),
    );
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;
    final isNew = widget.initial == null;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + viewInsets),
      child: StickerCard(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _SectionLabel(
              icon: Icons.person_add_alt_rounded,
              label: isNew ? 'Invite reader' : 'Edit reader',
            ),
            const SizedBox(height: 14),
            QuestInput(
              controller: _name,
              label: 'NAME',
              hint: 'Reader name',
            ),
            const SizedBox(height: 14),
            const Padding(
              padding: EdgeInsets.only(left: 6, bottom: 6),
              child: Text(
                'AVATAR',
                style: TextStyle(
                  color: T.inkSoft,
                  fontWeight: FontWeight.w900,
                  fontSize: 11,
                  letterSpacing: 1.2,
                  fontFamily: 'Nunito',
                ),
              ),
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final s in _seeds)
                  GestureDetector(
                    onTap: () => setState(() => _seed = s),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 120),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _seed == s ? T.saffronDeep : T.ink,
                          width: _seed == s ? 2.6 : 1.4,
                        ),
                        boxShadow:
                            _seed == s ? T.stickerShadow(y: 3) : null,
                      ),
                      child: _AvatarBubble(seed: s, size: 48),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _KindChip(
                    label: 'Adult',
                    selected: _kind == ProfileKind.adult,
                    onTap: () => setState(() => _kind = ProfileKind.adult),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _KindChip(
                    label: 'Child',
                    selected: _kind == ProfileKind.child,
                    onTap: () => setState(() => _kind = ProfileKind.child),
                  ),
                ),
              ],
            ),
            if (_kind == ProfileKind.child)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Child profiles always run with family-safe mode on.',
                  style: TextStyle(
                    color: T.inkSoft,
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
            const SizedBox(height: 18),
            QuestButton(
              label: isNew ? 'Add reader' : 'Save changes',
              onPressed: _save,
            ),
          ],
        ),
      ),
    );
  }
}

class _KindChip extends StatelessWidget {
  const _KindChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? T.coral.withValues(alpha: 0.18) : T.paper,
          borderRadius: BorderRadius.circular(T.radiusMd),
          border: Border.all(
            color: selected ? T.coralDeep : T.ink,
            width: selected ? 2 : 1.4,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? T.coralDeep : T.ink,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w900,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────── Danger zone card ───────────────────────────

class _DangerCard extends StatelessWidget {
  const _DangerCard({required this.onDeleteAccount});
  final VoidCallback onDeleteAccount;

  @override
  Widget build(BuildContext context) {
    return StickerCard(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: T.coral.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: T.coralDeep,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'DANGER ZONE',
                style: const TextStyle(
                  color: T.coralDeep,
                  fontFamily: 'Nunito',
                  fontWeight: FontWeight.w900,
                  fontSize: 11,
                  letterSpacing: 1.4,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Deleting your account permanently removes all books, '
            'translations, progress, AI chats, and account data. '
            'This cannot be undone.',
            style: TextStyle(
              color: T.inkSoft,
              fontFamily: 'Nunito',
              fontWeight: FontWeight.w700,
              fontSize: 13,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          QuestButton(
            label: 'Delete account',
            icon: Icons.delete_forever_rounded,
            color: T.coral,
            foreground: Colors.white,
            onPressed: onDeleteAccount,
          ),
        ],
      ),
    );
  }
}
