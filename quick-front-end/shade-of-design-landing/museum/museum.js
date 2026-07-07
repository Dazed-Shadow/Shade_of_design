(function () {
"use strict";
/* global React, ReactDOM */
/*
 * SoD Museum — app shell: threshold, hash sub-router, capability check,
 * 3D scene mount, 2D fallback dispatch, waypoint accessibility overlay,
 * audio manager wiring, guest book modal, volume control.
 *
 * Runtime pattern locked at D-030 (see pipeline/DECISIONS.md): CDN UMD +
 * Babel-standalone, no bundler, no ES modules, no React Router. Full
 * rationale for every deviation from the original C1/C2/C3 arch specs
 * lives in the session logs at Terminal/Central Hub/SOD MUSEUM/session-logs/.
 *
 * C2: Three.js injected via dynamic <script src> at the threshold action.
 * scene/scene.js is plain JS, not JSX, per D-031 (dynamically-injected
 * modules cannot use JSX — Babel-standalone never sees them).
 *
 * C3: audio-manager.js is injected the same way, same reason. Guest book
 * modal and cabinet detail are initial-load JSX (fine — not dynamically
 * injected).
 */
const {
  useState,
  useEffect,
  useCallback,
  useRef
} = React;

/* ---- Manifest loading (Item 4 consumer, C1) ---- */
const MANIFEST_BASE = "manifest/";
const MANIFEST_NAMES = ["halls", "cabinets", "greeting", "audio", "narration"];
function useManifests() {
  const [manifests, setManifests] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all(MANIFEST_NAMES.map(name => fetch(MANIFEST_BASE + name + ".json").then(res => {
      if (!res.ok) {
        throw new Error(name + ".json failed to load (HTTP " + res.status + ")");
      }
      return res.json();
    }).then(data => [name, data]))).then(pairs => {
      if (cancelled) return;
      const out = {};
      pairs.forEach(([name, data]) => {
        out[name] = data;
      });
      setManifests(out);
    }).catch(err => {
      if (!cancelled) setError(err);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return {
    manifests,
    error
  };
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
  const navigate = useCallback(path => {
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
    hasWebGL = !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    hasWebGL = false;
  }
  const use3D = hasWebGL && !prefersReducedMotion && !isMobileViewport;
  return {
    hasWebGL,
    prefersReducedMotion,
    isMobileViewport,
    use3D
  };
}

/* ---- Dynamic script injection (C2 Item 1 — no React.lazy, no ES modules) ---- */
function injectScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-museum-injected="' + src + '"]');
    if (existing) {
      resolve();
      return;
    }
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
// build/three.min.js after r160. See C2 impl log for full detail.
const THREE_VERSION = "0.160.0";
function ensureThreeLoaded() {
  if (window.THREE) return Promise.resolve();
  return injectScript("https://unpkg.com/three@" + THREE_VERSION + "/build/three.min.js");
}
function ensureSceneModuleLoaded() {
  if (window.MuseumScene) return Promise.resolve();
  return injectScript("scene/scene.js");
}
function ensureAudioManagerLoaded() {
  if (window.AudioManager) return Promise.resolve();
  return injectScript("audio/audio-manager.js");
}

/* ---- Threshold (C1, Item 2 — unchanged) ---- */
function Threshold({
  greeting,
  onEnter
}) {
  const visitorName = safeGetItem("sod_visitor_name");
  const isReturning = !!visitorName;
  const variant = isReturning ? "returning" : "first_visit";
  const rawText = greeting && greeting.greeting_variants && greeting.greeting_variants[variant] ? greeting.greeting_variants[variant].text : "";
  const text = isReturning ? rawText.replace("{name}", visitorName) : rawText;
  const [doorOpen, setDoorOpen] = useState(false);
  const handleEnter = mode => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "threshold" + (doorOpen ? " threshold-open" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "threshold-doors",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("div", {
    className: "threshold-door threshold-door-left"
  }), /*#__PURE__*/React.createElement("div", {
    className: "threshold-seam"
  }), /*#__PURE__*/React.createElement("div", {
    className: "threshold-door threshold-door-right"
  })), /*#__PURE__*/React.createElement("div", {
    className: "threshold-content"
  }, /*#__PURE__*/React.createElement("p", {
    className: "threshold-greeting"
  }, text || " "), /*#__PURE__*/React.createElement("div", {
    className: "threshold-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn",
    onClick: () => handleEnter("sound")
  }, "Enter with sound"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn threshold-btn-quiet",
    onClick: () => handleEnter("quiet")
  }, "Enter quietly"))));
}
function Preparing3D() {
  return /*#__PURE__*/React.createElement("div", {
    className: "museum-stub",
    "aria-live": "polite",
    "aria-busy": "true"
  }, /*#__PURE__*/React.createElement("p", {
    className: "museum-stub-label preparing-label"
  }, "Preparing museum\u2026"));
}
function ManifestErrorScreen({
  error
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "museum-stub"
  }, /*#__PURE__*/React.createElement("p", {
    className: "museum-stub-label"
  }, "Manifest load failed"), /*#__PURE__*/React.createElement("p", {
    className: "museum-stub-note"
  }, error.message));
}

