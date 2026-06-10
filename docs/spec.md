# Prax technical specification

Version 0.3 — June 2026
Status: implementation-ready (incorporates external review rounds 1–2)

Prax is a family of free, single-purpose tools for building interactive eLearning content. Each tool produces accessible, embeddable blocks defined by an open JSON format, rendered by an open MIT runtime, and exportable as standalone HTML or SCORM 1.2 packages. The builders are free to use and closed source. The format and runtime are the ecosystem; the builders are the product surface.

This spec covers the block format, the runtime, the distribution channels, the builder application architecture, the repository and license layout, and the build sequence. It assumes the strategic decisions recorded below and does not relitigate them.

---

## 1. Decision log

Settled decisions, with the constraint that drove each one:

| # | Decision | Driver |
|---|----------|--------|
| D1 | Blocks are authored in React, shipped as light-DOM custom elements | Reuses the existing 30-block React codebase; embeds anywhere via an HTML tag |
| D2 | React in the output bundle, not Preact | preact/compat risk outweighs ~20KB savings; blocks ship alongside megabytes of media |
| D3 | Light DOM, no shadow root | Cross-root ARIA references are unresolved in the platform; WCAG 2.2 AA is the differentiator |
| D4 | Pre-rendered semantic HTML inside the element, hydrated on load | Progressive enhancement, SEO, AI-readability; the existing JSON-to-HTML renderer makes this cheap |
| D5 | Config is versioned JSON with published JSON Schemas | AI tools generate configs from schemas; content outlives runtime versions |
| D6 | Media in configs is a source union: remote URL or attached asset | Client-side export hits CORS on arbitrary URLs; the schema must model both sources from day one |
| D7 | MIT license: runtime, blocks, schemas, tokens, SCORM wrapper, docs site | Exported packages and AI-generated pages redistribute this code; permissive license is load-bearing |
| D8 | Builders: closed source, free to use, private repo | Preserves productization; the open format covers user lock-in concerns |
| D9 | Builders are client-only Vite + React SPAs; no server, no accounts, no database | Zero infra cost; "the JSON file is the database" |
| D10 | Name: `prax`. npm scope `@prax`, element prefix `<prax-*>`. The format itself is unbranded | Short, consistent across npm/HTML/files; format branding adds nothing (the Lottie precedent) |
| D11 | Sequence: design.md a11y checker, then image comparison, then interactive video | Quiet pipeline prover before the loud flagship launch |
| D12 | Monorepo tooling: pnpm workspaces, Turborepo, changesets | Boring, solo-maintainable, free CI via GitHub Actions |
| D13 | Mobile-first player/landing pages; responsive builders with a desktop-optimized deep-editing tier; builders are installable PWAs | Discovery funnel is LinkedIn on a phone; builders must hold the WCAG/local-first brand on every screen size |

Deferred: the Praxity trademark question is parked while everything is free. Recheck before any commercial move or paid tier. Verify `@prax` npm scope availability during Phase 0; if taken, the fallback rename touches the scope and element prefix only, since the format is unbranded (this is why D10 matters).

---

## 2. System overview

Four layers, with a strict dependency direction (lower layers never import higher ones):

```
┌─────────────────────────────────────────────────────┐
│ 4. Builders (closed, free)                          │
│    compare-builder, ivideo-builder, ...             │
├─────────────────────────────────────────────────────┤
│ 3. Distribution wrappers (MIT)                      │
│    CDN custom element · npm React pkg ·             │
│    standalone HTML export · SCORM 1.2 zip           │
├─────────────────────────────────────────────────────┤
│ 2. Runtime (MIT)                                    │
│    runtime-core, block components, html-render,     │
│    scorm wrapper, tokens                            │
├─────────────────────────────────────────────────────┤
│ 1. Format (MIT)                                     │
│    JSON Schemas, TS types, migrations               │
└─────────────────────────────────────────────────────┘
```

One renderer per block, four ways to deliver it. A block's React component is the single source of truth; the custom element, the npm package, the standalone export, and the SCORM package are all wrappers around it.

---

