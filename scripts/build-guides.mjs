// Builds the answer-style guides in public/guides/ from the content below.
// Run: node scripts/build-guides.mjs   (then deploy, update sitemap lastmod, ping IndexNow)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "guides");
const SITE = "https://callsense.in";
const PUBLISHED = "2026-10-20";
const CSS = "/styles.css?v=1";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MARK = `<img class="brand-mark" src="/logo.svg" alt="" width="28" height="28">`;

function shell({ title, description, canonical, jsonld, body }) {
  return `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <meta property="og:site_name" content="CallSense">
  <meta property="og:locale" content="en_IN">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="${CSS}">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
  <header class="nav scrolled">
    <div class="nav-inner">
      <a class="brand" href="/" aria-label="CallSense home">${MARK}<span>CallSense</span></a>
      <a class="btn btn-sm" href="/#demo">Book a demo</a>
    </div>
  </header>
  <main class="page">
${body}
  </main>
  <footer class="footer">
    <div class="wrap foot">
      <a class="brand" href="/" aria-label="CallSense home">${MARK}<span>CallSense</span></a>
      <p>Every customer call, understood.<br>Contact: <a href="mailto:himanshu@callsense.in">himanshu@callsense.in</a></p>
      <p class="foot-links"><a href="/real-estate">Real estate</a><a href="/coaching">Coaching</a><a href="/d2c">D2C brands</a><a href="/clinics">Clinics</a><a href="/guides/">Guides</a><a href="/privacy">Privacy</a></p>
    </div>
  </footer>
</body>
</html>
`;
}

const ORG = { "@type": "Organization", name: "CallSense", url: `${SITE}/`, logo: `${SITE}/logo-512.png` };

