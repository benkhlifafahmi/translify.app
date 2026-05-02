"""PDF + EPUB → list of ``Page`` records.

For EPUBs there is no real page concept, so each spine item becomes one
"page" — order is preserved, which is what the chunker needs.
"""
from __future__ import annotations

import io
import logging
from dataclasses import dataclass

from app.models.book import BookFormat

log = logging.getLogger(__name__)


@dataclass(slots=True)
class Page:
    number: int  # 1-based
    text: str


def parse(book_bytes: bytes, format_: BookFormat) -> list[Page]:
    if format_ is BookFormat.pdf:
        return _parse_pdf(book_bytes)
    if format_ is BookFormat.epub:
        return _parse_epub(book_bytes)
    raise ValueError(f"Unsupported format: {format_}")


def _parse_pdf(data: bytes) -> list[Page]:
    # pypdf is fast and handles most PDFs. pdfplumber is in deps as a fallback
    # we'll use only if pypdf returns no usable text — keep parsing cheap by default.
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    pages: list[Page] = []
    extracted_any = False
    for i, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception:
            log.warning("pypdf failed on page %d", i, exc_info=True)
            text = ""
        if text.strip():
            extracted_any = True
        pages.append(Page(number=i, text=_normalize(text)))

    if extracted_any:
        return pages

    log.info("pypdf produced no text; falling back to pdfplumber")
    return _parse_pdf_with_plumber(data)


def _parse_pdf_with_plumber(data: bytes) -> list[Page]:
    import pdfplumber

    pages: list[Page] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            try:
                text = page.extract_text() or ""
            except Exception:
                log.warning("pdfplumber failed on page %d", i, exc_info=True)
                text = ""
            pages.append(Page(number=i, text=_normalize(text)))
    return pages


def _parse_epub(data: bytes) -> list[Page]:
    import tempfile

    from bs4 import BeautifulSoup
    from ebooklib import ITEM_DOCUMENT, epub

    # ebooklib's read_epub wants a path; write to a temp file.
    with tempfile.NamedTemporaryFile(suffix=".epub") as tmp:
        tmp.write(data)
        tmp.flush()
        book = epub.read_epub(tmp.name)

    pages: list[Page] = []
    ordinal = 0
    for item in book.get_items_of_type(ITEM_DOCUMENT):
        html = item.get_content().decode("utf-8", errors="replace")
        soup = BeautifulSoup(html, "html.parser")
        # Drop scripts/styles before extracting visible text
        for tag in soup(["script", "style"]):
            tag.decompose()
        text = soup.get_text("\n", strip=True)
        if not text.strip():
            continue
        ordinal += 1
        pages.append(Page(number=ordinal, text=_normalize(text)))
    return pages


def _normalize(text: str) -> str:
    # Collapse runs of whitespace inside a line; preserve paragraph breaks.
    out_lines: list[str] = []
    for line in text.splitlines():
        cleaned = " ".join(line.split())
        out_lines.append(cleaned)
    # Drop sequences of 3+ blank lines down to a single blank
    collapsed: list[str] = []
    blank_run = 0
    for line in out_lines:
        if line:
            blank_run = 0
            collapsed.append(line)
        else:
            blank_run += 1
            if blank_run <= 1:
                collapsed.append(line)
    return "\n".join(collapsed).strip()