/* ---- Diegetic volume control (C3 Item 5) ---- */
function SpeakerGlyph() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 6v4h2.5L8 12.5v-9L4.5 6H2Z",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.2 5.2a3.2 3.2 0 0 1 0 5.6",
    stroke: "currentColor",
    strokeWidth: "1.3",
    strokeLinecap: "round"
  }));
}
function MutedGlyph() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 6v4h2.5L8 12.5v-9L4.5 6H2Z",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.5 6.5 13.5 9.5M13.5 6.5 10.5 9.5",
    stroke: "currentColor",
    strokeWidth: "1.3",
    strokeLinecap: "round"
  }));
}
function VolumeControl({
  onEnsureAudio
}) {
  const [volume, setVolumeState] = useState(() => {
    const raw = safeGetItem("sod_audio_volume");
    const parsed = raw === null ? NaN : parseFloat(raw);
    return isNaN(parsed) ? 0.65 : parsed;
  });
  const [muted, setMutedState] = useState(() => safeGetItem("sod_audio_muted") === "true");
  const handleVolumeChange = e => {
    const v = parseFloat(e.target.value);
    setVolumeState(v);
    if (window.AudioManager) window.AudioManager.setVolume(v);
  };
  const toggleMute = () => {
    if (!window.AudioManager) {
      // No audio session exists — either "Enter quietly" was chosen, or a
      // deep-link cold reload after a prior "sound" visit left the control's
      // local `muted` snapshot stale (AudioContext needs a fresh gesture to
      // start, so it wasn't auto-restarted on reload — see C3 impl log,
      // stale-state pass). Either way the local `muted` value can't be
      // trusted as truth about whether audio is actually playing; any click
      // here should start it, not just the "was muted" transition.
      setMutedState(false);
      onEnsureAudio();
      return;
    }
    const next = !muted;
    setMutedState(next);
    window.AudioManager.setMuted(next);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "museum-volume-control"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "volume-mute-btn",
    onClick: toggleMute,
    "aria-label": muted ? "Unmute ambient audio" : "Mute ambient audio",
    "aria-pressed": muted
  }, muted ? /*#__PURE__*/React.createElement(MutedGlyph, null) : /*#__PURE__*/React.createElement(SpeakerGlyph, null)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "volume-slider",
    min: "0",
    max: "1",
    step: "0.01",
    value: volume,
    onChange: handleVolumeChange,
    "aria-label": "Ambient volume"
  }));
}

/* ---- 3D path: waypoint context + accessibility overlay (C2 Items 2,4,7,8) ---- */
function waypointContext(waypointId, cabinets) {
  const cabinet = cabinets.find(c => c.waypoint_id === waypointId);
  if (cabinet) {
    const idx = cabinets.findIndex(c => c.id === cabinet.id);
    return {
      announce: "Moving to Classics hall, cabinet " + (idx + 1) + " of " + cabinets.length + ".",
      cabinet
    };
  }
  if (waypointId === "rotunda-guest-book") {
    return {
      announce: "Moving to the guest book pedestal.",
      cabinet: null
    };
  }
  if (waypointId.indexOf("classics") === 0) {
    return {
      announce: "Moving to Classics hall.",
      cabinet: null
    };
  }
  return {
    announce: "Moving to the Rotunda.",
    cabinet: null
  };
}

