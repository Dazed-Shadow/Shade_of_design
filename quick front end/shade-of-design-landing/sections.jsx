/* global React */
const { Fragment, useState } = React;

/* ============================================================
   OVERVIEW
   ============================================================ */
function OverviewSection() {
  return (
    <div className="section">
      <div className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Brand System &mdash; v0.1</span>
          <h1>A <em>steady hand</em> for founders building something fragile.</h1>
          <p className="hero-lede">
            Shade of Design is a strategy &amp; design hybrid practice that connects
            people with the services they need to move forward. This document
            defines how the brand looks, sounds, and shows up.
          </p>
          <div className="comp-row">
            <button className="btn btn-primary btn-lg">Read the system</button>
            <button className="btn btn-secondary btn-lg">Download assets</button>
          </div>
          <div className="hero-meta">
            <div><span className="k">Version</span><span className="v">0.1 / Draft</span></div>
            <div><span className="k">Status</span><span className="v">Internal</span></div>
            <div><span className="k">Owner</span><span className="v">Mr. C.</span></div>
          </div>
        </div>
        <div className="hero-mark">
          <img src="assets/logo-mark.png" alt="Shade of Design shield mark" />
        </div>
      </div>

      <div className="grid-3">
        <div className="card-quiet">
          <p className="card-title">What we are</p>
          <p style={{margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)"}}>
            A strategy + design hybrid LLC. We help founders find clarity, structure,
            and the right people &mdash; faster than they can alone.
          </p>
        </div>
        <div className="card-quiet">
          <p className="card-title">Who we serve</p>
          <p style={{margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)"}}>
            Early-stage founders building service-oriented businesses who need a
            steady creative partner, not a vendor.
          </p>
        </div>
        <div className="card-quiet">
          <p className="card-title">How we work</p>
          <p style={{margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)"}}>
            In short, honest engagements. Strategy first, then visual system,
            then the connections that turn it into a working business.
          </p>
        </div>
      </div>

      <div className="rule-label">Brand pillars <span></span></div>
      <div className="grid-3">
        {[
          {n:"01", t:"Shelter", d:"We protect founders' time, attention, and original thinking. The shield is literal."},
          {n:"02", t:"Signal", d:"We sharpen the message until the right people find it &mdash; clients, hires, partners."},
          {n:"03", t:"Spark", d:"We move things from dormant to lit. The flame in the mark is intentional."},
        ].map((p) => (
          <div className="card" key={p.n}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
              <h3 style={{margin:0, fontSize:22, letterSpacing:"-0.015em"}}>{p.t}</h3>
              <span className="chip">{p.n}</span>
            </div>
            <p style={{margin:"12px 0 0", color:"var(--ink-soft)", fontSize:14, lineHeight:1.55}}
               dangerouslySetInnerHTML={{__html:p.d}} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   LOGO
   ============================================================ */
function LogoSection() {
  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">02 &mdash; Logo &amp; Mark</span>
        <h2 className="section-title">The mark is a shield that grew leaves.</h2>
        <p className="section-lede">
          Two readings on purpose: <strong>protection</strong> (shield silhouette,
          confident "S" form) and <strong>growth</strong> (the leaves and rising flame).
          That tension is the brand &mdash; safe enough to trust, alive enough to bet on.
        </p>
      </div>

      <div className="grid-2">
        <div className="logo-plate plate-paper">
          <span className="label">Primary &mdash; lockup</span>
          <img src="assets/logo-lockup.png" alt="Shade of Design horizontal lockup" />
        </div>
        <div className="logo-plate plate-paper">
          <span className="label">Mark only &mdash; monogram</span>
          <img src="assets/logo-mark.png" alt="Shade of Design shield mark" style={{maxHeight:170, maxWidth:170}} />
        </div>
        <div className="logo-plate plate-ocean">
          <span className="label">Reverse &mdash; on Deep Ocean</span>
          <img src="assets/logo-mark.png" alt="" style={{maxHeight:170, maxWidth:170, filter:"brightness(0) invert(1)"}} />
        </div>
        <div className="logo-plate plate-ember">
          <span className="label">Accent &mdash; on Ember Clay</span>
          <img src="assets/logo-mark.png" alt="" style={{maxHeight:170, maxWidth:170, filter:"brightness(0) invert(1)"}} />
        </div>
      </div>

      <div className="rule-label">Clearspace &amp; minimum size <span></span></div>
      <div className="grid-2">
        <div className="card">
          <p className="card-title">Clearspace</p>
          <div style={{
            position:"relative", padding:"32px", background:"var(--paper)",
            border:"1px dashed var(--slate)", borderRadius:8, display:"grid", placeItems:"center"
          }}>
            <img src="assets/logo-mark.png" alt="" style={{height:120}} />
            {/* Clearspace markers */}
            <span style={{position:"absolute", top:8, left:"50%", transform:"translateX(-50%)", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--slate)"}}>= X</span>
            <span style={{position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--slate)"}}>= X</span>
            <span style={{position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--slate)"}}>= X</span>
            <span style={{position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--slate)"}}>= X</span>
          </div>
          <p style={{margin:"14px 0 0", fontSize:13.5, color:"var(--ink-soft)", lineHeight:1.55}}>
            Maintain a clear margin equal to <span className="chip">X = the height of the leaf detail</span> on
            all sides. Never crowd the mark with typography or photography.
          </p>
        </div>
        <div className="card">
          <p className="card-title">Minimum size</p>
          <div style={{display:"flex", alignItems:"end", gap:24, padding:"24px 8px"}}>
            <div style={{textAlign:"center"}}>
              <img src="assets/logo-mark.png" alt="" style={{height:64, display:"block", margin:"0 auto"}} />
              <span style={{fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginTop:8, display:"block"}}>64 PX &mdash; UI</span>
            </div>
            <div style={{textAlign:"center"}}>
              <img src="assets/logo-mark.png" alt="" style={{height:40, display:"block", margin:"0 auto"}} />
              <span style={{fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginTop:8, display:"block"}}>40 PX &mdash; FAVICON</span>
            </div>
            <div style={{textAlign:"center"}}>
              <img src="assets/logo-mark.png" alt="" style={{height:24, display:"block", margin:"0 auto"}} />
              <span style={{fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginTop:8, display:"block"}}>24 PX &mdash; MIN</span>
            </div>
          </div>
          <p style={{margin:"14px 0 0", fontSize:13.5, color:"var(--ink-soft)", lineHeight:1.55}}>
            Below 24px the mark loses its leaves. For tighter contexts use a single-color
            shield silhouette instead.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COLOR
   ============================================================ */
function ColorSection() {
  const palette = [
    { name:"Deep Ocean", role:"Primary", hex:"#1A3E62", rgb:"26 62 98", use:"Headlines, primary buttons, brand surfaces, logo ink.", bg:"#1A3E62", light:false },
    { name:"Slate Blue", role:"Secondary", hex:"#5D809D", rgb:"93 128 157", use:"Secondary elements, borders, supporting accents, captions.", bg:"#5D809D", light:false },
    { name:"Ember Clay", role:"Accent", hex:"#C97B4A", rgb:"201 123 74", use:"Highlights, CTAs that need warmth, callouts. Use sparingly.", bg:"#C97B4A", light:false },
    { name:"Soft Grey", role:"Surface", hex:"#F3F4F6", rgb:"243 244 246", use:"Page background, secondary surfaces, low-contrast separators.", bg:"#F3F4F6", light:true },
    { name:"Paper", role:"Surface", hex:"#FAFAF7", rgb:"250 250 247", use:"Cards, content blocks, photography backdrops.", bg:"#FAFAF7", light:true },
    { name:"Ink", role:"Text", hex:"#0B1726", rgb:"11 23 38", use:"Body text on light, dark mode background.", bg:"#0B1726", light:false },
  ];

  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">03 &mdash; Color</span>
        <h2 className="section-title">Cool, steady blues. One warm note.</h2>
        <p className="section-lede">
          Deep Ocean and Slate carry the institutional weight. Ember Clay is a single
          warm accent that keeps the brand from feeling clinical &mdash; it&apos;s the human note
          against the shield.
        </p>
      </div>

      <div className="grid-3">
        {palette.map((c) => (
          <div className="swatch-card" key={c.name}>
            <div className={"swatch-color " + (c.light ? "light" : "")} style={{background:c.bg}}>
              <span className="role">{c.role}</span>
            </div>
            <div className="swatch-meta">
              <p className="swatch-name">{c.name}</p>
              <p className="swatch-hex">HEX {c.hex} &middot; RGB {c.rgb}</p>
              <p className="swatch-use">{c.use}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rule-label">Usage ratio <span></span></div>
      <div className="card" style={{padding: "var(--s-6)"}}>
        <div style={{display:"flex", borderRadius:8, overflow:"hidden", height:48}}>
          <div style={{flex:"60", background:"var(--paper)", display:"grid", placeItems:"center", color:"var(--ink-soft)", fontFamily:"var(--font-mono)", fontSize:11}}>60% &middot; SURFACE</div>
          <div style={{flex:"25", background:"var(--ocean)", display:"grid", placeItems:"center", color:"#fff", fontFamily:"var(--font-mono)", fontSize:11}}>25% &middot; DEEP OCEAN</div>
          <div style={{flex:"10", background:"var(--slate)", display:"grid", placeItems:"center", color:"#fff", fontFamily:"var(--font-mono)", fontSize:11}}>10% &middot; SLATE</div>
          <div style={{flex:"5", background:"var(--ember)", display:"grid", placeItems:"center", color:"#fff", fontFamily:"var(--font-mono)", fontSize:11}}>5%</div>
        </div>
        <p style={{margin:"16px 0 0", color:"var(--ink-soft)", fontSize:13.5, lineHeight:1.55}}>
          A healthy Shade of Design page is mostly surface, anchored by Deep Ocean,
          accented by Slate, and punctuated &mdash; never dominated &mdash; by Ember.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   TYPOGRAPHY
   ============================================================ */
function TypeSection() {
  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">04 &mdash; Typography</span>
        <h2 className="section-title">Space Grotesk + JetBrains Mono.</h2>
        <p className="section-lede">
          Space Grotesk handles every voice &mdash; from quiet body to confident headlines.
          JetBrains Mono carries the technical register: labels, captions, metadata,
          and anywhere we want the brand to feel precise.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <p className="card-title">Primary &mdash; Space Grotesk</p>
          <div style={{fontFamily:"var(--font-sans)", fontSize:72, lineHeight:1, letterSpacing:"-0.03em", color:"var(--ocean)", fontWeight:600}}>Aa</div>
          <p style={{fontFamily:"var(--font-sans)", letterSpacing:"0.04em", color:"var(--ink-soft)", margin:"16px 0 0", fontSize:13}}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
            abcdefghijklmnopqrstuvwxyz<br />
            0123456789 &amp;@#$%
          </p>
          <p style={{margin:"16px 0 0", color:"var(--muted)", fontSize:12.5}}>Weights used: 400, 500, 600, 700.</p>
        </div>
        <div className="card">
          <p className="card-title">Mono &mdash; JetBrains Mono</p>
          <div style={{fontFamily:"var(--font-mono)", fontSize:72, lineHeight:1, letterSpacing:"-0.02em", color:"var(--ember)", fontWeight:500}}>{"</>"}</div>
          <p style={{fontFamily:"var(--font-mono)", color:"var(--ink-soft)", margin:"16px 0 0", fontSize:12.5}}>
            01_LABEL &middot; 02_META<br />
            $ founders.list --sort=urgency<br />
            v0.1 / DRAFT / 2026.05
          </p>
          <p style={{margin:"16px 0 0", color:"var(--muted)", fontSize:12.5}}>Weights used: 400, 500.</p>
        </div>
      </div>

      <div className="card" style={{padding:"var(--s-8)"}}>
        <div className="type-row">
          <div className="type-meta">
            <span>Display</span>
            <b>64 / 60 &middot; 600</b>
            <span>tracking -3.5%</span>
          </div>
          <div className="type-sample" style={{fontSize:64, fontWeight:600, letterSpacing:"-0.035em", lineHeight:0.98}}>
            Shade of Design
          </div>
        </div>
        <div className="type-row">
          <div className="type-meta">
            <span>H1 &mdash; Headline</span>
            <b>40 / 44 &middot; 600</b>
            <span>tracking -2.5%</span>
          </div>
          <div className="type-sample" style={{fontSize:40, fontWeight:600, letterSpacing:"-0.025em", lineHeight:1.1}}>
            A steady hand for founders.
          </div>
        </div>
        <div className="type-row">
          <div className="type-meta">
            <span>H2 &mdash; Section</span>
            <b>28 / 34 &middot; 600</b>
            <span>tracking -1.5%</span>
          </div>
          <div className="type-sample" style={{fontSize:28, fontWeight:600, letterSpacing:"-0.015em", lineHeight:1.2}}>
            Strategy, design, and the people in between.
          </div>
        </div>
        <div className="type-row">
          <div className="type-meta">
            <span>H3 &mdash; Block</span>
            <b>20 / 28 &middot; 600</b>
            <span>tracking -1%</span>
          </div>
          <div className="type-sample" style={{fontSize:20, fontWeight:600, letterSpacing:"-0.01em", lineHeight:1.4}}>
            We work in short, honest engagements.
          </div>
        </div>
        <div className="type-row">
          <div className="type-meta">
            <span>Body &mdash; Long-form</span>
            <b>16 / 26 &middot; 400</b>
            <span>tracking 0</span>
          </div>
          <div className="type-sample" style={{fontSize:16, lineHeight:1.6, color:"var(--ink-soft)", maxWidth:"54ch"}}>
            Most founders don&apos;t need more &mdash; they need someone who can hold the shape
            of the whole thing while they focus on the next decision. That&apos;s what we do.
          </div>
        </div>
        <div className="type-row">
          <div className="type-meta">
            <span>Caption</span>
            <b>13 / 20 &middot; 500</b>
            <span>tracking 0</span>
          </div>
          <div className="type-sample" style={{fontSize:13, color:"var(--muted)", lineHeight:1.5}}>
            Supporting detail, captions, and helper text for forms.
          </div>
        </div>
        <div className="type-row">
          <div className="type-meta">
            <span>Mono Label</span>
            <b>11 / 16 &middot; 500</b>
            <span>tracking +10%</span>
          </div>
          <div className="type-sample" style={{fontFamily:"var(--font-mono)", fontSize:11, color:"var(--ember)", letterSpacing:"0.10em", textTransform:"uppercase"}}>
            04 &mdash; Typography hierarchy
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTS
   ============================================================ */
function ComponentsSection() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Mr. C.");
  const [need, setNeed] = useState("strategy");

  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">05 &mdash; Components</span>
        <h2 className="section-title">The kit, kept small on purpose.</h2>
        <p className="section-lede">
          A tight set of buttons, inputs, and surface treatments. Everything else
          composes from these. When something feels missing, we resist adding to the
          kit until we&apos;ve seen the need three times.
        </p>
      </div>

      <div className="comp-block">
        <div className="comp-title-row">
          <h3>Buttons</h3>
          <span className="chip">5 variants &middot; 3 sizes</span>
        </div>
        <div>
          <p className="rule-label" style={{margin:0}}>Primary &mdash; Deep Ocean <span></span></p>
          <div className="comp-row" style={{marginTop:12}}>
            <button className="btn btn-primary btn-sm">Small</button>
            <button className="btn btn-primary">Default</button>
            <button className="btn btn-primary btn-lg">Large</button>
            <button className="btn btn-primary" disabled style={{opacity:0.4, cursor:"not-allowed"}}>Disabled</button>
          </div>
        </div>
        <div>
          <p className="rule-label" style={{margin:0}}>Secondary &mdash; Outlined <span></span></p>
          <div className="comp-row" style={{marginTop:12}}>
            <button className="btn btn-secondary btn-sm">Small</button>
            <button className="btn btn-secondary">Default</button>
            <button className="btn btn-secondary btn-lg">Large</button>
          </div>
        </div>
        <div>
          <p className="rule-label" style={{margin:0}}>Warm &mdash; Ember accent (use sparingly) <span></span></p>
          <div className="comp-row" style={{marginTop:12}}>
            <button className="btn btn-warm">Book a call</button>
            <button className="btn btn-ghost">Or keep reading</button>
          </div>
        </div>
      </div>

      <div className="comp-block">
        <div className="comp-title-row">
          <h3>Form &mdash; example intake</h3>
          <span className="chip chip-warm">live</span>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="i-name">Your name</label>
            <input id="i-name" className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="First &amp; last" />
            <span className="help">How should we address you?</span>
          </div>
          <div className="field">
            <label htmlFor="i-email">Email</label>
            <input id="i-email" className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="founder@yourcompany.com" />
            <span className="help">We respond within one business day.</span>
          </div>
          <div className="field">
            <label htmlFor="i-need">What do you need most?</label>
            <select id="i-need" className="select" value={need} onChange={(e)=>setNeed(e.target.value)}>
              <option value="strategy">A clearer strategy</option>
              <option value="brand">A brand identity</option>
              <option value="connect">An introduction to the right people</option>
              <option value="other">Something else &mdash; I&apos;ll explain</option>
            </select>
            <span className="help">Tell us where you are, not where you want to look.</span>
          </div>
          <div className="field">
            <label htmlFor="i-context">A sentence of context</label>
            <textarea id="i-context" className="textarea" rows={3} placeholder="What are you building, and what&apos;s in the way?" />
          </div>
        </div>
        <div className="comp-row" style={{justifyContent:"flex-end"}}>
          <button className="btn btn-ghost">Save draft</button>
          <button className="btn btn-primary">Send intake</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="comp-block">
          <h3>Chips &amp; tags</h3>
          <div className="comp-row">
            <span className="chip">strategy</span>
            <span className="chip">brand</span>
            <span className="chip chip-warm">new</span>
            <span className="chip">v0.1</span>
            <span className="chip">connect</span>
          </div>
        </div>
        <div className="comp-block">
          <h3>Card</h3>
          <div className="card-quiet" style={{padding:"var(--s-5)"}}>
            <p className="card-title">Engagement &mdash; Sprint</p>
            <p style={{margin:"4px 0 var(--s-3)", fontSize:18, fontWeight:600, letterSpacing:"-0.01em"}}>
              Two weeks. One question answered.
            </p>
            <p style={{margin:0, fontSize:14, color:"var(--ink-soft)", lineHeight:1.55}}>
              For founders who need a decision, not a deck. Fixed-scope, fixed-fee.
            </p>
            <div className="comp-row" style={{marginTop: "var(--s-4)"}}>
              <button className="btn btn-secondary btn-sm">Learn more</button>
              <span className="chip">$$</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VOICE
   ============================================================ */
function VoiceSection() {
  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">06 &mdash; Voice &amp; Tone</span>
        <h2 className="section-title">Plain, warm, exact. Never performative.</h2>
        <p className="section-lede">
          Founders are tired of jargon and overpromising. The voice should sound
          like a calm advisor who&apos;s already done the work &mdash; not a brand strategist
          trying to impress them.
        </p>
      </div>

      <div className="vt-grid">
        <div className="vt-card">
          <h4>Plain over polished</h4>
          <p style={{margin:0, color:"var(--ink-soft)", fontSize:14, lineHeight:1.55}}>
            Write the way a smart friend would talk. Short sentences are fine.
            Resist adverbs and dramatic openers.
          </p>
          <p className="we">We say</p>
          <p className="voice-example">&ldquo;Most founders don&apos;t need a brand yet. They need a decision.&rdquo;</p>
          <p className="not">We don&apos;t say</p>
          <p className="voice-example" style={{borderLeftColor:"var(--danger)"}}>
            &ldquo;Our holistic brand thinking unlocks transformative growth for ambitious founders.&rdquo;
          </p>
        </div>

        <div className="vt-card">
          <h4>Specific over sweeping</h4>
          <p style={{margin:0, color:"var(--ink-soft)", fontSize:14, lineHeight:1.55}}>
            Replace category words (&ldquo;solutions&rdquo;, &ldquo;experiences&rdquo;) with the actual
            thing. Use numbers when they matter.
          </p>
          <p className="we">We say</p>
          <p className="voice-example">&ldquo;Two weeks. One question answered. $7,500.&rdquo;</p>
          <p className="not">We don&apos;t say</p>
          <p className="voice-example" style={{borderLeftColor:"var(--danger)"}}>
            &ldquo;Tailored engagement packages designed around your unique business needs.&rdquo;
          </p>
        </div>

        <div className="vt-card">
          <h4>Confident, never loud</h4>
          <p style={{margin:0, color:"var(--ink-soft)", fontSize:14, lineHeight:1.55}}>
            Make claims you can stand behind. No exclamation marks, no all-caps,
            no startup hype words (&ldquo;crushing&rdquo;, &ldquo;blazing&rdquo;, &ldquo;disruptive&rdquo;).
          </p>
          <p className="we">We say</p>
          <p className="voice-example">&ldquo;We&apos;ve done this fourteen times. It still surprises us.&rdquo;</p>
          <p className="not">We don&apos;t say</p>
          <p className="voice-example" style={{borderLeftColor:"var(--danger)"}}>
            &ldquo;The #1 best-in-class growth partner for next-gen founders!!&rdquo;
          </p>
        </div>

        <div className="vt-card">
          <h4>Human, on purpose</h4>
          <p style={{margin:0, color:"var(--ink-soft)", fontSize:14, lineHeight:1.55}}>
            We&apos;re a connector, not a vendor. Use &ldquo;we&rdquo; and &ldquo;you&rdquo;. Mention real people
            when you can. Say &ldquo;don&apos;t know&rdquo; when you don&apos;t.
          </p>
          <p className="we">We say</p>
          <p className="voice-example">&ldquo;If we&apos;re not the right fit, we know three people who probably are.&rdquo;</p>
          <p className="not">We don&apos;t say</p>
          <p className="voice-example" style={{borderLeftColor:"var(--danger)"}}>
            &ldquo;Our partners ecosystem enables seamless cross-functional alignment.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MISSION
   ============================================================ */
function MissionSection() {
  return (
    <div className="section">
      <div className="section-head">
        <span className="eyebrow">07 &mdash; Mission, Vision, Values</span>
        <h2 className="section-title">Three angles. Pick the one that&apos;s true.</h2>
        <p className="section-lede">
          Three starter mission statements written from different angles &mdash; each
          builds toward the same LLC, but pulls a different lever. Use these as
          drafts to react to, not final copy.
        </p>
      </div>

      <div className="mission-grid">
        <div className="mission-card deep">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <span className="mission-num">ANGLE 01</span>
            <span className="mission-pill">Strategic</span>
          </div>
          <p className="mission-kicker">The shield reading</p>
          <p className="mission-statement">
            We protect early-stage founders from the wrong decisions, so the right
            ones get a chance to compound.
          </p>
          <p className="mission-body">
            Leans into the shield in the mark. Positions Shade of Design as a buffer
            between founders and the noise &mdash; advice, structure, and clarity before
            the expensive mistakes.
          </p>
          <div style={{borderTop:"1px solid var(--border-soft)", paddingTop:"var(--s-3)", marginTop:"var(--s-2)"}}>
            <p style={{fontFamily:"var(--font-mono)", fontSize:10.5, letterSpacing:"0.10em", textTransform:"uppercase", color:"var(--muted)", margin:0}}>Best when&hellip;</p>
            <p style={{margin:"4px 0 0", fontSize:13.5, color:"var(--ink-soft)", lineHeight:1.5}}>
              You want enterprise / institutional clients and a longer engagement model.
            </p>
          </div>
        </div>

        <div className="mission-card warm">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <span className="mission-num">ANGLE 02</span>
            <span className="mission-pill">Connective</span>
          </div>
          <p className="mission-kicker">The matchmaker reading</p>
          <p className="mission-statement">
            We connect people who need help with the people who can actually help &mdash;
            and design the bridge between them.
          </p>
          <p className="mission-body">
            Leans into &ldquo;connecting people with service.&rdquo; Positions Shade of Design as
            the human layer of a service economy &mdash; part advisor, part network, part
            curator. Most differentiated of the three.
          </p>
          <div style={{borderTop:"1px solid var(--border-soft)", paddingTop:"var(--s-3)", marginTop:"var(--s-2)"}}>
            <p style={{fontFamily:"var(--font-mono)", fontSize:10.5, letterSpacing:"0.10em", textTransform:"uppercase", color:"var(--muted)", margin:0}}>Best when&hellip;</p>
            <p style={{margin:"4px 0 0", fontSize:13.5, color:"var(--ink-soft)", lineHeight:1.5}}>
              You want to scale through introductions and a vetted partner network.
            </p>
          </div>
        </div>

        <div className="mission-card slate">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <span className="mission-num">ANGLE 03</span>
            <span className="mission-pill">Catalytic</span>
          </div>
          <p className="mission-kicker">The spark reading</p>
          <p className="mission-statement">
            We turn quiet ambition into a working business &mdash; with strategy, design,
            and the introductions that move things forward.
          </p>
          <p className="mission-body">
            Leans into the flame in the mark. Positions Shade of Design as a
            momentum partner &mdash; the practice that converts ideas-in-the-drawer into
            shipped, named, paying work.
          </p>
          <div style={{borderTop:"1px solid var(--border-soft)", paddingTop:"var(--s-3)", marginTop:"var(--s-2)"}}>
            <p style={{fontFamily:"var(--font-mono)", fontSize:10.5, letterSpacing:"0.10em", textTransform:"uppercase", color:"var(--muted)", margin:0}}>Best when&hellip;</p>
            <p style={{margin:"4px 0 0", fontSize:13.5, color:"var(--ink-soft)", lineHeight:1.5}}>
              Your sweet spot is solo founders &amp; first-time operators in motion.
            </p>
          </div>
        </div>
      </div>

      <div className="rule-label">Values &mdash; the four we&apos;d defend in a meeting <span></span></div>
      <div className="grid-4">
        {[
          {n:"V1", t:"Clarity", d:"Plain words, named decisions."},
          {n:"V2", t:"Discretion", d:"Founder details stay with the founder."},
          {n:"V3", t:"Honest scope", d:"We say no to work we can&apos;t do well."},
          {n:"V4", t:"Compounding", d:"Small, frequent wins over big swings."},
        ].map((v) => (
          <div className="card-quiet" key={v.n} style={{display:"grid", gap:6}}>
            <span className="chip" style={{justifySelf:"start"}}>{v.n}</span>
            <p style={{margin:"6px 0 0", fontSize:17, fontWeight:600, letterSpacing:"-0.01em"}}>{v.t}</p>
            <p style={{margin:0, fontSize:13.5, color:"var(--ink-soft)", lineHeight:1.5}}
               dangerouslySetInnerHTML={{__html: v.d}} />
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop:"var(--s-6)", background:"var(--ocean)", color:"#fff", borderColor:"var(--ocean)"}}>
        <p style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.10em", textTransform:"uppercase", color:"var(--ember-soft)", margin:"0 0 var(--s-3)"}}>Next step</p>
        <p style={{margin:0, fontSize:22, fontWeight:600, letterSpacing:"-0.015em", lineHeight:1.3, maxWidth:"50ch", textWrap:"balance"}}>
          Pick one angle, then write the first three sentences of the homepage from
          it. The one that&apos;s easiest to write is probably the right one.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Export
   ============================================================ */
Object.assign(window, {
  OverviewSection, LogoSection, ColorSection, TypeSection,
  ComponentsSection, VoiceSection, MissionSection,
});
