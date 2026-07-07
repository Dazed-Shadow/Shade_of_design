(function () {
"use strict";
/* global React */
/*
 * Shared cabinet detail/zoom content (DD-032 Item 4).
 *
 * One component, two containers: the 3D path mounts this inside a
 * full-viewport modal over a vignette-dimmed render canvas; the 2D fallback
 * mounts it directly as the `#/classics/:cabinet-id` route content. Neither
 * caller duplicates placard/game logic.
 */
const {
  useEffect,
  useRef,
  useState
} = React;

/* Minimal **bold**-only markdown renderer. cabinets.json placard_copy_md is a
   closed, hand-authored input format (no external markdown lib on this
   stack per D-030) — only ** bold ** spans are used anywhere in it. */
function renderPlacardMarkdown(md) {
  const parts = md.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return /*#__PURE__*/React.createElement("strong", {
        key: i
      }, part.slice(2, -2));
    }
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, part);
  });
}
function AttractLoop({
  cabinet
}) {
  const url = cabinet.art && cabinet.art.attract_loop_url;
  if (url) {
    return /*#__PURE__*/React.createElement("img", {
      className: "attract-art",
      src: url,
      alt: cabinet.art.placeholder_alt || cabinet.title
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "attract-css",
    role: "img",
    "aria-label": cabinet.art && cabinet.art.placeholder_alt || cabinet.title
  }, /*#__PURE__*/React.createElement("div", {
    className: "attract-css-marquee",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null)), /*#__PURE__*/React.createElement("p", {
    className: "attract-css-label"
  }, cabinet.art && cabinet.art.placeholder_alt || cabinet.title));
}
function GameMount({
  gameModule
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    const api = window.MuseumMazeChase; // v1: only one game_module exists
    let handle = null;
    if (gameModule === "maze-chase" && api && containerRef.current) {
      handle = api.mount(containerRef.current);
    }
    return () => {
      if (handle) handle.unmount();
    };
  }, [gameModule]);
  return /*#__PURE__*/React.createElement("div", {
    className: "game-mount",
    ref: containerRef
  });
}
function CabinetDetail({
  cabinet,
  onBack,
  isOverlay
}) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    setPlaying(false);
  }, [cabinet && cabinet.id]);
  useEffect(() => {
    if (!isOverlay) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape") onBack();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOverlay, onBack]);
  if (!cabinet) {
    return /*#__PURE__*/React.createElement("div", {
      className: "cabinet-detail"
    }, /*#__PURE__*/React.createElement("p", {
      className: "museum-stub-note"
    }, "Unknown cabinet."), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "threshold-btn",
      onClick: onBack
    }, "Step back"));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "cabinet-detail" + (isOverlay ? " cabinet-detail-overlay" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "cabinet-detail-art"
  }, playing ? /*#__PURE__*/React.createElement(GameMount, {
    gameModule: cabinet.game_module
  }) : /*#__PURE__*/React.createElement(AttractLoop, {
    cabinet: cabinet
  })), /*#__PURE__*/React.createElement("div", {
    className: "cabinet-detail-copy"
  }, /*#__PURE__*/React.createElement("p", {
    className: "cabinet-detail-era"
  }, cabinet.era, cabinet.influences && cabinet.influences.length ? " · " + cabinet.influences.join(", ") : ""), /*#__PURE__*/React.createElement("p", {
    className: "cabinet-detail-placard"
  }, renderPlacardMarkdown(cabinet.placard_copy_md)), /*#__PURE__*/React.createElement("div", {
    className: "cabinet-detail-actions"
  }, cabinet.playable && !playing && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn",
    onClick: () => setPlaying(true)
  }, "Play"), cabinet.playable && playing && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn threshold-btn-quiet",
    onClick: () => setPlaying(false)
  }, "Stop playing"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn threshold-btn-quiet",
    onClick: onBack
  }, isOverlay ? "Step back" : "← Back to Classics"))));
}
window.MuseumCabinetDetail = CabinetDetail;

})();
