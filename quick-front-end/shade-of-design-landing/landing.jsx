/* global React, ReactDOM */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light"
}/*EDITMODE-END*/;

/* Socials — add a row to this array to add a platform.
   Optional fields: `handle` (display string), `accent` ("ocean"|"slate"|"ember") */
const SOCIALS = [
  { id: "itch",     name: "Itch.io",  handle: "shadeofdesign",  href: "https://shadeofdesign.itch.io/" },
  { id: "twitter",  name: "Twitter",  handle: "@jrivera_SOD",   href: "https://x.com/jrivera_SOD" },
  { id: "reddit",   name: "Reddit",   handle: "u/jr_SOD",       href: "https://www.reddit.com/user/jr_SOD/" },
  { id: "tumblr",   name: "Tumblr",   handle: "@jrivera-sod",   href: "https://www.tumblr.com/blog/jrivera-sod" },
  { id: "facebook", name: "Facebook", handle: "Shade of Design",href: "https://www.facebook.com/profile.php?id=61590179799757" },
];

/* Icon set — single-color monoline, matches Space Grotesk weight.
   Each receives `size` and `className`. */
const ICONS = {
  itch: (p) => (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6.5 5 3.5h14L21 6.5v3a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2v-3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M5 11.2V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7.8" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9.5 14h5l-.6 2.5a1 1 0 0 1-1 .8h-1.8a1 1 0 0 1-1-.8L9.5 14Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  twitter: (p) => (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4 10.6 13 4.4 20h2.1l5.2-5.9L16 20h4l-7-9.4L19.6 4H17.5l-4.8 5.4L9 4H4Z" fill="currentColor"/>
    </svg>
  ),
  reddit: (p) => (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="13.5" r="7.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="20" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M14.5 7.5 16 4.6l2.6 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="9.3" cy="13" r="1" fill="currentColor"/>
      <circle cx="14.7" cy="13" r="1" fill="currentColor"/>
      <path d="M9 16.4c1 .9 2 1.2 3 1.2s2-.3 3-1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="4.5" cy="12" r="1.4" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="19.5" cy="12" r="1.4" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  tumblr: (p) => (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 3v4h4v3.5h-4v6c0 1.2.7 1.8 2 1.8h2V22h-3.5c-3 0-4.5-1.5-4.5-4.5v-7H7.5V7.5c2.4-.4 3.4-2 3.7-4.5H14Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  facebook: (p) => (
    <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13.5 21v-7.5H16l.5-3h-3v-2c0-.9.3-1.5 1.5-1.5H17V4.2C16.6 4.1 15.6 4 14.5 4 12 4 10.5 5.5 10.5 8v2.5H8v3h2.5V21h3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
};
function SocialIcon({ id, size = 20 }) {
  const I = ICONS[id];
  return I ? <I size={size} /> : <span style={{width:size, height:size, display:"inline-block", border:"1px solid currentColor", borderRadius:4}} />;
}

/* Project tiles ------------------------------------------------ */
const PROJECTS = [
  {
    n: "01",
    kicker: "Artist · Music",
    title: "Jahna",
    blurb: "Lo-fi for cozy streams and quiet rooms.",
    href: "https://jahna.lovable.app/#music",
    status: "live",
    accent: "ocean",
  },
  {
    n: "02",
    kicker: "Built with Claude · Tool",
    title: "Horizon Search",
    blurb: "Looking past the first page.",
    href: "https://horizonsearchfrontend-production.up.railway.app/",
    status: "live",
    accent: "slate",
  },
  {
    n: "03",
    kicker: "Artist · Listen",
    title: "Lofi Sanctuary",
    blurb: "A place to land. Calm, intentional listening.",
    href: "https://lfsjbeats.netlify.app/",
    status: "live",
    accent: "ember",
  },
];

function ProjectTile({ p }) {
  const isSoon = p.status === "soon";
  const Tag = isSoon ? "div" : "a";
  return (
    <Tag
      className={"tile tile-" + p.accent + (isSoon ? " tile-soon" : "")}
      {...(!isSoon && { href: p.href, target: "_blank", rel: "noopener noreferrer" })}
      aria-label={p.title}
    >
      <div className="tile-head">
        <span className="tile-n">{p.n}</span>
        <span className={"tile-status " + p.status}>
          <span className="dot" />
          {isSoon ? "In formation" : "Live"}
        </span>
      </div>

      <div className="tile-art" aria-hidden="true">
        <TileArt accent={p.accent} />
      </div>

      <div className="tile-foot">
        <p className="tile-kicker">{p.kicker}</p>
        <h3 className="tile-title">{p.title}</h3>
        <p className="tile-blurb">{p.blurb}</p>
        <span className="tile-arrow">
          {isSoon ? "Coming soon" : "Visit"}
          <Arrow />
        </span>
      </div>
    </Tag>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7h9M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Per-tile abstract art using brand colors only.
   Three different compositions so the row reads as a system, not a repeat. */
function TileArt({ accent }) {
  if (accent === "ocean") {
    // Concentric waves — music
    return (
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" style={{width:"100%", height:"100%"}}>
        <defs>
          <linearGradient id="oc" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#1A3E62" />
            <stop offset="100%" stopColor="#5D809D" />
          </linearGradient>
        </defs>
        <rect width="400" height="200" fill="url(#oc)" />
        {[0,1,2,3,4,5].map(i => (
          <circle key={i} cx="320" cy="160" r={40 + i*32} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        ))}
        <circle cx="320" cy="160" r="10" fill="#E4A57E" />
      </svg>
    );
  }
  if (accent === "slate") {
    // Grid + scanning line — search
    return (
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" style={{width:"100%", height:"100%"}}>
        <rect width="400" height="200" fill="#5D809D" />
        <g stroke="rgba(255,255,255,0.18)" strokeWidth="1">
          {Array.from({length:9}).map((_,i)=>(<line key={"v"+i} x1={i*44+12} y1="0" x2={i*44+12} y2="200" />))}
          {Array.from({length:5}).map((_,i)=>(<line key={"h"+i} x1="0" y1={i*44+12} x2="400" y2={i*44+12} />))}
        </g>
        <circle cx="180" cy="100" r="42" fill="none" stroke="#FAFAF7" strokeWidth="2.5" />
        <line x1="212" y1="132" x2="244" y2="164" stroke="#FAFAF7" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="180" cy="100" r="42" fill="rgba(201,123,74,0.18)" />
      </svg>
    );
  }
  // ember — sun / horizon for sanctuary
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" style={{width:"100%", height:"100%"}}>
      <defs>
        <linearGradient id="em" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#E4A57E" />
          <stop offset="100%" stopColor="#C97B4A" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#em)" />
      <circle cx="200" cy="160" r="80" fill="#FAFAF7" opacity="0.92" />
      <rect x="0" y="155" width="400" height="60" fill="#1A3E62" />
      {[0,1,2,3].map(i=>(
        <line key={i} x1="0" y1={170 + i*8} x2="400" y2={170 + i*8} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      ))}
    </svg>
  );
}

/* App ---------------------------------------------------------- */
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme || "light");
  }, [t.theme]);

  return (
    <div className="lp">
      <header className="lp-header">
        <a href="brand-system.html" className="brand" aria-label="Shade of Design brand system">
          <img src="assets/logo-mark.png" alt="" className="brand-mark" />
          <div className="brand-meta">
            <div className="brand-name">Shade of Design</div>
            <div className="brand-sub">LLC in formation · 2026</div>
          </div>
        </a>
        <nav className="lp-nav">
          <a href="brand-system.html" className="navlink">Brand system</a>
          <span className="navlink-sep">·</span>
          <a href="weekly.html" className="navlink">Weekly</a>
          <span className="navlink-sep">·</span>
          <a href="#work" className="navlink">Who we support</a>
          <span className="navlink-sep">·</span>
          <a href="#find" className="navlink">Find us</a>
        </nav>
      </header>

      <main className="lp-main">
        <section className="lp-hero">
          <span className="eyebrow">Strategy · Design · Connection</span>
          <h1 className="lp-h1">
            Connecting people with the <em>services</em> they need.
          </h1>
          <p className="lp-sub">
            A studio in formation. {PROJECTS.length} creators we support, below.
          </p>
        </section>

        <section className="lp-work" id="work">
          <div className="work-head">
            <span className="work-label">Creators we support · {String(PROJECTS.length).padStart(2, "0")}</span>
            <span className="work-rule" />
          </div>
          <div className="tiles">
            {PROJECTS.map((p) => (<ProjectTile p={p} key={p.n} />))}
          </div>
        </section>

        <section className="lp-find" id="find">
          <div className="work-head">
            <span className="work-label">Where to find us · {String(SOCIALS.length).padStart(2,"0")}</span>
            <span className="work-rule" />
          </div>
          <p className="find-note">
            We all have to start somewhere. I am at zero. But the urge to act can
            be for creation or support &mdash; and I hope I can be supported as I learn
            to support others through my beginning.
          </p>
          <ul className="socials">
            {SOCIALS.map((s) => (
              <li key={s.id}>
                <a className="social-card" href={s.href} target="_blank" rel="noopener noreferrer">
                  <span className="social-icon"><SocialIcon id={s.id} size={22} /></span>
                  <span className="social-text">
                    <span className="social-name">{s.name}</span>
                    <span className="social-handle">{s.handle}</span>
                  </span>
                  <span className="social-arrow"><Arrow /></span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="lp-foot">
        <span>© 2026 Shade of Design</span>
        <ul className="foot-socials" aria-label="Social links">
          {SOCIALS.map((s) => (
            <li key={s.id}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name + " · " + s.handle}>
                <SocialIcon id={s.id} size={16} />
              </a>
            </li>
          ))}
        </ul>
        <span className="foot-meta">v0.2 · Landing</span>
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
