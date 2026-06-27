/* global React, ReactDOM, supabase */
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{ "theme": "dark", "stylePreset": "glass" }/*EDITMODE-END*/;

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

// THis was redirected to point at a Google Sheets via Google Apps Script's extension. 
// Sheet name is "Family Notes DB"

// KEEPING THE BELOW IN CASE WE MOVE TO USING SUPABASE AGAIN ****************************
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
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqM-A9Sld3y66E8PXd0TjRQcaWrF0I2Yik1WTWD8nLDgzXT8Wsf1TpXmQSyl6tC_qY/exec";
const COMMENTS_ON   = true;

const REFRESH_MS = 60_000;
const NY_TEAMS   = ["NYK", "BKN"];

// ─── NY team external links ───────────────────────────────────────────────────
const NY_TEAM_INFO = {
  NYK: { url: "https://www.nba.com/knicks",  statsUrl: "https://www.nba.com/stats/team/1610612752", trend: [1, 1, 0, 1, 1, 1] },
  BKN: { url: "https://www.nba.com/nets",    statsUrl: "https://www.nba.com/stats/team/1610612751", trend: [0, 1, 0, 0, 1, 0] },
};

// ─── Static driver data ───────────────────────────────────────────────────────
const FEATURED_DRIVERS = [
  { name: "Dale Earnhardt Jr.", car: "88", team: "JR Motorsports",           era: "modern", wins: 26,  champs: 0, note: "15× Most Popular Driver", url: "https://www.nascar.com/dale-earnhardt-jr/",  statsUrl: "https://www.espn.com/racing/driver/_/id/150/dale-earnhardt-jr", image: "https://a.espncdn.com/combiner/i?img=/i/headshots/rpm/players/full/150.png&w=200&h=150" },
  { name: "Denny Hamlin",       car: "11", team: "Joe Gibbs Racing",         era: "modern", wins: null, champs: 0, note: "3× Daytona 500 winner",   url: "https://www.nascar.com/denny-hamlin/",       statsUrl: "https://www.espn.com/racing/driver/_/id/747/denny-hamlin", image: "https://a.espncdn.com/combiner/i?img=/i/headshots/rpm/players/full/747.png&w=200&h=150" },
  { name: "Dale Earnhardt Sr.", car: "3",  team: "Richard Childress Racing",  era: "legend", wins: 76,  champs: 7, note: "The Intimidator",           url: "https://www.nascar.com/dale-earnhardt/",    statsUrl: "https://www.espn.com/racing/driver/stats/_/id/2675/dale-earnhardt", image: "https://a.espncdn.com/combiner/i?img=/i/headshots/rpm/players/full/2675.png&w=200&h=150" },
  { name: "Richard Petty",      car: "43", team: "Petty Enterprises",         era: "legend", wins: 200, champs: 7, note: "The King",                  url: "https://www.nascar.com/richard-petty/",    statsUrl: "https://www.espn.com/racing/driver/stats/_/id/918/richard-petty", image: "https://a.espncdn.com/combiner/i?img=/i/headshots/rpm/players/full/918.png&w=200&h=150" },
  { name: "Jeff Gordon",        car: "24", team: "Hendrick Motorsports",      era: "legend", wins: 93,  champs: 4, note: "Rainbow Warrior",           url: "https://www.nascar.com/jeff-gordon/",      statsUrl: "https://www.espn.com/racing/driver/stats/_/id/67/jeff-gordon", image: "https://a.espncdn.com/combiner/i?img=/i/headshots/rpm/players/full/67.png&w=200&h=150" },
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

function Sparkline({ data, color = "currentColor", invert = false }) {
  if (!Array.isArray(data) || data.length < 2) return null;
  const w = 70;
  const h = 22;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const normalizedY = (val - min) / range;
    const y = invert ? normalizedY * h : (1 - normalizedY) * h;
    return { x, y };
  });

  // Generate smooth Bezier curve
  let linePath = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }

  const fillPath = `${linePath} L ${w.toFixed(1)},${h.toFixed(1)} L 0,${h.toFixed(1)} Z`;
  
  const idRef = React.useRef(Math.random().toString(36).substring(2, 9));
  const gradId = `spark-grad-${idRef.current}`;
  const glowId = `spark-glow-${idRef.current}`;

  return (
    <svg className="sparkline" width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", flexShrink: 0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor={color} floodOpacity="0.4" />
        </filter>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="2.5"
          fill={color}
          className="sparkline-dot"
          filter={`url(#${glowId})`}
        />
      )}
    </svg>
  );
}

