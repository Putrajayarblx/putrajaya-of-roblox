const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
const themeButton = document.querySelector('.theme-toggle');

if (localStorage.getItem('putrajaya-theme') === 'dark') document.body.classList.add('dark');
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
document.querySelectorAll('.nav-links a').forEach((link) => link.addEventListener('click', () => {
  nav?.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false'); if (menuButton) menuButton.textContent = '☰';
}));
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, instance) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); instance.unobserve(entry.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px' });
  revealItems.forEach((item) => observer.observe(item));
} else revealItems.forEach((item) => item.classList.add('is-visible'));
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => { if (header) header.style.borderBottomColor = window.scrollY > 10 ? 'var(--line)' : 'transparent'; }, { passive: true });

// CMS content integration. Pages CMS writes Markdown into content/blog and content/wiki;
// this loader reads those files directly from the public GitHub API so new entries appear
// without manually editing the HTML index pages.
const REPO_API = 'https://api.github.com/repos/Putrajayarblx/putrajaya-of-roblox/contents/';
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const parseMarkdown = (text) => {
  const match = text.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  const meta = {};
  if (match) match[1].split('\n').forEach((line) => { const i = line.indexOf(':'); if (i > -1) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, ''); });
  return { meta, body: match ? match[2].trim() : text };
};
const markdownToHTML = (markdown) => markdown.split(/\n\s*\n/).map((block) => {
  const text = block.trim(); if (!text) return '';
  if (text.startsWith('> ')) return `<blockquote class="article-quote">${escapeHTML(text.slice(2))}</blockquote>`;
  if (text.startsWith('## ')) return `<h2>${escapeHTML(text.slice(3))}</h2>`;
  if (text.startsWith('# ')) return `<h1>${escapeHTML(text.slice(2))}</h1>`;
  if (text.startsWith('- ')) return `<ul>${text.split('\n').map((line) => `<li>${escapeHTML(line.slice(2))}</li>`).join('')}</ul>`;
  return `<p>${escapeHTML(text).replace(/\n/g, '<br>')}</p>`;
}).join('');
const fetchCollection = async (folder) => {
  const response = await fetch(REPO_API + folder);
  if (!response.ok) throw new Error(`Unable to load ${folder}`);
  const files = await response.json();
  return Promise.all(files.filter((file) => file.name.endsWith('.md')).map(async (file) => {
    const raw = await fetch(file.download_url).then((result) => result.text());
    const parsed = parseMarkdown(raw); return { ...parsed.meta, body: parsed.body, slug: file.name.replace(/\.md$/, '') };
  }));
};
const formatDate = (date) => date ? new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium' }).format(new Date(date)) : 'Unpublished';
const setupCollectionPage = async (type) => {
  const root = document.querySelector(`[data-content-list="${type}"]`); if (!root) return;
  const controls = document.querySelector('[data-content-controls]');
  try {
    let entries = await fetchCollection(`content/${type}`);
    entries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const render = () => {
      const query = (controls?.querySelector('[data-search]')?.value || '').toLowerCase();
      const category = controls?.querySelector('[data-category]')?.value || '';
      const filtered = entries.filter((entry) => `${entry.title} ${entry.summary} ${entry.body} ${entry.category || entry.section}`.toLowerCase().includes(query) && (!category || (entry.category || entry.section) === category));
      root.innerHTML = filtered.length ? filtered.map((entry) => `<article class="article-card cms-card"><div class="meta"><span>${escapeHTML(entry.category || entry.section || type)}</span><span>${formatDate(entry.date)}</span></div><h3>${escapeHTML(entry.title)}</h3><p>${escapeHTML(entry.summary || '')}</p>${entry.author ? `<small class="post-author">By ${escapeHTML(entry.author)}</small>` : ''}<a href="${type === 'blog' ? `blog-post.html?slug=${encodeURIComponent(entry.slug)}` : `wiki-article.html?slug=${encodeURIComponent(entry.slug)}`}" class="text-link">Read ${type === 'blog' ? 'article' : 'guide'} <span>↗</span></a></article>`).join('') : '<p class="empty-state">No matching entries found.</p>';
    };
    const categories = [...new Set(entries.map((entry) => entry.category || entry.section).filter(Boolean))].sort();
    if (controls?.querySelector('[data-category]')) controls.querySelector('[data-category]').innerHTML = `<option value="">All ${type === 'blog' ? 'categories' : 'sections'}</option>${categories.map((item) => `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`).join('')}`;
    controls?.addEventListener('input', render); controls?.addEventListener('change', render); render();
  } catch (error) { root.innerHTML = `<p class="empty-state">Content is temporarily unavailable. Please try again soon.</p>`; console.error(error); }
};
const setupArticlePage = async (type) => {
  const article = document.querySelector('[data-cms-article]'); if (!article) return;
  const slug = new URLSearchParams(location.search).get('slug'); if (!slug) return;
  try {
    const entry = (await fetchCollection(`content/${type}`)).find((item) => item.slug === slug); if (!entry) throw new Error('Article not found');
    document.title = `${entry.title} | ${type === 'blog' ? 'Blog' : 'Wiki'}`;
    article.innerHTML = `<div class="article-top"><span>${escapeHTML(entry.category || entry.section || type)}</span><a href="${type}.html" class="text-link">Back to ${type} <span>↗</span></a></div><header class="article-header"><p class="eyebrow">${escapeHTML(entry.category || entry.section || type)}${entry.date ? ` · ${formatDate(entry.date)}` : ''}</p><h1>${escapeHTML(entry.title)}</h1>${type === 'blog' ? `<p class="article-byline">By <strong>${escapeHTML(entry.author || 'Putrajaya of Roblox')}</strong></p>` : ''}</header><div class="article-copy">${entry.image ? `<img class="article-image" src="${escapeHTML(entry.image)}" alt="${escapeHTML(entry.title)}">` : ''}${markdownToHTML(entry.body)}</div>`;
  } catch (error) { article.innerHTML = '<p class="empty-state">This article could not be found.</p>'; console.error(error); }
};
setupCollectionPage('blog'); setupCollectionPage('wiki'); setupArticlePage('blog'); setupArticlePage('wiki');
