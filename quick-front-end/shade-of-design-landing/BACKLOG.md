# Shade of Design — Backlog

A portable backlog. Each item is sized as a GitHub issue: title, short context, acceptance check.
Copy/paste rows into **GitHub Projects** (or as individual issues) per repo.

---

## Repo: `shade-of-design-landing` → `unite-passion/`

### Off-day / off-race substance (priority order)

- [ ] **Countdown timer to next race & next NY game**
  Both panels are nearly empty between events. A live countdown (days · hrs · mins)
  to the next scheduled event gives the page a reason to exist every day.
  Derives from ESPN schedule data already being fetched — no new API call.
  _Done when:_ each panel shows a ticking countdown when no event is live or in-progress.

- [ ] **NASCAR season standings (top 10 points)**
  Use ESPN's standings endpoint (`/apis/v2/sports/racing/nascar/standings`) to render a
  compact driver points table in the off-race NASCAR panel, similar to the NBA standings
  already in the hoops panel.
  _Done when:_ top 10 Cup Series drivers with position, name, car #, and points shown
  when no race is active.

- [ ] **Upcoming schedule strip — next 3 races + next 3 NY games**
  A horizontal or stacked list of the next few events (track/opponent, date, TV) replaces
  the single "next race" card that only shows one entry.
  Sourced from ESPN scoreboard `events` array (pre-game entries).
  _Done when:_ both panels show 3 upcoming events with date and network info.

- [ ] **Last race / last game result card**
  The page currently shows nothing after an event ends. Pull the most recent `post`-state
  event from ESPN and show a condensed result (winner + gap for NASCAR; final score for
  NBA) until the next event starts.
  _Done when:_ a "Last race" or "Last game" card appears when state is `post` and no
  current event is `in`.

- [ ] **Knicks & Nets team record + streak widget**
  Small stat block — W / L record, home/away split, current streak (W3 / L1 etc.) —
  pulled from the standings data already fetched. Lives at the top of the hoops panel.
  _Done when:_ Knicks and Nets each have a compact record row visible any time the
  basketball panel loads.

- [ ] **Driver season stats for featured drivers**
  For Dale Jr., Denny Hamlin, and the legend row — show career wins or current-season
  stats (starts, wins, top 5s, top 10s) pulled from ESPN athlete endpoint or stored as
  static JSON in the repo for legends.
  _Done when:_ each driver card has a small stats line below the name.

- [ ] **"On this day" lore cards (static rotating)**
  Static JSON file of notable NASCAR and NBA facts tied to calendar dates (Earnhardt
  Sr.'s 7th championship, Petty's 200th win, Knicks' '73 title, etc.).
  Rotates daily. No API dependency — pure content.
  _Done when:_ a "On this day" card appears in each panel when no live event is running,
  surfacing a relevant historical fact.

- [ ] **Playoff picture / NASCAR playoff grid**
  During playoff windows show a seeded bracket or bubble table. ESPN provides playoff
  status flags in standings data.
  _Done when:_ a playoff grid or bubble indicator replaces the regular standings during
  playoff weeks.

---



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
