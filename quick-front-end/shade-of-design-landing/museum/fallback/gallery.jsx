/* global React */
/*
 * 2D fallback renderer (DD-032 Item 3) — manifest-driven DOM gallery.
 * Same five JSON files as the 3D scene; no manifest fork. Content parity
 * with the 3D path is structural: both read halls.json/cabinets.json and
 * render the same counts (1 open + 4 sealed halls; 3 cabinets, 1 playable).
 */

function HallCard({ hall }) {
  const sealed = hall.doorway_state === "sealed";
  if (sealed) {
    return (
      <div
        className="hall-card hall-card-sealed"
        tabIndex={0}
        aria-label={hall.name + " — sealed for now, this hall is in formation"}
      >
        <p className="hall-card-name">{hall.name}</p>
        <p className="hall-card-plaque">{hall.sealed_plaque_text}</p>
      </div>
    );
  }
  return (
    <a
      className="hall-card hall-card-open"
      href={"#/" + hall.id}
      aria-label={"Enter " + hall.name}
    >
      <p className="hall-card-name">{hall.name}</p>
      <p className="hall-card-plaque">Open</p>
    </a>
  );
}

function GuestBookCard({ onOpenGuestBook }) {
  return (
    <button
      type="button"
      className="hall-card hall-card-open guest-book-card"
      onClick={onOpenGuestBook}
      aria-label="Open the guest book"
    >
      <p className="hall-card-name">Guest book</p>
      {/* JetBrains Mono kicker + Marcellus title per arch §2.1; invitation
          prose itself is JR-held, ships inside the modal, not this card. */}
      <p className="hall-card-plaque">Sign the book</p>
    </button>
  );
}

function RotundaGrid({ halls, onOpenGuestBook }) {
  // Rotunda itself is the hub you're standing in, not one of its five
  // doorways — exclude it from the doorway grid (type: "hub" vs "hall").
  const doorways = halls.filter((hall) => hall.type !== "hub");
  return (
    <div className="museum-page">
      <h1 className="museum-page-title">Rotunda</h1>
      <p className="museum-page-sub">Five doorways. One is open.</p>
      <div className="hall-grid">
        {doorways.map((hall) => (
          <HallCard hall={hall} key={hall.id} />
        ))}
        <GuestBookCard onOpenGuestBook={onOpenGuestBook} />
      </div>
    </div>
  );
}

function CabinetCard({ cabinet }) {
  return (
    <a className="cabinet-card" href={"#/classics/" + cabinet.id} aria-label={cabinet.title}>
      <div className="cabinet-card-art" aria-hidden="true">
        <div className="attract-css attract-css-small">
          <div className="attract-css-marquee">
            <span /><span /><span />
          </div>
        </div>
      </div>
      <p className="cabinet-card-title">{cabinet.title}</p>
      <p className="cabinet-card-era">{cabinet.era}</p>
      {cabinet.playable && <span className="cabinet-card-playable">Playable</span>}
    </a>
  );
}

function ClassicsGrid({ cabinets, entryNarration }) {
  return (
    <div className="museum-page">
      <h1 className="museum-page-title">Classics</h1>
      {entryNarration && <p className="museum-page-sub">{entryNarration.text}</p>}
      <div className="cabinet-grid">
        {cabinets.map((cabinet) => (
          <CabinetCard cabinet={cabinet} key={cabinet.id} />
        ))}
      </div>
    </div>
  );
}

window.MuseumGallery = { RotundaGrid, ClassicsGrid };
