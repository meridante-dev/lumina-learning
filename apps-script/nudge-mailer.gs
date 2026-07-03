/**
 * EdenRise Academy — nudge mailer (Google Apps Script web app)
 *
 * Deploy: script.google.com → New project → paste this file → Deploy →
 * New deployment → Web app → Execute as: Me · Who has access: Anyone → Deploy.
 * Copy the /exec URL into MAIL.webhook in data.js.
 *
 * Anti-spam by design (the "encouraging, never spammy" contract):
 *  - only known template kinds can be sent (this is NOT a general mailer)
 *  - hard cap: 1 nudge per recipient per 7 days (opt-in confirmations: 1/day)
 *  - global cap: max 40 emails per day total
 *  - every email carries an "you chose these — switch off anytime" footer
 */
var SECRET = '67763609855821fded169452';
/* Recipient allowlist — the secret ships in a public repo by design (client-only
   app), so THIS is the real anti-abuse wall: mail only ever goes to the team. */
var ALLOWED_DOMAINS = ['edenrise.com'];
var ALLOWED_EXTRA = [];   // add individual member emails here (gmail etc.), lowercase
var NUDGE_COOLDOWN_DAYS = 7;
var GLOBAL_DAILY_CAP = 40;
var FROM_NAME = 'EdenRise Academy';
var SITE = 'https://meridante-dev.github.io/lumina-learning/';

function doPost(e) {
  var out = { ok: false };
  try {
    var p = JSON.parse(e.postData.contents);
    if (p.secret !== SECRET) return json({ ok: false, error: 'bad-secret' });
    if (['nudge', 'optin'].indexOf(p.kind) < 0) return json({ ok: false, error: 'bad-kind' });
    var to = String(p.to || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json({ ok: false, error: 'bad-email' });
    var dom = to.split('@')[1];
    if (ALLOWED_DOMAINS.indexOf(dom) < 0 && ALLOWED_EXTRA.indexOf(to) < 0) return json({ ok: false, error: 'not-a-member' });

    var props = PropertiesService.getScriptProperties();
    var today = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
    var sentToday = Number(props.getProperty('day_' + today) || 0);
    if (sentToday >= GLOBAL_DAILY_CAP) return json({ ok: false, error: 'daily-cap' });

    var coolKey = (p.kind === 'optin' ? 'optin_' : 'sent_') + to;
    var coolMs = (p.kind === 'optin' ? 1 : NUDGE_COOLDOWN_DAYS) * 86400000;
    var last = Number(props.getProperty(coolKey) || 0);
    if (Date.now() - last < coolMs) return json({ ok: false, error: 'rate-limited' });

    var pt = p.lang === 'pt';
    var name = String(p.name || '').split(' ')[0] || (pt ? 'olá' : 'there');
    var subject, heading, body, cta;
    if (p.kind === 'optin') {
      subject = pt ? '🌱 Os seus lembretes EdenRise estão ativos' : '🌱 Your EdenRise nudges are on';
      heading = pt ? 'Está tudo pronto, ' + name + '.' : "You're all set, " + name + '.';
      body = pt
        ? 'A partir de agora, de vez em quando (no máximo uma vez por semana) enviamos-lhe um pequeno incentivo — nunca pressão, só um lembrete amigável do caminho que está a percorrer.'
        : "From now on, once in a while (at most once a week) we'll send you a small encouragement — never pressure, just a friendly reminder of the path you're walking.";
      cta = pt ? 'Continuar a aprender' : 'Keep learning';
    } else {
      subject = p.subject ? String(p.subject).slice(0, 120) : (pt ? '🌿 Um pequeno incentivo da EdenRise' : '🌿 A little encouragement from EdenRise');
      heading = String(p.title || (pt ? 'Continue a crescer, ' + name : 'Keep growing, ' + name)).slice(0, 140);
      body = String(p.body || '').slice(0, 500);
      cta = pt ? 'Continuar a minha jornada' : 'Continue my journey';
    }

    MailApp.sendEmail({ to: to, subject: subject, name: FROM_NAME, htmlBody: template(heading, body, cta, pt) });
    props.setProperty(coolKey, String(Date.now()));
    props.setProperty('day_' + today, String(sentToday + 1));
    out = { ok: true };
  } catch (err) {
    out = { ok: false, error: String(err).slice(0, 120) };
  }
  return json(out);
}

function template(heading, body, cta, pt) {
  var foot = pt
    ? 'Recebe este email porque ativou os lembretes no seu perfil EdenRise — pode desligá-los lá a qualquer momento. 🌿'
    : "You're getting this because you switched on nudges in your EdenRise profile — you can turn them off there anytime. 🌿";
  return '' +
  '<div style="background:#0e140f;padding:36px 16px;font-family:Georgia,serif;">' +
    '<div style="max-width:520px;margin:0 auto;background:#141c16;border:1px solid #2a352c;border-radius:18px;padding:36px 32px;">' +
      '<div style="color:#a6c3a5;font-size:12px;letter-spacing:.3em;text-transform:uppercase;font-family:Arial,sans-serif;">EDENRISE · ACADEMY</div>' +
      '<h1 style="color:#f7f6f1;font-size:26px;font-weight:600;margin:18px 0 12px;line-height:1.25;">' + heading + '</h1>' +
      '<p style="color:#c9cec4;font-size:15px;line-height:1.65;margin:0 0 26px;font-family:Arial,sans-serif;">' + body + '</p>' +
      '<a href="' + SITE + '" style="display:inline-block;background:#a6c3a5;color:#0e140f;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;padding:13px 26px;border-radius:12px;text-decoration:none;">' + cta + ' →</a>' +
      '<p style="color:#6f7a6f;font-size:12px;line-height:1.6;margin:30px 0 0;font-family:Arial,sans-serif;border-top:1px solid #2a352c;padding-top:18px;">' + foot + '</p>' +
    '</div>' +
  '</div>';
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