// Static waypoint copy per Opus@CH's C2 arch §1.3 table (quoted text used
// verbatim; classics-mid had no quoted copy — an Opus stage direction, not
// visitor copy — so it renders no placard text).
const WAYPOINT_STATIC_TEXT = {
  "rotunda-center": "You stand at the center of an obsidian rotunda. Five doorways ring you. Four are sealed.",
  "classics-back": "The far wall pulses with a warmth you have to walk closer to feel."
};
function SceneView({
  prefersReducedMotion,
  onWaypointChange,
  sceneHandleRef
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    const handle = window.MuseumScene.mount(containerRef.current, {
      prefersReducedMotion,
      onWaypointChange
    });
    sceneHandleRef.current = handle;
    return () => {
      handle.unmount();
      sceneHandleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "museum-scene-container",
    ref: containerRef
  });
}
function WaypointOverlay({
  waypointIndex,
  waypointCount,
  waypointLabel,
  placardText,
  hasZoom,
  hasGuestBook,
  onContinue,
  onBack,
  onLookCloser,
  onSignBook
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "waypoint-overlay",
    "aria-label": waypointLabel
  }, placardText && /*#__PURE__*/React.createElement("p", {
    className: "waypoint-placard"
  }, placardText), /*#__PURE__*/React.createElement("div", {
    className: "waypoint-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn threshold-btn-quiet",
    onClick: onBack,
    disabled: waypointIndex === 0
  }, "\u2190 Step back"), hasZoom && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn",
    onClick: onLookCloser
  }, "Look closer"), hasGuestBook && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn",
    onClick: onSignBook
  }, "Sign the book"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn",
    onClick: onContinue,
    disabled: waypointIndex === waypointCount - 1
  }, "Continue \u2192")));
}
function SealedDoorRow({
  halls
}) {
  const [announce, setAnnounce] = useState("");
  const sealed = halls.filter(h => h.doorway_state === "sealed");
  const onActivate = hall => {
    setAnnounce(hall.name + ": " + hall.sealed_plaque_text + " Sealed for now, this hall is in formation.");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "sealed-door-row"
  }, sealed.map(hall => /*#__PURE__*/React.createElement("button", {
    key: hall.id,
    type: "button",
    className: "sealed-plaque",
    onFocus: () => onActivate(hall),
    onClick: () => onActivate(hall)
  }, /*#__PURE__*/React.createElement("span", {
    className: "sealed-plaque-name"
  }, hall.name), /*#__PURE__*/React.createElement("span", {
    className: "sealed-plaque-text"
  }, hall.sealed_plaque_text))), /*#__PURE__*/React.createElement("div", {
    "aria-live": "polite",
    className: "sr-only"
  }, announce));
}
function ThreeDApp({
  manifests,
  activeModal,
  onOpenModal,
  onCloseModal
}) {
  const CabinetDetail = window.MuseumCabinetDetail;
  const GuestBookModal = window.MuseumGuestBookModal;
  const sceneHandleRef = useRef(null);
  const [prefersReducedMotion] = useState(() => checkCapabilities().prefersReducedMotion);
  const [waypointId, setWaypointId] = useState("rotunda-center");
  const [waypointIndex, setWaypointIndex] = useState(0);
  const [waypointCount, setWaypointCount] = useState(window.MuseumScene && window.MuseumScene.WAYPOINT_ORDER.length || 1);
  const [announcement, setAnnouncement] = useState("");
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
      if (activeModal) return; // modal owns Escape while open
      if (e.key === "ArrowRight") sceneHandleRef.current && sceneHandleRef.current.advance();
      if (e.key === "ArrowLeft") sceneHandleRef.current && sceneHandleRef.current.retreat();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeModal]);
  const activeCabinet = cabinets.find(c => c.waypoint_id === waypointId) || null;
  const zoomCabinet = activeModal && activeModal !== "guestbook" ? cabinets.find(c => c.id === activeModal) : null;
  const guestBookOpen = activeModal === "guestbook";
  let placardText = "";
  if (activeCabinet && narrations[activeCabinet.placard_narration_id]) {
    placardText = narrations[activeCabinet.placard_narration_id].text;
  } else if (waypointId === "classics-entry") {
    const classicsHall = halls.find(h => h.id === "classics");
    placardText = classicsHall && narrations[classicsHall.entry_narration_id] ? narrations[classicsHall.entry_narration_id].text : "";
  } else if (WAYPOINT_STATIC_TEXT[waypointId]) {
    placardText = WAYPOINT_STATIC_TEXT[waypointId];
  }
  const modalOpen = !!zoomCabinet || guestBookOpen;
  return /*#__PURE__*/React.createElement("div", {
    className: "museum-3d-root"
  }, /*#__PURE__*/React.createElement("div", {
    className: "museum-scene-wrap" + (modalOpen ? " museum-scene-dimmed" : "")
  }, /*#__PURE__*/React.createElement(SceneView, {
    prefersReducedMotion: prefersReducedMotion,
    onWaypointChange: onWaypointChange,
    sceneHandleRef: sceneHandleRef
  })), /*#__PURE__*/React.createElement("div", {
    "aria-live": "polite",
    className: "sr-only"
  }, announcement), !modalOpen && /*#__PURE__*/React.createElement(WaypointOverlay, {
    waypointIndex: waypointIndex,
    waypointCount: waypointCount,
    waypointLabel: "Waypoint " + (waypointIndex + 1) + " of " + waypointCount + ": " + waypointId,
    placardText: placardText,
    hasZoom: !!activeCabinet,
    hasGuestBook: waypointId === "rotunda-guest-book",
    onContinue: () => sceneHandleRef.current && sceneHandleRef.current.advance(),
    onBack: () => sceneHandleRef.current && sceneHandleRef.current.retreat(),
    onLookCloser: () => activeCabinet && onOpenModal(activeCabinet.id),
    onSignBook: () => onOpenModal("guestbook")
  }), waypointId === "rotunda-center" && !modalOpen && /*#__PURE__*/React.createElement(SealedDoorRow, {
    halls: halls
  }), zoomCabinet && /*#__PURE__*/React.createElement("div", {
    className: "cabinet-zoom-modal"
  }, /*#__PURE__*/React.createElement(CabinetDetail, {
    cabinet: zoomCabinet,
    isOverlay: true,
    onBack: onCloseModal
  })), guestBookOpen && /*#__PURE__*/React.createElement(GuestBookModal, {
    onClose: onCloseModal
  }));
}

