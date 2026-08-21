---
name: landing-page-builder
description: >
  Build, validate, and maintain the Git-backed marketing landing page for a
  Gabriel Operator Persona by editing assets/landing-page.json. Use this
  skill when changing the persona's public /chat/:agentId landing page copy
  (headline, subheadline, feature highlights, call-to-action label).
metadata:
  author: gabriel-operator
  version: "1.0"
  compatibility: Requires Node.js 16+ for the validation script.
---

# Landing Page Builder

## Portable Git contract (schema v2)

```json
{
  "schemaVersion": 2,
  "resourceKey": "landing_page.example",
  "runtimeDataPolicy": "definitions_only",
  "landingPage": {
    "headline": "One line, the whole pitch",
    "subheadline": "One or two sentences of supporting context",
    "features": [
      { "icon": "heart", "title": "Feature title", "body": "One or two sentences." }
    ],
    "ctaLabel": "Talk to the persona"
  },
  "commitMessage": "Update landing page content"
}
```

- Never commit `pageId`, `userId`, or any runtime/analytics data — this file is copy only.
- Keep `resourceKey` stable once published; change it only when intentionally forking the content for a different persona.

## Git-backed landing page repositories

When this skill is materialized as a Git repository for one landing page, the
repo contains this scaffold plus `assets/landing-page.json`. Edit that file
directly; there is no separate runtime-data file for this resource kind — the
whole thing is authored copy.

### Inside a Persona workspace

This repository is usually a **git submodule** of an AI Persona repository, at
`references/landing-pages/<resource-key>/`. Unlike Pipeline/List/Workflow, this
content is not imported into a separate runtime collection — it is copied
directly into the parent Persona's `assets/chat-config.json` under
`publishedConfig.landingPage`, which is what the running app actually reads
(via the same git-backed resolver that serves `systemPrompt`/`firstMessage`).
Two consequences:

- After changing `assets/landing-page.json` here, commit and push **this repo
  first**, then copy the updated `landingPage` object into the parent
  persona's `chat-config.json` `publishedConfig.landingPage` and commit/push
  that too. The two files are kept in sync by hand (or by whatever agent is
  editing them) — there is no automatic import step.
- `publishedConfig.landingPageRef: { "resourceKey": "..." }` on the parent
  records which landing-page repo is the source of truth, mirroring how a
  slash command carries a `workflowRef`.

## Mental model

- One repo is one persona's landing page copy — headline, a short supporting
  line, a small list of feature highlights, and one call-to-action label.
- This is presentation copy, not behavior. It does not affect chat logic,
  matching, or tools — only what's shown on `/chat/:agentId` before the
  visitor starts chatting.
- Keep it short. Three to five features is plenty; this renders as a scrolling
  marketing page, not a full product doc.

## Fields

Only `headline` is required — everything else is optional and falls back to a sensible default.

- `landingPage.headline` (required, string) — the hero headline (first line).
- `landingPage.headlineAccent` (optional, string) — a substring of `headline`, rendered in the persona's accent color.
- `landingPage.headlineLine2` (optional, string) — a plain second headline line.
- `landingPage.badge` (optional, string) — small pill above the headline.
- `landingPage.subheadline` (optional, string) — one or two supporting sentences.
- `landingPage.ctaLabel` (optional, string) — primary button label (hero, closing CTA, floating widget launcher).
- `landingPage.secondaryCtaLabel` (optional, string) — outlined second hero button.
- `landingPage.featureTags` (optional, string array) — short caption line under the hero buttons.
- `landingPage.demoConversation` (optional, array of `{role, text}`) — scripted messages shown in the hero chat mockup above the real input.
- `landingPage.features` (optional, array) — each entry:
  - `title` (required, string)
  - `body` (required, string)
  - `icon` (optional, one of: `heart`, `shield-check`, `sparkles`, `chat`, `users`, `lock`, `check`, `star`)
- `landingPage.faqs` (optional, array) — rendered as an accordion; adds a "FAQ" header nav link. Omit to leave both out. Each entry: `question`, `answer` (both required).
- `landingPage.contact` (optional, object) — adds a Contact section + "Contact" header nav link. Omit to leave both out. Fields: `heading`, `body`, `email` (all optional strings; `email` renders a mailto button).
- `landingPage.backgroundVideo` (optional, object) — full-page video background scrubbed by scroll position (never autoplayed). `src` (required) must be a publicly reachable URL — this repo is public, so `assets/media/<file>.mp4` can be referenced as `https://raw.githubusercontent.com/vipin-go/juno-landing-page/main/assets/media/<file>.mp4`. `poster` (optional) is shown before enough video has loaded to scrub. When set, every section becomes translucent automatically so the video shows through.

The only non-configurable thing on the page is the "Made using Gabriel Operator" footer — that's hardcoded in the source, not this file.

## Common edits

Change the headline or subheadline:

1. Edit `landingPage.headline` / `landingPage.subheadline` directly.

Add or edit a feature:

1. Add/edit an entry in `landingPage.features[]`.
2. Pick the icon that best matches the feature's meaning from the allowed set above.
3. Keep `title` short (a few words) and `body` to one or two sentences.

## Validation

Run:

```bash
node scripts/validate-landing-page.js assets/landing-page.json
```

The validator rejects a missing `headline`, a feature missing `title`/`body`,
and an `icon` outside the allowed set.
