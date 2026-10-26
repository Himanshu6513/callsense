// Emails every new lead to the owner, so no request sits unseen in the database.
// Needs SMTP_USER and SMTP_PASS (a Zoho Mail app password); without them it only logs a warning.
import nodemailer from "nodemailer";

const { SMTP_USER, SMTP_PASS, SMTP_HOST = "smtp.zoho.in", NOTIFY_TO } = process.env;
const transport =
  SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({ host: SMTP_HOST, port: 465, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASS } })
    : null;
if (!transport) console.warn("SMTP_USER / SMTP_PASS not set: new leads will not be emailed.");

export async function notifyLead(site, lead) {
  if (!transport) return;
  const lines = Object.entries(lead)
    .filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
  try {
    await transport.sendMail({
      from: `"${site} leads" <${SMTP_USER}>`,
      to: NOTIFY_TO || SMTP_USER,
      replyTo: lead.email || undefined,
      subject: `New lead on ${site}: ${lead.full_name}${lead.company ? ` (${lead.company})` : ""}`,
      text: lines.join("\n"),
    });
  } catch (e) {
    console.error("Lead email failed:", e.message);
  }
}