## 3. Repositories, packages, licenses

### 3.1 Public repo: `prax` (MIT throughout)

```
prax/
├── packages/
│   ├── schemas/          # JSON Schemas, TS types, migrations. Zero runtime deps.
│   ├── tokens/           # CSS custom properties, tokens.json, design.md
│   ├── runtime-core/     # element base class, config loader, hydration, event bus
│   ├── scorm/            # SCORM 1.2 API wrapper (ships inside exports)
│   ├── html-render/      # block JSON → semantic HTML (port of existing renderer)
│   └── blocks/
│       ├── compare/      # React component + element entry + React entry
│       ├── ivideo/
│       └── ...
├── apps/
│   └── site/             # Astro landing + docs site, live block embeds
├── examples/             # sample configs per block, used by docs and tests
└── llms.txt              # agent-facing docs entrypoint
```

Every package carries a LICENSE file and SPDX headers. The workspace globs are `packages/*` and `packages/blocks/*` (the nested blocks directory is deliberate grouping; pnpm handles it, verify during Phase 0 scaffolding). CI runs typecheck, unit tests (Vitest), browser tests (Playwright), and an axe-core accessibility gate per block (section 6.5). Releases via changesets; packages publish to npm and are mirrored on jsDelivr.

### 3.2 Private repo: `prax-builders` (proprietary, free to use)

```
prax-builders/
├── packages/
│   └── builder-kit/      # shared builder shell: layout, undo, persistence,
│                         #   media manager, export pipeline, pre-flight UI
└── apps/
    ├── compare-builder/
    └── ivideo-builder/
```

Builders consume the public packages as ordinary npm dependencies, pinned by version. Nothing in the public repo may import from this repo. Each builder deploys as a static site to its own subdomain (compare.prax.dev, ivideo.prax.dev) on Cloudflare Pages or Netlify free tier.

### 3.3 Contribution policy

The public repo accepts contributions under DCO sign-off. No CLA. Because everything public is MIT, there is no relicensing exposure. The private repo accepts no external contributions. State both policies in the README before the first PR arrives.

---

## 4. Config format

### 4.1 Conventions

Every block config is a JSON document with this envelope:

```json
{
  "$schema": "https://prax.dev/schemas/compare/v1.json",
  "block": "compare",
  "v": 1,
  "meta": {
    "title": "Office layout, before and after",
    "lang": "en"
  },
  "content": { }
}
```

Rules:

- `block` identifies the block type; `v` is the schema major version for that type.
- `$schema` points at a published, immutable JSON Schema. AI tools are instructed (via llms.txt and docs) to fetch the schema and generate against it. The runtime never fetches this URL: it validates against the schema version compiled into the block bundle. `$schema` is a hint for editors, validators, and generators only — prax.dev uptime must never be a runtime dependency for an embed, an export, or a SCORM package.
- `meta.lang` is required; it sets the `lang` attribute on rendered output (WCAG 3.1.1).
- All user-visible strings live in `content`, never hardcoded in the runtime, so configs are translatable by editing JSON.
- Field names are camelCase. No abbreviations except `v`.

### 4.2 Versioning and migrations

- Additive changes (new optional fields) do not bump `v`.
- Breaking changes bump `v`. The `schemas` package ships pure functions `migrate(config): config` that upgrade any older version to current, applied as a chain.
- The runtime migrates old configs in memory at load time and renders normally. Builders migrate on open and tell the user the file was upgraded.
- Any config failure renders the error card (section 5.5), never a blank region or silent no-op. Failure modes covered: unparseable JSON, schema validation failure, `block` type mismatch with the element, `v` newer than the runtime supports, and `src` fetch failure. Silent blank rendering is the H5P failure mode this project differentiates from; exported packages live in LMSs for years and every one of these will eventually happen in the field.

### 4.3 Media source union (D6)

Anywhere a config references an image, video, audio file, or caption track, it uses a `media` object, one of three kinds:

