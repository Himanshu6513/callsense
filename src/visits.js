// Counts real page views (no cookies, bots skipped) so it's clear how many people visit and where from.
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|python|axios|node-fetch|headless|lighthouse|uptime/i;
const isPage = (p) => !p.startsWith("/api/") && p !== "/health" && (!/\.[a-z0-9]+$/i.test(p) || p.endsWith(".html"));
const str = (v, max) => (typeof v === "string" && v ? v.slice(0, max) : null);

export const visitsSchema = (table) => `
CREATE TABLE IF NOT EXISTS ${table} (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  path         TEXT NOT NULL,
  referrer     TEXT,
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT
);
CREATE INDEX IF NOT EXISTS ${table}_created_at_idx ON ${table} (created_at DESC);
`;

export function visitLogger(pool, table, isReady) {
  return (req, _res, next) => {
    if (req.method === "GET" && isReady() && isPage(req.path) && !BOT_RE.test(req.get("user-agent") || "")) {
      let ref = null;
      try { ref = new URL(req.get("referer") || "").hostname || null; } catch {}
      pool
        .query(`INSERT INTO ${table} (path, referrer, utm_source, utm_medium, utm_campaign) VALUES ($1,$2,$3,$4,$5)`, [
          req.path.slice(0, 200), ref, str(req.query.utm_source, 120), str(req.query.utm_medium, 120), str(req.query.utm_campaign, 160),
        ])
        .catch((e) => console.error("Visit log failed:", e.message));
    }
    next();
  };
}
