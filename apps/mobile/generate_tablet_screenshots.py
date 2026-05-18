#!/usr/bin/env python3
"""Generate Translify tablet screenshots for Google Play (7-inch and 10-inch)."""
import base64, subprocess, math
from pathlib import Path

CWD   = Path(__file__).parent
FONTS = CWD / "icon_src/fonts"
OUT   = CWD / "store_screenshots"
OUT.mkdir(exist_ok=True)
TMP   = OUT / "_tmp_tablet.html"

CHROMIUM = "chromium"

# ── Brand tokens ───────────────────────────────────────────────────────
P   = "#FAF6EE"; P2  = "#F4ECDB"; P3  = "#E5D8BC"
INK = "#20283A"; IS  = "#4A5263"; IM  = "#8A8E96"
SA  = "#E0A458"; SD  = "#C8893E"
SG  = "#7BA17C"; SGD = "#5F8763"
CO  = "#E2786C"; PL  = "#6B5B95"

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
HK_F = "'Hanken Grotesk',sans-serif"
FR_F = "'Fraunces',serif"

# ── Tablet screen builders (base 360px wide) ───────────────────────────

def _nav(active, w):
    items = [
        ("library","Library",'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
        ("upload","Upload",'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'),
        ("garden","Garden",'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
        ("profile","Profile",'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    ]
    its = ""
    for k, label, path in items:
        c = INK if k==active else IM
        dot = f'<div style="width:5px;height:5px;border-radius:50%;background:{INK};margin-top:2px"></div>' if k==active else ""
        its += f'<div style="display:flex;flex-direction:column;align-items:center;gap:3px;font-size:9px;font-weight:700;color:{c}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round">{path}</svg>{label}{dot}</div>'
    return f'<div style="position:absolute;bottom:0;left:0;right:0;background:{P};border-top:1.5px solid {P3};display:flex;justify-content:space-around;padding:9px 0 22px;z-index:50">{its}</div>'

def _book(title, author, grad, rot, pct, badge="", bc=None):
    bc = bc or SA
    bdg = f'<div style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;border-radius:50%;background:{SA};border:2px solid {P};font-size:8px;font-weight:800;color:white;display:flex;align-items:center;justify-content:center">{badge}</div>' if badge else ""
    return f'''<div style="background:{P};border-radius:16px;border:1.5px solid {INK};padding:10px;position:relative;box-shadow:0 6px 18px rgba(32,40,58,.10);transform:{rot}">
<div style="width:100%;height:80px;border-radius:10px;margin-bottom:8px;background:{grad};display:flex;align-items:flex-end;padding:7px"><span style="font-family:{FR_F};font-size:10px;font-weight:500;color:white;line-height:1.2;text-shadow:0 1px 4px rgba(0,0,0,.4)">{title}</span></div>
{bdg}<div style="font-family:{FR_F};font-size:10.5px;font-weight:500;color:{INK};line-height:1.3">{title}</div>
<div style="font-size:9px;color:{IM};margin-top:2px">{author}</div>
<div style="height:3px;background:{P3};border-radius:2px;margin-top:6px;overflow:hidden"><div style="height:100%;width:{pct}%;background:{bc};border-radius:2px"></div></div>
</div>'''

def screen_library(h, w):
    return f'''<div style="font-family:{HK_F};background:{P};width:{w}px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;justify-content:space-between;align-items:center;padding:36px 18px 0">
  <span style="font-size:14px;font-weight:800;color:{INK}">9:41</span>
  <div style="display:flex;gap:5px;align-items:center">
    <svg width="17" height="12" viewBox="0 0 14 10"><rect x="0" y="3" width="3" height="7" rx="1" fill="{INK}"/><rect x="4" y="2" width="3" height="8" rx="1" fill="{INK}"/><rect x="8" y="0" width="3" height="10" rx="1" fill="{INK}"/><rect x="12" y="1" width="2" height="9" rx="1" fill="{INK}" opacity="0.3"/></svg>
    <svg width="26" height="13" viewBox="0 0 22 11"><rect x="0" y="1" width="18" height="9" rx="2.5" stroke="{INK}" stroke-width="1.2" fill="none"/><rect x="1.6" y="2.6" width="13" height="5.8" rx="1.5" fill="{INK}"/><rect x="18.5" y="3.5" width="2" height="4" rx="1" fill="{INK}" opacity="0.5"/></svg>
  </div>
</div>
<div style="padding:10px 18px 0">
  <div style="font-family:{FR_F};font-size:14px;color:{IM}">Good morning,</div>
  <div style="font-family:{FR_F};font-size:24px;font-weight:500;color:{INK};letter-spacing:-0.5px;line-height:1.1;margin-bottom:12px">Ahmed ✦</div>
</div>
<div style="display:flex;gap:7px;padding:0 18px;overflow:hidden;margin-bottom:11px">
  <div style="padding:5px 12px;border-radius:999px;font-size:10px;font-weight:700;background:{INK};color:{P};border:1.5px solid {INK};white-space:nowrap">All</div>
  <div style="padding:5px 12px;border-radius:999px;font-size:10px;font-weight:700;border:1.5px solid {SA};color:{SD};white-space:nowrap">📚 Classics</div>
  <div style="padding:5px 12px;border-radius:999px;font-size:10px;font-weight:700;border:1.5px solid {SG};color:{SGD};white-space:nowrap">🔬 Science</div>
  <div style="padding:5px 12px;border-radius:999px;font-size:10px;font-weight:700;border:1.5px solid {CO};color:{CO};white-space:nowrap">🌍 Travel</div>
  <div style="padding:5px 12px;border-radius:999px;font-size:10px;font-weight:700;border:1.5px solid {PL};color:{PL};white-space:nowrap">🔮 Philosophy</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;padding:0 18px 80px">
  {_book("Le Petit Prince","Saint-Exupéry","linear-gradient(145deg,#C95A4E,#E2786C)","rotate(-1.5deg)","68","3")}
  {_book("Don Quixote","Cervantes","linear-gradient(145deg,#4A5263,#20283A)","rotate(1.2deg)","24")}
  {_book("L'Alchimiste","Coelho","linear-gradient(145deg,#5F8763,#7BA17C)","rotate(0.8deg)","45","7",bc=SG)}
  {_book("1001 Nuits","Anonyme","linear-gradient(145deg,#5B4B85,#6B5B95)","rotate(-0.6deg)","12",bc=PL)}
  {_book("Madame Bovary","Flaubert","linear-gradient(145deg,#C06060,#E07878)","rotate(1.0deg)","55")}
  {_book("Les Misérables","Victor Hugo","linear-gradient(145deg,#3A4A6A,#4A5A8A)","rotate(-0.4deg)","8")}
</div>
{_nav("library", w)}
</div>'''

def screen_reader(h, w):
    txt_w = int(w * 0.56)
    side_w = w - txt_w
    return f'''<div style="font-family:{HK_F};background:#1C2234;width:{w}px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;align-items:center;gap:8px;padding:34px 18px 10px;border-bottom:1px solid rgba(255,255,255,0.08)">
  <div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">
    <svg width="10" height="16" viewBox="0 0 8 13"><path d="M7 1L1 6.5 7 12" stroke="rgba(250,246,238,.7)" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
  </div>
  <div style="font-size:12px;font-weight:700;color:rgba(250,246,238,.8);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Le Petit Prince · Chapter XII</div>
  <div style="display:flex;gap:5px">
    <div style="padding:4px 11px;border-radius:20px;font-size:9px;font-weight:700;background:{SA};color:{INK}">Read</div>
    <div style="padding:4px 11px;border-radius:20px;font-size:9px;font-weight:700;color:rgba(250,246,238,.4)">Trans.</div>
    <div style="padding:4px 11px;border-radius:20px;font-size:9px;font-weight:700;color:rgba(250,246,238,.4)">Chat</div>
  </div>
</div>
<div style="display:flex;height:calc(100% - 76px)">
  <div style="width:{txt_w}px;padding:16px 20px 20px;overflow:hidden;border-right:1px solid rgba(255,255,255,0.07)">
    <div style="font-family:{FR_F};font-size:13.5px;line-height:2.15;color:rgba(250,246,238,.78);margin-bottom:14px">
      On ne voit bien qu'avec le cœur. <span style="background:rgba(224,164,88,.28);color:#F0C27A;border-radius:3px;padding:1px 3px;border-bottom:1.5px solid {SA}">L'essentiel</span> est invisible pour les yeux.
    </div>
    <div style="font-family:{FR_F};font-size:13.5px;line-height:2.15;color:rgba(250,246,238,.78);margin-bottom:14px">
      Il faut chercher avec le cœur, car c'est là que réside la véritable <span style="background:rgba(224,164,88,.28);color:#F0C27A;border-radius:3px;padding:1px 3px;border-bottom:1.5px solid {SA}">sagesse</span> de la vie.
    </div>
    <div style="font-family:{FR_F};font-size:13.5px;line-height:2.15;color:rgba(250,246,238,.42)">
      Les grandes personnes ne comprennent jamais rien toutes seules, et c'est fatigant, pour les enfants…
    </div>
  </div>
  <div style="width:{side_w}px;padding:14px;background:rgba(0,0,0,.18);display:flex;flex-direction:column;gap:10px;overflow:hidden">
    <div style="background:{P};border-radius:16px;padding:14px;box-shadow:0 8px 32px rgba(0,0,0,.5);border:1px solid {P3}">
      <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:{IM};text-transform:uppercase;margin-bottom:6px">🇫🇷 Français</div>
      <div style="font-family:{FR_F};font-size:22px;font-weight:500;color:{INK};letter-spacing:-0.3px">L'essentiel</div>
      <div style="font-size:9.5px;color:{SGD};font-weight:600;margin-bottom:7px">/lesɑ̃sjɛl/ · noun</div>
      <div style="font-size:10.5px;color:{IS};line-height:1.5;margin-bottom:10px">The essential; what is most important or fundamental.</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        <div style="padding:5px 11px;border-radius:999px;font-size:8.5px;font-weight:700;background:{SA};color:white">✦ Highlight</div>
        <div style="padding:5px 11px;border-radius:999px;font-size:8.5px;font-weight:700;border:1.2px solid {INK};color:{INK}">+ Garden</div>
        <div style="padding:5px 11px;border-radius:999px;font-size:8.5px;font-weight:700;border:1.2px solid {INK};color:{INK}">Ask Lumi</div>
      </div>
    </div>
    <div style="background:{P};border-radius:14px;padding:12px;border:1px solid {P3}">
      <div style="font-size:8px;font-weight:700;letter-spacing:1px;color:{IM};text-transform:uppercase;margin-bottom:5px">Also highlighted</div>
      <div style="font-family:{FR_F};font-size:16px;font-weight:500;color:{INK}">sagesse</div>
      <div style="font-size:9.5px;color:{IS};line-height:1.4;margin-top:4px">wisdom; sound judgement</div>
    </div>
  </div>
</div>
</div>'''

def screen_chat(h, w):
    return f'''<div style="font-family:{HK_F};background:{P};width:{w}px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;align-items:center;gap:10px;padding:34px 18px 10px;border-bottom:1.5px solid {P3}">
  <div style="width:36px;height:36px;border-radius:50%;background:{SA};border:2px solid {INK};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🦉</div>
  <div style="flex:1">
    <div style="font-size:13px;font-weight:800;color:{INK}">Lumi</div>
    <div style="font-size:9px;color:{SGD};font-weight:600">● Online · reading with you</div>
  </div>
  <div style="padding:5px 12px;background:{P2};border:1.5px solid {P3};border-radius:20px;font-size:9px;color:{IS};font-weight:600">Le Petit Prince</div>
</div>
<div style="padding:14px 20px;display:flex;flex-direction:column;gap:11px;overflow:hidden;padding-bottom:70px">
  <div style="display:flex;flex-direction:row-reverse">
    <div style="max-width:60%;padding:10px 14px;font-size:11.5px;line-height:1.55;background:{INK};color:{P};border-radius:16px 16px 4px 16px">What does "L'essentiel est invisible" actually mean?</div>
  </div>
  <div style="display:flex;align-items:flex-end;gap:8px">
    <div style="width:28px;height:28px;border-radius:50%;background:{SA};border:1.5px solid {INK};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">🦉</div>
    <div style="max-width:65%;padding:10px 14px;font-size:11.5px;line-height:1.55;background:{P2};border:1.5px solid {P3};color:{INK};border-radius:16px 16px 16px 4px">It's the book's most famous line — <span style="color:{SD};font-weight:700">what truly matters can't be seen with eyes</span>, only felt with the heart.</div>
  </div>
  <div style="display:flex;flex-direction:row-reverse">
    <div style="max-width:60%;padding:10px 14px;font-size:11.5px;line-height:1.55;background:{INK};color:{P};border-radius:16px 16px 4px 16px">Is "essentiel" related to "essence"?</div>
  </div>
  <div style="display:flex;align-items:flex-end;gap:8px">
    <div style="width:28px;height:28px;border-radius:50%;background:{SA};border:1.5px solid {INK};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">🦉</div>
    <div style="max-width:65%;padding:10px 14px;font-size:11.5px;line-height:1.55;background:{P2};border:1.5px solid {P3};color:{INK};border-radius:16px 16px 16px 4px">Exactly! Both come from Latin <span style="color:{SD};font-weight:700">essentia</span> → "being." In French, essentiel means what's at the core — what makes something itself.</div>
  </div>
  <div style="display:flex;align-items:flex-end;gap:8px">
    <div style="width:28px;height:28px;border-radius:50%;background:{SA};border:1.5px solid {INK};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">🦉</div>
    <div style="padding:12px 16px;background:{P2};border:1.5px solid {P3};border-radius:16px 16px 16px 4px;display:flex;gap:5px;align-items:center">
      <div style="width:7px;height:7px;border-radius:50%;background:{IM}"></div>
      <div style="width:7px;height:7px;border-radius:50%;background:{IM};opacity:.6"></div>
      <div style="width:7px;height:7px;border-radius:50%;background:{IM};opacity:.4"></div>
    </div>
  </div>
</div>
<div style="position:absolute;bottom:0;left:0;right:0;padding:10px 18px 22px;background:{P};border-top:1.5px solid {P3};display:flex;gap:8px;align-items:center">
  <div style="flex:1;background:{P2};border:1.5px solid {P3};border-radius:24px;padding:9px 14px;font-size:10.5px;color:{IM}">Ask about this book…</div>
  <div style="width:34px;height:34px;border-radius:50%;background:{SA};border:2px solid {INK};display:flex;align-items:center;justify-content:center;flex-shrink:0">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" stroke="{INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
</div>
</div>'''

def _wcard(em, lang, word, defn, stars, rot):
    s = "".join([f'<span style="font-size:11px">{"⭐" if i<int(stars) else "☆"}</span>' for i in range(5)])
    return f'''<div style="background:white;border:1.5px solid #C5D9C2;border-radius:16px;padding:11px;box-shadow:0 3px 10px rgba(95,135,99,.1);transform:{rot}">
<div style="font-size:22px;margin-bottom:4px;line-height:1">{em}</div>
<div style="font-size:8.5px;font-weight:700;letter-spacing:1.5px;color:{SGD};text-transform:uppercase;margin-bottom:3px">{lang}</div>
<div style="font-family:{FR_F};font-size:14px;font-weight:500;color:{INK};margin-bottom:3px">{word}</div>
<div style="font-size:10px;color:{IS};line-height:1.4;margin-bottom:7px">{defn}</div>
<div style="display:flex;gap:2px">{s}</div>
</div>'''

def screen_garden(h, w):
    cols = "1fr 1fr 1fr"
    return f'''<div style="font-family:{HK_F};background:#EEF5EC;width:{w}px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;justify-content:space-between;align-items:center;padding:34px 18px 0">
  <span style="font-size:13px;font-weight:800;color:{INK}">9:41</span>
</div>
<div style="padding:6px 18px 10px">
  <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:{SGD};text-transform:uppercase;margin-bottom:3px">Word Garden</div>
  <div style="font-family:{FR_F};font-size:22px;font-weight:400;color:{INK};letter-spacing:-0.4px;margin-bottom:10px">47 words<br><em>growing 🌱</em></div>
  <div style="display:flex;align-items:center;gap:10px">
    <div style="flex:1;height:6px;background:rgba(95,135,99,.2);border-radius:3px;overflow:hidden"><div style="height:100%;width:58%;background:{SG};border-radius:3px"></div></div>
    <div style="font-size:9px;font-weight:700;color:{SGD}">580 / 1000 XP</div>
  </div>
</div>
<div style="display:grid;grid-template-columns:{cols};gap:10px;padding:4px 18px 80px">
  {_wcard("🌟","FR","essentiel","essential; what matters most","3","rotate(-1deg)")}
  {_wcard("🦊","FR","apprivoiser","to tame; to build a bond","2","rotate(.7deg)")}
  {_wcard("💧","FR","sagesse","wisdom; sound judgement","4","rotate(.5deg)")}
  {_wcard("🌍","FR","ennuyer","to bore; to annoy","1","rotate(-.8deg)")}
  {_wcard("🌹","FR","flâner","to stroll leisurely","3","rotate(.9deg)")}
  {_wcard("✨","FR","éphémère","fleeting; short-lived","2","rotate(-.5deg)")}
</div>
{_nav("garden", w)}
</div>'''

def _feat(icon, txt, sub):
    return f'<div style="display:flex;align-items:center;gap:10px;padding:4px 0"><div style="width:28px;height:28px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;border:1.5px solid {P3};background:{P2}">{icon}</div><div style="font-size:11.5px;font-weight:600;color:{INK}">{txt} <span style="color:{IM};font-weight:500">{sub}</span></div></div>'

def screen_paywall(h, w):
    return f'''<div style="font-family:{HK_F};background:{P};width:{w}px;height:{h}px;position:relative;overflow:hidden">
<div style="display:flex;align-items:center;gap:16px;padding:34px 18px 14px;border-bottom:1.5px solid {P3}">
  <div style="width:56px;height:56px;border-radius:50%;background:{SA};border:2.5px solid {INK};display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;box-shadow:0 4px 16px rgba(224,164,88,.3)">🦉</div>
  <div>
    <div style="display:inline-flex;background:{P2};border:1.5px solid {P3};border-radius:20px;padding:3px 10px;font-size:9.5px;font-weight:700;color:{SD};margin-bottom:5px;letter-spacing:.5px">✦ Translify Pro</div>
    <div style="font-family:{FR_F};font-size:21px;font-weight:500;color:{INK};letter-spacing:-0.3px;line-height:1.2">You're one step from fluency.</div>
  </div>
</div>
<div style="padding:14px 18px 10px;display:flex;flex-direction:column;gap:9px">
  {_feat("📚","Unlimited books & uploads","· any language")}
  {_feat("🦉","Lumi AI chat on every book","· ask anything")}
  {_feat("✦","Highlight & notes","· with AI insights")}
  {_feat("🌿","Word garden & quizzes","· build vocab")}
  {_feat("📖","Offline reading","· no connection needed")}
</div>
<div style="display:flex;gap:10px;padding:8px 18px">
  <div style="flex:1;border:2px solid {P3};border-radius:18px;padding:12px;text-align:center">
    <div style="font-size:9.5px;font-weight:700;color:{IM};text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Monthly</div>
    <div style="font-family:{FR_F};font-size:28px;font-weight:500;color:{INK}">$7</div>
    <div style="font-size:9.5px;color:{IM}">/month</div>
  </div>
  <div style="flex:1;border:2px solid {SA};border-radius:18px;padding:12px;text-align:center;background:#FFFBF2;position:relative">
    <div style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:{SD};color:white;font-size:8.5px;font-weight:800;border-radius:20px;padding:3px 10px;white-space:nowrap;letter-spacing:.5px">BEST VALUE</div>
    <div style="font-size:9.5px;font-weight:700;color:{IM};text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Yearly</div>
    <div style="font-family:{FR_F};font-size:28px;font-weight:500;color:{INK}">$39</div>
    <div style="font-size:9.5px;color:{IM}">/year · save 53%</div>
  </div>
</div>
<div style="margin:10px 18px 0;background:{INK};color:{P};border-radius:20px;padding:13px;font-size:13px;font-weight:800;text-align:center">Start 7-Day Free Trial →</div>
<div style="font-size:11px;color:{IM};text-align:center;padding:8px 0 4px">Maybe later</div>
<div style="font-size:9.5px;color:{IM};text-align:center;padding:0 20px;line-height:1.5">Cancel anytime · Auto-renews after trial</div>
</div>'''

SCREEN_FNS = {
    "library": screen_library,
    "reader":  screen_reader,
    "chat":    screen_chat,
    "garden":  screen_garden,
    "paywall": screen_paywall,
}

SCREENS = [
    {"id":"library","num":"01","bg":"#2A200A","tc":"#FFF0D4","label":"Library",    "hl":"Every book\nyou love,\norganized.",      "body":"Folders, covers & progress — your shelf, your way."},
    {"id":"reader", "num":"02","bg":"#0F1E12","tc":"#E4F0E5","label":"Reader",     "hl":"Tap any word.\nUnderstand it.",           "body":"Instant definitions & context — right where you're reading."},
    {"id":"chat",   "num":"03","bg":"#0C0F16","tc":"#DDE3F0","label":"AI Chat",    "hl":"Ask Lumi\nanything.",                     "body":"Your AI reading companion — answers questions, sparks curiosity."},
    {"id":"garden", "num":"04","bg":"#0C1A0E","tc":"#D4EDD4","label":"Word Garden","hl":"Words you\nsaved, growing.",             "body":"Vocabulary from your reading, organized and ready to review."},
    {"id":"paywall","num":"05","bg":"#120D1E","tc":"#E8E4F5","label":"Premium",    "hl":"Unlock\neverything.",                     "body":"Unlimited books, AI chat, word garden. Start free for 7 days."},
]

# ── Tablet platform specs ──────────────────────────────────────────────
# 7-inch: 1200×1920 (9:16 portrait) — sides 320-3840px ✓
# 10-inch: 1600×2560 (9:16 portrait) — sides 1080-7680px ✓
PLATFORMS = {
    "tablet7": {
        "W":1200, "H":1920,
        "TW":710, "TH":1090,   # tablet frame size
        "BEZEL":32,             # top bezel for camera
        "SP":3,                 # screen side/bottom padding from frame edge
        "TR":52,                # tablet corner radius
        "SR":44,                # screen corner radius
        "CAM":20,               # camera circle diameter
        "BASE_W":360,           # CSS base content width before zoom
        "PREFIX":"tablet7",
    },
    "tablet10": {
        "W":1600, "H":2560,
        "TW":940, "TH":1460,
        "BEZEL":40,
        "SP":3,
        "TR":64,
        "SR":56,
        "CAM":26,
        "BASE_W":460,
        "PREFIX":"tablet10",
    },
}

def make_html(cfg, plat):
    sp = PLATFORMS[plat]
    W, H     = sp["W"], sp["H"]
    TW, TH   = sp["TW"], sp["TH"]
    BEZEL    = sp["BEZEL"]
    SPD      = sp["SP"]
    TR, SR   = sp["TR"], sp["SR"]
    CAM      = sp["CAM"]
    BASE_W   = sp["BASE_W"]

    # Screen area inside the tablet frame
    SW = TW - SPD*2          # screen pixel width
    SH = TH - BEZEL - SPD   # screen pixel height (below top bezel)
    ZOOM = SW / BASE_W
    ORIG_H = math.ceil(SH / ZOOM)

    TL = (W - TW) // 2      # tablet left offset

    # Caption sizing
    cap_px   = int(W * 0.07)
    hl_size  = int(W * 0.065)
    body_size= int(W * 0.023)
    num_size = int(W * 0.013)
    cap_h    = int(H * 0.22)
    PT       = cap_h + int(H * 0.012)  # tablet top position

    hl_lines = cfg["hl"].replace("\n", "<br>")
    inner    = SCREEN_FNS[cfg["id"]](ORIG_H, BASE_W)

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
    background:radial-gradient(circle,rgba(224,164,88,.10) 0%,transparent 60%);
    top:-{int(W*0.4)}px;left:-{int(W*0.2)}px;pointer-events:none"></div>
  <div style="position:absolute;width:{W}px;height:{W}px;border-radius:50%;
    background:radial-gradient(circle,rgba(107,91,149,.13) 0%,transparent 60%);
    bottom:-{int(W*0.3)}px;right:-{int(W*0.2)}px;pointer-events:none"></div>

  <!-- Caption -->
  <div style="position:absolute;top:{int(H*0.03)}px;left:{cap_px}px;right:{cap_px}px">
    <div style="font-family:'Hanken Grotesk',sans-serif;font-size:{num_size}px;font-weight:800;
      letter-spacing:{int(num_size*0.25)}px;text-transform:uppercase;color:{cfg["tc"]};opacity:0.38;
      margin-bottom:{int(hl_size*0.22)}px">{cfg["num"]} — {cfg["label"]}</div>
    <div style="font-family:'Fraunces',serif;font-size:{hl_size}px;font-weight:400;
      color:{cfg["tc"]};letter-spacing:{int(-hl_size*0.033)}px;line-height:1.08;
      margin-bottom:{int(hl_size*0.28)}px">{hl_lines}</div>
    <div style="font-family:'Hanken Grotesk',sans-serif;font-size:{body_size}px;font-weight:500;
      color:{cfg["tc"]};opacity:0.55;line-height:1.55;max-width:{int(W*0.72)}px">{cfg["body"]}</div>
  </div>

  <!-- Tablet frame -->
  <div style="position:absolute;left:{TL}px;top:{PT}px;
    width:{TW}px;height:{TH}px;
    background:#101014;
    border-radius:{TR}px;
    border:2px solid rgba(255,255,255,0.11);
    box-shadow:0 {int(TH*0.02)}px {int(TH*0.055)}px rgba(0,0,0,.75),
               0 {int(TH*0.008)}px {int(TH*0.025)}px rgba(0,0,0,.5);
    overflow:hidden">

    <!-- Top edge shine -->
    <div style="position:absolute;top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);z-index:20"></div>

    <!-- Front camera (top-center, in bezel) -->
    <div style="position:absolute;top:{(BEZEL-CAM)//2}px;left:50%;transform:translateX(-50%);
      width:{CAM}px;height:{CAM}px;background:#0A0A0E;border-radius:50%;z-index:100;
      border:1px solid rgba(255,255,255,.08)"></div>

    <!-- Screen content area (below bezel) -->
    <div style="position:absolute;top:{BEZEL}px;left:{SPD}px;
      width:{SW}px;height:{SH}px;
      border-radius:{SR}px;overflow:hidden">
      <div style="zoom:{ZOOM:.5f};width:{BASE_W}px;height:{ORIG_H}px">
        {inner}
      </div>
    </div>
  </div>

  <!-- Bottom wordmark -->
  <div style="position:absolute;bottom:{int(H*0.022)}px;left:0;right:0;text-align:center">
    <div style="font-family:'Fraunces',serif;font-size:{int(hl_size*0.27)}px;font-weight:400;
      color:{cfg["tc"]};opacity:0.20;letter-spacing:4px;text-transform:lowercase">translify</div>
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
    ], check=True, timeout=30)

def png_to_jpg(png, quality=95):
    jpg = str(png).replace(".png", ".jpg")
    subprocess.run(["magick", str(png), "-quality", str(quality), jpg], check=True)
    Path(png).unlink()
    return jpg

# ── Run ────────────────────────────────────────────────────────────────
for plat, spec in PLATFORMS.items():
    label_map = {
        "tablet7":  "7-inch tablet (1200×1920)",
        "tablet10": "10-inch tablet (1600×2560)",
    }
    print(f"\n{label_map[plat]}")
    for cfg in SCREENS:
        html = make_html(cfg, plat)
        out  = OUT / f"{spec['PREFIX']}_{cfg['num']}_{cfg['id']}.png"
        print(f"  {out.name} ...", end=" ", flush=True)
        capture(html, out, spec["W"], spec["H"])
        jpg = png_to_jpg(out)
        sz  = Path(jpg).stat().st_size // 1024
        print(f"✓  ({sz} KB)")

TMP.unlink(missing_ok=True)
print(f"\nAll tablet screenshots saved to {OUT}/")