```json
{ "kind": "url",   "href": "https://example.com/before.jpg", "alt": "..." }

{ "kind": "asset", "assetId": "a_7f3k", "name": "before.jpg",
  "mime": "image/jpeg", "alt": "..." }

{ "kind": "platform", "provider": "youtube", "id": "dQw4w9WgXcQ",
  "title": "Forklift safety walkthrough", "description": "..." }
```

- `url`: a remote file the runtime loads directly. May or may not be embeddable at export time, depending on CORS (section 7.4).
- `asset`: a file attached in the builder. The bytes live outside the config (in the builder's IndexedDB while drafting, in the package's `assets/` directory after export). The config carries only the reference. Configs never contain base64 payloads; inlining is an export-time transform, not a document format.
- `platform`: an embed-only provider (YouTube, Vimeo). Never downloaded or inlined; downloading violates provider terms. Exports keep these as embeds and the pre-flight check warns that corporate LMS allowlists frequently block them.

Accessible naming: `alt` is required on every visual `url` and `asset` media object (an explicit "decorative" flag, rendering `alt=""`, is the deliberate opt-out). `platform` media instead requires `title`, with optional `description`; the runtime renders `title` as the accessible name of the embed container. Alt text is an image concept; embeds get titles. The builder will not export while any required naming field is empty.

This union is the single most expensive-to-change schema decision. It ships in v1 of every block schema.

---

## 5. Runtime

### 5.1 The custom element contract

Each block ships a custom element: `<prax-compare>`, `<prax-ivideo>`. The element is a thin shell (target: under 100 lines) whose responsibilities are config acquisition, hydration, theming hookup, and event dispatch. All interaction logic stays in the React component.

Config acquisition, in precedence order:

1. `src` attribute: URL of a config JSON file, fetched on connect.
2. A child `<script type="application/json">` containing the config inline. This is the form AI tools are documented to generate, since it keeps a page self-contained.
3. `config` attribute with a JSON string. Supported but discouraged beyond trivial configs (attribute escaping is hostile to humans and LLMs alike).

If multiple sources are present, the highest-precedence one wins and the rest are ignored; the element logs a console warning naming the ignored sources (dev aid, no user-facing noise).

Example of the canonical embed an AI tool produces:

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@prax/compare@1/dist/element.js"></script>

<prax-compare>
  <script type="application/json">
    { "$schema": "https://prax.dev/schemas/compare/v1.json",
      "block": "compare", "v": 1, ... }
  </script>
  <!-- optional pre-rendered fallback -->
  <div data-prax-ssr> ...semantic HTML from html-render... </div>
