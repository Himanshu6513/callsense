// CallSense (callsense.in): marketing site + missed-lead report requests.
// Serves the static site from /public and stores requests in Postgres (table: callsense_leads).
import express from "express";
import pg from "pg";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const PORT = Number(process.env.PORT) || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const CANONICAL_HOST = "callsense.in";

// ---------- database ----------
const pool = DATABASE_URL
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      max: 5,
      // Railway's private network needs no TLS; its public proxy does.
      ssl: /\.railway\.internal/.test(DATABASE_URL) ? false : { rejectUnauthorized: false },
    })
  : null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS callsense_leads (
  id             BIGSERIAL PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name      TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT,
  company        TEXT NOT NULL,
  city           TEXT,
  industry       TEXT NOT NULL,
  team_size      TEXT,
  calls_per_day  TEXT,
  phone_system   TEXT,
  languages      TEXT[] NOT NULL DEFAULT '{}',
  message        TEXT,
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  referrer       TEXT,
  landing_page   TEXT,
  user_agent     TEXT,
  status         TEXT NOT NULL DEFAULT 'new'
);
CREATE INDEX IF NOT EXISTS callsense_leads_created_at_idx ON callsense_leads (created_at DESC);
COMMENT ON TABLE callsense_leads IS 'Missed-lead report requests from callsense.in. status: new / contacted / won / lost.';
`;

let dbReady = false;
async function initDb() {
  if (!pool) {
    console.warn("DATABASE_URL is not set: requests cannot be stored.");
    return;
  }
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await pool.query(SCHEMA);
      dbReady = true;
      console.log("Database ready (table: callsense_leads).");
      return;
    } catch (e) {
      console.error(`Database init attempt ${attempt} failed: ${e.message}`);
      await new Promise((r) => setTimeout(r, Math.min(2000 * attempt, 15000)));
    }
  }
}

// ---------- validation ----------
const INDUSTRIES = new Set([
  "real_estate", "coaching", "d2c", "clinic", "insurance_loans", "automobile", "travel", "b2b_sales", "other",
]);
const TEAM = new Set(["1_3", "4_10", "11_25", "26_plus"]);
const CALLS = new Set(["under_50", "50_200", "200_500", "500_plus"]);
const SYSTEMS = new Set(["superfone", "exotel", "myoperator", "knowlarity", "ozonetel", "mobile_sim", "panel_dialer", "other", "not_sure"]);
const LANGS = new Set(["hindi", "english", "hinglish", "marathi", "gujarati", "bengali", "tamil", "telugu", "kannada", "malayalam", "punjabi", "other"]);
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

const clean = (v, max) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
const pick = (v, set) => (typeof v === "string" && set.has(v) ? v : null);
const digits = (s) => s.replace(/\D/g, "");

function validate(body) {
  const errors = {};
  const lead = {
    full_name: clean(body.full_name, 120),
    phone: clean(body.phone, 40),
    email: clean(body.email, 254).toLowerCase() || null,
    company: clean(body.company, 160),
    city: clean(body.city, 80) || null,
    industry: pick(body.industry, INDUSTRIES),
    team_size: pick(body.team_size, TEAM),
    calls_per_day: pick(body.calls_per_day, CALLS),
    phone_system: pick(body.phone_system, SYSTEMS),
    languages: Array.isArray(body.languages)
      ? [...new Set(body.languages.filter((c) => LANGS.has(c)))].slice(0, 12)
      : [],
    message: clean(body.message, 2000) || null,
    utm_source: clean(body.utm_source, 120) || null,
    utm_medium: clean(body.utm_medium, 120) || null,
    utm_campaign: clean(body.utm_campaign, 160) || null,
    referrer: clean(body.referrer, 500) || null,
    landing_page: clean(body.landing_page, 200) || null,
  };
  const n = digits(lead.phone).length;
  if (lead.full_name.length < 2) errors.full_name = "Please enter your name.";
  if (n < 10 || n > 13) errors.phone = "Please enter a 10-digit mobile number.";
  if (lead.email && !EMAIL_RE.test(lead.email)) errors.email = "Please check this email address.";
  if (lead.company.length < 2) errors.company = "Please enter your business name.";
  if (!lead.industry) errors.industry = "Please choose your business type.";
  return { lead, errors };
}

// ---------- tiny in-memory rate limit (single replica) ----------
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_HITS;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) if (!list.some((t) => now - t < WINDOW_MS)) hits.delete(ip);
}, WINDOW_MS).unref();

// ---------- app ----------
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // Railway sits behind one proxy hop

// Always https, and one canonical host: www.callsense.in and the Railway address -> callsense.in.
// /health is left alone so Railway's internal health check keeps working.
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  const host = (req.get("host") || "").toLowerCase();
  const proto = req.get("x-forwarded-proto");
  if (host === "www." + CANONICAL_HOST || host.endsWith(".up.railway.app")) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }
  if (proto === "http") {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  if (proto === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; " +
      "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; " +
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  next();
});

app.get("/health", async (_req, res) => {
  let db = "not_configured";
  if (pool) {
    try {
      await pool.query("SELECT 1");
      db = dbReady ? "ok" : "starting";
    } catch {
      db = "error";
    }
  }
  res.json({ ok: true, name: "callsense-site", db });
});

app.post("/api/leads", express.json({ limit: "20kb" }), async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Spam traps: a hidden field humans never fill, and a minimum time on the page.
  const startedAt = Number(body.started_at);
  if (clean(body.company_site, 200) || (startedAt && Date.now() - startedAt < 2500)) {
    return res.status(200).json({ ok: true }); // pretend success, store nothing
  }
  if (rateLimited(req.ip || "unknown")) {
    return res
      .status(429)
      .json({ ok: false, error: "Too many requests. Please try again in a few minutes." });
  }

  const { lead, errors } = validate(body);
  if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });

  if (!pool || !dbReady) {
    console.error("Lead rejected: database not ready.");
    return res
      .status(503)
      .json({ ok: false, error: "We couldn't save your request just now. Please try again shortly." });
  }

  try {
    await pool.query(
      `INSERT INTO callsense_leads (full_name, phone, email, company, city, industry, team_size, calls_per_day,
                                    phone_system, languages, message, utm_source, utm_medium, utm_campaign,
                                    referrer, landing_page, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        lead.full_name, lead.phone, lead.email, lead.company, lead.city, lead.industry, lead.team_size,
        lead.calls_per_day, lead.phone_system, lead.languages, lead.message, lead.utm_source, lead.utm_medium,
        lead.utm_campaign, lead.referrer, lead.landing_page, clean(req.get("user-agent") || "", 400) || null,
      ]
    );
    console.log(`New report request (industry=${lead.industry}).`);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error("Insert failed:", e.message);
    res
      .status(500)
      .json({ ok: false, error: "We couldn't save your request just now. Please try again shortly." });
  }
});

