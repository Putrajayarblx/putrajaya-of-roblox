const REPO = 'Putrajayarblx/putrajaya-of-roblox';
const BRANCH = 'main';
const CONTENT_API = 'https://api.github.com/repos/Putrajayarblx/putrajaya-of-roblox/contents/';

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
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const parseFrontmatter = (markdown) => {
  const match = String(markdown).match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (!match) return { meta: {}, body: String(markdown).trim() };

  const meta = {};
  match[1].split('\n').forEach((line) => {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!item) return;
    meta[item[1]] = item[2].trim().replace(/^['"]|['"]$/g, '');
  });

  return { meta, body: match[2].trim() };
};

const loadMarkdownEntries = async (folder) => {
  try {
    const response = await fetch(`${CONTENT_API}${folder}?ref=${BRANCH}`, {
      headers: { Accept: 'application/vnd.github+json' }
    });

    if (!response.ok) {
      return [];
    }

    const files = await response.json();
    const markdownFiles = files.filter((file) => file.type === 'file' && file.name.endsWith('.md'));

    const entries = await Promise.all(markdownFiles.map(async (file) => {
      const raw = await fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${file.path}`, {
        cache: 'no-store'
      });

      if (!raw.ok) return null;
      const text = await raw.text();
      const parsed = parseFrontmatter(text);

      return {
        ...parsed.meta,
        body: parsed.body,
        slug: file.name.replace(/\.md$/, '')
      };
    }));

    return entries.filter(Boolean).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } catch (error) {
    return [];
  }
};

const renderLatestPosts = async () => {
  const root = document.getElementById('latest-posts');
  if (!root) return;

  const posts = await loadMarkdownEntries('content/blog');
  const latest = posts.slice(0, 3);

  if (!latest.length) {
    root.innerHTML = '<p class="empty-state">Latest updates are temporarily unavailable.</p>';
    return;
  }

  root.innerHTML = latest.map((post) => {
    const image = post.image
      ? `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${post.image.replace(/^\/+/, '')}`
      : '';

    const imageStyle = image
      ? `background-image:url('${image}')`
      : 'background:linear-gradient(135deg,#dfe8e0,#d8ceae)';

    return `
      <article class="post-card reveal">
        <div class="post-image" style="${imageStyle}"></div>
        <div class="post-meta">${escapeHTML(post.category || 'Community')} <span>•</span> ${formatDate(post.date)}</div>
        <h3>${escapeHTML(post.title || 'Untitled')}</h3>
        <p>${escapeHTML(post.summary || (post.body || '').replace(/[#>*`]/g, '').slice(0, 140))}</p>
        <a href="blog-post.html?slug=${encodeURIComponent(post.slug)}">Read the story <span>↗</span></a>
      </article>
    `;
  }).join('');
};

const renderCatalog = async (folder, containerId, kind) => {
  const root = document.getElementById(containerId);
  if (!root) return;

  const entries = await loadMarkdownEntries(folder);

  if (!entries.length) {
    root.innerHTML = '<p class="empty-state">No entries published yet.</p>';
    return;
  }

  root.innerHTML = entries.map((entry) => {
    const image = entry.image
      ? `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${entry.image.replace(/^\/+/, '')}`
      : '';

    const media = image
      ? `<img class="catalog-media" src="${image}" alt="${escapeHTML(entry.title || '')}" loading="lazy">`
      : '<div class="catalog-media placeholder"></div>';

    const buttonText = entry.button_label || 'Learn more';
    const buttonUrl = entry.button_url || '#';

    return `
      <article class="catalog-card reveal">
        ${media}
        <div class="catalog-copy">
          <div class="catalog-meta">
            <span>${escapeHTML(entry.category || kind)}</span>
            <span>${formatDate(entry.date)}</span>
          </div>
          <h3>${escapeHTML(entry.title || 'Untitled')}</h3>
          <p>${escapeHTML(entry.summary || (entry.body || '').replace(/[#>*`]/g, '').slice(0, 180))}</p>
          <a href="${escapeHTML(buttonUrl)}" class="catalog-button" target="_blank" rel="noreferrer">${escapeHTML(buttonText)} <span>↗</span></a>
        </div>
      </article>
    `;
  }).join('');
};

const animateCounter = (target, element) => {
  const value = Number(target);
  let current = 0;
  const duration = 1200;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    current = Math.round(value * eased);
    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = value.toLocaleString();
    }
  };

  requestAnimationFrame(tick);
};

const initializeReveal = () => {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observerInstance.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

  items.forEach((item) => observer.observe(item));
};

const initializeTheme = () => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  const theme = document.querySelector('.theme-toggle');

  if (theme) {
    const saved = localStorage.getItem('putrajaya-theme');
    if (saved === 'dark') document.body.classList.add('dark-mode');

    const syncTheme = () => {
      const dark = document.body.classList.contains('dark-mode');
      const icon = theme.querySelector('.theme-icon');
      const label = theme.querySelector('.theme-label');

      if (icon) icon.textContent = dark ? '☀' : '☾';
      if (label) label.textContent = dark ? 'Light' : 'Dark';
      theme.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    };

    syncTheme();
    theme.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('putrajaya-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
      syncTheme();
    });
  }

  if (menu && nav) {
    menu.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }
};

const initializeCounters = () => {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target.dataset.target, entry.target);
      observerInstance.unobserve(entry.target);
    });
  }, { threshold: 0.35 });

  counters.forEach((counter) => observer.observe(counter));
};

document.addEventListener('DOMContentLoaded', () => {
  initializeReveal();
  initializeTheme();
  initializeCounters();
  renderLatestPosts();
  renderCatalog('content/projects', 'projects-catalog', 'Projects');
  renderCatalog('content/rp-jobs', 'rp-jobs-catalog', 'RP jobs');
});