/* ---- 2D fallback dispatch (C2 Item 3 / C3 Item 7, real replacement for C1 stub) ---- */
function TwoDApp({
  manifests,
  route,
  navigate,
  activeModal,
  onOpenModal,
  onCloseModal
}) {
  const {
    RotundaGrid,
    ClassicsGrid
  } = window.MuseumGallery;
  const CabinetDetail = window.MuseumCabinetDetail;
  const GuestBookModal = window.MuseumGuestBookModal;
  const guestBookOpen = activeModal === "guestbook";
  let page;
  if (route === "/classics") {
    const entryNarration = manifests.narration.narrations["classics-entry-tour-guide-open"];
    page = /*#__PURE__*/React.createElement(ClassicsGrid, {
      cabinets: manifests.cabinets.cabinets,
      entryNarration: entryNarration
    });
  } else if (route.indexOf("/classics/") === 0) {
    const cabinetId = route.slice("/classics/".length);
    const cabinet = manifests.cabinets.cabinets.find(c => c.id === cabinetId) || null;
    // Bug 3 fix (DD-032 C3.5): CabinetDetail's own `.cabinet-detail` class
    // carries no background — the dark surface only comes from
    // `.cabinet-detail-overlay` (the 3D modal's isOverlay=true path) or,
    // for the other two 2D routes, the `.museum-page` wrapper they render
    // inside. This route rendered CabinetDetail bare with neither, so it
    // sat on the page's unstyled (white) background with Paper-colored
    // (near-white) text and buttons on top — unreadable. Wrapping in the
    // same `.museum-page` the sibling 2D routes use fixes it at the root,
    // matching the pattern instead of patching individual button colors.
    page = /*#__PURE__*/React.createElement("div", {
      className: "museum-page"
    }, /*#__PURE__*/React.createElement(CabinetDetail, {
      cabinet: cabinet,
      isOverlay: false,
      onBack: () => navigate("/classics")
    }));
  } else {
    page = /*#__PURE__*/React.createElement(RotundaGrid, {
      halls: manifests.halls.halls,
      onOpenGuestBook: () => onOpenModal("guestbook")
    });
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, page, guestBookOpen && /*#__PURE__*/React.createElement(GuestBookModal, {
    onClose: onCloseModal
  }));
}

