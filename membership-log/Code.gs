/**
 * TRIO-Oklahoma Membership Log
 * ----------------------------
 * Google Apps Script bound to the "TRIO-Oklahoma Membership Log" spreadsheet.
 * The website's join form POSTs each new member here, and this script:
 *   1. appends a row to the sheet (the membership log), and
 *   2. emails a notification to NOTIFY_EMAIL.
 *
 * Setup instructions: see MEMBERSHIP-SETUP.md in the website repository.
 */

// Who gets an email each time someone joins. Leave '' to disable emails.
var NOTIFY_EMAIL = 'connect@trio-oklahoma.org';

// Name of the tab that holds the log. Falls back to the first tab if not found.
var SHEET_NAME = 'Members';

var HEADERS = [
  'Timestamp', 'First Name', 'Last Name', 'Mailing Address', 'City', 'State', 'ZIP',
  'Email', 'Phone', 'Transplanted', 'Transplant Date', 'Transplant Hospital',
  'Member Type', 'Organ(s)', 'Payment', 'Notes'
];

function doPost(e) {
  try {
    var data = parseBody_(e);

    // Honeypot: real people never fill in the hidden "website" field.
    if (data.website) {
      return json_({ ok: true, ignored: true });
    }

    var sheet = getSheet_();
    ensureHeaders_(sheet);

    var row = [
      new Date(),
      clean_(data.firstName),
      clean_(data.lastName),
      clean_(data.address),
      clean_(data.city),
      clean_(data.state),
      clean_(data.zip),
      clean_(data.email),
      clean_(data.phone),
      clean_(data.transplanted),
      clean_(data.transplantDate),
      clean_(data.transplantHospital),
      clean_(data.memberType),
      clean_(data.organ),
      clean_(data.payment) || 'Pending - PayPal $20',
      clean_(data.notes)
    ];
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      notify_(data);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return ContentService
    .createTextOutput('TRIO-Oklahoma membership log is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ---------- helpers ----------

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (ignore) {
      // fall through to form-encoded parameters
    }
  }
  return (e && e.parameter) || {};
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function clean_(value) {
  if (value === undefined || value === null) return '';
  // Prevent spreadsheet formula injection from user-supplied text.
  var s = String(value).trim();
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function notify_(d) {
  var name = [d.firstName, d.lastName].filter(Boolean).join(' ');
  var subject = 'New TRIO-Oklahoma member: ' + name + ' (' + (d.memberType || 'member') + ')';
  var body = [
    'A new member just joined through the website.',
    '',
    'Name: ' + name,
    'Joining as: ' + (d.memberType || ''),
    'Email: ' + (d.email || ''),
    'Phone: ' + (d.phone || ''),
    'Mailing address: ' + [d.address, d.city, d.state, d.zip].filter(Boolean).join(', '),
    'Transplanted: ' + (d.transplanted || ''),
    'Transplant date: ' + (d.transplantDate || 'n/a'),
    'Transplant hospital: ' + (d.transplantHospital || 'n/a'),
    'Organ(s): ' + (d.organ || 'n/a'),
    'Notes: ' + (d.notes || 'n/a'),
    '',
    'Payment: ' + (d.payment || 'Pending - PayPal $20') + ' (confirm in PayPal, then update the Payment column)',
    '',
    'Membership log: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  ].join('\n');

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Run this once from the Apps Script editor to confirm everything works. */
function testAppend() {
  var fake = {
    postData: {
      contents: JSON.stringify({
        firstName: 'Test', lastName: 'Member', address: '123 Main St', city: 'Oklahoma City',
        state: 'OK', zip: '73102', email: 'test@example.com', phone: '(405) 555-0100',
        transplanted: 'Yes', transplantDate: '2018-06-01', transplantHospital: 'Test Hospital',
        memberType: 'Recipient', organ: 'Liver', notes: 'This is a test row. Delete me.'
      })
    }
  };
  Logger.log(doPost(fake).getContent());
}
