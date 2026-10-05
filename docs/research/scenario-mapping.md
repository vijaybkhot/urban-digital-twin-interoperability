# Scenario Mapping

This document is for researchers continuing the Urban Digital Twin prototype
for coastal storm flooding in Grand Isle and Port Fourchon. It takes the
project's four proposed scenarios and maps each one onto this repository:
what the scenario needs at each stage, what already exists here, and what is
missing.

**Nothing here is implemented.** The four scenarios are proposed processes,
not capabilities. The only flood-exposure feature the application has today
is the FEMA-zone property classification described under
[Current baseline](#current-baseline-implemented), which is a different and
simpler thing than any of the four.

## Source of the scenarios

The scenarios are defined in the project's scenario proposal, a separate
project document that is not stored in this repository. It proposes four
scenarios for residential property users in Grand Isle and port tenants in
Port Fourchon, in two groups:

| Group | Scenario | User question, in short |
| --- | --- | --- |
| A. Risk analysis | **A1. Event-specific property exposure** | What flooding does one storm simulation indicate at this property and along its connecting roads? |
| A. Risk analysis | **A2. Long-term property exposure** | Would that flooding differ under future coastal conditions, or with and without planned coastal projects? |
| B. Disaster-response support | **B1. Response options for this property and event** | Given A1's findings, what does each response action (leave, go to a public shelter, stay) involve for this household? |
| B. Disaster-response support | **B2. Post-event access and return** | After a past storm, what did officials say about permission to enter and conditions, and what was not said? |

A1's results feed B1. A2 compares model runs. B2 works independently from
dated official notices.

The proposal grounds these scenarios in published sources rather than
categories invented for the prototype:

- **Planning structure:** FEMA (2021), *Comprehensive Preparedness Guide
  (CPG) 101*, Version 3.0; GOHSEP (2024), *State of Louisiana Emergency
  Operations Plan*.
- **Response guidance for B1:** GOHSEP (2025), *Louisiana Emergency
  Preparedness Guide*.
- **Local context:** Jefferson Parish (2025) and Lafourche Parish (2026)
  hazard mitigation plans.
- **Modeled storm conditions for A1 and A2:** Hemmerling et al. (2023),
  *2023 Coastal Master Plan, Supplemental Material H6.4: Historic Storm
  Run — Ida*, Coastal Protection and Restoration Authority (CPRA).
- **Historical notices for B2:** Greater Lafourche Port Commission (2021),
  *Hurricane Ida: Updates 1–15*.
- **Research context:** Lindell & Perry (2012), the protective action
  decision model; Macatulad & Biljecki (2024), urban digital twins in
  disaster risk management.

The proposal states that the four-scenario structure is a project-specific
proposal informed by these sources, and that the sources do not prescribe it.

## The mapping template

Each scenario is mapped through five stages. A scenario is only as ready as
its weakest stage.

| Stage | Question | Where it lives in this repository |
| --- | --- | --- |
| 1. Scenario | What does the user ask, and what may the answer claim? | The scenario proposal, then an ADR in `docs/decisions/` |
| 2. Required data | Which sources, study areas, and licenses? | `scripts/lib/studyAreas.mjs`, `docs/data/data-register.md` |
| 3. Processing | Which scripted steps produce a committed, validated artifact? | `scripts/fetch*.mjs`, `scripts/build*.mjs`, `scripts/validate*.mjs`, `public/data/` |
| 4. Digital-twin state | Which viewer-independent types hold the result? | `src/types/`, `src/domain/` |
| 5. Viewer rendering | How is it drawn and inspected? | `src/ports/ViewerAdapter.ts`, `src/adapters/viewer/`, `src/cesium/`, `src/components/` |

Stages 2–3 run offline in Node scripts; stages 4–5 only read what stage 3
committed. Raster sampling, road sampling, and run comparison therefore all
belong in `scripts/`, not in the browser. The file-by-file steps are in
[the extension guide](../handoff/extending.md).

## Rules every scenario must follow

From the scenario proposal:

- **Keep kinds of information separate.** A value from a simulation, a
  statement published by an official body, information the user entered, and
  anything that could not be determined are shown as distinct elements, never
  merged.
- **Every result carries its source.** Source, date or model run, units, and
  limitations travel with each displayed value.
- **Missing information is labeled, not hidden.** Show "information
  unavailable" rather than a blank, and never treat a gap as evidence of safe
  conditions.
- **Exposure only.** No damage, financial loss, or probability of flooding.
- **No recommendations.** No action is ranked, preferred, or presented as an
  instruction. Official emergency instructions remain authoritative.

From this repository's existing guardrails
([ADR 006](../decisions/006-urban-resilience-real-data-guardrails.md),
[CONTRIBUTING.md → Scientific and safety language](../../CONTRIBUTING.md#scientific-and-safety-language)):

- `Unknown` is never shown or counted as `Low`; absence of data is not
  evidence of absence.
- No new hazard model, score, or index.
- No claim that a road is passable, a facility is operating, or a place is
  safe.
- Every artifact has a data register entry and a validator in
  `npm run validate`.

## Current baseline (implemented)

What the application does today, traced through the five stages. It answers
a narrower question than A1: which **regulatory** FEMA flood zone a building
falls in, not what a storm simulation indicates.

| Stage | Today |
| --- | --- |
| 1. Scenario | For a selected building: its mapped FEMA zone, a documented zone-based classification, and ground elevation where sampled. |
| 2. Data | OSM building footprints (Overpass); FEMA NFHL flood zones (MapServer layer 28); USGS 3DEP point elevations for a 16-record sample. Study areas in `scripts/lib/studyAreas.mjs`. |
| 3. Processing | `scripts/buildUrbanResiliencePropertyData.mjs` tests each footprint centroid against the zones and maps the zone code to a tier in `classifyFemaZone` (`V`/`VE` → High, `A`-family → Moderate, `D` or no match → Unknown, other mapped zones → Low). Output: `public/data/urban-resilience/grand_isle_port_fourchon_properties.geojson`, checked by `scripts/validateUrbanResilienceData.mjs`. |
| 4. State | `UrbanPropertyAttributes` (`src/types/urbanResilience.ts`), parsed by `src/domain/urbanResilience/parseUrbanPropertyAttributes.ts`; the `buildings-properties` entry in `urbanResilienceLayerRegistry.ts`. |
| 5. Rendering | `src/cesium/styleUrbanPropertyDataSource.ts` (risk-colored extrusions); `UrbanPropertyDashboard.tsx` and `UrbanGroundElevationDetails.tsx` in the urban panel. |

Known limits: all 343 Port Fourchon properties are `Unknown` because the FEMA
query there returned no polygons; the tiers are a documented proxy, not a
computed hazard.

**What A1 can reuse from it:** footprint ingestion and selection, the
inspector and selection pattern, `Unknown` handling, and the
provenance-and-validator discipline.

**What A1 cannot reuse:** the hazard input (FEMA zones are regulatory, not a
storm simulation), and the property identifier. A1 needs a stable identifier
for each building, but `property_id` (`GI-0001`, …) is assigned in Overpass
response order and can shift when OSM is re-fetched (see the pinned-manifest
section of [`docs/data/regeneration.md`](../data/regeneration.md)). The
stable key available today is `osm_way_id`.

**Not needed by the four scenarios:** the USGS ground-elevation sample. The
proposal does not convert water surface elevation into depth above ground,
which is the only case where terrain data would matter.

## A1. Event-specific property exposure

**Status: PROPOSED.** Feeds B1.

| Stage | Needed | Exists today | Missing |
| --- | --- | --- | --- |
| 1. Scenario | Modeled values at one building and along its connecting roads for one storm run, with source, units, coverage, and unknowns | — | An ADR fixing what A1 may claim |
| 2. Data | CPRA 2023 Coastal Master Plan Ida run outputs as spatial grids (peak water surface elevation in ft NAVD88, and modeled flood depth); OSM footprints; OSM road centerlines from the property to the route out; optional resident-reported structure details | OSM footprints for both study areas; 48 OSM LA-1 ways | Confirmed access to the model grids and their wet/dry/missing definitions; a local street network; resident data (none collected; collection needs review first) |
| 3. Processing | Register each dataset's product, units, vertical reference, cell size, extent, assumptions, and date; sample the grid at each footprint (representative value, range, % covered); sample roads at fixed intervals; write an unknowns list | Point-in-polygon and line/polygon helpers in `scripts/lib/` | Raster sampling of any kind; dataset registration records; road-interval sampling |
| 4. State | A per-building exposure record that links to its dataset registration and carries its unknowns, keyed by a stable id | `UrbanPropertyAttributes` (no simulation fields) | The exposure record type; a stable building key (`osm_way_id`, not `property_id`) |
| 5. Rendering | Building and road segments on the map; value with units, vertical reference, and coverage; run name and date; a visible unknowns list, each in its own element | The urban panel's inspector pattern; LA-1 experiment styling as a road-segment precedent | An A1 inspector with separate channels for modeled values, source, and unknowns |

Check before building: compare sampled results against the Grand Isle point
values published in Hemmerling et al. (2023), Table 1, where the same
locations and run can be matched.

## A2. Long-term property exposure

**Status: PROPOSED.** Builds on A1.

| Stage | Needed | Exists today | Missing |
| --- | --- | --- | --- |
| 1. Scenario | The same property under two runs (Year 0; Year 50 without action; Year 50 with action), labeled as a difference between model runs, not a prediction | — | An ADR, including the source study's own caution about future scenarios |
| 2. Data | Spatial outputs for the chosen pair of runs | — | Confirmation that the runs exist as grids, not only as published figures; Port Fourchon detail (the report gives point values for Grand Isle only) |
| 3. Processing | Register both datasets; check same units, vertical reference, grid, and quantity; sample both at the property; compute a difference only when comparable | — | All of it, beyond A1 |
| 4. State | A paired-result record stating which question the pair answers and whether it is comparable | — | The record type |
| 5. Rendering | Two values side by side with run names; the difference only when comparable; "Year 50" kept as the study's wording, never a calendar year; no probability | — | The comparison view |

## B1. Response options for this property and event

**Status: PROPOSED.** Uses A1's results; performs no hazard analysis.

| Stage | Needed | Exists today | Missing |
| --- | --- | --- | --- |
| 1. Scenario | Three fixed actions (leave, public shelter, stay), each with official guidance, relevant A1 findings, household implications, and gaps; nothing ranked or recommended | — | An ADR; A1 |
| 2. Data | A1 results; published guidance as dated text (GOHSEP 2025 preparedness guide); household answers entered by the user | — | A1 results; a store of dated guidance text; a decision on whether household answers are kept or discarded after a session (the prototype has no persistence today) |
| 3. Processing | None beyond A1; guidance is stored and quoted, not processed | — | Curated guidance records with source, date, and issuing body |
| 4. State | A per-action record with the four fields, where an empty field is `Unknown`, never omitted | — | The record types |
| 5. Rendering | The three actions side by side in a fixed order, with "follow information from local officials" shown alongside all of them, and a statement that this is preparedness guidance, not an order for a current event | — | The option panel. The existing response routes and staging references must not be reused as shelters or evacuation destinations; they are approximate town centers |

## B2. Post-event access and return

**Status: PROPOSED.** Independent of A1 and A2.

| Stage | Needed | Exists today | Missing |
| --- | --- | --- | --- |
| 1. Scenario | For Port Fourchon and a past storm (Hurricane Ida, 2021): official notices as a dated sequence, with permission to enter kept separate from reported conditions, and gaps shown | — | An ADR |
| 2. Data | Greater Lafourche Port Commission Ida updates 1–15 (Aug 26–Sep 10, 2021) | — | The notice records; the timestamps' time zone (record it as unknown if not stated); handling for an update with a later revision |
| 3. Processing | One dated record per notice (issuer, time, area, wording as published), split into an entry-status track and a conditions track | — | All of it |
| 4. State | Notice records ordered by publication time; periods with no notice represented as gaps | — | The record types |
| 5. Rendering | A timeline with the two tracks and visible gaps; never combined with A1/A2 results in one element; when the same storm appears in both, a statement that one is a model run and the other a published notice | `UrbanTwinEventFeed.tsx` shows dated entries, but it is a data-provenance feed and should stay separate from notices | The timeline view |

## Checks still open before implementation

From the scenario proposal:

- Access to suitable spatial model outputs for A1 and A2, their resolution,
  and their wet, dry, and missing definitions.
- Whether resident-reported floor heights can be related to the model's
  vertical reference.
- Whether parish guidance adds to or differs from state guidance for B1, and
  whether authoritative shelter information exists in published form.
- The internal references of the Jefferson Parish plan and the relevant hazard
  sections of both parish plans.
- The time zone of the B2 notices and whether original posting times are
  preserved.

## How to take a scenario forward

1. Resolve that scenario's open checks above.
2. Write an ADR stating what it may and may not claim, citing the scenario
   proposal and its sources.
3. Build stages 2–3 as scripts with validators, then stages 4–5, following
   [the extension guide](../handoff/extending.md).
4. Add the new data to `docs/data/data-register.md` and the new panel checks to
   `docs/urban-resilience-panel-regression-checklist.md`.
