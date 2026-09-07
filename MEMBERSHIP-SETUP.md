# TRIO-Oklahoma Membership: setup guide

The **Join** page (`join.html`) collects each new member's information, records it in
the membership log, and then sends them to PayPal to pay the $20 dues.

Flow for a new member:

1. Fill out the form on `join.html` (name, mailing address, email, phone, transplanted
   yes/no, transplant date and hospital, and member type: Recipient, Waiting, Listed,
   Carepartner, Living Donor, or Donor Family).
2. The form is saved to the **membership log** (a Google Sheet) and an email
   notification is sent to info@trio-oklahoma.org.
3. The member is shown a **Pay $20 with PayPal** button.

Two one-time setup steps are needed to turn on the log. Until then the page still
works: members are asked to pay through PayPal and to email their information.

---

## 1. Connect the membership log (Google Sheet) — about 5 minutes

The log lives here:

**TRIO-Oklahoma Membership Log**
https://docs.google.com/spreadsheets/d/1FpxANRQ3gmzazxPvosE5CqB6c9RJ1JXoN13uVPbdHH0/edit

Columns: Timestamp, First Name, Last Name, Mailing Address, City, State, ZIP, Email,
Phone, Transplanted, Transplant Date, Transplant Hospital, Member Type, Organ(s),
Payment, Notes.

To let the website write to it:

1. Open the sheet above. In the menu choose **Extensions → Apps Script**.
2. Delete any code in the editor and paste the full contents of
   [`membership-log/Code.gs`](membership-log/Code.gs) from this repository.
   Change `NOTIFY_EMAIL` at the top if notifications should go somewhere other than
   info@trio-oklahoma.org.
3. Click the **Save** icon, then choose the `testAppend` function in the toolbar and
   click **Run**. Approve the permissions when Google asks (it needs access to the
   sheet and to send email). A test row should appear in the sheet, and a test email
   should arrive. Delete the test row afterward.
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Description: `Membership log`
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. Open `membership.js` in this repository and paste that URL into `logEndpoint`:

   ```js
   logEndpoint: 'https://script.google.com/macros/s/AKfycb.../exec',
   ```

6. Commit and publish the site. Submit the form once yourself to confirm a row appears.

If you ever edit `Code.gs`, choose **Deploy → Manage deployments → Edit → Version: New
version → Deploy** so the change goes live. The URL stays the same.

## 2. PayPal: the $20 dues button

By default the Join page uses the chapter's existing PayPal button with the amount
pre-filled at $20:

```
https://www.paypal.com/donate/?hosted_button_id=P6LXMA3R5N5AC&amount=20.00&currency_code=USD
```

That works today, but the payment shows up in PayPal as a donation. For cleaner
bookkeeping, create a dedicated dues button:

1. Log in to PayPal → **Pay & Get Paid → PayPal buttons** (or search "Buy Now button").
2. Choose **Buy Now**. Item name: `TRIO-Oklahoma Membership Dues`. Price: `20.00`.
3. Under advanced/customize options, set the **return URL** to your site's
   `join.html?paid=1` (for example `https://trio-oklahoma.org/join.html?paid=1`).
   That page shows the member a thank-you message after they pay.
4. Save the button and copy its link (it will contain `hosted_button_id=...`).
5. Paste it into `paypalUrl` in `membership.js`.

## Reconciling payments

Each new row in the sheet starts with **Payment = "Pending - PayPal $20"**. When the
PayPal payment email arrives, match it by name/email and update that cell to
`Paid` with the date. Filtering the Payment column shows who still owes dues.

## Files

| File | Purpose |
| --- | --- |
| `join.html` | Membership page with the form and the PayPal step |
| `membership.js` | Form validation, sends the entry to the log, shows the PayPal step. Holds the `logEndpoint` and `paypalUrl` settings. |
| `membership-log/Code.gs` | Google Apps Script that writes rows to the sheet and emails a notification |
| `styles.css` | Join page styles (bottom of the file) |
