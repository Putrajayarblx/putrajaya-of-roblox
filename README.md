# Putrajaya of Roblox

The official website for **Putrajaya of Roblox**, a Roblox Ro-State roleplay community.

## Content editing with Pages CMS

This repository includes a Pages CMS configuration in `.pages.yml` and editable Markdown content in:

- `content/blog/` — blog posts
- `content/wiki/` — Wiki articles
- `assets/uploads/` — media uploaded through the CMS

To use Pages CMS:

1. Sign in to Pages CMS with the GitHub account that has access to this repository.
2. Select `Putrajayarblx/putrajaya-of-roblox` and the `main` branch.
3. Choose **Blog posts** or **Wiki articles**.
4. Create or edit an entry, upload media if needed, and commit the change.
5. Wait for GitHub Pages to rebuild the site.

The Markdown front matter fields are:

```yaml
---
title: Example title
date: 2026-09-24T00:00:00.000Z
category: Community news
summary: Short description for cards and previews.
image: /putrajaya-of-roblox/assets/uploads/example.png
---

Article content goes here.
```

### Important publishing limitation

Pages CMS edits Markdown files in GitHub. The current static HTML pages do not automatically turn every new Markdown file into a new rendered blog or Wiki page. The existing HTML pages remain the live templates until a static-site build step is added.

For the current site, use the CMS to manage the content files, then either connect them to a generator or copy the approved Markdown content into the corresponding HTML template. A future build step can automatically generate `blog.html`, `blog-post.html`, `wiki.html`, and Wiki article pages from these files.

## Media and video

Putrajaya media is stored in `assets/Putrajaya/`. The homepage uses the collage banner and the city video. New uploaded CMS media goes into `assets/uploads/`.

The video is deliberately displayed without a border. Its rounded edge and dark background are part of the presentation, while `border: 0` and `outline: 0` remove the thick frame.

## Run locally

Open `index.html` in a browser, or serve the folder with any static web server.

## GitHub Pages

In repository settings, open **Pages**, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.

Published site:

`https://putrajayarblx.github.io/putrajaya-of-roblox/`
