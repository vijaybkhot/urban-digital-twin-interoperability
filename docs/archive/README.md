# Archived Documentation

This directory holds historical documentation for work that is **not** the
Sea Grant urban-resilience deliverable (Grand Isle & Port Fourchon, real
OpenStreetMap/FEMA/USGS data). Nothing here was deleted — it is moved out
of the top level of `docs/` so a reader can tell at a glance what the
primary deliverable is, without wading through documentation for secondary
demo features first.

Both subdirectories describe features that **still exist and run in the
app today** — this is not documentation for removed code. They are
historical design/test records for how those features were built, kept for
provenance rather than as day-to-day reference material.

## `poc/` — Mock Reconstruction Workflow

11 files (`poc-1` through `poc-4h`) documenting the incremental build-out of
the `workflow` application mode (the app's current default view): a
browser-only mock of an image-to-3D-model reconstruction pipeline. See
`docs/handoff/onboarding.md` for this mode's current classification (MOCK)
and `docs/reconstruction-pipeline-handshake.md` (still at the top level of
`docs/`, since it describes the still-relevant handshake contract) for the
active summary that links into this archive.

## `disaster-resilience/` — Disaster Resilience Demo test evidence

11 `dr-0NN-test-evidence.md` files recording manual test passes for the
`disaster-demo` application mode: a **fictional** flood-response scenario
for a fabricated Baton Rouge property set, used to prove out the
Cesium/React interaction patterns before the real Grand Isle & Port
Fourchon data pipeline existed. See `docs/handoff/onboarding.md` for this
mode's current classification (MOCK / SIMULATED, fictional data).

## Why archive instead of delete

This is real design and test history for application modes that remain in
the codebase and are reachable from the UI today. Deleting it would lose
the reasoning behind decisions still in effect; leaving it at the top level
of `docs/` alongside the real deliverable's documentation made the
fictional/mock work look disproportionately prominent — 22 files here
against zero equivalent test-evidence files for the real deliverable before
this reorganization.
