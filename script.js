// =========================================
// Meeting links (Zoom)
// Fill these in and every "Join Meeting" button on the site updates.
// Leave zoomUrl empty and the button becomes a "Request Zoom link" email instead.
// =========================================
const MEETINGS = {
    peer: {
        name: 'Peer-to-Peer Support Meeting (Tue & Thu)',
        zoomUrl: 'https://zoom.us/j/91620334133',
        meetingId: '916 2033 4133',
        passcode: '',       // optional; shown next to the meeting ID if set
    },
    carepartner: {
        name: 'Care Partner & Caregiver Meeting (1st & 3rd Wednesday)',
        zoomUrl: 'https://zoom.us/j/82690241864',
        meetingId: '826 9024 1864',
        passcode: '',
        time: '',           // e.g. '6:30 - 7:30 PM Central'
    },
};
const CONTACT_EMAIL = 'connect@trio-oklahoma.org';

function wireMeetings() {
    Object.keys(MEETINGS).forEach((key) => {
        const m = MEETINGS[key];

        document.querySelectorAll('[data-meeting="' + key + '"]').forEach((btn) => {
            if (m.zoomUrl) {
                btn.href = m.zoomUrl;
                btn.target = '_blank';
                btn.rel = 'noopener';
                btn.innerHTML = '<i class="fas fa-video"></i> Join on Zoom';
            } else {
                btn.href = 'mailto:' + CONTACT_EMAIL +
                    '?subject=' + encodeURIComponent('Zoom link for the ' + m.name) +
                    '&body=' + encodeURIComponent('Hello TRIO-Oklahoma,\n\nPlease send me the Zoom link for the ' + m.name + '.\n\nThank you!');
                btn.removeAttribute('target');
                btn.innerHTML = '<i class="fas fa-envelope"></i> Request Zoom Link';
            }
        });

        document.querySelectorAll('[data-meeting-id="' + key + '"]').forEach((el) => {
            if (!m.meetingId) return;
            el.querySelector('span').textContent = 'Meeting ID: ' + m.meetingId + (m.passcode ? ' \u00b7 Passcode: ' + m.passcode : '');
            el.hidden = false;
        });

        document.querySelectorAll('[data-meeting-time="' + key + '"]').forEach((el) => {
            if (!m.time) return;
            el.querySelector('span').textContent = m.time;
            el.hidden = false;
        });
    });
}
wireMeetings();

// Mobile menu toggle
function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('is-open');
}

// Reveal sections on scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.section-fade').forEach((el) => observer.observe(el));

// Navbar shadow on scroll
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    navbar.classList.toggle('nav--scrolled', window.scrollY > 50);
});

// Smooth scroll + close mobile menu
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('mobile-menu').classList.remove('is-open');
    });
});
