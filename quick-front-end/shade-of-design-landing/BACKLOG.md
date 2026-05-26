# Shade of Design — Backlog

A portable backlog. Each item is sized as a GitHub issue: title, short context, acceptance check.
Copy/paste rows into **GitHub Projects** (or as individual issues) per repo.

---

## Repo: `shade-of-design-landing`

### Weekly page (new)
- [ ] **Decide on URL renames** before sharing publicly
  See `PORTING-WEEKLY.md` §6. `weekly.html` → `weekly.html` etc.
- [ ] **`naics-rotations.md`** as source of truth for the 4-week NAICS cycles
- [ ] **SAM.gov pull script** (Python, runs locally) — writes `weeks/<id>.json`
- [ ] **Promote to GitHub Actions cron** once the script is stable
- [ ] **Split `<id>-data.json` and `<id>-post.json`** once pipeline is automated
- [ ] **RSS feed** generated from `weeks/index.json` (after 4–5 weeks)

### Brand system
- [ ] **Add tonal scales (50–900) for Ocean, Slate, Ember**
  Currently only base values. Useful for Code work with token systems.
  _Done when:_ each color has 10 stops with HEX + a usage note.
- [ ] **Add logo do-and-don't usage examples**
  Reverse on busy photo, stretched, recolored — show what not to do.
  _Done when:_ at least 6 "don't" cards on the Logo tab.
- [ ] **Iconography set (12 base icons)**
  Stroke icons matching Space Grotesk weight. Search, mail, ship, shield, leaf, spark, link, doc, arrow, check, calendar, person.
- [ ] **Sample applications**
  Business card, email signature, social avatar, simple LinkedIn header.
- [ ] **Pick a mission angle and lock copy**
  Three angles drafted (Strategic / Connective / Catalytic). Choose one, rewrite homepage hero from it.

### Landing page
- [ ] **Wire Lofi Sanctuary tile when hosted**
  Flip `status: "soon"` → `"live"`, set `href`, remove the dot pulse.
- [ ] **Add a fourth section: short "what I do" line**
  One paragraph max. Triggered by the mission-angle decision above.
- [ ] **Add a contact path**
  Email or simple form — decide which.
- [ ] **Favicon variants** (light + dark)
- [ ] **Open Graph + Twitter card images**
  Use the hero mark on a Deep Ocean field. 1200×630.
- [ ] **Custom domain**
  Decide: `shadeofdesign.com`, `.studio`, `.design`. Buy through Netlify or a registrar; point DNS at Netlify.

### Engineering / infra
- [ ] **Move React+Babel CDN to a build step (later)**
  Fine for now — but Vite + esbuild would shave ~200ms of first paint.
- [ ] **Analytics**
  Netlify Analytics (paid) or Plausible/Umami (free tiers, no cookies) recommended.
- [ ] **Backup brand assets to repo `/assets/raw/`**
  Logo source files, fonts license notes.

---

## Repo: `lofi-sanctuary`

### Pre-hosting
- [ ] **Decide artist licensing model** (per README — pending JR's call)
  Blocks the Stream Pack section going live.
- [ ] **Finalize About copy — Draft A vs Draft B**
  Both live in source comments. Pick one.
- [ ] **Real cover art for empty gallery slots**
  Replace diagonal placeholders.

### Hosting
- [ ] **Push to GitHub** as `lofi-sanctuary`
- [ ] **Deploy on Netlify** (no build, publish dir `.`)
- [ ] **Update Shade of Design landing** with the live URL once up

### Polish (after live)
- [ ] **Contact form backend** (Formspree free tier, or Netlify Forms — both work fine)
- [ ] **Spotify embed lazy-load**
  Currently loads three iframes on page open.
- [ ] **Mobile pass**
  Spotify embeds get cramped under 380px.

---

## Cross-cutting (later)

- [ ] **Light Code project: token export**
  Generate `tokens.css` / `tokens.json` so the brand system tokens can be imported into any of the supported creators' sites.
- [ ] **"Supported creators" page**
  Expand the landing's three tiles into a full directory as you bring more on.
- [ ] **One-pager PDF of the brand system**
  For client/partner handoff.
