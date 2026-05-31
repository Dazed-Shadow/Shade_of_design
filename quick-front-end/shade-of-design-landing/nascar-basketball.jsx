/* global React, ReactDOM */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{ "theme": "light" }/*EDITMODE-END*/;

const NASCAR_URL  = "https://site.api.espn.com/apis/site/v2/sports/racing/nascar/scoreboard";
const NBA_URL     = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings";

const REFRESH_MS = 60_000;

const NY_TEAMS = ["NYK", "BKN"];

const FEATURED_DRIVERS = [
  { name: "Dale Earnhardt Jr.", car: "88", team: "JR Motorsports",         era: "modern" },
  { name: "Denny Hamlin",       car: "11", team: "Joe Gibbs Racing",       era: "modern" },
  { name: "Dale Earnhardt Sr.", car: "3",  team: "Richard Childress Rcg.", era: "legend" },
  { name: "Richard Petty",      car: "43", team: "Petty Enterprises",       era: "legend" },
  { name: "Jeff Gordon",        car: "24", team: "Hendrick Motorsports",    era: "legend" },
];

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtTime(d) {
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtRaceDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });
  } catch { return null; }
}

function getFlagState(competition) {
  const desc = (
    competition?.status?.type?.description ||
    competition?.status?.type?.name ||
    ""
  ).toLowerCase();
  const state = competition?.status?.type?.state;
  if (desc.includes("checkered") || desc.includes("final")) return "checkered";
  if (desc.includes("yellow") || desc.includes("caution"))  return "yellow";
  if (desc.includes("red flag") || desc.includes("red-flag")) return "red";
  if (state === "in") return "green";
  return null;
}

function getStat(stats, ...names) {
  if (!Array.isArray(stats)) return null;
  for (const name of names) {
    const s = stats.find(s =>
      s.name === name || s.abbreviation === name ||
      s.shortDisplayName === name || s.displayName === name
    );
    if (s != null) return s.displayValue ?? String(s.value ?? "—");
  }
  return "—";
}

// ─── FlagBadge ───────────────────────────────────────────────────────────────

function FlagBadge({ state }) {
  if (!state) return null;
  const labels = {
    green: "Green Flag",
    yellow: "Caution",
    red: "Red Flag",
    checkered: "Checkered Flag",
  };
  return (
    <span className={`flag-badge flag-${state}`}>
      {state === "checkered" ? "🏁" : "⬤"} {labels[state]}
    </span>
  );
}

// ─── NascarPanel ─────────────────────────────────────────────────────────────

