#!/usr/bin/env python3
"""Generate Google Play Store feature graphic (1024×500) and finalize icon (512×512)."""
import base64, subprocess, math
from pathlib import Path

CWD   = Path(__file__).parent
FONTS = CWD / "icon_src/fonts"
OUT   = CWD / "store_screenshots"
OUT.mkdir(exist_ok=True)
TMP   = OUT / "_tmp_fg.html"

CHROMIUM = "chromium"

# ── Fonts ──────────────────────────────────────────────────────────────
def b64(f): return "data:font/woff2;base64," + base64.b64encode((FONTS/f).read_bytes()).decode()
FR_N = b64("fraunces-normal-latin.woff2")
FR_I = b64("fraunces-italic-latin.woff2")
HK   = b64("hk-400-latin.woff2")
FONT_CSS = f"""
@font-face{{font-family:'Fraunces';font-style:normal;font-weight:100 900;src:url({FR_N})format('woff2');}}
@font-face{{font-family:'Fraunces';font-style:italic;font-weight:100 900;src:url({FR_I})format('woff2');}}
@font-face{{font-family:'Hanken Grotesk';font-style:normal;font-weight:100 900;src:url({HK})format('woff2');}}
"""

# ── Brand ──────────────────────────────────────────────────────────────
P   = "#FAF6EE"; P2  = "#F4ECDB"; P3  = "#E5D8BC"
INK = "#20283A"; IS  = "#4A5263"; IM  = "#8A8E96"
SA  = "#E0A458"; SD  = "#C8893E"
SG  = "#7BA17C"; SGD = "#5F8763"
CO  = "#E2786C"; PL  = "#6B5B95"
FR  = "'Fraunces',serif"
HK  = "'Hanken Grotesk',sans-serif"

