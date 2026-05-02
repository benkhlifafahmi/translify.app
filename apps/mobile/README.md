# Translify Quest — mobile

Flutter app for iOS + Android, talking to the same REST API as the web app.

The mobile flavor is "Translify Quest": a sticker-stack scrapbook UI with a
mascot owl named Polyglot, XP / streak / hearts gamification, and confetti on
quiz wins. Same product, friendlier vibe — designed so a curious nine-year-old
*and* a serious student can both find their way around.

## Stack

- **State**: `provider` + `ChangeNotifier`
- **Networking**: `dio` with a Bearer-token interceptor
- **Persistence**: `flutter_secure_storage` (JWT) + `shared_preferences` (XP/streak/hearts)
- **PDF rendering**: `pdfx`
- **Markdown chat**: `flutter_markdown`
- **FX**: `confetti`, custom `CustomPainter` mascot
- **Type**: `Lilita One` display + `Nunito` body via `google_fonts`

## Run

```bash
cd apps/mobile
flutter pub get
# Default API URL:
#   - Android emulator: http://10.0.2.2:8000  (host loopback)
#   - iOS simulator:    http://localhost:8000
# Override at run time:
flutter run --dart-define=API_URL=https://api.translify.app
```

Tests:

```bash
flutter test
```

## Layout

```
lib/
  api/
    api_client.dart   — Dio + secure-storage token
    models.dart       — typed DTOs
    services.dart     — Auth / Books / Translations / Chats / Quizzes
  state/
    session.dart      — auth state + service handles
    progress.dart     — XP, streak, hearts, badges (local)
  theme/
    tokens.dart       — palette, shadows, ThemeData
  widgets/
    owl_mascot.dart   — Polyglot, the mascot (CustomPainter)
    quest_button.dart — chunky stacked-paper button
    sticker_card.dart — tilted card with shadow
    quest_input.dart  — themed text field
    xp_bar.dart       — HUD: level / streak / hearts
    paper_background.dart — grain + glow canvas
  screens/
    splash_screen.dart
    login_screen.dart
    register_screen.dart
    library_screen.dart
    upload_screen.dart
    book_detail_screen.dart
    panels/
      read_panel.dart
      translate_panel.dart
      chat_panel.dart
      quiz_panel.dart
```

## Notes

- Android cleartext is enabled so the dev API at `10.0.2.2:8000` works.
  In production switch to HTTPS and remove `usesCleartextTraffic`.
- **Arch Linux**: do not use the system `flutter` package — its SDK lives
  at `/usr/lib/flutter` (root-owned), so the Kotlin compiler can't write
  its session lockfile and `flutter build apk` fails. Install Flutter into
  your home directory instead:

  ```bash
  git clone --depth 1 -b stable https://github.com/flutter/flutter.git ~/development/flutter
  echo 'export PATH="$HOME/development/flutter/bin:$PATH"' >> ~/.bashrc
  source ~/.bashrc
  flutter --version   # triggers first-run artifact download
  ```

  This project is verified building against Flutter 3.41.9 (stable) with
  Gradle 8.13 (pinned in `android/gradle/wrapper/gradle-wrapper.properties`).
