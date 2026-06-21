/* global React, ReactDOM, supabase */
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{ "theme": "dark", "stylePreset": "telemetry" }/*EDITMODE-END*/;

// ─── API endpoints ────────────────────────────────────────────────────────────
const NASCAR_SCOREBOARD  = "https://site.api.espn.com/apis/site/v2/sports/racing/nascar/scoreboard";
const NASCAR_STANDINGS   = "https://site.api.espn.com/apis/v2/sports/racing/nascar/standings";
const NASCAR_NEWS        = "https://site.api.espn.com/apis/site/v2/sports/racing/nascar/news?limit=3";
const NBA_SCOREBOARD     = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const NBA_STANDINGS      = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings";
const NBA_NEWS           = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=3";
const NBA_LEADERS_URL    = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders?limit=5";

function wikipediaOTD() {
  const now = new Date();
  const mm  = String(now.getMonth() + 1).padStart(2, "0");
  const dd  = String(now.getDate()).padStart(2, "0");
  return `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`;
}

// ─── Comment wall config ─────────────────────────────────────────────────────
// SETUP (~5 min, one-time):
//  1. Create free account at https://supabase.com
//  2. New project → Settings → API → copy "Project URL" and "anon public" key
//  3. SQL Editor → run:
//       create table comments (
//         id         uuid        default gen_random_uuid() primary key,
//         title      text        not null,
//         body       text        not null,
//         author     text        not null default 'Anonymous',
//         created_at timestamptz default now()
//       );
//       alter table comments enable row level security;
//       create policy "read all"   on comments for select using (true);
//       create policy "insert all" on comments for insert with check (true);
//  4. Replace the two placeholder strings below with your values and push.
const SUPABASE_URL  = "https://emyierfkxcscieqggyjd.supabase.co";
const SUPABASE_KEY  = "sb_publishable_1bAn7tEdADRhVwSJtYdpTg_ge6hxqK3";
const COMMENTS_ON   = !SUPABASE_URL.startsWith("YOUR_");
const sb            = COMMENTS_ON ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const REFRESH_MS = 60_000;
const NY_TEAMS   = ["NYK", "BKN"];

// ─── NY team external links ───────────────────────────────────────────────────
const NY_TEAM_INFO = {
  NYK: { url: "https://www.nba.com/knicks",  statsUrl: "https://www.nba.com/stats/team/1610612752" },
  BKN: { url: "https://www.nba.com/nets",    statsUrl: "https://www.nba.com/stats/team/1610612751" },
};

// ─── Static driver data ───────────────────────────────────────────────────────
const FEATURED_DRIVERS = [
  { name: "Dale Earnhardt Jr.", car: "88", team: "JR Motorsports",           era: "modern", wins: 26,  champs: 0, note: "15× Most Popular Driver", url: "https://www.nascar.com/dale-earnhardt-jr/",  statsUrl: "https://www.espn.com/racing/driver/_/id/1027/dale-earnhardt-jr" },
  { name: "Denny Hamlin",       car: "11", team: "Joe Gibbs Racing",         era: "modern", wins: null, champs: 0, note: "3× Daytona 500 winner",   url: "https://www.nascar.com/denny-hamlin/",       statsUrl: "https://www.espn.com/racing/driver/_/id/1025/denny-hamlin" },
  { name: "Dale Earnhardt Sr.", car: "3",  team: "Richard Childress Racing",  era: "legend", wins: 76,  champs: 7, note: "The Intimidator",           url: "https://www.nascar.com/dale-earnhardt/",    statsUrl: "https://www.espn.com/racing/driver/_/id/1004/dale-earnhardt" },
  { name: "Richard Petty",      car: "43", team: "Petty Enterprises",         era: "legend", wins: 200, champs: 7, note: "The King",                  url: "https://www.nascar.com/richard-petty/",    statsUrl: "https://www.espn.com/racing/driver/_/id/1002/richard-petty" },
  { name: "Jeff Gordon",        car: "24", team: "Hendrick Motorsports",      era: "legend", wins: 93,  champs: 4, note: "Rainbow Warrior",           url: "https://www.nascar.com/jeff-gordon/",      statsUrl: "https://www.espn.com/racing/driver/_/id/1007/jeff-gordon" },
];

// ─── "On This Day" curated lore ───────────────────────────────────────────────
const NASCAR_LORE = [
  { year: 1959, text: "The very first Daytona 500 was held. Lee Petty — Richard's father — won in a photo finish on the brand-new 2.5-mile superspeedway.", subject: "History" },
  { year: 1979, text: "CBS broadcast the first flag-to-flag live TV coverage of a 500-mile race. A post-race brawl between Donnie Allison and Cale Yarborough made it unforgettable.", subject: "History" },
  { year: 1984, text: "Richard Petty won his 200th — and final — career race at the Firecracker 400 at Daytona, with President Reagan watching from the infield.", subject: "Richard Petty" },
  { year: 1987, text: "Dale Earnhardt Sr.'s famous 'pass in the grass' at Charlotte secured a win that cemented his reputation as the sport's most fearless competitor.", subject: "Dale Earnhardt Sr." },
  { year: 1994, text: "Dale Earnhardt Sr. claimed his 7th Cup Series title at Atlanta Motor Speedway, equaling Richard Petty's record and silencing every doubter in the garage.", subject: "Dale Earnhardt Sr." },
  { year: 1995, text: "Jeff Gordon won his first NASCAR Cup Series championship at just 24 years old, beginning one of the most dominant runs in the sport's modern era.", subject: "Jeff Gordon" },
  { year: 1998, text: "Dale Earnhardt Sr. won the Daytona 500 on his 20th attempt. The entire field of pit crews came out to congratulate him — one of the sport's most emotional moments.", subject: "Dale Earnhardt Sr." },
  { year: 2001, text: "Dale Jr. returned to race at Daytona for the Pepsi 400 — the same track where his father was lost — and won. The crowd reaction remains one of NASCAR's most powerful scenes.", subject: "Dale Earnhardt Jr." },
  { year: 2005, text: "Jeff Gordon won his 3rd Daytona 500, further establishing the Great American Race as his personal showcase.", subject: "Jeff Gordon" },
  { year: 2014, text: "Dale Earnhardt Jr. won the Daytona 500 for the second time, 10 years after his first, driving the #88 for Hendrick Motorsports.", subject: "Dale Earnhardt Jr." },
  { year: 2016, text: "Denny Hamlin edged Martin Truex Jr. by 0.010 seconds at the Daytona 500 — the closest finish in the race's history.", subject: "Denny Hamlin" },
  { year: 2017, text: "Dale Earnhardt Jr. was named NASCAR's Most Popular Driver for the 15th consecutive year, a record that still stands.", subject: "Dale Earnhardt Jr." },
  { year: 2019, text: "Denny Hamlin won his second Daytona 500, joining an elite group of multiple winners at NASCAR's most prestigious event.", subject: "Denny Hamlin" },
  { year: 2020, text: "Denny Hamlin won his third Daytona 500 in five years, becoming only the third driver in history to win the race three or more times.", subject: "Denny Hamlin" },
];

