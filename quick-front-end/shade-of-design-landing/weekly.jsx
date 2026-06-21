/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark"
}/*EDITMODE-END*/;

/* ---------- helpers ---------- */
function money(n) {
  if (typeof n === "string") return n;
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K";
  return "$" + n;
}
function sum(arr, key) { return arr.reduce((a, r) => a + (r[key] || 0), 0); }
function daysUntil(iso) {
  const target = new Date(iso + "T00:00:00");
  const now = new Date();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}
function urgencyClass(days) {
  if (days <= 7) return "urgent";
  if (days <= 21) return "soon";
  return "";
}
function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ---------- data loader ---------- */
function useWeeklyData() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    (async () => {
      try {
        const idxRes = await fetch("weeks/index.json", { cache: "no-cache" });
        if (!idxRes.ok) throw new Error("index.json not found");
        const idx = await idxRes.json();
        const target = idx.latest || (idx.weeks && idx.weeks[0] && idx.weeks[0].id);
        if (!target) throw new Error("no weeks listed");
        const weekRes = await fetch("weeks/" + target + ".json", { cache: "no-cache" });
        if (!weekRes.ok) throw new Error("week file " + target + " not found");
        const week = await weekRes.json();
        setState({ loading: false, week, index: idx });
      } catch (e) {
        setState({ loading: false, error: e.message });
      }
    })();
  }, []);

  return state;
}

/* ---------- subviews ---------- */
function Masthead({ week }) {
  return (
    <header className="wk-masthead">
      <div className="wk-mast-left">
        <span className="wk-eyebrow">Weekly &middot; {week.label}</span>
        <h1 className="wk-h1">{week.headline}</h1>
        <div className="wk-dateline">
          <span>Dates <b>{week.dateRange}</b></span>
          <span>Published <b>{week.publishedAt}</b></span>
          <span>ID <b>{week.week}</b></span>
        </div>
      </div>
      <aside className="wk-mast-right">
        <h3>
          <span>NAICS tracked</span>
          <span className="rotation-meta">{week.naicsRotation.rotation} &middot; rot {week.naicsRotation.rotatesEvery}</span>
        </h3>
        <ul className="naics-list">
          {week.naicsRotation.tracked.map((n) => (
            <li key={n.code}>
              <span className="code">{n.code}</span>
              <span className="name">{n.name}</span>
            </li>
          ))}
        </ul>
      </aside>
    </header>
  );
}

