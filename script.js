const contentApiBase = 'https://api.github.com/repos/Putrajayarblx/putrajaya-of-roblox/contents/';

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]));

const formatDate = (value) => {
  if (!value) return 'Unpublished';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

const parseFrontmatter = (markdown) => {
  const match = markdown.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (!match) return { meta: {}, body: markdown.trim() };

  const meta = {};
  match[1].split(/\r?\n/).forEach((line) => {
    if (!line.includes(':')) return;
    const idx = line.indexOf(':');
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['\"]|['\"]$/g, '');
    meta[key] = value;
  });

  return { meta, body: match[2].trim() };
};

const markdownToHTML = (markdown) => {
  const blocks = (markdown || '').split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block) => {
    if (block.startsWith('> ')) return `<blockquote class="article-quote">${escapeHTML(block.replace(/^>\s?/, ''))}</blockquote>`;
    if (block.startsWith('## ')) return `<h2>${escapeHTML(block.replace(/^##\s?/, ''))}</h2>`;
    if (block.startsWith('# ')) return `<h1>${escapeHTML(block.replace(/^#\s?/, ''))}</h1>`;
    if (block.startsWith('- ')) {
      const items = block.split(/\n-/).map((item) => item.replace(/^-\s?/, '')).map((item) => `<li>${escapeHTML(item)}</li>`).join('');
      return `<ul class="article-list">${items}</ul>`;
    }
    return `<p>${escapeHTML(block).replace(/\n/g, '<br>')}</p>`;
  }).join('');
};

