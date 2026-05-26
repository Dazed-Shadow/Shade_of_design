# Shade of Design — Site

A static site hosting the Shade of Design LLC landing page, brand system reference, and weekly content log. Deploys to Netlify with zero build step.

**Live pages:**
- `index.html` — main entry point
- `brand-system.html` — internal brand reference
- `weekly.html` — weekly personal log + gov data

---

## Local development

No build step. Two ways to run:

**Quick check (most of the site):**
Open `index.html` directly in a browser.

**Full check (weekly page needs a server because of `fetch()`):**
```bash
python3 -m http.server 8080
# then visit http://localhost:8080/
```

---

## File map

```
.
├── index.html        ← entry
├── brand-system.html
├── weekly.html
│
├── landing.jsx / landing.css             ← landing page
├── weekly.jsx  / weekly.css              ← weekly page
├── app.jsx     / sections.jsx            ← brand system doc
├── styles.css                            ← shared tokens
├── tweaks-panel.jsx                      ← shared in-page tweaks UI
│
├── weeks/
│   ├── index.json                        ← manifest (edit weekly)
│   └── 2026-W21.json                     ← one file per week
│
├── assets/
│   ├── logo-mark.png
│   └── logo-lockup.png
│
├── README.md                             ← this file
├── BACKLOG.md                            ← portable issue list
└── PORTING-WEEKLY.md                     ← weekly page data contract & pipeline notes
```

---

## Deploy — Netlify (free)

Site is currently hosted on Netlify. Every `git push` to the default branch redeploys automatically (~30s).

**Build settings in Netlify dashboard:**
- Build command: _(leave empty)_
- Publish directory: `.` (or the subfolder containing the HTML if nested)
- No environment variables needed

**Friendly URLs (optional):** add a `_redirects` file at the repo root — see `MERGE-NOTES.md`.

---

## The weekly content ritual

Each week, 4 file ops. See `PORTING-WEEKLY.md` §3–§4 for the full data contract.

```bash
cp weeks/2026-W21.json weeks/2026-W22.json
$EDITOR weeks/2026-W22.json    # fill in awards, blog, contracts
$EDITOR weeks/index.json       # bump "latest", prepend the new week
git add weeks/ && git commit -m "Week 22" && git push
```

NAICS rotation lives inside each week's JSON (`naicsRotation.tracked[]`). Swap every ~4 weeks.

---

## Tweaks

Every page has a floating **Tweaks** toggle in the toolbar. Currently exposes a light/dark theme switch. Settings persist via the host edit-mode protocol.

---

## Backlog

See `BACKLOG.md` — items are sized for GitHub Issues. Copy rows into the repo's **Projects** tab.
