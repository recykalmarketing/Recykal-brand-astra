// Email for Brand Astra. With SMTP_USER and SMTP_PASS set (for example marketing@recykal.com and a Google app
// password) mail goes out through Gmail; without them it's only logged, and the app's notification bell still works.
function createMailer() {
  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  let transport = null;
  if (user && pass) {
    const nodemailer = require("nodemailer");
    transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || "smtp.gmail.com", port: Number(process.env.SMTP_PORT || 465), secure: true, auth: { user, pass } });
  }
  return {
    enabled: !!transport,
    /** Same shape as Apps Script's MailApp.sendEmail. Sent in the background; a failure is logged, never shown to the user. */
    send(o) {
      if (!o || !o.to) return;
      if (!transport) { console.log(`[mail not configured] to ${o.to}: ${o.subject}`); return; }
      transport.sendMail({ from: `"${o.name || "Brand Astra"}" <${user}>`, to: o.to, subject: o.subject, html: o.htmlBody || o.body || "" })
        .catch((e) => console.warn("Email failed:", o.subject, e.message));
    },
  };
}

module.exports = { createMailer };
