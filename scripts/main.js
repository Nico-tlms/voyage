const nav = document.querySelector('.nav');
const navLinks = document.querySelector('.nav__links');
const navToggle = document.querySelector('.nav__toggle');
const navAnchors = Array.from(document.querySelectorAll('.nav__links a'));
const cursor = document.getElementById('cursor');
const glitchTitle = document.querySelector('[data-glitch]');
const heroVisual = document.querySelector('.hero__visual');
const hero = document.querySelector('.hero');
const canvas = document.getElementById('nebula-canvas');
const year = document.getElementById('current-year');

if (year) {
  year.textContent = new Date().getFullYear();
}

// Navigation toggle for mobile
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open');
    navLinks.classList.toggle('is-open');
  });

  navAnchors.forEach((anchor) => {
    anchor.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      navLinks.classList.remove('is-open');
    });
  });
}

// Intersection observer for reveal animations
const revealElements = document.querySelectorAll('[data-animate]');
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

revealElements.forEach((el) => observer.observe(el));

// Highlight active section in nav
const sections = navAnchors
  .map((anchor) => document.querySelector(anchor.getAttribute('href')))
  .filter(Boolean);

if (sections.length) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const anchor = navAnchors.find((link) => link.getAttribute('href') === `#${entry.target.id}`);
        if (!anchor) return;
        if (entry.isIntersecting) {
          navAnchors.forEach((link) => link.classList.remove('is-active'));
          anchor.classList.add('is-active');
        }
      });
    },
    {
      threshold: 0.5,
    }
  );

  sections.forEach((section) => navObserver.observe(section));
}

// Custom cursor
if (cursor) {
  document.addEventListener('pointermove', (event) => {
    cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  });

  document.addEventListener('pointerdown', () => cursor.classList.add('is-active'));
  document.addEventListener('pointerup', () => cursor.classList.remove('is-active'));
}

// Hero parallax
if (heroVisual) {
  hero.addEventListener('pointermove', (event) => {
    const rect = heroVisual.getBoundingClientRect();
    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 20;
    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 20;
    heroVisual.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  });

  hero.addEventListener('pointerleave', () => {
    heroVisual.style.transform = '';
  });
}

// Dynamic glitch pulse
if (glitchTitle) {
  setInterval(() => {
    glitchTitle.style.textShadow = `0 0 30px rgba(0, 240, 255, ${0.4 + Math.random() * 0.4})`;
  }, 1600);
}

// Animated nebula background
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  const particles = [];
  const particleCount = 90;

  const random = (min, max) => Math.random() * (max - min) + min;

  const createParticle = () => ({
    x: random(0, width),
    y: random(0, height),
    z: random(0.1, 1.2),
    radius: random(0.6, 2.4),
    alpha: random(0.15, 0.35),
    driftX: random(-0.1, 0.1),
    driftY: random(-0.05, 0.05),
    hue: random(180, 320),
  });

  for (let i = 0; i < particleCount; i += 1) {
    particles.push(createParticle());
  }

  const render = () => {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.x += particle.driftX * 2 * particle.z;
      particle.y += particle.driftY * 2 * particle.z;

      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;

      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius * 8
      );

      gradient.addColorStop(0, `hsla(${particle.hue}, 90%, 65%, ${particle.alpha})`);
      gradient.addColorStop(1, 'rgba(5, 1, 15, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * 6, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', handleResize);
}

// Smooth scroll polyfill for browsers without native support
if ('scrollBehavior' in document.documentElement.style === false) {
  navAnchors.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top, left: 0, behavior: 'smooth' });
    });
  });
}