const NBA_LORE = [
  { year: 1946, text: "The Basketball Association of America — forerunner to the NBA — was founded with 11 teams. New York has been at the heart of professional basketball ever since.", subject: "History" },
  { year: 1968, text: "The current Madison Square Garden opened its doors on 7th Avenue in Midtown Manhattan, becoming the permanent home of the Knicks and one of sport's most iconic arenas.", subject: "New York Knicks" },
  { year: 1970, text: "Willis Reed limped onto the MSG court in Game 7 of the NBA Finals despite a torn thigh muscle. His presence electrified the building and the Knicks won their first championship.", subject: "New York Knicks" },
  { year: 1973, text: "Walt 'Clyde' Frazier put up 36 points and 19 assists in the championship-clinching game, leading the Knicks to their second — and most recent — NBA title.", subject: "New York Knicks" },
  { year: 1976, text: "The ABA-NBA merger brought four ABA teams into the league, including the New York Nets, who had won two ABA championships.", subject: "Brooklyn Nets" },
  { year: 1985, text: "Patrick Ewing was selected 1st overall by the Knicks in the first ever NBA Draft Lottery — a pick that defined the franchise for the next 15 years.", subject: "New York Knicks" },
  { year: 1994, text: "Patrick Ewing led the Knicks to the NBA Finals for the first time since 1973. New York fell to the Houston Rockets in 7 games in one of the decade's most dramatic series.", subject: "New York Knicks" },
  { year: 2002, text: "The New Jersey Nets reached the NBA Finals for the first time, led by Jason Kidd's triple-double brilliance. They'd return to the Finals the following year.", subject: "Brooklyn Nets" },
  { year: 2012, text: "The Brooklyn Nets moved from New Jersey to the newly built Barclays Center, making Brooklyn a major-league sports borough for the first time in 55 years.", subject: "Brooklyn Nets" },
  { year: 2013, text: "The Nets acquired Paul Pierce, Kevin Garnett, and Jason Terry from Boston in one of the most blockbuster trades in NBA history, swinging for an immediate championship.", subject: "Brooklyn Nets" },
  { year: 2021, text: "The Knicks ended a seven-year playoff drought, returning to the postseason with a young, hard-nosed roster that reignited Madison Square Garden.", subject: "New York Knicks" },
  { year: 2023, text: "Jalen Brunson's emergence as an elite point guard gave the Knicks their most credible shot at contention in a generation, pushing deep into the playoffs.", subject: "New York Knicks" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Recursively collect all team entries from any standings group shape.
// ESPN sometimes nests entries under conference → division → entries, so
// checking only the top level misses teams.
function flattenEntries(node) {
  if (!node) return [];
  const direct = node.standings?.entries ?? [];
  if (direct.length) return direct;
  return (node.children ?? []).flatMap(flattenEntries);
}

// Same idea but also accumulates from all levels (needed when divisions share the conference)
function flattenAllEntries(node) {
  if (!node) return [];
  const direct = node.standings?.entries ?? [];
  const nested = (node.children ?? []).flatMap(flattenAllEntries);
  return [...direct, ...nested];
}

function fmtTime(d) {
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtShortDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return null; }
}

function fmtLongDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  } catch { return null; }
}

function getFlagState(competition) {
  const desc  = (competition?.status?.type?.description || competition?.status?.type?.name || "").toLowerCase();
  const state = competition?.status?.type?.state;
  if (desc.includes("checkered") || desc.includes("final")) return "checkered";
  if (desc.includes("yellow") || desc.includes("caution"))  return "yellow";
  if (desc.includes("red flag") || desc.includes("red-flag")) return "red";
  if (state === "in") return "green";
  return null;
}

function getStat(stats, ...names) {
  if (!Array.isArray(stats)) return "—";
  for (const name of names) {
    const s = stats.find(s =>
      s.name === name || s.abbreviation === name ||
      s.shortDisplayName === name || s.displayName === name
    );
    if (s != null) return s.displayValue ?? String(s.value ?? "—");
  }
  return "—";
}

function calcCountdown(iso) {
  const diff = new Date(iso) - Date.now();
  if (!iso || diff <= 0) return null;
  const days  = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins  = Math.floor((diff % 3_600_000) / 60_000);
  const secs  = Math.floor((diff % 60_000) / 1_000);
  return { days, hours, mins, secs };
}

// Rotate through an array using day-of-year so it changes daily but is stable within a day
function dailyPick(arr) {
  if (!arr?.length) return null;
  const d   = new Date();
  const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86_400_000);
  return arr[doy % arr.length];
}

function pickRandom(arr, n) {
  if (!arr?.length) return [];
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, n);
}

// ─── CountdownTimer ───────────────────────────────────────────────────────────

