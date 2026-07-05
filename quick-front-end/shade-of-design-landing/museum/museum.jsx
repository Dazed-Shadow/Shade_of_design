/* global React, ReactDOM */
/*
 * SoD Museum — app shell: threshold, hash sub-router, capability check,
 * 3D scene mount, 2D fallback dispatch, waypoint accessibility overlay.
 *
 * Runtime pattern locked at D-030 (see pipeline/DECISIONS.md): CDN UMD +
 * Babel-standalone, no bundler, no ES modules, no React Router. Full
 * rationale for every deviation from the original C1/C2 arch specs lives in
 * the session logs at Terminal/Central Hub/SOD MUSEUM/session-logs/.
 *
 * C2 addition: Three.js is injected via dynamic <script src> at the
 * threshold action (not React.lazy — no module graph exists to hang it
 * off). scene/scene.js is plain JS (not JSX) for the same reason: Babel-
 * standalone only auto-transforms <script type="text/babel"> tags present
 * at initial page load, never ones injected later.
 */
const { useState, useEffect, useCallback, useRef } = React;

/* ---- Manifest loading (Item 4 consumer, C1) ---- */
const MANIFEST_BASE = "manifest/";
const MANIFEST_NAMES = ["halls", "cabinets", "greeting", "audio", "narration"];

function useManifests() {
  const [manifests, setManifests] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      MANIFEST_NAMES.map((name) =>
        fetch(MANIFEST_BASE + name + ".json").then((res) => {
          if (!res.ok) {
            throw new Error(name + ".json failed to load (HTTP " + res.status + ")");
          }
          return res.json();
        }).then((data) => [name, data])
      )
    )
      .then((pairs) => {
        if (cancelled) return;
        const out = {};
        pairs.forEach(([name, data]) => { out[name] = data; });
        setManifests(out);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => { cancelled = true; };
  }, []);

  return { manifests, error };
}

/* ---- Defensive localStorage wrappers (C1) ---- */
function safeGetItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

/* ---- Hash sub-router (C1, D-030 PD2) ---- */
function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "/");

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((path) => {
    window.location.hash = path;
  }, []);

  return [route, navigate];
}

/* ---- Capability check (C1, Item 5) ---- */
function checkCapabilities() {
  let prefersReducedMotion = false;
  try {
    prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    prefersReducedMotion = false;
  }

  const isMobileViewport = window.innerWidth < 768;

  let hasWebGL = false;
  try {
    const canvas = document.createElement("canvas");
    hasWebGL = !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    hasWebGL = false;
  }

  const use3D = hasWebGL && !prefersReducedMotion && !isMobileViewport;
  return { hasWebGL, prefersReducedMotion, isMobileViewport, use3D };
}

/* ---- Dynamic script injection (C2 Item 1 — no React.lazy, no ES modules) ---- */
function injectScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-museum-injected="' + src + '"]');
    if (existing) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.setAttribute("data-museum-injected", src);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}
// Version pin: 0.160.0, NOT the C2 arch's stated 0.170.0. Verified live
// (unpkg meta API) that three.js stopped publishing a classic global/UMD
// build/three.min.js after r160 — 0.170.0/build/three.min.js does not
// exist (only ES-module/CJS builds from r161 on). 0.160.0 is the last
// version with the classic-script build this runtime pattern (D-030)
// requires. Flagged for Opus@CH; full detail in the C2 impl log.
const THREE_VERSION = "0.160.0";
function ensureThreeLoaded() {
  if (window.THREE) return Promise.resolve();
  return injectScript("https://unpkg.com/three@" + THREE_VERSION + "/build/three.min.js");
}
function ensureSceneModuleLoaded() {
  if (window.MuseumScene) return Promise.resolve();
  return injectScript("scene/scene.js");
}

