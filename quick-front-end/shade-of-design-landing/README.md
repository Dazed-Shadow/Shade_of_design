# Shade of Design — Landing

The Shade of Design LLC landing page + brand system reference.

## Local development

No build step. Open `Shade of Design — Landing.html` in a browser.

The landing links to the brand system doc (`Shade of Design — Brand System.html`).

## Files

```
.
├── Shade of Design — Landing.html      ← entry point
├── Shade of Design — Brand System.html ← /brand-system
├── landing.jsx / landing.css           ← landing page
├── app.jsx / sections.jsx / styles.css ← brand system doc
├── tweaks-panel.jsx                    ← shared in-page tweaks UI
├── assets/                             ← logo files
└── BACKLOG.md                          ← portable backlog (see Projects)
```

React + Babel are loaded from CDN. No `npm install` required.

## Deploy (Cloudflare Pages — free)

1. Push this folder to a GitHub repo.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Pick the repo. **Build command:** _(leave empty)_ · **Build output:** `/`.
4. Save & Deploy. You get a free `*.pages.dev` URL.
5. (Optional) **Custom domains** tab → add `shadeofdesign.com` or similar.

Auto-redeploys on every `git push` to `main`.

### Alternatives
- **Netlify** — same flow, drag-and-drop folder also works.
- **GitHub Pages** — Settings → Pages → Deploy from `main`. Slightly slower CDN.
- **Vercel** — best for Next.js, overkill for a static site, but free and fast.

## Backlog

See `BACKLOG.md`. Copy rows into the repo's **Projects** tab as issues.