</prax-compare>
```

Lifecycle:

- On `connectedCallback`, the element resolves its config, migrates it if needed, and mounts the React component into its own light DOM, replacing any `[data-prax-ssr]` child.
- If JS fails to load, the `[data-prax-ssr]` content remains: readable, semantic, non-interactive. Standalone HTML and SCORM exports always include it (the existing html-render pipeline produces it). Hand-written embeds may omit it.
- Disconnect unmounts React cleanly (LMS pages that swap content must not leak).

Events, dispatched as bubbling `CustomEvent`s so host pages and the SCORM wrapper can subscribe without touching React:

| Event | Detail | Meaning |
|-------|--------|---------|
| `prax:ready` | `{ block, v }` | hydrated and interactive |
| `prax:progress` | `{ percent }` | learner progress, block-defined |
| `prax:complete` | `{ }` | block's completion condition met |
| `prax:score` | `{ raw, min, max }` | scoreable blocks only |
| `prax:state` | `{ state }` | serializable resume state changed |

### 5.2 Styling and theming

- Light DOM, all classes prefixed `prax-`. One prefix everywhere: `<prax-*>` elements, `--prax-*` variables, `.prax-*` classes, `prax:` events. Contributors and AI tools will guess the prefix; make the guess correct. (Class selectors and element names don't collide: `.prax-slider` and `<prax-compare>` coexist fine.)
- Every color, font, radius, spacing step, and motion duration resolves through `--prax-*` CSS custom properties defined in `@prax/tokens`, with usable defaults baked into each block's stylesheet. Host pages theme blocks by setting variables; no CSS overrides needed for the supported surface.
- `@prax/tokens` ships three artifacts: `tokens.css` (the variables), `tokens.json` (machine-readable), and `design.md` (human- and agent-readable description of the system, intended to be dropped into AI builder projects so generated pages match block aesthetics).
- All motion respects `prefers-reduced-motion`. This is enforced in the a11y gate, not left to individual blocks.

### 5.3 Bundle composition

- Per-block element bundles must not double-ship React when two blocks share a page. Likely design: bundles externalize `react`/`react-dom` to a versioned ESM URL (`@prax/react-shared@18`, served from the CDN), so the browser's module graph deduplicates by URL — same-URL ES modules instantiate once per realm, which gives sharing with no globals, no load-order race, and an explicit version pin. Do not use a `window` global check: concurrent script loads race past it and version conflicts have no resolution rule. Final design settles when the second block ships (open item 4); until then one block per page is the practical case.
- Budget: ≤ 90KB gzip for simple blocks (compare), ≤ 160KB for ivideo, measured on the complete self-contained element bundle with React included — the cost a single-block page actually pays, and the artifact CI builds and weighs. When the shared-React external is in play, block code is what remains after subtracting the shared runtime; no separate budget until that mechanism ships. CI fails on regression past budget.
- npm package versions and config schema versions are independent. `@prax/compare@2` (new element API, new events, new bundle) can still read `"v": 1` configs, and a config `v` bump doesn't force an npm major. The compatibility promise is: a package major supports every config version that existed when it shipped, via the migration chain. Docs state this explicitly because consumers will otherwise assume the two numbers are coupled.
- The React entry (`@prax/compare/react`) exports the bare component with none of the element shell, for npm consumers in React projects (v0 output, Lovable output, hand-built apps).

### 5.4 Accessibility gate

A block does not merge or publish unless:

- axe-core reports zero violations in Playwright runs across the block's interaction states.
- The keyboard interaction map is documented in the block's README and covered by Playwright keyboard tests.
- Screen reader announcements for state changes are implemented via live regions and listed in the README (manual NVDA/VoiceOver pass per release, scripted checklist).
- Layout holds at 200% zoom and 320px width (WCAG 1.4.10).
- All token color pairs used by the block pass contrast requirements (checked mechanically from tokens.json; this same check is the seed of the design.md checker tool).

The gate is the brand. It is cheaper to enforce from block one than to retrofit.

### 5.5 The error card

`runtime-core` ships one error component used for every failure mode in section 4.2 plus runtime crashes (a React error boundary wraps every block). It renders in place of the block: a bordered card using token styles, a heading naming the block type, a one-line plain-language reason ("This block's settings file couldn't be read"), a collapsed technical detail section (block, config version, runtime version, validation errors), and a docs link. It is keyboard-reachable and announced via the region's accessible name; it does not use `role="alert"` (a load-time failure is not a live interruption). Pre-rendered `[data-prax-ssr]` content, when present, is left visible beneath the card, so readers still get the semantic fallback content.

---

## 6. Distribution wrappers

### 6.1 CDN custom element

Published to npm, served via jsDelivr with major-version pinning (`@prax/compare@1`). Docs always show the pinned-major URL so existing embeds get fixes but never breaking changes.

CSP note: the inline `<script type="application/json">` config is inert data and unaffected by Content Security Policy, but strict corporate CSPs will block the CDN `script src` itself. That's expected and fine — the standalone and SCORM exports bundle all scripts locally and are the documented answer for restrictive environments. Say this plainly in the embed docs and FAQ so it never becomes a recurring support thread.

### 6.2 npm React packages

`@prax/<block>/react` as above. Peer dependency on React 18+. This is the path for AI tools that generate React projects; the embed docs cover both forms and llms.txt points to both.

### 6.3 Standalone HTML export

Produced by the builder. Two modes:

- Single file: one `.html` with config inline, element script inline, images base64-inlined. Right for portfolio drops, email, Lovable/v0 upload. Refused (with explanation) when attached video pushes the file past a sanity threshold (default 25MB).
- Folder: `index.html` plus `assets/` and `prax/` (scripts). Right for Netlify/Pages deploys and anything with video.

Both include the pre-rendered semantic HTML fallback.

### 6.4 SCORM 1.2 export

A zip containing `imsmanifest.xml`, the folder-mode HTML output, and `@prax/scorm`. The wrapper:

- Discovers the LMS API by the standard parent/opener walk; degrades to no-op outside an LMS so the same package previews in a browser.
- Maps `prax:complete` to `cmi.core.lesson_status` (`completed`, or `passed`/`failed` against `mastery_score` when the block is scoreable), `prax:score` to `cmi.core.score.raw/min/max`, `prax:state` to `cmi.suspend_data`.
- Enforces the SCORM 1.2 suspend_data limit (4096 chars). Block resume state must serialize compactly; the wrapper warns at 3500 and truncates by dropping resume state, never completion status, at the limit. Block READMEs document their state size. Builders also estimate state size at authoring time (from the config: clip count, question count, branch depth) and warn during creation when content is likely to exceed ~3KB serialized — surprising an author in the editor beats surprising a learner in the LMS.
- Calls `LMSCommit` debounced and `LMSFinish` on `pagehide`.

Wrapper API surface (frozen early; exported packages are immortal): `initialize()`, `setStatus(status)`, `setScore(raw, min, max)`, `saveState(obj)`, `getState()`, `finish()`.

Testing: every block release runs the exported package through SCORM Cloud (free tier) as a release checklist item. Known LMS quirks get a `docs/scorm-compat.md` page; expect this to grow and treat it as content marketing.

### 6.5 Share links

Builders offer "copy share link": the config, lz-string-compressed, in the URL fragment of the block's player page (`prax.dev/p/compare#<data>`). The fragment never reaches a server. Disabled (with explanation) when the config references attached assets, since the bytes aren't in the config; URL- and platform-media configs share freely. Known limitation: the most media-heavy creations (custom interactive video with attached files) are exactly the ones that can't URL-share — for those, the share story is "deploy the standalone export and share that link," and the builder's export-complete screen says so.

