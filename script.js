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
