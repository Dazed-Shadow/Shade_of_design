/* global window, THREE, document, requestAnimationFrame, cancelAnimationFrame */
/*
 * SoD Museum — Three.js scene module (DD-032 Item 2).
 *
 * Plain JS, not JSX: this file is dynamically injected as a <script src>
 * after three.min.js loads (D-030 runtime pattern — no ES modules, no
 * React.lazy). Keeping it JSX-free means it doesn't depend on Babel's
 * one-time initial-page-load script scan, which never sees dynamically
 * injected <script type="text/babel"> tags. museum.jsx mounts this
 * imperatively (same pattern as mounting any third-party imperative
 * library into a React tree), exactly like the maze-chase game module.
 *
 * Pattern-deviation (named in the C2 impl log): no real GLB models exist
 * yet (DD-032 §2.4 confirms sourcing is out of scope for this DD). This
 * module builds the rotunda + Classics hall as procedural geometry
 * (cylinder + box, vertex-colored per the closed palette) rather than
 * loading .glb files — so GLTFLoader/DRACOLoader/KTX2Loader are NOT
 * injected at C2. They arrive at C3 alongside the real compressed GLBs.
 * This keeps the C2 3D chunk far under the 8 MB ceiling (see impl log for
 * measured sizes) and avoids hand-encoding binary glTF files that would be
 * thrown away at C3 anyway.
 */
