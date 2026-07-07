/* global window, document, AudioContext, fetch */
/*
 * Web Audio manager — SoD Museum (DD-032 C3 Item 4).
 *
 * Plain JS per D-031 (dynamically-injected module = no JSX, same reasoning
 * as museum/scene/scene.js). Crossfade-loop ambient player, gesture-unlocked
 * (the threshold's "Enter with sound" click IS the autoplay-policy unlock),
 * visibilitychange pause, persistent volume.
 *
 * Pattern-deviation (named in the C3 impl log): the arch's codec-sniff used
 * canPlayType('audio/webm; codecs=opus') — verified against the actual
 * transcoded file via ffprobe and found wrong. `ffmpeg -c:a libopus` with a
 * ".opus" extension produces an Ogg container, not WebM. Codec probe below
 * checks 'audio/ogg; codecs="opus"' instead.
 */
(function (global) {
  "use strict";

  const INITIAL_FADE_SECONDS = 2.0; // Fable Dialogue 5: "~2s gain-fade in" on first entry
  const DEFAULT_VOLUME = 0.65;

  function safeGetItem(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSetItem(key, value) {
    try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function prefersOpus() {
    try {
      const probe = document.createElement("audio");
      const support = probe.canPlayType('audio/ogg; codecs="opus"');
      return support === "probably" || support === "maybe";
    } catch (e) {
      return false;
    }
  }

  function createManager() {
    let ctx = null;
    let buffer = null;
    let masterGain = null;
    let trackConfig = null;
    let scheduledSources = [];
    let loopTimerId = null;
    let playing = false;
    let muted = false;
    let volume = DEFAULT_VOLUME;

    function readPersistedVolume() {
      const raw = safeGetItem("sod_audio_volume");
      const parsed = raw === null ? NaN : parseFloat(raw);
      return isNaN(parsed) ? DEFAULT_VOLUME : Math.min(1, Math.max(0, parsed));
    }

    function applyGain() {
      if (!masterGain || !ctx) return;
      const target = muted ? 0 : volume;
      masterGain.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
    }

    async function init(config) {
      trackConfig = config;
      volume = readPersistedVolume();
      muted = safeGetItem("sod_audio_muted") === "true";

      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      applyGain();

      const useOpus = prefersOpus() && config.urls && config.urls.opus;
      const url = useOpus ? config.urls.opus : config.urls.aac;

      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error("Audio fetch failed (HTTP " + resp.status + "): " + url);
      }
      const arrayBuffer = await resp.arrayBuffer();
      buffer = await ctx.decodeAudioData(arrayBuffer);
    }

    function scheduleLoop(startTime, isFirst) {
      const crossfade = (trackConfig && trackConfig.crossfade_seconds) || 0.35;
      // Real decoded-buffer duration, not the manifest's static field — sidesteps
      // AAC container priming-sample duration inflation entirely (see impl log).
      const duration = buffer.duration;
      const fadeIn = isFirst ? INITIAL_FADE_SECONDS : crossfade;

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(1, startTime + fadeIn);
      gain.gain.setValueAtTime(1, startTime + duration - crossfade);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      src.connect(gain).connect(masterGain);
      src.start(startTime);
      src.stop(startTime + duration + 0.1);
      scheduledSources.push(src);
      // Trim old references so the array doesn't grow unbounded over a long visit.
      if (scheduledSources.length > 4) scheduledSources.shift();

      const nextStart = startTime + duration - crossfade;
      const delayMs = Math.max(0, (nextStart - ctx.currentTime - 2) * 1000);
      loopTimerId = window.setTimeout(() => scheduleLoop(nextStart, false), delayMs);
    }

    function play() {
      if (!ctx || !buffer || playing) return;
      playing = true;
      ctx.resume();
      scheduleLoop(ctx.currentTime + 0.05, true);
    }

    function pause() {
      if (!ctx) return;
      ctx.suspend();
    }

    function resume() {
      if (!ctx || !playing) return;
      ctx.resume();
    }

    function setVolume(value) {
      volume = Math.min(1, Math.max(0, value));
      safeSetItem("sod_audio_volume", String(volume));
      applyGain();
    }

    function setMuted(value) {
      muted = !!value;
      safeSetItem("sod_audio_muted", String(muted));
      applyGain();
    }

    function getState() {
      return { playing, muted, volume };
    }

    function destroy() {
      if (loopTimerId !== null) window.clearTimeout(loopTimerId);
      scheduledSources.forEach((s) => {
        try { s.stop(); } catch (e) { /* already stopped */ }
      });
      scheduledSources = [];
      if (ctx) {
        ctx.close().catch(() => {});
      }
      ctx = null;
      buffer = null;
      masterGain = null;
      playing = false;
    }

    return { init, play, pause, resume, setVolume, setMuted, getState, destroy };
  }

  global.AudioManager = createManager();

  // visibilitychange pause/resume — bound once at module load, per D-031-style
  // module discipline. Only acts if a manager instance is actually playing.
  document.addEventListener("visibilitychange", function () {
    const mgr = global.AudioManager;
    if (!mgr) return;
    const state = mgr.getState();
    if (!state.playing) return;
    if (document.visibilityState === "visible") {
      mgr.resume();
    } else {
      mgr.pause();
    }
  });
})(window);