/* ---- Threshold (C1, Item 2 — unchanged) ---- */
function Threshold({ greeting, onEnter }) {
  const visitorName = safeGetItem("sod_visitor_name");
  const isReturning = !!visitorName;
  const variant = isReturning ? "returning" : "first_visit";
  const rawText = greeting && greeting.greeting_variants && greeting.greeting_variants[variant]
    ? greeting.greeting_variants[variant].text
    : "";
  const text = isReturning ? rawText.replace("{name}", visitorName) : rawText;

  const [doorOpen, setDoorOpen] = useState(false);

  const handleEnter = (mode) => {
    safeSetItem("sod_audio_optin", mode);
    setDoorOpen(true);

    let prefersReducedMotion = false;
    try {
      prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      prefersReducedMotion = false;
    }
    const delay = prefersReducedMotion ? 0 : 650;
    window.setTimeout(() => onEnter(mode), delay);
  };

  return (
    <div className={"threshold" + (doorOpen ? " threshold-open" : "")}>
      <div className="threshold-doors" aria-hidden="true">
        <div className="threshold-door threshold-door-left" />
        <div className="threshold-seam" />
        <div className="threshold-door threshold-door-right" />
      </div>
      <div className="threshold-content">
        <p className="threshold-greeting">{text || " "}</p>
        <div className="threshold-actions">
          <button type="button" className="threshold-btn" onClick={() => handleEnter("sound")}>
            Enter with sound
          </button>
          <button
            type="button"
            className="threshold-btn threshold-btn-quiet"
            onClick={() => handleEnter("quiet")}
          >
            Enter quietly
          </button>
        </div>
      </div>
    </div>
  );
}

function Preparing3D() {
  return (
    <div className="museum-stub" aria-live="polite" aria-busy="true">
      <p className="museum-stub-label preparing-label">Preparing museum&hellip;</p>
    </div>
  );
}

function ManifestErrorScreen({ error }) {
  return (
    <div className="museum-stub">
      <p className="museum-stub-label">Manifest load failed</p>
      <p className="museum-stub-note">{error.message}</p>
    </div>
  );
}

/* ---- 3D path: waypoint context + accessibility overlay (C2 Items 2,4,7,8) ---- */
function waypointContext(waypointId, cabinets) {
  const cabinet = cabinets.find((c) => c.waypoint_id === waypointId);
  if (cabinet) {
    const idx = cabinets.findIndex((c) => c.id === cabinet.id);
    return {
      announce: "Moving to Classics hall, cabinet " + (idx + 1) + " of " + cabinets.length + ".",
      cabinet,
    };
  }
  if (waypointId.indexOf("classics") === 0) {
    return { announce: "Moving to Classics hall.", cabinet: null };
  }
  return { announce: "Moving to the Rotunda.", cabinet: null };
}

// Static waypoint copy per Opus@CH's C2 arch §1.3 table (quoted text used
// verbatim; classics-mid had no quoted copy in the table — an Opus stage
// direction, not visitor copy — so it renders no placard text, consistent
// with the "do not invent copy" discipline established at C1).
const WAYPOINT_STATIC_TEXT = {
  "rotunda-center": "You stand at the center of an obsidian rotunda. Five doorways ring you. Four are sealed.",
  "rotunda-guest-book": "<<HELD FOR C3 — guest book>>",
  "classics-back": "The far wall pulses with a warmth you have to walk closer to feel.",
};

