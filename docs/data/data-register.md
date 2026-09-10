# Data and Source Register

This register documents every dataset and generated artifact behind the
`urban-resilience-demo` mode and the two other application modes that carry
their own local data (`disaster-demo`, `existing-demo`/`workflow`). It answers,
per dataset: what it is, where it came from, what script produces it, what its
real coverage and limitations are, and how to regenerate it.

**Companions, not duplicates.** This register does not restate:
- **Legal attribution and licensing** — see [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).
- **The exact regeneration order and its known hazards** (the circular
  dependency between the base, facility, and elevation pipelines; the
  pinned-manifest identity risk) — see
  [`docs/data/regeneration.md`](regeneration.md) (Issue #107, HO-10).
- **How each layer renders in the Cesium viewer** (adapter methods, stylers,
  toggles, legend entries) — see
  [`docs/data/urban-resilience-layers.md`](urban-resilience-layers.md)
  (Issue #106, HO-09).
- **Checksums and a machine-readable reproducibility manifest** — tracked
  separately as Issue #87 (BONUS-008), not implemented here.

All three companion documents may not exist yet depending on the order H1/H2
issues were executed in; where a link above 404s, its issue is still open.

## Quick reference

| # | Dataset | Committed file | Features | Status |
| --- | --- | --- | --- | --- |
| 1 | Grand Isle & Port Fourchon Properties | `public/data/urban-resilience/grand_isle_port_fourchon_properties.geojson` | 778 | Generated, core layer |
| 2 | Grand Isle & Port Fourchon Flood Zones | `public/data/urban-resilience/grand_isle_port_fourchon_flood_zones.geojson` | 7 | Generated, core layer |
| 3 | Grand Isle & Port Fourchon Response | `public/data/urban-resilience/grand_isle_port_fourchon_response.geojson` | 5 | Generated, core layer |
| 4 | Experimental: LA-1/FEMA Intersections | `public/data/urban-resilience/experiments/la1_fema_intersections.geojson` | 48 | Generated, experimental |
| 5 | Experimental: Community/Public-Safety Facilities | `public/data/urban-resilience/experiments/community_public_safety_facilities.geojson` | 4 | Generated, experimental |
| 6 | Experimental: Grand Isle Ground Elevation Sample | `public/data/urban-resilience/experiments/grand_isle_ground_elevation_sample.geojson` | 16 | Generated, experimental |
| 7 | Fictional Disaster-Resilience Properties | `public/examples/disaster_resilience_properties.geojson` | 6 | Hand-authored |
| 8 | Project Configuration (`existing-demo`/`workflow`) | `public/project_config.json` | — (facility/sensor scene) | Hand-authored |
| 9 | Cesium Milk Truck (GLB model) | `public/models/CesiumMilkTruck.glb` | — (binary asset) | External, vendored |
| 10 | `public/tilesets/` | `public/tilesets/.gitkeep` | — (empty) | Planned, unused |

Source endpoints used anywhere in this register, verbatim:

```text
https://overpass-api.de/api/interpreter
https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query
https://epqs.nationalmap.gov/v1/json
```

All three are public, unauthenticated services. No dataset in this register
requires an API key to fetch, build, or validate.

---

## 1. Grand Isle & Port Fourchon Properties

**Purpose.** The primary layer of the `urban-resilience-demo` mode: every
real building footprint in the two study areas, each carrying a FEMA-zone-based
risk classification. Drives the always-on extruded building layer and the
selected-property dashboard.

**Study area.** Two bounding boxes (`[south, west, north, east]`, decimal
degrees), from `scripts/fetchUrbanResilienceSourceData.mjs`:
- Grand Isle: `[29.225, -89.99, 29.245, -89.955]`
- Port Fourchon: `[29.09, -90.22, 29.17, -90.14]`

**Authoritative organizations.** OpenStreetMap contributors (building
geometry); FEMA (flood zone code used only for classification, not geometry,
in this artifact).

**Acquisition mechanism.**
- Overpass query: `way["building"](<bbox>);out body geom;` against
  `https://overpass-api.de/api/interpreter`
- FEMA query: `esriGeometryEnvelope` intersect against
  `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query`,
  requesting `FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE`, `resultRecordCount=2000`

**Original format.** Overpass JSON (cached as `grand-isle-buildings.json`,
`port-fourchon-buildings.json`) and FEMA GeoJSON (cached as
`grand-isle-flood-zones.json`, `port-fourchon-flood-zones.json`) under the
gitignored `scripts/.cache/urban-resilience/`.

**Processed format.** Minified GeoJSON `FeatureCollection` of `Polygon`
features (one ring per building; holes are not modeled).

**Script / npm command.**
```
npm run fetch:urban-resilience-data     # scripts/fetchUrbanResilienceSourceData.mjs
npm run build:urban-resilience-data     # scripts/buildUrbanResiliencePropertyData.mjs
npm run validate:urban-resilience-data  # scripts/validateUrbanResilienceData.mjs
```

**Resulting file.** `public/data/urban-resilience/grand_isle_port_fourchon_properties.geojson`
(901,154 bytes).

**Feature count.** 778 total — 435 `GI-####` (Grand Isle) + 343 `PF-####`
(Port Fourchon), IDs assigned sequentially in Overpass response order.

**Confirmed risk-classification result** (counted directly from the committed
file): **all 435 Grand Isle properties classify `High`**; **all 343 Port
Fourchon properties classify `Unknown`**. There are currently zero `Moderate`
and zero `Low` records anywhere in this dataset. This matches ADR 006's
finding almost exactly and is a genuine result of real data, not an artifact
of the classifier: the Port Fourchon FEMA query window returned **zero**
polygons at all (confirmed against dataset #2 below), so every Port Fourchon
building falls back to the `Unknown` "no matching polygon" branch, not a
computed low-risk result.

**Classification rule** (from `buildUrbanResiliencePropertyData.mjs`,
`classifyFemaZone`):
| FEMA zone code | `risk_level` | `sfha` |
| --- | --- | --- |
| `V`, `VE` | `High` | `true` |
| `A`, `AE`, `AH`, `AO`, `AR`, `A99` | `Moderate` | `true` |
| `D` (undetermined study) | `Unknown` | `null` |
| No matching polygon found | `Unknown` | `null` |
| Anything else | `Low` | `false` |

**Building height.** `building_height_m` uses the OSM `height` tag if
present; else `building:levels * 3 + 1`; else a flat default of `5` meters.
This is a display estimate, not a surveyed height.

**Temporal characteristics.** Both OSM and FEMA data are undated snapshots at
whatever moment the fetch script ran; the committed file does not record a
fetch timestamp. OpenStreetMap is continuously edited; FEMA republishes NFHL
data periodically as flood studies update. Treat this file as a point-in-time
sample, not a live feed.

**Limitations.**
- `risk_level` is a documented zone-based proxy, **not** a computed hydraulic
  or storm-surge model and **not** an official flood determination (verbatim
  from the build script's `RISK_CONFIDENCE_NOTE`, which is also embedded in
  every feature's `confidence_note` property).
- The point-in-polygon test checks only each FEMA polygon's exterior ring;
  holes are ignored — an accepted simplification for this dataset.
- OSM building coverage is incomplete; a missing building does not mean no
  structure exists at that location.
- Sequential `GI-####`/`PF-####` IDs are **not stable** — see the
  regeneration risk below.

**Provenance notes.** Each feature carries its real, stable OSM identifier in
`osm_way_id`, separate from the project-assigned sequential `property_id`.

**Status.** Generated, committed.

**Regenerate.**
```
npm run fetch:urban-resilience-data
npm run build:urban-resilience-data
npm run validate:urban-resilience-data
```
⚠️ **Regenerating this file risks breaking a downstream pipeline.** If OSM
element ordering shifts between fetches, `GI-####`/`PF-####` IDs will be
reassigned to different buildings. `scripts/lib/urbanElevationSample.mjs`
(consumed by dataset #6 below) pins 12 exact `{propertyId, osmWayId}` pairs
and will throw `"OSM identity changed from the reviewed source"` if those no
longer match. See [`docs/data/regeneration.md`](regeneration.md) (#107) for
the full migration procedure before regenerating this file for real.

---

## 2. Grand Isle & Port Fourchon Flood Zones

**Purpose.** Core layer rendering the raw FEMA flood-hazard polygons as a
ground-draped overlay beneath the property layer.

**Study area.** Same two bounding boxes as dataset #1.

**Authoritative organization.** FEMA (National Flood Hazard Layer).

**Acquisition mechanism.** Same FEMA NFHL layer 28 endpoint and query as
dataset #1 (both datasets are built from the same fetched FEMA response).

**Original format.** FEMA GeoJSON, cached as `grand-isle-flood-zones.json`
and `port-fourchon-flood-zones.json`.

**Processed format.** GeoJSON `FeatureCollection` of `Polygon`/`MultiPolygon`
features with normalized zone attributes.

**Script / npm command.** Built by the same
`npm run build:urban-resilience-data` step as dataset #1 (one script produces
both files); no separate fetch or validate command.

**Resulting file.** `public/data/urban-resilience/grand_isle_port_fourchon_flood_zones.geojson`
(103,407 bytes).

**Feature count.** 7 total — **all 7 from Grand Isle**; the Port Fourchon
query returned **zero** polygons. This single fact is the root cause of every
Port Fourchon property and facility in this register classifying `Unknown`
rather than a computed risk tier.

**Confirmed zone codes** (all 7 features): six `VE` and one `V`, each with a
`static_bfe_ft` value of 11–16 feet, except one `V`-zone feature whose
`static_bfe_ft` is `-9999` — FEMA's documented null-value sentinel, not a real
elevation.

**Temporal characteristics.** As-published FEMA NFHL at fetch time; no
independent timestamp recorded in the committed file.

**Limitations.** NFHL polygons are mapped hazard information, not current
floodwater, a forecast, or a project-generated hydraulic model.
`static_bfe_ft` is not used to drive extrusion height in the Cesium viewer
because it is documented as unreliable for this purpose (see
[`docs/data/urban-resilience-layers.md`](urban-resilience-layers.md), #106).
This is also the one dataset with **no domain-side parser** in `src/` — the
Cesium styler reads the raw `Record<string, unknown>` directly rather than
through a typed `UrbanFloodZoneAttributes` parser (see #106/#115 for the
tracked follow-up).

**Status.** Generated, committed.

**Regenerate.** Same command as dataset #1 — both files are produced
together and cannot be regenerated independently.

---

## 3. Grand Isle & Port Fourchon Response

**Purpose.** Two illustrative LA-1 evacuation-corridor route lines and three
regional staging-reference points, shown in the response-context section of
the urban panel.

**Study area.** A wider LA-1 corridor bounding box,
`[29.05, -90.4, 29.6, -89.95]` — extends north past Golden Meadow, Galliano,
and Larose so the route has real road geometry to snap to.

**Authoritative organization.** OpenStreetMap (road centerline geometry). The
six named-place anchor coordinates below are **not** sourced externally —
they were chosen by the researcher as approximate town centers, hardcoded
directly in `buildUrbanResiliencePropertyData.mjs`:

| Anchor | Lat, Lon |
| --- | --- |
| Grand Isle | `29.2372, -89.9873` |
| Port Fourchon | `29.1232, -90.1892` |
| Leeville Junction | `29.2497, -90.2036` |
| Golden Meadow | `29.3808, -90.2662` |
| Galliano | `29.4427, -90.2988` |
| Larose | `29.5661, -90.3757` |

**Acquisition mechanism.** Overpass query
`way["highway"]["ref"~"LA 1"](<corridor bbox>);out body geom;`, cached as
`la1-route.json`.

**Original format.** Overpass JSON.

**Processed format.** 2 `LineString` route features + 3 `Point`
staging-reference features.

**Script / npm command.** Built by the same `npm run build:urban-resilience-data`
step as datasets #1 and #2.

**Resulting file.** `public/data/urban-resilience/grand_isle_port_fourchon_response.geojson`
(2,305 bytes), 5 features.

**Route construction.** Each of the 6 named anchors is snapped to the
*nearest* actual OSM road point returned by the corridor query, using flat
Euclidean (degree-space, non-geodesic) distance — a real-geometry-anchored
simplification, not turn-by-turn routing.

**Temporal characteristics.** n/a — illustrative, not time-varying.

**Limitations.** Both routes' `status: "at-risk"` is a **hardcoded,
hand-assigned value**, not derived from any data source. Verbatim from the
build script: *"Status is an illustrative research judgment based on this
corridor's well-documented storm-surge/overtopping history, not live
road-condition data."* The three staging-reference points are explicitly
labeled *"Not an official shelter or emergency destination."*

**Status.** Generated, committed.

**Regenerate.** Same command as dataset #1.

---

## 4. Experimental: LA-1/FEMA Intersections

**Purpose.** The "Experimental LA-1/FEMA inspection" overlay — every original
(unmodified) OSM LA-1 way segment, each carrying a conservative FEMA-hazard
relationship, for investigating which segments have mapped flood exposure.
This is the dataset behind the live research question tracked in Issue #67.

**Study area.** Two **narrower** windows than the response corridor
(dataset #3), reused from the base building fetch:
- Grand Isle: `[29.225, -89.99, 29.245, -89.955]`
- Port Fourchon: `[29.09, -90.22, 29.17, -90.14]`

A code comment in the build script explicitly flags this: *"Keep these
research windows aligned with fetchUrbanResilienceSourceData.mjs."*

**Authoritative organizations.** OpenStreetMap (way geometry) + FEMA NFHL
layer 28 (hazard relationship).

**Acquisition mechanism.** **Reuses the base fetch's cached `la1-route.json`
and FEMA responses — this dataset has no fetch script of its own.** There is
deliberately no `fetch:urban-resilience-la1-fema-experiment` npm script;
`npm run fetch:urban-resilience-data` must be run first.

**Original format.** Cached Overpass JSON + FEMA GeoJSON, shared with
dataset #1.

**Processed format.** 48 `LineString` features, one per original OSM way (no
snapping or simplification, unlike dataset #3).

**Script / npm command.**
```
npm run build:urban-resilience-la1-fema-experiment     # scripts/buildUrbanResilienceLa1FemaExperiment.mjs
npm run validate:urban-resilience-la1-fema-experiment  # scripts/validateUrbanResilienceLa1FemaExperiment.mjs
```

**Resulting file.** `public/data/urban-resilience/experiments/la1_fema_intersections.geojson`
(153,129 bytes), 48 features.

**Confirmed coverage-status breakdown** (counted directly from the committed
file): `not-queried`: 36, `partial`: 8, `unavailable`: 4, **`available`: 0**.
Of the 8 `partial` segments, all 8 intersect a mapped FEMA hazard polygon.

**Coverage-status meaning** (from the build script):
- `not-queried` — the way lies entirely outside both FEMA query windows.
- `unavailable` — the way's window returned zero FEMA features (this is the
  Port Fourchon window; see dataset #2).
- `partial` — part of the way falls within a window with FEMA features, but
  the complete way is not contained within that window.
- `available` — the complete way is inside a query window with FEMA
  features (none currently qualify).

**Temporal characteristics.** Shares the base fetch's timestamp; no
independent fetch.

**Limitations.** **No segment in this dataset is currently classified fully
`available`** — the narrower study windows mean full-coverage classification
is not yet achievable for the corridor. This is precisely the open research
question in Issue #67 (*"When can an LA-1 segment be classified as evaluated
with no mapped FEMA intersection, rather than Unknown?"*), which remains
open and unmilestoned as live research. The validator's `PROHIBITED_FIELDS`
blocks any decision-support field (`status`, `risk_level`, `flooded`,
`closed`, `safe`, `passable`, `evacuation_status`, `recommended_action`) —
this dataset is relationship-only, never a road-safety judgment.

**Status.** Generated, committed.

**Regenerate.**
```
npm run fetch:urban-resilience-data   # prerequisite; no dedicated fetch step exists for this dataset
npm run build:urban-resilience-la1-fema-experiment
npm run validate:urban-resilience-la1-fema-experiment
```

---

## 5. Experimental: Community/Public-Safety Facilities

**Purpose.** The "Community/public-safety facilities" overlay — real
OSM-derived facility records near Grand Isle, each carrying a conservative
FEMA-relationship classification.

**Study area.**
- Grand Isle facility window: `[29.225, -90.005, 29.245, -89.955]` — **note
  the west edge is `-90.005`, wider than dataset #1's building-fetch window
  of `-89.99`.** This divergence is deliberate (the comment says it "extends
  only its western edge so it includes mapped municipal-service facilities")
  but is one of three inconsistent Grand Isle extents in this codebase — see
  [`docs/data/regeneration.md`](regeneration.md) (#107) and Issue #109
  (HO-12) for the full consolidation plan.
- Port Fourchon: `[29.09, -90.22, 29.17, -90.14]` (same as dataset #1).

**Authoritative organizations.** OpenStreetMap (facility tags/geometry) +
FEMA NFHL layer 28.

**Acquisition mechanism.** Overpass query for amenity/emergency/healthcare/
government tags:
```
nwr["amenity"~"^(fire_station|police|hospital|clinic|pharmacy|fuel|doctors|community_centre|townhall|school)$"]
nwr["emergency"~"^(ambulance_station|coast_guard|lifeguard_base)$"]
nwr["healthcare"]
nwr["office"="government"]
```
**Only 4 of these ~14 queried tag values are actually classified** by the
build script (`fire_station`, `police`, `townhall`, `school`); every other
tag value, if returned, currently makes the build throw a hard error — see
the known issue below.

**Original format.** Overpass JSON (`grand-isle-facilities.json`,
`port-fourchon-facilities.json`) + FEMA GeoJSON (`grand-isle-facility-flood-zones.json`,
`port-fourchon-facility-flood-zones.json`).

**Processed format.** GeoJSON `Point`/`Polygon` features.

**Script / npm command.**
```
npm run fetch:urban-resilience-facility-data     # scripts/fetchUrbanResilienceFacilitySourceData.mjs
npm run build:urban-resilience-facility-data     # scripts/buildUrbanResilienceFacilityExperiment.mjs
npm run validate:urban-resilience-facility-data  # scripts/validateUrbanResilienceFacilityExperiment.mjs
```

**Resulting file.** `public/data/urban-resilience/experiments/community_public_safety_facilities.geojson`
(10,797 bytes), 4 features.

**Confirmed facility list** (all 4, all Grand Isle, all `fema_coverage_status: "available"`):

| `facility_id` | Name | Category |
| --- | --- | --- |
| `osm-node-367132153` | Grand Isle Fire Department | public-safety |
| `osm-node-367133144` | Grand Isle Police Department | public-safety |
| `osm-way-924797034` | Town of Grand Isle | community |
| `osm-way-924801527` | Grand Isle High School | community |

Port Fourchon returned **0** matching OSM facility records.

**Temporal characteristics.** Fetch-time snapshot; no independent timestamp
recorded beyond the cache.

**Limitations.** The committed `metadata.limitation` field states, verbatim:
*"Port Fourchon returned no matching OSM facility records. Absence from
OpenStreetMap does not prove that facilities are absent."* The validator's
`PROHIBITED_FIELDS` blocks `operational_status`, `availability`,
`vulnerability_score`, `criticality_score`, `safety_status`.

**Resolved (Issue #108, HO-11).** The fetch queries far more tag values than
the build classifies. A new OSM element inside either bbox with an
unclassified but expected tag (e.g. `amenity=fuel`) is now **skipped, not
fatal** — recorded as `skippedUnclassifiedCount` and `skippedTypes` in the
output metadata (both per-area and aggregate) and printed to the console, so
coverage stays auditable rather than silently understated. Genuinely
unsupported or malformed geometry (e.g. a way with too few coordinates)
remains fatal, since that is a real data-quality problem, not expected
OSM-diversity. Both behaviors were verified against a scratch fixture — an
unclassified `fuel` node skipped cleanly with the correct metadata, and a
classified element with empty geometry still threw with a clear message
naming the specific element — never against the real committed data.

**Status.** Generated, committed.

**Regenerate.**
```
npm run fetch:urban-resilience-facility-data
npm run build:urban-resilience-facility-data
npm run validate:urban-resilience-facility-data
```
Independent of datasets #1–#4, **except** that dataset #6 below depends on
this file's committed output.

---

## 6. Experimental: Grand Isle Ground Elevation Sample

**Purpose.** Powers the "Ground-elevation experiment" detail shown in the
selected-property and selected-facility inspectors — a small, fixed USGS 3DEP
elevation sample.

**Study area.** Grand Isle only — `lon -90.005..-89.95, lat 29.22..29.25`
(per the validator's asserted window). **No Port Fourchon sample exists.**

**Authoritative organization.** USGS (3D Elevation Program).

**Acquisition mechanism.** USGS 3DEP Elevation Point Query Service,
`https://epqs.nationalmap.gov/v1/json`, queried per-point with
`wkid=4326`, `units=Meters`, `includeDate=true`.

**⚠️ Chicken-and-egg dependency.** This dataset's fetch script reads the
*already-committed* output of datasets #1 and #5 to know which representative
points to query — it is not an independent from-scratch fetch. A true
from-scratch rebuild of this repository's data must run strictly in order:
dataset #1 fetch → #1 build → #5 fetch → #5 build → #6 fetch → #6 build. See
[`docs/data/regeneration.md`](regeneration.md) (#107) for the full graph.

**Original format.** JSON cache with one EPQS response per point
(`grand-isle-ground-elevation-epqs.json`).

**Processed format.** 16 `Point` features.

**Script / npm command.**
```
npm run fetch:urban-resilience-elevation-sample     # scripts/fetchUrbanResilienceElevationSample.mjs
npm run build:urban-resilience-elevation-sample     # scripts/buildUrbanResilienceElevationSample.mjs
npm run validate:urban-resilience-elevation-sample  # scripts/validateUrbanResilienceElevationSample.mjs
```

**Resulting file.** `public/data/urban-resilience/experiments/grand_isle_ground_elevation_sample.geojson`
(41,155 bytes), 16 features — 12 buildings + 4 facilities, all 16 currently
`available`.

**Sample identity.** Pinned to 12 exact `{propertyId, osmWayId}` pairs and
all 4 facility records, hardcoded in `scripts/lib/urbanElevationSample.mjs`
(e.g. `{ propertyId: "GI-0064", osmWayId: 1066811684 }`) — see the known
issue below.

**Temporal characteristics.** `metadata.generatedAt` mirrors the cache's
`retrievalCompletedAt` timestamp — currently `2026-08-26T20:38:16.757Z`. This
value changes on every re-fetch even when nothing substantive changes.

**Limitations,** verbatim from the build script's interpretation note:
*"Estimated/interpolated ground elevation from the USGS 3DEP elevation
service at one representative coordinate. It is not flood depth, building
height, floor or finished-floor elevation, structural elevation, FEMA Base
Flood Elevation, vulnerability, safety, or current/future inundation."*
Additional documented caveats:
- **Horizontal reference:** longitude/latitude submitted as WKID 4326; EPQS
  documents point inputs as NAD83, and no additional local datum
  transformation was applied.
- **Vertical reference:** EPQS does not return a vertical datum per point.
  USGS states CONUS 3DEP DEMs are typically NAVD88, but this is not asserted
  per-point here without work-unit metadata verification.
- **Accuracy:** USGS reports an overall service RMSE of 0.53 m; local
  accuracy varies with source data.

**Known issue.** If a regeneration of dataset #1 or #5 renumbers or
re-identifies OSM elements, this pipeline throws
`"OSM identity changed from the reviewed source."` Recovering from this
requires manually reviewing the diff and re-pinning
`scripts/lib/urbanElevationSample.mjs` as a deliberate, reviewed research
decision — never a silent edit. Full migration procedure: Issue #107 (HO-10).

**Status.** Generated, committed.

**Regenerate.** Requires datasets #1 and #5 to already be built and
committed, then:
```
npm run fetch:urban-resilience-elevation-sample
npm run build:urban-resilience-elevation-sample
npm run validate:urban-resilience-elevation-sample
```

---

## 7. Fictional Disaster-Resilience Properties

**Purpose.** Powers the `disaster-demo` mode — a fictional Baton Rouge-area
neighborhood used to demonstrate the property-dashboard concept with a mock
flood-depth-based classification, ahead of the real Grand Isle/Port Fourchon
data existing.

**Study area.** Fictional; the scenario's viewer center is near Baton Rouge,
LA (`~30.45162, -91.15471` per `mockDisasterResilienceScenario.ts`). **This is
not Grand Isle, Port Fourchon, or LA-1** — do not conflate it with datasets
#1–#6.

**Authoritative organization.** None. Entirely hand-authored fictional
content; every property, event, and label is required (by validator) to carry
`/\bDemo\b/i`, `/\bFictional\b/i`, or `/\b(?:fictional|mock|synthetic)\b/i`
language.

**Acquisition mechanism.** None — hand-authored directly, no fetch step.

**Original / processed format.** GeoJSON, written directly (no intermediate
cache).

**Script / npm command.** No fetch or build script exists for this file.
Only a validator:
```
npm run validate:disaster-data  # scripts/validateDisasterResilienceData.mjs
```
which enforces the required fictional/mock/synthetic wording via regex on
**both** the committed GeoJSON **and** the TypeScript mock scenario source
(`src/domain/disasterResilience/mockDisasterResilienceScenario.ts`), and
requires 5–8 features.

**Resulting file.** `public/examples/disaster_resilience_properties.geojson`
(6,805 bytes), 6 features (4 inside + 2 outside the mock flood boundary, per
the validator's own summary output).

**Temporal characteristics.** n/a — static fictional content.

**Limitations.** Entirely fictional. `estimated_flood_depth_ft` values are
synthetic, explicitly *"not a measured or predicted flood depth"* (verbatim
`confidence_note` on each feature). Must never be presented alongside the
real Grand Isle/Port Fourchon data as if from the same source.

**Status.** Hand-authored, committed (not machine-generated).

**Regenerate / update.** No regeneration path exists — edit the file
directly, ensuring `npm run validate:disaster-data` continues to pass (it
rejects any URL in the file and requires the fictional/mock/synthetic
language described above).

---

## 8. Project Configuration (`existing-demo` / `workflow` default)

**Purpose.** Drives the `existing-demo` mode ("Decision Loop Demo") and the
default `workflow` mode's initial camera — a facility scene with 3 radiation
measurement points, 1 GLB model asset, and 3 model-linked annotations. This
predates the Sea Grant urban-resilience work; it is the repository's original
legacy proof-of-concept scene.

**Study area. ⚠️ Not Louisiana.** Coordinates are in Pennsylvania
(`lat 40.03883, lon -75.59777`). This has no relationship to Grand Isle, Port
Fourchon, or the Sea Grant research direction.

**Authoritative organization.** None. Entirely hand-authored synthetic
radiation dose-rate/contamination scenario; schema documented in
[`docs/project-config-schema.md`](../project-config-schema.md).

**Acquisition mechanism.** None — hand-authored directly.

**Format.** JSON, validated at runtime by `src/config/validateProjectConfig.ts`.

**Resulting file.** `public/project_config.json` (3,909 bytes).

**Temporal characteristics.** n/a — static.

**Limitations / flag for the maintainer.** Carries a visibly stale identity —
`"projectId": "mock-dnd-facility-I"`, `"projectName": "My Updated Test
Facility"` — leftover test-edit naming that was never cleaned up. Nothing
validates that its coordinates describe a sensible location for this
project, and they currently don't. **Open question for Vijay** (see the
September 2026 handoff plan, §H): is `existing-demo` still research-relevant,
or should this file and mode be labeled DEPRECATED?

**Status.** Hand-authored, committed.

**Regenerate / update.** No regeneration path — edit directly. See
[`docs/project-config-schema.md`](../project-config-schema.md) for the field
reference and `docs/examples/project_config.future.example.json` for a
forward-looking schema draft.

---

## 9. Cesium Milk Truck (GLB model asset)

**Purpose.** The only committed 3D model asset in the repository. Used as
(a) the mock reconstruction workflow's placeholder output
(`MockColmapReconstructionProvider`) and (b) the `existing-demo`/`workflow`
project config's model asset, with 3 inspection annotations attached.

**Study area.** n/a — a generic vehicle model, not tied to any real place.

**Authoritative organization.** Khronos Group (glTF Sample Assets
collection); originally attributed to Cesium.

**Acquisition mechanism.** Vendored, one-time download from
[github.com/KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMilkTruck),
licensed CC-BY-4.0 (© 2017 Cesium).

**Format.** Binary glTF (`.glb`).

**Resulting file.** `public/models/CesiumMilkTruck.glb` (447,200 bytes) — the
only file in `public/models/` force-included past the directory's
`*.glb`/`*.ply` gitignore rule via an explicit
`!public/models/CesiumMilkTruck.glb` exception.

**Temporal characteristics.** n/a — static vendored asset.

**Limitations.** A generic testing asset, explicitly *"not a reconstruction
generated by this project"* (per `THIRD_PARTY_NOTICES.md`). May carry Cesium
name or logo elements subject to their own trademark treatment.

**Status.** External, vendored, committed.

**Regenerate / update.** n/a — replace only if a different sample or
reconstruction-output asset is needed; any replacement requires its own
license and attribution entry in `THIRD_PARTY_NOTICES.md`.

---

## 10. `public/tilesets/` (orphaned placeholder)

**Purpose.** None currently. An empty directory holding only a `.gitkeep`
placeholder file. No script writes to it and no application code reads from
it.

**Status.** **Planned, not implemented.** `src/domain/modelAssetViewerSupport.ts`
documents that *"3D Tiles is the planned Cesium path... but tileset rendering
is not implemented in this POC."*

**Regenerate / update.** n/a until a 3D Tiles pipeline exists — see the
continuation roadmap (Issue #120, HO-23) for whether and when this becomes
active work.

---

## Known cross-cutting issues affecting multiple datasets

- **Three inconsistent Grand Isle bounding-box extents** across the fetch,
  build, and validate scripts (datasets #1/#3/#4 use west edge `-89.99`;
  dataset #5 and its downstream elevation sample use `-90.005`; the base
  data validator uses a looser superset). Tracked for consolidation into a
  single source of truth, **preserving every current value exactly**, in
  Issue #109 (HO-12).
- **Circular / sequential regeneration dependency** between datasets #1, #5,
  and #6, and the pinned-identity risk in dataset #6 if #1 or #5 is
  regenerated. Full graph and migration procedure: Issue #107 (HO-10).
- **The facility build's fetch/classify mismatch** (dataset #5) — resolved in
  Issue #108 (HO-11): unclassified amenity types are now skipped and counted,
  not fatal.
- **No machine-readable checksum manifest yet exists** for any dataset in
  this register. That is tracked separately as Issue #87 (BONUS-008) and is
  out of scope here.

## See also

- [`docs/architecture.md`](../architecture.md) — overall application
  architecture and the public-data pipeline diagram.
- [`docs/decisions/006-urban-resilience-real-data-guardrails.md`](../decisions/006-urban-resilience-real-data-guardrails.md) —
  the guardrails these datasets are built under, and the reasoning behind
  the risk-classification proxy.
- [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md) — legal
  attribution for every third-party source and asset listed here.
- [`README.md`](../../README.md) §"Public-data processing" and §"Data
  sources and interpretation boundaries" — the public-facing summary of
  this same material.
