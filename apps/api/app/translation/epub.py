"""EPUB translation: rewrite visible text in each chapter, keep structure intact.

We walk every spine document, collect the text content of leaf elements
(skipping <script>/<style>), translate them in one batched call, then write
the translated text back in place. Inline tags inside a paragraph are kept by
operating on text nodes rather than re-flattening to plain text.
"""
from __future__ import annotations

import logging
import tempfile

from bs4 import BeautifulSoup, NavigableString
from ebooklib import ITEM_DOCUMENT, epub

from app.translation.engine import translate_segments

log = logging.getLogger(__name__)

_SKIP_PARENTS = {"script", "style", "head", "title"}
_MIN_TEXT_LEN = 2


async def translate_epub(
    source_bytes: bytes,
    *,
    source_lang: str | None,
    target_lang: str,
) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".epub") as tmp_in:
        tmp_in.write(source_bytes)
        tmp_in.flush()
        book = epub.read_epub(tmp_in.name)

        # 1. Collect every translatable text node from every chapter.
        # Tracked as (item, soup, node) so we can write back in step 3.
        items_meta: list[tuple] = []  # (item, soup)
        nodes: list[NavigableString] = []

        for item in book.get_items_of_type(ITEM_DOCUMENT):
            html = item.get_content().decode("utf-8", errors="replace")
            soup = BeautifulSoup(html, "lxml-xml") if html.lstrip().startswith("<?xml") \
                else BeautifulSoup(html, "html.parser")
            items_meta.append((item, soup))

            for text_node in list(soup.find_all(string=True)):
                if not isinstance(text_node, NavigableString):
                    continue
                parent = text_node.parent.name if text_node.parent else ""
                if parent in _SKIP_PARENTS:
                    continue
                stripped = text_node.strip()
                if len(stripped) < _MIN_TEXT_LEN:
                    continue
                nodes.append(text_node)

        if not nodes:
            log.warning("translate_epub: no translatable text nodes")
            return source_bytes

        # 2. Translate. We feed the *stripped* text but keep the original
        # leading/trailing whitespace when writing back.
        sources = [str(n).strip() for n in nodes]
        translations = await translate_segments(
            sources, source_lang=source_lang, target_lang=target_lang
        )

        # 3. Write translations back into each text node, preserving its
        # original surrounding whitespace.
        for node, translated in zip(nodes, translations, strict=True):
            original = str(node)
            leading = original[: len(original) - len(original.lstrip())]
            trailing = original[len(original.rstrip()):]
            node.replace_with(NavigableString(f"{leading}{translated}{trailing}"))

        # 4. Serialize back to bytes per item, then write a fresh EPUB.
        for item, soup in items_meta:
            item.set_content(str(soup).encode("utf-8"))

        # Update language metadata
        try:
            book.set_language(target_lang)
        except Exception:
            log.warning("set_language failed", exc_info=True)

        with tempfile.NamedTemporaryFile(suffix=".epub", delete=False) as tmp_out:
            epub.write_epub(tmp_out.name, book)
            tmp_out.flush()
            with open(tmp_out.name, "rb") as fh:
                return fh.read()
