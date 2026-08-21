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

- `landingPage.headline` (required, string) — the hero headline.
- `landingPage.subheadline` (optional, string) — one or two supporting sentences.
- `landingPage.features` (optional, array) — each entry:
  - `title` (required, string)
  - `body` (required, string)
  - `icon` (optional, one of: `heart`, `shield-check`, `sparkles`, `chat`, `users`, `lock`, `check`, `star`)
- `landingPage.ctaLabel` (optional, string) — label on the hero chat box's send button and the floating widget's launcher, e.g. "Talk to Juno".

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
