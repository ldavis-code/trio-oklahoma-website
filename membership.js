/* =========================================
   TRIO-Oklahoma membership form
   Step 1: log the new member  ->  Step 2: pay $20 dues with PayPal
   ========================================= */

const MEMBERSHIP_CONFIG = {
    // Microsoft Forms embed link (Share -> Embed -> copy the src URL, which ends
    // in "&embed=true"). When set, the Microsoft Form is shown in place of the
    // built-in form and every response lands in the Excel workbook in
    // TRIO-Oklahoma's OneDrive. See MEMBERSHIP-SETUP.md.
    formsEmbedUrl: '',

    // Only used when formsEmbedUrl is empty: a URL that the built-in form
    // POSTs each member to (for example a Power Automate HTTP trigger).
    // Leave empty to fall back to an email link.
    logEndpoint: '',

    // PayPal hosted button for the $20 membership dues (created in PayPal as
    // "Membership"). Its ID doubles as a direct payment link.
    paypalHostedButtonId: 'YP6CEUXRC2M94',
    paypalUrl: 'https://www.paypal.com/ncp/payment/YP6CEUXRC2M94',

    // PayPal JavaScript SDK client ID. PayPal's button code starts with
    // <script src="https://www.paypal.com/sdk/js?client-id=XXXX&components=hosted-buttons...">
    // Paste the client-id value here and the real PayPal button renders in
    // Step 2. Leave empty and Step 2 shows a link button to the same page.
    paypalClientId: 'BAA1OSOsJmlrXfwxxwZi3k-9GzInXmo7peXzjsLA3dto5_tJNVYj2X6jGps3kzbG42KCi-ylk_VIwyIk8I',

    duesAmount: 20,
    contactEmail: 'connect@trio-oklahoma.org',
};

