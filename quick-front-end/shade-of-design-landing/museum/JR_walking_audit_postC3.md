> URL to hit for testing: https://shadeofdesign.net/museum/index.html (type it directly — tile 05 is still marked "In formation" so it doesn't click through yet; last step of this guide flips it to "Live")

# Three audits, in order:

1. Fresh-session re-verify (10 min) — you walk through the whole museum in a clean browser tab, confirm nothing's broken

2. axe DevTools (15 min) — automated accessibility scanner catches ARIA/focus/semantic issues a human eye misses

3. Tab-order fuzz (10 min) — you press Tab through everything and confirm keyboard users can reach every interactive element in a sensible order



___
# Audit 1 — Fresh-session re-verify
Open a fresh Incognito / Private window (Chrome: Ctrl+Shift+N · Firefox: Ctrl+Shift+P · Edge: Ctrl+Shift+N). Fresh window = no leftover localStorage from any prior testing.

! Navigate to https://shadeofdesign.net/museum/index.html. Walk through this checklist:


- Threshold appears with two buttons: "Enter with sound" · "Enter quietly"
==Confirmed

Click "Enter with sound" → obsidian faceted cylinder rotunda renders with warm doorway glow at Classics + 4 sealed doorways
==needs work
```
There is no visual distinction between any foreground display and the background. We need an absolute uplift, but it can be the lack of 3D models to lean on, and more visual focus needed post the objects created in Checkpoint3. 


```


