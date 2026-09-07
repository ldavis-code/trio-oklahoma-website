/* =========================================
   TRIO-Oklahoma membership form
   Step 1: log the new member  ->  Step 2: pay $20 dues with PayPal
   ========================================= */

const MEMBERSHIP_CONFIG = {
    // Google Apps Script "web app" URL that writes to the Membership Log sheet.
    // See MEMBERSHIP-SETUP.md. Leave empty to fall back to an email link.
    logEndpoint: '',

    // PayPal link for the $20 dues. This uses the chapter's existing PayPal
    // button with the amount pre-filled at $20. Replace with a dedicated
    // "Buy Now" button link if you create one (see MEMBERSHIP-SETUP.md).
    paypalUrl: 'https://www.paypal.com/donate/?hosted_button_id=P6LXMA3R5N5AC&amount=20.00&currency_code=USD',

    duesAmount: 20,
    contactEmail: 'connect@trio-oklahoma.org',
};

(function () {
    const form = document.getElementById('membership-form');
    if (!form) return;

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
            // Surface the first invalid field
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) firstInvalid.focus();
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
        payPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.hidden = true;

        const data = collect();
        if (data.website) return; // bot filled the honeypot; silently ignore

        const problem = validate(data);
        if (problem) { showAlert(problem, 'error'); return; }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';

        const result = await logMember(data);

        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Continue to Payment <i class="fas fa-arrow-right"></i>';

        showPayStep(data, result);
    });
})();