(function () {
    const form = document.getElementById('membership-form');
    if (!form) return;
  try {

    const alertBox = document.getElementById('form-alert');
    const submitBtn = document.getElementById('submit-btn');
    const payPanel = document.getElementById('pay-panel');
    const paidPanel = document.getElementById('paid-panel');
    const details = document.getElementById('transplant-details');
    const dateInput = document.getElementById('transplantDate');
    const hospitalInput = document.getElementById('transplantHospital');

    // Returning from PayPal (set the button's return URL to join.html?paid=1)
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === '1') {
        form.hidden = true;
        paidPanel.hidden = false;
        return;
    }

    // Microsoft Forms mode: show the embedded form plus a standing PayPal step.
    if (MEMBERSHIP_CONFIG.formsEmbedUrl) {
        const embed = document.getElementById('forms-embed');
        const frame = document.createElement('iframe');
        frame.src = MEMBERSHIP_CONFIG.formsEmbedUrl;
        frame.title = 'TRIO-Oklahoma membership form';
        frame.setAttribute('allowfullscreen', '');
        frame.setAttribute('loading', 'lazy');
        embed.querySelector('.forms-frame').appendChild(frame);
        document.getElementById('paypal-pay-link-embed').href = MEMBERSHIP_CONFIG.paypalUrl;
        form.hidden = true;
        embed.hidden = false;
        renderPayPalButton('paypal-button-embed');
        return;
    }

    // Show transplant date/hospital only when "Yes" is selected
    form.querySelectorAll('input[name="transplanted"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            const yes = form.transplanted.value === 'Yes';
            details.hidden = !yes;
            dateInput.required = yes;
            hospitalInput.required = yes;
            if (!yes) { dateInput.value = ''; hospitalInput.value = ''; }
        });
    });

    function showAlert(message, kind) {
        alertBox.textContent = message;
        alertBox.className = 'form-alert form-alert--' + (kind || 'error');
        alertBox.hidden = false;
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function collect() {
        const v = (name) => (form.elements[name] ? form.elements[name].value.trim() : '');
        const transplanted = v('transplanted');
        return {
            firstName: v('firstName'),
            lastName: v('lastName'),
            email: v('email'),
            phone: v('phone'),
            address: v('address'),
            city: v('city'),
            state: v('state').toUpperCase(),
            zip: v('zip'),
            memberType: v('memberType'),
            transplanted: transplanted,
            transplantDate: transplanted === 'Yes' ? v('transplantDate') : '',
            transplantHospital: transplanted === 'Yes' ? v('transplantHospital') : '',
            organ: transplanted === 'Yes' ? v('organ') : '',
            notes: v('notes'),
            payment: 'Pending - PayPal $' + MEMBERSHIP_CONFIG.duesAmount,
            website: v('website'), // honeypot, should be empty
            submittedAt: new Date().toISOString(),
            source: window.location.href,
        };
    }

    function validate(data) {
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            // Surface the first invalid field
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid && typeof firstInvalid.focus === 'function') {
                try { firstInvalid.focus({ preventScroll: true }); } catch (ignore) { /* no-op */ }
            }
            return 'Please fill in all required fields before continuing.';
        }
        if (!data.memberType) return 'Please tell us how you are joining (Recipient, Waiting, Listed, Carepartner, Living Donor, or Donor Family).';
        if (!data.transplanted) return 'Please tell us whether you have received a transplant.';
        if (data.transplanted === 'Yes' && (!data.transplantDate || !data.transplantHospital)) {
            return 'Please enter your transplant date and transplant hospital.';
        }
        return '';
    }

    async function logMember(data) {
        const url = MEMBERSHIP_CONFIG.logEndpoint;
        if (!url) return { logged: false, reason: 'no-endpoint' };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        try {
            // text/plain body avoids a CORS preflight, which Google Apps Script
            // web apps do not answer. The script parses the JSON itself.
            const res = await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(data),
                signal: controller.signal,
            });
            // With no-cors the response is opaque; reaching here means it was sent.
            return { logged: true, response: res };
        } catch (err) {
            return { logged: false, reason: err && err.name === 'AbortError' ? 'timeout' : 'network' };
        } finally {
            clearTimeout(timer);
        }
    }

    function buildMailto(data) {
        const lines = [
            'New TRIO-Oklahoma membership application',
            '',
            'Name: ' + data.firstName + ' ' + data.lastName,
            'Mailing address: ' + data.address + ', ' + data.city + ', ' + data.state + ' ' + data.zip,
            'Email: ' + data.email,
            'Phone: ' + data.phone,
            'Joining as: ' + data.memberType,
            'Transplanted: ' + data.transplanted,
            'Transplant date: ' + (data.transplantDate || 'n/a'),
            'Transplant hospital: ' + (data.transplantHospital || 'n/a'),
            'Organ(s): ' + (data.organ || 'n/a'),
            'Notes: ' + (data.notes || 'n/a'),
            'Payment: ' + data.payment,
        ];
        const subject = 'TRIO-Oklahoma Membership: ' + data.firstName + ' ' + data.lastName;
        return 'mailto:' + MEMBERSHIP_CONFIG.contactEmail +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(lines.join('\n'));
    }

    function showPayStep(data, result) {
        document.getElementById('pay-panel-name').textContent = data.firstName || 'friend';
        document.getElementById('paypal-pay-link').href = MEMBERSHIP_CONFIG.paypalUrl;

        const emailLink = document.getElementById('email-fallback-link');
        const message = document.getElementById('pay-panel-message');
        if (!result.logged) {
            // No log endpoint (or it failed): ask the member to email their details too.
            emailLink.href = buildMailto(data);
            emailLink.hidden = false;
            message.innerHTML = 'Thanks, <strong>' + escapeHtml(data.firstName || 'friend') +
                '</strong>! Please pay your $' + MEMBERSHIP_CONFIG.duesAmount +
                ' dues through PayPal, then use the email button so we have your member information on file.';
        }

        form.hidden = true;
        payPanel.hidden = false;
        renderPayPalButton('paypal-button-panel');
        payPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Render PayPal's hosted button into a container once the SDK is loaded.
    function renderPayPalButton(containerId) {
        const cfg = MEMBERSHIP_CONFIG;
        const container = document.getElementById(containerId);
        if (!container || !cfg.paypalClientId || !cfg.paypalHostedButtonId) return;
        const draw = () => {
            if (!window.paypal || !window.paypal.HostedButtons) return;
            container.innerHTML = '';
            window.paypal.HostedButtons({ hostedButtonId: cfg.paypalHostedButtonId }).render('#' + containerId);
            container.hidden = false;
            // The real PayPal button is now on the page; demote the link to a fallback.
            const link = container.parentElement && container.parentElement.querySelector('a[id^="paypal-pay-link"]');
            if (link) { link.className = 'btn-link'; link.innerHTML = 'Or open PayPal in a new tab <i class="fas fa-arrow-up-right-from-square"></i>'; }
        };
        if (window.paypal && window.paypal.HostedButtons) { draw(); return; }
        let sdk = document.getElementById('paypal-sdk');
        if (!sdk) {
            sdk = document.createElement('script');
            sdk.id = 'paypal-sdk';
            sdk.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(cfg.paypalClientId) +
                '&components=hosted-buttons&enable-funding=venmo&currency=USD';
            document.head.appendChild(sdk);
        }
        sdk.addEventListener('load', draw);
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.hidden = true;

        try {
            const data = collect();

            const problem = validate(data);
            if (problem) { showAlert(problem, 'error'); return; }

            // Open PayPal right away, while we are still inside the click so
            // browsers allow the new tab. Step 2 keeps a PayPal button too, in
            // case a popup blocker stops this.
            const payWindow = window.open(MEMBERSHIP_CONFIG.paypalUrl, '_blank');
            if (payWindow) { try { payWindow.opener = null; } catch (ignore) { /* no-op */ } }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';

            const result = await logMember(data);

            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Continue to Payment <i class="fas fa-arrow-right"></i>';

            showPayStep(data, result);
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Continue to Payment <i class="fas fa-arrow-right"></i>';
            showAlert('Something went wrong on this page (' + (err && err.message ? err.message : err) +
                '). You can still pay your $' + MEMBERSHIP_CONFIG.duesAmount + ' dues at ' + MEMBERSHIP_CONFIG.paypalUrl +
                ' and email your information to ' + MEMBERSHIP_CONFIG.contactEmail + '.', 'error');
        }
    });
  } catch (err) {
    // If setup fails for any reason, make the button a plain link to PayPal
    // rather than a dead button.
    const btn = document.getElementById('submit-btn');
    if (btn) {
        btn.type = 'button';
        btn.addEventListener('click', () => { window.open(MEMBERSHIP_CONFIG.paypalUrl, '_blank'); });
    }
    if (window.console) console.error('membership.js setup failed:', err);
  }
})();
