"""Translate a PDF with high-fidelity line-level layout preservation.

Strategy:
1. Walk every visual line of the source PDF using ``page.get_text("dict")``.
   For each line we capture: bounding box, dominant font family + style
   (bold/italic), font size, text color, and detected alignment (centered
   vs left).
2. Classify each line as prose (translatable) or non-prose (math, equations,
   fractions, fragments, page numbers). Non-prose lines are kept verbatim.
3. Translate prose lines in batched LLM calls.
4. Per page, redact the prose lines and re-draw the translated text inside
   the same bbox using the matched font, color, alignment, and original
   size — shrinking only if the translation is too long to fit.

Script handling:
- Latin targets use the PyMuPDF base-14 fonts (helv/tiro/cour with
  bold/italic variants) and stay on the source's detected family.
- Arabic / Hebrew / Devanagari / Thai use FiraGO (figo/figbo/figit/figbi)
  from the ``pymupdf-fonts`` package, which ships those scripts with
  weight + italic variants.
- CJK targets use MuPDF's built-in fallback fonts (``china-s``,
  ``china-t``, ``japan``, ``korea``).
- Arabic text is shaped (presentation forms) and bidi-resolved to visual
  order before being drawn, since ``insert_textbox`` does no shaping.
- RTL targets switch left-aligned source lines to right-aligned output.

Known limitations:
- Translations longer than the source line shrink the font; very long
  translations may still clip.
- Multi-column layout alignment isn't detected — only page-centered text
  is recognized as centered.
- A line that wraps to multiple visual lines after shaping (rare for
  short prose lines we translate) won't re-shape per visual line.
"""
from __future__ import annotations

import logging

import arabic_reshaper
import pymupdf
import pymupdf_fonts  # noqa: F401  registers FiraGO + Noto in fitz_fontdescriptors
from bidi.algorithm import get_display

from app.translation.engine import translate_segments

log = logging.getLogger(__name__)

_BBOX_PAD = 1.0
_MIN_PROSE_LEN = 4
_MIN_LETTER_RATIO = 0.55
_MIN_FONT_SIZE = 5.5

# PyMuPDF span flag bits.
_BOLD_BIT = 16
_ITALIC_BIT = 2

# PyMuPDF base-14 fonts, keyed by (family, bold, italic).
# helv = Helvetica, tiro = Times Roman, cour = Courier.
_LATIN_FONT_VARIANTS: dict[tuple[str, bool, bool], str] = {
    ("helv", False, False): "helv",
    ("helv", True, False): "hebo",
    ("helv", False, True): "heit",
    ("helv", True, True): "hebi",
    ("tiro", False, False): "tiro",
    ("tiro", True, False): "tibo",
    ("tiro", False, True): "tiit",
    ("tiro", True, True): "tibi",
    ("cour", False, False): "cour",
    ("cour", True, False): "cobo",
    ("cour", False, True): "coit",
    ("cour", True, True): "cobi",
}

# FiraGO covers Arabic, Hebrew, Devanagari, Thai, and Latin.
_FIRAGO_VARIANTS: dict[tuple[bool, bool], str] = {
    (False, False): "figo",
    (True, False): "figbo",
    (False, True): "figit",
    (True, True): "figbi",
}

# Target-language → script category. Languages absent fall through to "latin".
# Keys are normalized lowercase BCP-47 prefixes.
_TARGET_SCRIPTS: dict[str, str] = {
    # Arabic script family
    "ar": "arabic", "fa": "arabic", "ur": "arabic", "ps": "arabic",
    "sd": "arabic", "ckb": "arabic", "ug": "arabic",
    # Hebrew script family
    "he": "hebrew", "iw": "hebrew", "yi": "hebrew",
    # CJK
    "zh": "cjk-s", "zh-cn": "cjk-s", "zh-hans": "cjk-s", "zh-sg": "cjk-s",
    "zh-tw": "cjk-t", "zh-hk": "cjk-t", "zh-mo": "cjk-t", "zh-hant": "cjk-t",
    "ja": "cjk-jp",
    "ko": "cjk-kr",
    # Devanagari and related Indic scripts FiraGO supports
    "hi": "devanagari", "mr": "devanagari", "ne": "devanagari", "sa": "devanagari",
    # Thai
    "th": "thai",
}

_RTL_SCRIPTS = frozenset({"arabic", "hebrew"})

