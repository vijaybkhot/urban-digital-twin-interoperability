# Architecture

## Overview

The application is a frontend research prototype organized around typed
domain contracts and ports. A shared React shell selects one isolated mode and
passes configuration or scenario state to a Cesium viewer adapter. The ArcGIS
experiment is a separate visualization entry point that consumes selected
committed urban GeoJSON.

There is no production backend, database, real LLM provider, or connected
reconstruction service in this repository.

## Application modes

The main application currently implements five modes:

- **New-project workflow — implemented browser prototype.** Reviews project
  location and local image metadata, then runs a mock reconstruction lifecycle.
- **Existing controlled-facility demo — implemented mock scenario.** Loads
  `public/project_config.json` and renders facility, measurement, belief,
  model, and annotation features.
- **Modular-housing demo — implemented mock proposal scenario.** Uses a typed
  modular-specific contract and entities without changing the project-config
  schema or reusing controlled-facility measurements.
- **Property-specific disaster-resilience demo — implemented fictional
  scenario.** Uses synthetic properties, mock flood and response information,
  and prominent emergency-use limitations.
- **Urban-resilience demo — implemented research scenario.** Uses committed
  OSM/FEMA/USGS-derived artifacts and conservative coverage and interpretation
  rules.

The isolated ArcGIS page is an **experimental visualization client**, not a
sixth main mode and not an independent spatial-processing pipeline.

## Configuration and scenario boundaries

`ProjectConfig` describes the shared controlled-facility/viewer shell,
including scene center, camera, optional site marker and facility, belief
rules, measurements, models, and annotations.

The modular, disaster-resilience, and urban-resilience modes use independent
viewer-neutral scenario contracts. They reuse the viewer boundary but do not
extend `project_config.json` with unrelated domain fields.

## Public-data pipeline

Urban source acquisition and scientific processing occur before visualization:

```text
OSM Overpass / FEMA NFHL / USGS 3DEP
                 |
                 v
Manual network fetch scripts
                 |
                 v
Ignored scripts/.cache/ responses
                 |
                 v
Local build and spatial-processing scripts
                 |
                 v
Committed JSON / GeoJSON
                 |
                 v
Validators and GitHub Actions
                 |
          +------+------+
          |             |
          v             v
      CesiumJS      ArcGIS experiment
```

The viewers do not recompute FEMA classifications. CI reads committed local
artifacts and does not call OSM, FEMA, USGS, Cesium ion, or ArcGIS services.

For a per-dataset reference — exact study-area bounds, generating script,
committed file, feature counts, and known limitations for every artifact this
pipeline produces, plus the three hand-authored/vendored files outside it —
see the [data and source register](data/data-register.md).

## Ports and adapters

The application defines small external boundaries in `src/ports`:

- `AgentProvider`
- `ProjectConfigRepository`
- `ReconstructionProvider`
- `ViewerAdapter`

Current adapters include:

- `StaticJsonProjectConfigRepository`, which loads `/project_config.json` only
  for the existing controlled-facility demo;
- `MockAgentProvider`, which exercises the agent boundary without calling a
  real model;
- `MockColmapReconstructionProvider`, which simulates job states and returns a
  bundled sample asset;
- `CesiumViewerAdapter`, which owns the Cesium viewer and mode-specific entity
  lifecycles.

These interfaces make future provider replacement possible; they do not imply
that a real agent, backend, or reconstruction system is already integrated.

## Viewer isolation

Cesium-specific imports remain concentrated under `src/cesium` and
`src/adapters/viewer`. Domain services and React components exchange project
types and callbacks rather than raw Cesium objects.

The ArcGIS SceneView source remains under `src/experiments` with a separate
HTML entry point. It consumes upstream classifications already stored in local
GeoJSON and does not alter the Cesium implementation.

## Reconstruction boundary

The current browser workflow performs deterministic image-readiness checks and
uses a mock provider. The intended future path is:

```text
Images
  -> deterministic intake checks
  -> future reconstruction provider
  -> PLY or other pipeline-native output
  -> GLB or 3D Tiles conversion
  -> geospatial placement and visualization
```

Real COLMAP work is external and not connected. The repository documents
handoff contracts, recognizes PLY output, and includes a local Blender
conversion spike, but it does not run a production reconstruction pipeline.

## Why configuration instead of generated viewer code

A future agent should produce structured project configuration, not rewrite
viewer code. Stable contracts keep rendering deterministic, testable, and
independent of a particular model provider.

## Why Vite, React, and TypeScript

Vite provides a lightweight development and production-build workflow. React
supports panel and mode state, while TypeScript defines boundaries for project
configuration, scenarios, providers, reconstruction jobs, and viewer adapters.

Next.js is not required because the current project has no server-rendered
pages, authentication, backend API, or deployment-specific full-stack layer.
