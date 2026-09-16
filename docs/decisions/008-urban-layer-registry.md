# 008: Urban Resilience Layer Registry

## Status

Accepted. Introduced inert, with zero consumers, by Issue #115 (HO-18).

## Context

The `urban-resilience-demo` mode renders seven things a user experiences as
"a layer" (buildings/properties, FEMA flood hazard, response routes and
staging resources, community/public-safety facilities, a ground-elevation
sample, an experimental LA-1/FEMA overlay, and an optional Cesium OSM
Buildings 3D context). Nothing in the codebase states what any of these
*is* in one place: each layer's identity is smeared across a scenario data
URL (`grandIslePortFourchonScenario.ts`), an `AppShell` prop, a `CesiumScene`
effect, a `ViewerAdapter` method, and a `src/cesium/*.ts` styler.

Two concrete symptoms of this: the FEMA flood-hazard layer has no domain
parser and nobody noticed, because nothing enumerates "here are the layers
and each one's parser"; and two of the three colors in the mode's data
layers -- both toggles that hide/show an experimental overlay -- are wired
by hand in `AppShell.tsx` with no single object describing what "on" means
for each.

`docs/data/urban-resilience-layers.md` (HO-09) already documents all seven
layers narratively, and `docs/data/data-register.md` (HO-05) documents
where each dataset came from. Neither is machine-checkable: nothing stops
the running app from drifting away from what those documents describe.

## Decision

Add `src/domain/urbanResilience/urbanResilienceLayerRegistry.ts` -- a single
typed array of `UrbanLayerDefinition` objects, one per layer, giving each a
stable id, category (`core` | `experimental`), render target, a typed key
into the scenario's data-URL fields (never a copied URL literal), provenance
(organization, dataset, committed artifact path, attribution, and
interpretation limit -- all copied from HO-05/HO-09/ADR 006, not
paraphrased), default visibility, whether an independent toggle exists
today, whether it is selectable, and its legend rows (each color a token
from `urbanResilienceVisualTokens.ts`, never a literal).

This is placed in `src/domain/urbanResilience/`, alongside
`urbanResilienceContract.ts`, rather than in `src/config/` (which holds
environment/app configuration, a different kind of thing) or in
`src/adapters` or `src/cesium` (which would make it part of the viewer
boundary). It must be importable by plain React panels without pulling in
Cesium, per the viewer-isolation rule in the "Viewer isolation" section of
this document.

**The registry is a description, not a rendering abstraction.** It has no
knowledge of `Cesium.Entity`, `Cesium.GeoJsonDataSource`, or any adapter
method, and it must never gain any -- the `ViewerAdapter` interface remains
the only boundary between domain/React code and Cesium. Nothing in
`CesiumViewerAdapter.ts`, `CesiumScene.tsx`, or any `src/cesium/*.ts` file
changed to introduce this registry, and none of them should ever need to
import it either; `AppShell.tsx` is the intended (future) consumer,
translating registry state into the same adapter props it already passes
today.

Landed with **zero consumers** deliberately: `tsc` proves the registry's
shape compiles and cross-checks against `UrbanResilienceScenario`'s field
names, and it can be reviewed as a static design artifact before any
running code depends on it. Issue #116 (HO-19) is what makes `AppShell`
actually read layer visibility and data URLs from here instead of from two
hand-written booleans, including giving the response-routes layer its own
independent toggle (today's registry marks that layer `toggleable: false`,
truthfully describing that no such control exists yet).

Two known compromises, recorded rather than worked around:

- `flood-hazard` is `selectable: false` because no domain parser exists for
  FEMA flood-zone attributes and `"urbanFloodZone"` is not one of the eight
  `ViewerSelection` variants. The registry documents this gap; it does not
  close it.
- `la1-fema-experiment`'s `legend` array is empty even though the layer has
  its own separate three-row inline legend rendered inside
  `UrbanLa1FemaExperimentPanel.tsx`. Two of those three colors are literals
  in `styleUrbanLa1FemaDataSource.ts`, not yet promoted to
  `urbanResilienceVisualTokens.ts`. Promoting them is a `src/cesium` change,
  out of scope for an inert registry with a zero-behavior-change bar.

## Consequences

- Any future new urban layer has one obvious place to register its
  identity, provenance, and legend, rather than four files to touch by
  memory.
- Provenance and interpretation-limit strings live next to the data they
  describe, in code, type-checked against the scenario shape -- not only in
  prose documentation that can silently drift from the running app.
- HO-19, HO-20, and HO-21 (the remaining H3 UI chain) can each read from one
  source of truth for "what layers exist and what state are they in" rather
  than re-deriving it.
- The registry intentionally does not (yet) cover every layer's rendering
  detail perfectly -- see the two compromises above -- and closing those
  gaps is left to the issues that already track them.
