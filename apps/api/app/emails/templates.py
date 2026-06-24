"""HTML email templates.

These are *transactional* emails — every byte is hand-crafted to render in
Outlook 2016, Gmail (with image-stripping), and Apple Mail Dark Mode without
falling apart. Rules of engagement:

  * Layout via nested tables, not flexbox.
  * All CSS inline. No <style> blocks (Gmail clip them in long threads).
  * No web fonts — Georgia for serif headlines, system sans for body.
  * Width capped at 600px; mobile clients re-flow naturally below that.
  * Buttons are <a> with padding; works in 99% of clients without VML.
  * Plain-text fallback is required for accessibility and spam filters.
"""
from __future__ import annotations

import html

# Sunlit Library palette, mirrored from globals.css.
PAPER = "#FAF6EE"
PAPER_2 = "#F4ECDB"
PAPER_3 = "#EFE5CF"
INK = "#20283A"
INK_SOFT = "#4A5263"
SAFFRON = "#E0A458"
SAFFRON_DEEP = "#C8893E"
SAGE_DEEP = "#5F8763"
CORAL_DEEP = "#C5594D"
BORDER = "#E5D8BC"
BORDER_STRONG = "#D4C29C"

DISPLAY_FONT_STACK = "Georgia, 'Times New Roman', serif"
BODY_FONT_STACK = (
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', "
    "Arial, sans-serif"
)


# ─────────────────────────────  Layout  ─────────────────────────────


def _layout(*, preheader: str, hero: str, body: str, footer_note: str = "") -> str:
    """Wrap content in the universal email shell.

    ``preheader`` is the snippet text email clients show next to the subject.
    """
    safe_preheader = html.escape(preheader)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Translify</title>
</head>
<body style="margin:0;padding:0;background:{PAPER};font-family:{BODY_FONT_STACK};
            color:{INK};-webkit-font-smoothing:antialiased;line-height:1.5">

<!-- preheader (hidden, shown next to subject in inbox) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;
            font-size:1px;line-height:1px;color:{PAPER};opacity:0">
  {safe_preheader} &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="background:{PAPER};">
  <tr><td align="center" style="padding:32px 16px 24px">

    <!-- ✦ Outer envelope ✦ -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
           style="width:600px;max-width:100%;background:{PAPER};">

      <!-- Brand bar -->
      <tr><td style="padding:0 4px 18px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="left" style="font-family:{DISPLAY_FONT_STACK};font-size:20px;
                                    font-weight:600;color:{INK};letter-spacing:-0.02em;
                                    vertical-align:middle">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:{INK};border-radius:9px;padding:8px 9px;
                             vertical-align:middle">
                    <span style="color:{PAPER};font-family:{DISPLAY_FONT_STACK};
                                 font-size:18px;font-weight:600;line-height:1">T</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle">Translify</td>
                </tr>
              </table>
            </td>
            <td align="right" style="font-family:{BODY_FONT_STACK};font-size:11px;
                                     letter-spacing:0.18em;text-transform:uppercase;
                                     color:{INK_SOFT};font-weight:600;
                                     vertical-align:middle">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;
                           background:{SAFFRON};margin-right:8px;vertical-align:middle"></span>
              Reader correspondence
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- ✦ Letter card ✦ -->
      <tr><td>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="background:#FFFCF3;border:1px solid {BORDER};border-radius:18px;
                      box-shadow:0 1px 0 rgba(74,60,30,0.05),0 22px 44px -18px rgba(74,60,30,0.18)">

          <!-- Decorative dashed top edge — like a deckled page -->
          <tr><td style="border-top:2px dashed {BORDER_STRONG};line-height:0;font-size:0;
                         border-radius:18px 18px 0 0">&nbsp;</td></tr>

          <!-- Hero block -->
          <tr><td style="padding:36px 40px 12px">
            {hero}
          </td></tr>

          <!-- Body block -->
          <tr><td style="padding:0 40px 36px">
            {body}
          </td></tr>

        </table>
      </td></tr>

      <!-- Tape strip detail -->
      <tr><td align="center" style="padding:14px 0 0;line-height:0">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:rgba(224,164,88,0.45);height:6px;width:64px;
                       border-radius:1px">&nbsp;</td>
            <td style="width:8px">&nbsp;</td>
            <td style="background:rgba(95,135,99,0.4);height:6px;width:24px;
                       border-radius:1px">&nbsp;</td>
            <td style="width:8px">&nbsp;</td>
            <td style="background:rgba(197,89,77,0.42);height:6px;width:40px;
                       border-radius:1px">&nbsp;</td>
          </tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:28px 8px 0;font-family:{BODY_FONT_STACK};
                     font-size:12px;color:{INK_SOFT};line-height:1.6">
        {footer_note}
        <p style="margin:0 0 6px;font-family:{DISPLAY_FONT_STACK};font-style:italic">
          Made with patience for readers everywhere.
        </p>
        <p style="margin:0">
          Translify · <a href="mailto:hello@translify.app"
            style="color:{INK_SOFT};text-decoration:underline;
                   text-decoration-color:{SAFFRON};text-underline-offset:3px">
            hello@translify.app</a>
        </p>
      </td></tr>

    </table>

  </td></tr>
