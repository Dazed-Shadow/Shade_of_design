// DD-037 Phase 2 -- SR play-space reading room.
// Vanilla JS, no build step, no bundler. Reads the local cases.json /
// field-clerks.json manifests only -- never a vault markdown path.
//
// Hash routing, single page: #/fc/<id> and #/case/<id> render a document;
// no hash (or an unrecognized one) renders the plain Cases/Field Clerks
// index. Cross-ref resolution happens here, from the manifest id set --
// the exporter's cross_refs[] stays raw wikilink targets, no schema change.
// A [[wikilink]] whose target matches a loaded manifest id becomes an
// in-page route link; anything else degrades to the Phase-1 styled span,
// never a broken link.

(function () {
  "use strict";

  var state = { cases: [], fieldClerks: [] };
  var lookup = {}; // id -> { kind: "fc" | "case" }

  function buildLookup() {
    lookup = {};
    state.cases.forEach(function (c) {
      lookup[c.id] = { kind: "case" };
    });
    // Field Clerks win when both a case and an FC share an id (pre-decision 2:
    // link the SR-reading surface; the FC's own paired-case link carries the rest).
    state.fieldClerks.forEach(function (f) {
      lookup[f.id] = { kind: "fc" };
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
        encodeURIComponent(target) +
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

    root.appendChild(header);
    root.appendChild(renderSections(entry.sections));
  }

  function buildIndexGroup(label, entries, kind) {
    var section = document.createElement("section");
    section.className = "pw-section pw-index-group";

    var h2 = document.createElement("h2");
    h2.textContent = label;
    section.appendChild(h2);

    if (!entries.length) {
      var empty = document.createElement("p");
      empty.className = "pw-index-empty";
      empty.textContent = "None public yet.";
      section.appendChild(empty);
      return section;
    }

    var ul = document.createElement("ul");
    ul.className = "pw-index-list";
    entries.forEach(function (e) {
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

  function renderIndex() {
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
    root.appendChild(buildIndexGroup("Cases", state.cases, "case"));
    root.appendChild(buildIndexGroup("Field Clerks", state.fieldClerks, "fc"));
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
      renderIndex();
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
  ])
    .then(function (results) {
      state.cases = results[0].cases || [];
      state.fieldClerks = results[1].field_clerks || [];
      buildLookup();
      renderRoute();
      window.addEventListener("hashchange", renderRoute);
    })
    .catch(function (err) {
      renderError("Could not load manifests: " + err.message);
    });
})();