The player page is the primary viral surface: the realistic discovery funnel is a LinkedIn post opened on a phone. The player page is therefore mobile-first as a hard requirement — instant load, no chrome beyond the block and a small "made with Prax / build your own" footer, flawless touch interaction. Block touch a11y (target sizes, gesture alternatives per WCAG 2.5.x) is already enforced by the gate; the player page is where it gets seen.

---

## 7. Builder applications

### 7.1 Stack

Vite + React + TypeScript SPA. State: Zustand. Undo: zundo temporal middleware. Persistence: idb-keyval over IndexedDB. Export: JSZip + the public html-render and scorm packages. Styling: the same `@prax/tokens`, so builders visibly dogfood the design system. Routing: views within one page (edit / preview / export); no router dependency unless a tool genuinely needs deep links.

Each builder embeds its block's real runtime element for preview. The preview is the product: what you see is the literal artifact that ships.

### 7.2 State model

Three stores with different lifecycles:

- Document store (Zustand + zundo): the config JSON only. Undoable.
- Asset store (IndexedDB): attached file bytes keyed by `assetId`, plus thumbnails. Not undoable, not in memory beyond what's displayed. Deleting an asset referenced by the document is blocked; undo of an "attach" restores the reference. Garbage collection is bounded: on every save and export, blobs referenced by no draft are deleted, and the media manager shows storage used with a manual "clean up unused files" action. Without this, a no-server tool's IndexedDB grows monotonically (attach 20, remove 19, keep the draft: 19 orphans forever).
- Session store (Zustand, ephemeral): UI state, selection, panel layout. Not undoable, not persisted.

Undo rules (D-level decisions, annoying to retrofit):

- History tracks the document store only. Asset bytes never enter history.
- Text input batches into single history entries on a 500ms debounce or blur.
- History capped at 100 entries.
- Keyboard: Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z, exposed as buttons too.

### 7.3 Persistence and files