Audio starts playing (Jahna's track); volume slider visible top-right corner
==Confirmed



Arrow-Right moves you through 8 waypoints in sequence: rotunda-center → rotunda-guest-book → classics-entry → classics-mid → classics-mazechase → classics-dk → classics-mario → classics-back. Arrow-Left retreats.

==needs work
```
I believe we need to check how the navigation is mapped to the pedestals/arcade machines. There is some disconnect and this place feels much more like a void with no assets added to the design. It is the soul, and right now we have a skeleton we need to operate on. 

```


Each waypoint shows a placard overlay with text; announcement fires (screen-reader would speak it)
==needs work
```
The visitor is ahead once step compared to the display that is being shown on screen. 

```

At rotunda-center, the 4 sealed-door plaques appear (Racing, etc. — "In formation"). Elsewhere, hidden.
==Confirmed


At rotunda-guest-book waypoint, "Sign the book" affordance appears → click → modal opens → shows "Leave your name if you want a marker. The obsidian remembers either way." → type a name → "Sign the book" → confirms. Reload the page → threshold no longer shows (opt-in persisted) OR different behavior; note what happens. Return to guest book waypoint → should show your signed name + "Not {name}?" / "Scratch your name out" options.
==confirmed
```
Simple test shows that this is something we need to have a navigation route. Once assets and content is filled, the void will lighten up with soul.
```


At classics-mazechase waypoint, "Look closer" affordance → click → cabinet zoom overlay opens with placard text + "Play" button → click Play → mini-game mounts → Arrow-Right moves the character (hits walls) → Escape closes overlay
==needs work
```
I know this was a fast call by Fable as we had to not worry about infridgement. We need to put a lot more work in what was created. The game itself is nicely embed in frame, but the gameplay is not enjoyable, and is extremely basic in style and gameplay. I think we find a way to build out games themsevles as assets on the side to then implement into the museum. Compartmentalize the game building so their is more design love, attention to detail, and true gameplay replayability instead of checking things off. 

```


Volume slider — drag it; audio volume changes. Mute button (speaker glyph) toggles silence. Reload page → volume state persists.
==confirmed
```
Slider works, but there is no mute besides just completely pushing the bar to the left.

```


Resize browser window to ~375px wide (or F12 → device toolbar → iPhone SE) → 3D scene disappears, 2D fallback renders (grid of hall cards + guest book card). Same guest book modal works in 2D.

```
Fall back on the mobile version shows a basic text experience with the museum section 4 sealed-door plaques. When clicking on classics, there is no way to back out. You see the three games in just blocked text. Once clicked into maze crawler, it shows a zoomed in white screen with two white wide oval figures. Inference leads me to believe the left is to play the game and right is to go back. When clicking the left, the game does show in the same embedded view (as the desktop view) just now with a white background behind it. 

The game experience needs an incredible amount of updating, but this is not different than the experience on the desktop version. 

```


Search the visible page for <<HELD — Ctrl+F, search <<HELD. Should return zero matches on any page state.
==unconfirmed
```
I was not able to attempt this.

```


Open browser DevTools console (F12 → Console tab) — should have zero red errors.
==error
```
three.min.js:1 Scripts "build/three.js" and "build/three.min.js" are deprecated with r150+, and will be removed with r160. Please use ES Modules or alternatives: https://threejs.org/docs/index.html#manual/en/introduction/Installation
(anonymous) @ three.min.js:1


```

> Any of these fail → note which one + copy any console error text → send it back to me.
___


# Audit 2 — axe DevTools
axe DevTools is a browser extension from Deque Systems. It's the industry-standard automated accessibility scanner. Free tier is fine.

Install (one-time, ~2 min)
Chrome / Edge:

Open Chrome Web Store: https://chrome.google.com/webstore
Search: axe DevTools
Install "axe DevTools - Web Accessibility Testing" by Deque Systems (blue axe icon)
Confirm the extension icon appears in your toolbar
Firefox: same flow via https://addons.mozilla.org, same package name.

Run the scan (~10 min for full museum)
Open https://shadeofdesign.net/museum/index.html in a fresh tab
Open browser DevTools: F12 (or right-click page → "Inspect")
In the DevTools panel, look for a new tab labeled "axe DevTools" (may be under a >> overflow menu if the panel is narrow)
Click axe DevTools tab → click "Scan ALL of my page" button
Wait ~5 seconds for scan → results list appears grouped by severity:
Critical — must fix (e.g., missing form labels, keyboard traps)
Serious — should fix (e.g., color contrast, ARIA misuse)
Moderate / Minor — nice-to-fix
Re-run the scan on each museum state — axe scans what's on-screen right now, so you need to trigger each state and scan each:
Threshold view (before clicking "Enter with sound")
Rotunda at rotunda-center (fresh entry)
Rotunda at guest-book waypoint (Sign the book affordance visible)
Guest book modal open (unsigned state) → scan
Guest book modal open (signed state, after you sign) → scan
Classics hall at any waypoint
Cabinet zoom overlay open at maze-chase → scan (with Play button + placard visible)
2D fallback at 375px → scan
What "clean" looks like
Zero Critical, zero Serious = ship-clean. Screenshot the results (or note "0 Critical, 0 Serious") and send back to me.
Any Critical or Serious findings = send me the finding text + which state triggered it. I'll assess if it blocks ship or if we can note-and-follow-up.
Moderate / Minor findings are informational — worth noting but not blocking.

___
# Audit 3 — Tab-order fuzz
This is a manual test — press Tab, watch where focus goes.

In the same fresh browser tab:

Load https://shadeofdesign.net/museum/index.html
Click somewhere neutral (blank area of page) so nothing has focus
Press Tab — an interactive element gets a visible outline (usually blue/ember on our site)
Continue pressing Tab — focus should progress element by element in a top-to-bottom, left-to-right order matching how you'd read the page
Note anything wrong:
Focus jumps to a weird place (out of visual order)
Focus disappears (skips an element that should be focusable)
Focus gets stuck — Tab does nothing, can't escape
Focus hits an invisible/off-screen element — Tab lands on something not visible
Run this cycle on each state:

Threshold (should Tab between "Enter with sound" and "Enter quietly")
Rotunda entered (should Tab through Continue/Step-back buttons, sealed plaques when visible, volume control, cabinet/guest-book affordances when at their waypoint)
Guest book modal open — Tab should stay inside the modal (name input → Sign button → Escape closes). This is called a "focus trap" — modals should trap focus so keyboard users don't accidentally tab out to the page behind
Cabinet zoom overlay open — same focus-trap behavior expected
2D fallback at 375px — Tab through the grid cards + guest book card
What "clean" looks like
Focus moves in visual order, every interactive element is reachable, modals trap focus, Shift+Tab reverses cleanly. Send back a "clean" signal.
Anything weird → describe what happened at which step. I assess.