(function (global) {
  "use strict";

  const INK = 0x0b1726;
  // Ocean, not an invented off-palette shade, gives wall depth distinct from
  // the Ink floor/ceiling — matches Fable's own palette composition ("Ocean
  // is the depth register"). The C1 brand-token lint caught an invented,
  // off-palette shade used for this same purpose; not repeating that here.
  const WALL_TONE = 0x1a3e62;
  const EMBER = 0xc97b4a;
  const EMBER_SOFT = 0xe4a57e;
  const SLATE = 0x5d809d;
  const OCEAN = 0x1a3e62;

  // Linear dolly sequence. Reachability + Tab-cycle order is documented in
  // the C2 impl log (§4.3 traversal spec); ordering choice here is an
  // implementation detail Opus@CH's arch artifact explicitly left to
  // Sonnet ("positions are approximate... lock count + overlay pairing").
  const WAYPOINT_ORDER = [
    "rotunda-center",
    "rotunda-guest-book",
    "classics-entry",
    "classics-mid",
    "classics-mazechase-position",
    "classics-dk-position",
    "classics-mario-position",
    "classics-back",
  ];

  const WAYPOINT_POSITIONS = {
    "rotunda-center": [0, 1.6, 0],
    "rotunda-guest-book": [0, 1.6, -3],
    "classics-entry": [10, 1.6, 0],
    "classics-mid": [15, 1.6, 0],
    "classics-back": [20, 1.6, 0],
    "classics-mazechase-position": [13, 1.6, 2],
    "classics-dk-position": [15, 1.6, 2],
    "classics-mario-position": [17, 1.6, 2],
  };

  const SEALED_HALLS = [
    { id: "racing", angleDeg: 90 },
    { id: "shooters", angleDeg: 162 },
    { id: "fighting", angleDeg: 198 },
    { id: "self-selected", angleDeg: 270 },
  ];
  const ROTUNDA_RADIUS = 6;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function buildRotunda() {
    const group = new THREE.Group();

    const wallMat = new THREE.MeshStandardMaterial({ color: WALL_TONE, side: THREE.BackSide, roughness: 0.9 });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(ROTUNDA_RADIUS, ROTUNDA_RADIUS, 4, 32, 1, true), wallMat);
    wall.position.y = 2;
    group.add(wall);

    const floorMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(ROTUNDA_RADIUS, 32), floorMat);
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    const ceiling = floor.clone();
    ceiling.position.y = 4;
    ceiling.rotation.x = Math.PI / 2;
    group.add(ceiling);

    // Open doorway (Classics, +X direction): warm light spill, no occluder.
    const openLight = new THREE.PointLight(EMBER_SOFT, 1.2, 8);
    openLight.position.set(ROTUNDA_RADIUS - 0.5, 1.8, 0);
    group.add(openLight);

    // Sealed doorways: dark occluding panel + dim ember-soft emissive trim.
    SEALED_HALLS.forEach((hall) => {
      const rad = (hall.angleDeg * Math.PI) / 180;
      const x = Math.cos(rad) * (ROTUNDA_RADIUS - 0.2);
      const z = Math.sin(rad) * (ROTUNDA_RADIUS - 0.2);

      const panelMat = new THREE.MeshStandardMaterial({ color: WALL_TONE, roughness: 1 });
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3), panelMat);
      panel.position.set(x, 2, z);
      panel.lookAt(0, 2, 0);
      group.add(panel);

      const trimMat = new THREE.MeshStandardMaterial({
        color: WALL_TONE,
        emissive: EMBER_SOFT,
        emissiveIntensity: 0.15,
      });
      const trim = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.85, 4), trimMat);
      trim.position.copy(panel.position);
      trim.lookAt(0, 2, 0);
      group.add(trim);

      const sealLight = new THREE.PointLight(EMBER_SOFT, 0.2, 3);
      sealLight.position.set(x * 0.85, 2, z * 0.85);
      group.add(sealLight);
    });

    return group;
  }

  function buildClassicsHall() {
    const group = new THREE.Group();
    const CENTER_X = 15;
    const DEPTH = 18;
    const WIDTH = 6;
    const HEIGHT = 4;

    const wallMat = new THREE.MeshStandardMaterial({ color: WALL_TONE, side: THREE.BackSide, roughness: 0.9 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(DEPTH, HEIGHT, WIDTH), wallMat);
    box.position.set(CENTER_X, HEIGHT / 2, 0);
    group.add(box);

    const floorMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(DEPTH, WIDTH), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(CENTER_X, 0, 0);
    group.add(floor);

    // Cabinet markers — simple boxes at each cabinet waypoint x, pulled back
    // to z = +2.6 (just past the "facing cabinet" waypoint at z = +2).
    const cabinetXs = [
      WAYPOINT_POSITIONS["classics-mazechase-position"][0],
      WAYPOINT_POSITIONS["classics-dk-position"][0],
      WAYPOINT_POSITIONS["classics-mario-position"][0],
    ];
    const cabinetMat = new THREE.MeshStandardMaterial({ color: SLATE, roughness: 0.6 });
    cabinetXs.forEach((x) => {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.8), cabinetMat);
      cab.position.set(x, 1, 2.6);
      group.add(cab);

      const marquee = new THREE.PointLight(EMBER, 0.8, 3);
      marquee.position.set(x, 2.2, 2.3);
      group.add(marquee);
    });

    return group;
  }

  function mount(container, config) {
    config = config || {};
    const prefersReducedMotion = !!config.prefersReducedMotion;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.className = "museum-scene-canvas";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(INK);

    const rotunda = buildRotunda();
    scene.add(rotunda);
    const classicsHall = buildClassicsHall();
    scene.add(classicsHall);

    const ambientLight = new THREE.AmbientLight(OCEAN, 0.55);
    scene.add(ambientLight);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    let currentIndex = 0;
    const startPos = WAYPOINT_POSITIONS[WAYPOINT_ORDER[0]];
    camera.position.set(startPos[0], startPos[1], startPos[2]);
    camera.lookAt(startPos[0] + 1, startPos[1], startPos[2]);

    let tween = null; // { from, to, start, duration }

    function lookAheadTarget(index) {
      const nextIndex = Math.min(index + 1, WAYPOINT_ORDER.length - 1);
      const cur = WAYPOINT_POSITIONS[WAYPOINT_ORDER[index]];
      const next = WAYPOINT_POSITIONS[WAYPOINT_ORDER[nextIndex]];
      if (index === nextIndex) {
        return new THREE.Vector3(cur[0] + 1, cur[1], cur[2]);
      }
      return new THREE.Vector3(next[0], next[1], next[2]);
    }

    function goTo(index, notify) {
      index = Math.max(0, Math.min(WAYPOINT_ORDER.length - 1, index));
      const from = camera.position.clone();
      const toArr = WAYPOINT_POSITIONS[WAYPOINT_ORDER[index]];
      const to = new THREE.Vector3(toArr[0], toArr[1], toArr[2]);

      if (prefersReducedMotion) {
        camera.position.copy(to);
        camera.lookAt(lookAheadTarget(index));
        currentIndex = index;
        if (notify !== false) announce(index);
        return;
      }

      tween = { from, to, start: performance.now(), duration: 1400, targetIndex: index };
      currentIndex = index;
      if (notify !== false) announce(index);
    }

    function announce(index) {
      if (typeof config.onWaypointChange === "function") {
        config.onWaypointChange(WAYPOINT_ORDER[index], index, WAYPOINT_ORDER.length);
      }
    }

    // Initial announce so the DOM overlay renders for the starting waypoint.
    announce(0);

    function advance() {
      goTo(currentIndex + 1);
    }
    function retreat() {
      goTo(currentIndex - 1);
    }

    let rafId = null;
    function render(ts) {
      if (tween) {
        const t = Math.min(1, (ts - tween.start) / tween.duration);
        const eased = easeInOutCubic(t);
        camera.position.lerpVectors(tween.from, tween.to, eased);
        camera.lookAt(lookAheadTarget(tween.targetIndex));
        if (t >= 1) tween = null;
      }
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    function onResize() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", onResize);

    return {
      advance: advance,
      retreat: retreat,
      getCurrentWaypointId: function () { return WAYPOINT_ORDER[currentIndex]; },
      getCurrentIndex: function () { return currentIndex; },
      unmount: function () {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      },
    };
  }

  global.MuseumScene = { mount: mount, WAYPOINT_ORDER: WAYPOINT_ORDER };
})(window);