</table>
</body>
</html>"""


def _hero(*, eyebrow: str, headline: str, accent_word: str | None = None) -> str:
    """Returns the hero block: small eyebrow + big serif headline."""
    safe_eyebrow = html.escape(eyebrow)
    safe_headline = html.escape(headline)
    if accent_word and accent_word in headline:
        before, after = safe_headline.split(html.escape(accent_word), 1)
        safe_accent = html.escape(accent_word)
        headline_html = (
            f'{before}<em style="color:{SAFFRON_DEEP};font-style:italic">'
            f'{safe_accent}</em>{after}'
        )
    else:
        headline_html = safe_headline

    return f"""
<p style="margin:0 0 10px;font-family:{BODY_FONT_STACK};font-size:11px;
          font-weight:700;color:{SAFFRON_DEEP};letter-spacing:0.22em;
          text-transform:uppercase">
  {safe_eyebrow}
</p>
<h1 style="margin:0 0 4px;font-family:{DISPLAY_FONT_STACK};font-size:34px;
           line-height:1.1;letter-spacing:-0.02em;color:{INK};font-weight:600">
  {headline_html}
</h1>
"""


def _button(*, label: str, href: str, tone: str = "ink") -> str:
    """Bullet-proof CTA button — works without VML in 99% of clients."""
    bg = INK if tone == "ink" else SAFFRON
    fg = PAPER if tone == "ink" else "#2A1F0F"
    return f"""
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="border-radius:999px;background:{bg};
                 box-shadow:0 2px 0 rgba(20,16,8,0.4),0 10px 22px -8px rgba(20,16,8,0.45)">
    <a href="{html.escape(href, quote=True)}"
       style="display:inline-block;padding:14px 28px;
              font-family:{BODY_FONT_STACK};font-size:15px;font-weight:600;
              color:{fg};text-decoration:none;border-radius:999px;letter-spacing:0.01em">
      {html.escape(label)} &nbsp;&rarr;
    </a>
  </td></tr>
</table>"""


def _link_fallback(href: str) -> str:
    """A small monospace link the user can copy if the button fails."""
    safe_href = html.escape(href, quote=True)
    return f"""
<p style="margin:24px 0 0;padding:14px 16px;background:{PAPER_2};
          border:1px dashed {BORDER_STRONG};border-radius:10px;
          font-family:'SF Mono',Menlo,Consolas,monospace;font-size:12px;
          color:{INK_SOFT};word-break:break-all;line-height:1.5">
  <span style="display:block;font-family:{BODY_FONT_STACK};font-size:11px;
               text-transform:uppercase;letter-spacing:0.18em;color:{INK_SOFT};
               margin-bottom:6px;font-weight:700">
    Or paste this into your browser
  </span>
  <a href="{safe_href}" style="color:{INK};text-decoration:none">{safe_href}</a>
</p>"""


# ─────────────────────────────  Welcome / Verify  ─────────────────────────────


def welcome_verify(*, name: str | None, verify_url: str) -> tuple[str, str, str]:
    """Returns (subject, html, text)."""
    salutation = (name and name.strip()) or "reader"
    safe_salutation = html.escape(salutation)

    subject = f"Welcome to your shelf, {salutation} ✦"
    preheader = "One click to verify, then your books are yours."

    hero = _hero(
        eyebrow="Hello, reader",
        headline="A place for your books.",
        accent_word="for your books",
    )

    body = f"""
<p style="margin:24px 0 18px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  Hello {safe_salutation} —
</p>
<p style="margin:0 0 14px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  Welcome to Translify. Drop a PDF or EPUB on your shelf and we'll keep the
  layout exactly the same — just translated. You'll be able to chat with the
  book, get cited answers, and quiz yourself so it sticks.