// ---------- industry landing pages ----------
// /real-estate, /coaching, /d2c and /clinics serve the home page pre-set to that industry, each with its
// own title, description and canonical URL so search engines can list them separately.
const INDUSTRY_PAGES = {
  "real-estate": {
    key: "realestate",
    title: "Call Recording Analysis for Real Estate in India | CallSense",
    description:
      "Builders and brokers: see which hot leads your team never called back. Every call checked, with budget, BHK and site-visit status pulled out.",
  },
  coaching: {
    key: "coaching",
    title: "Admission Call Analysis for Coaching Institutes | CallSense",
    description:
      "Every admission call transcribed, with course, exam, fee objections and demo bookings pulled out. Know which parents to call back, every morning.",
  },
  d2c: {
    key: "d2c",
    title: "COD and NDR Call Analysis for D2C Brands | CallSense",
    description:
      "Know why customers cancel COD orders, what they complain about and which agents save the most orders. Every call checked, every day.",
  },
  clinics: {
    key: "clinic",
    title: "Appointment Call Analysis for Clinics | CallSense",
    description:
      "See which callers asked for appointments and didn't book, what treatments people ask about and how your front desk handles calls, every day.",
  },
};
const escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const pageCache = new Map();
function industryPage(slug) {
  if (pageCache.has(slug)) return pageCache.get(slug);
  const a = INDUSTRY_PAGES[slug];
  const url = `https://${CANONICAL_HOST}/${slug}`;
  const html = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf8")
    .replace('<html lang="en-IN" data-ind="general">', `<html lang="en-IN" data-ind="${a.key}" data-ind-from="page">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escAttr(a.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escAttr(a.description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escAttr(a.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escAttr(a.description)}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escAttr(a.title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escAttr(a.description)}">`);
  pageCache.set(slug, html);
  return html;
}

app.get(Object.keys(INDUSTRY_PAGES).map((s) => `/${s}`), (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.type("html").send(industryPage(req.path.slice(1).replace(/\/+$/, "")));
});

app.use(
  express.static(PUBLIC_DIR, {
    extensions: ["html"],
    setHeaders: (res, file) => {
      res.setHeader("Cache-Control", file.endsWith(".html") ? "no-cache" : "public, max-age=3600");
    },
  })
);

app.use((_req, res) => res.status(404).sendFile(path.join(PUBLIC_DIR, "404.html")));

app.listen(PORT, "0.0.0.0", () => console.log(`callsense-site listening on :${PORT}`));
initDb();
