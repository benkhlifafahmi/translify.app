
#: 1
Action: Rotate all 5 exposed keys (Anthropic, Voyage, DeepL, Stripe test, Stripe webhook)
Where: Each vendor's dashboard
────────────────────────────────────────
#: 2
Action: Untrack .env from git
Where: git rm --cached .env then commit
────────────────────────────────────────
#: 3
Action: Set RESEND_API_KEY in production env
Where: Server .env / hosting platform
────────────────────────────────────────
#: 4
Action: Configure SPF, DKIM, DMARC for translify.app
Where: DNS provider + Resend dashboard
────────────────────────────────────────
#: 5
Action: Send a real test verification email
Where: Register a fresh account
────────────────────────────────────────
#: 6
Action: Swap Stripe to LIVE: STRIPE_SECRET_KEY, all 6 price IDs, webhook secret
Where: Stripe dashboard + production env
────────────────────────────────────────
#: 7
Action: Re-point Stripe webhook URL at production
Where: Stripe dashboard → Webhooks
────────────────────────────────────────
#: 8
Action: Run a £1 test purchase end-to-end
Where: Stripe live mode
────────────────────────────────────────
#: 9
Action: Confirm NEXT_PUBLIC_API_URL is set in prod (otherwise it falls back to localhost)
Where: Hosting platform env
────────────────────────────────────────
#: 10
Action: (Optional) Add RESEND_API_KEY + Stripe vars to DEPLOY.md for future you
Where: DEPLOY.md
