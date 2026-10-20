// Builds public/index.html: home page (data-ind="general") plus the 4 industry versions
// (realestate, coaching, d2c, clinic) shown by data-show. The server serves /real-estate,
// /coaching, /d2c and /clinics from this same file with their own meta tags.
// Run: node scripts/build-home.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "index.html");
const PARTS = path.join(ROOT, "scripts", "home-parts");
const S = "https://callsense.in";
const esc = (s) => s.replace(/&/g, "&amp;");
const show = (o) => Object.entries(o).map(([k, v]) => `<span data-show="${k}">${v}</span>`).join("");

// ---------- industries: name, where leads leak, page, form value ----------
const IND = [
  ["Real estate", "Site-visit leads never followed up", "/real-estate", "real_estate"],
  ["Coaching & education", "Interested parents never called back", "/coaching", "coaching"],
  ["E-commerce & D2C", "Orders cancelled on confirmation calls", "/d2c", "d2c"],
  ["Clinics & hospitals", "Callers who never booked", "/clinics", "clinic"],
  ["Insurance", "Quotes not closed, renewals not called", null, "insurance"],
  ["Loans & finance", "Applications dropped after the first call", null, "loans"],
  ["Car & bike dealers", "Test drives never booked", null, "automobile"],
  ["Travel & tours", "Enquiries lost to a competitor", null, "travel"],
  ["B2B & manufacturing", "Quotes sent, never chased", null, "b2b_sales"],
  ["Solar & home services", "Site surveys never scheduled", null, "home_services"],
  ["Interiors & furniture", "Consultations not followed up", null, "interiors"],
  ["Hotels & events", "Booking enquiries lost on price", null, "hospitality"],
  ["Schools & colleges", "Admission enquiries gone cold", null, "education"],
  ["Recruitment & staffing", "Candidates who dropped out", null, "recruitment"],
  ["Gyms & salons", "Trial visitors never converted", null, "fitness_beauty"],
  ["Software & SaaS", "Demo requests never booked", null, "saas"],
];

// ---------- sample report per version ----------
const REPORTS = {
  general: {
    title: "Missed-lead report", calls: "1,240", kpis: [["86", "hot leads"], ["23", "never called back", "bad"], ["9", "unhappy customers"]],
    listTitle: "Call back today", cols: ["Lead", "Wanted", "Waiting", "Owner"],
    rows: [["Amit S.", "A quote", "4 days", "Rahul"], ["Priya K.", "A demo", "3 days", "Sunil"], ["Vikas M.", "Pricing", "6 days", "Rahul"]],
    why: [["Price too high", 34], ["Chose a competitor", 21], ["Not the right time", 18], ["Needed more info", 15], ["Other", 12]],
    best: "Sunil turns 41% of hot leads into a next step. The team average is 24%.",
  },
  realestate: {
    title: "Missed-lead report", calls: "1,240", kpis: [["86", "hot leads"], ["23", "never called back", "bad"], ["₹19 Cr", "budgets at stake"]],
    listTitle: "Call back today", cols: ["Lead", "Budget", "Waiting", "Agent"],
    rows: [["Amit S.", "₹85 L", "4 days", "Rahul"], ["Priya K.", "₹1.2 Cr", "3 days", "Sunil"], ["Vikas M.", "₹70 L", "6 days", "Rahul"]],
    why: [["Price", 31], ["Location", 22], ["Possession date", 18], ["Home loan worries", 12], ["Other", 17]],
    best: "Sunil books a site visit for 38% of hot leads. The team average is 21%.",
  },
  coaching: {
    title: "Missed-admission report", calls: "1,020", kpis: [["140", "interested parents"], ["31", "never called back", "bad"], ["52", "asked about instalments"]],
    listTitle: "Call back today", cols: ["Parent", "Course", "Waiting", "Counsellor"],
    rows: [["Mrs. Sharma", "JEE 2-year", "3 days", "Neha"], ["Mr. Reddy", "NEET 1-year", "5 days", "Arjun"], ["Mrs. Khan", "Foundation", "2 days", "Neha"]],
    why: [["Fee too high", 36], ["Batch timing", 22], ["Chose another institute", 19], ["Hostel / stay", 11], ["Other", 12]],
    best: "Neha turns 44% of demo-class bookings into admissions. The team average is 27%.",
  },
  d2c: {
    title: "Cancellations and returns report", calls: "2,150", kpis: [["312", "orders cancelled or refused"], ["96", "could have been saved", "bad"], ["₹4.1 L", "order value lost"]],
    listTitle: "Most cancelled", cols: ["Product", "Cancels", "Main reason", ""],
    rows: [["Linen kurta", "41", "Wrong size", ""], ["Denim jacket", "23", "Refused at door", ""], ["White sneakers", "18", "Late delivery", ""]],
    why: [["Wrong size", 28], ["Refused at the door", 20], ["Delivery too slow", 18], ["Changed mind", 16], ["Found it cheaper", 10], ["Other", 8]],
    best: "Pooja saves 1 in 3 orders on confirmation and delivery calls. The team average is 1 in 5.",
  },
  clinic: {
    title: "Missed-appointment report", calls: "1,860", kpis: [["214", "wanted an appointment"], ["61", "didn't book", "bad"], ["37", "asked for weekends"]],
    listTitle: "Call back today", cols: ["Caller", "For", "Waiting", "Branch"],
    rows: [["Anita R.", "Knee pain", "2 days", "Whitefield"], ["Rohan P.", "Skin allergy", "1 day", "Indiranagar"], ["Meera J.", "Child's fever", "1 day", "Whitefield"]],
    why: [["No weekend slot", 33], ["Doctor unavailable", 24], ["Fees", 17], ["Long wait", 14], ["Other", 12]],
    best: "Indiranagar branch books 72% of callers. Whitefield books 41%.",
  },
};
for (const [k, r] of Object.entries(REPORTS)) {
  const t = r.why.reduce((a, [, v]) => a + v, 0);
  if (t !== 100) throw new Error(`${k} reasons add up to ${t}`);
}

