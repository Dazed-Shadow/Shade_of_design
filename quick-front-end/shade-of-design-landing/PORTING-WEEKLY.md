# Porting Guide — Weekly Page

> **Target repo:** `shade-of-design-landing` (the one already hosting your landing + brand system on Netlify).
>
> **Goal:** add a new `weekly.html` page driven by per-week JSON files. No backend. No build step. Just files in the repo.
>
> **TL;DR of the change:** 5 new files, 1 small edit to the landing page nav.

---

## 1. File changes at a glance

### New files

| Path | Purpose | Edit cadence |
|---|---|---|
| `weekly.html` | Page entry | Rarely (only if scaffolding changes) |
| `weekly.css` | Page styles | Rarely |
| `weekly.jsx` | Page logic — loads JSON, renders sections | Rarely |
| `weeks/index.json` | Manifest — lists every week, points to "latest" | **Every week** |
| `weeks/2026-W21.json` | First week's content | **Every week** (one new file) |

### Edited files

| Path | What changed |
|---|---|
| `landing.jsx` | Added `<a href="weekly.html">` to the `<nav>` |

That's it. Same Netlify site — `git push` is the deploy.

---

## 2. Folder shape after porting

```
shade-of-design-landing/
├── index.html
├── brand-system.html
├── weekly.html        ← new
├── landing.jsx                          ← edited (nav)
├── landing.css
├── sections.jsx
├── app.jsx
├── styles.css                           ← shared tokens (already there)
├── tweaks-panel.jsx                     ← shared (already there)
├── weekly.jsx                           ← new
├── weekly.css                           ← new
├── weeks/                               ← new folder
│   ├── index.json                       ← manifest
│   └── 2026-W21.json                    ← one file per week
└── assets/
    ├── logo-mark.png
    └── logo-lockup.png
```

---

## 3. The data contract

This is the only thing that matters for the data pipeline. If your future SAM.gov pull script writes JSON in this shape, the page picks it up automatically.

### `weeks/index.json` — the manifest

```json
{
  "latest": "2026-W21",
  "weeks": [
    { "id": "2026-W21", "label": "Week 21 · May 18 – 24, 2026" }
  ]
}
```

- `latest` — which week ID to load by default. **Always update this.**
- `weeks[]` — newest first. The Archive section reads this.

### `weeks/<week-id>.json` — one week's content

```json
{
  "week": "2026-W21",
  "label": "Week 21",
  "dateRange": "May 18 – 24, 2026",
  "publishedAt": "2026-05-25",
  "headline": "Reading awards data is a skill. I'm in week one.",

  "naicsRotation": {
    "rotation": "Set 01",
    "rotatesEvery": "4 weeks",
    "tracked": [
      { "code": "561110", "name": "Office Administrative Services" },
      { "code": "561990", "name": "All Other Support Services" },
      { "code": "561320", "name": "Temporary Help Services" },
      { "code": "541611", "name": "Admin & General Management Consulting" },
      { "code": "493110", "name": "General Warehousing & Storage" }
    ]
  },

  "awards": {
    "summary": "Optional caption shown under the tables.",
    "byAgency": [
      { "agency": "Dept. of Veterans Affairs", "count": 14, "totalValue": 4250000 }
    ],
    "byNAICS": [
      { "code": "561110", "count": 8, "totalValue": 2400000 }
    ]
  },

  "blog": {
    "title": "Week one: looking at the data instead of feeling around it",
    "body": [
      "Paragraph 1...",
      "Paragraph 2..."
    ]
  },

  "contracts": [
    {
      "title": "Administrative Support Services — Regional Office",
      "agency": "Dept. of Veterans Affairs",
      "naics": "561110",
      "naicsName": "Office Administrative Services",
      "value": "$250,000 – $500,000",
      "closeDate": "2026-06-15",
      "description": "Provide administrative support services...",
      "url": "https://sam.gov/..."
    }
  ]
}
```

### Field notes

| Field | Type | Notes |
|---|---|---|
| `week` | string | Stable ID. Format: `YYYY-Www`. Used as filename and archive key. |
| `label` | string | Short human label, e.g. "Week 21". |
| `dateRange` | string | Display only. Format freely. |
| `publishedAt` | string | YYYY-MM-DD. Display only. |
| `headline` | string | Big H1 on the page. Keep punchy, 5–10 words. |
| `naicsRotation.tracked[]` | array | 5–7 codes. Drives the right-rail panel only. |
| `awards.byAgency[].totalValue` | number | Cents-optional dollars. Formatter handles K/M. |
| `awards.byNAICS[].totalValue` | number | Same. |
| `blog.body[]` | array of strings | Each string = one paragraph. |
| `contracts[].closeDate` | string | **Must be `YYYY-MM-DD`** — used for sort + urgency calc. |
| `contracts[].value` | string | Free text. Show ranges, "TBD", etc. |
| `contracts[].url` | string | Optional. Omit to hide the "View listing" link. |

### Validation rules the page enforces

- Empty `body[]` array → blog section still renders, just no paragraphs
- Missing `awards.byAgency` or `byNAICS` → page errors (always include both, even if empty `[]`)
- `contracts[]` sorted by `closeDate` ascending; urgency colors apply automatically
  - `≤ 7 days` → red (`urgent`)
  - `≤ 21 days` → amber (`soon`)
  - `> 21 days` → default

