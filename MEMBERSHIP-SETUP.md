# TRIO-Oklahoma Membership: setup guide

The **Join** page (`join.html`) collects each new member's information for the
membership log and then sends them to PayPal to pay the $20 dues.

TRIO-Oklahoma runs on Microsoft 365, so the log lives there:

| Piece | Microsoft 365 app |
| --- | --- |
| Member form | **Microsoft Forms** (embedded on the Join page) |
| Membership log | **Excel** workbook in OneDrive, filled automatically by Forms |
| New-member email to connect@trio-oklahoma.org | **Power Automate** + **Outlook** |
| $20 dues | **PayPal** button on the Join page and in the form's thank-you message |

No extra services (Resend, Netlify, and so on) are needed.

---

## 1. Create the form in Microsoft Forms (about 10 minutes)

Sign in to Microsoft 365 as the TRIO-Oklahoma account, open **Forms**, and click
**New Form**. Title it `TRIO-Oklahoma Membership`.

Add these questions, in this order. Mark each one Required unless noted.

| # | Question | Type | Notes |
| --- | --- | --- | --- |
| 1 | First name | Text | |
| 2 | Last name | Text | |
| 3 | Mailing address (street) | Text | |
| 4 | City | Text | |
| 5 | State | Text | |
| 6 | ZIP | Text | |
| 7 | Email address | Text | Turn on **Restrictions → Email** if offered |
| 8 | Phone | Text | |
| 9 | I am joining as | Choice | Recipient, Waiting, Listed, Carepartner, Living Donor, Donor Family |
| 10 | Have you received a transplant? | Choice | Yes, No. Use **Add branching** so Yes goes to question 11 and No skips to question 14 |
| 11 | Transplant date | Date | |
| 12 | Transplant hospital | Text | |
| 13 | Organ(s) transplanted | Text | Optional |
| 14 | Anything you would like us to know? | Text, long answer | Optional |

Then open the **...** menu (top right) → **Settings**:

- **Who can fill out this form**: *Anyone can respond*.
- **Customize thank you message**: paste
  `Thank you for joining TRIO-Oklahoma! Please finish by paying your $20 dues here: https://www.paypal.com/donate/?hosted_button_id=P6LXMA3R5N5AC&amount=20.00&currency_code=USD`
  (swap in the dedicated dues button link from section 4 once you make one).
- **Get email notification of each response**: turn on. This alone emails the
  form owner; section 3 sends a nicer email to connect@trio-oklahoma.org.

## 2. Put the form on the website

1. In Forms click **Collect responses** (or **Share**) → the **Embed** tab (`< >`).
2. Copy the embed code. Inside it is a link that starts with
   `https://forms.office.com/Pages/ResponsePage.aspx?id=` and ends with `&embed=true`.
   Copy just that link.
3. Open `membership.js` in this repository and paste it into `formsEmbedUrl`:

   ```js
   formsEmbedUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=...&embed=true',
   ```

4. Commit and publish. The Join page now shows the Microsoft Form as Step 1 and
   the PayPal button as Step 2.

## 3. The membership log (Excel) and the new-member email

**The log.** In Forms open the **Responses** tab and click **Open in Excel**. The
first time, choose to keep the results in OneDrive: Forms creates a workbook named
`TRIO-Oklahoma Membership(1-...).xlsx` (rename it to `TRIO-Oklahoma Membership Log`
if you like) that updates itself every time someone submits. Each row has every
answer plus a timestamp. Add a column called **Paid** and mark it when the PayPal
receipt arrives; filtering on that column shows who still owes dues.

**The email.** Open **Power Automate** → **Create** → **Automated cloud flow**:

1. Name: `New TRIO-Oklahoma member`. Trigger: *When a new response is submitted*
   (Microsoft Forms). Choose the membership form. Click **Create**.
2. **+ New step** → *Get response details* (Microsoft Forms). Form: the membership
   form. Response Id: pick **Response Id** from the dynamic content list.
3. **+ New step** → *Send an email (V2)* (Office 365 Outlook).
   - To: `connect@trio-oklahoma.org`
   - Subject: `New TRIO-Oklahoma member: ` then insert **First name** and **Last name**
   - Body: insert the fields you want (name, address, email, phone, joining as,
     transplanted, date, hospital) one per line, and add a line such as
     `Payment: pending. Check PayPal for $20 dues and mark the Excel log.`
4. **Save**, then submit the form once yourself to confirm the row and the email
   both arrive. Delete the test row from Excel afterward.

Both connectors are standard, so no premium Power Automate license is needed.

## 4. PayPal: a dedicated $20 dues button (optional, recommended)

By default the Join page uses the chapter's existing PayPal button with the amount
pre-filled at $20. That works today, but PayPal records it as a donation. For
cleaner bookkeeping:

1. Log in to PayPal → **Pay & Get Paid → PayPal buttons** → **Buy Now**.
2. Item name: `TRIO-Oklahoma Membership Dues`. Price: `20.00`.
3. Under the advanced options set the **return URL** to your site's
   `join.html?paid=1` (for example `https://trio-oklahoma.org/join.html?paid=1`)
   so members see a thank-you message after paying.
4. Save, copy the button link (it contains `hosted_button_id=...`), and paste it
   into `paypalUrl` in `membership.js`. Update the Forms thank-you message too.

## Files

| File | Purpose |
| --- | --- |
| `join.html` | Membership page: embedded Microsoft Form, PayPal step, thank-you state |
| `membership.js` | Settings (`formsEmbedUrl`, `paypalUrl`) and page behavior. Also contains a built-in HTML form that is used only when `formsEmbedUrl` is empty. |
| `styles.css` | Join page styles (bottom of the file) |