# Latin-only transliteration map for codepoints the base-14 fonts can't
# render. Applied only when the target font is one of helv/tiro/cour;
# FiraGO and CJK fonts handle these natively.
_HELV_SAFE_MAP = str.maketrans(
    {
        "−": "-", "–": "-", "—": "-", "‐": "-", "‑": "-",
        "‘": "'", "’": "'", "“": '"', "”": '"',
        "…": "...",
        " ": " ", " ": " ", " ": " ", " ": " ",  # NBSP, narrow NBSP, thin, hair
        "≤": "<=", "≥": ">=", "≠": "!=",
        "×": "x", "÷": "/", "·": ".", "•": "-",
        "→": "->", "←": "<-", "⇒": "=>", "⇐": "<=",
    }
)


async def translate_pdf(
    source_bytes: bytes,
    *,
    source_lang: str | None,
    target_lang: str,
) -> bytes:
    target_script = _classify_target(target_lang)
    log.info("translate_pdf: target_lang=%s script=%s", target_lang, target_script)

    doc = pymupdf.open(stream=source_bytes, filetype="pdf")
    try:
        records: list[dict] = []
        skipped = 0
        total = 0
        for page_idx, page in enumerate(doc):
            page_width = page.rect.width
            for line in _iter_lines(page, page_width):
                total += 1
                if not _is_prose(line["text"]):
                    skipped += 1
                    continue
                line["page_idx"] = page_idx
                records.append(line)

        log.info(
            "translate_pdf: %d lines total, %d translating, %d kept verbatim",
            total,
            len(records),
            skipped,
        )

        if not records:
            return doc.tobytes()

        sources = [r["text"] for r in records]
        translations = await translate_segments(
            sources, source_lang=source_lang, target_lang=target_lang
        )
        for record, translated in zip(records, translations, strict=True):
            record["translated"] = translated

        by_page: dict[int, list[dict]] = {}
        for record in records:
            by_page.setdefault(record["page_idx"], []).append(record)

        for page_idx, items in by_page.items():
            page = doc[page_idx]
            for item in items:
                page.add_redact_annot(item["bbox"], fill=(1, 1, 1))
            page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)
            for item in items:
                _draw_line(page, item, target_script)

        return doc.tobytes(deflate=True)
    finally:
        doc.close()


def _iter_lines(page: "pymupdf.Page", page_width: float):
    """Yield per-line metadata: bbox, text, size, font, color, alignment."""
    raw = page.get_text("dict")
    for blk in raw.get("blocks", []):
        if blk.get("type") != 0:
            continue
        for line in blk.get("lines", []):
            spans = line.get("spans", [])
            if not spans:
                continue
            text = "".join(s.get("text", "") for s in spans).strip()
            if not text:
                continue
            bbox = line.get("bbox")
            if not bbox:
                continue
            x0, y0, x1, y1 = bbox

            # Weighted-avg size and dominant style across spans (longer
            # spans contribute more, so a stray italic word doesn't flip
            # a whole heading to italic).
            total_chars = 0
            size_sum = 0.0
            bold_chars = 0
            italic_chars = 0
            family_votes: dict[str, int] = {}
            color_int = 0
            for s in spans:
                txt = s.get("text", "")
                slen = max(1, len(txt))
                total_chars += slen
                size_sum += slen * float(s.get("size", 10))
                flags = int(s.get("flags", 0))
                if flags & _BOLD_BIT:
                    bold_chars += slen
                if flags & _ITALIC_BIT:
                    italic_chars += slen
                family = _classify_family(s.get("font", ""))
                family_votes[family] = family_votes.get(family, 0) + slen
                # Use the first non-zero color we see — most lines are
                # monochromatic anyway.
                if not color_int:
                    color_int = int(s.get("color", 0) or 0)

            avg_size = size_sum / max(1, total_chars)
            is_bold = total_chars > 0 and bold_chars / total_chars > 0.5
            is_italic = total_chars > 0 and italic_chars / total_chars > 0.5
            family = max(family_votes.items(), key=lambda kv: kv[1])[0]
            color = _color_from_int(color_int)
            align = _detect_alignment(x0, x1, page_width)

            yield {
                "bbox": pymupdf.Rect(x0, y0, x1, y1),
                "text": text,
                "size": avg_size,
                "latin_family": family,
                "is_bold": is_bold,
                "is_italic": is_italic,
                "color": color,
                "align": align,
                "page_width": page_width,
            }


def _classify_family(font_name: str) -> str:
    """Map a PDF font name to one of the three base-14 families."""
    name = (font_name or "").lower()
    if not name:
        return "helv"
    if any(tag in name for tag in ("times", "roman", "serif", "minion", "garamond", "georgia", "cmr")):
        return "tiro"
    if any(tag in name for tag in ("courier", "mono", "consol", "menlo", "cmtt")):
        return "cour"
    return "helv"