- Autosave: document store snapshots to IndexedDB, debounced 1s, per-draft key. Reopening the builder offers recent drafts.
- Save: downloads the config `.json`. This is the canonical artifact. Open: file picker or drag-drop, with migration on version mismatch.
- Raw mode: every builder has a JSON editor view (schema-validated, with inline errors) alongside the visual editor, satisfying the dual-mode requirement and serving the AI workflow (paste a Claude-generated config, fix it visually).
- IndexedDB is treated as a cache, not a vault: the UI says so, and the export/save paths are prominent.

### 7.4 Export pipeline and pre-flight check

Export runs entirely client-side: resolve config → run pre-flight → render semantic HTML via html-render → assemble files → zip (or single-file assemble) → download.

Pre-flight inspects every media object and reports per asset:

| Status | Meaning | Export behavior |
|--------|---------|-----------------|
| attached | `asset` kind, bytes present | embedded in package |
| embeddable | `url` kind, fetchable with CORS | fetched and embedded |
| reference-only | `url` kind, CORS-blocked but loads in a tag | left as external URL; warning that locked-down LMS/intranet environments may block it; one-click "drop the file here to embed instead" |
| platform | YouTube/Vimeo | left as embed; warning about LMS allowlists |
| unreachable | fetch and tag-load both fail | export blocked until fixed or removed |
| missing alt | any visual media without alt/decorative | export blocked |

The check runs on a worker, shows progress, and renders results as a fix-it list, not a wall of red. The CORS probe is best-effort, not authoritative: servers can answer HEAD and GET differently, vary on Origin, or behave differently at learner-time than at export-time, so the UI words results as predictions ("will likely embed" / "couldn't be verified") and always presents attaching the file as the guaranteed path. This screen is a differentiator; H5P's equivalent failure mode is silent broken images. Budget real design time on it.

### 7.5 What builder-kit owns

The closed shared package: app shell and layout, the three-store wiring, undo, draft management, media manager (attach, alt-text prompts, thumbnails), the export pipeline and pre-flight UI, share-link generation, and the raw JSON editor. A new builder should be: define the visual editing panels for the block, point at the block's schema and element, done. Target: a simple block's builder in under two weeks.

### 7.6 Builder accessibility, responsiveness, offline

Accessibility: the builders meet the same WCAG 2.2 AA bar as the runtime — keyboard-complete (including drag-drop alternatives per 2.5.7), screen-reader-usable, axe-gated in the private repo's CI. Closed source is not an excuse; an inaccessible authoring tool from the "accessibility is the moat" project would be a credibility hole, and accessible authoring tools are themselves rare enough in L&D to be a talking point (ATAG 2.0 alignment is the stretch goal, worth a docs page when true).

Responsiveness, in tiers matched to the discovery funnel (LinkedIn post → phone):

1. Player pages, landing site, docs: mobile-first, non-negotiable. This is where viral traffic lands and where the 10-second impression happens.
2. Builders, viewing and light editing: fully responsive. On a phone you can open a draft or shared config, preview the live block, edit text fields and settings, run pre-flight, and export. Layout reflows to stacked panels; nothing is broken or unreachable.
3. Builders, deep editing (ivideo timeline, hotspot placement, branching graphs): designed for desktop, functional on tablet, honest on phone — a small banner ("this editor works best on a larger screen") rather than a degraded pretense. Simple builders (compare, card grid) should achieve full editing on mobile; don't burn weeks making timeline scrubbing work on a 360px screen before the flagship ships.

The tier-2 floor matters most: the person who taps a LinkedIn link, plays with a block, then opens the builder on the same phone must hit something that works and invites them back on desktop — not a layout collapse.

Offline/PWA: each builder ships a web manifest and a service worker that precaches the app shell (installable, loads offline). Combined with IndexedDB drafts this makes the local-first story literal: install it, lose connectivity, keep authoring. Cheap via vite-plugin-pwa; the only rule is that the service worker never caches config or asset data itself (IndexedDB owns data; the worker owns code), avoiding the classic stale-app/fresh-data confusion. Player pages and the landing site stay plain static pages — no service worker complexity where there's no offline use case.

