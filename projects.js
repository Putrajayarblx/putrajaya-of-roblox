(() => {
  const repo = 'Putrajayarblx/putrajaya-of-roblox';
  const branch = 'main';
  const api = `https://api.github.com/repos/${repo}/contents/`;
  const raw = `https://raw.githubusercontent.com/${repo}/${branch}/`;

  const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));

  const assetUrl = (value = '') => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `${raw}${String(value).replace(/^\/+/, '')}`;
  };

  const dateLabel = (value) => {
    if (!value) return 'Unpublished';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? escape(value) : new Intl.DateTimeFormat('en-MY', { day:'numeric', month:'short', year:'numeric' }).format(date);
  };

  const frontmatter = (text) => {
    const match = String(text).match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
    if (!match) return { meta:{}, body:String(text).trim() };
    const meta = {};
    match[1].split(/\r?\n/).forEach((line) => {
      const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (item) meta[item[1]] = item[2].trim().replace(/^['"]|['"]$/g, '');
    });
    return { meta, body:match[2].trim() };
  };

  const load = async (folder) => {
    const listing = await fetch(`${api}${folder}?ref=${branch}`, { cache:'no-store', headers:{Accept:'application/vnd.github+json'} });
    if (!listing.ok) throw new Error(`Unable to load ${folder}`);
    const files = (await listing.json()).filter((file) => file.type === 'file' && file.name.endsWith('.md'));
    return Promise.all(files.map(async (file) => {
      const response = await fetch(`${raw}${file.path}`, { cache:'no-store' });
      const parsed = frontmatter(await response.text());
      return { ...parsed.meta, body:parsed.body };
    }));
  };

  const render = async (folder, id, emptyText) => {
    const root = document.getElementById(id);
    if (!root) return;
    try {
      const entries = await load(folder);
      if (!entries.length) {
        root.innerHTML = `<p class="managed-empty">${emptyText}</p>`;
        return;
      }
      root.innerHTML = entries.map((entry) => {
        const image = assetUrl(entry.image);
        const video = assetUrl(entry.video);
        const media = video
          ? `<video class="managed-card-media" controls muted playsinline preload="metadata"${image ? ` poster="${escape(image)}"` : ''}><source src="${escape(video)}">Your browser does not support video playback.</video>`
          : image
            ? `<img class="managed-card-media" src="${escape(image)}" alt="${escape(entry.title || '')}" loading="lazy">`
            : '<div class="managed-card-media" aria-hidden="true"></div>';
        const description = entry.description || entry.summary || entry.body || '';
        return `<article class="managed-card">${media}<div class="managed-card-copy"><div class="managed-card-meta"><span>${escape(entry.category || (folder.includes('jobs') ? 'RP job' : 'Project'))}</span><span>${dateLabel(entry.date)}</span></div><h3>${escape(entry.title || 'Untitled')}</h3><p>${escape(description).replace(/\n/g, '<br>')}</p><a class="managed-card-button" href="${escape(entry.button_url || '#')}" target="_blank" rel="noopener noreferrer">${escape(entry.button_label || 'Learn more')} <span>↗</span></a></div></article>`;
      }).join('');
    } catch (error) {
      root.innerHTML = '<p class="managed-empty">Content is temporarily unavailable.</p>';
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    render('content/projects', 'projects-catalog', 'No projects published yet.');
    render('content/rp-jobs', 'rp-jobs-catalog', 'No RP jobs published yet.');
  });
})();
