# Urban-Resilience Layers

This document describes what each layer of the `urban-resilience-demo` mode
*is in the running application* — how it loads, how it is styled, how its
visibility is controlled, whether it can be clicked, and what it means. For
where each dataset came from, its exact study-area bounds, and how to
regenerate it, see the [data and source register](data-register.md) (#102,
HO-05) — that document and this one are companions, not duplicates.

**Trace path used for every layer below:** scenario data URL
(`src/domain/urbanResilience/grandIslePortFourchonScenario.ts`) → `AppShell`
prop (`src/app/AppShell.tsx`) → `CesiumScene` effect
(`src/components/CesiumScene/CesiumScene.tsx`) → `ViewerAdapter` method
(`src/ports/ViewerAdapter.ts`, implemented by
`src/adapters/viewer/CesiumViewerAdapter.ts`) → Cesium styler
(`src/cesium/*.ts`).

## Summary

| Layer | Classification | Cesium layer? | Default visibility | Toggleable | Selectable | Legend |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Buildings / Properties | Implemented, core | Yes | Always on | No | Yes | Rows 1–5, 9 |
| 2. FEMA Flood Hazard | Implemented, core | Yes | Always on | No | **No** | Row 6 |
| 3. Response Routes & Staging Resources | Implemented, core | Yes | On | **Coupled to layer 6's toggle — see note below** | No | Rows 7–8 |
| 4. Community/Public-Safety Facilities | Experimental | Yes | Off | Yes | Yes | **Missing — known issue** |
| 5. Ground Elevation Sample | Experimental | **No — React only** | Always loaded | No | n/a | n/a |
| 6. Experimental LA-1/FEMA Segments | Experimental | Yes | Off | Yes | Yes | Inline 3-row line legend only (not in the main legend) |
| 7. Optional Cesium OSM Buildings (3D context) | Optional | Yes (3D Tileset) | Env-var gated | **No in-app toggle** | No | n/a |

---

## 1. Buildings / Properties

**Classification: IMPLEMENTED, core layer.** The primary content of the
mode — 778 real building footprints, each risk-classified and rendered as an
extruded polygon.

**Source artifact.** `scenario.propertyDataUrl` =
`/data/urban-resilience/grand_isle_port_fourchon_properties.geojson`.

**Load path.** `CesiumScene`'s effect at `config.projectId` / `urbanScenario`
change calls `adapter.renderUrbanResilienceScenario(urbanScenario)`
(`CesiumScene.tsx:165`), which internally calls the private
`loadUrbanProperties(loadVersion, viewer, scenario)`
(`CesiumViewerAdapter.ts:740`). This loads a `Cesium.GeoJsonDataSource` from
`scenario.propertyDataUrl` (no `clampToGround` — buildings are true 3D
extrusions, not ground-draped), styles it, then adds it to the viewer.

**Styler.** `src/cesium/styleUrbanPropertyDataSource.ts`. Each polygon is
extruded to `building_height_m` (or a `5` m fallback,
`DEFAULT_URBAN_BUILDING_HEIGHT_M`), colored by risk tier
(`urbanRiskColors`, alpha `0.82`, `1.0` when selected), outlined in white
(yellow `#fef08a` when selected), and labeled with its address and risk tier
above the roof (label suppressed beyond `250 m`,
`URBAN_PROPERTY_LABEL_MAX_DISTANCE_M`).

**Ground-elevation sample marker.** Since risk-tier coloring alone gives no
signal for which of the 778 buildings have a USGS ground-elevation sample
(nearly all Grand Isle buildings are already red/`High`), a small blue
point marker (`elevationSampleMarker`, `#3b82f6`, white outline —
`applyUrbanElevationSampleMarker` in the same file) is layered onto the
*same entity*, at its existing roof position, for exactly the buildings
present in the committed ground-elevation sample GeoJSON. The marker's pixel
size **pulses gently** (10–18 px over a 2.5-second cycle, via a
`Cesium.CallbackProperty`) — a fixed-size dot proved hard to notice while
panning among hundreds of buildings, so this is a deliberate, low-cost
discoverability aid rather than a static indicator. The set of
sampled `property_id`s is derived in `AppShell.tsx` from that GeoJSON
itself (a second, independent fetch of the already-public file, not the
Node-only pinned manifest in `scripts/lib/urbanElevationSample.mjs`), then
passed through `CesiumScene`'s `urbanElevationSampledPropertyIds` prop to
`ViewerAdapter.setUrbanElevationSampledPropertyIds`. This only marks
buildings — the 4 sampled facilities are not marked, since they already
have distinct colored point markers (see layer 4) and are a small,
fully-visible set. See the legend (row 9) for the on-map explanation.