const appendStyles = () => {
  const id = 'putrajaya-content-styles';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .cms-controls { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem; }
    .cms-controls input, .cms-controls select { flex: 1 1 220px; min-height: 44px; padding: 0.7rem 0.9rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); }
    .cms-controls input:focus, .cms-controls select:focus { outline: 2px solid rgba(63, 126, 126, 0.18); border-color: var(--green); }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    .empty-state { padding: 1.2rem; background: var(--surface2); border: 1px solid var(--line); border-radius: 12px; color: var(--muted); }
    .cms-card .meta { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
    .cms-card .meta span:first-child { display: inline-flex; align-items: center; padding: 0.25rem 0.7rem; border-radius: 999px; background: var(--surface2); color: var(--green); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .cms-card h3 { margin: 0.9rem 0 0.35rem; }
    .cms-card p { margin: 0 0 0.85rem; }
    .post-author, .article-byline { display: block; margin-top: 0.3rem; margin-bottom: 0.7rem; font-size: 0.83rem; color: var(--muted); }
    .article-copy ul.article-list { padding-left: 1.1rem; margin: 1rem 0; }
    .article-copy ul.article-list li { margin-bottom: 0.4rem; }
    .article-copy img.article-image { display: block; width: 100%; max-height: 520px; object-fit: cover; border-radius: 12px; margin-bottom: 1.2rem; }
    .article-quote { margin: 1.2rem 0; padding: 1rem 1.1rem; border-left: 3px solid var(--green); background: var(--surface2); border-radius: 10px; color: var(--ink); font-weight: 600; }
  `;

  document.head.appendChild(style);
};

const loadEntries = async (folder) => {
  const response = await fetch(`${contentApiBase}${folder}`);
  if (!response.ok) throw new Error(`Unable to load ${folder}`);

  const files = await response.json();
  const validFiles = files.filter((file) => file.type === 'file' && file.name.endsWith('.md'));

  const entries = await Promise.all(validFiles.map(async (file) => {
    const raw = await fetch(file.download_url).then((result) => result.text());
    const parsed = parseFrontmatter(raw);
    return { ...parsed.meta, body: parsed.body, slug: file.name.replace(/\.md$/, '') };
  }));

  return entries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
};

const renderListPage = async (pageType) => {
  const listEl = document.getElementById(`${pageType}-list`);
  const searchEl = document.getElementById(`${pageType}-search`);
  const categoryEl = document.getElementById(`${pageType}-category`);
  const sidebarEl = document.getElementById(`${pageType}-sidebar-categories`);

  if (!listEl) return;
  appendStyles();

  try {
    listEl.innerHTML = '<p class="empty-state">Loading entries…</p>';
    const entries = await loadEntries(`content/${pageType}`);
    const categories = [...new Set(entries.map((entry) => entry.category || entry.section).filter(Boolean))].sort();

    if (categoryEl) {
      categoryEl.innerHTML = `<option value="">All ${pageType === 'blog' ? 'categories' : 'sections'}</option>${categories.map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join('')}`;
    }

    if (sidebarEl) {
      sidebarEl.innerHTML = `<li><a href="${pageType}.html">All ${pageType === 'blog' ? 'posts' : 'articles'}</a></li>${categories.map((category) => `<li><a href="${pageType}.html?category=${encodeURIComponent(category)}">${escapeHTML(category)}</a></li>`).join('')}`;
    }

    const render = () => {
      const term = (searchEl?.value || '').trim().toLowerCase();
      const currentCategory = new URLSearchParams(window.location.search).get('category') || categoryEl?.value || '';
      const filtered = entries.filter((entry) => {
        const haystack = `${entry.title || ''} ${entry.summary || ''} ${entry.body || ''} ${(entry.category || entry.section || '')}`.toLowerCase();
        const matchesSearch = !term || haystack.includes(term);
        const matchesCategory = !currentCategory || (entry.category || entry.section) === currentCategory;
        return matchesSearch && matchesCategory;
      });

      if (!filtered.length) {
        listEl.innerHTML = '<p class="empty-state">No items match your search.</p>';
        return;
      }

      listEl.innerHTML = filtered.map((entry) => {
        const label = entry.category || entry.section || 'General';
        const authorMarkup = entry.author ? `<small class="post-author">By <strong>${escapeHTML(entry.author)}</strong></small>` : '';
        const slug = entry.slug || encodeURIComponent(entry.title || 'untitled');
        const href = pageType === 'blog' ? `blog-post.html?slug=${encodeURIComponent(slug)}` : `wiki-article.html?slug=${encodeURIComponent(slug)}`;

        return `
          <article class="article-card cms-card">
            <div class="meta"><span>${escapeHTML(label)}</span><span>${formatDate(entry.date)}</span></div>
            <h3>${escapeHTML(entry.title || 'Untitled')}</h3>
            <p>${escapeHTML(entry.summary || '')}</p>
            ${authorMarkup}
            <a href="${href}" class="text-link">Read ${pageType === 'blog' ? 'article' : 'guide'} <span>↗</span></a>
          </article>
        `;
      }).join('');
    };

    searchEl?.addEventListener('input', render);
    categoryEl?.addEventListener('change', render);
    render();
  } catch (error) {
    console.error(error);
    listEl.innerHTML = '<p class="empty-state">Content is temporarily unavailable. Please try again soon.</p>';
  }
};

const renderArticlePage = async (pageType) => {
  const root = document.getElementById('article-root');
  if (!root) return;

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) {
    root.innerHTML = '<p class="empty-state">No article selected.</p>';
    return;
  }

  appendStyles();

  try {
    const entries = await loadEntries(`content/${pageType}`);
    const entry = entries.find((item) => item.slug === slug);

    if (!entry) {
      root.innerHTML = '<p class="empty-state">This article could not be found.</p>';
      return;
    }

    const backHref = pageType === 'blog' ? 'blog.html' : 'wiki.html';
    const typeLabel = entry.category || entry.section || 'Article';
    const authorMarkup = pageType === 'blog' && entry.author ? `<p class="article-byline">By <strong>${escapeHTML(entry.author)}</strong></p>` : '';
    const imageMarkup = entry.image ? `<img class="article-image" src="${escapeHTML(entry.image)}" alt="${escapeHTML(entry.title || 'Article image')}">` : '';

    root.innerHTML = `
      <div class="article-top">
        <span>${escapeHTML(typeLabel)}</span>
        <a href="${backHref}" class="text-link">Back to ${pageType} <span>↗</span></a>
      </div>
      <header class="article-header">
        <p class="eyebrow">${escapeHTML(typeLabel)}${entry.date ? ` · ${formatDate(entry.date)}` : ''}</p>
        <h1>${escapeHTML(entry.title || 'Untitled')}</h1>
        ${authorMarkup}
      </header>
      <div class="article-copy">
        ${imageMarkup}
        ${markdownToHTML(entry.body || '')}
      </div>
    `;
  } catch (error) {
    console.error(error);
    root.innerHTML = '<p class="empty-state">This article could not be loaded.</p>';
  }
};

const initializeTheme = () => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  const themeButton = document.querySelector('.theme-toggle');

  if (localStorage.getItem('putrajaya-theme') === 'dark') document.body.classList.add('dark');

  const updateThemeButton = () => {
    if (!themeButton) return;
    const dark = document.body.classList.contains('dark');
    const icon = themeButton.querySelector('.theme-icon');
    const label = themeButton.querySelector('.theme-label');
    if (icon) icon.textContent = dark ? '☀' : '☾';
    if (label) label.textContent = dark ? 'Light' : 'Dark';
    themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  };

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
};

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();

  if (document.getElementById('blog-list')) renderListPage('blog');
  if (document.getElementById('wiki-list')) renderListPage('wiki');

  if (document.getElementById('article-root')) {
    const pageType = document.body.dataset.articlePage || 'blog';
    renderArticlePage(pageType);
  }
});