---

## 8. Agent-native surface

Treat AI coding tools as a documented integration target:

- `prax.dev/llms.txt` and `llms-full.txt`: what Prax is, the embed forms (element and React), links to every schema, and an explicit decision tree: if generating a React project, `import { Compare } from '@prax/compare/react'` and pass the config as a prop; otherwise use the custom element with the inline-script config. The React import is the better integration where it's available; the element is the universal fallback.
- Published, immutable schema URLs (section 4.1) so generated configs validate.
- `design.md` + `tokens.json` from `@prax/tokens`, copy-paste-able into a Lovable/v0/Claude project so the surrounding page matches the blocks.
- Every docs page has a raw markdown mirror. Copy the Lakebed docs discipline wholesale.
- Each block's docs include one canonical "known-good embed" snippet, because LLMs reproduce examples more reliably than they follow prose.

Later, optional: an MCP server exposing "generate a valid <block> config" as a tool. Not v1.

---

## 9. Landing site

`prax.dev`, Astro, static, in the public repo. Front page: one live working block per tool (the embeds are the proof), one paragraph of positioning ("free, accessible, open-format building blocks for eLearning"), the hire-me CTA, GitHub and npm links. Per-tool pages: live demo, builder link, embed snippets, schema link. One comparison page per launch ("free accessible YuJa alternative" lands with the ivideo launch). Donation button in the footer, not the hero.

---

## 10. Build sequence

Phase 0 — foundations (~2 weeks)
Public repo scaffolding, tokens package (extract from existing design system), schemas package with the media union, runtime-core element shell, CI with the a11y gate wired, npm scope claimed, prax.dev holding page.
Exit: a hello-world element hydrates pre-rendered HTML from an inline config on a static page, published to npm, green CI.

Phase 1 — design.md a11y checker (~3 weeks, overlapping Phase 0's tail)
Standalone micro-tool, fully MIT, in the public repo: paste or upload design tokens / design.md, get the deep audit (semantic-pair contrast, focus visibility against all backgrounds, touch targets, reduced-motion coverage, color-as-sole-carrier, 200% type behavior, dark-mode parity). It reuses the mechanical token checks from the a11y gate. This phase is the first real exercise of the publish pipeline (npm release, CDN, docs, CI gates), so budget for pipeline friction, not just feature work. Launch quietly in AI-builder communities; it markets the moat (accessibility expertise) to a broader audience than L&D and costs little.
Exit: shipped at a11y.prax.dev (or similar), first external users.

Phase 2 — image comparison, end to end (~3 weeks)
`@prax/compare` block through the gate; compare-builder on builder-kit's first real iteration; all four distribution wrappers exercised, including a SCORM Cloud pass and the pre-flight UI; docs + llms.txt entries. Soft launch.
Exit: a stranger can build, share via URL, export SCORM, and upload to an LMS without help. The whole pipe is proven on the simplest block.

Phase 3 — interactive video, the flagship (~6–8 weeks)
`@prax/ivideo` (extracted from the existing React block): multi-clip sequences, hotspots, overlays, branching; captions and transcript as first-class config fields (the a11y showcase); platform-embed and direct-file sources with honest pre-flight messaging. Polished demo content (this is L&D design work, on the critical path). Loud launch: comparison page, LinkedIn, the YuJa-alternative headline.
Exit: launch published, SCORM-verified, demo content live.

Then reassess against pipeline signal before committing to block four.

---

## 11. Open items

1. Verify `@prax` npm scope and prax.dev availability (Phase 0, day one).
2. Praxity/prax trademark: parked while free; mandatory recheck before any paid tier.
3. Standalone single-file size threshold (default 25MB) to validate against real Lovable/v0 upload limits.
4. Shared-React mechanism: likely design is URL-deduped ESM external (section 5.3); confirm against bundler/CDN realities when the second block ships.
5. SCORM 2004 demand: watch issue tracker; 1.2 ships first regardless.
6. Mobile deep-editing for ivideo: revisit after launch if analytics show meaningful editing attempts from phones; tier 3 banner ships first.
