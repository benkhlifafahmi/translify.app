import type { Metadata } from "next";
import { LegalShell, H2 } from "@/components/legal-shell";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://translify.app";
const UPDATED = "2026-05-11";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Every paid plan includes a 30-day money-back guarantee. No questions asked. Reply to your welcome email and we'll refund you within 1–2 business days.",
  alternates: { canonical: "/refund-policy" },
  openGraph: {
    title: "Refund Policy — Translify",
    description: "30-day money-back guarantee. No questions asked.",
    url: `${SITE}/refund-policy`,
  },
};

export default function RefundPage() {
  return (
    <LegalShell
      title="Refund Policy"
      subtitle="30-day money-back. No questions asked. Here's how it works."
      lastUpdated={UPDATED}
    >
      <p>
        Every paid Translify plan includes a <strong>30-day
        money-back guarantee</strong>. If Translify isn't working for you
        within your first 30 days, write to us and we'll refund you in
        full — no forms, no &ldquo;wait, can we keep you?&rdquo; loops, no
        retention scripts. We'd rather have happy non-customers than
        annoyed customers.
      </p>

      <H2>1. Who's eligible</H2>

      <p>
        Anyone within their first 30 days of paying for a Translify
        subscription. The 30-day clock starts on the date of your first
        paid charge — not when the trial began.
      </p>

      <p>
        Refunds outside the 30-day window are at our discretion. We
        generally don't refund older periods, but we will if there's a
        clear service failure on our side (extended outage, charge made in
        error, a feature we promised that doesn't work).
      </p>

      <H2>2. How to request a refund</H2>

      <p>Pick whichever is easiest for you:</p>

      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Reply to your welcome email.</strong> Just write
          &ldquo;refund please&rdquo; — that's enough.
        </li>
        <li>
          <strong>Email{" "}
            <a href="mailto:hello@translify.app?subject=Refund%20request" className="font-semibold underline decoration-[color:var(--color-saffron)]/40">
              hello@translify.app
            </a></strong>{" "}
          with the subject &ldquo;Refund request.&rdquo;
        </li>
      </ul>

      <p>
        We don't need an explanation. If you want to tell us what didn't
        work for you, we'll read it carefully and probably write back to
        thank you — your feedback is more useful to us than the
        subscription fee. But you don't have to.
      </p>

      <H2>3. How long it takes</H2>

      <p>
        We process refunds within <strong>1–2 business days</strong> of
        receiving your request. The actual money lands back in your account
        depending on your bank or card issuer — usually 3–10 business
        days for cards, 1–3 for direct debits.
      </p>

      <p>
        Stripe handles the refund mechanics on our behalf; you'll see the
        refund appear as a reversal of the original Translify charge on your
        statement.
      </p>

      <H2>4. What happens to your data after a refund</H2>

      <p>
        Asking for a refund does not automatically delete your account. If
        you want to delete your account too — which is the usual companion
        request — say so in your refund email and we'll do both. Otherwise
        your data stays accessible to you (you keep the books and notes
        you've created), you just won't be charged again.
      </p>

      <H2>5. Annual plan pro-rated refunds</H2>

      <p>
        If you bought an annual plan, the 30-day money-back guarantee
        refunds the full annual payment. After the 30 days, we'll
        pro-rate refunds on annual plans for cancellations due to service
        failures, but discretionary mid-year refunds on annual plans aren't
        guaranteed — that's why we ask new annual customers to start with
        monthly until they're sure.
      </p>

      <H2>6. Subscription cancellation vs. refund</H2>

      <p>
        These are two different things:
      </p>

      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Cancellation</strong> stops future charges. You keep access through the period you've already paid for. No refund.</li>
        <li><strong>Refund</strong> reverses a past charge. You may also lose access to the service after the refund clears (usually within 24 hours).</li>
      </ul>

      <p>
        You can cancel yourself any time from your account settings without
        contacting us. Refunds require writing in (so we can verify the
        request and process the reversal in Stripe).
      </p>

      <H2>7. Chargebacks</H2>

      <p>
        If you dispute a charge with your bank instead of asking us
        directly, it costs us substantially more than just refunding
        you — and you'd usually have your refund faster by emailing us
        anyway. We process every email refund request the same day or
        next business day. So please write to us first; we'll make it
        right.
      </p>

      <H2>8. Contact</H2>

      <p>
        Refund requests, questions about charges, or just &ldquo;is this
        eligible?&rdquo;{" "}
        <a href="mailto:hello@translify.app" className="font-semibold underline decoration-[color:var(--color-saffron)]/40">
          hello@translify.app
        </a>
        .
      </p>
    </LegalShell>
  );
}