function report(key, r) {
  const cols = r.cols.filter(Boolean);
  return `          <article class="report-card" data-show="${key}">
            <div class="rc-head"><span class="rc-title">${r.title}</span><span class="rc-tag">Sample</span></div>
            <p class="rc-range">Last 30 days · ${r.calls} calls checked by AI</p>
            <div class="kpis">${r.kpis.map(([n, l, c]) => `<div${c ? ` class="${c}"` : ""}><b>${n}</b><span>${l}</span></div>`).join("")}</div>
            <p class="rc-sub">${r.listTitle}</p>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
              <tbody>${r.rows.map((row) => `<tr>${row.slice(0, cols.length).map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
            </table></div>
            <p class="rc-sub">${{ d2c: "Why orders were cancelled or refused", clinic: "Why callers didn't book", coaching: "Why parents didn't join" }[key] || "Why people didn't buy"}</p>
            <ul class="bars">${r.why.map(([l, v]) => `<li><span>${l}</span><i data-w="${v}"></i><b>${v}%</b></li>`).join("")}</ul>
            <p class="rc-best">${r.best}</p>
          </article>`;
}

// ---------- reused parts (sample call cards + ChatGPT examples) ----------
const CALLS = fs.readFileSync(path.join(PARTS, "calls.html"), "utf8").trimEnd();
const CHATS = fs.readFileSync(path.join(PARTS, "chats.html"), "utf8").trimEnd();

const REPORT_NAME = show({ general: "missed-lead report", realestate: "missed-lead report", coaching: "missed-admission report", d2c: "cancellations report", clinic: "missed-appointment report" });

const FAQ = [
  ["What do you need from us?", "Read-only access to your call recordings, plus your lead, order or appointment list if you have one. No recordings yet? We set up recording on your team's phones."],
  ["Which languages?", "Hindi, English, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Arabic, Spanish and 50+ more, including calls that switch languages. Reports come back in English."],
  ["How fast?", "Your report 48 hours after we connect to your calls. Daily alerts and the dashboard in about a week."],
  ["Is recording calls legal?", "Yes, with notice. We set up the \"this call may be recorded\" message for you. We follow India's DPDP Act and, for Europe and the UK, GDPR."],
];

const LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${S}/#org`, name: "CallSense", url: `${S}/`, logo: `${S}/logo-512.png`, email: "himanshu@callsense.in" },
    { "@type": "WebSite", "@id": `${S}/#website`, url: `${S}/`, name: "CallSense", inLanguage: "en-IN", publisher: { "@id": `${S}/#org` } },
    {
      "@type": "Service", "@id": `${S}/#service`, name: "CallSense AI call analysis", serviceType: "AI call recording analysis",
      provider: { "@id": `${S}/#org` },
      areaServed: [{ "@type": "Country", name: "India" }, { "@type": "Place", name: "Worldwide" }],
      availableLanguage: ["Hindi", "English", "Tamil", "Telugu", "Marathi", "Bengali", "Gujarati", "Kannada", "Arabic", "Spanish"],
      audience: IND.map(([n]) => ({ "@type": "BusinessAudience", audienceType: n })),
      description: "AI that checks every sales and customer call in 50+ languages and shows which leads were never called back, why people didn't buy and who on the team sells best, with a live dashboard, daily alerts and answers in ChatGPT or Claude. Starts with a missed-lead report on the last 30 days of calls.",
    },
    { "@type": "FAQPage", "@id": `${S}/#faq`, mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ],
};

