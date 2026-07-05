#!/usr/bin/env node
/*
 * C-Legal-style ship-gate lint for the SoD Museum manifests (DD-032 Item 6).
 *
 * Enforces the cross-manifest referential-integrity constraints locked in
 * Opus@CH's C1 artifact §1.6. Node core-only, no dependencies to install —
 * this repo has no package.json/bundler (see C1 session log, Pattern-
 * deviation 1), so a zero-dependency script is the closest JS-world analog
 * of Central Hub's existing "run directly with an interpreter" script
 * convention (C-Transit / C-SPOTTER are plain Python, no framework).
 *
 * No CI pipeline exists in this repo yet (no .github/workflows, no git repo
 * at all was found at the vault root). This script is CI-ready — it exits
 * non-zero on any violation — but is NOT currently wired into any pipeline.
 * Run manually:
 *
 *   node museum/lint/lint-manifests.js
 *
 * Wire into CI whenever one exists, on any commit touching museum/manifest/*.
 */

const fs = require("fs");
const path = require("path");

const MANIFEST_DIR = path.join(__dirname, "..", "manifest");

function loadJson(name) {
  const filePath = path.join(MANIFEST_DIR, name);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const halls = loadJson("halls.json").halls;
  const cabinets = loadJson("cabinets.json").cabinets;
  const narrations = loadJson("narration.json").narrations;
  const tracks = loadJson("audio.json").tracks;

  const violations = [];

  const cabinetIds = new Set(cabinets.map((c) => c.id));
  const hallIds = new Set(halls.map((h) => h.id));
  const narrationKeys = new Set(Object.keys(narrations));
  const clearedTrackIds = new Set(
    tracks.filter((t) => t.cleared_status === "owner-delivered" || t.cleared_status === "cleared").map((t) => t.id)
  );
  const allTrackIds = new Set(tracks.map((t) => t.id));

  // 1. Every halls[].cabinet_ids[] entry resolves to a cabinets[].id
  halls.forEach((hall) => {
    (hall.cabinet_ids || []).forEach((cid) => {
      if (!cabinetIds.has(cid)) {
        violations.push(`[1] halls["${hall.id}"].cabinet_ids references unknown cabinet "${cid}"`);
      }
    });
  });

  // 2. Every cabinets[].hall_id resolves to a halls[].id
  cabinets.forEach((cabinet) => {
    if (!hallIds.has(cabinet.hall_id)) {
      violations.push(`[2] cabinets["${cabinet.id}"].hall_id references unknown hall "${cabinet.hall_id}"`);
    }
  });

  // 3. Every halls[].track_id (non-null) resolves to a tracks[].id with an
  //    acceptable cleared_status
  halls.forEach((hall) => {
    if (hall.track_id === null || hall.track_id === undefined) return;
    if (!allTrackIds.has(hall.track_id)) {
      violations.push(`[3] halls["${hall.id}"].track_id references unknown track "${hall.track_id}"`);
    } else if (!clearedTrackIds.has(hall.track_id)) {
      violations.push(`[3] halls["${hall.id}"].track_id "${hall.track_id}" is not cleared (owner-delivered|cleared)`);
    }
  });

  // 4. Every *_narration_id (non-null) resolves to a narrations{} key
  function checkNarrationRef(ownerLabel, field, value) {
    if (value === null || value === undefined) return;
    if (!narrationKeys.has(value)) {
      violations.push(`[4] ${ownerLabel}.${field} references unknown narration "${value}"`);
    }
  }
  halls.forEach((hall) => {
    checkNarrationRef(`halls["${hall.id}"]`, "placard_narration_id", hall.placard_narration_id);
    checkNarrationRef(`halls["${hall.id}"]`, "entry_narration_id", hall.entry_narration_id);
  });
  cabinets.forEach((cabinet) => {
    checkNarrationRef(`cabinets["${cabinet.id}"]`, "placard_narration_id", cabinet.placard_narration_id);
  });

  // 5. Exactly one cabinet across cabinets[] has playable: true
  const playableCount = cabinets.filter((c) => c.playable === true).length;
  if (playableCount !== 1) {
    violations.push(`[5] expected exactly 1 cabinet with playable:true, found ${playableCount}`);
  }

  // 6. Every non-sealed hall has a non-empty waypoint_ids[]
  halls.forEach((hall) => {
    if (hall.doorway_state === "sealed") return;
    if (!Array.isArray(hall.waypoint_ids) || hall.waypoint_ids.length === 0) {
      violations.push(`[6] halls["${hall.id}"] is non-sealed but waypoint_ids is empty`);
    }
  });

  // 7. Every narrations{} entry has non-empty text regardless of audioUrl state
  Object.keys(narrations).forEach((key) => {
    const text = narrations[key].text;
    if (typeof text !== "string" || text.trim().length === 0) {
      violations.push(`[7] narrations["${key}"] has empty or missing text`);
    }
  });

  // Extra (per §1.2 field notes, not numbered in §1.6 but explicitly
  // Sonnet's responsibility): playable/game_module pairing.
  cabinets.forEach((cabinet) => {
    if (cabinet.playable === true && !cabinet.game_module) {
      violations.push(`[extra] cabinets["${cabinet.id}"] is playable:true but game_module is null`);
    }
    if (cabinet.playable === false && cabinet.game_module !== null) {
      violations.push(`[extra] cabinets["${cabinet.id}"] is playable:false but game_module is not null`);
    }
  });

  // 8. (C2, arch §3.4) Every playable:false cabinet has non-null
  //    placard_copy_md and non-null placeholder_alt.
  cabinets.forEach((cabinet) => {
    if (cabinet.playable !== false) return;
    if (!cabinet.placard_copy_md) {
      violations.push(`[8] cabinets["${cabinet.id}"] is playable:false but placard_copy_md is null/empty`);
    }
    if (!cabinet.art || !cabinet.art.placeholder_alt) {
      violations.push(`[8] cabinets["${cabinet.id}"] is playable:false but art.placeholder_alt is null/empty`);
    }
  });

  // 9. (C2, arch §3.4) Every playable:true cabinet has non-null game_module
  //    AND that value corresponds to an existing file at museum/games/{game_module}.js.
  const GAMES_DIR = path.join(__dirname, "..", "games");
  cabinets.forEach((cabinet) => {
    if (cabinet.playable !== true) return;
    if (!cabinet.game_module) {
      violations.push(`[9] cabinets["${cabinet.id}"] is playable:true but game_module is null`);
      return;
    }
    const gameFile = path.join(GAMES_DIR, cabinet.game_module + ".js");
    if (!fs.existsSync(gameFile)) {
      violations.push(`[9] cabinets["${cabinet.id}"].game_module "${cabinet.game_module}" has no file at museum/games/${cabinet.game_module}.js`);
    }
  });

  if (violations.length === 0) {
    console.log("Manifest ship-gate lint: CLEAN (" + halls.length + " halls, " + cabinets.length + " cabinets, " + Object.keys(narrations).length + " narrations)");
    process.exit(0);
  }

  console.error("Manifest ship-gate lint: " + violations.length + " violation(s)");
  violations.forEach((v) => console.error("  - " + v));
  process.exit(1);
}

main();
