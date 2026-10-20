# CallSense (callsense.in)

**Every customer call, understood.** CallSense transcribes a business's sales and support calls in Hindi, English or Hinglish, picks up each customer's mood and the key details, puts them in a live dashboard, and lets owners ask ChatGPT or Claude about their calls. Set up and customised per business, for teams across India.

This repo is the marketing site and the demo request backend.

## Who it's for

- `/real-estate`: builders, brokers, channel partners
- `/coaching`: coaching institutes and edtech admission teams
- `/d2c`: D2C brands with COD confirmation and support calls
- `/clinics`: clinics and hospitals

Each industry page is the home page pre-set to that industry (the server rewrites title, description and canonical; `public/ind-init.js` picks the version before first paint, `public/industry.js` handles the switcher).

## Stack

- Express + `pg`, Node 20+. `npm start` runs `src/server.js`.
- `POST /api/leads` stores requests in Postgres table **`callsense_leads`** (created on startup). Spam traps: hidden `company_site` field, 2.5 s minimum on page, 5 requests per 10 minutes per IP.
- `GET /health` reports database status (Railway health check).
- https only, `www` and `*.up.railway.app` redirect to `https://callsense.in`, HSTS, strict CSP.

Reading leads (Railway Postgres, Data tab or psql):

```sql
SELECT created_at, full_name, phone, company, city, industry, team_size, calls_per_day, phone_system, languages, message, status
FROM callsense_leads ORDER BY created_at DESC;
```

## Hosting

Railway project `hospitable-courage`, its own service for this site, `DATABASE_URL` referencing the shared Postgres service. Deploy with `railway up` from this folder (or GitHub auto-deploy once the Railway GitHub app has access to this repo).

## Domain, email, search

- callsense.in registered at Spaceship, DNS on Cloudflare (nameservers liberty / yichun.ns.cloudflare.com).
- himanshu@callsense.in: Cloudflare Email Routing to Gmail, plus Gmail "Send mail as".
- SEO/AEO: `robots.txt` (AI crawlers allowed), `sitemap.xml`, `llms.txt`, JSON-LD (Organization, WebSite, Service with INR offers, FAQPage; Article/FAQ/Breadcrumb on guides), Open Graph image, IndexNow key file in `public/`.
- Guides are generated: `node scripts/build-guides.mjs`, then update sitemap `lastmod`, deploy and ping IndexNow.
