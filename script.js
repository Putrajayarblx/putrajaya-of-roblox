const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');

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

// Add a subtle border to the sticky header after scrolling.
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  header.style.borderBottomColor = window.scrollY > 10 ? '#d8d5cc' : 'transparent';
}, { passive: true });