function CountdownTimer({ targetIso, label }) {
  const [cd, setCd] = useState(() => calcCountdown(targetIso));

  useEffect(() => {
    const id = setInterval(() => setCd(calcCountdown(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!cd) return null;

  const pads = (n) => String(n).padStart(2, "0");

  return (
    <div className="countdown-card">
      <p className="card-eye">{label}</p>
      <div className="countdown-dials">
        <div className="dial"><span className="dial-n">{cd.days}</span><span className="dial-l">Days</span></div>
        <span className="dial-sep">:</span>
        <div className="dial"><span className="dial-n">{pads(cd.hours)}</span><span className="dial-l">Hrs</span></div>
        <span className="dial-sep">:</span>
        <div className="dial"><span className="dial-n">{pads(cd.mins)}</span><span className="dial-l">Min</span></div>
        <span className="dial-sep">:</span>
        <div className="dial"><span className="dial-n">{pads(cd.secs)}</span><span className="dial-l">Sec</span></div>
      </div>
    </div>
  );
}

// ─── FlagBadge ────────────────────────────────────────────────────────────────

function FlagBadge({ state }) {
  if (!state) return null;
  const labels = { green: "Green Flag", yellow: "Caution", red: "Red Flag", checkered: "Checkered" };
  return (
    <span className={`flag-badge flag-${state}`}>
      {state === "checkered" ? "🏁" : "⬤"} {labels[state]}
    </span>
  );
}

// ─── ScheduleStrip ────────────────────────────────────────────────────────────

function ScheduleStrip({ events, label, max = 3 }) {
  const upcoming = (events || [])
    .filter(ev => ev?.status?.type?.state === "pre" || ev?.competitions?.[0]?.status?.type?.state === "pre")
    .slice(0, max);

  if (!upcoming.length) return null;

  return (
    <div className="schedule-strip">
      <p className="nb-eye">{label}</p>
      {upcoming.map((ev, i) => {
        const venue   = ev.competitions?.[0]?.venue?.shortName || ev.competitions?.[0]?.venue?.fullName;
        const network = ev.competitions?.[0]?.broadcasts?.[0]?.names?.[0];
        const date    = fmtShortDate(ev.date);
        const name    = ev.shortName || ev.name;
        return (
          <div key={i} className="sched-item">
            {date && <span className="sched-date">{date}</span>}
            <span className="sched-name">{name}</span>
            {venue && <span className="sched-venue">{venue}</span>}
            {network && <span className="sched-net">{network}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── LastRaceCard ─────────────────────────────────────────────────────────────

function LastRaceCard({ event }) {
  if (!event) return null;
  const comp      = event.competitions?.[0];
  const winner    = [...(comp?.competitors || [])].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))[0];
  const winName   = winner?.athlete?.displayName || winner?.athlete?.shortName;
  const winCar    = winner?.vehicle?.number || winner?.car?.number;
  const venue     = comp?.venue?.shortName || comp?.venue?.fullName;

  return (
    <div className="last-result-card">
      <p className="card-eye">Last Race</p>
      <div className="last-result-name">{event.name || event.shortName}</div>
      {venue && <div className="last-result-sub">{venue}</div>}
      {winName && (
        <div className="last-result-winner">
          <span className="lrw-label">Winner</span>
          <span className="lrw-name">{winName}{winCar ? ` · #${winCar}` : ""}</span>
        </div>
      )}
    </div>
  );
}

// ─── LastGameCard ─────────────────────────────────────────────────────────────

function LastGameCard({ event }) {
  if (!event) return null;
  const comp = event.competitions?.[0];
  const home = comp?.competitors?.find(c => c.homeAway === "home");
  const away = comp?.competitors?.find(c => c.homeAway === "away");
  const nyHome = NY_TEAMS.includes(home?.team?.abbreviation);
  const nyAway = NY_TEAMS.includes(away?.team?.abbreviation);

  return (
    <div className="last-result-card">
      <p className="card-eye">Last Game</p>
      <div className="last-game-row">
        <span className={nyAway ? "lrg-ny" : ""}>{away?.team?.abbreviation}</span>
        <span className="lrg-score">{away?.score ?? "—"}</span>
        <span className="lrg-sep">·</span>
        <span className={nyHome ? "lrg-ny" : ""}>{home?.team?.abbreviation}</span>
        <span className="lrg-score">{home?.score ?? "—"}</span>
        <span className="lrg-label">Final</span>
      </div>
    </div>
  );
}

// ─── NascarStandingsTable ─────────────────────────────────────────────────────

function NascarStandingsTable({ data }) {
  const entries = data?.children?.[0]?.standings?.entries
    ?? data?.standings?.entries
    ?? data?.entries
    ?? [];

  if (!entries.length) return null;

  const top10 = entries.slice(0, 10);

  return (
    <div className="standings-section">
      <p className="nb-eye">Season Points Standings</p>
      <div className="standings-table">
        <div className="st-header">
          <span></span><span>Driver</span>
          <span style={{textAlign:"right"}}>Car</span>
          <span style={{textAlign:"right"}} className="hide-xs">Wins</span>
          <span style={{textAlign:"right"}}>Pts</span>
        </div>
        {top10.map((entry, i) => {
          const name = entry.athlete?.displayName || entry.athlete?.shortName || `P${i+1}`;
          const car  = entry.vehicle?.number || entry.car?.number || "—";
          const pts  = getStat(entry.stats, "points", "pts", "PTS", "totalPoints");
          const wins = getStat(entry.stats, "wins", "W");
          const isFav = FEATURED_DRIVERS.some(d => d.name === name || d.car === car);
          return (
            <div key={i} className={`st-row${isFav ? " st-row-ny" : ""}`}>
              <span className="st-pos">{i + 1}</span>
              <span className={`st-team${isFav ? " st-team-ny" : ""}`}>{name}</span>
              <span className="st-stat">#{car}</span>
              <span className="st-stat hide-xs">{wins}</span>
              <span className="st-stat">{pts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TeamRecordStrip ──────────────────────────────────────────────────────────

function TeamRecordStrip({ entries }) {
  const nyEntries = (entries || []).filter(e => NY_TEAMS.includes(e.team?.abbreviation));
  if (!nyEntries.length) return null;

  return (
    <div className="team-record-strip">
      <p className="nb-eye">New York Records</p>
      <div className="rec-cards">
        {nyEntries.map((entry, i) => {
          const abbr    = entry.team?.abbreviation;
          const name    = entry.team?.shortDisplayName || entry.team?.displayName || abbr;
          const wins    = getStat(entry.stats, "wins", "W", "OW");
          const losses  = getStat(entry.stats, "losses", "L", "OL");
          const streak  = getStat(entry.stats, "streak", "strk", "currentStreak");
          const home    = getStat(entry.stats, "homeRecord", "Home");
          const road    = getStat(entry.stats, "roadRecord", "Away");
          const teamUrl = NY_TEAM_INFO[abbr]?.url;
          return (
            <a key={i} className={`rec-card rec-link rec-${abbr.toLowerCase()}`} href={teamUrl} target="_blank" rel="noopener noreferrer">
              <div className="rec-header">
                <span className="rec-abbr">{abbr}</span>
                <span className="rec-name">{name}</span>
                <span className="rec-link-arrow">↗</span>
              </div>
              <div className="rec-stats">
                <div className="rec-stat"><span className="rec-val">{wins}–{losses}</span><span className="rec-lbl">Record</span></div>
                {streak !== "—" && <div className="rec-stat"><span className="rec-val">{streak}</span><span className="rec-lbl">Streak</span></div>}
                {home !== "—" && <div className="rec-stat"><span className="rec-val">{home}</span><span className="rec-lbl">Home</span></div>}
                {road !== "—" && <div className="rec-stat"><span className="rec-val">{road}</span><span className="rec-lbl">Away</span></div>}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── PlayoffPicture ───────────────────────────────────────────────────────────

function PlayoffPicture({ entries, conference }) {
  if (!entries?.length) return null;
  const inPlayoffs  = entries.filter(e => {
    const seed = getStat(e.stats, "playoffSeed", "seed");
    return seed !== "—" && Number(seed) <= 10;
  });
  if (inPlayoffs.length < 4) return null;

  return (
    <div className="playoff-section">
      <p className="nb-eye">Playoff Picture · {conference}</p>
      <div className="playoff-grid">
        {inPlayoffs.slice(0, 10).map((entry, i) => {
          const abbr  = entry.team?.abbreviation;
          const name  = entry.team?.shortDisplayName || abbr;
          const wins  = getStat(entry.stats, "wins", "W");
          const losses = getStat(entry.stats, "losses", "L");
          const isNY  = NY_TEAMS.includes(abbr);
          const isIn  = i < 6;
          return (
            <div key={i} className={`playoff-row${isNY ? " playoff-ny" : ""}${isIn ? "" : " playoff-bubble"}`}>
              <span className="po-seed">{i + 1}</span>
              <span className={`po-team${isNY ? " po-ny" : ""}`}>{name}</span>
              <span className="po-rec">{wins}–{losses}</span>
              {!isIn && <span className="po-bubble">Bubble</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── OnThisDay ────────────────────────────────────────────────────────────────

function OnThisDay({ worldEvents }) {
  const nascarFact = dailyPick(NASCAR_LORE);
  const nbaFact    = dailyPick(NBA_LORE);

  const today = new Date();
  const label = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const worldPicks = pickRandom(worldEvents || [], 3);

  return (
    <section className="otd-section">
      <div className="otd-header">
        <p className="nb-eye">On This Day · {label}</p>
        <h3 className="otd-title">History Worth Knowing</h3>
      </div>
      <div className="otd-grid">

        {nascarFact && (
          <div className="otd-card otd-nascar">
            <span className="otd-sport-tag">NASCAR</span>
            <span className="otd-year">{nascarFact.year}</span>
            <p className="otd-text">{nascarFact.text}</p>
            <span className="otd-subject">{nascarFact.subject}</span>
          </div>
        )}

        {nbaFact && (
          <div className="otd-card otd-nba">
            <span className="otd-sport-tag">NBA</span>
            <span className="otd-year">{nbaFact.year}</span>
            <p className="otd-text">{nbaFact.text}</p>
            <span className="otd-subject">{nbaFact.subject}</span>
          </div>
        )}

        {worldPicks.length > 0 ? worldPicks.map((ev, i) => (
          <div key={i} className="otd-card otd-world">
            <span className="otd-sport-tag">World</span>
            <span className="otd-year">{ev.year}</span>
            <p className="otd-text">{ev.text}</p>
          </div>
        )) : (
          <div className="otd-card otd-world otd-world-empty">
            <span className="otd-sport-tag">World</span>
            <p className="otd-text otd-muted">World history loading…</p>
          </div>
        )}

      </div>
    </section>
  );
}

// ─── NascarLeaderBoard ────────────────────────────────────────────────────────

function NascarLeaderBoard({ standings, lastEvent }) {
  const entries = standings?.children?.[0]?.standings?.entries
    ?? standings?.standings?.entries
    ?? standings?.entries
    ?? [];

  const winLeaders = [...entries]
    .map(e => ({
      name: e.athlete?.displayName || e.athlete?.shortName || "—",
      car:  e.vehicle?.number || e.car?.number || "—",
      wins: Number(getStat(e.stats, "wins", "W") || 0),
      top5: getStat(e.stats, "top5", "Top5", "T5", "top5Finishes"),
      pts:  getStat(e.stats, "points", "pts", "PTS"),
    }))
    .filter(e => e.wins > 0)
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 5);

  const comp   = lastEvent?.competitions?.[0];
  const sorted = [...(comp?.competitors ?? [])].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const top10  = sorted.slice(0, 10);

  if (!winLeaders.length && !top10.length) return null;

  return (
    <div className="league-board">
      <p className="nb-eye">League Board</p>

      {top10.length > 0 && (
        <div className="lb-section">
          <p className="lb-section-label">Last Race · Full Results</p>
          <div className="standings-table" style={{marginTop:"var(--s-2)"}}>
            <div className="lb-header"><span>POS</span><span>CAR</span><span>DRIVER</span></div>
            {top10.map((c, i) => {
              const name  = c.athlete?.displayName ?? c.athlete?.shortName ?? `P${i+1}`;
              const car   = c.vehicle?.number ?? c.car?.number ?? "—";
              const isFav = FEATURED_DRIVERS.some(d => d.car === car);
              return (
                <div key={i} className={`lb-row${i === 0 ? " lb-leader" : ""}${isFav ? " lb-fav" : ""}`}>
                  <span className="lb-pos">{c.order ?? i+1}</span>
                  <span className="lb-car">#{car}</span>
                  <span className="lb-name">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {winLeaders.length > 0 && (
        <div className="lb-section">
          <p className="lb-section-label">Season Win Leaders</p>
          <div className="leader-table">
            <div className="leader-header">
              <span></span><span>Driver</span><span>Car</span>
              <span style={{textAlign:"right"}}>W</span>
              <span style={{textAlign:"right"}}>T5</span>
              <span style={{textAlign:"right"}}>Pts</span>
            </div>
            {winLeaders.map((e, i) => {
              const isFav = FEATURED_DRIVERS.some(d => d.car === e.car || d.name === e.name);
              return (
                <div key={i} className={`leader-row${isFav ? " leader-fav" : ""}`}>
                  <span className="leader-pos">{i+1}</span>
                  <span className="leader-name">{e.name}</span>
                  <span className="leader-stat">#{e.car}</span>
                  <span className="leader-stat">{e.wins}</span>
                  <span className="leader-stat">{e.top5}</span>
                  <span className="leader-stat">{e.pts}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NbaLeaderBoard ───────────────────────────────────────────────────────────

function NbaLeaderBoard({ leaders, lastNY }) {
  const statGroups = (leaders?.leaders ?? []).slice(0, 3);

  const comp   = lastNY?.competitions?.[0];
  const home   = comp?.competitors?.find(c => c.homeAway === "home");
  const away   = comp?.competitors?.find(c => c.homeAway === "away");
  const nyHome = NY_TEAMS.includes(home?.team?.abbreviation);
  const nyAway = NY_TEAMS.includes(away?.team?.abbreviation);

  if (!statGroups.length && !comp) return null;

  return (
    <div className="league-board">
      <p className="nb-eye">League Board</p>

      {comp && (
        <div className="lb-section">
          <p className="lb-section-label">Last NY Game · Final</p>
          <div className="last-game-board">
            <div className={`lgb-team${nyAway ? " lgb-ny" : ""}`}>
              <span className="lgb-abbr">{away?.team?.abbreviation ?? "—"}</span>
              <span className="lgb-score">{away?.score ?? "—"}</span>
              <span className="lgb-full">{away?.team?.shortDisplayName ?? ""}</span>
            </div>
            <span className="lgb-sep">Final</span>
            <div className={`lgb-team lgb-right${nyHome ? " lgb-ny" : ""}`}>
              <span className="lgb-abbr">{home?.team?.abbreviation ?? "—"}</span>
              <span className="lgb-score">{home?.score ?? "—"}</span>
              <span className="lgb-full">{home?.team?.shortDisplayName ?? ""}</span>
            </div>
          </div>
        </div>
      )}

      {statGroups.length > 0 && (
        <div className="lb-section">
          <p className="lb-section-label">Season Stat Leaders</p>
          <div className="stat-leaders-grid">
            {statGroups.map((group, gi) => (
              <div key={gi} className="stat-leader-group">
                <span className="slg-label">{group.abbreviation ?? group.name}</span>
                <div className="slg-entries">
                  {(group.leaders ?? []).slice(0, 3).map((leader, li) => (
                    <div key={li} className={`slg-row${li === 0 ? " slg-top" : ""}`}>
                      <span className="slg-name">{leader.athlete?.shortName ?? leader.athlete?.displayName ?? "—"}</span>
                      <span className="slg-val">{leader.displayValue ?? String(leader.value ?? "—")}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NewsStrip ────────────────────────────────────────────────────────────────

function NewsStrip({ articles, sport }) {
  if (!articles?.length) return null;

  return (
    <div className={`news-strip news-strip-${sport}`}>
      <p className="nb-eye">Latest Headlines</p>
      <div className="news-list">
        {articles.map((a, i) => {
          const pubDate = a.published ? fmtShortDate(a.published) : null;
          const href    = a.links?.web?.href || a.links?.mobile?.href || "#";
          return (
            <a key={i} className="news-item" href={href} target="_blank" rel="noopener noreferrer">
              <span className="news-headline">{a.headline || a.title}</span>
              <span className="news-foot">
                {pubDate && <span className="news-date">{pubDate}</span>}
                <span className="news-arrow">↗</span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── NascarPanel ─────────────────────────────────────────────────────────────

function NascarPanel({ scoreboard, standings, news, loading }) {
  const events     = scoreboard?.events ?? [];
  const liveEvent  = events.find(ev =>
    (ev.status?.type?.state ?? ev.competitions?.[0]?.status?.type?.state) === "in"
  );
  const lastEvent  = events.find(ev =>
    (ev.status?.type?.state ?? ev.competitions?.[0]?.status?.type?.state) === "post"
  );
  const nextEvent  = events.find(ev =>
    (ev.status?.type?.state ?? ev.competitions?.[0]?.status?.type?.state) === "pre"
  );

  const active      = liveEvent ?? lastEvent;
  const competition = active?.competitions?.[0];
  const status      = competition?.status ?? active?.status;
  const isLive      = status?.type?.state === "in";

  const lap   = status?.period;
  const lapOf = competition?.status?.numberOfPeriods;
  const lapLine = lap ? `${status?.periodPrefix ?? "Lap"} ${lap}${lapOf ? ` of ${lapOf}` : ""}` : null;

  const sorted = [...(competition?.competitors ?? [])].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const top10  = sorted.slice(0, 10);

  return (
    <div className="nb-panel nascar-panel">
      <div className="panel-background-pattern">
        <svg className="telemetry-grid" width="100%" height="100%">
          <defs>
            <pattern id="nascar-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nascar-grid)" />
        </svg>
      </div>
      <p className="panel-eye">NASCAR · Cup Series</p>
      <h2 className="panel-title">The Pit</h2>

      {loading && !scoreboard ? (
        <div className="panel-loading">Loading race data…</div>
      ) : isLive && active ? (
        /* ── LIVE RACE ── */
        <div className="race-live">
          <div className="race-name">{active.name ?? active.shortName ?? "Race in Progress"}</div>
          <FlagBadge state={getFlagState(competition)} />
          {lapLine && <div className="race-lap">{lapLine}</div>}
          {top10.length > 0 && (
            <div className="leaderboard">
              <div className="lb-header">
                <span>POS</span><span>CAR</span><span>DRIVER</span><span>GAP</span>
              </div>
              {top10.map((c, i) => {
                const name = c.athlete?.displayName ?? c.athlete?.shortName ?? `P${i+1}`;
                const car  = c.vehicle?.number ?? c.car?.number ?? "—";
                const gap  = i === 0 ? "Leader" : (c.gap ?? c.gapLaps ?? "—");
                return (
                  <div key={i} className={`lb-row${i === 0 ? " lb-leader" : ""}`}>
                    <span className="lb-pos">{c.order ?? i + 1}</span>
                    <span className="lb-car">#{car}</span>
                    <span className="lb-name">{name}</span>
                    <span className="lb-gap">{gap}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : (
        /* ── OFF-RACE ── */
        <div className="off-race">

          {/* Countdown to next race */}
          {nextEvent?.date && (
            <CountdownTimer
              targetIso={nextEvent.date}
              label={`Next Race · ${nextEvent.name ?? nextEvent.shortName ?? ""}`}
            />
          )}

          {/* Last race result */}
          {lastEvent && <LastRaceCard event={lastEvent} />}

          {/* Upcoming schedule */}
          <ScheduleStrip events={events} label="Upcoming Races" max={3} />

          {/* Season standings */}
          <NascarStandingsTable data={standings} />

          {/* League board — last race results + win leaders */}
          <NascarLeaderBoard standings={standings} lastEvent={lastEvent} />

          {/* Dad's driver cards */}
          <div className="drivers-section">
            <p className="nb-eye">Dad's Drivers</p>
            <div className="driver-cards">
              {FEATURED_DRIVERS.map((d) => (
                <a key={d.car} className={`driver-card driver-link driver-${d.era} driver-${d.car}`} href={d.statsUrl} target="_blank" rel="noopener noreferrer">
                  <span className="driver-car">#{d.car}</span>
                  <div className="driver-info">
                    <span className="driver-name">{d.name}</span>
                    <span className="driver-team">{d.team}</span>
                    <span className="driver-note">
                      {d.wins != null ? `${d.wins} wins` : d.note}
                      {d.champs > 0 ? ` · ${d.champs}× champ` : ""}
                    </span>
                  </div>
                  {d.era === "legend" ? <span className="driver-era-badge">Legend</span> : <span className="driver-link-arrow">↗</span>}
                </a>
              ))}
            </div>
          </div>

          {/* NASCAR news */}
          <NewsStrip articles={news} sport="nascar" />

        </div>
      )}
    </div>
  );
}

// ─── BasketballPanel ──────────────────────────────────────────────────────────

function BasketballPanel({ scores, standings, leaders, news, loading }) {
  const allEvents = scores?.events ?? [];

  const nyGames   = allEvents.filter(ev =>
    ev.competitions?.[0]?.competitors?.some(c => NY_TEAMS.includes(c.team?.abbreviation))
  );
  const liveNY    = nyGames.filter(ev => ev.competitions?.[0]?.status?.type?.state === "in");
  const lastNY    = nyGames.find(ev  => ev.competitions?.[0]?.status?.type?.state === "post");
  const nextNY    = nyGames.find(ev  => ev.competitions?.[0]?.status?.type?.state === "pre");

  const eastGroup  = standings?.children?.find(g =>
    (g.name ?? g.abbreviation ?? "").toLowerCase().includes("east")
  ) ?? standings?.groups?.find(g =>
    (g.header ?? g.name ?? "").toLowerCase().includes("east")
  );
  // ESPN nests teams inside division children; flattenAllEntries collects from all levels
  const allEntries = flattenAllEntries(eastGroup);
  const nyEntries  = allEntries.filter(e => NY_TEAMS.includes(e.team?.abbreviation));

  function GameCard({ event }) {
    const comp    = event.competitions?.[0];
    const status  = comp?.status;
    const isLive  = status?.type?.state === "in";
    const isFinal = status?.type?.state === "post";
    const home    = comp?.competitors?.find(c => c.homeAway === "home");
    const away    = comp?.competitors?.find(c => c.homeAway === "away");
    const nyHome  = NY_TEAMS.includes(home?.team?.abbreviation);
    const nyAway  = NY_TEAMS.includes(away?.team?.abbreviation);
    const period  = status?.period;
    const clock   = status?.displayClock;
    const mid     = isFinal ? "Final" : isLive ? `Q${period ?? "?"}${clock ? ` · ${clock}` : ""}` : "vs";

    return (
      <div className={`score-card${isLive ? " score-live" : ""}`}>
        {isLive  && <span className="live-pill">● Live</span>}
        {isFinal && <span className="final-pill">Final</span>}
        <div className="score-matchup">
          <div className={`score-team${nyAway ? " score-ny" : ""}`}>
            <span className="team-abbr">{away?.team?.abbreviation ?? "—"}</span>
            <span className="team-score">{away?.score ?? "—"}</span>
          </div>
          <div className="score-divider">{mid}</div>
          <div className={`score-team score-team-right${nyHome ? " score-ny" : ""}`}>
            <span className="team-abbr">{home?.team?.abbreviation ?? "—"}</span>
            <span className="team-score">{home?.score ?? "—"}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nb-panel hoops-panel">
      <div className="panel-background-pattern">
        <svg className="court-lines" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0 50 L 100 50 M 50 0 L 50 100 M 50 50 C 35 50, 35 65, 50 65 C 65 65, 65 50, 50 50" fill="none" stroke="currentColor" strokeWidth="0.2"/>
          <path d="M 0 20 L 20 20 L 20 80 L 0 80" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <path d="M 100 20 L 80 20 L 80 80 L 100 80" fill="none" stroke="currentColor" strokeWidth="0.2" />
        </svg>
      </div>
      <p className="panel-eye">NBA · Basketball</p>
      <h2 className="panel-title">The Paint</h2>

      {loading && !scores ? (
        <div className="panel-loading">Loading game data…</div>
      ) : (
        <>
          {/* Team records always visible at top */}
          <TeamRecordStrip entries={nyEntries.length ? nyEntries : allEntries.filter(e => NY_TEAMS.includes(e.team?.abbreviation))} />

          {/* Live NY games */}
          {liveNY.length > 0 && (
            <div className="ny-games">
              <p className="nb-eye">Live Now · New York</p>
              {liveNY.map((ev, i) => <GameCard key={i} event={ev} />)}
            </div>
          )}

          {/* Countdown to next NY game */}
          {!liveNY.length && nextNY?.date && (
            <CountdownTimer
              targetIso={nextNY.date}
              label={`Next · ${nextNY.competitions?.[0]?.competitors?.find(c => !NY_TEAMS.includes(c.team?.abbreviation))?.team?.shortDisplayName ?? "NY game"}`}
            />
          )}

          {/* Last NY game result */}
          {!liveNY.length && lastNY && <LastGameCard event={lastNY} />}

          {/* Completed NY games (post) */}
          {nyGames.filter(ev => ev.competitions?.[0]?.status?.type?.state === "post" && ev !== lastNY).slice(0,2).map((ev, i) =>
            <GameCard key={i} event={ev} />
          )}

          {/* All today's games if no NY action */}
          {nyGames.length === 0 && allEvents.length > 0 && (
            <div className="all-games">
              <p className="nb-eye">Today's Scoreboard</p>
              {allEvents.slice(0, 8).map((ev, i) => {
                const comp   = ev.competitions?.[0];
                const status = comp?.status;
                const isLive = status?.type?.state === "in";
                const home   = comp?.competitors?.find(c => c.homeAway === "home");
                const away   = comp?.competitors?.find(c => c.homeAway === "away");
                const nyInGame = NY_TEAMS.includes(home?.team?.abbreviation) || NY_TEAMS.includes(away?.team?.abbreviation);
                return (
                  <div key={i} className={`score-card-sm${nyInGame ? " score-ny-game" : ""}`}>
                    <span className="live-dot">{isLive ? "●" : " "}</span>
                    <span className={`team-sm${NY_TEAMS.includes(away?.team?.abbreviation) ? " team-sm-ny" : ""}`}>{away?.team?.abbreviation ?? "—"}</span>
                    <span className="score-sm">{away?.score ?? "—"}</span>
                    <span className="sep-sm">·</span>
                    <span className={`team-sm${NY_TEAMS.includes(home?.team?.abbreviation) ? " team-sm-ny" : ""}`}>{home?.team?.abbreviation ?? "—"}</span>
                    <span className="score-sm">{home?.score ?? "—"}</span>
                    {isLive && status?.period && <span className="clock-sm">Q{status.period}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming NY schedule */}
          {!liveNY.length && (
            <ScheduleStrip
              events={nyGames.length ? nyGames : allEvents.filter(ev =>
                ev.competitions?.[0]?.competitors?.some(c => NY_TEAMS.includes(c.team?.abbreviation))
              )}
              label="Upcoming NY Games"
              max={3}
            />
          )}

          {/* Playoff picture */}
          <PlayoffPicture entries={allEntries} conference="East" />

          {/* Eastern standings */}
          {allEntries.length > 0 && (
            <div className="standings-section">
              <p className="nb-eye">Eastern Conference</p>
              <div className="standings-table">
                <div className="st-header">
                  <span></span><span>Team</span>
                  <span style={{textAlign:"right"}}>W</span>
                  <span style={{textAlign:"right"}}>L</span>
                  <span style={{textAlign:"right"}}>PCT</span>
                </div>
                {allEntries.slice(0, 8).map((entry, i) => {
                  const abbr  = entry.team?.abbreviation;
                  const isNY  = NY_TEAMS.includes(abbr);
                  const wins  = getStat(entry.stats, "wins", "W", "OW");
                  const losses = getStat(entry.stats, "losses", "L", "OL");
                  const pct   = getStat(entry.stats, "winPercent", "PCT", "WP");
                  return (
                    <div key={i} className={`st-row${isNY ? " st-row-ny" : ""}`}>
                      <span className="st-pos">{i + 1}</span>
                      <span className={`st-team${isNY ? " st-team-ny" : ""}`}>
                        {entry.team?.shortDisplayName ?? entry.team?.displayName ?? abbr}
                      </span>
                      <span className="st-stat">{wins}</span>
                      <span className="st-stat">{losses}</span>
                      <span className="st-stat">{pct}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {nyGames.length === 0 && allEvents.length === 0 && allEntries.length === 0 && (
            <div className="no-data">
              <span className="no-data-text">No games today.</span>
              <span className="no-data-sub">Check back on game day.</span>
            </div>
          )}

          {/* League board — last NY game + stat leaders */}
          <NbaLeaderBoard leaders={leaders} lastNY={lastNY} />

          {/* NBA news */}
          <NewsStrip articles={news} sport="nba" />
        </>
      )}
    </div>
  );
}

// ─── CommentWall ─────────────────────────────────────────────────────────────

function CommentWall() {
  const [comments,   setComments]   = useState([]);
  const [title,      setTitle]      = useState("");
  const [body,       setBody]       = useState("");
  const [author,     setAuthor]     = useState("");
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [loadErr,    setLoadErr]    = useState(false);

  async function loadComments() {
    if (!sb) return;
    const { data, error } = await sb
      .from("comments")
      .select("id, title, body, author, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) setComments(data);
    else setLoadErr(true);
  }

  useEffect(() => { loadComments(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    const { error } = await sb.from("comments").insert({
      title:  title.trim(),
      body:   body.trim(),
      author: author.trim() || "Anonymous",
    });
    if (!error) {
      setSent(true);
      setTitle(""); setBody(""); setAuthor("");
      setTimeout(() => setSent(false), 3000);
      loadComments();
    }
    setSending(false);
  }

  function fmtRelative(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso);
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <section className="comment-wall">
      <div className="cw-header">
        <p className="nb-eye">Family Notes</p>
        <h3 className="cw-title">Leave a Note</h3>
        <p className="cw-sub">Check in from any device — dad, JR, anyone with the link.</p>
      </div>

      {!COMMENTS_ON ? (
        <div className="cw-unconfigured">
          <p>Comment wall coming soon — see setup instructions in <code>nascar-basketball.jsx</code>.</p>
        </div>
      ) : (
        <div className="cw-body">
          <form className="cw-form" onSubmit={handleSubmit}>
            <input
              className="cw-input"
              placeholder="Your name (optional)"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              maxLength={40}
            />
            <input
              className="cw-input"
              placeholder="Title *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={80}
              required
            />
            <textarea
              className="cw-textarea"
              placeholder="What's on your mind? *"
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={400}
              rows={3}
              required
            />
            <button className="cw-submit" type="submit" disabled={sending || !title.trim() || !body.trim()}>
              {sent ? "Note saved ✓" : sending ? "Saving…" : "Leave Note →"}
            </button>
          </form>

          <div className="cw-feed">
            {loadErr && <p className="cw-error">Could not load notes — check back shortly.</p>}
            {!loadErr && comments.length === 0 && (
              <p className="cw-empty">No notes yet — be the first to leave one.</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="cw-card">
                <div className="cwc-head">
                  <span className="cwc-title">{c.title}</span>
                  <span className="cwc-time">{fmtRelative(c.created_at)}</span>
                </div>
                <p className="cwc-body">{c.body}</p>
                <span className="cwc-author">— {c.author || "Anonymous"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [t, setTweak]           = useTweaks(TWEAK_DEFAULTS);
  const [nascarBoard, setNascarBoard]   = useState(null);
  const [nascarPts, setNascarPts]       = useState(null);
  const [nascarNews, setNascarNews]     = useState([]);
  const [nbaScores, setNbaScores]       = useState(null);
  const [nbaStandings, setNbaStandings] = useState(null);
  const [nbaNews, setNbaNews]           = useState([]);
  const [nbaLeaders, setNbaLeaders]     = useState(null);
  const [worldEvents, setWorldEvents]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [fetchError, setFetchError]     = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme ?? "dark");
    document.documentElement.setAttribute("data-style-preset", t.stylePreset ?? "telemetry");
  }, [t.theme, t.stylePreset]);

  async function fetchAll() {
    const [nascar, nascarStand, nascarNewsRes, nba, nbaStand, nbaNewsRes, nbaLeadRes, wiki] = await Promise.allSettled([
      fetch(NASCAR_SCOREBOARD).then(r  => r.ok ? r.json() : Promise.reject()),
      fetch(NASCAR_STANDINGS).then(r   => r.ok ? r.json() : Promise.reject()),
      fetch(NASCAR_NEWS).then(r        => r.ok ? r.json() : Promise.reject()),
      fetch(NBA_SCOREBOARD).then(r     => r.ok ? r.json() : Promise.reject()),
      fetch(NBA_STANDINGS).then(r      => r.ok ? r.json() : Promise.reject()),
      fetch(NBA_NEWS).then(r           => r.ok ? r.json() : Promise.reject()),
      fetch(NBA_LEADERS_URL).then(r    => r.ok ? r.json() : Promise.reject()),
      fetch(wikipediaOTD()).then(r      => r.ok ? r.json() : Promise.reject()),
    ]);

    if (nascar.status       === "fulfilled") setNascarBoard(nascar.value);
    if (nascarStand.status  === "fulfilled") setNascarPts(nascarStand.value);
    if (nascarNewsRes.status === "fulfilled") setNascarNews(nascarNewsRes.value?.articles ?? []);
    if (nba.status          === "fulfilled") setNbaScores(nba.value);
    if (nbaStand.status     === "fulfilled") setNbaStandings(nbaStand.value);
    if (nbaNewsRes.status   === "fulfilled") setNbaNews(nbaNewsRes.value?.articles ?? []);
    if (nbaLeadRes.status   === "fulfilled") setNbaLeaders(nbaLeadRes.value);
    if (wiki.status        === "fulfilled") {
      const evs = wiki.value?.events ?? [];
      setWorldEvents(evs.map(e => ({ year: e.year, text: e.text })));
    }

    const anyOk = [nascar, nba].some(r => r.status === "fulfilled");
    if (!anyOk) setFetchError("Unable to reach data sources — will retry.");
    else setFetchError(null);

    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="nb-page">
      <header className="nb-header">
        <a href="../index.html" className="nb-back">← Shade of Design</a>
        <div className="nb-header-center">
          <div className="nb-title">The Pit Stop &amp; The Paint</div>
          <div className="nb-subtitle">NASCAR · NBA · Unite Passion</div>
        </div>
        <div className="nb-header-right" />
      </header>

      <div className="nb-banner" aria-hidden="true">
        <div className="banner-nascar" />
        <div className="banner-divider" />
        <div className="banner-nba" />
      </div>

      <main className="nb-main">
        {fetchError && <div className="nb-error">{fetchError}</div>}

        <div className="nb-grid">
          <NascarPanel scoreboard={nascarBoard} standings={nascarPts} news={nascarNews} loading={loading} />
          <BasketballPanel scores={nbaScores} standings={nbaStandings} leaders={nbaLeaders} news={nbaNews} loading={loading} />
        </div>

        <OnThisDay worldEvents={worldEvents} />
        <CommentWall />
      </main>

      <footer className="nb-foot">
        <a href="../index.html" className="foot-link">← Back</a>
        <span className="nb-updated">
          {loading && !lastUpdated ? "Loading…" : `Updated ${fmtTime(lastUpdated)}`}
        </span>
        <span className="nb-credit">For dad &amp; for the love of the game</span>
      </footer>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Surface">
          <TweakRadio
            label="Theme"
            value={t.theme}
            onChange={(v) => setTweak("theme", v)}
            options={[
              { value: "light", label: "Light" },
              { value: "dark",  label: "Dark"  },
            ]}
          />
          <TweakRadio
            label="Preset"
            value={t.stylePreset}
            onChange={(v) => setTweak("stylePreset", v)}
            options={[
              { value: "telemetry", label: "Telemetry" },
              { value: "glass",     label: "Glass"  },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