/* ---- App shell ---- */
function MuseumApp() {
  const {
    manifests,
    error
  } = useManifests();
  const [route, navigate] = useHashRoute();
  const [audioOptIn, setAudioOptIn] = useState(() => safeGetItem("sod_audio_optin"));
  const [renderMode, setRenderMode] = useState(null); // "3d" | "2d"
  const [threeDPhase, setThreeDPhase] = useState(null); // null | "loading" | "ready"
  const [activeModal, setActiveModal] = useState(null); // null | "guestbook" | cabinetId

  const startAudio = useCallback(track => {
    ensureAudioManagerLoaded().then(() => window.AudioManager.init(track)).then(() => window.AudioManager.play()).catch(err => console.error("[museum] audio init failed:", err));
  }, []);

  // Resolves 3D vs 2D and loads the corresponding chunk. Shared by the
  // threshold action and the deep-link cold-load path — audio init is
  // deliberately NOT part of this (see handleEnter comment below).
  const resolveRenderMode = useCallback(() => {
    const caps = checkCapabilities();
    if (caps.use3D) {
      setRenderMode("3d");
      setThreeDPhase("loading");
      ensureThreeLoaded().then(ensureSceneModuleLoaded).then(() => setThreeDPhase("ready")).catch(err => {
        console.error("[museum] 3D load failed, falling back to 2D:", err);
        setThreeDPhase(null);
        setRenderMode("2d");
      });
    } else {
      setRenderMode("2d");
    }
  }, []);

  // Deep-link cold load: audio opt-in already set -> auto-pass threshold and
  // resolve 3D/2D now. Deliberately does NOT start audio here — creating an
  // AudioContext needs a fresh user gesture (a bare page reload has none, and
  // browsers block autoplay without one), so re-starting playback on every
  // cold reload would silently fail anyway. The volume control's lazy-start
  // path (see VolumeControl/handleEnsureAudioFromControl) covers a visitor
  // who wants sound after a quiet cold load — that path fires from a real click.
  useEffect(() => {
    if (audioOptIn && renderMode === null) {
      resolveRenderMode();
    }
  }, [audioOptIn, renderMode, resolveRenderMode]);
  const handleEnter = mode => {
    safeSetItem("sod_audio_optin", mode);
    setAudioOptIn(mode);
    if (mode === "sound") {
      // The threshold click IS the autoplay-unlock gesture (Fable Dialogue 1) —
      // audio only ever starts from here, never from a deep-link reload.
      const track = manifests && manifests.audio.tracks[0];
      if (track) startAudio(track);
    } else {
      safeSetItem("sod_audio_muted", "true");
    }
    resolveRenderMode();
    navigate("/rotunda");
  };
  const handleEnsureAudioFromControl = useCallback(() => {
    if (!manifests) return;
    safeSetItem("sod_audio_optin", "sound");
    safeSetItem("sod_audio_muted", "false");
    startAudio(manifests.audio.tracks[0]);
  }, [manifests, startAudio]);

  // Volume control hides during any modal (cabinet zoom or guest book) via a
  // body data-attribute — simplest cross-branch (3D/2D) toggle per arch §1.6.
  useEffect(() => {
    document.body.setAttribute("data-museum-mode", activeModal ? "zoom" : "");
    return () => document.body.removeAttribute("data-museum-mode");
  }, [activeModal]);
  if (error) {
    return /*#__PURE__*/React.createElement(ManifestErrorScreen, {
      error: error
    });
  }
  if (!manifests) {
    return /*#__PURE__*/React.createElement("div", {
      className: "museum-stub",
      "aria-busy": "true"
    }, /*#__PURE__*/React.createElement("p", {
      className: "museum-stub-label"
    }, "Loading\u2026"));
  }

  // Gate on audioOptIn alone, not route: a stale/shared deep-link hash with
  // no opt-in yet must still show the threshold (bug found + fixed at C2).
  const showThreshold = !audioOptIn;
  if (showThreshold) {
    return /*#__PURE__*/React.createElement(Threshold, {
      greeting: manifests.greeting,
      onEnter: handleEnter
    });
  }
  let body;
  if (renderMode === "2d") {
    body = /*#__PURE__*/React.createElement(TwoDApp, {
      manifests: manifests,
      route: route,
      navigate: navigate,
      activeModal: activeModal,
      onOpenModal: setActiveModal,
      onCloseModal: () => setActiveModal(null)
    });
  } else if (renderMode === "3d") {
    body = threeDPhase === "ready" ? /*#__PURE__*/React.createElement(ThreeDApp, {
      manifests: manifests,
      activeModal: activeModal,
      onOpenModal: setActiveModal,
      onCloseModal: () => setActiveModal(null)
    }) : /*#__PURE__*/React.createElement(Preparing3D, null);
  } else {
    body = /*#__PURE__*/React.createElement("div", {
      className: "museum-stub",
      "aria-busy": "true"
    }, /*#__PURE__*/React.createElement("p", {
      className: "museum-stub-label"
    }, "Loading\u2026"));
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, body, (renderMode === "2d" || renderMode === "3d" && threeDPhase === "ready") && /*#__PURE__*/React.createElement(VolumeControl, {
    onEnsureAudio: handleEnsureAudioFromControl
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(MuseumApp, null));

})();
