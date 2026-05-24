# Shade of Design — Backlog

A portable backlog. Each item is sized as a GitHub issue: title, short context, acceptance check.
Copy/paste rows into **GitHub Projects** (or as individual issues) per repo.

---

## Repo: `shade-of-design-landing`

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
- [ ] **Swap tile 03 → ALL_HEALTH**
  Replace Lofi Sanctuary tile with ALL_HEALTH (health tracking app). Set `status: "live"`, point `href` to GitHub repo once pushed.
  _Blocked by:_ ALL_HEALTH pushed to GitHub as `all-health`.
- [ ] **Add nav links: ALL_HEALTH + Sharpen Reason**
  Two tabs in the top nav pointing outbound to their GitHub repos. Sharpen Reason is a placeholder until app is hosted.
  _Blocked by:_ both repos pushed to GitHub.
- [ ] **Add a fourth section: short "what I do" line**
  One paragraph max. Triggered by the mission-angle decision above.
- [ ] **Add a contact path**
  Email or simple form — decide which.
- [ ] **Favicon variants** (light + dark)
- [ ] **Open Graph + Twitter card images**
  Use the hero mark on a Deep Ocean field. 1200×630.
- [ ] **Custom domain**
  Decide: `shadeofdesign.com`, `.studio`, `.design`. Cloudflare Registrar is at-cost (~$9–12/yr).

### Engineering / infra
- [ ] **Move React+Babel CDN to a build step (later)**
  Fine for now — but Vite + esbuild would shave ~200ms of first paint.
- [ ] **Analytics**
  Cloudflare Web Analytics (free, no cookies) recommended.
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
- [ ] **Deploy on Cloudflare Pages** (no build, output `/`)
- [ ] **Update Shade of Design landing** with the live URL once up

### Polish (after live)
- [ ] **Contact form backend** (Formspree or Cloudflare Workers form handler — both have free tiers)
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
