const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
const themeButton = document.querySelector('.theme-toggle');

// Restore the saved colour theme.
if (localStorage.getItem('putrajaya-theme') === 'dark') {
  document.body.classList.add('dark');
}

function updateThemeButton() {
  if (!themeButton) return;
  const dark = document.body.classList.contains('dark');
  const icon = themeButton.querySelector('.theme-icon');
  const label = themeButton.querySelector('.theme-label');
  if (icon) icon.textContent = dark ? '☀' : '☾';
  if (label) label.textContent = dark ? 'Light' : 'Dark';
  themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}

updateThemeButton();
themeButton?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('putrajaya-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  updateThemeButton();
});

menuButton?.addEventListener('click', () => {
  const open = nav?.classList.toggle('open') ?? false;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? '×' : '☰';
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = '☰';
  });
});

// Reveal content as it enters the viewport. Keep content visible if the API is unavailable.
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  if (header) header.style.borderBottomColor = window.scrollY > 10 ? 'var(--line)' : 'transparent';
}, { passive: true });