// ─── Weather Coordinates Dictionary ──────────────────────────────────────────
const TRACK_COORDINATES = {
  "daytona": { lat: 29.1856, lon: -81.0694, label: "Daytona Beach, FL" },
  "talladega": { lat: 33.5670, lon: -86.0660, label: "Talladega, AL" },
  "charlotte": { lat: 35.3514, lon: -80.6861, label: "Concord, NC" },
  "bristol": { lat: 36.5156, lon: -82.2569, label: "Bristol, TN" },
  "darlington": { lat: 34.2952, lon: -79.9056, label: "Darlington, SC" },
  "indianapolis": { lat: 39.7950, lon: -86.2356, label: "Speedway, IN" },
  "martinsville": { lat: 36.6342, lon: -79.8519, label: "Ridgeway, VA" },
  "richmond": { lat: 37.5925, lon: -77.4194, label: "Richmond, VA" },
  "atlanta": { lat: 33.3867, lon: -84.3175, label: "Hampton, GA" },
  "las vegas": { lat: 36.2717, lon: -115.0103, label: "Las Vegas, NV" },
  "lasvegas": { lat: 36.2717, lon: -115.0103, label: "Las Vegas, NV" },
  "phoenix": { lat: 33.3748, lon: -112.3112, label: "Avondale, AZ" },
  "homestead": { lat: 25.4619, lon: -80.4089, label: "Homestead, FL" },
  "texas": { lat: 33.0269, lon: -97.2825, label: "Fort Worth, TX" },
  "kansas": { lat: 39.1156, lon: -94.8311, label: "Kansas City, KS" },
  "michigan": { lat: 42.0672, lon: -84.2411, label: "Brooklyn, MI" },
  "pocono": { lat: 41.0544, lon: -75.5114, label: "Long Pond, PA" },
  "sonoma": { lat: 38.1611, lon: -122.4594, label: "Sonoma, CA" },
  "watkins glen": { lat: 42.3369, lon: -76.9242, label: "Watkins Glen, NY" },
  "dover": { lat: 39.1897, lon: -75.5306, label: "Dover, DE" },
  "nashville": { lat: 36.1472, lon: -86.4069, label: "Lebanon, TN" },
  "gateway": { lat: 38.6508, lon: -90.1356, label: "Madison, IL" },
  "wwtr": { lat: 38.6508, lon: -90.1356, label: "Madison, IL" },
  "wilkesboro": { lat: 36.1311, lon: -81.0769, label: "North Wilkesboro, NC" },
  "new hampshire": { lat: 43.3625, lon: -71.4614, label: "Loudon, NH" },
  "coliseum": { lat: 34.0141, lon: -118.2878, label: "Los Angeles, CA" },
  "chicago": { lat: 41.8758, lon: -87.6244, label: "Chicago, IL" },
  "iowa": { lat: 41.6778, lon: -93.0142, label: "Newton, IA" }
};

function findCoordinates(venueName, eventName) {
  const text = ((venueName || "") + " " + (eventName || "")).toLowerCase();
  for (const key in TRACK_COORDINATES) {
    if (text.includes(key)) {
      return TRACK_COORDINATES[key];
    }
  }
  return { lat: 35.3514, lon: -80.6861, label: "Charlotte (Default), NC" };
}

// ─── TrackWeather Component ──────────────────────────────────────────────────
function TrackWeather({ venueName, eventName }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const loc = findCoordinates(venueName, eventName);

  useEffect(() => {
    let active = true;
    async function fetchWeather() {
      setLoading(true);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active) {
          setWeather(data.current);
          setLoading(false);
        }
      } catch (e) {
        if (active) setLoading(false);
      }
    }
    fetchWeather();
    return () => { active = false; };
  }, [loc.lat, loc.lon]);

  if (loading) return <div className="weather-card loading">Loading track weather…</div>;
  if (!weather) return null;

  const temp = Math.round(weather.temperature_2m);
  const rain = weather.rain;
  const wind = Math.round(weather.wind_speed_10m);
  const code = weather.weather_code;

  let desc = "Clear";
  if (code > 0 && code <= 3) desc = "Partly Cloudy";
  else if (code >= 45 && code <= 48) desc = "Foggy";
  else if (code >= 51 && code <= 67) desc = "Drizzle/Rain";
  else if (code >= 71 && code <= 77) desc = "Snow";
  else if (code >= 80 && code <= 82) desc = "Rain Showers";
  else if (code >= 95) desc = "Thunderstorm";

  let surfaceStatus = "Green Track";
  let surfaceClass = "surface-green";
  if (rain > 0 || code >= 51) {
    surfaceStatus = "Wet Track / Caution";
    surfaceClass = "surface-wet";
  } else if (temp > 32) {
    surfaceStatus = "Hot Track / Low Grip";
    surfaceClass = "surface-hot";
  }

  return (
    <div className="weather-card">
      <div className="weather-header">
        <p className="card-eye">Trackside Telemetry</p>
        <span className={`surface-status ${surfaceClass}`}>{surfaceStatus}</span>
      </div>
      <div className="weather-loc">{loc.label}</div>
      <div className="weather-stats">
        <div className="weather-stat"><span className="ws-val">{temp}°C</span><span className="ws-lbl">Temp</span></div>
        <div className="weather-stat"><span className="ws-val">{desc}</span><span className="ws-lbl">Condition</span></div>
        <div className="weather-stat"><span className="ws-val">{wind} km/h</span><span className="ws-lbl">Wind</span></div>
        <div className="weather-stat"><span className="ws-val">{rain > 0 ? `${rain}mm` : "None"}</span><span className="ws-lbl">Rain</span></div>
      </div>
    </div>
  );
}

