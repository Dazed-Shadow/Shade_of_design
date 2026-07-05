/* global window, document, requestAnimationFrame, cancelAnimationFrame */
/*
 * Maze Chase — original tribute mini-game (DD-032 Item 5).
 * Canvas 2D, no engine, no framework. Grid-based movement, one chaser,
 * one victory cell. Keyboard (arrows) + touch (four-quadrant tap).
 *
 * Shared mount(container, options) API: both the 3D zoom overlay and the
 * 2D cabinet detail view call this same module against different containers
 * (DD-032 "one code path, two containers").
 */
(function (global) {
  "use strict";

  var COLS = 9;
  var ROWS = 9;
  var CELL = 40;
  var STEP_MS = 220; // grid-step cadence, fixed for determinism

  // 1 = wall, 0 = open. Hand-authored small maze, original layout.
  var MAZE = [
    [0,0,0,1,0,0,0,1,0],
    [1,1,0,1,0,1,0,1,0],
    [0,0,0,0,0,1,0,0,0],
    [0,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,0,0,1,0],
    [0,1,0,1,1,1,1,1,0],
    [0,0,0,1,0,0,0,0,0],
    [0,1,1,1,0,1,1,1,0],
    [0,0,0,0,0,1,0,0,0]
  ];

  var START = { x: 0, y: 0 };
  var GOAL = { x: 8, y: 8 };
  var ENEMY_START = { x: 4, y: 4 };

  function isOpen(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    return MAZE[y][x] === 0;
  }

  function mount(container, options) {
    options = options || {};
    var doc = container.ownerDocument || document;

    container.innerHTML = "";
    container.setAttribute("role", "application");
    container.setAttribute("aria-label", "Maze Chase mini-game");

    var status = doc.createElement("p");
    status.className = "maze-status";
    status.setAttribute("aria-live", "polite");
    status.textContent = "Status: playing · Moves: 0";
    container.appendChild(status);

    var canvas = doc.createElement("canvas");
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    canvas.className = "maze-canvas";
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-hidden", "true"); // status text carries the a11y state
    container.appendChild(canvas);

    var hint = doc.createElement("p");
    hint.className = "maze-hint";
    hint.textContent = "Arrow keys to move. Tap a quadrant of the maze on touch.";
    container.appendChild(hint);

    var ctx = canvas.getContext("2d");

    var state = {
      player: { x: START.x, y: START.y },
      enemy: { x: ENEMY_START.x, y: ENEMY_START.y },
      moves: 0,
      status: "playing", // "playing" | "won" | "caught"
      queuedDir: null,
    };

    function setStatus(text) {
      status.textContent = text;
    }

    function tryMove(entity, dx, dy) {
      var nx = entity.x + dx;
      var ny = entity.y + dy;
      if (isOpen(nx, ny)) {
        entity.x = nx;
        entity.y = ny;
        return true;
      }
      return false;
    }

    function stepEnemy() {
      // Greedy chase: reduce whichever axis has the larger gap first.
      var dx = state.player.x - state.enemy.x;
      var dy = state.player.y - state.enemy.y;
      var attempts = [];
      if (Math.abs(dx) >= Math.abs(dy)) {
        attempts.push([dx > 0 ? 1 : -1, 0]);
        attempts.push([0, dy > 0 ? 1 : -1]);
      } else {
        attempts.push([0, dy > 0 ? 1 : -1]);
        attempts.push([dx > 0 ? 1 : -1, 0]);
      }
      for (var i = 0; i < attempts.length; i++) {
        if (dx === 0 && dy === 0) break;
        if (tryMove(state.enemy, attempts[i][0], attempts[i][1])) break;
      }
    }

    function step() {
      if (state.status !== "playing") return;
      if (state.queuedDir) {
        var moved = tryMove(state.player, state.queuedDir[0], state.queuedDir[1]);
        if (moved) state.moves += 1;
        state.queuedDir = null;
      }
      if (state.player.x === GOAL.x && state.player.y === GOAL.y) {
        state.status = "won";
        setStatus("Status: you made it · Moves: " + state.moves);
        return;
      }
      stepEnemy();
      if (state.enemy.x === state.player.x && state.enemy.y === state.player.y) {
        state.status = "caught";
        setStatus("Status: caught · Moves: " + state.moves);
        return;
      }
      setStatus("Status: playing · Moves: " + state.moves);
    }

    function draw() {
      ctx.fillStyle = "#0B1726"; // --museum-ink
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#1A3E62"; // --museum-ocean (depth register, not an invented shade)
      for (var y = 0; y < ROWS; y++) {
        for (var x = 0; x < COLS; x++) {
          if (MAZE[y][x] === 1) {
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          }
        }
      }

      // Goal cell
      ctx.fillStyle = "#FAFAF7"; // --museum-paper
      ctx.beginPath();
      ctx.arc(GOAL.x * CELL + CELL / 2, GOAL.y * CELL + CELL / 2, 8, 0, Math.PI * 2);
      ctx.fill();

      // Enemy
      ctx.fillStyle = "#5D809D"; // --museum-slate
      ctx.beginPath();
      ctx.arc(state.enemy.x * CELL + CELL / 2, state.enemy.y * CELL + CELL / 2, 14, 0, Math.PI * 2);
      ctx.fill();

      // Player
      ctx.fillStyle = "#C97B4A"; // --museum-ember
      ctx.beginPath();
      ctx.arc(state.player.x * CELL + CELL / 2, state.player.y * CELL + CELL / 2, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    function queueDir(dx, dy) {
      if (state.status !== "playing") return;
      state.queuedDir = [dx, dy];
    }

    function onKeyDown(e) {
      switch (e.key) {
        case "ArrowUp": queueDir(0, -1); e.preventDefault(); break;
        case "ArrowDown": queueDir(0, 1); e.preventDefault(); break;
        case "ArrowLeft": queueDir(-1, 0); e.preventDefault(); break;
        case "ArrowRight": queueDir(1, 0); e.preventDefault(); break;
      }
    }

    function onPointerDown(e) {
      var rect = canvas.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var clientY = e.touches ? e.touches[0].clientY : e.clientY;
      var px = clientX - rect.left - canvas.width / 2;
      var py = clientY - rect.top - canvas.height / 2;
      if (Math.abs(px) > Math.abs(py)) {
        queueDir(px > 0 ? 1 : -1, 0);
      } else {
        queueDir(0, py > 0 ? 1 : -1);
      }
    }

    canvas.addEventListener("keydown", onKeyDown);
    doc.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("click", onPointerDown);
    canvas.addEventListener("touchstart", onPointerDown, { passive: true });

    var rafId = null;
    var lastStepTime = 0;
    var running = true;

    function loop(ts) {
      if (!running) return;
      if (doc.visibilityState === "visible") {
        if (ts - lastStepTime >= STEP_MS) {
          lastStepTime = ts;
          step();
        }
        draw();
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    function onVisibilityChange() {
      // Loop already checks visibilityState per-frame; nothing else needed,
      // but we stop scheduling entirely when hidden to save cycles.
      if (doc.visibilityState === "visible" && running && rafId === null) {
        rafId = requestAnimationFrame(loop);
      }
    }
    doc.addEventListener("visibilitychange", onVisibilityChange);

    draw();

    return {
      unmount: function () {
        running = false;
        if (rafId !== null) cancelAnimationFrame(rafId);
        doc.removeEventListener("keydown", onKeyDown);
        doc.removeEventListener("visibilitychange", onVisibilityChange);
        container.innerHTML = "";
      },
      // exposed for verification/testing only
      _getState: function () { return state; },
    };
  }

  global.MuseumMazeChase = { mount: mount };
})(window);