function SceneView({ prefersReducedMotion, onWaypointChange, sceneHandleRef }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const handle = window.MuseumScene.mount(containerRef.current, {
      prefersReducedMotion,
      onWaypointChange,
    });
    sceneHandleRef.current = handle;
    return () => {
      handle.unmount();
      sceneHandleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="museum-scene-container" ref={containerRef} />;
}

function WaypointOverlay({ waypointIndex, waypointCount, waypointLabel, placardText, hasZoom, onContinue, onBack, onLookCloser }) {
  return (
    <div className="waypoint-overlay" aria-label={waypointLabel}>
      {placardText && <p className="waypoint-placard">{placardText}</p>}
      <div className="waypoint-actions">
        <button
          type="button"
          className="threshold-btn threshold-btn-quiet"
          onClick={onBack}
          disabled={waypointIndex === 0}
        >
          &larr; Step back
        </button>
        {hasZoom && (
          <button type="button" className="threshold-btn" onClick={onLookCloser}>
            Look closer
          </button>
        )}
        <button
          type="button"
          className="threshold-btn"
          onClick={onContinue}
          disabled={waypointIndex === waypointCount - 1}
        >
          Continue &rarr;
        </button>
      </div>
    </div>
  );
}

function SealedDoorRow({ halls }) {
  const [announce, setAnnounce] = useState("");
  const sealed = halls.filter((h) => h.doorway_state === "sealed");

  const onActivate = (hall) => {
    setAnnounce(hall.name + ": " + hall.sealed_plaque_text + " Sealed for now, this hall is in formation.");
  };

  return (
    <div className="sealed-door-row">
      {sealed.map((hall) => (
        <button
          key={hall.id}
          type="button"
          className="sealed-plaque"
          onFocus={() => onActivate(hall)}
          onClick={() => onActivate(hall)}
        >
          <span className="sealed-plaque-name">{hall.name}</span>
          <span className="sealed-plaque-text">{hall.sealed_plaque_text}</span>
        </button>
      ))}
      <div aria-live="polite" className="sr-only">{announce}</div>
    </div>
  );
}

function ThreeDApp({ manifests }) {
  const CabinetDetail = window.MuseumCabinetDetail;
  const sceneHandleRef = useRef(null);
  const [prefersReducedMotion] = useState(() => checkCapabilities().prefersReducedMotion);
  const [waypointId, setWaypointId] = useState("rotunda-center");
  const [waypointIndex, setWaypointIndex] = useState(0);
  const [waypointCount, setWaypointCount] = useState(
    (window.MuseumScene && window.MuseumScene.WAYPOINT_ORDER.length) || 1
  );
  const [announcement, setAnnouncement] = useState("");
  const [zoomCabinetId, setZoomCabinetId] = useState(null);

  const cabinets = manifests.cabinets.cabinets;
  const halls = manifests.halls.halls;
  const narrations = manifests.narration.narrations;

  const onWaypointChange = useCallback((id, index, count) => {
    setWaypointId(id);
    setWaypointIndex(index);
    setWaypointCount(count);
    setAnnouncement(waypointContext(id, cabinets).announce);
  }, [cabinets]);

  useEffect(() => {
    function onKeyDown(e) {
      if (zoomCabinetId) return; // CabinetDetail owns Escape while zoomed
      if (e.key === "ArrowRight") sceneHandleRef.current && sceneHandleRef.current.advance();
      if (e.key === "ArrowLeft") sceneHandleRef.current && sceneHandleRef.current.retreat();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [zoomCabinetId]);

  const activeCabinet = cabinets.find((c) => c.waypoint_id === waypointId) || null;
  const zoomCabinet = zoomCabinetId ? cabinets.find((c) => c.id === zoomCabinetId) : null;

  let placardText = "";
  if (activeCabinet && narrations[activeCabinet.placard_narration_id]) {
    placardText = narrations[activeCabinet.placard_narration_id].text;
  } else if (waypointId === "classics-entry") {
    const classicsHall = halls.find((h) => h.id === "classics");
    placardText = (classicsHall && narrations[classicsHall.entry_narration_id])
      ? narrations[classicsHall.entry_narration_id].text
      : "";
  } else if (WAYPOINT_STATIC_TEXT[waypointId]) {
    placardText = WAYPOINT_STATIC_TEXT[waypointId];
  }

  return (
    <div className="museum-3d-root">
      <div className={"museum-scene-wrap" + (zoomCabinet ? " museum-scene-dimmed" : "")}>
        <SceneView
          prefersReducedMotion={prefersReducedMotion}
          onWaypointChange={onWaypointChange}
          sceneHandleRef={sceneHandleRef}
        />
      </div>

      <div aria-live="polite" className="sr-only">{announcement}</div>

      {!zoomCabinet && (
        <WaypointOverlay
          waypointIndex={waypointIndex}
          waypointCount={waypointCount}
          waypointLabel={"Waypoint " + (waypointIndex + 1) + " of " + waypointCount + ": " + waypointId}
          placardText={placardText}
          hasZoom={!!activeCabinet}
          onContinue={() => sceneHandleRef.current && sceneHandleRef.current.advance()}
          onBack={() => sceneHandleRef.current && sceneHandleRef.current.retreat()}
          onLookCloser={() => activeCabinet && setZoomCabinetId(activeCabinet.id)}
        />
      )}

      {waypointId === "rotunda-center" && !zoomCabinet && <SealedDoorRow halls={halls} />}

      {zoomCabinet && (
        <div className="cabinet-zoom-modal">
          <CabinetDetail cabinet={zoomCabinet} isOverlay={true} onBack={() => setZoomCabinetId(null)} />
        </div>
      )}
    </div>
  );
}

/* ---- 2D fallback dispatch (C2 Item 3, real replacement for C1 stub) ---- */
function TwoDApp({ manifests, route, navigate }) {
  const { RotundaGrid, ClassicsGrid } = window.MuseumGallery;
  const CabinetDetail = window.MuseumCabinetDetail;

  if (route === "/classics") {
    const entryNarration = manifests.narration.narrations["classics-entry-tour-guide-open"];
    return <ClassicsGrid cabinets={manifests.cabinets.cabinets} entryNarration={entryNarration} />;
  }
  if (route.indexOf("/classics/") === 0) {
    const cabinetId = route.slice("/classics/".length);
    const cabinet = manifests.cabinets.cabinets.find((c) => c.id === cabinetId) || null;
    return <CabinetDetail cabinet={cabinet} isOverlay={false} onBack={() => navigate("/classics")} />;
  }
  return <RotundaGrid halls={manifests.halls.halls} />;
}

/* ---- App shell ---- */
function MuseumApp() {
  const { manifests, error } = useManifests();
  const [route, navigate] = useHashRoute();
  const [audioOptIn, setAudioOptIn] = useState(() => safeGetItem("sod_audio_optin"));
  const [renderMode, setRenderMode] = useState(null); // "3d" | "2d"
  const [threeDPhase, setThreeDPhase] = useState(null); // null | "loading" | "ready"

  const enterExperience = useCallback(() => {
    const caps = checkCapabilities();
    if (caps.use3D) {
      setRenderMode("3d");
      setThreeDPhase("loading");
      ensureThreeLoaded()
        .then(ensureSceneModuleLoaded)
        .then(() => setThreeDPhase("ready"))
        .catch((err) => {
          console.error("[museum] 3D load failed, falling back to 2D:", err);
          setThreeDPhase(null);
          setRenderMode("2d");
        });
    } else {
      setRenderMode("2d");
    }
  }, []);

  // Deep-link cold load: audio opt-in already set -> auto-pass threshold and
  // run the capability check now (same behavior verified at C1).
  useEffect(() => {
    if (audioOptIn && renderMode === null) {
      enterExperience();
    }
  }, [audioOptIn, renderMode, enterExperience]);

  const handleEnter = (mode) => {
    safeSetItem("sod_audio_optin", mode);
    setAudioOptIn(mode);
    enterExperience();
    navigate("/rotunda");
  };

  if (error) {
    return <ManifestErrorScreen error={error} />;
  }
  if (!manifests) {
    return (
      <div className="museum-stub" aria-busy="true">
        <p className="museum-stub-label">Loading&hellip;</p>
      </div>
    );
  }

  // Gate on audioOptIn alone, not route: a stale/shared deep-link hash
  // (e.g. "#/rotunda") with no opt-in yet must still show the threshold,
  // not fall through every renderMode branch into a silent dead-end. Bug
  // found live during C2 verification — see impl log.
  const showThreshold = !audioOptIn;
  if (showThreshold) {
    return <Threshold greeting={manifests.greeting} onEnter={handleEnter} />;
  }

  if (renderMode === "2d") {
    return <TwoDApp manifests={manifests} route={route} navigate={navigate} />;
  }
  if (renderMode === "3d") {
    if (threeDPhase === "ready") {
      return <ThreeDApp manifests={manifests} />;
    }
    return <Preparing3D />;
  }

  return (
    <div className="museum-stub" aria-busy="true">
      <p className="museum-stub-label">Loading&hellip;</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MuseumApp />);