# ── Reuse phone screen content from screenshots ─────────────────────────
# Library screen at original 182×h scale, will be zoomed into phone frame
def _nav_mini(active="library"):
    items = [
        ("library",'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
        ("upload",'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'),
        ("garden",'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
        ("profile",'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    ]
    its = ""
    for k, path in items:
        c = INK if k == active else IM
        dot = f'<div style="width:3px;height:3px;border-radius:50%;background:{INK};margin-top:1px"></div>' if k == active else ""
        its += f'<div style="display:flex;flex-direction:column;align-items:center;gap:1px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round">{path}</svg>{dot}</div>'
    return f'<div style="position:absolute;bottom:0;left:0;right:0;background:{P};border-top:1px solid {P3};display:flex;justify-content:space-around;padding:5px 0 14px;z-index:50">{its}</div>'

def _book_mini(title, grad, rot, pct, badge="", bc=None):
    bc = bc or SA
    bdg = f'<div style="position:absolute;top:-3px;right:-3px;width:12px;height:12px;border-radius:50%;background:{SA};border:1px solid {P};font-size:5px;font-weight:800;color:white;display:flex;align-items:center;justify-content:center">{badge}</div>' if badge else ""
    return f'''<div style="background:{P};border-radius:10px;border:1.2px solid {INK};padding:6px;position:relative;box-shadow:0 4px 12px rgba(32,40,58,.10);transform:{rot}">
<div style="width:100%;height:52px;border-radius:6px;margin-bottom:4px;background:{grad};display:flex;align-items:flex-end;padding:4px"><span style="font-family:{FR};font-size:6px;font-weight:500;color:white;line-height:1.2;text-shadow:0 1px 3px rgba(0,0,0,.4)">{title}</span></div>
{bdg}<div style="height:2px;background:{P3};border-radius:2px;margin-top:3px;overflow:hidden"><div style="height:100%;width:{pct}%;background:{bc};border-radius:2px"></div></div>
</div>'''

def library_screen(h):
    return f'''<div style="font-family:{HK};background:{P};width:182px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;justify-content:space-between;align-items:center;padding:32px 12px 0">
  <span style="font-size:10px;font-weight:800;color:{INK}">9:41</span>
  <div style="display:flex;gap:3px;align-items:center">
    <svg width="12" height="9" viewBox="0 0 14 10"><rect x="0" y="3" width="3" height="7" rx="1" fill="{INK}"/><rect x="4" y="2" width="3" height="8" rx="1" fill="{INK}"/><rect x="8" y="0" width="3" height="10" rx="1" fill="{INK}"/></svg>
    <svg width="18" height="9" viewBox="0 0 22 11"><rect x="0" y="1" width="18" height="9" rx="2.5" stroke="{INK}" stroke-width="1.2" fill="none"/><rect x="1.6" y="2.6" width="12" height="5.8" rx="1.5" fill="{INK}"/></svg>
  </div>
</div>
<div style="padding:6px 12px 0">
  <div style="font-family:{FR};font-size:10px;color:{IM}">Good morning,</div>
  <div style="font-family:{FR};font-size:17px;font-weight:500;color:{INK};letter-spacing:-0.4px;line-height:1.1;margin-bottom:8px">Ahmed ✦</div>
</div>
<div style="display:flex;gap:4px;padding:0 12px;overflow:hidden;margin-bottom:7px">
  <div style="padding:3px 7px;border-radius:999px;font-size:7px;font-weight:700;background:{INK};color:{P};white-space:nowrap">All</div>
  <div style="padding:3px 7px;border-radius:999px;font-size:7px;font-weight:700;border:1.2px solid {SA};color:{SD};white-space:nowrap">📚 Classics</div>
  <div style="padding:3px 7px;border-radius:999px;font-size:7px;font-weight:700;border:1.2px solid {SG};color:{SGD};white-space:nowrap">🔬 Science</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 12px 48px">
  {_book_mini("Le Petit Prince","linear-gradient(145deg,#C95A4E,#E2786C)","rotate(-1.5deg)","68","3")}
  {_book_mini("Don Quixote","linear-gradient(145deg,#4A5263,#20283A)","rotate(1.2deg)","24")}
  {_book_mini("L'Alchimiste","linear-gradient(145deg,#5F8763,#7BA17C)","rotate(0.8deg)","45","7",bc=SG)}
  {_book_mini("1001 Nuits","linear-gradient(145deg,#5B4B85,#6B5B95)","rotate(-0.6deg)","12",bc=PL)}
</div>
{_nav_mini("library")}
</div>'''

def reader_screen(h):
    return f'''<div style="font-family:{HK};background:#1C2234;width:182px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;align-items:center;gap:5px;padding:32px 12px 7px">
  <div style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center">
    <svg width="7" height="11" viewBox="0 0 8 13"><path d="M7 1L1 6.5 7 12" stroke="rgba(250,246,238,.7)" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
  </div>
  <div style="font-size:8px;font-weight:700;color:rgba(250,246,238,.8);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Le Petit Prince</div>
  <div style="display:flex;gap:2px">
    <div style="padding:2px 6px;border-radius:20px;font-size:6.5px;font-weight:700;background:{SA};color:{INK}">Read</div>
    <div style="padding:2px 6px;border-radius:20px;font-size:6.5px;font-weight:700;color:rgba(250,246,238,.4)">Chat</div>
  </div>
</div>
<div style="padding:5px 14px 0">
  <div style="font-family:{FR};font-size:9.5px;line-height:1.9;color:rgba(250,246,238,.78);margin-bottom:9px">
    On ne voit bien qu'avec le cœur. <span style="background:rgba(224,164,88,.28);color:#F0C27A;border-radius:3px;padding:1px 2px;border-bottom:1.5px solid {SA}">L'essentiel</span> est invisible pour les yeux.
  </div>
</div>
<div style="margin:4px 8px 0;background:{P};border-radius:12px;padding:9px 10px;box-shadow:0 6px 24px rgba(0,0,0,.45);border:1px solid {P3};position:relative">
  <div style="position:absolute;top:-5px;left:28px;width:10px;height:10px;background:{P};border-left:1px solid {P3};border-top:1px solid {P3};transform:rotate(45deg)"></div>
  <div style="font-size:6px;font-weight:700;letter-spacing:1px;color:{IM};text-transform:uppercase;margin-bottom:3px">🇫🇷 Français</div>
  <div style="font-family:{FR};font-size:14px;font-weight:500;color:{INK}">L'essentiel</div>
  <div style="font-size:7px;color:{SGD};font-weight:600;margin-bottom:4px">/lesɑ̃sjɛl/ · noun</div>
  <div style="font-size:7.5px;color:{IS};line-height:1.45;margin-bottom:7px">The essential; what is most important.</div>
  <div style="display:flex;gap:4px">
    <div style="padding:3px 8px;border-radius:999px;font-size:6.5px;font-weight:700;background:{SA};color:white">✦ Highlight</div>
    <div style="padding:3px 8px;border-radius:999px;font-size:6.5px;font-weight:700;border:1px solid {INK};color:{INK}">Ask Lumi</div>
  </div>
</div>
</div>'''

# ── Phone frame builder ────────────────────────────────────────────────
def phone_frame(inner_html, orig_h, phone_w, phone_h, left, top, zoom_extra=1.0):
    pp = 10  # padding
    sw = phone_w - pp * 2
    sh = phone_h - pp * 2
    zoom = (sw / 182) * zoom_extra
    pr = int(phone_w * 0.24)   # border radius
    sr = int(phone_w * 0.2)    # screen radius
    di_w = int(phone_w * 0.62)
    di_h = int(phone_w * 0.135)
    di_t = int(phone_w * 0.06)
    return f'''<div style="position:absolute;left:{left}px;top:{top}px;
      width:{phone_w}px;height:{phone_h}px;
      background:#101014;
      border-radius:{pr}px;
      border:2px solid rgba(255,255,255,0.12);
      box-shadow:0 20px 60px rgba(0,0,0,0.75),0 8px 24px rgba(0,0,0,0.5);
      overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);z-index:20"></div>
      <div style="position:absolute;top:{di_t}px;left:50%;transform:translateX(-50%);
        width:{di_w}px;height:{di_h}px;background:#101014;border-radius:{di_h}px;z-index:100"></div>
      <div style="position:absolute;top:{pp}px;left:{pp}px;
        width:{sw}px;height:{sh}px;border-radius:{sr}px;overflow:hidden">
        <div style="zoom:{zoom:.4f};width:182px;height:{orig_h}px">{inner_html}</div>
      </div>
    </div>'''

# ── Feature graphic HTML ───────────────────────────────────────────────
def feature_graphic_html():
    W, H = 1024, 500

    # Phone sizes and positions
    # Main phone (library): right side, tall
    PW1, PH1 = 186, 404   # 19.5:9 ratio: 186*2.167=403
    ORIG_H1 = math.ceil((PH1 - 20) / (176/182))  # approx
    P1_LEFT = 700
    P1_TOP  = (H - PH1) // 2   # 48

    # Second phone (reader): behind main, slightly offset
    PW2, PH2 = 152, 330
    ORIG_H2 = math.ceil((PH2 - 20) / (142/182))
    P2_LEFT = 835
    P2_TOP  = (H - PH2) // 2 + 20  # 95

    lib_h1  = math.ceil((PH1 - 20) / ((PW1-20)/182))
    read_h2 = math.ceil((PH2 - 20) / ((PW2-20)/182))

    phone1 = phone_frame(library_screen(lib_h1),  lib_h1,  PW1, PH1, P1_LEFT, P1_TOP)
    phone2 = phone_frame(reader_screen(read_h2),  read_h2, PW2, PH2, P2_LEFT, P2_TOP)

    return f'''<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
{FONT_CSS}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:{INK}}}
</style></head>
<body>
<div style="width:{W}px;height:{H}px;background:{INK};position:relative;overflow:hidden">

  <!-- Warm saffron glow — left -->
  <div style="position:absolute;width:700px;height:700px;border-radius:50%;
    background:radial-gradient(circle,rgba(224,164,88,0.14) 0%,transparent 58%);
    top:-150px;left:-100px;pointer-events:none"></div>

  <!-- Plum glow — right -->
  <div style="position:absolute;width:500px;height:500px;border-radius:50%;
    background:radial-gradient(circle,rgba(107,91,149,0.18) 0%,transparent 60%);
    bottom:-120px;right:280px;pointer-events:none"></div>

  <!-- Subtle dot grid texture -->
  <svg style="position:absolute;inset:0;opacity:0.045;pointer-events:none" width="{W}" height="{H}">
    <defs><pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="14" cy="14" r="1.4" fill="{P}"/>
    </pattern></defs>
    <rect width="{W}" height="{H}" fill="url(#dots)"/>
  </svg>

  <!-- Left content block -->
  <div style="position:absolute;top:0;left:0;bottom:0;width:670px;
    display:flex;flex-direction:column;justify-content:center;padding:0 64px">

    <!-- Eyebrow badge -->
    <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:22px;width:fit-content">
      <div style="width:6px;height:6px;border-radius:50%;background:{SA}"></div>
      <span style="font-family:{HK};font-size:12px;font-weight:800;letter-spacing:3px;
        text-transform:uppercase;color:{SA};opacity:0.9">AI-Powered Language Learning</span>
    </div>

    <!-- Headline -->
    <div style="font-family:{FR};font-size:68px;font-weight:400;color:{P};
      letter-spacing:-2.5px;line-height:1.03;margin-bottom:22px">
      Read books.<br><em style="color:{SA}">Learn languages.</em>
    </div>

    <!-- Sub-headline -->
    <div style="font-family:{HK};font-size:16px;font-weight:500;
      color:rgba(250,246,238,0.55);line-height:1.6;margin-bottom:32px;max-width:440px">
      Upload any book. Tap words to translate. Chat with Lumi AI.<br>
      Build your vocabulary as you read.
    </div>

    <!-- Feature pills -->
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <div style="padding:8px 18px;border-radius:999px;font-size:13px;font-weight:700;
        background:{SA};color:{INK}">📖 Tap to Translate</div>
      <div style="padding:8px 18px;border-radius:999px;font-size:13px;font-weight:700;
        border:1.5px solid rgba(250,246,238,0.2);color:rgba(250,246,238,0.75)">🦉 Lumi AI Chat</div>
      <div style="padding:8px 18px;border-radius:999px;font-size:13px;font-weight:700;
        border:1.5px solid rgba(250,246,238,0.2);color:rgba(250,246,238,0.75)">🌿 Word Garden</div>
    </div>
  </div>

  <!-- Vertical separator line -->
  <div style="position:absolute;left:640px;top:60px;bottom:60px;width:1px;
    background:linear-gradient(to bottom,transparent,rgba(250,246,238,0.08),transparent)"></div>

  <!-- Phone 2 (reader, behind) -->
  {phone2}

  <!-- Phone 1 (library, front) -->
  {phone1}

</div>
</body></html>'''

# ── Capture ────────────────────────────────────────────────────────────
def capture(html, out_png, w, h):
    TMP.write_text(html, encoding="utf-8")
    subprocess.run([
        CHROMIUM, "--headless=new", "--no-sandbox", "--disable-gpu",
        f"--window-size={w},{h}",
        f"--screenshot={out_png}",
        "--hide-scrollbars", "--force-device-scale-factor=1",
        f"file://{TMP.resolve()}"
    ], check=True, timeout=25)

def png_to_jpg(png, quality=97):
    jpg = str(png).replace(".png", ".jpg")
    subprocess.run(["magick", str(png), "-quality", str(quality), jpg], check=True)
    Path(png).unlink()
    return jpg

# ── Generate ───────────────────────────────────────────────────────────
print("Generating Play Store feature graphic (1024×500)...")
fg_png = OUT / "playstore_feature_graphic.png"
capture(feature_graphic_html(), fg_png, 1024, 500)
fg_jpg = png_to_jpg(fg_png, quality=97)
print(f"  ✓ {Path(fg_jpg).name}  ({Path(fg_jpg).stat().st_size // 1024} KB)")

print("\nVerifying Play Store icon (512×512)...")
icon = OUT / "playstore_icon_512.png"
result = subprocess.run(["identify", "-format", "%wx%h %b", str(icon)], capture_output=True, text=True)
print(f"  ✓ playstore_icon_512.png  {result.stdout.strip()}")

TMP.unlink(missing_ok=True)
print("\nPlay Store assets ready in store_screenshots/")
print("  • playstore_feature_graphic.jpg  (1024×500)")
print("  • playstore_icon_512.png         (512×512)")
