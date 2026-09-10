# Urban Digital Twin Interoperability Research Prototype

[![Validation](https://github.com/vijaybkhot/urban-digital-twin-interoperability/actions/workflows/validation.yml/badge.svg)](https://github.com/vijaybkhot/urban-digital-twin-interoperability/actions/workflows/validation.yml)
[Apache License 2.0](LICENSE)

An open-source research prototype for geospatial digital-twin interoperability,
public-data integration, visualization portability, and reusable
viewer-independent domain boundaries.

This repository is an Apache-2.0-licensed research prototype for config-driven
geospatial digital-twin visualization and interoperability experiments. It
combines a React/TypeScript application, CesiumJS rendering, viewer-independent
domain contracts, local public-data processing, and an isolated ArcGIS
visualization-portability experiment.

> **Proposed STC-DT component: Urban Digital Twin Interoperability.** This
> repository is intended to represent the Urban Digital Twin Interoperability
> component of the proposed Socio-Technical Cyberinfrastructure for Digital
> Twins ecosystem. The detailed scope and qualification appear below.

The project is **not a complete production digital-twin pipeline**. It has no
real LLM agent, connected COLMAP reconstruction backend, live sensor or
emergency feed, authentication, database, or persisted project state. Mock,
experimental, external, and planned capabilities are identified explicitly
throughout this document.

## Live research demo

**Demo:** https://urban-digital-twin-interoperability.vercel.app/

The hosted application is a research demonstration only. It is not an
operational emergency-management system and must not be used for hazard,
evacuation, routing, safety, or official flood-determination decisions.

## At a glance

- Five isolated application modes share one React/Cesium viewer boundary.
- Typed contracts keep domain state separate from Cesium-specific rendering.
- Manual Node.js pipelines acquire, build, and validate OSM, FEMA, and USGS
  research artifacts before viewers consume committed GeoJSON.
- CesiumJS and an isolated ArcGIS SceneView consume selected common local data.
- Provider interfaces represent future agent and reconstruction integration;
  the implementations in this repository are mock or local-only.
- `npm run validate` checks all committed datasets, TypeScript, and the Vite
  production build locally and in GitHub Actions.

## Research purpose

The prototype investigates a reusable boundary between source acquisition,
scientific processing, structured digital-twin state, and visualization
clients. A viewer should consume validated configuration or GeoJSON rather
than asking an LLM or browser session to generate rendering code or recompute
scientific spatial relationships.

Current research questions include:

- Can one viewer architecture support controlled-facility, construction,
  disaster-resilience, and urban-resilience scenarios without mixing their
  domain contracts?
- Can future agent or reconstruction providers be replaced behind typed
  interfaces without rewriting the Cesium renderer?
- Can the same processed public-data artifacts be presented through both
  CesiumJS and ArcGIS clients?
- How should uncertainty, incomplete coverage, provenance, and
  non-operational safety language appear in a digital-twin interface?

## Proposed role in STC-DT

This project is intended to represent the **Urban Digital Twin
Interoperability** component of a proposed umbrella ecosystem named
**Socio-Technical Cyberinfrastructure for Digital Twins (STC-DT)**. Its
current contribution is a research testbed for geospatial-data integration,
typed viewer boundaries, scientific provenance, visualization portability,
and reproducible local datasets.

This repository does not currently implement an umbrella-level STC-DT
integration. The proposed role describes a research direction, not completed
technical integration, institutional ownership, deployment, certification, or
endorsement.

## Implementation status

| Component | Status | Current behavior |
| --- | --- | --- |
| CesiumJS viewer | Implemented prototype | Renders config-driven assets and isolated scenario entities through a viewer adapter. |
| Project and image intake | Implemented browser prototype | Reviews selected local-image metadata and deterministic readiness rules without uploading the files. |
| Reconstruction workflow | Mock | Simulates queued, running, and completed states and returns a bundled sample GLB. |
| Real COLMAP reconstruction | External—not integrated | Handoff contracts and expected JPG/PLY inputs and outputs are documented, but no backend is connected. |
| Agent layer | Mock and interface boundary | `AgentProvider` exists, but no real LLM or model provider is called. |
| Model visualization | Implemented prototype | Displays configured GLB assets, model-local annotations, and measurement links. Raw PLY is not rendered directly. |
| Urban public-data pipeline | Implemented research workflow | Manual Node scripts acquire and process OSM, FEMA NFHL, and USGS 3DEP information into validated local artifacts. |
| ArcGIS SceneView | Experimental | An isolated client renders selected urban GeoJSON without recomputing project classifications. |
| Backend, authentication, database, and persistence | Not implemented | These remain future integration work. |
| Live sensors and operational emergency feeds | Not implemented | The application must not be used for operational or emergency decisions. |

## Demonstration modes

The main application keeps five modes isolated in
[`src/app/AppShell.tsx`](src/app/AppShell.tsx).

### 1. New-project and image-intake workflow

An implemented browser-only workflow for entering a project location,
selecting local images, reviewing deterministic metadata checks, and running a
mock reconstruction lifecycle. Selected images remain local to the browser.
The completed mock job displays the bundled Cesium Milk Truck GLB; it does not
run COLMAP or photogrammetry.

### 2. Existing controlled-facility demo

An implemented mock facility scene with a controlled-area boundary,
measurement points, Low/Medium/High belief states, editable readings, manual
overrides, recommendations, audit history, a sample model, and model-linked
annotations. This mode loads `public/project_config.json` only when explicitly
opened.

### 3. Modular-housing demo

An implemented proposal-oriented mock scenario containing a factory, modular
units, a logistics route, staging and construction areas, status actions,
camera controls, and an event feed. It is not connected to real factories,
robotics, logistics systems, or construction operations.

### 4. Property-specific disaster-resilience demo

An implemented but fully fictional Baton Rouge-area scenario with six
synthetic properties, a mock HEC-RAS-style flood-depth volume, a fictional
shelter, a mock route, camera presets, a resident-facing dashboard, and a
multi-twin event feed.

The property footprints are not aligned with real parcels, roads, buildings,
or private addresses. The flood layer is not HEC-RAS output, current flooding,
a forecast, or emergency guidance.

> **Demonstration only. Not for real emergency use.**

### 5. Urban-resilience demo

An implemented research scenario using real public-data geometry for Grand
Isle, Port Fourchon, and parts of the Louisiana Highway 1 corridor. It uses
processed OpenStreetMap building, road, and facility records; available FEMA
National Flood Hazard Layer polygons; and a small USGS 3DEP ground-elevation
sample.

Optional experiments cover LA-1/FEMA relationships, four reviewed Grand Isle
community/public-safety facilities, and representative ground elevation.
These report mapped spatial relationships and coverage status only. They do
not report current flooding, road passability, facility operation, structural
vulnerability, or evacuation suitability. Missing or unavailable evidence
remains `Unknown`.

Each of this mode's seven layers — how it loads, styles, toggles, and what it
means — is documented individually in
[`docs/data/urban-resilience-layers.md`](docs/data/urban-resilience-layers.md).

### ArcGIS visualization-portability experiment

The separate page at `/experiments/arcgis-urban-resilience/` tests whether
selected processed urban GeoJSON can be rendered in an ArcGIS SceneView. It is
an experimental visualization client, not a replacement application or an
independent FEMA/OSM scientific-processing pipeline.

## Architecture

External public-data acquisition and local scientific processing occur
upstream of both viewers:

```text
External public sources
OSM Overpass / FEMA NFHL / USGS 3DEP
                 |
                 v
Manual network acquisition scripts
                 |
                 v
Ignored raw cache under scripts/.cache/
                 |
                 v
Local build and spatial-processing scripts
                 |
                 v
Committed JSON / GeoJSON artifacts
                 |
                 v
Local validators and CI
                 |
          +------+------+
          |             |
          v             v
   CesiumJS viewer   ArcGIS experiment
```

The project/reconstruction path is separate:

```text
Project configuration / local image review
                 |
                 v
Typed provider and domain boundaries
                 |
                 v
Mock reconstruction provider today
                 |
                 v
Future external reconstruction integration
```

CI validates committed artifacts and builds the application without calling
OSM, FEMA, USGS, Cesium ion, or ArcGIS services. Cesium and ArcGIS render
derived attributes but do not recompute FEMA classifications.

The principal external boundaries are:

- `AgentProvider`
- `ProjectConfigRepository`
- `ReconstructionProvider`
- `ViewerAdapter`

Cesium imports remain concentrated under `src/cesium` and the Cesium viewer
adapter. See the [architecture note](docs/architecture.md),
[project-config schema](docs/project-config-schema.md), and
[reconstruction handshake](docs/reconstruction-pipeline-handshake.md).

## Example inputs and outputs

| Example | Role | Interpretation |
| --- | --- | --- |
| [`public/project_config.json`](public/project_config.json) | Config-driven viewer input | Local controlled-facility demonstration configuration. |
| [Fictional disaster property GeoJSON](public/examples/disaster_resilience_properties.geojson) | Mock scenario input | Six synthetic properties; not validated hazard data. |
| [`public/data/urban-resilience/`](public/data/urban-resilience/) | Generated research artifacts | Committed OSM/FEMA/USGS-derived GeoJSON consumed by viewers. |
| [`docs/examples/`](docs/examples/) | Reconstruction contract examples | Example request, status, error, and output payloads; not a connected service. |
| [Bundled sample GLB](public/models/CesiumMilkTruck.glb) | Mock viewer output | Demonstrates model handoff and placement; not a project reconstruction. |

Current outputs are browser-rendered scenes, selectable details, validation
logs, and contract examples. The repository does not currently produce a real
photogrammetric reconstruction through its browser workflow.

## Technical stack

- React 19
- TypeScript
- Vite
- CesiumJS
- ArcGIS Maps SDK for JavaScript for one isolated experiment
- Local JSON and GeoJSON
- Node.js acquisition, processing, and validation scripts

## Quick start

### Requirements

- Git
- Node.js `20.19.0` or newer; Node.js `22.12.0` is the repository's pinned
  development version
- npm, included with Node.js
- A browser with WebGL support

The repository pins Node `22.12.0` in `.nvmrc`. On macOS or Linux with `nvm`:

```bash
git clone https://github.com/vijaybkhot/urban-digital-twin-interoperability.git
cd urban-digital-twin-interoperability
nvm use
npm ci
npm run dev
```

NVM for Windows does not automatically read `.nvmrc`. Select the pinned
version explicitly before installing dependencies:

```powershell
git clone https://github.com/vijaybkhot/urban-digital-twin-interoperability.git
Set-Location urban-digital-twin-interoperability
nvm use 22.12.0
npm ci
npm run dev
```

If the version is not installed, run `nvm install 22.12.0` first. Depending on
the NVM for Windows installation, changing the active Node version may require
an Administrator PowerShell session. Ordinary Node, npm, build, and
development commands do not require an Administrator terminal.

Open the URL printed by Vite, normally:

```text
http://localhost:5173/
```

The isolated ArcGIS experiment is normally available at:

```text
http://localhost:5173/experiments/arcgis-urban-resilience/
```

Build and preview the production bundle with:

```bash
npm run build
npm run preview
```

## Optional environment configuration

The base application and local research layers run without optional service
credentials. Copy `.env.example` to the ignored `.env.local` file only when
optional services are needed:

```bash
cp .env.example .env.local
```

Windows PowerShell equivalent:

```powershell
Copy-Item .env.example .env.local
```

Available variables are:

```dotenv
VITE_CESIUM_ION_ACCESS_TOKEN=
VITE_ENABLE_URBAN_OSM_BUILDINGS=false
VITE_ARCGIS_API_KEY=
```

- `VITE_CESIUM_ION_ACCESS_TOKEN` enables optional Cesium ion imagery and
  contextual OSM Buildings.
- `VITE_ENABLE_URBAN_OSM_BUILDINGS` remains off by default because the urban
  demo already renders selectable OSM-derived footprints.
- `VITE_ARCGIS_API_KEY` enables optional ArcGIS basemap and elevation
  services.

`VITE_CESIUM_ION_ACCESS_TOKEN` is client-side Vite configuration and is
therefore visible in the browser. Hosted deployments should use an
application-specific Cesium ion token with only the minimum required scopes
and appropriate URL restrictions. Supply the deployed token through the
hosting provider's environment or configuration settings. Never commit a
Cesium ion token to the repository.

Restrict credentials to necessary services and approved HTTP referrers. Never
commit `.env.local`, API keys, Cesium ion tokens, or ArcGIS credentials.

## Validation and testing

Run the complete committed-data and production-build validation sequence:

```bash
npm run validate
```

The command validates:

- the USGS ground-elevation sample;
- the base urban-resilience artifacts;
- the facility/FEMA experiment;
- the LA-1/FEMA experiment;
- the fictional disaster data;
- TypeScript compilation and the Vite production build.

The [GitHub Actions workflow](.github/workflows/validation.yml) runs the same
command for every pull request and push to `main`, using the Node version
pinned in `.nvmrc` (currently `22.12.0`) and `npm ci`. It requires no
repository secret and does not fetch new OSM, FEMA, USGS, Cesium ion, or
ArcGIS data.

Existing protobuf dynamic-evaluation and Vite bundle-size notices are known
non-blocking warnings. They are not suppressed; a validator, TypeScript, or
build failure still fails the workflow.

## Public-data processing

The browser consumes committed artifacts under `public/data/urban-resilience/`.
Acquisition, artifact generation, and validation remain separate commands.

**These four pipelines are not independent — run them in the order shown
below.** The LA-1/FEMA experiment reuses the base dataset's fetch cache (it
has no `fetch:` command of its own), and the ground-elevation sample reads
the *committed output* of both the base dataset and the facility experiment
to know which points to query. See
[`docs/data/regeneration.md`](docs/data/regeneration.md) for the full
dependency graph, what happens if you run them out of order, and the
migration procedure required if OpenStreetMap identity drifts between
fetches.

### Base urban dataset

```bash
npm run fetch:urban-resilience-data
npm run build:urban-resilience-data
npm run validate:urban-resilience-data
```

### LA-1/FEMA relationship experiment

```bash
npm run build:urban-resilience-la1-fema-experiment
npm run validate:urban-resilience-la1-fema-experiment
```

### Community/public-safety facility experiment

```bash
npm run fetch:urban-resilience-facility-data
npm run build:urban-resilience-facility-data
npm run validate:urban-resilience-facility-data
```

### USGS 3DEP ground-elevation sample

```bash
npm run fetch:urban-resilience-elevation-sample
npm run build:urban-resilience-elevation-sample
npm run validate:urban-resilience-elevation-sample
```

`fetch:*` commands require network access and write raw responses under the
ignored `scripts/.cache/` directory. Generated GeoJSON is reviewed, validated,
and committed so the viewers and CI do not need to contact scientific data
services. Upstream services can change; regenerated output requires review.

## Data sources and interpretation boundaries

| Source | Project use | Important limitation |
| --- | --- | --- |
| OpenStreetMap / Overpass | Building footprints, road ways, and mapped community/public-safety facilities | OSM may be incomplete. Footprints are not legal parcels, and absence from OSM does not prove real-world absence. |
| FEMA National Flood Hazard Layer | Mapped flood-hazard polygons used for zone-based research relationships | FEMA polygons are not current floodwater, forecast depth, road condition, evacuation guidance, or a project-generated hydraulic model. |
| USGS 3DEP | Estimated/interpolated ground elevation at representative sample coordinates | The value is not building height, floor elevation, flood depth, FEMA Base Flood Elevation, or a site-specific survey. |
| Fictional local data | Property-specific disaster-resilience demonstration | Synthetic geometry and mock values must not be associated with real residents or operational decisions. |
| Cesium ion and ArcGIS services | Optional visual context | Visual context is not project-derived scientific evidence and can be unavailable without credentials. |

Detailed source, licensing, asset, and service attribution is centralized in
[Third-Party Notices](THIRD_PARTY_NOTICES.md). A per-dataset reference —
purpose, exact study-area bounds, generating script, feature counts, and
known limitations for every committed and hand-authored data file in this
repository — is in the [data and source register](docs/data/data-register.md).

The urban property classification is a zone-based research classification:

- FEMA V/VE zones map to `High`.
- Other mapped Special Flood Hazard Area zones map to `Moderate`.
- A supported mapped-outside-SFHA result maps to `Low`.
- Missing, incomplete, unavailable, or undetermined coverage maps to
  `Unknown`.

`Unknown` must never be converted to `Low`. A mapped non-intersection must not
be described as no flood risk. See the
[urban-resilience guardrails](docs/decisions/006-urban-resilience-real-data-guardrails.md).

## Safety and scientific limitations

- Research prototype only; not a production or emergency-management system.
- Not an official FEMA flood determination or insurance requirement.
- Not current flooding, forecast inundation, or storm-surge depth.
- Not road closure, passability, safe-travel, or evacuation guidance.
- Not an authoritative shelter or community-facility inventory.
- Not facility availability, operation, criticality, or vulnerability.
- Not building-floor elevation, finished-floor elevation, or structural
  elevation.
- Not a substitute for a certified flood study, hydraulic model, survey, or
  emergency-management system.
- No backend API, authentication, database, persistence, or availability
  guarantee.
- No connected image upload, LLM agent, or COLMAP service.

Spatial overlap describes a geographic relationship with available mapped
information only. It must not be converted into a claim about current hazard,
operation, availability, or safety.

## Repository structure

```text
src/
  adapters/       Implementations of viewer, config, reconstruction, and agent ports
  app/            Application state and mode orchestration
  cesium/         Cesium-specific rendering and scene helpers
  components/     React panels and controls
  domain/         Viewer-independent scenario and parsing logic
  experiments/    ArcGIS portability experiment source
  ports/          Interfaces for external providers and viewers
  types/          Shared TypeScript contracts

scripts/          Acquisition, processing, geometry, and validation scripts
public/data/      Committed generated JSON and GeoJSON consumed by viewers
public/models/    Approved viewer-ready sample assets
experiments/      Alternate experiment HTML entry points
docs/             Architecture, decisions, contracts, evidence, and research notes
```

## Governance and open-source release

Project-authored source code and documentation are provided under the
[Apache License 2.0](LICENSE). Third-party software, data, services, and model
assets retain their respective terms.

- [Project notice](NOTICE)
- [Third-Party Notices](THIRD_PARTY_NOTICES.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Architecture](docs/architecture.md)
- [Roadmap](ROADMAP.md)
- [Minimum Open-Source Release Audit](docs/open-source-release/minimum-release-audit.md)
- [Open-Source Ecosystem Readiness tracker](https://github.com/vijaybkhot/urban-digital-twin-interoperability/issues/89)

The neutral contributor attribution does not claim Louisiana State University
ownership, sponsorship, certification, or endorsement. Repository stewardship
can be updated later if contributors and any applicable institution establish
a different arrangement.

## Publications and citation

Machine-readable software citation metadata is provided in
[`CITATION.cff`](CITATION.cff). GitHub's **Cite this repository** control can
export the citation in common formats. Always cite the exact software version
or Git commit used in research.

Suggested citation for the initial release:

> Khot, V., and Lee, Y.-C. (2026). *Urban Digital Twin Interoperability
> Research Prototype* (Version 0.1.0) [Computer software]. GitHub.
> https://github.com/vijaybkhot/urban-digital-twin-interoperability

Release-specific information will be available from the
[`v0.1.0` release](https://github.com/vijaybkhot/urban-digital-twin-interoperability/releases/tag/v0.1.0)
after publication. No project-specific archival publication or DOI is claimed
for this release.

## Contributors and research context

Git history and the
[GitHub contributors page](https://github.com/vijaybkhot/urban-digital-twin-interoperability/graphs/contributors)
provide the contribution record. Contributions should follow the
[Contributing Guidelines](CONTRIBUTING.md).

The prototype supports an exploratory research direction discussed with
Professor Yong-Cheol Lee at Louisiana State University concerning rapid
digital-twin generation, geospatial visualization, urban resilience, and
agent-assisted workflows. References to future collaboration or ecosystem
growth describe research directions, not completed integrations or adoption
commitments.
