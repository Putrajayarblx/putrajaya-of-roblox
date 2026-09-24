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
    const index = line.indexOf(':');
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['\"]|['\"]$/g, '');
    meta[key] = value;
  });
  return { meta, body: match[2].trim() };
};

const markdownToHTML = (markdown) => {
  const blocks = markdown.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
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

const getContentFiles = async (folder) => {
  const response = await fetch(`${contentApiBase}${folder}`);
  if (!response.ok) throw new Error(`Failed to load ${folder}`);
  const entries = await response.json();
  return entries.filter((entry) => entry.type === 'file' && entry.name.endsWith('.md'));
};

const loadEntries = async (folder) => {
  const files = await getContentFiles(folder);
  const entries = await Promise.all(files.map(async (file) => {
    const raw = await fetch(file.download_url).then((res) => res.text());
    const parsed = parseFrontmatter(raw);
    return { ...parsed.meta, body: parsed.body, slug: file.name.replace(/\.md$/, '') };
  }));
  return entries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
};

const appendStyles = () => {
  const id = 'putrajaya-cms-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .cms-controls{display:flex;flex-wrap:wrap;gap:.75rem;margin-bottom:1.25rem}.cms-controls input,.cms-controls select{flex:1 1 220px;min-height:42px;padding:.7rem .9rem;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink)}.cms-controls input:focus,.cms-controls select:focus{outline:2px solid rgba(63,126,126,.2);border-color:var(--green)}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.empty-state{padding:1.2rem;background:var(--surface2);border:1px solid var(--line);border-radius:12px;color:var(--muted)}.post-author,.article-byline{display:block;margin-top:.4rem;font-size:.82rem;color:var(--muted)}.post-author strong,.article-byline strong{color:var(--ink)}.cms-card .meta{display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap}.cms-card .meta span:first-child{padding:0.25rem 0.6rem;border-radius:999px;background:var(--surface2);color:var(--green);font-size:0.72rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase}.cms-card h3{margin:0.85rem 0 0.35rem}.cms-card p{margin:0 0 0.85rem}.cms-card .text-link{margin-top:.2rem;display:inline-flex}.article-copy ul.article-list{padding-left:1.1rem;margin:1rem 0}.article-copy ul.article-list li{margin-bottom:.5rem}
  `;
  document.head.appendChild(style);
};

const renderListPage = async (pageType) => {
  const listEl = document.getElementById(`${pageType}-list`);
  const searchEl = document.getElementById(`${pageType}-search`);
  const categoryEl = document.getElementById(`${pageType}-category`);
  if (!listEl) return;
  appendStyles();

  try {
    const entries = await loadEntries(`content/${pageType}`);
    const allCategories = [...new Set(entries.map((entry) => entry.category || entry.section).filter(Boolean))].sort();

    if (categoryEl) {
      categoryEl.innerHTML = `<option value="">All ${pageType === 'blog' ? 'categories' : 'sections'}</option>${allCategories.map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join('')}`;
    }

    const render = () => {
      const term = (searchEl?.value || '').trim().toLowerCase();
      const selectedCategory = categoryEl?.value || '';
      const filtered = entries.filter((entry) => {
        const haystack = `${entry.title || ''} ${entry.summary || ''} ${(entry.body || '').replace(/[#>*_`\-]/g, ' ')} ${(entry.category || entry.section || '')}`.toLowerCase();
        const matchesSearch = !term || haystack.includes(term);
        const matchesCategory = !selectedCategory || (entry.category || entry.section) === selectedCategory;
        return matchesSearch && matchesCategory;
      });

      if (!filtered.length) {
        listEl.innerHTML = '<p class="empty-state">No matching entries found.</p>';
        return;
      }

      const listHTML = filtered.map((entry) => {
        const label = entry.category || entry.section || 'General';
        const authorText = entry.author ? `<small class="post-author">By <strong>${escapeHTML(entry.author)}</strong></small>` : '';
        const href = pageType === 'blog' ? `blog-post.html?slug=${encodeURIComponent(entry.slug)}` : `wiki-article.html?slug=${encodeURIComponent(entry.slug)}`;
        return `
          <article class="article-card cms-card">
            <div class="meta"><span>${escapeHTML(label)}</span><span>${formatDate(entry.date)}</span></div>
            <h3>${escapeHTML(entry.title || 'Untitled')}</h3>
            <p>${escapeHTML(entry.summary || '')}</p>
            ${authorText}
            <a href="${href}" class="text-link">Read ${pageType === 'blog' ? 'article' : 'guide'} <span>↗</span></a>
          </article>
        `;
      }).join('');

      listEl.innerHTML = listHTML;
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
  const container = document.getElementById('article-root');
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!container || !slug) return;
  appendStyles();

  try {
    const entries = await loadEntries(`content/${pageType}`);
    const entry = entries.find((item) => item.slug === slug);
    if (!entry) {
      container.innerHTML = '<p class="empty-state">This article could not be found.</p>';
      return;
    }

    const backHref = pageType === 'blog' ? 'blog.html' : 'wiki.html';
    const typeLabel = entry.category || entry.section || 'Article';
    const authorMarkup = pageType === 'blog' ? `<p class="article-byline">By <strong>${escapeHTML(entry.author || 'Putrajaya of Roblox')}</strong></p>` : '';
    const imageMarkup = entry.image ? `<img class="article-image" src="${escapeHTML(entry.image)}" alt="${escapeHTML(entry.title || 'Article image')}">` : '';
    const html = `
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
    container.innerHTML = html;
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="empty-state">This article could not be loaded.</p>';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('blog-list')) renderListPage('blog');
  if (document.getElementById('wiki-list')) renderListPage('wiki');
  if (document.getElementById('article-root')) {
    const pageType = document.body.dataset.articlePage || 'blog';
    renderArticlePage(pageType);
  }
});