def _classify_target(target_lang: str) -> str:
    """Return one of: latin, arabic, hebrew, devanagari, thai, cjk-{s,t,jp,kr}."""
    norm = (target_lang or "").lower().replace("_", "-").strip()
    if norm in _TARGET_SCRIPTS:
        return _TARGET_SCRIPTS[norm]
    base = norm.split("-")[0]
    return _TARGET_SCRIPTS.get(base, "latin")


def _resolve_font(script: str, latin_family: str, is_bold: bool, is_italic: bool) -> str:
    if script == "latin":
        return _LATIN_FONT_VARIANTS.get((latin_family, is_bold, is_italic), "helv")
    if script in ("arabic", "hebrew", "devanagari", "thai"):
        return _FIRAGO_VARIANTS[(is_bold, is_italic)]
    if script == "cjk-s":
        return "china-s"
    if script == "cjk-t":
        return "china-t"
    if script == "cjk-jp":
        return "japan"
    if script == "cjk-kr":
        return "korea"
    return "helv"


def _shape_text(script: str, text: str) -> str:
    """Pre-shape RTL text to visual order; non-RTL passes through."""
    if script == "arabic":
        return get_display(arabic_reshaper.reshape(text))
    if script == "hebrew":
        return get_display(text)
    return text


def _color_from_int(color_int: int) -> tuple[float, float, float]:
    if not color_int:
        return (0.0, 0.0, 0.0)
    r = ((color_int >> 16) & 0xFF) / 255.0
    g = ((color_int >> 8) & 0xFF) / 255.0
    b = (color_int & 0xFF) / 255.0
    return (r, g, b)


def _detect_alignment(x0: float, x1: float, page_width: float) -> int:
    """Return pymupdf alignment constant — center if the line looks centered."""
    line_width = x1 - x0
    left_gap = x0
    right_gap = page_width - x1
    # Centered if left/right margins are nearly equal AND the line doesn't
    # span the typical full-width body region.
    if (
        line_width < page_width * 0.75
        and abs(left_gap - right_gap) < page_width * 0.04
        and left_gap > page_width * 0.10
    ):
        return pymupdf.TEXT_ALIGN_CENTER
    return pymupdf.TEXT_ALIGN_LEFT


def _is_prose(text: str) -> bool:
    if len(text) < _MIN_PROSE_LEN:
        return False
    non_ws = [c for c in text if not c.isspace()]
    if not non_ws:
        return False
    letters = sum(1 for c in non_ws if c.isalpha())
    if letters / len(non_ws) < _MIN_LETTER_RATIO:
        return False
    if "=" in text and len(text) < 36:
        return False
    if text.strip().isdigit():
        return False
    return True


def _draw_line(page: "pymupdf.Page", item: dict, script: str) -> None:
    """Render the translated text into the original line's bbox."""
    fontname = _resolve_font(script, item["latin_family"], item["is_bold"], item["is_italic"])

    text = item["translated"]
    if script == "latin":
        text = text.translate(_HELV_SAFE_MAP)
    text = _shape_text(script, text)

    align = item["align"]
    # Right-align RTL output when the source was left-aligned; keep CENTER as-is.
    if script in _RTL_SCRIPTS and align == pymupdf.TEXT_ALIGN_LEFT:
        align = pymupdf.TEXT_ALIGN_RIGHT

    rect = item["bbox"]
    page_width = item["page_width"]

    # Centered text needs horizontal headroom so the translation can stay
    # centered around the original center point (translations are typically
    # longer than English originals).
    if align == pymupdf.TEXT_ALIGN_CENTER:
        center = (rect.x0 + rect.x1) / 2
        original_width = rect.x1 - rect.x0
        new_half = max(original_width * 0.75, page_width * 0.35)
        new_x0 = max(0.0, center - new_half)
        new_x1 = min(page_width, center + new_half)
        box = pymupdf.Rect(
            new_x0,
            rect.y0 - _BBOX_PAD,
            new_x1,
            rect.y1 + _BBOX_PAD,
        )
    else:
        box = pymupdf.Rect(
            rect.x0 - _BBOX_PAD,
            rect.y0 - _BBOX_PAD,
            rect.x1 + _BBOX_PAD,
            rect.y1 + _BBOX_PAD,
        )

    fontsize = max(item["size"], _MIN_FONT_SIZE)
    color = item["color"]

    for _ in range(8):
        rc = page.insert_textbox(
            box,
            text,
            fontname=fontname,
            fontsize=fontsize,
            align=align,
            color=color,
        )
        if rc >= 0:
            return
        fontsize *= 0.9
        if fontsize < _MIN_FONT_SIZE:
            break

    page.insert_textbox(
        box,
        text,
        fontname=fontname,
        fontsize=_MIN_FONT_SIZE,
        align=align,
        color=color,
    )
