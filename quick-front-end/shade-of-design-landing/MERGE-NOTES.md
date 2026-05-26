# Merging this bundle into your existing repo

> **Important:** This bundle is **add/replace only**. It will not touch files outside its own list — your `Pipeline/` folder (and anything else not listed here) stays exactly as it is.

---

## What this bundle touches

These are the only files this bundle adds or overwrites:

```
index.html       (overwrite)
brand-system.html  (overwrite)
weekly.html        (NEW)
landing.jsx                          (overwrite — adds Weekly link to nav)
landing.css                          (overwrite — adds social row styles)
weekly.jsx                           (NEW)
weekly.css                           (NEW)
app.jsx                              (overwrite — brand system entry)
sections.jsx                         (overwrite — brand system content)
styles.css                           (overwrite — shared design tokens)
tweaks-panel.jsx                     (overwrite — shared in-page tweaks)
weeks/index.json                     (NEW — manifest)
weeks/2026-W21.json                  (NEW — sample week, replace with real data)
assets/logo-mark.png                 (overwrite — same as before)
assets/logo-lockup.png               (overwrite — same as before)
README.md                            (overwrite or skip — your call)
BACKLOG.md                           (overwrite or skip — your call)
PORTING-WEEKLY.md                    (NEW — data contract & pipeline notes)
MERGE-NOTES.md                       (this file — NEW)
```

## What this bundle does **not** touch

Anything not listed above stays untouched. That explicitly includes:

- `Pipeline/` and everything inside it
- Any `.env`, `.gitignore`, or local config files
- Your `node_modules/` (if any)
- Your `_redirects`, `netlify.toml`, or other Netlify config
- Any other folders you've added since the original bundle

---

## Recommended merge workflow

### Option A — copy specific files (safest)

```bash
# from your repo root, with the unzipped bundle next to it:
cd shade-of-design-landing/

# 1. New folders & files
cp -r ../shade-of-design-site/weeks ./
cp ../shade-of-design-site/Shade*Weekly.html ./
cp ../shade-of-design-site/weekly.jsx ./
cp ../shade-of-design-site/weekly.css ./
cp ../shade-of-design-site/PORTING-WEEKLY.md ./
cp ../shade-of-design-site/MERGE-NOTES.md ./

# 2. Overwrites (these change behavior — review the diff first)
cp ../shade-of-design-site/landing.jsx ./       # adds Weekly nav link
cp ../shade-of-design-site/landing.css ./       # adds social row styles
cp ../shade-of-design-site/styles.css ./        # shared tokens (no breaking changes)

# 3. Brand system updates (only if you want the latest)
cp ../shade-of-design-site/app.jsx ./
cp ../shade-of-design-site/sections.jsx ./
cp "../shade-of-design-site/brand-system.html" ./
cp "../shade-of-design-site/index.html" ./
cp ../shade-of-design-site/tweaks-panel.jsx ./

# 4. Docs — your call whether to overwrite
# cp ../shade-of-design-site/README.md ./
# cp ../shade-of-design-site/BACKLOG.md ./

git status   # review what changed
git diff     # review the actual changes
git add ...
git commit -m "Add Weekly page + data folder"
git push
```

Your `Pipeline/` folder is never referenced, so it stays put.

### Option B — drag-and-drop in your editor

If you use VS Code or similar:
1. Unzip the bundle next to your repo
2. Drag the **new** files into the repo (`weekly.*`, `weeks/`, `weekly.html`, `PORTING-WEEKLY.md`, `MERGE-NOTES.md`)
3. For overwrites, drag each one over its existing counterpart and confirm replace
4. Review `git status` / `git diff` before committing

### Option C — overwrite everything except Pipeline (fastest, if you trust the bundle)

```bash
# from your repo root:
rsync -av --exclude='Pipeline/' --exclude='.git/' --exclude='node_modules/' \
  ../shade-of-design-site/ ./
```

`rsync` only changes files in the bundle; `Pipeline/` is excluded explicitly.

---

## Files you should review carefully before committing

These three have real behavior changes from the last bundle:

| File | What changed |
|---|---|
| `landing.jsx` | Nav now has 4 items (added "Weekly"). Social row added below Work. |
| `landing.css` | New `.social-card` and `.find-note` styles, footer is now flex with icon row. |
| `styles.css` | Same tokens; safe overwrite. |

Everything in `weeks/` is sample content — `2026-W21.json` has placeholder numbers clearly labeled in the `summary` field. Replace with real data when you write your first real week.

---

## Hosting: you're on Netlify, not Cloudflare

Good catch. The behavior is identical (static site, no build step), but the deploy UI is different.

### If your repo is already linked to Netlify

Just `git push`. Netlify rebuilds on every push to the default branch. The new files will be live in ~30 seconds.

### Netlify build settings (verify these match)

In your Netlify site → **Site configuration → Build & deploy → Build settings**:

- **Build command:** _(empty)_
- **Publish directory:** `.` (or the folder containing the HTML files if your repo has them nested)

No environment variables, no Node version, no build plugins needed for this site.

### Optional: friendly URLs on Netlify

Create a `_redirects` file at the repo root (Netlify's native redirects format):

```
# Friendly URLs without renaming the HTML files
/weekly  /weekly.html  200
/brand   /brand-system.html  200
/        /index.html  200!
```

(`200` rewrites, don't change the URL bar. `200!` forces it as the default page.)

Or — rename the HTML files (cleaner long-term, see `PORTING-WEEKLY.md` §6).

### Where the Cloudflare references are in the bundle

These docs say "Cloudflare Pages" — they should read "Netlify":

- `README.md` (Deploy section)
- `PORTING-WEEKLY.md` (§6 Deployment)
- `BACKLOG.md` (a few items mention Cloudflare)

Behavior is the same; only the dashboard you click through differs. I can regenerate those with Netlify wording if you'd like — let me know.

---

## About your data pipeline (the `Pipeline/` folder)

If `Pipeline/` is going to be the thing that eventually writes `weeks/<id>.json` files, it's a clean separation already:

- `Pipeline/` = code that generates the data
- `weeks/` = the data the site reads

When the pipeline is ready to write into the site, the contract it needs to honor is in `PORTING-WEEKLY.md` §3 (the JSON shape). That's the only handoff point between the two.

If you want to keep them in **separate** repos eventually (pipeline as its own thing), the workflow becomes:
1. Pipeline runs, generates JSON
2. Pipeline commits the JSON to the **site** repo (via GitHub Actions or a script)
3. Netlify redeploys the site on that commit

That keeps the site repo small and the pipeline portable. Worth considering when the pipeline starts pulling its weight.
