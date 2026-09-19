/* ============================================================
   PVK CAPITAL — Enquiry form backend (Google Apps Script)
   ------------------------------------------------------------
   Receives every "Book a consultation" / enquiry-form submission
   from the website and emails both the founder and the visitor.
   ============================================================ */

var FOUNDER_EMAIL = 'pvkcapital.in@gmail.com';
var FIRM_NAME = 'PVK Capital';
var FIRM_PHONE = '+91 95108 09046';

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid payload' });
  }

  try {
    notifyFounder(data);
    if (data.email) confirmToClient(data);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }

  return jsonResponse({ ok: true });
}

function doGet() {
  return jsonResponse({ ok: true, message: FIRM_NAME + ' enquiry endpoint is live.' });
}

/* ---------- Emails ---------- */

function notifyFounder(data) {
  var subject = 'New enquiry — ' + (data.name || 'Website visitor') +
    (data._page ? ' (' + data._page + ')' : '');
  var body =
    'A new enquiry came in through the ' + FIRM_NAME + ' website.\n\n' +
    formatDetails(data) +
    '\n\nSubmitted: ' + (data._submitted || nowIST());

  var options = {};
  if (data.email) options.replyTo = data.email;

  MailApp.sendEmail(FOUNDER_EMAIL, subject, body, options);
}

function confirmToClient(data) {
  var firstName = (data.name || '').split(' ')[0] || 'there';
  var subject = 'We received your enquiry — ' + FIRM_NAME;
  var body =
    'Hi ' + firstName + ',\n\n' +
    'Thank you for reaching out to ' + FIRM_NAME + '. Your enquiry has reached us, and Vedant Shah ' +
    'or a member of the team will call you on ' + (data.phone || 'the number you shared') +
    ' within one working day.\n\n' +
    'Here is a summary of what you shared with us:\n\n' +
    formatDetails(data) +
    '\n\nIf anything is urgent, you can reach us directly:\n' +
    'Phone: ' + FIRM_PHONE + '\n' +
    'Email: ' + FOUNDER_EMAIL +
    '\n\nWarm regards,\n' + FIRM_NAME;

  MailApp.sendEmail(data.email, subject, body, { replyTo: FOUNDER_EMAIL });
}

/* ---------- Helpers ---------- */

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function humanLabel(key) {
  return key.replace(/[_-]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}

function nowIST() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
}

/** Renders every submitted field as "Label: value", skipping internal/meta fields. */
function formatDetails(data) {
  var skip = { _page: true, _submitted: true, _subject: true, consent: true };
  return Object.keys(data)
    .filter(function (k) { return !skip[k] && data[k] !== '' && data[k] != null; })
    .map(function (k) {
      var value = Array.isArray(data[k]) ? data[k].join(', ') : data[k];
      return humanLabel(k) + ': ' + value;
    })
    .join('\n');
}
