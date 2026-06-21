# Career Dashboard

A single-page job-search workspace. Track applications, build and export a CV,
write tailored cover letters, check a posting for missing keywords, and pull live
job listings into one place. It runs locally and keeps your data in the browser.
A small local server (the "bridge") adds the AI features and the live job feed.

No build step and no framework. The front end is plain HTML/CSS/JavaScript; the
bridge is a single Node file with no dependencies.

## Features

- Application tracker: kanban board, follow-up dates, basic funnel stats
- CV builder with live preview and print-to-PDF
- Cover-letter editor with AI assist (rewrite, shorten, translate)
- ATS keyword check against a pasted job description
- Job Radar: live listings from several public job APIs, ranked against your CV
- Bilingual UI (English / French), light and dark theme, installable as a PWA

The AI works from whatever you put in your CV; it is not tied to any one field.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer (for the bridge)
- For AI, one of: an Anthropic API key, or the Claude Code CLI (Pro/Max plan)
- Optional: a free [Adzuna](https://developer.adzuna.com) key for on-site listings

The dashboard opens without a server, but the AI features and the live job feed
need the bridge running.

## Setup

1. Clone the repository.
2. Copy `.env.example` to `.env` and set what you want. Everything is optional:
   - `ANTHROPIC_API_KEY` to use the Anthropic API, or leave it blank to use the
     Claude Code CLI instead.
   - `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` for on-site job listings.

## Running it

Windows: double-click `Launch Dashboard.cmd`. It starts the bridge and opens the
app in your browser.

macOS or Linux:

    sh bridge/start-bridge.sh

Any platform:

    node bridge/server.mjs

Then open http://localhost:8787. Use that URL (served by the bridge) rather than
opening `index.html` directly, so the app and API share one origin and the app
can be installed.

## How the AI works

The bridge exposes `POST /ai` and uses one of two backends:

- If `ANTHROPIC_API_KEY` is set, it calls the Anthropic API.
- Otherwise it runs the `claude` CLI, which uses your Claude Code subscription
  (no API key).

If neither is available, the AI buttons fall back to copy-prompt mode: the app
builds the prompt, you paste it into Claude, then paste the answer back.

Requests are routed by task — short edits use a fast model, tailoring and audits
use a stronger one. In CLI mode the app can also let the model use web search for
research (job strategy, company lookups).

## Job feed

`GET /jobs` proxies several free public job APIs server-side (Remotive, RemoteOK,
Arbeitnow, Jobicy, The Muse, Himalayas) and, if configured, Adzuna. Results are
normalized, de-duplicated, filtered (keyword, region, language, seniority), and
scored against your CV. They are cached in memory for about eight minutes.

These public APIs lean remote and developer-focused. For on-site roles in a
specific country, add an Adzuna key (UK, US, Canada, Germany, and others) or use
the curated board links in the app.

## Privacy

Your data is stored in the browser's localStorage. Nothing leaves your machine
except the AI requests you trigger (to Anthropic, or to your local Claude CLI)
and the calls the job feed makes to the public job APIs. The bridge listens on
localhost by default. Your `.env` and the optional local backups under
`bridge/backups/` are gitignored.

## Project layout

    index.html, app.js, style.css   front end (single-page app)
    sw.js, manifest.json, icon.svg  PWA shell
    bridge/server.mjs               local server: /ai, /jobs, /backup, /health, static files
    bridge/test.mjs                 tests for the bridge's pure functions
    .env.example                    configuration template

## Development

The bridge's pure logic (job filtering, language and region detection) has a
small test suite with no dependencies:

    node bridge/test.mjs

## Disclaimer

This is a personal tool, provided as is and without warranty (see the license).
A few practical notes:

- It is not affiliated with or endorsed by Anthropic, Adzuna, or any of the job
  boards it links to or queries. Product names and trademarks belong to their
  owners.
- The job feed and AI features call third-party services (the public job APIs and
  Anthropic). You are responsible for using those services within their terms and
  for any costs you incur, such as Anthropic API usage.
- AI-generated text (summaries, cover letters) can be wrong or generic. Read and
  edit anything before you send it.

## License

MIT. See [LICENSE](LICENSE). Copyright remains with the author.