---

## 4. Weekly ritual (the manual flow)

Every week, 4 file ops:

1. **Copy** `weeks/<last-week>.json` → `weeks/<new-week>.json`
2. **Fill** new file with the week's data (awards, blog, contracts)
3. **Update** `weeks/index.json`:
   - Change `latest` to the new ID
   - Prepend new entry to `weeks[]`
4. **Commit & push.** Netlify redeploys in ~30s.

```bash
cd shade-of-design-landing
cp weeks/2026-W21.json weeks/2026-W22.json
$EDITOR weeks/2026-W22.json
$EDITOR weeks/index.json
git add weeks/
git commit -m "Week 22 — closing contracts, VA admin trend"
git push
```

### NAICS rotation cadence

Every ~4 weeks, swap the codes in `naicsRotation.tracked[]`. Keep `rotation` label in step ("Set 01" → "Set 02").

Suggestion: keep a separate `naics-rotations.md` in the repo as your source of truth for which set is up next. Not required by the page.

---

## 5. Future: data pipeline integration

The JSON format is intentionally pipeline-friendly. When you're ready to automate the SAM.gov pull (or USAspending.gov), the integration points are:

### Likely script outputs

A nightly or weekly job that writes:
- `weeks/<id>.json` — the week's data file (you still write the blog by hand)
- `weeks/index.json` — updated manifest

### Pipeline approaches, from simplest to most ambitious

**A. Local Python script + manual push** (most likely first step)
- Pull from SAM.gov API → transform → write JSON → `git push`
- Pros: full control, no infra
- Cons: you have to remember to run it

**B. GitHub Actions on a cron**
- `.github/workflows/weekly.yml` runs every Monday
- Calls SAM.gov API, writes the JSON, commits to repo
- You only write the `blog` section by hand (edit the file post-run)
- Pros: zero servers, free for public repos
- Cons: secrets management for any API keys

**C. Netlify Function + scheduled trigger** (later, if you want real-time data)
- Page fetches from a Netlify Function instead of static JSON
- Function pulls SAM.gov on demand, caches the result
- Pros: always fresh, no commits needed
- Cons: requires a Function, free tier has invocation limits

**Recommendation:** start with A, graduate to B once the data shape settles. Don't go to C until weekly data is no longer enough.

### Splitting "machine-written" from "human-written"

When you add the pipeline, consider splitting one week into two files:
- `weeks/2026-W22-data.json` — machine-written (awards + contracts)
- `weeks/2026-W22-post.json` — human-written (headline + blog body)

The page can merge them at load time. Keeps git history clean and avoids merge conflicts between you and the script. I'd suggest this when you cross the **second** automated week.

---

## 6. Deployment

### Netlify — nothing changes

Same site, same domain, same build settings (none). Netlify picks up the new files on next push to the default branch.

Verify after deploy:
1. Go to `<your-domain>/weekly.html`
2. Should show Week 21 with the sample data
3. Click "Weekly" link from the landing — should land on the same page

### File path note

URLs with spaces work, but if you want cleaner ones you have two options:

**Option 1 — rename files (recommended once the brand stabilizes):**
- `index.html` → `index.html`
- `brand-system.html` → `brand-system.html`
- `weekly.html` → `weekly.html`

Then update the `<a href>` values in `landing.jsx`, `app.jsx` (brand system header), and `weekly.jsx` accordingly.

**Option 2 — add `_redirects` for friendly URLs without renaming.**

Create `_redirects` at the repo root (Netlify reads this natively):

```
/weekly  /weekly.html  200
/brand   /brand-system.html  200
/        /index.html  200!
```

I'd do Option 1. It's a 10-minute rename and the URLs become permanent and clean.

---

## 7. Code update — `landing.jsx` diff

Only one change needed in your existing code. In `landing.jsx`, find the `<nav className="lp-nav">` block:

```jsx
<nav className="lp-nav">
  <a href="brand-system.html" className="navlink">Brand system</a>
  <span className="navlink-sep">·</span>
+ <a href="weekly.html" className="navlink">Weekly</a>
+ <span className="navlink-sep">·</span>
  <a href="#work" className="navlink">Who we support</a>
  <span className="navlink-sep">·</span>
  <a href="#find" className="navlink">Find us</a>
</nav>
```

Two lines added. That's the entire edit.

---

## 8. Local testing

`fetch()` doesn't work on `file://` URLs in most browsers — the page will show a friendly error if you double-click the HTML. To test locally, run a tiny static server from the repo root:

```bash
# Python
python3 -m http.server 8080

# or Node
npx serve .
```

Then visit `http://localhost:8080/Shade%20of%20Design%20—%20Weekly.html`.

On Netlify this isn't an issue — `fetch()` works normally over HTTPS.

---

## 9. Backlog hooks (add to `BACKLOG.md`)

- [ ] Decide on file rename (Option 1 above) before sharing URLs publicly
- [ ] Write `naics-rotations.md` to track which NAICS set is active each cycle
- [ ] Prototype the SAM.gov pull script (Python, no infra yet)
- [ ] Add an RSS feed (`weekly.rss`) generated from `weeks/index.json` — once 4–5 weeks exist
- [ ] Add "subscribe" CTA on the landing once RSS is live
- [ ] Consider splitting `<id>-data.json` from `<id>-post.json` once pipeline is automated
