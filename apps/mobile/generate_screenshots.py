#!/usr/bin/env python3
"""Generate Translify App Store & Google Play screenshots at production resolution."""
import base64, subprocess, math
from pathlib import Path

CWD   = Path(__file__).parent
FONTS = CWD / "icon_src/fonts"
OUT   = CWD / "store_screenshots"
OUT.mkdir(exist_ok=True)
TMP   = OUT / "_tmp.html"

CHROMIUM = "chromium"

# ── Brand tokens ───────────────────────────────────────────────────────
P   = "#FAF6EE"; P2  = "#F4ECDB"; P3  = "#E5D8BC"
INK = "#20283A"; IS  = "#4A5263"; IM  = "#8A8E96"
SA  = "#E0A458"; SD  = "#C8893E"
SG  = "#7BA17C"; SGD = "#5F8763"
CO  = "#E2786C"; PL  = "#6B5B95"

# ── Fonts (base64 local files for reliable headless rendering) ─────────
def b64(f): return "data:font/woff2;base64," + base64.b64encode((FONTS/f).read_bytes()).decode()
FR_N = b64("fraunces-normal-latin.woff2")
FR_I = b64("fraunces-italic-latin.woff2")
HK   = b64("hk-400-latin.woff2")
FONT_CSS = f"""
@font-face{{font-family:'Fraunces';font-style:normal;font-weight:100 900;src:url({FR_N})format('woff2');}}
@font-face{{font-family:'Fraunces';font-style:italic;font-weight:100 900;src:url({FR_I})format('woff2');}}
@font-face{{font-family:'Hanken Grotesk';font-style:normal;font-weight:100 900;src:url({HK})format('woff2');}}
"""

HK = "'Hanken Grotesk',sans-serif"
FR = "'Fraunces',serif"