const guides = [
  {
    slug: "analyse-sales-call-recordings-in-hindi",
    title: "How to Analyse Sales Call Recordings in Hindi and Hinglish",
    short: "Analyse call recordings in Hindi",
    description: "A practical way for Indian businesses to turn Hindi, Hinglish and English call recordings into transcripts, lead details, mood and reports, without listening to every call.",
    answer: "To analyse sales calls in Hindi or Hinglish, first collect the recordings from your calling system, transcribe them with a speech model that handles code-mixed Hindi and English, then pull the same fields out of every transcript (such as budget, product, objection and next step) and store them in a table. Once every call is a row, you can count, filter, chart and ask questions across all of them.",
    sections: [
      ["Why listening to recordings doesn't work", `<p>A team of five making 60 calls a day each produces about 300 calls a day. Nobody can listen to that. Owners end up sampling a few calls, or relying on what the team writes in the CRM, which is usually short and often missing.</p>`],
      ["Step 1: Get every recording automatically", `<p>Business calling apps and cloud telephony providers such as Superfone, Exotel, MyOperator and Knowlarity save call recordings and can send them out as soon as a call ends, usually through a webhook. That means no one has to download files by hand.</p>`],
      ["Step 2: Transcribe in the language your customers speak", `<p>Most Indian sales calls switch between Hindi and English in the same sentence. Use a transcription model that handles this code-mixing, and keep the transcript in the words actually spoken, in Roman or Devanagari script, rather than a loose translation. Test it on 20 or 30 of your own calls before you rely on it, because accents, line quality and industry words all affect accuracy.</p>`],
      ["Step 3: Pull out the same fields from every call", `<p>A transcript is still too long to read. The value comes from turning each call into the same short set of fields. For example:</p><ul><li><strong>Real estate:</strong> budget, BHK, location, loan needed, site visit booked, reason for not booking.</li><li><strong>Coaching:</strong> course, exam, class, parent or student, fee concern, demo booked.</li><li><strong>D2C:</strong> order value, COD confirmed or cancelled, cancel reason, product complaint.</li></ul><p>Add a mood or intent label (keen, unsure, angry, just browsing) and a next step. Always keep a link back to the call so anyone can check.</p>`],
      ["Step 4: Put it where you'll actually look", `<p>Store each call as a row in a database, then show it in a simple dashboard: calls by agent, outcomes, top lost reasons, follow-ups due. Alerts help most: a message when a hot lead has not been called back in 24 hours is worth more than any chart.</p>`],
      ["Step 5: Ask questions in plain language", `<p>Once the data is in a database, ChatGPT or Claude can read it through a private, read-only connector. Then an owner can ask “Is hafte kitne logon ne site visit ke liye haan bola?” and get the answer with the calls behind it.</p>`],
    ],
    faq: [
      ["Can AI understand Hinglish phone calls?", "Yes. Current speech models handle Hindi and English mixed in the same sentence well on clear lines. Accuracy drops on noisy calls, so test on your own recordings first."],
      ["Do I need to translate calls into English?", "No. It is better to keep the transcript in the words spoken and pull the key details out in English, so your dashboard is consistent while the original stays checkable."],
      ["Which Indian languages can be analysed?", "Hindi, English and Hinglish work best today. Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam and Punjabi can also be handled, but you should test them on your own calls."],
    ],
  },
  {
    slug: "superfone-call-recording-analysis",
    title: "Superfone Call Recordings: How to Get Insights and Ask ChatGPT",
    short: "Superfone call recording analysis",
    description: "How to take Superfone call recordings beyond single-call summaries: lead fields across every call, agent reports, alerts, and asking ChatGPT about your calls.",
    answer: "Superfone records business calls and can send each recording to another system through its webhooks as soon as it is ready. Sending those recordings to a call-analysis service lets you transcribe them, fill in the same lead fields from every call, see totals and trends in a dashboard, get alerts, and ask ChatGPT or Claude questions across all your calls.",
    sections: [
      ["What Superfone gives you already", `<p>Superfone gives a business number that several team members can use, records calls, and offers AI summaries of individual calls. It can also notify other systems through webhooks set up in its Automations section, including when a call recording is available and when a call summary is ready.</p>`],
      ["Where single-call summaries stop", `<p>A summary tells you what happened on one call. Owners usually want answers across many calls: how many hot leads came in this week, why people didn't book, which agent converts best, who wasn't called back. That needs every call turned into the same fields and stored together.</p>`],
      ["How the connection works", `<ol><li>In Superfone, a webhook is pointed at the analysis service for the “call recording available” event.</li><li>When a call ends, the service receives the call details (number, agent, direction, duration) and a link to the recording.</li><li>It downloads the recording, transcribes it, pulls out your fields, mood and next step, and saves the result.</li><li>The dashboard, alerts and ChatGPT connection read from that saved data.</li></ol><p>Your team keeps using the Superfone app exactly as before.</p>`],
      ["What you can ask once it's connected", `<ul><li>“Which leads from this week said yes to a site visit but haven't had a confirmation call?”</li><li>“What were the top three reasons customers didn't buy last month?”</li><li>“Compare Rahul and Sunil: calls, average call length, and how many leads they moved forward.”</li></ul>`],
    ],
    faq: [
      ["Does Superfone have webhooks?", "Yes. Superfone webhooks are set up in its dashboard under Automations, and include events for all calls, missed calls, call recordings becoming available and call summaries being ready."],
      ["Can I see which team member took the call on a shared Superfone number?", "Yes. Call events include the staff member behind the business number, so each call can be credited to the right agent."],
      ["Do my team need to install anything new?", "No. They keep calling from Superfone. The analysis runs on the recordings after each call ends."],
    ],
  },
  {
    slug: "real-estate-sales-call-tracking",
    title: "Real Estate Sales Calls: What to Track to Get More Site Visits",
    short: "Real estate call tracking",
    description: "The details builders and brokers in India should capture from every enquiry call, and how to use them to book more site visits and stop losing hot leads.",
    answer: "For real estate enquiry calls, track the buyer's budget, configuration (such as 2 or 3 BHK), preferred location, timeline, whether they need a home loan, whether a site visit was booked, and the reason if it wasn't. Add a lead temperature and a next step with a date. Captured from every call, these show which leads to chase today, why visits don't happen, and which agents convert.",
    sections: [
      ["Why calls are where deals are won or lost", `<p>Most property buyers first speak to someone on the phone, from a portal lead, an ad or a hoarding. What gets said on that first call, and how fast the follow-up happens, decides whether a site visit gets booked. Yet most of it never reaches the CRM.</p>`],
      ["The fields worth capturing from every call", `<ul><li><strong>Budget</strong> (for example ₹70 to 85 lakh)</li><li><strong>Configuration</strong>: 1, 2, 3 BHK, plot, villa</li><li><strong>Location</strong> and any project named</li><li><strong>Timeline</strong>: ready to move, under construction, just exploring</li><li><strong>Home loan</strong> needed or not</li><li><strong>Site visit</strong>: booked, date and time, or not booked</li><li><strong>Main objection</strong>: price, location, possession date, builder trust</li><li><strong>Lead temperature</strong> and <strong>next step</strong> with a date</li></ul>`],
      ["Three reports every owner should see weekly", `<ol><li><strong>Hot leads not called back</strong> within 24 hours.</li><li><strong>Reasons visits didn't happen</strong>, counted across all calls.</li><li><strong>Agent comparison</strong>: calls, visits booked, and how often each agent asks about budget and timeline.</li></ol>`],
      ["How to capture it without extra work", `<p>Asking agents to type all this after every call rarely works. Recording calls through a business calling app and analysing them automatically fills these fields from the conversation itself, in Hindi, English or Hinglish, with a link back to the call.</p>`],
    ],
    faq: [
      ["What is a good site-visit conversion rate from enquiry calls?", "It varies widely by city, project and lead source. Measure your own baseline from a few weeks of calls, then track it week by week rather than comparing with other businesses."],
      ["How quickly should a real estate lead be called back?", "As fast as possible, ideally within minutes for new portal and ad leads. Interest drops quickly, and buyers often enquire with several builders at once."],
      ["Can channel partner calls be tracked too?", "Yes, if their calls go through a business number that records calls, the same fields can be captured and reported per partner."],
    ],
  },
  {
    slug: "what-is-call-intelligence",
    title: "What Is Call Intelligence? A Plain Guide for Indian Businesses",
    short: "What is call intelligence",
    description: "Call intelligence (also called conversation intelligence) explained simply: what it does with your sales and support calls, what it costs, and who in India it suits.",
    answer: "Call intelligence is software that listens to recorded business calls and turns them into data: a transcript, the customer's mood and intent, key details like budget or product, the outcome and the next step. Owners and managers use it to see why customers buy or don't, coach their team and follow up on every lead, without listening to recordings.",
    sections: [
      ["What it does, step by step", `<ol><li><strong>Records</strong> calls through your business calling system.</li><li><strong>Transcribes</strong> them, including Hindi and Hinglish.</li><li><strong>Understands</strong> each call: mood, intent, key details, objections, next step.</li><li><strong>Reports</strong> it in a dashboard, alerts and weekly summaries.</li><li><strong>Answers questions</strong> about your calls, increasingly through ChatGPT or Claude.</li></ol>`],
      ["Who it suits in India", `<p>Any business where a team makes or takes many customer calls a day: real estate builders and brokers, coaching institutes and edtech admission teams, D2C brands with COD confirmation and support calls, clinics and hospitals, insurance and loan agents, car dealers and travel agencies.</p>`],
      ["What it usually costs", `<p>Global tools are priced per user per month in dollars and often assume English-only calls. Services built for India are usually priced per month by call minutes or callers in rupees, with a setup fee for customising fields, labels and reports to the business.</p>`],
      ["What to check before you buy", `<ul><li>Does it handle your customers' languages, tested on your own calls?</li><li>Does it work with your calling system?</li><li>Can you choose the fields and labels that matter to your business?</li><li>Where is the data kept, who can see it, and can you delete it?</li></ul>`],
    ],
    faq: [
      ["Is call intelligence the same as call recording?", "No. Call recording saves the audio. Call intelligence analyses those recordings and turns them into data you can search, count and act on."],
      ["Is conversation intelligence only for big call centres?", "No. A team of three to five callers already produces too many calls for an owner to listen to, which is where it starts to pay off."],
      ["Does it replace a CRM?", "No. It fills in what was said on calls, which most CRMs miss, and can send those details into a CRM."],
    ],
  },
];

