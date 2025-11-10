const navToggle = document.querySelector('.nav__toggle');
const navLinks = document.querySelector('.nav__links');
const nav = document.querySelector('.nav');
const yearSpan = document.getElementById('year');

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('is-open');
    navToggle.classList.toggle('is-active');
    navToggle.setAttribute(
      'aria-expanded',
      navLinks.classList.contains('is-open')
    );
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.classList.remove('is-active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.section, .feature, .card, .timeline__item, .contact__intro, .contact__form').forEach((el) => {
  el.classList.add('fade-in');
  observer.observe(el);
});

const scrollLinks = document.querySelectorAll('a[href^="#"]');
scrollLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    const target = document.querySelector(targetId);

    if (target) {
      event.preventDefault();
      window.scrollTo({
        top: target.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  });
});

const setNavState = () => {
  if (!nav) return;
  if (window.scrollY > 120) {
    nav.classList.add('nav--solid');
  } else {
    nav.classList.remove('nav--solid');
  }
};

setNavState();
window.addEventListener('scroll', setNavState);