function Awards({ awards }) {
  const totalAgency = sum(awards.byAgency, "totalValue");
  const totalAgencyCount = sum(awards.byAgency, "count");
  const totalNAICS = sum(awards.byNAICS, "totalValue");
  const totalNAICSCount = sum(awards.byNAICS, "count");

  return (
    <section className="wk-section">
      <div className="wk-shead">
        <span className="label">01 &middot; Awards &mdash; backward-looking</span>
        <span className="rule" />
        <span className="meta">Source: SAM.gov (manual pull)</span>
      </div>
      <div className="awards-grid">
        <div className="awards-card">
          <h4>
            <span>By agency</span>
            <span className="totals">{totalAgencyCount} awards &middot; {money(totalAgency)}</span>
          </h4>
          <table className="awards-table">
            <thead>
              <tr><th>Agency</th><th className="num">Awards</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {awards.byAgency.map((r) => (
                <tr key={r.agency}>
                  <td>{r.agency}</td>
                  <td className="num">{r.count}</td>
                  <td className="num">{money(r.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="awards-card">
          <h4>
            <span>By NAICS</span>
            <span className="totals">{totalNAICSCount} awards &middot; {money(totalNAICS)}</span>
          </h4>
          <table className="awards-table">
            <thead>
              <tr><th>Code</th><th className="num">Awards</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {awards.byNAICS.map((r) => (
                <tr key={r.code}>
                  <td>{r.code}</td>
                  <td className="num">{r.count}</td>
                  <td className="num">{money(r.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {awards.summary && <p style={{margin: 0, fontSize: 13, color: "var(--muted)", fontStyle: "italic"}}>{awards.summary}</p>}
    </section>
  );
}

function Blog({ blog, week }) {
  return (
    <section className="wk-section">
      <div className="wk-shead">
        <span className="label">02 &middot; Blog &mdash; personal log</span>
        <span className="rule" />
        <span className="meta">{week.label}</span>
      </div>
      <div className="wk-blog">
        <div className="side">
          <span className="role">From the desk of</span>
          <span className="author">Mr. C.</span>
          <span className="author-sub">Shade of Design</span>
          <span className="author-sub" style={{marginTop: "var(--s-3)"}}>Reading time</span>
          <span className="author-sub" style={{color: "var(--ink-soft)"}}>
            ~{Math.max(1, Math.round(blog.body.join(" ").split(/\s+/).length / 220))} min
          </span>
        </div>
        <article>
          <h2>{blog.title}</h2>
          {blog.body.map((p, i) => <p key={i}>{p}</p>)}
        </article>
      </div>
    </section>
  );
}

function Contracts({ contracts }) {
  // sort by close date ascending
  const sorted = useMemo(() => {
    return [...contracts].sort((a, b) => a.closeDate.localeCompare(b.closeDate));
  }, [contracts]);

  return (
    <section className="wk-section">
      <div className="wk-shead">
        <span className="label">03 &middot; Contracts closing soon</span>
        <span className="rule" />
        <span className="meta">{contracts.length} listings &middot; sorted by close date</span>
      </div>
      <div className="contracts">
        {sorted.map((c, i) => {
          const days = daysUntil(c.closeDate);
          const cls = urgencyClass(days);
          return (
            <article className="contract" key={i}>
              <div className="contract-head">
                <span className="contract-naics" title={c.naicsName}>NAICS {c.naics}</span>
                <span className={"contract-close " + cls}>
                  Closes <b>{fmtDate(c.closeDate)}</b>{days >= 0 ? <> &middot; in {days}d</> : <> &middot; closed</>}
                </span>
              </div>
              <h3>{c.title}</h3>
              <span className="agency">{c.agency}</span>
              <span className="value">{c.value}</span>
              <p className="desc">{c.description}</p>
              <span className="naics-name">{c.naicsName}</span>
              {c.url && (
                <a href={c.url} className="listing" target="_blank" rel="noopener noreferrer">
                  View listing
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7h9M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Archive({ index, currentId }) {
  if (!index || !index.weeks || index.weeks.length === 0) return null;
  return (
    <section className="wk-section wk-archive">
      <div className="wk-shead">
        <span className="label">Archive &middot; {String(index.weeks.length).padStart(2,"0")}</span>
        <span className="rule" />
      </div>
      <ul>
        {index.weeks.map((w) => {
          const isCurrent = w.id === currentId;
          return (
            <li key={w.id}>
              <a
                href={isCurrent ? "#" : "?week=" + w.id}
                className={isCurrent ? "is-current" : ""}
                onClick={(e) => { if (isCurrent) e.preventDefault(); }}
              >
                <span className="w-id">{w.id}</span>
                <span className="w-label">{w.label}</span>
                <span className="w-tag">{isCurrent ? "current" : "archive"}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- App ---------- */
function App() {
  const data = useWeeklyData();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme || "dark");
  }, [t.theme]);

  return (
    <div className="wk">
      <header className="wk-header">
        <a href="index.html" className="brand">
          <img src="assets/logo-mark.png" alt="" className="brand-mark" />
          <div className="brand-meta">
            <div className="brand-name">Shade of Design</div>
            <div className="brand-sub">Weekly &middot; Personal log</div>
          </div>
        </a>
        <nav className="wk-nav">
          <a href="index.html" className="navlink">Home</a>
          <span className="navlink-sep">·</span>
          <a href="brand-system.html" className="navlink">Brand system</a>
          <span className="navlink-sep">·</span>
          <a href="weekly.html" className="navlink is-here">Weekly</a>
        </nav>
      </header>

      <main className="wk-main">
        {data.loading && <div className="wk-loading">Loading week&hellip;</div>}

        {data.error && (
          <div className="wk-error">
            Couldn&rsquo;t load weekly data: {data.error}
            <span className="hint">
              If you&rsquo;re opening this file directly, browsers block <code>fetch()</code> on <code>file://</code> URLs.
              Run a local server (<code>python3 -m http.server</code>) or push to Netlify.
            </span>
          </div>
        )}

        {data.week && (
          <>
            <Masthead week={data.week} />
            <Awards awards={data.week.awards} />
            <Blog blog={data.week.blog} week={data.week} />
            <Contracts contracts={data.week.contracts} />
            <Archive index={data.index} currentId={data.week.week} />
          </>
        )}
      </main>

      <footer className="wk-foot">
        <span>© 2026 Shade of Design</span>
        <span className="foot-meta">Weekly &middot; v0.1</span>
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