</p>
<p style="margin:0 0 28px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  First, let's confirm this is really your email. The button below verifies
  your address — no password to type, no account to remember. It expires in
  one hour.
</p>

{_button(label="Verify my email", href=verify_url, tone="ink")}

<p style="margin:24px 0 8px;font-family:{DISPLAY_FONT_STACK};font-size:15px;
          font-style:italic;color:{INK_SOFT};line-height:1.6">
  After that, your shelf is open at
  <a href="https://translify.app/library"
     style="color:{INK};text-decoration:underline;text-decoration-color:{SAFFRON};
            text-underline-offset:3px;font-style:normal;font-weight:600">
    translify.app/library</a>.
</p>

{_link_fallback(verify_url)}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="margin-top:32px">
  <tr><td style="border-top:1px dashed {BORDER};padding-top:18px">
    <p style="margin:0;font-family:{BODY_FONT_STACK};font-size:13px;
              line-height:1.6;color:{INK_SOFT}">
      Didn't sign up? You can ignore this email — no account is created until
      you verify. The address won't hear from us again.
    </p>
  </td></tr>
</table>
"""

    text = f"""\
Hello {salutation} —

Welcome to Translify. Drop a PDF or EPUB on your shelf and we'll keep the
layout exactly the same, just translated. Then chat with the book and quiz
yourself, so what you read actually sticks.

First, let's confirm this is really your email. Click the link below to
verify — it expires in one hour:

  {verify_url}

Didn't sign up? You can safely ignore this email; no account is created
until you verify.

Made with patience for readers everywhere.
— Translify · hello@translify.app
"""

    return subject, _layout(preheader=preheader, hero=hero, body=body), text


# ─────────────────────────────  Magic link  ─────────────────────────────


def magic_link(*, name: str | None, login_url: str) -> tuple[str, str, str]:
    """Returns (subject, html, text) for the one-click login email.

    Sent after silent-signup (the /join email step) and also any time a
    visitor requests `/auth/magic-link` from another device. The link itself
    is a short-lived JWT — see ``auth.magic_link`` for token construction.
    """
    salutation = (name and name.strip()) or "reader"
    safe_salutation = html.escape(salutation)

    subject = "Your shelf is one tap away ✦"
    preheader = "One click to open your library — link expires in 30 minutes."

    hero = _hero(
        eyebrow="Magic link",
        headline="Your shelf, one tap away.",
        accent_word="one tap away",
    )

    body = f"""
<p style="margin:24px 0 18px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  Hello {safe_salutation} —
</p>
<p style="margin:0 0 14px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  Your library is waiting at translify.app — eight public-domain classics
  pre-loaded, ready to read in your language. Tap the button below to open
  your shelf on this device. No password to type, no account to remember.
</p>
<p style="margin:0 0 28px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  The link expires in 30 minutes — request a new one any time from the
  sign-in page.
</p>

{_button(label="Open my library", href=login_url, tone="ink")}

{_link_fallback(login_url)}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="margin-top:32px">
  <tr><td style="border-top:1px dashed {BORDER};padding-top:18px">
    <p style="margin:0;font-family:{BODY_FONT_STACK};font-size:13px;
              line-height:1.6;color:{INK_SOFT}">
      Didn't request this? Ignore the email — the link will quietly expire.
    </p>
  </td></tr>
</table>
"""

    text = f"""\
Hello {salutation} —

Your Translify shelf is waiting — eight public-domain classics pre-loaded,
ready to read in your language. Tap the link below to open it on this
device. No password to type. The link expires in 30 minutes:

  {login_url}

Didn't request this? You can ignore the email — the link expires quietly.

— Translify · hello@translify.app
"""

    return subject, _layout(preheader=preheader, hero=hero, body=body), text


# ─────────────────────────────  Password reset  ─────────────────────────────


def password_reset(*, name: str | None, reset_url: str) -> tuple[str, str, str]:
    salutation = (name and name.strip()) or "reader"
    safe_salutation = html.escape(salutation)

    subject = "Resetting your shelf"
    preheader = "A new key, on its way — link expires in one hour."

    hero = _hero(
        eyebrow="Password reset",
        headline="A new key, on its way.",
        accent_word="A new key",
    )

    body = f"""
<p style="margin:24px 0 18px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  Hello {safe_salutation} —
</p>
<p style="margin:0 0 14px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  We got a request to change the password on your shelf. Click below to set a
  new one. The link is a single-use key — it expires in one hour.
</p>

