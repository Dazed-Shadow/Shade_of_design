(function () {
"use strict";
/* global React */
/*
 * Guest book modal — shared component (DD-032 C3 Item 8).
 * One component, two callers: the 3D rotunda pedestal (scene.js waypoint
 * overlay) and the 2D fallback rotunda grid card both open this same modal.
 * JSX is fine here — this is an initial-load module (museum/index.html
 * script tag), not dynamically injected, so no D-031 plain-JS constraint
 * applies (that constraint is specifically about the lazy 3D chunk).
 */
const {
  useState,
  useEffect
} = React;
const MAX_NAME_LENGTH = 40;
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
function safeRemoveItem(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}
function sanitizeName(raw) {
  return raw.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, MAX_NAME_LENGTH);
}
function GuestBookModal({
  onClose
}) {
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
  const handleSubmit = e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "cabinet-zoom-modal guest-book-modal-backdrop"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cabinet-detail cabinet-detail-overlay guest-book-modal",
    role: "dialog",
    "aria-label": "Guest book",
    "aria-modal": "true"
  }, /*#__PURE__*/React.createElement("p", {
    className: "guest-book-invitation"
  }, "Leave your name if you want a marker. The obsidian remembers either way."), isSigned ? /*#__PURE__*/React.createElement("div", {
    className: "guest-book-signed-state"
  }, /*#__PURE__*/React.createElement("p", {
    className: "guest-book-signed-name"
  }, "Signed: ", signedName), /*#__PURE__*/React.createElement("div", {
    className: "cabinet-detail-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn threshold-btn-quiet",
    onClick: handleReSignStart
  }, "Not ", signedName, "? Sign the book anew"), !confirmingRemoval && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn threshold-btn-quiet",
    onClick: () => setConfirmingRemoval(true)
  }, "Scratch your name out")), confirmingRemoval && /*#__PURE__*/React.createElement("div", {
    className: "guest-book-confirm"
  }, /*#__PURE__*/React.createElement("p", {
    className: "guest-book-confirm-text"
  }, "This clears your name from this device. Continue?"), /*#__PURE__*/React.createElement("div", {
    className: "cabinet-detail-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn",
    onClick: handleRemovalConfirm
  }, "Yes, clear it"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn threshold-btn-quiet",
    onClick: () => setConfirmingRemoval(false)
  }, "Cancel")))) : /*#__PURE__*/React.createElement("form", {
    className: "guest-book-form",
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "guest-book-input",
    value: inputValue,
    onChange: e => setInputValue(e.target.value),
    maxLength: MAX_NAME_LENGTH,
    placeholder: "Your name",
    "aria-label": "Your name",
    autoFocus: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "cabinet-detail-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "threshold-btn",
    disabled: !sanitizeName(inputValue)
  }, "Sign the book"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn threshold-btn-quiet",
    onClick: onClose
  }, "Step back"))), /*#__PURE__*/React.createElement("p", {
    className: "guest-book-plaque"
  }, "Nothing leaves the device."), /*#__PURE__*/React.createElement("div", {
    "aria-live": "polite",
    className: "sr-only"
  }, announcement), isSigned && /*#__PURE__*/React.createElement("div", {
    className: "cabinet-detail-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "threshold-btn threshold-btn-quiet",
    onClick: onClose
  }, "Step back"))));
}
window.MuseumGuestBookModal = GuestBookModal;

})();
