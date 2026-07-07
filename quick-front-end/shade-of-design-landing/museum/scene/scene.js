/* global window, THREE, document, requestAnimationFrame, cancelAnimationFrame, performance */
/*
 * SoD Museum — Three.js scene module (DD-032 Item 2; C3 geometry pass per
 * C3 arch addendum A, session-log-2026-07-05-c3-arch-addendum-scene.md).
 *
 * Plain JS, not JSX: this file is dynamically injected as a <script src>
 * after three.min.js loads (D-030 runtime pattern — no ES modules, no
 * React.lazy). Keeping it JSX-free means it doesn't depend on Babel's
 * one-time initial-page-load script scan, which never sees dynamically
 * injected <script type="text/babel"> tags. museum.jsx mounts this
 * imperatively (same pattern as mounting any third-party imperative
 * library into a React tree), exactly like the maze-chase game module.
 *
 * C3 reframing (addendum §A, "why this is not a fallback"): this is not
 * placeholder geometry standing in for GLBs. Crystallized obsidian is
 * faceted — low-poly, flat-shaded, hard-edged geometry is not an
 * approximation of JR's "crystalized structure of Obsidian" brief, it IS
 * that brief. This module is held to the real-content ship bar on that
 * basis. No textures, no GLTFLoader/DRACOLoader/KTX2Loader — pure
 * vertex/material geometry, which is also what lets the vendored Three.js
 * loader bundle defer cleanly to v2 (D-034; real GLBs land then).
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

  // Doorways are evenly spaced at 72° (5 doorways / 360°). Classics stays at
  // 0° — it must line up with the Classics hall, which extends along +X.
  // angleDeg values are internal to this module (no manifest/waypoint
  // contract reads them — confirmed against manifest/halls.json), so
  // re-spacing them for the addendum's "evenly-spaced arches" ask doesn't
  // touch any contract.
  const SEALED_HALLS = [
    { id: "racing", angleDeg: 72 },
    { id: "shooters", angleDeg: 144 },
    { id: "fighting", angleDeg: 216 },
    { id: "self-selected", angleDeg: 288 },
  ];
  const ROTUNDA_RADIUS = 6;
  const ROTUNDA_FACETS = 12; // 10-14 flat segments per addendum §A.1
  const ROTUNDA_WALL_HEIGHT = 5;
  const ROTUNDA_CEILING_HEIGHT = 6.5; // recedes upward into darkness via fog
  const CLASSICS_FACETS = 6; // "fewer, larger facets than the rotunda — a calmer room"

  // Sparse facet-seam vein accents (4-6 total per addendum), picked to land
  // on wall seams (multiples of 360/ROTUNDA_FACETS = 30°) without coinciding
  // with a doorway seam.
  const VEIN_ANGLES_DEG = [30, 90, 180, 240, 300];

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function buildRotunda() {
    const group = new THREE.Group();

    // Faceted drum: low radial-segment cylinder + flatShading turns each
    // segment into a visible flat facet with a hard seam, instead of a
    // smooth cylinder — the "crystalized structure" reading (addendum §A.1).
    // Obsidian is volcanic glass, not matte stone — a glossy, low-roughness
    // surface catches the point lights as distinct specular streaks per
    // facet, which is what actually makes the facet seams legible. A pure
    // matte material under sparse point lights renders as a soft
    // undifferentiated glow instead (verified live; corrected here).
    const wallMat = new THREE.MeshStandardMaterial({
      color: WALL_TONE,
      side: THREE.BackSide,
      roughness: 0.35,
      metalness: 0.2,
      flatShading: true,
    });
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(ROTUNDA_RADIUS, ROTUNDA_RADIUS, ROTUNDA_WALL_HEIGHT, ROTUNDA_FACETS, 1, true),
      wallMat
    );
    wall.position.y = ROTUNDA_WALL_HEIGHT / 2;
    group.add(wall);

    // Facet vein accents — "volcanic flares": light escaping the pressure of
    // the earth through cracks in the crystal. Ember is a light source here
    // (emissive channel only), never a flat surface color (Fable §1.4).
    VEIN_ANGLES_DEG.forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      const veinMat = new THREE.MeshStandardMaterial({
        color: WALL_TONE,
        emissive: EMBER,
        emissiveIntensity: 0.35,
        flatShading: true,
      });
      const vein = new THREE.Mesh(new THREE.BoxGeometry(0.08, ROTUNDA_WALL_HEIGHT * 0.82, 0.05), veinMat);
      vein.position.set(
        Math.cos(rad) * (ROTUNDA_RADIUS - 0.05),
        ROTUNDA_WALL_HEIGHT / 2,
        Math.sin(rad) * (ROTUNDA_RADIUS - 0.05)
      );
      vein.rotation.y = -rad;
      group.add(vein);
    });

    // Floor: large flat disc, Ink, reads as polished stone.
    const floorMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(ROTUNDA_RADIUS, 32), floorMat);
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    // Slate radial ring inscribing the walkable center — keeps pure
    // Ink-on-Ink from reading as void (Fable §1.4 Slate rule: decorative
    // border/glow use only, never small-text foreground).
    const ringMat = new THREE.MeshStandardMaterial({
      color: SLATE,
      roughness: 1,
      transparent: true,
      opacity: 0.35,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(ROTUNDA_RADIUS * 0.32, ROTUNDA_RADIUS * 0.35, 48), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    group.add(ring);

    // Faceted ceiling — stepped cone receding upward into darkness (height
    // register for "the pressure of the earth"). Global scene fog (see
    // mount()) carries the vertex-darkening-toward-apex effect by distance
    // rather than a baked vertex-color gradient, which is simpler and still
    // physically legible from every waypoint.
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: OCEAN,
      roughness: 1,
      side: THREE.BackSide,
      flatShading: true,
    });
    const ceiling = new THREE.Mesh(
      new THREE.ConeGeometry(ROTUNDA_RADIUS, ROTUNDA_CEILING_HEIGHT, ROTUNDA_FACETS, 1, true),
      ceilingMat
    );
    ceiling.position.y = ROTUNDA_WALL_HEIGHT + ROTUNDA_CEILING_HEIGHT / 2;
    group.add(ceiling);

    // Open doorway (Classics, angle 0 / +X direction): warm light spill —
    // the strongest single light in the rotunda.
    const openLight = new THREE.PointLight(EMBER_SOFT, 1.2, 8);
    openLight.position.set(ROTUNDA_RADIUS - 0.5, 1.8, 0);
    group.add(openLight);

    // Sealed doorways: recessed faceted panel, thin Ember emissive seam
    // around the perimeter — "sealed, but alive behind the seal." No
    // PointLight per sealed door (lighting-budget discipline, addendum
    // §A.1 "Lighting budget"); the emissive seam alone carries the glow.
    SEALED_HALLS.forEach((hall) => {
      const rad = (hall.angleDeg * Math.PI) / 180;
      const x = Math.cos(rad) * (ROTUNDA_RADIUS - 0.2);
      const z = Math.sin(rad) * (ROTUNDA_RADIUS - 0.2);

      const panelMat = new THREE.MeshStandardMaterial({ color: WALL_TONE, roughness: 1, flatShading: true });
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3), panelMat);
      panel.position.set(x, 2, z);
      panel.lookAt(0, 2, 0);
      group.add(panel);

      const trimMat = new THREE.MeshStandardMaterial({
        color: WALL_TONE,
        emissive: EMBER_SOFT,
        emissiveIntensity: 0.18,
      });
      const trim = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.85, 4), trimMat);
      trim.position.copy(panel.position);
      trim.lookAt(0, 2, 0);
      group.add(trim);
    });

    return group;
  }

  // Guest book pedestal (C3 Item 6) — upgraded at the C3 geometry pass to
  // match the faceted language: low radial-segment plinth instead of a
  // smooth cylinder. Still procedural (real GLB swap remains a v2+ data-only
  // asset seam, per arch §3.2 posture). Returns the emissive light too, so
  // mount() can brighten it on waypoint approach.
  function buildGuestBookPedestal() {
    const group = new THREE.Group();
    const pos = WAYPOINT_POSITIONS["rotunda-guest-book"];

    const bodyMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.7, flatShading: true });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 8), bodyMat);
    body.position.set(pos[0], 0.45, pos[2] - 1);
    group.add(body);

    const pageMat = new THREE.MeshStandardMaterial({
      color: INK,
      emissive: EMBER_SOFT,
      emissiveIntensity: 0.25,
      flatShading: true,
    });
    const page = new THREE.Mesh(new THREE.CircleGeometry(0.3, 8), pageMat);
    page.rotation.x = -Math.PI / 2;
    page.position.set(pos[0], 0.91, pos[2] - 1);
    group.add(page);

    const glowLight = new THREE.PointLight(EMBER_SOFT, 0.3, 2.5);
    glowLight.position.set(pos[0], 1.1, pos[2] - 1);
    group.add(glowLight);

    return { group, glowLight };
  }

  // Arcade cabinet silhouette: angled marquee header, recessed screen plane,
  // sloped control deck. Player waypoints sit at z = 2 (smaller z); the
  // cabinet body sits at z = 2.6, so its "front" faces -z, toward the
  // visitor. opts.marqueeIntensity / opts.playable drive the "findable by
  // light, not by label" distinction (addendum §A.1).
  function buildCabinetSilhouette(x, opts) {
    const group = new THREE.Group();
    const z = 2.6;

    const bodyMat = new THREE.MeshStandardMaterial({ color: SLATE, roughness: 0.7, flatShading: true });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.7), bodyMat);
    body.position.set(x, 0.75, z);
    group.add(body);

    // Control-deck slope, angled toward the visitor.
    const deckMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.85, flatShading: true });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.5), deckMat);
    deck.position.set(x, 0.5, z - 0.55);
    deck.rotation.x = 0.35;
    group.add(deck);

    // Marquee header, tilted back slightly above the body.
    const marqueeBodyMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.85, flatShading: true });
    const marqueeBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.3), marqueeBodyMat);
    marqueeBody.position.set(x, 1.65, z + 0.05);
    marqueeBody.rotation.x = -0.2;
    group.add(marqueeBody);

    const marqueeGlowMat = new THREE.MeshStandardMaterial({
      color: INK,
      emissive: EMBER_SOFT,
      emissiveIntensity: opts.marqueeIntensity,
      flatShading: true,
    });
    const marqueeGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.2), marqueeGlowMat);
    marqueeGlow.position.set(x, 1.66, z - 0.12);
    marqueeGlow.rotation.x = -0.2;
    group.add(marqueeGlow);

    // Recessed screen plane — attract mode seen from across the room.
    const screenMat = new THREE.MeshStandardMaterial({
      color: INK,
      emissive: EMBER,
      emissiveIntensity: opts.screenBaseIntensity,
      flatShading: true,
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), screenMat);
    screen.position.set(x, 1.0, z - 0.36);
    group.add(screen);

    const marqueeLight = new THREE.PointLight(EMBER_SOFT, opts.marqueeLightIntensity, 3);
    marqueeLight.position.set(x, 1.9, z - 0.3);
    group.add(marqueeLight);

    return { group, screenMat, screenBaseIntensity: opts.screenBaseIntensity };
  }

  function buildClassicsHall() {
    const group = new THREE.Group();
    const CENTER_X = 15;
    const DEPTH = 18;
    const WIDTH = 6;
    const HEIGHT = 4; // deliberately lower than ROTUNDA_WALL_HEIGHT — gallery
    // intimacy against rotunda grandeur (addendum §A.1).

    // Fewer, larger facets than the rotunda: BoxGeometry's six faces are
    // already flat; flatShading keeps the seams crisp rather than smoothed.
    // Same glossy-obsidian material logic as the rotunda wall (see comment
    // there) — matte would flatten this to an undifferentiated dark box.
    const wallMat = new THREE.MeshStandardMaterial({
      color: WALL_TONE,
      side: THREE.BackSide,
      roughness: 0.35,
      metalness: 0.2,
      flatShading: true,
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(DEPTH, HEIGHT, WIDTH, CLASSICS_FACETS, 1, 1), wallMat);
    box.position.set(CENTER_X, HEIGHT / 2, 0);
    group.add(box);

    const floorMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(DEPTH, WIDTH), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(CENTER_X, 0, 0);
    group.add(floor);

    // Cabinet silhouettes at each cabinet waypoint x, pulled back to
    // z = 2.6 (just past the "facing cabinet" waypoint at z = 2). The
    // maze-chase cabinet (index 0, the only playable one) is marginally
    // brighter — findable by light, not by label.
    const cabinetSpecs = [
      { x: WAYPOINT_POSITIONS["classics-mazechase-position"][0], playable: true },
      { x: WAYPOINT_POSITIONS["classics-dk-position"][0], playable: false },
      { x: WAYPOINT_POSITIONS["classics-mario-position"][0], playable: false },
    ];
    const cabinets = cabinetSpecs.map((spec) =>
      buildCabinetSilhouette(spec.x, {
        marqueeIntensity: spec.playable ? 0.55 : 0.35,
        marqueeLightIntensity: spec.playable ? 0.9 : 0.6,
        screenBaseIntensity: 0.4,
      })
    );
    cabinets.forEach((cab) => group.add(cab.group));

    return { group, cabinets };
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
    // Depth falloff toward Ocean — carries both the rotunda's "recede into
    // darkness" ceiling read and the Classics hall's far-end darkening
    // (addendum §A.1), as one distance-based effect rather than two baked
    // vertex-color gradients.
    scene.fog = new THREE.Fog(OCEAN, 9, 26);

    const rotunda = buildRotunda();
    scene.add(rotunda);
    const classicsHall = buildClassicsHall();
    scene.add(classicsHall.group);
    const pedestal = buildGuestBookPedestal();
    scene.add(pedestal.group);

    const ambientLight = new THREE.AmbientLight(OCEAN, 0.55);
    scene.add(ambientLight);

    // Hemisphere fill (sky/ground, not a PointLight — outside the addendum's
    // ≤6 PointLight budget) so the faceted walls read as a shape against the
    // black void from every waypoint, not only the patch nearest a doorway
    // or marquee light. Kept low-intensity — legibility floor, not a mood
    // change.
    const hemiLight = new THREE.HemisphereLight(OCEAN, INK, 0.5);
    scene.add(hemiLight);

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

    function updatePedestalGlow(index) {
      const approaching = WAYPOINT_ORDER[index] === "rotunda-guest-book";
      pedestal.glowLight.intensity = approaching ? 1.1 : 0.3;
    }

    function goTo(index, notify) {
      index = Math.max(0, Math.min(WAYPOINT_ORDER.length - 1, index));
      const from = camera.position.clone();
      const toArr = WAYPOINT_POSITIONS[WAYPOINT_ORDER[index]];
      const to = new THREE.Vector3(toArr[0], toArr[1], toArr[2]);
      updatePedestalGlow(index);

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

      // Cabinet screen flicker — subtle ~0.5Hz sine, small amplitude, fully
      // static under prefers-reduced-motion (addendum §A.1 lighting budget).
      if (!prefersReducedMotion) {
        const phase = Math.sin(2 * Math.PI * 0.5 * (ts / 1000));
        classicsHall.cabinets.forEach((cab) => {
          cab.screenMat.emissiveIntensity = cab.screenBaseIntensity + phase * 0.08;
        });
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