// ─── NascarHighlights Component ──────────────────────────────────────────────
function NascarHighlights() {
  const highlights = [
    { driver: "Hendrick Motorsports", record: "300+ Cup Wins", desc: "First organization in NASCAR history to surpass 300 wins." },
    { driver: "Denny Hamlin", record: "Daytona Dominance", desc: "Won the Clash at the Coliseum and Bristol in the same year." },
    { driver: "Kyle Larson", record: "198.4 mph lap", desc: "Clocked the fastest modern telemetry loop at Texas." },
    { driver: "Martin Truex Jr.", record: "15k Laps Led", desc: "Entered the elite group of drivers with 15,000+ career laps led." },
  ];

  return (
    <div className="highlights-card">
      <p className="card-eye">Season Milestones</p>
      <h3 className="highlights-title">2026 Records Set</h3>
      <div className="highlights-list">
        {highlights.map((h, i) => (
          <div key={i} className="highlight-item">
            <div className="hl-item-head">
              <span className="hl-driver">{h.driver}</span>
              <span className="hl-record">{h.record}</span>
            </div>
            <p className="hl-desc">{h.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TapeDeck Component ──────────────────────────────────────────────────────
const PLAYLIST = [
  { id: "branching", title: "The Branching Point", artist: "Logic and the Branch", src: "/Design Content/wavs/Logic and the Branch - The Branching Point - Sonauto.wav" },
  { id: "opus", title: "Building My Opus", artist: "Shade of Design", src: "/Design Content/wavs/Shade of Design - Building My Opus - Sonauto.wav" },
  { id: "neon", title: "Neon Delta Suite", artist: "Cobalt Symphony", src: "/Design Content/wavs/Cobalt Symphony - Neon Delta Suite - Sonauto.wav" },
  { id: "lofi", title: "Cozy Study Session", artist: "Lofi Sanctuary", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "synth", title: "Sunset Cruise", artist: "Neon Horizons", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
];

function TapeDeck() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  const currentTrack = PLAYLIST[trackIdx];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.src;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [trackIdx]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }

  function handleNext() {
    setTrackIdx(prev => (prev + 1) % PLAYLIST.length);
  }

  function handlePrev() {
    setTrackIdx(prev => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
  }

  return (
    <div className="tape-deck-card">
      <audio ref={audioRef} onEnded={handleNext} />
      <p className="card-eye">Lounge Radio</p>
      
      <div className="td-player-ui">
        {/* Tape Cassette Graphic */}
        <div className={`td-cassette ${isPlaying ? "spinning" : ""}`}>
          <div className="cassette-label">
            <span className="cl-title">{currentTrack.title}</span>
            <span className="cl-artist">{currentTrack.artist}</span>
          </div>
          <div className="cassette-window">
            <div className="cassette-wheel left-wheel"></div>
            <div className="cassette-wheel right-wheel"></div>
          </div>
        </div>

        {/* Visualizer bars */}
        <div className="td-visualizer">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className={`vis-bar ${isPlaying ? "active" : ""}`} style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>

        {/* Controls */}
        <div className="td-controls">
          <button className="td-btn btn-prev" onClick={handlePrev}>⏮</button>
          <button className="td-btn btn-play" onClick={togglePlay}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className="td-btn btn-next" onClick={handleNext}>⏭</button>
          
          <div className="td-volume-control">
            <button className="td-vol-icon" onClick={() => setIsMuted(!isMuted)}>
              {isMuted || volume === 0 ? "🔇" : volume < 0.4 ? "🔈" : "🔊"}
            </button>
            <input 
              type="range" 
              className="td-volume-slider" 
              min="0" 
              max="1" 
              step="0.05" 
              value={volume} 
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CourtShooter Component ──────────────────────────────────────────────────
function CourtShooter() {
  const [shots, setShots] = useState(() => parseInt(localStorage.getItem("paint_shots") || "0", 10));
  const [makes, setMakes] = useState(() => parseInt(localStorage.getItem("paint_makes") || "0", 10));
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem("paint_streak") || "0", 10));
  const [ball, setBall] = useState(null);
  const [status, setStatus] = useState("Click the court to shoot!");

  function takeShot(e) {
    if (ball) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const dx = x - 50;
    const dy = y - 12;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let type = "mid";
    let prob = 0.45;
    let points = 2;

    if (dist < 18) {
      type = "paint";
      prob = 0.75;
      points = 2;
    } else if (dist > 35) {
      type = "three";
      prob = 0.33;
      points = 3;
    }

    const isMake = Math.random() < prob;
    const newBall = { x, y, isMake, id: Date.now(), type, points };
    setBall(newBall);
    setStatus("Ball is in the air...");

    setTimeout(() => {
      setShots(s => {
        const next = s + 1;
        localStorage.setItem("paint_shots", next);
        return next;
      });

      if (isMake) {
        setMakes(m => {
          const next = m + 1;
          localStorage.setItem("paint_makes", next);
          return next;
        });
        setStreak(st => {
          const next = st + 1;
          localStorage.setItem("paint_streak", next);
          return next;
        });
        setStatus(`SPLASH! Made a ${points}-pointer! 🏀`);
      } else {
        setStreak(0);
        localStorage.setItem("paint_streak", 0);
        setStatus("CLANK! Missed the shot. 🛑");
      }
      setBall(null);
    }, 1000);
  }

  const pct = shots === 0 ? 0 : Math.round((makes / shots) * 100);

  function resetStats() {
    setShots(0);
    setMakes(0);
    setStreak(0);
    localStorage.setItem("paint_shots", 0);
    localStorage.setItem("paint_makes", 0);
    localStorage.setItem("paint_streak", 0);
    setStatus("Stats reset. Click the court to shoot!");
  }

  const ballStyle = ball ? {
    left: `${ball.x}%`,
    top: `${ball.y}%`,
    "--dx": `${50 - ball.x}%`,
    "--dy": `${12 - ball.y}%`,
    "--dx-half": `${(50 - ball.x) / 2}%`,
    "--dy-half": `${(12 - ball.y) / 2 - 25}%`,
    animation: "shot-flight 1.0s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
  } : {};

  return (
    <div className="court-shooter-card">
      <p className="card-eye">The Paint Arcade</p>
      
      <div className="cs-court-container">
        <svg className="court-svg" viewBox="0 0 100 60" onClick={takeShot}>
          <rect x="0" y="0" width="100" height="60" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.15" />
          <path d="M 18 0 A 32 32 0 0 0 82 0" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
          <line x1="18" y1="0" x2="18" y2="8" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
          <line x1="82" y1="0" x2="82" y2="8" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
          <rect x="39" y="0" width="22" height="24" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
          <path d="M 43 24 A 7 7 0 0 0 57 24" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
          <line x1="44" y1="10" x2="56" y2="10" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <circle cx="50" cy="12" r="2.2" fill="none" stroke="var(--ember)" strokeWidth="1.5" />
        </svg>

        {ball && <div className="basketball-node" style={ballStyle} />}
      </div>

      <div className="cs-status">{status}</div>

      <div className="cs-scoreboard">
        <div className="cs-score-box"><span className="css-val">{makes}/{shots}</span><span className="css-lbl">Makes</span></div>
        <div className="cs-score-box"><span className="css-val">{pct}%</span><span className="css-lbl">Accuracy</span></div>
        <div className="cs-score-box"><span className="css-val">{streak}</span><span className="css-lbl">Streak</span></div>
        <button className="cs-reset-btn" onClick={resetStats}>Reset</button>
      </div>
    </div>
  );
}

// ─── ArcadeRacer Component ───────────────────────────────────────────────────
function ArcadeRacer() {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [driver, setDriver] = useState("Dale Sr.");
  const [isCrashed, setIsCrashed] = useState(false);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("racer_highscore") || "0", 10));

  const stateRef = useRef({
    speed: 0,
    distance: 0,
    carX: 0,
    roadX: 0,
    roadSegments: [],
    obstacles: [],
    keys: { left: false, right: false, up: false, down: false },
    animationId: null,
    crashCooldown: 0
  });

  const driverColors = {
    "Dale Sr.": "#111111",
    "Dale Jr.": "#00ff66",
    "Jeff Gordon": "#ffcc00",
    "Richard Petty": "#0099ff",
    "Denny Hamlin": "#ff6600"
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!stateRef.current) return;
      if (e.key === "ArrowLeft" || e.key === "a") stateRef.current.keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d") stateRef.current.keys.right = true;
      if (e.key === "ArrowUp" || e.key === "w") stateRef.current.keys.up = true;
      if (e.key === "ArrowDown" || e.key === "s") stateRef.current.keys.down = true;
    };

    const handleKeyUp = (e) => {
      if (!stateRef.current) return;
      if (e.key === "ArrowLeft" || e.key === "a") stateRef.current.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d") stateRef.current.keys.right = false;
      if (e.key === "ArrowUp" || e.key === "w") stateRef.current.keys.up = false;
      if (e.key === "ArrowDown" || e.key === "s") stateRef.current.keys.down = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      stopGame();
    };
  }, []);

  function startGame() {
    setIsPlaying(true);
    setIsCrashed(false);
    setScore(0);
    setSpeed(0);

    const s = stateRef.current;
    s.speed = 0;
    s.distance = 0;
    s.carX = 0;
    s.roadX = 0;
    s.crashCooldown = 0;
    
    s.roadSegments = [];
    for (let i = 0; i < 500; i++) {
      s.roadSegments.push({
        curve: Math.sin(i / 30) * 1.5,
        y: Math.sin(i / 10) * 10
      });
    }

    s.obstacles = [
      { z: 100, x: -0.5, speed: 2, color: "#ff3333" },
      { z: 220, x: 0.4, speed: 1.5, color: "#ffff33" },
      { z: 360, x: -0.2, speed: 3, color: "#33ff33" },
      { z: 500, x: 0.3, speed: 2.5, color: "#ffffff" },
    ];

    if (s.animationId) cancelAnimationFrame(s.animationId);
    s.animationId = requestAnimationFrame(gameLoop);
  }

  function stopGame() {
    setIsPlaying(false);
    if (stateRef.current && stateRef.current.animationId) {
      cancelAnimationFrame(stateRef.current.animationId);
      stateRef.current.animationId = null;
    }
  }

  function gameLoop() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;

    if (s.crashCooldown > 0) {
      s.crashCooldown--;
      s.speed = Math.max(0, s.speed - 6);
      if (s.crashCooldown === 0) {
        setIsCrashed(false);
      }
    } else {
      if (s.keys.up) {
        s.speed = Math.min(185, s.speed + 2.5);
      } else if (s.keys.down) {
        s.speed = Math.max(0, s.speed - 6);
      } else {
        s.speed = Math.max(0, s.speed - 1);
      }

      if (s.keys.left) {
        s.carX = Math.max(-1.5, s.carX - 0.06 * (s.speed / 120 + 0.2));
      }
      if (s.keys.right) {
        s.carX = Math.min(1.5, s.carX + 0.06 * (s.speed / 120 + 0.2));
      }

      if (Math.abs(s.carX) > 0.95 && s.speed > 50) {
        s.speed = Math.max(50, s.speed - 4);
      }
    }

    s.distance += s.speed * 0.05;
    const scoreVal = Math.floor(s.distance / 10);
    setScore(scoreVal);
    setSpeed(Math.floor(s.speed));

    const currentSegmentIdx = Math.floor(s.distance / 30) % s.roadSegments.length;
    const currentSegment = s.roadSegments[currentSegmentIdx];
    s.roadX += -s.carX * (s.speed / 800) + currentSegment.curve * 0.015 * (s.speed / 100);

    s.obstacles.forEach(o => {
      o.z -= s.speed * 0.05;
      if (o.z <= 0) {
        o.z = 600 + Math.random() * 200;
        o.x = (Math.random() - 0.5) * 1.6;
        o.color = ["#ff3333", "#ffff33", "#33ff33", "#ffffff", "#ff00ff"][Math.floor(Math.random() * 5)];
      }

      if (o.z > 5 && o.z < 25) {
        const distToCar = Math.abs(s.carX - o.x);
        if (distToCar < 0.28 && s.crashCooldown === 0) {
          s.crashCooldown = 40;
          setIsCrashed(true);
          s.speed = 10;
        }
      }
    });

    ctx.clearRect(0, 0, 320, 200);

    const skyScroll = (s.roadX * 50) % 320;
    ctx.fillStyle = "#091020";
    ctx.fillRect(0, 0, 320, 200);
    ctx.fillStyle = "#121a2e";
    ctx.fillRect(0, 0, 320, 80);
    ctx.fillStyle = "#ff5500";
    ctx.fillRect(0, 76, 320, 4);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    for (let star = 0; star < 12; star++) {
      ctx.fillRect((star * 35 - skyScroll + 320) % 320, 8 + (star % 3) * 16, 2, 2);
    }

    for (let y = 80; y < 200; y += 4) {
      const z = 1 / ((y - 80) / 120);
      const roadWidth = 200 / z;
      const roadCenter = 160 + (s.roadX * 300) / z - (s.roadSegments[(currentSegmentIdx + Math.floor(z*3)) % s.roadSegments.length].curve * 15);
      const isRed = Math.floor(s.distance / 15 + z) % 2 === 0;

      ctx.fillStyle = isRed ? "#092215" : "#05130b";
      ctx.fillRect(0, y, 320, 4);

      ctx.fillStyle = isRed ? "#d62828" : "#ffffff";
      ctx.fillRect(roadCenter - roadWidth / 2 - 4, y, roadWidth + 8, 4);

      ctx.fillStyle = "#141923";
      ctx.fillRect(roadCenter - roadWidth / 2, y, roadWidth, 4);

      if (Math.floor(s.distance / 20 + z) % 2 === 0) {
        ctx.fillStyle = "#f77f00";
        ctx.fillRect(roadCenter - 1, y, 2, 4);
      }
    }

    s.obstacles.forEach(o => {
      if (o.z > 0 && o.z < 600) {
        const y = 80 + 120 * (1 / (o.z / 60));
        if (y >= 80 && y <= 200) {
          const size = 150 / o.z;
          const x = 160 + (o.x - s.carX) * (150 / (o.z / 60)) + (s.roadX * 10);
          
          ctx.fillStyle = o.color;
          ctx.fillRect(x - size / 2, y - size, size, size * 0.7);
          ctx.fillStyle = "#000000";
          ctx.fillRect(x - size / 2 - 1, y - size / 3, 2, size / 3);
          ctx.fillRect(x + size / 2 - 1, y - size / 3, 2, size / 3);
          ctx.fillStyle = "#ff6600";
          ctx.fillRect(x - size / 2, y - size - 2, size, 2);
        }
      }
    });

    const pSize = 36;
    const px = 160;
    const py = 190;
    const carColor = driverColors[driver];

    ctx.save();
    if (s.crashCooldown > 0) {
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(px - pSize / 2 + 2, py - 6, pSize, 8);

    ctx.fillStyle = carColor;
    ctx.fillRect(px - pSize / 2, py - 18, pSize, 12);
    ctx.fillStyle = "#111111";
    ctx.fillRect(px - pSize / 2 - 2, py - 6, 4, 6);
    ctx.fillRect(px + pSize / 2 - 2, py - 6, 4, 6);
    ctx.fillRect(px - pSize / 2 - 2, py - 16, 4, 6);
    ctx.fillRect(px + pSize / 2 - 2, py - 16, 4, 6);
    
    ctx.fillStyle = "#88ddff";
    ctx.fillRect(px - pSize / 3, py - 15, (pSize * 2) / 3, 4);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px - pSize / 2, py - 19, pSize, 2);
    
    ctx.fillStyle = "#ffcc00";
    ctx.font = "bold 8px Courier";
    const carNum = driver === "Dale Sr." ? "3" : driver === "Dale Jr." ? "88" : driver === "Jeff Gordon" ? "24" : driver === "Richard Petty" ? "43" : "11";
    ctx.fillText(carNum, px - 4, py - 8);

    ctx.restore();

    s.animationId = requestAnimationFrame(gameLoop);
  }

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("racer_highscore", score);
    }
  }, [score, highScore]);

  return (
    <div className="arcade-racer-card">
      <p className="card-eye">The Pit Arcade</p>
      
      <div className="ar-gameplay-container">
        <canvas ref={canvasRef} className="ar-canvas" width="320" height="200" />
        
        {!isPlaying && (
          <div className="ar-overlay">
            <div className="ar-setup">
              <p className="ar-instructions">Controls: Arrow keys / WASD to Steer &amp; Drive. Dodge traffic!</p>
              
              <div className="driver-selector">
                <span className="ds-label">Select Car:</span>
                <select className="ds-select" value={driver} onChange={(e) => setDriver(e.target.value)}>
                  {Object.keys(driverColors).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <button className="ar-start-btn" onClick={startGame}>Start Race 🏁</button>
            </div>
          </div>
        )}

        {isCrashed && (
          <div className="ar-crash-overlay">
            <span className="ar-crash-title">💥 CRASHED!</span>
          </div>
        )}

        <div className="ar-instrumentation">
          <div className="ar-gauge"><span className="arg-val">{speed}</span><span className="arg-lbl">MPH</span></div>
          <div className="ar-gauge"><span className="arg-val">{score}</span><span className="arg-lbl">Score</span></div>
          <div className="ar-gauge"><span className="arg-val">{highScore}</span><span className="arg-lbl">High</span></div>
        </div>
      </div>
      {isPlaying && <button className="ar-stop-btn" onClick={stopGame}>Stop Race ⏹</button>}
    </div>
  );
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
                {NY_TEAM_INFO[abbr]?.trend && (
                  <div className="team-trend-container">
                    <Sparkline data={NY_TEAM_INFO[abbr].trend} color="var(--ember)" />
                    <span className="team-trend-label">Form (L6)</span>
                  </div>
                )}
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

function NascarPanel({ activeTab, scoreboard, standings, news, loading }) {
  const [selectedDriver, setSelectedDriver] = useState(null);
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
    <div className={`nb-panel nascar-panel${isLive ? " score-live" : ""}`}>
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
      ) : activeTab === "telemetry" ? (
        /* ── TELEMETRY TAB ── */
        isLive && active ? (
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
          <div className="off-race">
            {lastEvent && <LastRaceCard event={lastEvent} />}
            <TrackWeather venueName={competition?.venue?.fullName || nextEvent?.competitions?.[0]?.venue?.fullName} eventName={active?.name || nextEvent?.name} />
            {nextEvent?.date && (
              <CountdownTimer
                targetIso={nextEvent.date}
                label={`Next Race · ${nextEvent.name ?? nextEvent.shortName ?? ""}`}
              />
            )}
            <ScheduleStrip events={events} label="Upcoming Races" max={3} />
            <NewsStrip articles={news} sport="nascar" />
          </div>
        )
      ) : activeTab === "stats" ? (
        /* ── STATS TAB ── */
        <div className="off-race">
          <NascarStandingsTable data={standings} />
          <NascarLeaderBoard standings={standings} lastEvent={lastEvent} />
          <NascarHighlights />
        </div>
      ) : activeTab === "garage" ? (
        /* ── GARAGE TAB ── */
        <div className="drivers-section">
          <div className="driver-cards">
            {FEATURED_DRIVERS.map((d) => (
              <div key={d.car} className={`driver-card driver-link driver-${d.era} driver-${d.car}`} onClick={() => setSelectedDriver(d)} style={{ cursor: "pointer" }}>
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
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Driver career details modal */}
      {selectedDriver && (
        <div className="driver-modal-overlay" onClick={() => setSelectedDriver(null)}>
          <div className="driver-modal-content" onClick={e => e.stopPropagation()}>
            <button className="driver-modal-close" onClick={() => setSelectedDriver(null)}>×</button>
            <div className={`driver-modal-header driver-${selectedDriver.car}`}>
              {selectedDriver.image && (
                <div className="dm-avatar-container">
                  <img className="dm-avatar" src={selectedDriver.image} alt={selectedDriver.name} onError={(e) => { e.target.parentNode.style.display = 'none'; }} />
                </div>
              )}
              <span className="dm-car">#{selectedDriver.car}</span>
              <div className="dm-header-info">
                <h3 className="dm-name">{selectedDriver.name}</h3>
                <p className="dm-team">{selectedDriver.team}</p>
              </div>
            </div>
            <div className="driver-modal-body">
              <div className="dm-stats-grid">
                <div className="dm-stat"><span className="dms-val">{selectedDriver.wins !== null ? selectedDriver.wins : "—"}</span><span className="dms-lbl">Wins</span></div>
                <div className="dm-stat"><span className="dms-val">{selectedDriver.champs}</span><span className="dms-lbl">Championships</span></div>
                <div className="dm-stat"><span className="dms-val">{selectedDriver.era.toUpperCase()}</span><span className="dms-lbl">Era</span></div>
              </div>
              <p className="dm-note">{selectedDriver.note}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BasketballPanel ──────────────────────────────────────────────────────────

function BasketballPanel({ activeTab, scores, standings, leaders, news, loading }) {
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
      ) : activeTab === "telemetry" ? (
        /* ── TELEMETRY TAB ── */
        <>
          {liveNY.length > 0 && (
            <div className="ny-games">
              <p className="nb-eye">Live Now · New York</p>
              {liveNY.map((ev, i) => <GameCard key={i} event={ev} />)}
            </div>
          )}

          {!liveNY.length && lastNY && <LastGameCard event={lastNY} />}

          {!liveNY.length && nextNY?.date && (
            <CountdownTimer
              targetIso={nextNY.date}
              label={`Next · ${nextNY.competitions?.[0]?.competitors?.find(c => !NY_TEAMS.includes(c.team?.abbreviation))?.team?.shortDisplayName ?? "NY game"}`}
            />
          )}

          {nyGames.filter(ev => ev.competitions?.[0]?.status?.type?.state === "post" && ev !== lastNY).slice(0,2).map((ev, i) =>
            <GameCard key={i} event={ev} />
          )}

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

          {!liveNY.length && (
            <ScheduleStrip
              events={nyGames.length ? nyGames : allEvents.filter(ev =>
                ev.competitions?.[0]?.competitors?.some(c => NY_TEAMS.includes(c.team?.abbreviation))
              )}
              label="Upcoming NY Games"
              max={3}
            />
          )}

          <NewsStrip articles={news} sport="nba" />
        </>
      ) : activeTab === "stats" ? (
        /* ── STATS TAB ── */
        <>
          <PlayoffPicture entries={allEntries} conference="East" />

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

          <NbaLeaderBoard leaders={leaders} lastNY={lastNY} />
        </>
      ) : activeTab === "garage" ? (
        /* ── GARAGE TAB ── */
        <NbaLeaderBoard leaders={leaders} lastNY={lastNY} />
      ) : null}
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
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { redirect: "follow" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data);
      setLoadErr(false);
    } catch (e) {
      setLoadErr(true);
    }
  }

  useEffect(() => { loadComments(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        redirect: "follow",
        body: JSON.stringify({
          title:  title.trim(),
          body:   body.trim(),
          author: author.trim() || "Anonymous",
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setTitle(""); setBody(""); setAuthor("");
      setTimeout(() => setSent(false), 3000);
      await loadComments();
    } catch (err) {
      alert("Could not save note. Please try again.");
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
        <p className="cw-sub">Check in from any device — dad, JR, anyone with the link. Synced live with Google Sheets.</p>
      </div>

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
            <div key={c.id || Math.random().toString()} className="cw-card">
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
    </section>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [t, setTweak]           = useTweaks(TWEAK_DEFAULTS);
  const [activeTab, setActiveTab] = useState("telemetry");
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

        {/* Dynamic Glass View Switcher */}
        <div className="nb-tabs-container">
          <div className="nb-tabs">
            <button className={`nb-tab-btn ${activeTab === "telemetry" ? "active" : ""}`} onClick={() => setActiveTab("telemetry")}>
              <span className="tab-icon">⚡</span> Telemetry HUD
            </button>
            <button className={`nb-tab-btn ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>
              <span className="tab-icon">📊</span> Stats &amp; Standings
            </button>
            <button className={`nb-tab-btn ${activeTab === "garage" ? "active" : ""}`} onClick={() => setActiveTab("garage")}>
              <span className="tab-icon">🏁</span> Dad's Garage
            </button>
            <button className={`nb-tab-btn ${activeTab === "notes" ? "active" : ""}`} onClick={() => setActiveTab("notes")}>
              <span className="tab-icon">☕</span> Spacing Out
            </button>
          </div>
        </div>

        {activeTab === "notes" ? (
          <div className="nb-lounge">
            <div className="nb-lounge-grid">
              <ArcadeRacer />
              <CourtShooter />
            </div>
            <div className="nb-lounge-bottom">
              <TapeDeck />
              <CommentWall />
            </div>
          </div>
        ) : (
          <div className="nb-grid">
            <NascarPanel activeTab={activeTab} scoreboard={nascarBoard} standings={nascarPts} news={nascarNews} loading={loading} />
            <BasketballPanel activeTab={activeTab} scores={nbaScores} standings={nbaStandings} leaders={nbaLeaders} news={nbaNews} loading={loading} />
          </div>
        )}

        {activeTab !== "notes" && <OnThisDay worldEvents={worldEvents} />}
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
