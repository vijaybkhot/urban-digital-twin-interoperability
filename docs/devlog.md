# Devlog

## 2026-09-09 to 2026-09-10 — September research-handoff execution (H1 + H2, in progress)

Prof. Lee and the September 3 advisor meeting set the remainder of September
aside for handoff and research readiness rather than feature work, ahead of
Vijay's transition off the project after September 2026. A three-milestone
issue backlog (H1/H2/H3, #99-#121, plus #127/#128 added mid-execution) was
filed and is being executed issue-by-issue; see the full plan and per-PR
detail in the handoff execution plan referenced from `docs/handoff/`.

**H1 — Repository truth and inventory (complete, 6/6 issues):**

- Hardened `.env`/`.env.*` ignore rules and documented credential rotation
  for the Cesium ion and ArcGIS keys (#122).
- Corrected the local git remote and swept every absolute GitHub URL to the
  current repository name, `urban-digital-twin-interoperability` (#123).
- Reconciled stale Node-version, CI, release-checklist, and ROADMAP facts
  against actual repository state (#124).
- Created `docs/data/data-register.md`, the first document to enumerate
  every committed dataset (6 generated, 3 hand-authored, 1 orphan) with its
  source, generating script, feature count, and limitations in one place
  (#125).
- Repaired the repository-structure map in `README.md` (added `src/config/`,
  `src/styles/`, `src/theme/`, `scripts/lib/`, `tools/`,
  `public/tilesets/`) and documented the Blender-dependent PLY-conversion
  tool (#135).
- Triaged the open-issue backlog: populated the `OSR 3` milestone with 10
  bonus tickets, closed the finished `OSR 2` milestone, closed 5 stale
  July modular-housing issues as superseded by the current urban-resilience
  direction (salvaging #34's render-churn finding into #120 first), and
  repaired a dangling `docs/open-source-release-ticket-plan.md` reference
  across 9 issue bodies (#89, #104).

**H2 — Handoff documentation and reproducibility (in progress):**

- Created `docs/data/urban-resilience-layers.md`, tracing all 7 rendered
  layers from their data URL through the adapter to their Cesium styler,
  and documenting the FEMA flood-zone layer's missing domain parser as a
  known gap (#126).
- Created `docs/data/regeneration.md`, documenting the real (circular)
  dependency order between the four data pipelines and the pinned-manifest
  migration procedure for when upstream OSM identities change (#132).
- Hardened `buildUrbanResilienceFacilityExperiment.mjs` to skip unclassified
  OSM amenity types (recording them in metadata) instead of aborting the
  whole build, while keeping genuinely malformed geometry fatal (#139).
- Authored `docs/handoff/onboarding.md`, the front-door document for a
  successor: a verified 15-minute clone-to-running-app path, a
  classification of all 5 application modes, and a reading order into the
  rest of the documentation (#136).
- Consolidated the three previously-inconsistent Grand Isle bounding-box
  definitions (plus Port Fourchon, the LA-1 corridor, and two validator
  windows) into one file, `scripts/lib/studyAreas.mjs`, imported by every
  fetch/build/validate script that used to hardcode its own copy (#141).
- Authored `docs/handoff/troubleshooting.md`, covering 9 known setup and
  pipeline failure modes with verified symptom/cause/fix entries (#142).
- HO-14 (extension guide) remains blocked on the H3 layer registry (#115);
  this entry will be extended as H2 finishes.

**Unplanned fixes discovered along the way:**

- Corrected the LA-1/FEMA experimental layer's original characterization:
  its interaction with the response-route layer is intentional design, not
  a defect, per Vijay's correction while reviewing #126 — the tracking
  issue (#116) and this devlog were both updated to reflect that.
- Made the LA-1/FEMA experiment's "overlap found" color visually prominent
  (reused the existing response-route purple instead of a muted
  blue-gray) so the intentional design reads as deliberate (#130), and
  fixed two duplicate copies of the old color left behind in a CSS rule
  and a stale legend label (#131).
- Added a small pulsing blue marker to the ~12 buildings with a USGS
  ground-elevation sample, since they were otherwise visually
  indistinguishable from the other ~766 buildings (#134, pulse animation
  #138). A real bug was later found and fixed: the marker relied on a
  React effect race that could run before its data had loaded, so it
  sometimes never appeared at all; fixed by mirroring the adapter's
  existing "reapply visual state once entities load" pattern, and
  separately made the marker's on-screen size scale correctly with camera
  distance (#140).

## 2026-09-01

- Documented the public Vercel-hosted research demo URL and clarified that
  the Cesium ion Vite token is browser-visible by design and should be
  scoped to minimum public/read permissions with URL restrictions rather
  than treated as a secret (#98).

## 2026-08-28 to 2026-08-31 — Open-source release preparation

- Rewrote the README as an accurate public landing page distinguishing
  implemented, mock, experimental, external, and planned capabilities
  across all five application modes and the isolated ArcGIS experiment
  (#90, #95).
- Added a centralized third-party notices and data-provenance document
  covering OSM/Overpass, FEMA NFHL, USGS 3DEP, generated research
  artifacts, and the Cesium Milk Truck CC BY 4.0 attribution (#91).
- Added the complete Apache License 2.0, a neutral project `NOTICE`, and
  consistent `Apache-2.0` declarations in package metadata (#92).
- Added contributor guidance, Contributor Covenant 2.1, and a security
  policy using GitHub Private Vulnerability Reporting (#93).
- Added a single `npm run validate` command covering all committed-data
  validators and the production build, plus least-privilege GitHub Actions
  CI on pull requests and pushes to `main` (#94).
- Completed a minimum open-source release audit recording repository,
  licensing, secret-scan, asset, validation, and public-claim checks, and
  a manual five-mode-plus-ArcGIS walkthrough (#96).
- Renamed the project to "Urban Digital Twin Interoperability Research
  Prototype," aligned the GitHub repository, package, and documentation
  identity, added validated CFF 1.2 citation metadata for Vijay Khot and
  Yong-Cheol Lee, and established version `0.1.0` (#97).
- Did **not** add automated unit tests, Dependabot/CodeQL, an SBOM, or an
  accessibility audit in this pass — tracked separately as bonus follow-up
  issues.

## 2026-08-27

- Added a USGS 3D Elevation Program ground-elevation sample experiment for
  12 existing Grand Isle buildings and 4 existing community/public-safety
  facilities, using representative query coordinates that do not assume a
  polygon's centroid falls inside its own footprint (#71).
- Preserved the existing property, facility, and risk-classification data
  untouched; this experiment only adds elevation readings alongside it.

## 2026-08-17 to 2026-08-18 — Pivot to real urban-resilience data

- Added the `urban-resilience-demo` application mode: real OpenStreetMap
  building footprints and real FEMA National Flood Hazard Layer flood-zone
  data for Grand Isle and Port Fourchon, LA, generated via new offline
  `fetch`/`build`/`validate` scripts, additive alongside the existing
  facility/modular/disaster demos (#65).
- Added an experimental layer evaluating how the original OpenStreetMap LA
  Highway 1 way geometry relates spatially to FEMA flood-hazard polygons,
  as a research follow-up to the base urban-resilience layer (#66, merged
  to `main` as #68).
- Added an isolated ArcGIS SceneView experiment at
  `/experiments/arcgis-urban-resilience/`, consuming the same locally
  generated OSM/FEMA GeoJSON as the Cesium demo, to test viewer-independent
  portability of the scenario data (#69).
- Extended the OSM/FEMA processing approach to community and
  public-safety facility records, adding a separate (deliberately wider)
  Grand Isle facility query window and preserving four reviewed OSM
  facility identities (#70).
- Did **not** add a backend, a hazard prediction model, or any new risk
  score in this pass; FEMA zone codes remain a documented zone-based proxy
  classification, not a computed risk determination.

## 2026-08-03 to 2026-08-06 — Disaster Resilience Demo (fictional, mock)

- Defined an independent typed contract for the Property-Specific Disaster
  Resilience Module (property, scenario, flood, shelter, route, event,
  selection, and camera types), and added six fictional property polygons
  with a typed mock scenario covering a flood boundary, shelter, response
  route, and five digital-twin events (#53, #54).
- Added an isolated fourth application mode with its own Cesium viewer
  configuration, an asynchronous disaster-scenario data-source lifecycle,
  and risk-styled extruded property rendering (Low/Moderate/High mapped to
  green/amber/red, with a neutral fallback) (#55, #56, #57).
- Added a mock HEC-RAS-style flood-depth layer using a documented 3x
  illustrative vertical exaggeration (#58).
- Added click-to-select property state, a resident-facing selected-property
  dashboard, and camera presets for overall/flood-layer/selected-property
  views (#59, #60, #61).
- Added one fictional shelter marker and one mock response route
  (displayed with an "At Risk" status), plus a deterministic multi-twin
  event feed and map legend (#62, #63).
- Added optional Cesium OSM Buildings context, gated on a configured
  Cesium ion token, preserving a complete local-only demo when no token is
  present (#64).
- This mode is fictional/simulated throughout — a fabricated Baton Rouge
  scenario, not real hazard data — and is labeled as such in the UI; it
  predates and is unrelated to the real-data urban-resilience pivot below.

## 2026-07-11

- Added screenshot-ready modular camera views and illustrative Cesium footprint
  polygons for proposal visuals.
- Added low production-cell and installation-pad slabs, plus modest extruded
  module boxes, while keeping factory/site footprints as flat proposal geometry.
- Added a cross-mode modular demo regression checklist covering workflow,
  image intake, reconstruction, existing controlled-facility demo, model
  annotations, modular interactions, and mode-switch state isolation.
- Added local demo modular status actions for selected module units.
- Updated the modular event feed to show demo Factory Twin, Logistics Twin,
  Site Twin, and AI Agent coordination after status actions.
- Kept modular status actions local-only with no backend, real AI, robotics,
  IoT, live telemetry, or optimization integration.
- Added a read-only modular digital twin detail panel for selected Cesium
  factory, site, route, module, station, and installation-zone entities.
- Kept modular entity details demo-only; status update controls and causal
  event-feed actions remain deferred to the next modular demo pass.
- Rendered the modular housing demo scenario in Cesium with native factory,
  site, route, module, production station, and installation zone entities.
- Added a modular housing proposal-demo mode foundation with typed demo
  scenario data for factory, logistics, site, modules, events, and demo
  recommendations.
- Added modular housing demo architecture guardrails before implementation.
- Documented that the first modular demo should be a separate app mode with
  typed demo scenario data, modular-specific Cesium entities, and explicit
  demo-only AI/robotics/logistics boundaries.

## 2026-07-08

- Added POC 4H browser-only GPS/EXIF readiness checks to image intake.
- Added GPS metadata status for usable images: present, missing, or unknown.
- Added GPS coverage counts to the image intake summary and mock assistant message.
- Added an advisory warning when average image GPS appears far from the selected project site.
- Kept GPS advisory only; missing GPS does not block mock reconstruction.
- No backend upload, image storage, LLM review, COLMAP execution, or real reconstruction pre-check was added.

## 2026-07-02

- Added POC 4D local PLY-to-GLB conversion spike documentation.
- Added a Blender command-line script for converting local PLY samples to GLB.
- Kept raw PLY samples and generated local GLB files ignored by default.
- Clarified that 3D Tiles remains the likely future path for large point clouds.

## 2026-07-01

- Added POC 4C PLY output awareness without adding raw PLY rendering.
- Added a viewer-support helper that distinguishes rendered GLB assets from PLY/point-cloud assets that require conversion.
- Added a PLY reconstruction output example and local sample test guidance.
- Ignored local `public/models/*.ply` files so downloaded test point clouds are not committed accidentally.
- Added POC 4B documentation for Ehsan's current reconstruction pipeline.
- Recorded JPG/JPEG image input, GPS metadata importance, PLY point cloud output, and COLMAP feature matching as the key feasibility signal.
- Clarified that this pass does not add backend upload, PLY rendering, EXIF/GPS parsing, or real reconstruction execution.

## 2026-06-24

- Added POC 4E model-linked sensors for existing demo annotations.
- Linked milk-truck annotation points to existing measurement points.
- Reused current measurement editing, belief recalculation, manual override, recommendation, and audit log behavior for linked model annotations.
- Highlighted the selected measurement point or model annotation in the Cesium scene.
- Added linked sensor readings to model annotation labels.
- Kept this version limited to existing measurement points; no generic sensor-type engine was added.
- Added POC 4A reconstruction handoff contract documentation.
- Added example reconstruction request, status, output, and error JSON payloads.
- Documented questions for Ehsan about input format, output format, scale, orientation, location, and job status.
- Clarified that future LLM use should be a screening/explanation layer, not part of this POC.
- No backend, upload, real COLMAP process, cloud storage, or LLM integration was added.

## 2026-06-18

- Added browser-only project setup with typed or globe-picked site coordinates.
- Added an in-memory draft project config with a temporary site marker.
- Added a mock COLMAP provider with queued, running, and completed job states.
- Added readiness-gated reconstruction and model display after completion.
- Preserved the full static config demo behind `Open existing demo`.
- No backend, upload, database, real COLMAP process, or LLM was added.
- Added model-local inspection annotations using standardized ENU meter coordinates.
- Added three clickable milk-truck inspection points for roof, front, and side.
- Added read-only annotation details and annotation selection audit logging.
- Preserved camera position during selection and clarified panel movement/selection controls.
- Enabled normal depth testing so model annotations behave as anchored 3D points.
- Documented the coordinate normalization expected from future reconstruction providers.

## 2026-05-14

- Added POC 3A GLB model asset rendering from `project_config.json`.
- Added a Cesium Milk Truck sample model as a mock reconstruction placeholder.
- Documented local GLB model asset testing and current limits.
- Added future project config example.
- Documented AI intake assistant scope.
- Documented proposed handshake with reconstruction pipeline.
- Added optional future config types for image intake, agent assessment, and model assets.
- No real backend, LLM, upload, or reconstruction implemented yet.
- Added browser-only image intake panel.
- Added image metadata inspection for count, size, dimensions, and resolution.
- Added rule-based mock reconstruction readiness assessment.
- Added concise local run/test notes for POC 1 and POC 2A.
- No backend, LLM, cloud upload, EXIF extraction, or reconstruction pipeline implemented yet.

## 2026-04-30

- Migrated the frontend from plain Vite JavaScript to React + TypeScript.
- Moved hardcoded project data into `public/project_config.json`.
- Added ports for agent providers, config repositories, reconstruction providers, and viewer adapters.
- Moved belief calculation, recommendations, audit log creation, and project normalization into domain modules.
- Isolated Cesium code in `src/cesium` and `src/adapters/viewer`.
- Preserved the original POC behavior: facility, boundary, three measurement points, side panel, belief updates, recommendations, and audit log.
