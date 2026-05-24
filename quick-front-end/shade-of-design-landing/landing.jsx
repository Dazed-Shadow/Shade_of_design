/* global React, ReactDOM */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light"
}/*EDITMODE-END*/;

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
    blurb: "A place to land. Hosting soon.",
    href: null,
    status: "soon",
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
        <a href="Shade of Design — Brand System.html" className="brand" aria-label="Shade of Design brand system">
          <img src="assets/logo-mark.png" alt="" className="brand-mark" />
          <div className="brand-meta">
            <div className="brand-name">Shade of Design</div>
            <div className="brand-sub">LLC in formation · 2026</div>
          </div>
        </a>
        <nav className="lp-nav">
          <a href="Shade of Design — Brand System.html" className="navlink">Brand system</a>
          <span className="navlink-sep">·</span>
          <a href="#work" className="navlink">Who we support</a>
        </nav>
      </header>

      <main className="lp-main">
        <section className="lp-hero">
          <span className="eyebrow">Strategy · Design · Connection</span>
          <h1 className="lp-h1">
            Connecting people with the <em>services</em> they need.
          </h1>
          <p className="lp-sub">
            A studio in formation. Three creators we support, below.
          </p>
        </section>

        <section className="lp-work" id="work">
          <div className="work-head">
            <span className="work-label">Creators we support · 03</span>
            <span className="work-rule" />
          </div>
          <div className="tiles">
            {PROJECTS.map((p) => (<ProjectTile p={p} key={p.n} />))}
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <span>© 2026 Shade of Design</span>
        <span className="foot-meta">v0.1 · Landing</span>
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