**Domain parser.** `src/domain/urbanResilience/parseUrbanPropertyAttributes.ts`
(`parseUrbanPropertyAttributes`), invoked by the adapter at pick time
(`CesiumViewerAdapter.ts:1082`) to build the typed
`ViewerSelection` payload.

**Visibility control.** Always on — no toggle exists; the layer is created
whenever `urbanScenario` is non-null (i.e., whenever the mode is active).

**Selectable.** Yes — `entityType: "urbanProperty"`, one of the 8
`ViewerSelection` variants (`src/ports/ViewerAdapter.ts:20-43`). Selecting a
property drives `UrbanPropertyDashboard.tsx` and (if the sampled property is
one of the 12 pinned buildings) the ground-elevation detail (layer 5).

**Legend.** Rows 1–4 (Low/Moderate/High/Unknown risk tiers), row 5
(selected-property outline), and row 9 (ground-elevation sample marker) in
`UrbanMapLegend.tsx`.

**Interpretation limits.** `risk_level` is a documented zone-based proxy, not
a computed hydraulic model or an official flood determination. See the [data
register](data-register.md#1-grand-isle--port-fourchon-properties) for the
full classification rule and the confirmed result (all 435 Grand Isle
properties `High`, all 343 Port Fourchon properties `Unknown`).

---

## 2. FEMA Flood Hazard

**Classification: IMPLEMENTED, core layer — with one architectural gap.**
The 7 raw FEMA NFHL polygons, ground-draped beneath the property layer.

**Source artifact.** `scenario.floodZoneDataUrl` =
`/data/urban-resilience/grand_isle_port_fourchon_flood_zones.geojson`.

**Load path.** Same `renderUrbanResilienceScenario` call as layer 1, via the
private `loadUrbanFloodZones(loadVersion, viewer, scenario)`
(`CesiumViewerAdapter.ts:685`). Loaded **with** `clampToGround: true` (unlike
the property layer) — flood zones are flat overlays, not extrusions.

**Styler.** `src/cesium/createUrbanFloodZoneLayers.ts`
(`styleUrbanFloodZoneDataSource`). Colored by the same `urbanRiskColors`
palette as properties, but at a much lower alpha (`0.22`,
`URBAN_FLOOD_ZONE_MATERIAL_ALPHA`) so it reads as a translucent wash rather
than a solid fill, outlined in a pale blue (`#e0f2fe`,
`floodZoneOutline`). A code comment explains the drape-not-extrude choice:
per-zone depth (`static_bfe_ft`) is not reliably present for every zone, so
it is not used to drive extrusion height.

**Domain parser. NONE — this is a genuine gap.** `types/urbanResilience.ts`
declares a `UrbanFloodZoneAttributes` interface, but it is **never imported
anywhere in `src/`.** The styler reads the raw `Record<string, unknown>`
directly instead of going through a typed parser. This is the one layer in
the entire mode with an unvalidated data path. Tracked in Issue #115
(HO-18), which is expected to either add the missing parser or document an
explicit, deliberate exemption.

**Visibility control.** Always on — no toggle.

**Selectable. No, by design.** The styler tags each entity
`entityType: "urbanFloodZone"` (`createUrbanFloodZoneLayers.ts`), and the
adapter keeps an `urbanFloodZoneEntities` map for camera-framing purposes —
but `"urbanFloodZone"` is **not** one of the 8 `ViewerSelection` variants
(`src/ports/ViewerAdapter.ts:20-43`), and the pick handler's `entityType`
branches (`CesiumViewerAdapter.ts:1098-1160`) never test for it. Clicking a
flood-zone polygon does nothing; this is intentional, not a bug, but it
means the `entityType` tag and the entity map exist only for camera
purposes, not selection.

**Legend.** Row 6 ("FEMA flood zone overlay") in `UrbanMapLegend.tsx`.

**Interpretation limits.** NFHL polygons are mapped hazard information, not
current floodwater, a forecast, or a project-generated hydraulic model. See
the [data register](data-register.md#2-grand-isle--port-fourchon-flood-zones)
for the confirmed zone codes and the `-9999` BFE sentinel value to watch for.

---

## 3. Response Routes & Staging Resources

**Classification: IMPLEMENTED, core layer — with a known visibility bug.**
Two illustrative LA-1 evacuation routes (purple lines) and three regional
staging-reference points (blue dots).

**Source artifact.** `scenario.responseDataUrl` =
`/data/urban-resilience/grand_isle_port_fourchon_response.geojson`, fetched
directly inside `AppShell.tsx`'s `openUrbanResilienceDemo` callback
(`AppShell.tsx:344`) and parsed by
`src/domain/urbanResilience/parseUrbanResponseContext.ts`
(`parseUrbanResponseContext`) into `{ routes, resources }`, then merged onto
the scenario object before it reaches `CesiumScene`. Note:
`grandIslePortFourchonScenario.ts` itself declares `routes: []` and
`resources: []` — these are always populated at runtime by this fetch, never
read from the static scenario module.

**Load path.** Created as plain Cesium entities (not a `GeoJsonDataSource`)
inside `renderUrbanResilienceScenario`, via
`createUrbanResilienceResponseEntities(viewer, scenario.resources,
scenario.routes)` (`src/cesium/createUrbanResilienceResponseEntities.ts`).
Route entities are additionally tracked in a dedicated
`urbanResponseRouteEntities` set, separate from the general `urbanEntities`
set, specifically so their visibility can be toggled independently (see
below).

**Styling.** Routes: purple polylines (`route`, `#8b5cf6`), clamped 4 m above
ground (`URBAN_ROUTE_HEIGHT_M`), 6 px wide (`URBAN_ROUTE_WIDTH_PX`), labeled
at their midpoint. Resources: blue point markers (`resource`, `#0ea5e9`),
16 px, labeled to the right. Labels on both suppress beyond 8 km
(`URBAN_RESPONSE_LABEL_MAX_DISTANCE_M`).

**Domain parser.** `parseUrbanResponseContext.ts`, applied once at fetch
time in `AppShell.tsx` (not per-entity at render time, unlike the other
layers).

**Visibility control.** Route visibility (not
existence — the entities are always created) is controlled by
`CesiumScene`'s `urbanResponseRoutesVisible` prop, wired in `AppShell.tsx` as:

```
urbanResponseRoutesVisible={
  mode !== "urban-resilience-demo" || !urbanLa1FemaExperimentEnabled
}
```

**Enabling the experimental LA-1/FEMA layer (layer 6, below) currently hides
the response routes.** This is **intentional original design**, not a
defect — the two layers were built as an either/or presentation of the same
corridor: the purple route is a simple, hand-simplified illustrative path,
while the experimental layer traces the real OpenStreetMap road geometry
segment by segment. Issue #116 (HO-19) is not a bug fix; it gives routes
their own independent toggle in the planned layer registry so the two layers
can be shown together or separately, as a clarity improvement to this
existing behavior. Staging-resource points are **not** affected either way —
only route polylines are gated by `urbanResponseRoutesVisible`
(`CesiumViewerAdapter.ts:444-448`, `setUrbanResponseRoutesVisible`).

**Selectable.** No — neither routes nor resources carry an `entityType` tag
or appear in the `ViewerSelection` union. They are informational only.

**Legend.** Row 7 ("Regional staging reference") and row 8 ("LA-1 response
route") in `UrbanMapLegend.tsx`.

**Interpretation limits.** Both routes' `status: "at-risk"` is a hardcoded,
hand-assigned research judgment, not derived from live road-condition data.
The three staging points are explicitly *not* official shelters. See the
[data register](data-register.md#3-grand-isle--port-fourchon-response) for
the full route-construction method and anchor coordinates.

---

## 4. Community/Public-Safety Facilities (Experimental)

**Classification: EXPERIMENTAL — with a missing legend, tracked to fix.**
Four real OSM-derived facility records near Grand Isle (fire station,
police, town hall, school), each carrying a conservative FEMA-relationship
classification.

**Source artifact.** `scenario.experimentalFacilityDataUrl` =
`/data/urban-resilience/experiments/community_public_safety_facilities.geojson`.

**Load path.** A **separate** render call from layers 1–3:
`renderUrbanFacilityExperiment(dataUrl)`
(`CesiumViewerAdapter.ts:380-443`), with its own monotonic load-version
guard (`urbanFacilityLoadVersion`) independent of the main scenario's
`urbanLoadVersion`. No `clampToGround` (facility markers use a `Point`
graphic set explicitly to `HeightReference.NONE`).

**Styler.** `src/cesium/styleUrbanFacilityDataSource.ts`
(`styleUrbanFacilityDataSource`). Colors by `facility_category`: cyan
`#06b6d4` for `public-safety`, purple `#a855f7` for `community`, yellow
`#fef08a` when selected. **These three hex values are hardcoded directly in
this file** rather than imported from `src/theme/urbanResilienceVisualTokens.ts`
— the one styler in the mode that bypasses the shared token file. Tracked
for consolidation in Issue #113 (HO-16).

**Domain parser.** `src/domain/urbanResilience/parseUrbanFacilityAttributes.ts`
(`parseUrbanFacilityAttributes`).

**Visibility control.** Explicit boolean toggle,
`urbanFacilityExperimentEnabled` state in `AppShell.tsx`, surfaced as the
"Optional facility layer: On/Off" button in
`UrbanFacilityExperimentPanel.tsx`. Defaults to **off**.

**Selectable.** Yes — `entityType: "urbanFacility"`, one of the 8
`ViewerSelection` variants. Selecting a facility drives the facility
inspector in `UrbanFacilityExperimentPanel.tsx` and (all 4 sampled
facilities are in the pinned elevation manifest) the ground-elevation detail
(layer 5).

**Legend. ⚠️ Known issue: missing.** `UrbanMapLegend.tsx` has no entry for
either facility color, even though `UrbanFacilityExperimentPanel.tsx`
explicitly instructs the user to *"Click a cyan public-safety or purple
community marker"* — the legend currently contradicts that instruction by
omission. Tracked to fix in Issue #113 (HO-16), alongside the token-file
consolidation above.

**Interpretation limits.** All 4 sampled facilities are in Grand Isle; Port
Fourchon returned zero matching OSM records — the panel and the committed
metadata both state this does not prove facilities are absent there. See the
[data register](data-register.md#5-experimental-communitypublic-safety-facilities)
for the full facility list and how the fetch/classify tag mismatch is now
handled (Issue #108, HO-11: unclassified types are skipped and counted, not
fatal).

---

## 5. Ground Elevation Sample (Experimental)

**Classification: EXPERIMENTAL — and NOT a Cesium layer itself.** A small,
fixed USGS 3DEP elevation sample (16 points: 12 buildings + 4 facilities),
shown as detail rows in the selected-property or selected-facility
inspector — the sample data itself is never rendered as its own map layer
(no polygons or lines). Since a user has no way to tell which of the 778
buildings have a sample without clicking every one, layer 1 (Buildings /
Properties) marks the 12 sampled buildings directly on the map with a small
blue marker, described there and in legend row 9 — the marker is part of
layer 1's styling, not a separate rendered layer here.

**Source artifact.** `scenario.experimentalGroundElevationDataUrl` =
`/data/urban-resilience/experiments/grand_isle_ground_elevation_sample.geojson`.

**Load path — deliberately different from every other layer.** Fetched and
cached entirely in **React**, not through the `ViewerAdapter` at all.
`UrbanResilienceDemoPanel.tsx:66-99` holds a `useEffect` that calls
`loadUrbanGroundElevationSample(scenario.experimentalGroundElevationDataUrl,
signal)` (`src/domain/urbanResilience/loadUrbanGroundElevationSample.ts`)
with an `AbortController`, on every `urbanScenario` change, storing the
result as a `Map<string, UrbanGroundElevationAttributes>` keyed by
`entity_key` (e.g. `property:GI-0064` or
`facility:osm-node-367132153`) in local panel state
(`groundElevationLookup`).

**Domain parser.** `parseUrbanGroundElevationAttributes` in the same file —
a strict, hand-written validator (not GeoJSON-generic) checking every field
name and type the build script emits, including the `available` vs.
`unavailable` mutual-exclusion rule (an available record must have a
numeric elevation, raster ID, and positive resolution; an unavailable record
must have `null` elevation and a stated reason).

**Rendered by.** `UrbanGroundElevationDetails.tsx`, mounted **twice** —
once inside `UrbanPropertyDashboard.tsx` (for a selected sampled building)
and once inside `UrbanFacilityExperimentPanel.tsx` (for a selected sampled
facility) — both reading from the same single lookup `Map`. This duplication
is tracked for consolidation into one owner in Issue #117 (HO-20).

**Visibility control.** n/a — always fetched once the mode is active; there
is no toggle because it isn't a map layer to hide.

**Selectable.** n/a.

**Legend.** n/a — not on the map.

**Interpretation limits.** Only 12 of 778 buildings and all 4 sampled
facilities have an elevation record; most properties have none. Values are
estimated/interpolated ground elevation at one representative coordinate —
explicitly *not* flood depth, building height, floor elevation, FEMA Base
Flood Elevation, or a safety finding. "Missing elevation is represented as
unavailable, never as zero" is enforced by the parser's mutual-exclusion
rule above. See the
[data register](data-register.md#6-experimental-grand-isle-ground-elevation-sample)
for the pinned-sample identity risk (Issue #107, HO-10).

---

## 6. Experimental LA-1/FEMA Segments

**Classification: EXPERIMENTAL — the live research thread.** All 48
original (unmodified) OSM LA-1 way segments, each carrying a conservative
FEMA-hazard relationship. This is the dataset behind Issue #67, the one
open, unmilestoned research question in the backlog.

**Source artifact.** `scenario.experimentalLa1FemaDataUrl` =
`/data/urban-resilience/experiments/la1_fema_intersections.geojson`.

**Load path.** A separate render call,
`renderUrbanLa1FemaExperiment(dataUrl)`
(`CesiumViewerAdapter.ts:314-379`), with its own load-version guard
(`urbanLa1FemaLoadVersion`). Loaded **with** `clampToGround: true` — these
are road centerlines draped on terrain, like the flood-zone layer.

**Styler.** `src/cesium/styleUrbanLa1FemaDataSource.ts`
(`styleUrbanLa1FemaDataSource`). Three visual states by
`intersects_mapped_flood_hazard`:
- `true` → solid purple line (`urbanResilienceVisualColors.route`, `#8b5cf6`
  — the same purple as the response route, chosen so a confirmed FEMA
  overlap reads as a deliberate, prominent finding), outlined dark slate
- `false` → solid slate line (`#64748b`), no dash
- `null` (Unknown) → **dashed** slate-gray line (`#94a3b8`, 14 px dash)

Selected segments get a white outline and thicker width (7 px vs. 3–4 px).

**Domain parser.** `src/domain/urbanResilience/parseUrbanLa1FemaSegment.ts`
(`parseUrbanLa1FemaSegmentAttributes`).

**Visibility control.** Explicit boolean toggle,
`urbanLa1FemaExperimentEnabled` state in `AppShell.tsx`, surfaced as the
"Experimental layer: On/Off" button in
`UrbanLa1FemaExperimentPanel.tsx`. Defaults to **off**. **Enabling this
toggle currently also hides the response routes (layer 3), by original
design** — see layer 3's note above. Issue #116 (HO-19) will give each layer
its own independent toggle so they can be shown together.

**Selectable.** Yes — `entityType: "urbanLa1FemaSegment"`, one of the 8
`ViewerSelection` variants. Selecting a segment drives the 13-field
inspector in `UrbanLa1FemaExperimentPanel.tsx`.

**Legend.** **Not in the main `UrbanMapLegend`.** A separate, inline 3-row
line-style legend (solid purple / solid slate / dashed slate) is rendered
directly inside `UrbanLa1FemaExperimentPanel.tsx` when the layer is enabled,
distinct from the main map legend section.

**Interpretation limits.** No segment in this dataset is currently
classified fully `available` (fully evaluated); the narrower query windows
mean full-coverage classification isn't yet achievable for the whole
corridor — precisely Issue #67's open question. The validator's
`PROHIBITED_FIELDS` blocks any decision-support field (`status`,
`risk_level`, `flooded`, `closed`, `safe`, `passable`, `evacuation_status`,
`recommended_action`); this dataset is relationship-only. See the [data
register](data-register.md#4-experimental-la-1fema-intersections) for the
confirmed coverage-status breakdown.

---

## 7. Optional Cesium OSM Buildings (3D Context)

**Classification: OPTIONAL, environment-gated.** A Cesium ion-hosted 3D
Tileset of surrounding OSM buildings, for visual context only — entirely
separate from the risk-classified property layer (layer 1), which renders
its own buildings from local data regardless of this setting.

**Source.** Not a local artifact — `Cesium.createOsmBuildingsAsync()`,
Cesium's own hosted global OSM Buildings tileset, requires Cesium ion.

**Gate — both conditions must be true.**
1. `VITE_ENABLE_URBAN_OSM_BUILDINGS=true` (`isUrbanOsmBuildingsEnabled()`,
   `src/config/cesiumIon.ts`), checked in
   `renderUrbanResilienceScenario` (`CesiumViewerAdapter.ts:301-306`) —
   **defaults to `false`** in `.env.example`.
2. `VITE_CESIUM_ION_ACCESS_TOKEN` present (`hasCesiumIonAccessToken()`),
   checked inside `createOptionalOsmBuildings()`
   (`src/cesium/createOptionalOsmBuildings.ts:9-11`) — returns `null` (no
   tileset) if absent, regardless of the first gate.

**Load path.** `loadOptionalUrbanOsmBuildings(loadVersion, viewer)`
(`CesiumViewerAdapter.ts:794-833`), called via `void` (fire-and-forget, not
awaited by the main render path) from inside
`renderUrbanResilienceScenario`. Added as a `Cesium3DTileset` primitive,
tracked in a dedicated `urbanTilesets` set. Failure (e.g., ion token
rejected) is caught and logged as a warning; it does not block the rest of
the scenario from rendering.

**Styling.** White tint at alpha `0.55`
(`DISASTER_OSM_BUILDINGS_ALPHA` — the constant name is shared with the
`disaster-demo` mode's identical helper).

**Visibility control.** **No in-app toggle exists.** The only way to change
this is editing the environment file and restarting the dev server. The
panel surfaces read-only status text (`UrbanResilienceDemoPanel.tsx:221-243`):
*"Additional 3D context: Off"* / *"On"* / *"is unavailable"* (shown when the
env flag is `true` but no token is configured) — informational only, with no
control to act on it.

**Selectable.** No — this tileset carries no `entityType` metadata and is
not part of the `ViewerSelection` union.

**Legend.** n/a.

**Interpretation limits.** Purely visual context; not part of the research
classification. Missing a Cesium ion token degrades this specific layer
gracefully (it simply doesn't load) — this is **not** the same situation as
the base-imagery fallback documented in `SECURITY.md`'s "Rotating viewer
credentials" section, which affects the whole viewer's basemap, not just
this optional layer.

---

## Known issues summary (cross-referenced, not duplicated)

| # | Issue | Affects | Tracked in |
| --- | --- | --- | --- |
| 1 | No domain-side parser for FEMA flood-zone attributes | Layer 2 | #115 (HO-18) |
| 2 | Enabling the LA-1/FEMA experiment silently hides response routes | Layers 3, 6 | #116 (HO-19) |
| 3 | Facility colors hardcoded outside the token file; missing from the legend | Layer 4 | #113 (HO-16) |
| 4 | Duplicated ground-elevation detail component (two owners, one lookup) | Layer 5 | #117 (HO-20) |
| 5 | Pinned elevation-sample identity breaks on property/facility regeneration | Layers 4, 5 | #107 (HO-10) |
| 6 | Live open research question: no segment yet fully evaluated | Layer 6 | #67 |

## See also

- [`docs/data/data-register.md`](data-register.md) — provenance, exact
  study-area bounds, and regeneration commands for every dataset named above.
- [`docs/architecture.md`](../architecture.md) — the viewer-independence
  rule (`only src/cesium and the viewer adapter import cesium`) that every
  layer above follows.
- [`docs/decisions/006-urban-resilience-real-data-guardrails.md`](../decisions/006-urban-resilience-real-data-guardrails.md) —
  the guardrails these layers are built and worded under.
