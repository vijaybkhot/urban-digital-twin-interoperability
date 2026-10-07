# Continuation Roadmap

This is the work queue left at the September 2026 handoff, for the
continuing researcher and the project advisor. It lists what remains, why
each item matters, what it depends on, and where it is tracked.

Nothing here is a commitment to a timeline, a person, or a capability. Every
future item is **Planned**, using the status labels defined at the top of
[`ROADMAP.md`](../../ROADMAP.md). For what is already built, see the
implementation-status table in the [README](../../README.md#implementation-status).

## What I would do next, and why

> **Vijay Khot:** I would do more research on Scenario A, look for and gather
> the data necessary for that scenario, and build out a demo of it.

_Context from the scenario proposal:_ Scenario A is the risk-analysis group,
A1 event-specific property exposure and A2 long-term property exposure. A1's
results are the inputs to B1, so the response-support scenarios depend on it.
Its main blocker is data: whether the CPRA 2023 Coastal Master Plan Ida model
outputs can be obtained as spatial grids. What exists and what is missing for
each stage is in [`docs/research/scenario-mapping.md`](../research/scenario-mapping.md).

## 1. Research direction

| Item | Status | Why it matters | Depends on | Tracked in |
| --- | --- | --- | --- | --- |
| The four proposed scenarios (A1, A2, B1, B2) | **Planned** | They define what the prototype is for next. None is implemented; each has open checks and missing data, mapped stage by stage in [scenario mapping](../research/scenario-mapping.md). | Model-data access for A1/A2; an ADR per scenario before code | — |
| Identify the research gap | **Planned** — decision for the advisor and continuing researcher | The advisor has asked for work that moves beyond applying tools toward an identified practical or research gap, with stated research questions and methods. See the note below. | The scenario decisions above | — |
| Verified FEMA relationships along LA-1 | **Mock/experimental** today | The clearest live research thread: when can a road segment be called "evaluated, no mapped hazard" rather than "insufficient data"? No segment is yet fully evaluated. | Broader verified FEMA coverage along LA-1 | #67 |
| Let the LA-1 experimental layer replace the simplified purple routes | **Planned** | The experimental layer traces 48 real OSM road segments; the purple routes are hand-simplified lines with one overall judgment. Today both coexist by design, each with its own toggle. | #67 resolving when a segment can carry a verdict; a product decision on whether a resident-facing view should show per-segment results | #67, #116 |

**On the research gap.** This is a decision for the advisor and the
continuing researcher, not something this roadmap sets. As starting points
only, the repository already raises these questions (from the README's
"Research purpose"):

- how uncertainty, incomplete coverage, provenance, and non-operational
  language should appear in a digital-twin interface;
- whether the same processed public data can be presented through different
  viewer clients (CesiumJS and ArcGIS) without recomputing it;
- whether one viewer architecture can host scenarios with different domain
  contracts.

The scenario proposal adds its own: keeping simulation results, official
statements, user-entered information, and unknowns visibly separate.

## 2. Data and reproducibility

| Item | Status | Why it matters | Depends on | Tracked in |
| --- | --- | --- | --- | --- |
| Storm-simulation data for Scenario A | **Planned** | A1 and A2 need CPRA model outputs (water surface elevation, flood depth) as grids, with units, vertical reference, and coverage known. | Confirming access through CPRA's data tools | — |
| Stable building identifier | **Planned** | A1 needs a stable id per building. `property_id` is assigned in Overpass response order and can shift on re-fetch; `osm_way_id` is stable. | Scenario A design | — |
| FEMA query pagination | **Planned** | FEMA fetches request at most 2000 polygons with no pagination. Widening a study window could silently truncate results. | Any decision to widen a study area | See [regeneration.md](../data/regeneration.md#the-fema-query-truncation-limit) |
| A second hazard layer | **Planned**, conditional | Only if a reliable, scriptable public endpoint is confirmed (for example NOAA SLOSH or a Louisiana GOHSEP product). For Scenario A, the CPRA model outputs above are the more direct candidate. | A confirmed endpoint and license | — |
| Verified shelter data | **Planned** | The three staging references are approximate town centers, not shelters. B1 lists whether authoritative shelter information exists as an open check. | An authoritative published source | — |
| Reproducibility manifest for generated datasets | **Planned** | No dataset has a machine-readable checksum manifest. | — | #87 |

## 3. Architecture and code

| Item | Status | Why it matters | Depends on | Tracked in |
| --- | --- | --- | --- | --- |
| Domain parser for FEMA flood-zone attributes | **Planned** | Properties, facilities, and LA-1 segments each have a domain parser; flood-zone attributes do not. | — | Known issue 1 in [urban-resilience-layers.md](../data/urban-resilience-layers.md#known-issues-summary-cross-referenced-not-duplicated) |
| Move the LA-1 layer's remaining colors into the token file | **Planned** | `src/cesium/styleUrbanLa1FemaDataSource.ts` still hard-codes three colors (unknown, no-intersection, outline). Elsewhere every color comes from `urbanResilienceVisualTokens.ts`, so legend and map cannot drift. | — | — |
| LA-1 build still duplicates two study-area windows | **Planned** | `scripts/buildUrbanResilienceLa1FemaExperiment.mjs` declares its own Grand Isle and Port Fourchon bounding boxes instead of importing `grandIsleBaseBbox` and `portFourchonBbox` from `scripts/lib/studyAreas.mjs`, the one script HO-12 missed. The values match today, so nothing is wrong yet, but the copy could drift. | — | Noted in the [data register](../data/data-register.md#known-cross-cutting-issues-affecting-multiple-datasets) |
| Staging-point legend edge case | **Planned** | Turning routes off hides the staging-point legend row while the three staging points stay on the map. | A decision on whether staging points get their own toggle | Documented in [urban-resilience-layers.md](../data/urban-resilience-layers.md) |
| Panel content review | **Planned** | In the urban panel, the "Scenario" rows for name and area repeat the panel title, and the scenario description overlaps "Current prototype scope". Both need content edits, so both need review. | — | — |
| Orphaned `MockAgentProvider` | **Planned** | `src/adapters/agent/MockAgentProvider.ts` implements the agent port but is imported nowhere. Keep as a placeholder or remove. | A decision on the agent direction | — |
| 3D Tiles for large models and point clouds | **Planned** | `public/tilesets/` is an orphaned placeholder; nothing loads 3D Tiles. | The reconstruction direction | — |
| Portable scenario and data contracts | **Planned** | Lets additional viewer clients consume the same scenarios, as the ArcGIS experiment does for urban GeoJSON. | — | — |

**A pattern to keep in mind.** Derive Cesium-facing config and visibility
records with stable object identity, and never rebuild them from live
runtime state on every render, or the map redraws and refetches. This bug
class was found twice independently: in the modular demo's config (#34) and
while designing the layer registry. It is described in the
[extension guide](extending.md#keep-cesium-facing-objects-stable).

## 4. Open-source maintenance

These are the remaining bonus tasks from the open-source release, under the
[`OSR 3 — Independent Bonus Achievements`](https://github.com/vijaybkhot/urban-digital-twin-interoperability/milestone/12)
milestone and the [tracker](https://github.com/vijaybkhot/urban-digital-twin-interoperability/issues/89) (#89). All are **Planned**.

| Item | Why it matters | Tracked in |
| --- | --- | --- |
| Unit tests for the scientific geometry utilities | `npm run validate` checks data and types, but there is no test runner; the geometry in `scripts/lib/` has no unit tests. | #80 |
| Dependency and code-security automation | No Dependabot or CodeQL. GitGuardian secret scanning already runs on pull requests; account for it rather than duplicating it. | #81 |
| An NSF-oriented architecture and use-case brief | Supports funding conversations. | #82 |
| Screenshots and a reproducible demo walkthrough | Shows the app to readers who don't run it. | #83 |
| Accessibility and keyboard-use pass | The urban panel's collapsible sections work by keyboard (HO-21), but no full accessibility review of the app has been done. | #84 |
| Software bill of materials for releases | Release hygiene. | #85 |
| Issue and pull-request templates | Easier outside contributions. | #86 |
| Reproducibility manifest | Listed under section 2. | #87 |
| Backlog triage | Partly done during the handoff; the remaining open issues are the ones in this roadmap. | #88 |

## 5. Paused work, recoverable if needed

- **Modular-housing demo state semantics** (#34, closed). Route and
  checkpoint status was tracked per route while actions are per module, so
  delivering one module could mark a shared checkpoint as delivered. The full
  acceptance criteria can be recovered from the closed issue if the modular
  demo resumes.
- **Modular-housing proposal documents** (#22 visual plan, #23 narrative, #26
  walkthrough; all closed). Specs are complete in the closed issues and can be
  reopened if the modular proposal becomes an active funding pitch again.

## See also

- [`ROADMAP.md`](../../ROADMAP.md): the historical POC sequence and longer-term directions.
- [Scenario mapping](../research/scenario-mapping.md): the four proposed scenarios against the repository.
- [Extension guide](extending.md): how to add a layer, update data, or add a mode.
