---
name: handoff
description: Compress the current session into a handoff entry appended to pipeline/SESSION-LOG.md. Use when the user signals the session is ending — "wrap up," "handoff," "compress," "before we close," or any equivalent. Also use proactively if the user says they are about to start a new instance, switch to another Claude (Code or Design), or context is about to be summarized.
---

# Handoff — end-of-session compression

You are closing out a session. The deliverable is **one new entry at the top of `pipeline/SESSION-LOG.md`** that lets the next Claude instance (cloud Code, local Code, Design, or an Opus orchestrator) walk in cold and immediately know what was done, what's open, and what's brittle.

## Protocol

1. **Gather facts** — do not guess.
   - `git status` — any uncommitted work? If yes, surface it to the user before continuing.
   - `git log --oneline -10` — actual commits made this session.
   - `git branch --show-current` — current branch.
   - `git rev-parse HEAD` — last commit SHA.
   - `git diff --name-only <session-start-sha>..HEAD` — exact files touched (or scan commits if start SHA unknown).
   - Read the prior entry at the top of `pipeline/SESSION-LOG.md` so the new entry matches house style and you don't repeat unchanged context.

2. **Confirm the human's framing** — if there is any ambiguity about what the user was *trying to accomplish* (not what you happened to ship), ask them in one short question before writing. The "what the human was trying to do" section is the most valuable part for the next instance and must reflect their words, not your interpretation.

3. **Compose the entry** using the template below. Keep each section tight — this file will be read every session start, so every line earns its place.

4. **Append** to `pipeline/SESSION-LOG.md` directly under the `---` separator after the template-reference line. Do not edit prior entries.

5. **Commit and push** with message `Session handoff: <short topic>` so the entry is durable. If the user has uncommitted work, do not push without explicit approval.

6. **Reply to the user** with a one-paragraph confirmation: file updated, branch, final SHA, and the single most important thing the next instance should know.

## Entry template

```markdown
## YYYY-MM-DD · <Short session topic>

**Instance:** <Claude Code on the web | local Claude Code | Claude Design | other> · <model id, e.g., Sonnet 4.6>
**Operator:** <user handle / name>
**Branch:** `<branch>` → <merged to main? yes/no, with method>
**Final commit on main:** `<sha>` (<merge|direct>) — last feature commit `<sha>`
**Deploy target:** <Netlify auto-deploy on main | manual | none>

### What the human was trying to do

<1-3 sentences in the user's framing. Not your post-hoc interpretation.>

### What shipped

1. **<Topic>** (`<sha>`)
   - <Concrete change, file or feature scoped.>
2. **<Topic>** (`<sha>`)
   - <...>

### Files touched

- `<path>` — <one-line note on what changed>
- `<path>` — <...>

### Open follow-ups

- **<item>** — <one line on why it's deferred or what blocks it>

### What's brittle / assumptions

- <External API with no SLA, credential committed in source, assumption about user's local env, etc.>

### Hand-off note to the next instance

<If the user returns wanting to do X, Y, or Z — what should the next Claude do first?
Where are the landmines? What's the *one* thing they should not undo by accident?>

---
```

## Style rules

- **One file at a time when editing prior content** — never bulk-rewrite the log.
- **Newest entry at the top**, immediately under the header block.
- **No emojis** unless the user has them elsewhere in the file.
- **Names commits explicitly** — `df8cd98`, not "the bug-fix commit."
- **Quote the user** where their words sharpen meaning, especially in "what they were trying to do."
- **Flag environment context** that the next instance won't see: cloud vs local, paid subscriptions in play, credentials committed, MCP servers connected, deferred tool availability.
- **If you don't know, say so.** Better to write "uncertain whether Netlify finished deploy at handoff time" than to invent confidence.

## When NOT to invoke this skill

- Mid-session checkpoints — let the conversation carry; the log is for boundary moments.
- Pure question-answering sessions with no code changes — there is nothing to hand off.
- When the user is mid-task and only paused — wait for the explicit close signal.

## Cross-instance compatibility

This file lives in the repo at `.claude/skills/handoff/SKILL.md` so any Claude Code instance opening the repo can use it. Claude Design does not execute skills but can read `pipeline/SESSION-LOG.md` as plain Markdown — write entries with that audience in mind too.
