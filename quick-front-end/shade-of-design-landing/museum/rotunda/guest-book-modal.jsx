/* global React */
/*
 * Guest book modal — shared component (DD-032 C3 Item 8).
 * One component, two callers: the 3D rotunda pedestal (scene.js waypoint
 * overlay) and the 2D fallback rotunda grid card both open this same modal.
 * JSX is fine here — this is an initial-load module (museum/index.html
 * script tag), not dynamically injected, so no D-031 plain-JS constraint
 * applies (that constraint is specifically about the lazy 3D chunk).
 */
const { useState, useEffect } = React;

const MAX_NAME_LENGTH = 40;

function safeGetItem(key) {
  try { return window.localStorage.getItem(key); } catch (e) { return null; }
}
function safeSetItem(key, value) {
  try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
}
function safeRemoveItem(key) {
  try { window.localStorage.removeItem(key); return true; } catch (e) { return false; }
}

function sanitizeName(raw) {
  return raw
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

function GuestBookModal({ onClose }) {
  const [signedName, setSignedName] = useState(() => safeGetItem("sod_visitor_name"));
  const [inputValue, setInputValue] = useState("");
  const [reSigning, setReSigning] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const isSigned = !!signedName && !reSigning;

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = sanitizeName(inputValue);
    if (!clean) return;
    safeSetItem("sod_visitor_name", clean);
    setSignedName(clean);
    setReSigning(false);
    setInputValue("");
    setAnnouncement("Signed: " + clean);
  };

  const handleReSignStart = () => {
    setReSigning(true);
    setInputValue("");
    setAnnouncement("");
  };

  const handleRemovalConfirm = () => {
    safeRemoveItem("sod_visitor_name");
    setSignedName(null);
    setReSigning(false);
    setConfirmingRemoval(false);
    setAnnouncement("Name cleared from this device.");
  };

  return (
    <div className="cabinet-zoom-modal guest-book-modal-backdrop">
      <div className="cabinet-detail cabinet-detail-overlay guest-book-modal" role="dialog" aria-label="Guest book" aria-modal="true">
        <p className="guest-book-invitation">
          {/* Held for JR per DD-032 Handoff decisions item 2 — Fable proposed:
              "Sign the book if you like. Or don't. The museum stays." */}
          {"<<HELD FOR JR — Fable proposed \"Sign the book if you like. Or don't. The museum stays.\">>"}
        </p>

        {isSigned ? (
          <div className="guest-book-signed-state">
            <p className="guest-book-signed-name">Signed: {signedName}</p>
            <div className="cabinet-detail-actions">
              <button type="button" className="threshold-btn threshold-btn-quiet" onClick={handleReSignStart}>
                {/* Fable's phrasing shipped as literal text — kickoff item 8
                    marks this one acceptable-as-is unless JR revises. */}
                Not {signedName}? Sign the book anew
              </button>
              {!confirmingRemoval && (
                <button type="button" className="threshold-btn threshold-btn-quiet" onClick={() => setConfirmingRemoval(true)}>
                  {/* Same as above — acceptable-as-is per kickoff item 8. */}
                  Scratch your name out
                </button>
              )}
            </div>
            {confirmingRemoval && (
              <div className="guest-book-confirm">
                <p className="guest-book-confirm-text">This clears your name from this device. Continue?</p>
                <div className="cabinet-detail-actions">
                  <button type="button" className="threshold-btn" onClick={handleRemovalConfirm}>Yes, clear it</button>
                  <button type="button" className="threshold-btn threshold-btn-quiet" onClick={() => setConfirmingRemoval(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form className="guest-book-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="guest-book-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Your name"
              aria-label="Your name"
              autoFocus
            />
            <div className="cabinet-detail-actions">
              <button type="submit" className="threshold-btn" disabled={!sanitizeName(inputValue)}>
                Sign the book
              </button>
              <button type="button" className="threshold-btn threshold-btn-quiet" onClick={onClose}>
                Step back
              </button>
            </div>
          </form>
        )}

        <p className="guest-book-plaque">Nothing leaves the device.</p>

        <div aria-live="polite" className="sr-only">{announcement}</div>

        {isSigned && (
          <div className="cabinet-detail-actions">
            <button type="button" className="threshold-btn threshold-btn-quiet" onClick={onClose}>
              Step back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

window.MuseumGuestBookModal = GuestBookModal;
