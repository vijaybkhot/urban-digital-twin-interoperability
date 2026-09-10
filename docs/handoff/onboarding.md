# Developer Onboarding

This is the front door for anyone continuing this project — read this first,
then follow its links. It routes you into the existing documentation; it does
not repeat it. Every command below was run on a genuinely fresh clone before
being written down here.

## The 15-minute path

Requirements: Git, Node.js `20.19.0` or newer (`22.12.0` is the pinned
development version in `.nvmrc`), npm, a browser with WebGL support. No API
key or credential is required for any of the steps below.

```bash
git clone https://github.com/vijaybkhot/urban-digital-twin-interoperability.git
cd urban-digital-twin-interoperability
nvm use          # or: nvm use 22.12.0 on Windows, which doesn't read .nvmrc
npm ci
npm run dev
```

Open `http://localhost:5173/`. **What you should see:** the app opens in
`workflow` mode — a "Mock Reconstruction Workflow" panel over a Cesium globe,
with buttons to open the other four modes. This is expected; it is not the
Sea Grant research deliverable (see "The five modes" below for which one is).

Then run the full offline check:

```bash
npm run validate
```

This chains 5 data validators, `tsc`, and the Vite production build — all
against already-committed data, no network calls. It should finish green with
no edits to anything under `public/data/`.

If either step behaves differently than described here, that is a
documentation defect — fix this file or file an issue, per the acceptance
test in `docs/handoff/acceptance-test.md` once it exists (#121, HO-24). For
known setup and pipeline issues and their fixes, see
[`docs/handoff/troubleshooting.md`](troubleshooting.md).

## The five modes

| Mode | Classification | What it is |
| --- | --- | --- |
| `workflow` (current default on launch) | **MOCK** | New-project setup + browser-only image intake + a simulated COLMAP reconstruction job. No real photogrammetry runs. |
| `existing-demo` | **MOCK / LEGACY** | The original controlled-facility POC — radiation dose-rate readings from `public/project_config.json`. Its coordinates are in Pennsylvania, unrelated to the Sea Grant study areas — a known leftover, not a bug (see the [data register](../data/data-register.md#8-project-configuration-existing-demo--workflow-default)). |
| `modular-demo` | **MOCK** | A modular-housing proposal scenario (factory, logistics, construction site). Not connected to real factories, robotics, or logistics systems. |
| `disaster-demo` | **MOCK / FICTIONAL** | A fictional Baton Rouge-area neighborhood with a synthetic flood layer. Explicitly labeled "Demonstration only. Not for real emergency use." |
| `urban-resilience-demo` | **IMPLEMENTED, REAL DATA — this is the Sea Grant deliverable** | Real Grand Isle / Port Fourchon building, road, and FEMA flood-hazard data. Everything else in this guide's "reading order" below is about this mode. |

**Note on the table above:** which mode the app *opens in by default* and
which mode is *the primary research deliverable* are two separate facts.
Today they're different (`workflow` is still the default; see #127/HO-25,
tracked to change this). If you land on this page after that issue merges
and the app now opens directly into `urban-resilience-demo`, only the
parenthetical in the first row is stale — nothing else in this table changes.

Mode switching in the running app is currently a set of buttons duplicated
across each panel (tracked for consolidation into one shared switcher in
#114/HO-17) — from any mode, look for a button labeled "Open \_\_\_ demo."

## Reading order

Once you've seen the app run, read in this order:

1. [`docs/architecture.md`](../architecture.md) — the application's overall
   shape (see "Architecture in one page" below for the short version).
2. [ADR 006](../decisions/006-urban-resilience-real-data-guardrails.md) — why
   the urban-resilience mode is built the way it is, and its safety framing.
3. [`docs/data/data-register.md`](../data/data-register.md) — every dataset:
   what it is, where it came from, how to regenerate it.
4. [`docs/data/urban-resilience-layers.md`](../data/urban-resilience-layers.md) —
   how each of those datasets actually renders in the running app.
5. [`docs/data/regeneration.md`](../data/regeneration.md) — the order the
   data pipelines must run in, and the one real trap in that order.

Everything past this point in this guide is a summary; those five documents
are the actual source of truth.

## Architecture in one page

```
types (pure data contracts, no rendering)
  → domain (viewer-agnostic scenario/parsing logic)
    → ports (interfaces: ViewerAdapter, AgentProvider, ReconstructionProvider, ProjectConfigRepository)
      → adapters + cesium (implementations; the ONLY place Cesium is imported)
        → components (React panels)
          → app (AppShell: mode state, orchestration)
```

**The one rule that matters most:** only `src/cesium/**` and
`src/adapters/viewer/CesiumViewerAdapter.ts` may import from `cesium`.
Verified directly, not assumed — every file in this repository that imports
`cesium` lives in one of those two places, with zero exceptions. If you're
about to add a Cesium import anywhere else, stop; the domain/component layers
are supposed to stay viewer-independent so a different renderer could
theoretically be swapped in behind the same `ViewerAdapter` interface.

Full detail, including the four ports and their current adapters, is in
`docs/architecture.md`.

## Where the mocks are

- `src/adapters/reconstruction/MockColmapReconstructionProvider.ts` — a fake
  job queue (queued → running → completed on fixed delays) that always
  returns the bundled `CesiumMilkTruck.glb` sample. Drives the `workflow`
  mode.
- `src/adapters/agent/MockAgentProvider.ts` — implements the `AgentProvider`
  port, but **is not imported anywhere in `src/`** (verified by grep). It
  exists as a type-only placeholder for a future real agent integration; do
  not describe it as an active capability.
- `src/domain/modularHousing/mockModularHousingScenario.ts` — the
  `modular-demo` mode's fixed scenario data.
- `src/domain/disasterResilience/mockDisasterResilienceScenario.ts` — the
  `disaster-demo` mode's fictional Baton Rouge scenario.

None of these call a real LLM, a real reconstruction backend, or any external
service.

## The ArcGIS experiment

A second, fully isolated entry point testing whether the same committed
urban-resilience GeoJSON can render in an ArcGIS SceneView instead of Cesium.
It does not share code with the main app beyond the data files themselves.

```
npm run dev
# then, in a browser:
http://localhost:5173/experiments/arcgis-urban-resilience/
```

Confirmed working on a fresh clone with no environment variables set (it
falls back to an OpenStreetMap basemap and a flat ground without
`VITE_ARCGIS_API_KEY`). This proves *visualization portability* for this one
dataset — not full system interoperability; don't overstate it.

## What is deliberately absent

No production backend, authentication, or database. No persisted project
state across a page reload. No router or URL-based navigation (mode is a
single in-memory React state). No test runner and no linter — enforcement is
the 5 data validators plus `tsc` and the production build via
`npm run validate`. No state-management library (Redux, Zustand, Context) —
state lives in `AppShell.tsx` and two custom hooks. No live sensor feed and no
real emergency/operational integration anywhere in the application.

## Make one small, real change

To confirm your setup actually works end to end, not just that it looks
right:

1. Create a branch.
2. Make one small, real edit — for example, add one field to a dataset's
   entry in `docs/data/data-register.md`, or adjust one legend label's
   wording in `src/components/UrbanResilienceDemoPanel/UrbanMapLegend.tsx`.
3. Run `npm run validate` and confirm it passes.
4. Open a PR against `main`.

If any step here didn't work the way this guide says it would, that's the
most useful bug report you can file — it means this document is wrong, and
fixing it helps the next person more than almost anything else you could do
first.