{_button(label="Set a new password", href=reset_url, tone="ink")}

{_link_fallback(reset_url)}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="margin-top:32px">
  <tr><td style="border-left:3px solid {CORAL_DEEP};
                 background:rgba(226,120,108,0.08);
                 padding:14px 16px;border-radius:0 10px 10px 0">
    <p style="margin:0 0 6px;font-family:{BODY_FONT_STACK};font-size:11px;
              font-weight:700;letter-spacing:0.18em;text-transform:uppercase;
              color:{CORAL_DEEP}">
      If you didn't ask for this
    </p>
    <p style="margin:0;font-family:{BODY_FONT_STACK};font-size:14px;
              line-height:1.6;color:{INK}">
      Just ignore this email — your password stays exactly as it was.
      No action needed. If you'd like to be extra careful,
      <a href="mailto:hello@translify.app"
         style="color:{INK};text-decoration:underline;
                text-decoration-color:{SAFFRON};text-underline-offset:3px;
                font-weight:600">drop us a line</a> and we'll take a look.
    </p>
  </td></tr>
</table>
"""

    text = f"""\
Hello {salutation} —

We got a request to change the password on your Translify shelf. Click below
to set a new one — the link is a single-use key and expires in one hour:

  {reset_url}

If you didn't ask for this, ignore this email — your password stays
exactly as it was. No action needed.

— Translify · hello@translify.app
"""

    return subject, _layout(preheader=preheader, hero=hero, body=body), text


# ─────────────────────────────  Upcoming invoice  ─────────────────────────────


def upcoming_invoice(
    *,
    name: str | None,
    amount_label: str,
    renews_label: str,
    manage_url: str,
) -> tuple[str, str, str]:
    """Heads-up before a subscription renews.

    Fired from the ``invoice.upcoming`` Stripe webhook. ``amount_label`` and
    ``renews_label`` arrive pre-formatted (e.g. "$12.00", "March 3, 2026") so
    the template stays free of currency / locale logic.
    """
    salutation = (name and name.strip()) or "reader"
    safe_salutation = html.escape(salutation)
    safe_amount = html.escape(amount_label)
    safe_renews = html.escape(renews_label)

    subject = "Your Translify renewal is coming up"
    preheader = f"{amount_label} on {renews_label}. Nothing to do if it all looks right."

    hero = _hero(
        eyebrow="Upcoming charge",
        headline="A quick heads-up.",
        accent_word="heads-up",
    )

    body = f"""
<p style="margin:24px 0 18px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  Hello {safe_salutation} —
</p>
<p style="margin:0 0 14px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  Your Translify subscription renews soon. Here's the upcoming charge so there
  are no surprises on your statement.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="margin:20px 0 8px;background:{PAPER_2};border:1px solid {BORDER};
              border-radius:12px">
  <tr>
    <td style="padding:16px 20px;font-family:{BODY_FONT_STACK};font-size:13px;
               color:{INK_SOFT};letter-spacing:0.04em">Amount</td>
    <td align="right" style="padding:16px 20px;font-family:{DISPLAY_FONT_STACK};
               font-size:22px;font-weight:600;color:{INK}">{safe_amount}</td>
  </tr>
  <tr>
    <td style="padding:0 20px 16px;font-family:{BODY_FONT_STACK};font-size:13px;
               color:{INK_SOFT};letter-spacing:0.04em">Renews on</td>
    <td align="right" style="padding:0 20px 16px;font-family:{BODY_FONT_STACK};
               font-size:15px;font-weight:600;color:{INK}">{safe_renews}</td>
  </tr>
</table>

<p style="margin:18px 0 28px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  If everything looks right, there's nothing to do. To update your card, switch
  plans, or cancel before the renewal, open your billing settings.
</p>

{_button(label="Manage billing", href=manage_url, tone="ink")}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="margin-top:32px">
  <tr><td style="border-top:1px dashed {BORDER};padding-top:18px">
    <p style="margin:0;font-family:{BODY_FONT_STACK};font-size:13px;
              line-height:1.6;color:{INK_SOFT}">
      Questions about this charge? Just reply to this email and a human will
      get back to you.
    </p>
  </td></tr>
</table>
"""

    text = f"""\
Hello {salutation} —

Your Translify subscription renews soon. Here's the upcoming charge so there
are no surprises on your statement:

  Amount:    {amount_label}
  Renews on: {renews_label}

If everything looks right, there's nothing to do. To update your card, switch
plans, or cancel before the renewal, open your billing settings:

  {manage_url}

