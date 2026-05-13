# Sample Books — Public Domain

Every book in this folder is in the **public domain worldwide** and was downloaded
from [Project Gutenberg](https://www.gutenberg.org/). They power the "Try the magic"
step in `/join` so visitors can read a real book before signing up — no licensing
risk, no DRM, no royalties owed.

## Inventory

| File | Title | Author | First published | Project Gutenberg ID |
| --- | --- | --- | --- | --- |
| `pride-and-prejudice.epub` | Pride and Prejudice | Jane Austen | 1813 | [#1342](https://www.gutenberg.org/ebooks/1342) |
| `alice-in-wonderland.epub` | Alice's Adventures in Wonderland | Lewis Carroll | 1865 | [#11](https://www.gutenberg.org/ebooks/11) |
| `meditations.epub` | Meditations | Marcus Aurelius (tr. George Long) | c. 170 AD / tr. 1862 | [#2680](https://www.gutenberg.org/ebooks/2680) |
| `art-of-war.epub` | The Art of War | Sun Tzu (tr. Lionel Giles) | c. 5th c. BC / tr. 1910 | [#132](https://www.gutenberg.org/ebooks/132) |
| `origin-of-species.epub` | On the Origin of Species | Charles Darwin | 1859 | [#1228](https://www.gutenberg.org/ebooks/1228) |
| `tao-te-ching.epub` | Tao Te Ching | Lao Tzu (tr. James Legge) | c. 4th c. BC / tr. 1891 | [#216](https://www.gutenberg.org/ebooks/216) |
| `shakespeares-sonnets.epub` | Shakespeare's Sonnets | William Shakespeare | 1609 | [#1041](https://www.gutenberg.org/ebooks/1041) |
| `walden.epub` | Walden | Henry David Thoreau | 1854 | [#205](https://www.gutenberg.org/ebooks/205) |

## Why these specific titles

- **All eight are unambiguously public domain** — every author has been dead for
  far longer than the maximum copyright term (life + 70 years) in every
  jurisdiction Translify ships to.
- **Translations included are also out of copyright** — we use 19th-century or
  early-20th-century English translations of the ancient texts so the
  translation itself isn't a separate rights problem.
- **Topic coverage** — fiction, philosophy, self-help, science, history,
  business/strategy, and poetry — matches the topic chips the visitor picks at
  step 2 of `/join`.

## Refreshing

If a Project Gutenberg edition is updated, re-download from the URLs in the
table above and commit. No transformation is needed — `epubjs` (used by
`apps/web/src/components/epub-viewer.tsx`) reads them as-is.

## Project Gutenberg License

> The Project Gutenberg eBook of [Title] is for the use of anyone anywhere in
> the United States and most other parts of the world at no cost and with
> almost no restrictions whatsoever. You may copy it, give it away or re-use it
> under the terms of the Project Gutenberg License included with this eBook or
> online at www.gutenberg.org.

If you ship Translify in countries with non-standard copyright rules (notably:
some texts may still be under copyright in select jurisdictions due to
translator estates), audit the table above before launch.
