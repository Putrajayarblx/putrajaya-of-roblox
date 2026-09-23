const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
const themeButton = document.querySelector('.theme-toggle');

const savedTheme = localStorage.getItem('putrajaya-theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
}

function updateThemeButton() {
  const dark = document.body.classList.contains('dark');
  if (!themeButton) return;

  const icon = themeButton.querySelector('.theme-icon');
  const label = themeButton.querySelector('.theme-label');

  icon.textContent = dark ? '☀' : '☾';
  label.textContent = dark ? 'Light' : 'Dark';
  themeButton.setAttribute(
    'aria-label',
    dark ? 'Switch to light mode' : 'Switch to dark mode'
  );
}

updateThemeButton();

themeButton?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('putrajaya-theme', isDark ? 'dark' : 'light');
  updateThemeButton();
});

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', open);
  menuButton.textContent = open ? '×' : '☰';
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = '☰';
  });
});

const header = document.querySelector('.site-header');
window.addEventListener(
  'scroll',
  () => {
    if (header) {
      header.style.borderBottomColor = window.scrollY > 10 ? 'var(--line)' : 'transparent';
    }
  },
  { passive: true }
);

});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = '☰';
  });
});

const header = document.querySelector('.site-header');
window.addEventListener(
  'scroll',
  () => {
    header.style.borderBottomColor =
      window.scrollY > 10 ? 'var(--line)' : 'transparent';
  },
  { passive: true }
);
