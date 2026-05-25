# Platform Integration Matrix

Honest read on what each platform actually allows, what it costs, and how we integrate.

## Decision: scripts, not MCPs

For every platform below, the v1 integration is a Python script in the owning project's `scripts/` folder, called by the relevant agent, with credentials in `.env`. This matches the canonical Notion-via-scripts pattern used by HZ and LOFI_SANCTUARY.

Why not MCPs:
- No Anthropic-blessed MCP exists for any of these platforms.
- Community MCPs would be another moving part to maintain.
- Scripts give us tighter control over rate limits and ToS-compliant request shapes.
- Posting is manual in v1 anyway — MCP convenience earns its keep only when an agent posts autonomously, which we are not doing.

## Per-platform matrix

| Platform | Read API | Write API | Cost (v1) | Auth | Lib | Notes |
|---|---|---|---|---|---|---|
| **Twitter / X** | v2 free tier (read) | v2 paid (Basic $200/mo for posting) | $200/mo if we post via API | OAuth 2.0 | `tweepy` | V1: skip the paid tier. Drafts go in C-Comms packet; JR posts manually from the browser. |
| **Facebook (Pages)** | Graph API, free | Graph API, free — requires Meta App Review for Pages publishing | Free | OAuth 2.0, Page access token | `facebook-sdk` | App Review takes 1–2 weeks. Start the review now if FB posting matters in P1. |
| **Reddit** | Free, generous limits | Free; respect subreddit rules + global rate limits | Free | OAuth 2.0 | `praw` | Easiest of the five. Watch self-promotion rules per subreddit. |
| **Tumblr** | v2 API, free | v2 API, free | Free | OAuth 1.0a | `pytumblr` | OAuth1 is fiddly — budget an afternoon for the auth dance. Posts support rich HTML. |
| **Itch.io** | RSS read only | `butler` CLI for game/asset uploads only | Free | API key for butler | n/a | **Out of scope for HZ.** Lives in LOFI_SANCTUARY where the creator-community fit makes sense. |

## Auth file convention

Per project `.env`:

```
# Twitter (read-only on free tier; posting needs Basic)
TWITTER_BEARER_TOKEN=...
TWITTER_API_KEY=...
TWITTER_API_SECRET=...

# Facebook
FB_PAGE_ACCESS_TOKEN=...
FB_PAGE_ID=...

# Reddit
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=...
REDDIT_USERNAME=...
REDDIT_PASSWORD=...

# Tumblr
TUMBLR_CONSUMER_KEY=...
TUMBLR_CONSUMER_SECRET=...
TUMBLR_OAUTH_TOKEN=...
TUMBLR_OAUTH_SECRET=...
TUMBLR_BLOG_NAME=...
```

## ToS gotchas worth knowing

- **Twitter:** Posting from the free tier is a TOS violation. Either pay for Basic or post manually.
- **Facebook:** Outreach DMs to Pages you don't own = ban risk. Pages publishing (your own page) is fine post-App-Review.
- **Reddit:** Subreddit-specific self-promotion rules vary widely. C-Comms packet should name the target subreddit + cite its rules before JR approves.
- **Tumblr:** Generally permissive. Auto-posting is allowed; spam reports still apply.

## What unlocks an upgrade past v1

Move from manual-publish to script-publish (still gated by JR approving the packet) once:
1. Two full cycles have shipped without a packet needing rework.
2. Per-platform draft quality has been calibrated against actual engagement.
3. JR explicitly opts in per platform.