# ── Screen content builders (at base 182px width) ─────────────────────
def _nav(active):
    items = [
        ("library","Library",'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
        ("upload","Upload",'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'),
        ("garden","Garden",'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
        ("profile","Profile",'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    ]
    its = ""
    for k, label, path in items:
        c = INK if k==active else IM
        dot = f'<div style="width:4px;height:4px;border-radius:50%;background:{INK};margin-top:1px"></div>' if k==active else ""
        its += f'<div style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:6.5px;font-weight:700;color:{c};letter-spacing:.2px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round">{path}</svg>{label}{dot}</div>'
    return f'<div style="position:absolute;bottom:0;left:0;right:0;background:{P};border-top:1.2px solid {P3};display:flex;justify-content:space-around;padding:6px 0 18px;z-index:50">{its}</div>'

def _book(title, author, grad, rot, pct, badge="", bc=None):
    bc = bc or SA
    bdg = f'<div style="position:absolute;top:-4px;right:-4px;width:15px;height:15px;border-radius:50%;background:{SA};border:1.5px solid {P};font-size:6.5px;font-weight:800;color:white;display:flex;align-items:center;justify-content:center">{badge}</div>' if badge else ""
    return f'''<div style="background:{P};border-radius:14px;border:1.5px solid {INK};padding:8px;position:relative;box-shadow:0 6px 18px rgba(32,40,58,.10);transform:{rot}">
<div style="width:100%;height:66px;border-radius:8px;margin-bottom:6px;background:{grad};display:flex;align-items:flex-end;padding:6px"><span style="font-family:{FR};font-size:7.5px;font-weight:500;color:white;line-height:1.2;text-shadow:0 1px 4px rgba(0,0,0,.4)">{title}</span></div>
{bdg}<div style="font-family:{FR};font-size:8px;font-weight:500;color:{INK};line-height:1.3">{title}</div>
<div style="font-size:6.5px;color:{IM};margin-top:2px">{author}</div>
<div style="height:2.5px;background:{P3};border-radius:2px;margin-top:5px;overflow:hidden"><div style="height:100%;width:{pct}%;background:{bc};border-radius:2px"></div></div>
</div>'''

def screen_library(h):
    return f'''<div style="font-family:{HK};background:{P};width:182px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;justify-content:space-between;align-items:center;padding:40px 14px 0">
  <span style="font-size:12px;font-weight:800;color:{INK}">9:41</span>
  <div style="display:flex;gap:4px;align-items:center">
    <svg width="14" height="10" viewBox="0 0 14 10"><rect x="0" y="3" width="3" height="7" rx="1" fill="{INK}"/><rect x="4" y="2" width="3" height="8" rx="1" fill="{INK}"/><rect x="8" y="0" width="3" height="10" rx="1" fill="{INK}"/><rect x="12" y="1" width="2" height="9" rx="1" fill="{INK}" opacity="0.3"/></svg>
    <svg width="22" height="11" viewBox="0 0 22 11"><rect x="0" y="1" width="18" height="9" rx="2.5" stroke="{INK}" stroke-width="1.2" fill="none"/><rect x="1.6" y="2.6" width="13" height="5.8" rx="1.5" fill="{INK}"/><rect x="18.5" y="3.5" width="2" height="4" rx="1" fill="{INK}" opacity="0.5"/></svg>
  </div>
</div>
<div style="padding:8px 14px 0">
  <div style="font-family:{FR};font-size:12px;color:{IM}">Good morning,</div>
  <div style="font-family:{FR};font-size:20px;font-weight:500;color:{INK};letter-spacing:-0.5px;line-height:1.1;margin-bottom:10px">Ahmed ✦</div>
</div>
<div style="display:flex;gap:5px;padding:0 14px;overflow:hidden;margin-bottom:8px">
  <div style="padding:4px 9px;border-radius:999px;font-size:8px;font-weight:700;background:{INK};color:{P};border:1.4px solid {INK};white-space:nowrap">All</div>
  <div style="padding:4px 9px;border-radius:999px;font-size:8px;font-weight:700;border:1.4px solid {SA};color:{SD};white-space:nowrap">📚 Classics</div>
  <div style="padding:4px 9px;border-radius:999px;font-size:8px;font-weight:700;border:1.4px solid {SG};color:{SGD};white-space:nowrap">🔬 Science</div>
  <div style="padding:4px 9px;border-radius:999px;font-size:8px;font-weight:700;border:1.4px solid {CO};color:{CO};white-space:nowrap">🌍 Travel</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 14px 60px">
  {_book("Le Petit Prince","Saint-Exupéry","linear-gradient(145deg,#C95A4E,#E2786C)","rotate(-1.5deg)","68","3")}
  {_book("Don Quixote","Cervantes","linear-gradient(145deg,#4A5263,#20283A)","rotate(1.2deg)","24")}
  {_book("L'Alchimiste","Coelho","linear-gradient(145deg,#5F8763,#7BA17C)","rotate(0.8deg)","45","7",bc=SG)}
  {_book("1001 Nuits","Anonyme","linear-gradient(145deg,#5B4B85,#6B5B95)","rotate(-0.6deg)","12",bc=PL)}
</div>
{_nav("library")}
</div>'''

def screen_reader(h):
    return f'''<div style="font-family:{HK};background:#1C2234;width:182px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;align-items:center;gap:6px;padding:38px 14px 8px">
  <div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center">
    <svg width="8" height="13" viewBox="0 0 8 13"><path d="M7 1L1 6.5 7 12" stroke="rgba(250,246,238,.7)" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
  </div>
  <div style="font-size:9.5px;font-weight:700;color:rgba(250,246,238,.8);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Le Petit Prince</div>
  <div style="display:flex;gap:3px">
    <div style="padding:2px 7px;border-radius:20px;font-size:7.5px;font-weight:700;background:{SA};color:{INK}">Read</div>
    <div style="padding:2px 7px;border-radius:20px;font-size:7.5px;font-weight:700;color:rgba(250,246,238,.4)">Trans.</div>
    <div style="padding:2px 7px;border-radius:20px;font-size:7.5px;font-weight:700;color:rgba(250,246,238,.4)">Chat</div>
  </div>
</div>
<div style="padding:6px 16px 0">
  <div style="font-family:{FR};font-size:10.5px;line-height:2.0;color:rgba(250,246,238,.78);margin-bottom:10px">
    On ne voit bien qu'avec le cœur. <span style="background:rgba(224,164,88,.28);color:#F0C27A;border-radius:3px;padding:1px 2px;border-bottom:1.5px solid {SA}">L'essentiel</span> est invisible pour les yeux.
  </div>
  <div style="font-family:{FR};font-size:10.5px;line-height:2.0;color:rgba(250,246,238,.78)">
    Il faut chercher avec le cœur, car c'est là que réside la véritable <span style="background:rgba(224,164,88,.28);color:#F0C27A;border-radius:3px;padding:1px 2px;border-bottom:1.5px solid {SA}">sagesse</span>.
  </div>
</div>
<div style="margin:10px 10px 0;background:{P};border-radius:14px;padding:10px 12px;box-shadow:0 8px 32px rgba(0,0,0,.45);border:1px solid {P3};position:relative">
  <div style="position:absolute;top:-6px;left:32px;width:12px;height:12px;background:{P};border-left:1px solid {P3};border-top:1px solid {P3};transform:rotate(45deg)"></div>
  <div style="font-size:6.5px;font-weight:700;letter-spacing:1.5px;color:{IM};text-transform:uppercase;margin-bottom:4px">🇫🇷 Français</div>
  <div style="font-family:{FR};font-size:16px;font-weight:500;color:{INK};letter-spacing:-0.3px">L'essentiel</div>
  <div style="font-size:7.5px;color:{SGD};font-weight:600;margin-bottom:5px">/lesɑ̃sjɛl/ · noun</div>
  <div style="font-size:8px;color:{IS};line-height:1.5;margin-bottom:8px">The essential; what is most important.</div>
  <div style="display:flex;gap:5px">
    <div style="padding:4px 9px;border-radius:999px;font-size:7px;font-weight:700;background:{SA};color:white">✦ Highlight</div>
    <div style="padding:4px 9px;border-radius:999px;font-size:7px;font-weight:700;border:1.2px solid {INK};color:{INK}">+ Garden</div>
    <div style="padding:4px 9px;border-radius:999px;font-size:7px;font-weight:700;border:1.2px solid {INK};color:{INK}">Ask Lumi</div>
  </div>
</div>
</div>'''

def screen_chat(h):
    return f'''<div style="font-family:{HK};background:{P};width:182px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;align-items:center;gap:8px;padding:38px 14px 8px;border-bottom:1px solid {P3}">
  <div style="width:28px;height:28px;border-radius:50%;background:{SA};border:1.5px solid {INK};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">🦉</div>
  <div style="flex:1"><div style="font-size:10px;font-weight:800;color:{INK}">Lumi</div><div style="font-size:7px;color:{SGD};font-weight:600">● Online · reading with you</div></div>
  <div style="padding:3px 8px;background:{P2};border:1px solid {P3};border-radius:20px;font-size:6.5px;color:{IS};font-weight:600;max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Le Petit Prince</div>
</div>
<div style="padding:10px 12px;display:flex;flex-direction:column;gap:7px;padding-bottom:52px">
  <div style="display:flex;flex-direction:row-reverse"><div style="max-width:75%;padding:6px 9px;font-size:8.5px;line-height:1.5;background:{INK};color:{P};border-radius:12px 12px 3px 12px">What does "L'essentiel est invisible" actually mean?</div></div>
  <div style="display:flex;align-items:flex-end;gap:5px">
    <div style="width:20px;height:20px;border-radius:50%;background:{SA};border:1px solid {INK};display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;margin-bottom:2px">🦉</div>
    <div style="max-width:75%;padding:6px 9px;font-size:8.5px;line-height:1.5;background:{P2};border:1px solid {P3};color:{INK};border-radius:12px 12px 12px 3px">It's the book's most famous line — <span style="color:{SD};font-weight:700">what truly matters can't be seen with eyes</span>, only felt with the heart.</div>
  </div>
  <div style="display:flex;flex-direction:row-reverse"><div style="max-width:75%;padding:6px 9px;font-size:8.5px;line-height:1.5;background:{INK};color:{P};border-radius:12px 12px 3px 12px">Is "essentiel" related to essence?</div></div>
  <div style="display:flex;align-items:flex-end;gap:5px">
    <div style="width:20px;height:20px;border-radius:50%;background:{SA};border:1px solid {INK};display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;margin-bottom:2px">🦉</div>
    <div style="max-width:75%;padding:6px 9px;font-size:8.5px;line-height:1.5;background:{P2};border:1px solid {P3};color:{INK};border-radius:12px 12px 12px 3px">Exactly! Both come from Latin <span style="color:{SD};font-weight:700">essentia</span> → "being." In French, essentiel means what's at the core.</div>
  </div>
  <div style="display:flex;align-items:flex-end;gap:5px">
    <div style="width:20px;height:20px;border-radius:50%;background:{SA};border:1px solid {INK};display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;margin-bottom:2px">🦉</div>
    <div style="padding:7px 12px;background:{P2};border:1px solid {P3};border-radius:12px 12px 12px 3px;display:flex;gap:3px;align-items:center">
      <div style="width:5px;height:5px;border-radius:50%;background:{IM}"></div><div style="width:5px;height:5px;border-radius:50%;background:{IM};opacity:.6"></div><div style="width:5px;height:5px;border-radius:50%;background:{IM};opacity:.4"></div>
    </div>
  </div>
</div>
<div style="position:absolute;bottom:0;left:0;right:0;padding:6px 10px 18px;background:{P};border-top:1px solid {P3};display:flex;gap:6px;align-items:center">
  <div style="flex:1;background:{P2};border:1.2px solid {P3};border-radius:20px;padding:5px 10px;font-size:7.5px;color:{IM}">Ask about this book…</div>
  <div style="width:24px;height:24px;border-radius:50%;background:{SA};border:1.5px solid {INK};display:flex;align-items:center;justify-content:center;flex-shrink:0">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" stroke="{INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
</div>
</div>'''

def _wcard(em, lang, word, defn, stars, rot):
    s = "".join([f'<span style="font-size:8px">{"⭐" if i<int(stars) else "☆"}</span>' for i in range(5)])
    return f'''<div style="background:white;border:1.4px solid #C5D9C2;border-radius:14px;padding:8px;box-shadow:0 3px 10px rgba(95,135,99,.1);transform:{rot}">
<div style="font-size:18px;margin-bottom:3px;line-height:1">{em}</div>
<div style="font-size:6.5px;font-weight:700;letter-spacing:1.5px;color:{SGD};text-transform:uppercase;margin-bottom:3px">{lang}</div>
<div style="font-family:{FR};font-size:11px;font-weight:500;color:{INK};margin-bottom:2px">{word}</div>
<div style="font-size:7.5px;color:{IS};line-height:1.4;margin-bottom:6px">{defn}</div>
<div style="display:flex;gap:2px">{s}</div>
</div>'''

def screen_garden(h):
    return f'''<div style="font-family:{HK};background:#EEF5EC;width:182px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;justify-content:space-between;align-items:center;padding:38px 14px 0"><span style="font-size:10.5px;font-weight:800;color:{INK}">9:41</span></div>
<div style="padding:4px 14px 8px">
  <div style="font-size:8px;font-weight:800;letter-spacing:2px;color:{SGD};text-transform:uppercase;margin-bottom:2px">Word Garden</div>
  <div style="font-family:{FR};font-size:18px;font-weight:400;color:{INK};letter-spacing:-0.4px;margin-bottom:8px">47 words<br><em>growing 🌱</em></div>
  <div style="display:flex;align-items:center;gap:7px">
    <div style="flex:1;height:5px;background:rgba(95,135,99,.2);border-radius:3px;overflow:hidden"><div style="height:100%;width:58%;background:{SG};border-radius:3px"></div></div>
    <div style="font-size:7px;font-weight:700;color:{SGD}">580 / 1000 XP</div>
  </div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:4px 12px 60px">
  {_wcard("🌟","FR","essentiel","essential; what matters most","3","rotate(-1deg)")}
  {_wcard("🦊","FR","apprivoiser","to tame; to build a bond","2","rotate(.7deg)")}
  {_wcard("💧","FR","sagesse","wisdom; sound judgement","4","rotate(.5deg)")}
  {_wcard("🌍","FR","ennuyer","to bore; to annoy","1","rotate(-.8deg)")}
</div>
{_nav("garden")}
</div>'''

def _feat(icon, txt, sub):
    return f'<div style="display:flex;align-items:center;gap:7px"><div style="width:20px;height:20px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;border:1px solid {P3};background:{P2}">{icon}</div><div style="font-size:8px;font-weight:600;color:{INK}">{txt} <span style="color:{IM};font-weight:500">{sub}</span></div></div>'

def screen_paywall(h):
    return f'''<div style="font-family:{HK};background:{P};width:182px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;align-items:center;gap:10px;padding:38px 14px 10px;border-bottom:1px solid {P3}">
  <div style="width:44px;height:44px;border-radius:50%;background:{SA};border:2px solid {INK};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;box-shadow:0 4px 14px rgba(224,164,88,.3)">🦉</div>
  <div>
    <div style="display:inline-flex;background:{P2};border:1px solid {P3};border-radius:20px;padding:2px 7px;font-size:7px;font-weight:700;color:{SD};margin-bottom:4px;letter-spacing:.5px">✦ Translify Pro</div>
    <div style="font-family:{FR};font-size:15px;font-weight:500;color:{INK};letter-spacing:-0.3px;line-height:1.2">You're one step<br>from fluency.</div>
  </div>
</div>
<div style="padding:8px 14px 6px;display:flex;flex-direction:column;gap:5px">
  {_feat("📚","Unlimited books & uploads","· any language")}
  {_feat("🦉","Lumi AI chat on every book","· ask anything")}
  {_feat("✦","Highlight & notes","· with AI insights")}
  {_feat("🌿","Word garden & quizzes","· build vocab")}
  {_feat("📖","Offline reading","· no connection needed")}
</div>
<div style="display:flex;gap:6px;padding:6px 14px">
  <div style="flex:1;border:1.5px solid {P3};border-radius:14px;padding:8px;text-align:center">
    <div style="font-size:7.5px;font-weight:700;color:{IM};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Monthly</div>
    <div style="font-family:{FR};font-size:18px;font-weight:500;color:{INK}">$7</div>
    <div style="font-size:6.5px;color:{IM}">/month</div>
  </div>
  <div style="flex:1;border:1.5px solid {SA};border-radius:14px;padding:8px;text-align:center;background:#FFFBF2;position:relative">
    <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:{SD};color:white;font-size:6px;font-weight:800;border-radius:20px;padding:2px 7px;white-space:nowrap;letter-spacing:.5px">BEST VALUE</div>
    <div style="font-size:7.5px;font-weight:700;color:{IM};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Yearly</div>
    <div style="font-family:{FR};font-size:18px;font-weight:500;color:{INK}">$39</div>
    <div style="font-size:6.5px;color:{IM}">/year · save 53%</div>
  </div>
</div>
<div style="margin:6px 14px 0;background:{INK};color:{P};border-radius:16px;padding:8px;font-size:8.5px;font-weight:800;text-align:center">Start 7-Day Free Trial →</div>
<div style="font-size:7px;color:{IM};text-align:center;padding:5px 0 2px">Maybe later</div>
<div style="font-size:6px;color:{IM};text-align:center;padding:0 14px;line-height:1.5">Cancel anytime · Auto-renews after trial</div>
</div>'''

SCREEN_FNS = {
    "library": screen_library,
    "reader":  screen_reader,
    "chat":    screen_chat,
    "garden":  screen_garden,
    "paywall": screen_paywall,
}

SCREENS = [
    {"id":"library","num":"01","bg":"#2A200A","tc":"#FFF0D4","label":"Library",   "hl":"Every book\nyou love,\norganized.",      "body":"Folders, covers & progress — your shelf, your way."},
    {"id":"reader", "num":"02","bg":"#0F1E12","tc":"#E4F0E5","label":"Reader",    "hl":"Tap any word.\nUnderstand it.",           "body":"Instant definitions & context — right where you're reading."},
    {"id":"chat",   "num":"03","bg":"#0C0F16","tc":"#DDE3F0","label":"AI Chat",   "hl":"Ask Lumi\nanything.",                     "body":"Your AI reading companion — answers questions, sparks curiosity."},
    {"id":"garden", "num":"04","bg":"#0C1A0E","tc":"#D4EDD4","label":"Word Garden","hl":"Words you\nsaved, growing.",             "body":"Vocabulary from your reading, organized and ready to review."},
    {"id":"paywall","num":"05","bg":"#120D1E","tc":"#E8E4F5","label":"Premium",   "hl":"Unlock\neverything.",                     "body":"Unlimited books, AI chat, word garden. Start free for 7 days."},
]

# ── Platform specs ─────────────────────────────────────────────────────
PLATFORMS = {
    "appstore":  {"W":1290,"H":2796,"PW":640,"PH":1400,"PP":14,"PR":100,"SR":86,"DIW":220,"DIH":50,"DIT":26},
    "playstore": {"W":1080,"H":1920,"PW":534,"PH":1160,"PP":12,"PR":84, "SR":72,"DIW":184,"DIH":42,"DIT":22},
}

def make_html(cfg, plat):
    sp = PLATFORMS[plat]
    W,H    = sp["W"], sp["H"]
    PW,PH  = sp["PW"], sp["PH"]
    PP     = sp["PP"]
    PR,SR  = sp["PR"], sp["SR"]
    DIW,DIH,DIT = sp["DIW"], sp["DIH"], sp["DIT"]

    SW = PW - PP*2          # screen width
    SH = PH - PP*2          # screen height
    ZOOM = SW / 182         # scale factor
    ORIG_H = math.ceil(SH / ZOOM)  # inner content height (pre-zoom)

    PL = (W - PW) // 2     # phone left margin

    # Caption sizing
    cap_px  = int(W * 0.08)
    hl_size = int(W * 0.071)
    body_size = int(W * 0.026)
    num_size  = int(W * 0.014)

    # Phone top: leave room for caption
    cap_h = int(H * 0.24)
    PT = cap_h + int(H * 0.015)

    hl_lines = cfg["hl"].replace("\n", "<br>")
    inner = SCREEN_FNS[cfg["id"]](ORIG_H)

    return f'''<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
{FONT_CSS}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:{cfg["bg"]}}}
</style></head>
<body>
<div style="width:{W}px;height:{H}px;background:{cfg["bg"]};position:relative;overflow:hidden">

  <!-- ambient glows -->
  <div style="position:absolute;width:{int(W*1.4)}px;height:{int(W*1.4)}px;border-radius:50%;
    background:radial-gradient(circle,rgba(224,164,88,0.10) 0%,transparent 60%);
    top:-{int(W*0.4)}px;left:-{int(W*0.2)}px;pointer-events:none"></div>
  <div style="position:absolute;width:{W}px;height:{W}px;border-radius:50%;
    background:radial-gradient(circle,rgba(107,91,149,0.13) 0%,transparent 60%);
    bottom:-{int(W*0.3)}px;right:-{int(W*0.2)}px;pointer-events:none"></div>

  <!-- Caption -->
  <div style="position:absolute;top:{int(H*0.03)}px;left:{cap_px}px;right:{cap_px}px">
    <div style="font-family:'Hanken Grotesk',sans-serif;font-size:{num_size}px;font-weight:800;
      letter-spacing:{int(num_size*0.25)}px;text-transform:uppercase;color:{cfg["tc"]};opacity:0.38;margin-bottom:{int(hl_size*0.22)}px">
      {cfg["num"]} — {cfg["label"]}
    </div>
    <div style="font-family:'Fraunces',serif;font-size:{hl_size}px;font-weight:400;
      color:{cfg["tc"]};letter-spacing:{int(-hl_size*0.033)}px;line-height:1.08;margin-bottom:{int(hl_size*0.28)}px">
      {hl_lines}
    </div>
    <div style="font-family:'Hanken Grotesk',sans-serif;font-size:{body_size}px;font-weight:500;
      color:{cfg["tc"]};opacity:0.55;line-height:1.55;max-width:{int(W*0.72)}px">
      {cfg["body"]}
    </div>
  </div>

  <!-- Phone frame -->
  <div style="position:absolute;left:{PL}px;top:{PT}px;
    width:{PW}px;height:{PH}px;
    background:#101014;
    border-radius:{PR}px;
    border:2px solid rgba(255,255,255,0.11);
    box-shadow:0 {int(PH*0.03)}px {int(PH*0.08)}px rgba(0,0,0,0.75),0 {int(PH*0.01)}px {int(PH*0.03)}px rgba(0,0,0,0.5);
    overflow:hidden">

    <!-- top edge shine -->
    <div style="position:absolute;top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);z-index:20"></div>

    <!-- Dynamic Island -->
    <div style="position:absolute;top:{DIT}px;left:50%;transform:translateX(-50%);
      width:{DIW}px;height:{DIH}px;background:#101014;border-radius:{DIH}px;z-index:100"></div>

    <!-- Side buttons -->
    <div style="position:absolute;left:-3px;top:{int(PH*0.155)}px;width:3px;height:{int(PH*0.062)}px;background:#2A2A2E;border-radius:2px 0 0 2px"></div>
    <div style="position:absolute;left:-3px;top:{int(PH*0.24)}px;width:3px;height:{int(PH*0.062)}px;background:#2A2A2E;border-radius:2px 0 0 2px"></div>
    <div style="position:absolute;right:-3px;top:{int(PH*0.22)}px;width:3px;height:{int(PH*0.115)}px;background:#2A2A2E;border-radius:0 2px 2px 0"></div>

    <!-- Screen -->
    <div style="position:absolute;top:{PP}px;left:{PP}px;
      width:{SW}px;height:{SH}px;
      border-radius:{SR}px;overflow:hidden">
      <div style="zoom:{ZOOM:.5f};width:182px;height:{ORIG_H}px">
        {inner}
      </div>
    </div>
  </div>

  <!-- Bottom wordmark -->
  <div style="position:absolute;bottom:{int(H*0.028)}px;left:0;right:0;text-align:center">
    <div style="font-family:'Fraunces',serif;font-size:{int(hl_size*0.28)}px;font-weight:400;
      color:{cfg["tc"]};opacity:0.22;letter-spacing:3px;text-transform:lowercase">translify</div>
  </div>

</div>
</body></html>'''


def capture(html, out_png, w, h):
    TMP.write_text(html, encoding="utf-8")
    subprocess.run([
        CHROMIUM, "--headless=new", "--no-sandbox", "--disable-gpu",
        f"--window-size={w},{h}",
        f"--screenshot={out_png}",
        "--hide-scrollbars", "--force-device-scale-factor=1",
        f"file://{TMP.resolve()}"
    ], check=True, timeout=25)

def png_to_jpg(png, quality=95):
    jpg = str(png).replace(".png", ".jpg")
    subprocess.run(["magick", str(png), "-quality", str(quality), jpg], check=True)
    Path(png).unlink()
    return jpg

# ── Run ────────────────────────────────────────────────────────────────
for plat, spec in PLATFORMS.items():
    label = "App Store (1290×2796)" if plat=="appstore" else "Google Play (1080×1920)"
    print(f"\n{label}")
    for cfg in SCREENS:
        html = make_html(cfg, plat)
        out  = OUT / f"{plat}_{cfg['num']}_{cfg['id']}.png"
        print(f"  {out.name} ...", end=" ", flush=True)
        capture(html, out, spec["W"], spec["H"])
        jpg = png_to_jpg(out)
        print(f"✓ → {Path(jpg).name}")

TMP.unlink(missing_ok=True)
print(f"\nAll screenshots saved to {OUT}/")
