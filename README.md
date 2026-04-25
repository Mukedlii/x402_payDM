# PayDM — Vercel Deploy Guide

A pay-to-DM gateway running on Coinbase x402 (Base mainnet, $0.20 USDC).
Adapted to run as a Vercel serverless function.

## Files

```
paydm-vercel-deploy/
├── api/
│   └── index.js      # Express app exported as serverless handler
├── public/
│   ├── index.html    # Landing page
│   ├── dm.html       # Paid DM form (post-payment)
│   ├── inbox.html    # Inbox viewer
│   ├── style.css
│   └── opengraph.jpg
├── vercel.json       # Routes all requests through the function
├── package.json
├── .gitignore
└── README.md
```

## Deploy to Vercel (Free, no sleep, no credit card)

### Option A — GitHub (easiest)

1. Create a new GitHub repo (e.g. `paydm`).
2. Upload the contents of this folder to the repo
   (drag & drop on GitHub web: "Add file → Upload files").
3. Go to <https://vercel.com> and sign up with GitHub (free Hobby tier).
4. Click **Add New → Project**, pick the `paydm` repo, click **Import**.
5. Framework preset: **Other** (Vercel auto-detects everything from `vercel.json`).
6. Before clicking Deploy, expand **Environment Variables** and add:

   | Name | Value | Scope |
   |---|---|---|
   | `WALLET_ADDRESS` | `0xf5fF2Cb593bcd029fd4Aae049109a9Cc205D5baF` | All |
   | `COINBASE_CDP_API_KEY_ID` | *(from your Coinbase CDP portal)* | All |
   | `COINBASE_CDP_API_KEY_SECRET` | *(from your Coinbase CDP portal)* | All |

7. Click **Deploy**. After ~1 minute you'll get a URL like
   `https://paydm-yourname.vercel.app`.

### Option B — Vercel CLI

```bash
npm i -g vercel
cd paydm-vercel-deploy
vercel            # follow the prompts, link to a new project
vercel env add WALLET_ADDRESS
vercel env add COINBASE_CDP_API_KEY_ID
vercel env add COINBASE_CDP_API_KEY_SECRET
vercel --prod     # deploy to production
```

## Verify

```bash
curl -i https://paydm-yourname.vercel.app/
# → 200 OK + landing page

curl -i https://paydm-yourname.vercel.app/dm
# → 402 Payment Required + JSON body with payment instructions
```

## Trigger Agentic.Market listing

Send one real $0.20 USDC payment to `https://paydm-yourname.vercel.app/dm`
from any x402-compatible client. The first successful settlement via the
Coinbase CDP facilitator auto-indexes the service on
<https://agentic.market>.

## Important notes

- **Vercel free Hobby tier:**
  - No credit card required.
  - Never sleeps. Cold start ~100–300ms (totally fine for x402).
  - 100GB bandwidth/month.
  - 100GB-hours of function execution/month.
- **Stateless storage:** the `messages = []` array does NOT persist between
  invocations. Each function instance has its own memory and instances are
  recycled. This is the same behavior as Replit Autoscale.
  → For real persistence, add a database. Free options that work with Vercel:
  - **Vercel KV** (Redis, free tier 256MB)
  - **Upstash Redis** (free tier 10k requests/day)
  - **Neon Postgres** (free tier 512MB)
- **Custom domain:** free on Vercel. Add it in Project Settings → Domains.