Questions about this charge? Just reply to this email.

— Translify · hello@translify.app
"""

    return subject, _layout(preheader=preheader, hero=hero, body=body), text


# ─────────────────────────────  Course invitation  ─────────────────────────────


def course_invite(
    *,
    inviter_name: str | None,
    course_title: str,
    share_url: str,
) -> tuple[str, str, str]:
    """Invite someone to a shared (view-only) YouTube-course workspace.

    The link is the public share URL — anyone with it can watch the video,
    read the study material, and save their own copy.
    """
    inviter = (inviter_name and inviter_name.strip()) or "Someone"
    safe_inviter = html.escape(inviter)
    safe_title = html.escape(course_title)

    subject = f"{inviter} shared a course with you on Translify"
    preheader = f"{course_title} — watch it with AI-made notes, key points, and exercises."

    hero = _hero(
        eyebrow="A course, shared with you",
        headline="Study this together.",
        accent_word="together",
    )

    body = f"""
<p style="margin:24px 0 18px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  Hello —
</p>
<p style="margin:0 0 14px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  <strong>{safe_inviter}</strong> shared a course with you on Translify:
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="margin:6px 0 22px;background:{PAPER_2};border:1px solid {BORDER};
              border-radius:12px">
  <tr><td style="padding:16px 20px;font-family:{DISPLAY_FONT_STACK};
             font-size:18px;font-weight:600;color:{INK};line-height:1.35">
    ▶ {safe_title}
  </td></tr>
</table>

<p style="margin:0 0 28px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  Watch the video alongside study notes, key points, and practice exercises —
  all generated from the course. You can also save your own copy to study it
  interactively.
</p>

{_button(label="Open the course", href=share_url, tone="ink")}

{_link_fallback(share_url)}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="margin-top:32px">
  <tr><td style="border-top:1px dashed {BORDER};padding-top:18px">
    <p style="margin:0;font-family:{BODY_FONT_STACK};font-size:13px;
              line-height:1.6;color:{INK_SOFT}">
      Didn't expect this? You can safely ignore this email — the link just
      opens a shared, view-only course page.
    </p>
  </td></tr>
</table>
"""

    text = f"""\
Hello —

{inviter} shared a course with you on Translify:

  ▶ {course_title}

Watch the video alongside study notes, key points, and practice exercises —
all generated from the course. You can also save your own copy to study it
interactively. Open it here:

  {share_url}

Didn't expect this? You can safely ignore this email — the link just opens a
shared, view-only course page.

— Translify · hello@translify.app
"""

    return subject, _layout(preheader=preheader, hero=hero, body=body), text


# ─────────────────────────────  Admin broadcast / 1:1  ─────────────────────────────


def admin_message(*, name: str | None, subject: str, body: str) -> tuple[str, str, str]:
    """A free-form note composed by an admin in the back office.

    ``subject`` becomes the email subject verbatim. ``body`` is plain text —
    blank lines split paragraphs; everything is HTML-escaped before rendering.
    """
    salutation = (name and name.strip()) or "reader"
    safe_salutation = html.escape(salutation)

    preheader = subject

    hero = _hero(
        eyebrow="A note from Translify",
        headline="Hello there.",
    )

    paragraphs = [p.strip() for p in body.replace("\r\n", "\n").split("\n\n") if p.strip()]
    para_html = "".join(
        f"""<p style="margin:0 0 14px;font-family:{BODY_FONT_STACK};font-size:16px;
              line-height:1.65;color:{INK}">{html.escape(p).replace(chr(10), "<br>")}</p>"""
        for p in paragraphs
    )

    body_html = f"""
<p style="margin:24px 0 18px;font-family:{BODY_FONT_STACK};font-size:16px;
          line-height:1.65;color:{INK}">
  Hello {safe_salutation} —
</p>
{para_html}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="margin-top:32px">
  <tr><td style="border-top:1px dashed {BORDER};padding-top:18px">
    <p style="margin:0;font-family:{DISPLAY_FONT_STACK};font-style:italic;
              font-size:15px;line-height:1.6;color:{INK_SOFT}">
      You can reply straight to this email — it reaches a real person.
    </p>
  </td></tr>
</table>
"""

    text_body = "\n\n".join(paragraphs)
    text = f"""\
Hello {salutation} —

{text_body}

You can reply straight to this email — it reaches a real person.

— Translify · hello@translify.app
"""

    return subject, _layout(preheader=preheader, hero=hero, body=body_html), text