function NascarPanel({ data, loading }) {
  const event       = data?.events?.[0];
  const competition = event?.competitions?.[0];
  const status      = competition?.status ?? event?.status;
  const state       = status?.type?.state;
  const isActive    = state === "in" || state === "post";
  const competitors = competition?.competitors ?? [];
  const sorted      = [...competitors].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const top10       = sorted.slice(0, 10);

  const lap     = status?.period ?? competition?.status?.period;
  const lapOf   = competition?.status?.numberOfPeriods;
  const lapLine = lap ? `${status?.periodPrefix ?? "Lap"} ${lap}${lapOf ? ` of ${lapOf}` : ""}` : null;

  return (
    <div className="nb-panel nascar-panel">
      <p className="panel-eye">NASCAR · Cup Series</p>
      <h2 className="panel-title">The Pit</h2>

      {loading && !data ? (
        <div className="panel-loading">Loading race data…</div>
      ) : isActive && event ? (
        <div className="race-live">
          <div className="race-name">{event.name ?? event.shortName ?? "Race in Progress"}</div>
          <FlagBadge state={getFlagState(competition)} />
          {lapLine && <div className="race-lap">{lapLine}</div>}

          {top10.length > 0 ? (
            <div className="leaderboard">
              <div className="lb-header">
                <span>POS</span><span>CAR</span><span>DRIVER</span><span>GAP</span>
              </div>
              {top10.map((c, i) => {
                const name = c.athlete?.displayName ?? c.athlete?.shortName ?? `P${i + 1}`;
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
          ) : (
            <div className="no-data">
              <span className="no-data-text">Race data loading…</span>
            </div>
          )}
        </div>

      ) : (
        <div className="off-race">
          {event && (
            <div className="next-race-card">
              <p className="card-eye">Next Race</p>
              <div className="next-race-name">{event.name ?? event.shortName}</div>
              {event.date && <div className="next-race-date">{fmtRaceDate(event.date)}</div>}
              {event.competitions?.[0]?.venue?.fullName && (
                <div className="next-race-venue">
                  {event.competitions[0].venue.fullName}
                  {event.competitions[0].venue.address?.city
                    ? `, ${event.competitions[0].venue.address.city}` : ""}
                </div>
              )}
            </div>
          )}

          <div className="drivers-section">
            <p className="nb-eye">Dad's Drivers</p>
            <div className="driver-cards">
              {FEATURED_DRIVERS.map((d) => (
                <div key={d.car} className={`driver-card driver-${d.era}`}>
                  <span className="driver-car">#{d.car}</span>
                  <span className="driver-name">{d.name}</span>
                  <span className="driver-team">{d.team}</span>
                  {d.era === "legend" && (
                    <span className="driver-era-badge">Legend</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BasketballPanel ─────────────────────────────────────────────────────────

function BasketballPanel({ scores, standings, loading }) {
  const allEvents = scores?.events ?? [];

  // Games involving NY teams
  const nyGames = allEvents.filter(ev =>
    ev.competitions?.[0]?.competitors?.some(c => NY_TEAMS.includes(c.team?.abbreviation))
  );

  // Eastern Conference standings — try a few response shapes
  const eastGroup =
    standings?.children?.find(g =>
      (g.name ?? g.header ?? "").toLowerCase().includes("east")
    ) ??
    standings?.groups?.find(g =>
      (g.name ?? g.header ?? "").toLowerCase().includes("east")
    );
  const eastEntries = eastGroup?.standings?.entries ?? [];

  function GameCard({ event }) {
    const comp   = event.competitions?.[0];
    const status = comp?.status;
    const isLive = status?.type?.state === "in";
    const isFinal = status?.type?.state === "post";
    const home = comp?.competitors?.find(c => c.homeAway === "home");
    const away = comp?.competitors?.find(c => c.homeAway === "away");
    const nyHome = NY_TEAMS.includes(home?.team?.abbreviation);
    const nyAway = NY_TEAMS.includes(away?.team?.abbreviation);
    const period = status?.period;
    const clock  = status?.displayClock;
    const periodLabel = period
      ? (isFinal ? "Final" : `Q${period}${clock ? ` · ${clock}` : ""}`)
      : (isFinal ? "Final" : "vs");

    return (
      <div className={`score-card${isLive ? " score-live" : ""}`}>
        {isLive  && <span className="live-pill">● Live</span>}
        {isFinal && <span className="final-pill">Final</span>}
        <div className="score-matchup">
          <div className={`score-team${nyAway ? " score-ny" : ""}`}>
            <span className="team-abbr">{away?.team?.abbreviation ?? "—"}</span>
            <span className="team-score">{away?.score ?? "—"}</span>
          </div>
          <div className="score-divider">{periodLabel}</div>
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
      <p className="panel-eye">NBA · Basketball</p>
      <h2 className="panel-title">The Paint</h2>

      {loading && !scores ? (
        <div className="panel-loading">Loading game data…</div>
      ) : (
        <>
          {/* NY games — featured */}
          {nyGames.length > 0 && (
            <div className="ny-games">
              <p className="nb-eye">New York Tonight</p>
              {nyGames.map((ev, i) => <GameCard key={i} event={ev} />)}
            </div>
          )}

          {/* All games (condensed) if no NY games */}
          {nyGames.length === 0 && allEvents.length > 0 && (
            <div className="all-games">
              <p className="nb-eye">Today's Scoreboard</p>
              {allEvents.slice(0, 8).map((ev, i) => {
                const comp  = ev.competitions?.[0];
                const status = comp?.status;
                const isLive = status?.type?.state === "in";
                const home  = comp?.competitors?.find(c => c.homeAway === "home");
                const away  = comp?.competitors?.find(c => c.homeAway === "away");
                const nyInGame = NY_TEAMS.includes(home?.team?.abbreviation) ||
                                 NY_TEAMS.includes(away?.team?.abbreviation);
                return (
                  <div key={i} className={`score-card-sm${nyInGame ? " score-ny-game" : ""}`}>
                    <span className="live-dot">{isLive ? "●" : " "}</span>
                    <span className={`team-sm${NY_TEAMS.includes(away?.team?.abbreviation) ? " team-sm-ny" : ""}`}>
                      {away?.team?.abbreviation ?? "—"}
                    </span>
                    <span className="score-sm">{away?.score ?? "—"}</span>
                    <span className="sep-sm">·</span>
                    <span className={`team-sm${NY_TEAMS.includes(home?.team?.abbreviation) ? " team-sm-ny" : ""}`}>
                      {home?.team?.abbreviation ?? "—"}
                    </span>
                    <span className="score-sm">{home?.score ?? "—"}</span>
                    {isLive && status?.period && (
                      <span className="clock-sm">Q{status.period}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Eastern Conference standings */}
          {eastEntries.length > 0 && (
            <div className="standings-section">
              <p className="nb-eye">Eastern Conference</p>
              <div className="standings-table">
                <div className="st-header">
                  <span></span>
                  <span>Team</span>
                  <span style={{textAlign:"right"}}>W</span>
                  <span style={{textAlign:"right"}}>L</span>
                  <span style={{textAlign:"right"}}>PCT</span>
                </div>
                {eastEntries.slice(0, 8).map((entry, i) => {
                  const abbr  = entry.team?.abbreviation;
                  const isNY  = NY_TEAMS.includes(abbr);
                  const wins  = getStat(entry.stats, "wins", "W", "OW");
                  const losses = getStat(entry.stats, "losses", "L", "OL");
                  const pct   = getStat(entry.stats, "winPercent", "PCT", "WP", "playoffSeed");
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

          {nyGames.length === 0 && allEvents.length === 0 && eastEntries.length === 0 && (
            <div className="no-data">
              <span className="no-data-text">No games today.</span>
              <span className="no-data-sub">Check back on game day.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const [t, setTweak]       = useTweaks(TWEAK_DEFAULTS);
  const [nascarData, setNascarData]     = useState(null);
  const [nbaScores, setNbaScores]       = useState(null);
  const [nbaStandings, setNbaStandings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fetchError, setFetchError]   = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme ?? "light");
  }, [t.theme]);

  async function fetchAll() {
    try {
      const [nascar, nba, standings] = await Promise.allSettled([
        fetch(NASCAR_URL).then(r => { if (!r.ok) throw r; return r.json(); }),
        fetch(NBA_URL).then(r => { if (!r.ok) throw r; return r.json(); }),
        fetch(STANDINGS_URL).then(r => { if (!r.ok) throw r; return r.json(); }),
      ]);
      if (nascar.status   === "fulfilled") setNascarData(nascar.value);
      if (nba.status      === "fulfilled") setNbaScores(nba.value);
      if (standings.status === "fulfilled") setNbaStandings(standings.value);
      setLastUpdated(new Date());
      setFetchError(null);
    } catch {
      setFetchError("Unable to reach data sources. Will retry shortly.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="nb-page">
      <header className="nb-header">
        <a href="index.html" className="nb-back">← Shade of Design</a>
        <div className="nb-header-center">
          <div className="nb-title">The Pit Stop &amp; The Paint</div>
          <div className="nb-subtitle">NASCAR · NBA</div>
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
          <NascarPanel data={nascarData} loading={loading} />
          <BasketballPanel
            scores={nbaScores}
            standings={nbaStandings}
            loading={loading}
          />
        </div>
      </main>

      <footer className="nb-foot">
        <a href="index.html" className="foot-link">← Back</a>
        <span className="nb-updated">
          {loading && !lastUpdated
            ? "Loading…"
            : `Updated ${fmtTime(lastUpdated)}`}
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
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