function guideHtml(g) {
  const url = `${SITE}/guides/${g.slug}`;
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: g.title, description: g.description, inLanguage: "en-IN", datePublished: PUBLISHED, dateModified: PUBLISHED, mainEntityOfPage: url, image: `${SITE}/og-image.png`, author: ORG, publisher: ORG },
      { "@type": "FAQPage", mainEntity: g.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides/` },
        { "@type": "ListItem", position: 3, name: g.short, item: url },
      ] },
    ],
  };
  const body = `    <article class="wrap narrow article">
      <p class="crumbs"><a href="/">Home</a> › <a href="/guides/">Guides</a></p>
      <h1>${esc(g.title)}</h1>
      <p class="meta">Updated ${new Date(PUBLISHED).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })} · CallSense</p>
      <p class="answer"><strong>Short answer:</strong> ${esc(g.answer)}</p>
${g.sections.map(([h, html]) => `      <h2>${esc(h)}</h2>\n      ${html}`).join("\n")}
      <h2>Frequently asked questions</h2>
${g.faq.map(([q, a]) => `      <h3>${esc(q)}</h3>\n      <p>${esc(a)}</p>`).join("\n")}
      <div class="cta-box">
        <p><strong>Want this for your own calls?</strong> CallSense transcribes your team's calls in Hindi, English or Hinglish, pulls out mood and key details into a live dashboard, and lets you ask ChatGPT about them.</p>
        <p><a class="btn" href="/#demo">Book a demo</a> <a class="link-arrow" href="/#how">How it works</a></p>
      </div>
    </article>`;
  return shell({ title: g.title, description: g.description, canonical: url, jsonld, body });
}

function indexHtml() {
  const url = `${SITE}/guides/`;
  const jsonld = { "@context": "https://schema.org", "@type": "CollectionPage", name: "CallSense guides", url, hasPart: guides.map((g) => ({ "@type": "Article", headline: g.title, url: `${SITE}/guides/${g.slug}` })) };
  const body = `    <div class="wrap narrow article">
      <p class="crumbs"><a href="/">Home</a> › Guides</p>
      <h1>Guides</h1>
      <p class="answer">Plain answers on analysing sales and support calls in Hindi, English and Hinglish, for Indian businesses that sell on the phone.</p>
      <ul class="guide-list">
${guides.map((g) => `        <li><a href="/guides/${g.slug}"><strong>${esc(g.title)}</strong></a><span>${esc(g.description)}</span></li>`).join("\n")}
      </ul>
    </div>`;
  return shell({ title: "Guides: Call Recording Analysis in India | CallSense", description: "Plain guides on analysing sales and support call recordings in Hindi, English and Hinglish, for real estate, coaching, D2C and clinics.", canonical: url, jsonld, body });
}

fs.mkdirSync(OUT, { recursive: true });
for (const g of guides) fs.writeFileSync(path.join(OUT, `${g.slug}.html`), guideHtml(g));
fs.writeFileSync(path.join(OUT, "index.html"), indexHtml());
console.log(`built ${guides.length} guides + index in public/guides/`);
