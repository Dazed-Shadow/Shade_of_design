/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakRadio,
   OverviewSection, LogoSection, ColorSection, TypeSection,
   ComponentsSection, VoiceSection, MissionSection */
const { useState, useEffect } = React;

const TABS = [
  { id:"overview",   label:"Overview",     idx:"01" },
  { id:"logo",       label:"Logo",         idx:"02" },
  { id:"color",      label:"Color",        idx:"03" },
  { id:"type",       label:"Typography",   idx:"04" },
  { id:"components", label:"Components",   idx:"05" },
  { id:"voice",      label:"Voice & Tone", idx:"06" },
  { id:"mission",    label:"Mission",      idx:"07" },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light"
}/*EDITMODE-END*/;

function App() {
  const [tab, setTab] = useState("overview");
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme || "light");
  }, [t.theme]);

  const render = {
    overview:   <OverviewSection />,
    logo:       <LogoSection />,
    color:      <ColorSection />,
    type:       <TypeSection />,
    components: <ComponentsSection />,
    voice:      <VoiceSection />,
    mission:    <MissionSection />,
  }[tab];

  return (
    <div className="app">
      <header className="shell-header">
        <div className="brand">
          <img src="assets/logo-mark.png" alt="" className="brand-mark" />
          <div className="brand-meta">
            <div className="brand-name">Shade of Design</div>
            <div className="brand-sub">Brand System &middot; v0.1</div>
          </div>
        </div>
        <div className="doc-meta">
          <span>Doc <b>SOD-BS-01</b></span>
          <span>Updated <b>2026.05.23</b></span>
          <span>Owner <b>Mr. C.</b></span>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Design system sections">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            className={"tab " + (tab === tb.id ? "is-active" : "")}
            onClick={() => setTab(tb.id)}
          >
            <span className="tab-idx">{tb.idx}</span>
            {tb.label}
          </button>
        ))}
      </nav>

      <main key={tab} className="tab-panel">
        {render}
      </main>

      <footer className="shell-foot">
        <span>Shade of Design &mdash; LLC in formation</span>
        <span>Strategy &middot; Design &middot; Connection</span>
      </footer>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Surface">
          <TweakRadio
            label="Theme"
            value={t.theme}
            onChange={(v) => setTweak("theme", v)}
            options={[
              { value:"light", label:"Light" },
              { value:"dark",  label:"Dark"  },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
