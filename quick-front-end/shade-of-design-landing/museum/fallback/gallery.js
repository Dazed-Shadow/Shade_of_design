(function () {
"use strict";
/* global React */
/*
 * 2D fallback renderer (DD-032 Item 3) — manifest-driven DOM gallery.
 * Same five JSON files as the 3D scene; no manifest fork. Content parity
 * with the 3D path is structural: both read halls.json/cabinets.json and
 * render the same counts (1 open + 4 sealed halls; 3 cabinets, 1 playable).
 */

function HallCard({
  hall
}) {
  const sealed = hall.doorway_state === "sealed";
  if (sealed) {
    return /*#__PURE__*/React.createElement("div", {
      className: "hall-card hall-card-sealed",
      tabIndex: 0,
      "aria-label": hall.name + " — sealed for now, this hall is in formation"
    }, /*#__PURE__*/React.createElement("p", {
      className: "hall-card-name"
    }, hall.name), /*#__PURE__*/React.createElement("p", {
      className: "hall-card-plaque"
    }, hall.sealed_plaque_text));
  }
  return /*#__PURE__*/React.createElement("a", {
    className: "hall-card hall-card-open",
    href: "#/" + hall.id,
    "aria-label": "Enter " + hall.name
  }, /*#__PURE__*/React.createElement("p", {
    className: "hall-card-name"
  }, hall.name), /*#__PURE__*/React.createElement("p", {
    className: "hall-card-plaque"
  }, "Open"));
}
function GuestBookCard({
  onOpenGuestBook
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "hall-card hall-card-open guest-book-card",
    onClick: onOpenGuestBook,
    "aria-label": "Open the guest book"
  }, /*#__PURE__*/React.createElement("p", {
    className: "hall-card-name"
  }, "Guest book"), /*#__PURE__*/React.createElement("p", {
    className: "hall-card-plaque"
  }, "Sign the book"));
}
function RotundaGrid({
  halls,
  onOpenGuestBook
}) {
  // Rotunda itself is the hub you're standing in, not one of its five
  // doorways — exclude it from the doorway grid (type: "hub" vs "hall").
  const doorways = halls.filter(hall => hall.type !== "hub");
  return /*#__PURE__*/React.createElement("div", {
    className: "museum-page"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "museum-page-title"
  }, "Rotunda"), /*#__PURE__*/React.createElement("p", {
    className: "museum-page-sub"
  }, "Five doorways. One is open."), /*#__PURE__*/React.createElement("div", {
    className: "hall-grid"
  }, doorways.map(hall => /*#__PURE__*/React.createElement(HallCard, {
    hall: hall,
    key: hall.id
  })), /*#__PURE__*/React.createElement(GuestBookCard, {
    onOpenGuestBook: onOpenGuestBook
  })));
}
function CabinetCard({
  cabinet
}) {
  return /*#__PURE__*/React.createElement("a", {
    className: "cabinet-card",
    href: "#/classics/" + cabinet.id,
    "aria-label": cabinet.title
  }, /*#__PURE__*/React.createElement("div", {
    className: "cabinet-card-art",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("div", {
    className: "attract-css attract-css-small"
  }, /*#__PURE__*/React.createElement("div", {
    className: "attract-css-marquee"
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null)))), /*#__PURE__*/React.createElement("p", {
    className: "cabinet-card-title"
  }, cabinet.title), /*#__PURE__*/React.createElement("p", {
    className: "cabinet-card-era"
  }, cabinet.era), cabinet.playable && /*#__PURE__*/React.createElement("span", {
    className: "cabinet-card-playable"
  }, "Playable"));
}
function ClassicsGrid({
  cabinets,
  entryNarration
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "museum-page"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "museum-page-title"
  }, "Classics"), entryNarration && /*#__PURE__*/React.createElement("p", {
    className: "museum-page-sub"
  }, entryNarration.text), /*#__PURE__*/React.createElement("div", {
    className: "cabinet-grid"
  }, cabinets.map(cabinet => /*#__PURE__*/React.createElement(CabinetCard, {
    cabinet: cabinet,
    key: cabinet.id
  }))));
}
window.MuseumGallery = {
  RotundaGrid,
  ClassicsGrid
};

})();