const html = `<!doctype html>
<html lang="en-IN" data-ind="general">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>CallSense · Know Which Leads Your Team Lost, and Why</title>
  <meta name="description" content="AI checks every sales call in 50+ languages and shows which leads your team never called back, why people didn't buy and who sells best.">
  <meta name="theme-color" content="#fbfbfd" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
  <link rel="canonical" href="${S}/">
  <meta property="og:site_name" content="CallSense">
  <meta property="og:locale" content="en_IN">
  <meta property="og:title" content="CallSense · Know which leads your team lost, and why">
  <meta property="og:description" content="AI checks every sales call in 50+ languages: who was never called back, why people didn't buy, who sells best.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${S}/">
  <meta property="og:image" content="${S}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="CallSense: know which leads your team lost, and why">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="CallSense · Know which leads your team lost, and why">
  <meta name="twitter:description" content="AI checks every sales call in 50+ languages: who was never called back, why people didn't buy, who sells best.">
  <meta name="twitter:image" content="${S}/og-image.png">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="Plain summary for AI assistants">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <script type="application/ld+json">${JSON.stringify(LD)}</script>
  <!-- Picks the industry version before first paint, so the wrong example never flashes -->
  <script src="/ind-init.js?v=3"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="/styles.css?v=11">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>

  <header class="nav" id="nav">
    <div class="nav-inner">
      <a class="brand" href="/" aria-label="CallSense home">
        <img class="brand-mark" src="/logo.svg" alt="" width="28" height="28">
        <span>CallSense</span>
      </a>
      <nav class="nav-links" id="nav-links" aria-label="Main">
        <a href="#cost">What it costs you</a>
        <a href="#how">How it works</a>
        <a href="#industries">Industries</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a class="btn btn-sm" href="#demo">Get my report</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu"><span></span><span></span></button>
    </div>
  </header>

  <main id="main">
    <!-- HERO: the pain, and the report that proves it -->
    <section class="hero" id="top">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">${show({ general: "AI call analysis · 50+ languages", realestate: "For builders, brokers and real estate teams", coaching: "For coaching institutes and education", d2c: "For e-commerce and D2C brands", clinic: "For clinics and hospitals" })}</p>
          <h1>${show({
            general: 'Know which leads your team lost, <span class="grad">and why.</span>',
            realestate: 'Know which site-visit leads <span class="grad">nobody called back.</span>',
            coaching: 'Know which interested parents <span class="grad">never got a call back.</span>',
            d2c: 'Know why COD orders get cancelled or refused, <span class="grad">and save them.</span>',
            clinic: 'Know who wanted an appointment <span class="grad">and didn\'t book.</span>',
          })}</h1>
          <p class="lede">${show({
            general: "Our AI checks every call, in 50+ languages, and tells you who to call back today, why people didn't buy, and who on your team sells best.",
            realestate: "Our AI checks every call, in 50+ languages, and tells you who to call back today, why buyers said no, and which agent books the most site visits.",
            coaching: "Our AI checks every call, in 50+ languages, and tells you which parents to call back today, why they didn't join, and which counsellor converts best.",
            d2c: "Our AI checks every confirmation and delivery call, in 50+ languages, and tells you why orders fail, by product, courier and PIN code, and who saves the most.",
            clinic: "Our AI checks every call, in 50+ languages, and tells you who to call back today, why callers didn't book, and how each branch and doctor's desk performs.",
          })}</p>
          <div class="cta-row"><a class="btn" href="#demo"><span>Get my ${REPORT_NAME}</span></a></div>
          <p class="fine">Your last 30 days of calls, results 48 hours after we connect. Keep the report either way. Like it? Continue on a monthly plan, cancel any time.</p>
          <p class="fine">${show({
            general: "Send your lead list too, and we flag every lead that never got a call.",
            realestate: "Send your lead list from 99acres, MagicBricks or Facebook too, and we flag every lead that never got a call.",
            coaching: "Send your enquiry sheet too, and we flag every parent who never got a call.",
            d2c: "Send your order export too, and we match every call to its order and courier.",
            clinic: "Send your appointment list too, and we flag every caller who never got booked.",
          })} No call recording yet? We set it up on your team's phones, and your first report covers the first 7 days.</p>
        </div>

        <div class="hero-visual" aria-label="Sample report">
${Object.entries(REPORTS).map(([k, r]) => report(k, r)).join("\n")}
        </div>
      </div>
    </section>

    <!-- COST: their own numbers -->
    <section class="section alt" id="cost">
      <div class="wrap narrow">
        <div class="sec-head center reveal"><h2>${show({ general: "What missed leads cost you.", realestate: "What missed leads cost you.", coaching: "What missed admissions cost you.", d2c: "What failed orders cost you.", clinic: "What missed appointments cost you." })}</h2><p class="sec-lede">Put in your own numbers.</p></div>
        <form class="calc card reveal" id="calc" aria-label="Missed leads cost calculator">
          <label class="field"><span>${show({general:"Leads missed a month",realestate:"Leads missed a month",coaching:"Parents not called back a month",d2c:"Orders cancelled a month",clinic:"Callers who didn't book a month"})}</span><input name="missed" type="number" inputmode="numeric" min="0" value="20"></label>
          <label class="field"><span>${show({general:"How many would have bought",realestate:"How many would have bought",coaching:"How many would have joined",d2c:"How many could be saved",clinic:"How many would have booked"})}</span><select name="rate"><option value="0.05">1 in 20</option><option value="0.1" selected>1 in 10</option><option value="0.2">1 in 5</option></select></label>
          <label class="field"><span>${show({general:"Value of one sale",realestate:"Your earning per sale",coaching:"Fee per student",d2c:"Average order value",clinic:"Value of one new patient"})}</span><span class="money"><select name="cur" aria-label="Currency"><option value="INR">₹</option><option value="USD">$</option><option value="EUR">€</option><option value="GBP">£</option></select><input name="value" type="number" inputmode="numeric" min="0" value="50000" aria-label="Value of one sale"></span></label>
          <output class="calc-out" name="out" aria-live="polite"><b data-out="month">₹1,00,000</b> lost a month<span><b data-out="year">₹12,00,000</b> a year</span></output>
        </form>
        <p class="note reveal">Your report shows exactly which ones these are.</p>
      </div>
    </section>

    <!-- ONE CALL -->
    <section class="section" id="how">
      <div class="wrap split">
        <div class="reveal">
          <h2 class="h2">AI understands every call.</h2>
          <ul class="ticks lg gap-top">
            <li>Full transcript, in any language</li>
            <li>Mood: keen, unsure or angry</li>
            <li>Key details and the next step</li>
            <li>A morning list of who to call back</li>
          </ul>
          <ol class="mini-steps">
            <li><b>1</b> Your team calls as usual</li>
            <li><b>2</b> AI checks every call</li>
            <li><b>3</b> You act on the list</li>
          </ol>
        </div>
        <div class="reveal">
${CALLS}
        </div>
      </div>
    </section>

    <!-- ASK -->
    <section class="section alt" id="ask">
      <div class="wrap split">
        <div class="reveal">
          <h2 class="h2">Ask your calls anything.</h2>
          <p class="sec-lede">In ChatGPT or Claude, in your own words.</p>
        </div>
${CHATS}
      </div>
    </section>

    <!-- INDUSTRIES -->
    <section class="section" id="industries" data-show="general">
      <div class="wrap">
        <div class="sec-head reveal"><h2>Where leads leak in your industry.</h2></div>
        <div class="grid4 ind-grid">
${IND.map(([n, l, href]) => href ? `          <a class="card ind-card reveal" href="${href}"><h3>${esc(n)}</h3><p>${l}.</p></a>` : `          <div class="card reveal"><h3>${esc(n)}</h3><p>${l}.</p></div>`).join("\n")}
        </div>
        <p class="note reveal">And any team that talks to customers on the phone.</p>
      </div>
    </section>

    <!-- PRIVACY -->
    <section class="section dark" id="security">
      <div class="wrap">
        <div class="sec-head reveal"><h2>Your calls stay yours.</h2></div>
        <div class="grid3">
          <div class="feat reveal"><h3>Private</h3><p>${show({ general: "Seen only by people you approve.", realestate: "Seen only by people you approve.", coaching: "Seen only by people you approve.", d2c: "Seen only by people you approve.", clinic: "Patient calls stay confidential, seen only by your staff." })}</p></div>
          <div class="feat reveal"><h3>Never sold</h3><p>Not shared, not used to train AI.</p></div>
          <div class="feat reveal"><h3>Deleted on request</h3><p>Any call, any time. India's DPDP Act and GDPR followed.</p></div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section" id="faq">
      <div class="wrap narrow">
        <div class="sec-head reveal"><h2>FAQ</h2></div>
        <div class="faq">
${FAQ.map(([q, a]) => `          <details><summary>${q}</summary><p>${a}</p></details>`).join("\n")}
        </div>
      </div>
    </section>

    <!-- REPORT FORM -->
    <section class="section alt" id="demo">
      <div class="wrap form-wrap">
        <div class="sec-head center reveal">
          <h2>Get your ${REPORT_NAME}.</h2>
          <p class="sec-lede">We check your last 30 days of calls and send the report on WhatsApp or email, 48 hours after we connect.</p>
        </div>

        <form class="form card" id="lead-form" novalidate>
          <div class="row2">
            <label class="field"><span>Your name</span><input name="full_name" autocomplete="name" required><small class="err" data-for="full_name"></small></label>
            <label class="field"><span>Phone or WhatsApp</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="With country code, e.g. +91" required><small class="err" data-for="phone"></small></label>
          </div>
          <div class="row2">
            <label class="field"><span>Company</span><input name="company" autocomplete="organization" required><small class="err" data-for="company"></small></label>
            <label class="field"><span>Email <em>(optional)</em></span><input name="email" type="email" autocomplete="email"><small class="err" data-for="email"></small></label>
          </div>
          <label class="field"><span>Your business</span>
            <select name="industry" required><option value="">Choose</option>${IND.map(([n, , , v]) => `<option value="${v}">${esc(n)}</option>`).join("")}<option value="other">Other</option></select>
            <small class="err" data-for="industry"></small>
          </label>
          <label class="hp" aria-hidden="true">Leave this empty<input name="company_site" tabindex="-1" autocomplete="off"></label>
          <p class="form-status" role="alert"></p>
          <button class="btn btn-block" type="submit">Get my report</button>
          <p class="form-note">We never contact your customers. <a href="/privacy">Privacy</a></p>
        </form>

        <div class="card done" id="lead-done" tabindex="-1" hidden>
          <div class="done-icon" aria-hidden="true">✓</div>
          <h3>Thank you. Request received.</h3>
          <p>We'll reach you within one working day to connect your calls. Your report follows 48 hours later.</p>
          <p class="fine">In a hurry? Email <a href="mailto:himanshu@callsense.in">himanshu@callsense.in</a></p>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="wrap foot">
      <a class="brand" href="/" aria-label="CallSense home"><img class="brand-mark" src="/logo.svg" alt="" width="28" height="28"><span>CallSense</span></a>
      <p>Know which leads your team lost, and why.<br>Contact: <a href="mailto:himanshu@callsense.in">himanshu@callsense.in</a></p>
      <p class="foot-links"><a href="/real-estate">Real estate</a><a href="/coaching">Coaching</a><a href="/d2c">E-commerce</a><a href="/clinics">Clinics</a><a href="/guides/">Guides</a><a href="/privacy">Privacy</a></p>
    </div>
  </footer>

  <script src="/industry.js?v=7" defer></script>
  <script src="/calc.js?v=1" defer></script>
  <script src="/app.js?v=5" defer></script>
</body>
</html>
`;
fs.writeFileSync(OUT, html);
console.log(`built index.html (${html.length} chars)`);
