// DD-037 Phase 2 -- SR play-space reading room.
// Vanilla JS, no build step, no bundler. Reads the local cases.json /
// field-clerks.json manifests only -- never a vault markdown path.
//
// Hash routing, single page: #/fc/<id> and #/case/<id> render a document;
// no hash (or an unrecognized one) renders the browse layer (DD-037 Phase 4:
// shelf + war-chest drawer + gallery + Horizon panels, then the grouped
// Cases/Field Clerks list). Cross-ref resolution happens here, from the manifest id set --
// the exporter's cross_refs[] stays raw wikilink targets, no schema change.
// A [[wikilink]] whose target matches a loaded manifest id becomes an
// in-page route link; anything else degrades to the Phase-1 styled span,
// never a broken link.

(function () {
  "use strict";

  var state = { cases: [], fieldClerks: [], warchest: [], gallery: [] };
  var lookup = {}; // key (id OR source_slug) -> { kind: "fc" | "case", id: canonical id }

  // DD-037 Phase 4: register each entry under both its id and its
  // source_slug (when the two differ). Closes the Phase-2 ruled gap --
  // [[trump_v_cook|...]] is a slug-style wikilink, not a docket-style one,
  // and the corpus's own cross-refs use it (trump_v_cook.md <-> 25A312.md
  // share a docket id, so an id-only lookup can never disambiguate the
  // case from the Field Clerk by that route). The href always carries the
  // canonical id, never the raw wikilink target, so renderRoute()'s
  // id-keyed array lookup keeps working unchanged.
  function buildLookup() {
    lookup = {};
    function register(entry, kind) {
      lookup[entry.id] = { kind: kind, id: entry.id };
      if (entry.source_slug && entry.source_slug !== entry.id) {
        lookup[entry.source_slug] = { kind: kind, id: entry.id };
      }
    }
    state.cases.forEach(function (c) {
      register(c, "case");
    });
    // Field Clerks win when both a case and an FC share an id (pre-decision 2:
    // link the SR-reading surface; the FC's own paired-case link carries the rest).
    state.fieldClerks.forEach(function (f) {
      register(f, "fc");
    });
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderCrossRef(target, display) {
    var hit = lookup[target];
    if (hit) {
      return (
        '<a class="pw-xref-link" href="#/' +
        hit.kind +
        "/" +
        encodeURIComponent(hit.id) +
        '">' +
        display +
        "</a>"
      );
    }
    return '<span class="pw-xref">' + display + "</span>";
  }

  function renderInline(text) {
    var s = escapeHtml(text);
    s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_m, target, display) {
      var t = target.trim();
      return renderCrossRef(t, display ? display.trim() : t);
    });
    s = s.replace(/`([^`]+)`/g, '<code class="pw-inline-code">$1</code>');
    // Triple-asterisk case-name callouts must resolve before ** and * or they
    // leave stray asterisks. Real corpus construct, and it's ASYMMETRIC, not
    // ***bold-italic***: "***Humphrey's Executor*, 295 U.S. 602 (1935) --
    // OVERRULED TODAY:**" opens bold+italic together but closes the italic
    // after just the case name (single *), then closes the bold later (**).
    // Handle that nested-open shape first, then a true symmetric ***x*** as
    // a fallback, then plain ** and *.
    s = s.replace(/\*\*\*([^*]+?)\*([^*]*?)\*\*/g, "<strong><em>$1</em>$2</strong>");
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
    // Bold spans routinely contain a nested italic case name ("**whether
    // *Humphrey's Executor v. United States*, 295 U.S. 602 (1935)**") -- a
    // plain `\*\*([^*]+)\*\*` can't cross the inner single stars and leaves
    // the whole span as literal asterisks. Allow non-star runs OR a nested
    // *italic* span inside a bold span, and render the nested italic first.
    s = s.replace(/\*\*((?:[^*]|\*[^*]+\*)+)\*\*/g, function (_m, inner) {
      var innerHtml = inner.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      return "<strong>" + innerHtml + "</strong>";
    });
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return s;
  }

  var LIST_RE = /^(?:[-*]|\d+\.)\s+/;
  var QUOTE_RE = /^>\s?/;

  function parseBlocks(md) {
    var lines = md.split("\n");
    var blocks = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (line.trim() === "") {
        i++;
        continue;
      }

      if (LIST_RE.test(line)) {
        var ordered = /^\d+\.\s+/.test(line);
        var items = [];
        while (i < lines.length && LIST_RE.test(lines[i])) {
          var itemText = lines[i].replace(LIST_RE, "");
          var checked = null;
          var cb = itemText.match(/^\[( |x|X)\]\s+(.*)$/);
          if (cb) {
            checked = cb[1].toLowerCase() === "x";
            itemText = cb[2];
          }
          items.push({ text: itemText, checked: checked });
          i++;
        }
        blocks.push({ type: ordered ? "ol" : "ul", items: items });
        continue;
      }

      if (QUOTE_RE.test(line)) {
        var quoteLines = [];
        while (i < lines.length && QUOTE_RE.test(lines[i])) {
          quoteLines.push(lines[i].replace(QUOTE_RE, ""));
          i++;
        }
        blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
        continue;
      }

      var paraLines = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !LIST_RE.test(lines[i]) &&
        !QUOTE_RE.test(lines[i])
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "p", text: paraLines.join(" ") });
    }

    return blocks;
  }

  // Sanctioned jewel #2: Play Set checklists render as real, read-only
  // (disabled) checkbox inputs -- not unicode glyphs. Sanctioned jewel #3:
  // bold stays plain <strong>, no badge wrapping, handled by renderInline.
  function renderBlock(b) {
    if (b.type === "p") {
      return "<p>" + renderInline(b.text) + "</p>";
    }
    if (b.type === "blockquote") {
      return "<blockquote>" + renderInline(b.text) + "</blockquote>";
    }
    if (b.type === "ul" || b.type === "ol") {
      var items = b.items
        .map(function (it) {
          if (it.checked !== null) {
            var checkedAttr = it.checked ? " checked" : "";
            return (
              '<li class="pw-checkitem"><label class="pw-checklabel">' +
              '<input type="checkbox" class="pw-checkbox" disabled' +
              checkedAttr +
              " />" +
              "<span>" +
              renderInline(it.text) +
              "</span></label></li>"
            );
          }
          return "<li>" + renderInline(it.text) + "</li>";
        })
        .join("");
      return "<" + b.type + ">" + items + "</" + b.type + ">";
    }
    return "";
  }

  function renderMarkdown(md) {
    return parseBlocks(md).map(renderBlock).join("");
  }

  function isCarryForward(heading) {
    return (heading || "").trim().toLowerCase() === "carry this forward";
  }

  // Sanctioned jewel #1: "Carry this forward" blockquotes get the pull-quote
  // treatment. The section's markdown is unchanged; only the resulting
  // <blockquote> element gets a class -- no new parser state needed.
  function renderSections(sections) {
    var frag = document.createDocumentFragment();
    (sections || []).forEach(function (section) {
      var el = document.createElement("section");
      el.className = "pw-section";

      if (section.heading) {
        var h2 = document.createElement("h2");
        h2.textContent = section.heading;
        el.appendChild(h2);
      }

      var body = document.createElement("div");
      body.innerHTML = renderMarkdown(section.content_markdown || "");

      if (isCarryForward(section.heading)) {
        var bq = body.querySelector("blockquote");
        if (bq) {
          bq.classList.add("pw-pullquote");
        }
      }

      el.appendChild(body);
      frag.appendChild(el);
    });
    return frag;
  }

  function makeBackLink() {
    var back = document.createElement("a");
    back.className = "pw-back-link";
    back.href = "#/";
    back.textContent = "\u2190 Index";
    return back;
  }

  function renderDocument(entry, kind) {
    var root = document.getElementById("root");
    root.innerHTML = "";
    root.appendChild(makeBackLink());

    var header = document.createElement("header");
    header.className = "pw-header";

    var docket = document.createElement("p");
    docket.className = "pw-docket";
    docket.textContent = entry.docket_number;
    header.appendChild(docket);

    var kindLabel = document.createElement("p");
    kindLabel.className = "pw-kind";
    kindLabel.textContent = kind === "fc" ? "FIELD CLERK" : "CASE SYNTHESIS";
    header.appendChild(kindLabel);

    var title = document.createElement("h1");
    title.className = "pw-title";
    title.textContent = entry.title;
    header.appendChild(title);

    if (entry.court || entry.decision_date) {
      var byline = document.createElement("p");
      byline.className = "pw-byline";
      byline.textContent = [entry.court, entry.decision_date].filter(Boolean).join(" \u00b7 ");
      header.appendChild(byline);
    }

    // DD-037 Phase 5, pre-decision 4: cases only (FCs are internal work
    // product, no source line), and only when the frontmatter has it --
    // a case missing source_url simply renders no line, not an error.
    // Label derives from the URL's own host: the corpus sources from more
    // than one archive (courtlistener.com, supremecourt.gov), and a
    // hardcoded "CourtListener" would mislabel every non-CL source.
    if (kind === "case" && entry.source_url) {
      var sourceHost = "";
      try {
        sourceHost = new URL(entry.source_url).hostname.replace(/^www\./, "");
      } catch (err) {
        sourceHost = "";
      }
      var sourceLine = document.createElement("p");
      sourceLine.className = "pw-source-line";
      var sourceLink = document.createElement("a");
      sourceLink.href = entry.source_url;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener";
      sourceLink.textContent = sourceHost ? "Source: " + sourceHost : "Source";
      sourceLine.appendChild(sourceLink);
      header.appendChild(sourceLine);
    }

    root.appendChild(header);
    root.appendChild(renderSections(entry.sections));
  }

  // excludeKeys are "kind:id" pairs, not bare ids -- a paired case and FC
  // share a docket id (25A312, 25-332), so excluding by id alone would hide
  // a case synthesis from the grouped list whenever its paired FC is shelved.
  function buildIndexGroup(label, entries, kind, excludeKeys) {
    var section = document.createElement("section");
    section.className = "pw-section pw-index-group";

    var h2 = document.createElement("h2");
    h2.textContent = label;
    section.appendChild(h2);

    var shown = excludeKeys
      ? entries.filter(function (e) {
          return excludeKeys.indexOf(kind + ":" + e.id) === -1;
        })
      : entries;

    if (!shown.length) {
      var empty = document.createElement("p");
      empty.className = "pw-index-empty";
      empty.textContent = "None public yet.";
      section.appendChild(empty);
      return section;
    }

    var ul = document.createElement("ul");
    ul.className = "pw-index-list";
    shown.forEach(function (e) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#/" + kind + "/" + encodeURIComponent(e.id);
      a.textContent = e.title;
      li.appendChild(a);
      ul.appendChild(li);
    });
    section.appendChild(ul);
    return section;
  }

  // --- Browse layer (DD-037 Phase 4) -------------------------------------
  // The shelf, drawer, gallery, and Horizon panels below are the "play
  // space" chrome the pre-decisions describe. None of it touches
  // renderDocument/renderSections/parseBlocks/renderInline -- the reading
  // room stays exactly as Phase 2/3 shipped it (guardrail: chrome is
  // additive, templates are not touched).

  function stripMarkdownForExcerpt(text) {
    var s = text;
    s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_m, target, display) {
      return display ? display.trim() : target.trim();
    });
    s = s.replace(/`([^`]+)`/g, "$1");
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
    s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
    s = s.replace(/\*([^*]+)\*/g, "$1");
    s = s.replace(/^>\s?/, "");
    return s;
  }

  function truncate(text, maxLen) {
    if (text.length <= maxLen) {
      return text;
    }
    return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
  }

  // One-line first-section excerpt for a shelf hero band: the first
  // non-empty section's first line of prose, markdown stripped to plain
  // text, cut to one sentence (or truncated) at a reader-friendly length.
  function excerptFor(entry) {
    var sections = entry.sections || [];
    for (var i = 0; i < sections.length; i++) {
      var raw = (sections[i].content_markdown || "").trim();
      if (!raw) {
        continue;
      }
      var firstLine = raw.split("\n").filter(function (l) {
        return l.trim() !== "";
      })[0] || "";
      var plain = stripMarkdownForExcerpt(firstLine).trim();
      if (!plain) {
        continue;
      }
      var periodIdx = plain.indexOf(". ");
      var sentence = periodIdx > -1 && periodIdx < 155 ? plain.slice(0, periodIdx + 1) : plain;
      return truncate(sentence, 160);
    }
    return "";
  }

  function dateKey(entry) {
    return (entry.updated_at || "").replace(/\//g, "-");
  }

  function buildShelfBand(entry, kind) {
    var a = document.createElement("a");
    a.className = "pw-shelf-band";
    a.href = "#/" + kind + "/" + encodeURIComponent(entry.id);

    var meta = document.createElement("p");
    meta.className = "pw-shelf-meta";
    meta.textContent = (kind === "fc" ? "FIELD CLERK" : "CASE SYNTHESIS") + " · " + entry.docket_number;
    a.appendChild(meta);

    var title = document.createElement("h3");
    title.className = "pw-shelf-title";
    title.textContent = entry.title;
    a.appendChild(title);

    var excerpt = excerptFor(entry);
    if (excerpt) {
      var p = document.createElement("p");
      p.className = "pw-shelf-excerpt";
      p.textContent = excerpt;
      a.appendChild(p);
    }

    return a;
  }

  // Shelf: the default route's plain list matures into last-3-first hero
  // bands (temporal, resume-reading grammar) with everything else below as
  // the familiar grouped list -- same tokens as the gallery, different
  // layout grammar only (pre-decision 3).
  function buildShelf() {
    var all = state.cases
      .map(function (e) {
        return { entry: e, kind: "case" };
      })
      .concat(
        state.fieldClerks.map(function (e) {
          return { entry: e, kind: "fc" };
        })
      );

    all.sort(function (a, b) {
      var ka = dateKey(a.entry);
      var kb = dateKey(b.entry);
      if (ka === kb) {
        return 0;
      }
      return ka < kb ? 1 : -1;
    });

    var recent = all.slice(0, 3);

    var section = document.createElement("section");
    section.className = "pw-section pw-shelf";

    if (recent.length) {
      var list = document.createElement("div");
      list.className = "pw-shelf-list";
      recent.forEach(function (item) {
        list.appendChild(buildShelfBand(item.entry, item.kind));
      });
      section.appendChild(list);
    }

    return {
      section: section,
      recentKeys: recent.map(function (item) {
        return item.kind + ":" + item.entry.id;
      }),
    };
  }

  // Drawer: war-chest specimens as index-card objects. Renders entirely
  // from warchest.json -- adding a doctrine is a data change (regenerate
  // the export), never a code change.
  function buildDrawer() {
    var section = document.createElement("section");
    section.className = "pw-section pw-drawer-group";

    var h2 = document.createElement("h2");
    h2.textContent = "War Chest";
    section.appendChild(h2);

    if (!state.warchest.length) {
      var empty = document.createElement("p");
      empty.className = "pw-index-empty";
      empty.textContent = "No named doctrines yet.";
      section.appendChild(empty);
      return section;
    }

    var grid = document.createElement("div");
    grid.className = "pw-drawer-grid";

    state.warchest.forEach(function (specimen) {
      var card = document.createElement("div");
      card.className = "pw-drawer-card";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pw-drawer-name";
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = specimen.name.replace(/-/g, " ");

      var count = document.createElement("span");
      count.className = "pw-drawer-count";
      count.textContent = String(specimen.count);
      btn.appendChild(count);

      var panel = document.createElement("ul");
      panel.className = "pw-drawer-fcs";
      panel.hidden = true;
      (specimen.from_fcs || []).forEach(function (fcId) {
        var fc = state.fieldClerks.find(function (f) {
          return f.id === fcId;
        });
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#/fc/" + encodeURIComponent(fcId);
        a.textContent = fc ? fc.title : fcId;
        li.appendChild(a);
        panel.appendChild(li);
      });

      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        panel.hidden = open;
      });

      card.appendChild(btn);
      card.appendChild(panel);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  // Gallery: a simple spatial grid rendering JR-approved concept art from
  // its hand-authored source data file. Ships hidden-when-empty if nothing
  // is approved yet -- never hand-placed image markup.
  function buildGallery() {
    var section = document.createElement("section");
    section.className = "pw-section pw-gallery-group";

    if (!state.gallery.length) {
      section.hidden = true;
      return section;
    }

    var h2 = document.createElement("h2");
    h2.textContent = "Gallery";
    section.appendChild(h2);

    var grid = document.createElement("div");
    grid.className = "pw-gallery-grid";

    state.gallery.forEach(function (item) {
      var figure = document.createElement("figure");
      figure.className = "pw-gallery-item";

      var img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title || "";
      img.loading = "lazy";
      figure.appendChild(img);

      var caption = document.createElement("figcaption");
      caption.textContent = item.caption || item.title || "";
      figure.appendChild(caption);

      grid.appendChild(figure);
    });

    section.appendChild(grid);
    return section;
  }

  // Horizon Axis (Ms.G's research, re-entering per the Phase-4 ruling):
  // links only, no APIs, no fetching, no tracking. Tap-to-toggle per the
  // redesign ruling -- no hover dependence, keyboard accessible via native
  // <button> + aria-expanded.
  var HORIZON_PANELS = [
    {
      label: "Research Repositories",
      links: [
        { name: "CourtListener", href: "https://www.courtlistener.com/" },
        { name: "Justia", href: "https://www.justia.com/" },
        { name: "Supreme Court", href: "https://www.supremecourt.gov/" },
        { name: "Google Scholar", href: "https://scholar.google.com/" },
      ],
    },
    {
      label: "Radar Intel",
      links: [
        { name: "USAspending", href: "https://www.usaspending.gov/" },
        { name: "PACER / PCL", href: "https://pcl.uscourts.gov/" },
        { name: "Scaling Laws (Lawfare)", href: "https://www.lawfaremedia.org/podcasts-multimedia/podcast/scaling-laws" },
        { name: "Strict Scrutiny (Crooked Media)", href: "https://www.crooked.com/podcast-series/strict-scrutiny/" },
        { name: "Stay Tuned with Preet (CAFE)", href: "https://cafe.com/stay-tuned-podcast/" },
      ],
    },
  ];

  function buildHorizon() {
    var section = document.createElement("section");
    section.className = "pw-section pw-horizon-group";

    var h2 = document.createElement("h2");
    h2.textContent = "Horizon";
    section.appendChild(h2);

    var wrap = document.createElement("div");
    wrap.className = "pw-horizon-panels";

    HORIZON_PANELS.forEach(function (panelDef, i) {
      var panelId = "pw-horizon-panel-" + i;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pw-horizon-toggle";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", panelId);
      btn.textContent = panelDef.label;

      var list = document.createElement("ul");
      list.className = "pw-horizon-links";
      list.id = panelId;
      list.hidden = true;

      panelDef.links.forEach(function (link) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = link.href;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = link.name;
        li.appendChild(a);
        list.appendChild(li);
      });

      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        list.hidden = open;
      });

      var block = document.createElement("div");
      block.className = "pw-horizon-block";
      block.appendChild(btn);
      block.appendChild(list);
      wrap.appendChild(block);
    });

    section.appendChild(wrap);
    return section;
  }

  function renderBrowse() {
    var root = document.getElementById("root");
    root.innerHTML = "";

    var header = document.createElement("header");
    header.className = "pw-header";

    var kicker = document.createElement("p");
    kicker.className = "pw-docket";
    kicker.textContent = "SR Reading Room";
    header.appendChild(kicker);

    var title = document.createElement("h1");
    title.className = "pw-title";
    title.textContent = "Legal Research Corpus";
    header.appendChild(title);

    root.appendChild(header);

    var shelf = buildShelf();
    root.appendChild(shelf.section);

    root.appendChild(buildDrawer());
    root.appendChild(buildGallery());
    root.appendChild(buildHorizon());

    root.appendChild(buildIndexGroup("Cases", state.cases, "case", shelf.recentKeys));
    root.appendChild(buildIndexGroup("Field Clerks", state.fieldClerks, "fc", shelf.recentKeys));
  }

  function renderNotFound(route) {
    var root = document.getElementById("root");
    root.innerHTML = "";
    root.appendChild(makeBackLink());
    var p = document.createElement("p");
    p.className = "pw-error";
    p.textContent = "Not found: " + route.kind + "/" + route.id;
    root.appendChild(p);
  }

  function renderError(message) {
    var root = document.getElementById("root");
    root.innerHTML = '<p class="pw-error">' + escapeHtml(message) + "</p>";
  }

  function parseHash() {
    var h = window.location.hash || "";
    var m = h.match(/^#\/(fc|case)\/(.+)$/);
    if (!m) {
      return null;
    }
    return { kind: m[1], id: decodeURIComponent(m[2]) };
  }

  function renderRoute() {
    var route = parseHash();
    if (!route) {
      renderBrowse();
      return;
    }
    var list = route.kind === "fc" ? state.fieldClerks : state.cases;
    var entry = list.find(function (e) {
      return e.id === route.id;
    });
    if (!entry) {
      renderNotFound(route);
      return;
    }
    renderDocument(entry, route.kind);
  }

  // file:// fallback: fetch() is origin-blocked when index.html is opened
  // from disk, but the script-tag sibling (data/*.js) loads fine and exposes
  // the same compiled manifest as a global. Same artifact, second wrapper.
  function loadManifest(jsonPath, globalName) {
    return fetch(jsonPath)
      .then(function (resp) {
        if (!resp.ok) {
          throw new Error(jsonPath + " request failed (" + resp.status + ")");
        }
        return resp.json();
      })
      .catch(function (err) {
        if (window[globalName]) {
          return window[globalName];
        }
        throw err;
      });
  }

  Promise.all([
    loadManifest("data/cases.json", "SOD_MANIFEST_CASES"),
    loadManifest("data/field-clerks.json", "SOD_MANIFEST_FIELD_CLERKS"),
    loadManifest("data/warchest.json", "SOD_MANIFEST_WARCHEST"),
    loadManifest("data/gallery.json", "SOD_MANIFEST_GALLERY"),
  ])
    .then(function (results) {
      state.cases = results[0].cases || [];
      state.fieldClerks = results[1].field_clerks || [];
      state.warchest = results[2].warchest || [];
      state.gallery = results[3].gallery || [];
      buildLookup();
      renderRoute();
      window.addEventListener("hashchange", renderRoute);
    })
    .catch(function (err) {
      renderError("Could not load manifests: " + err.message);
    });
})();
