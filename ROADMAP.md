# Roadmap

Status labels in this document mean:

- **Implemented prototype** — present and usable in this repository, but not
  production-ready.
- **Implemented documentation** — a contract, decision, or handoff description
  is present, but the external system it describes may not be integrated.
- **Mock/experimental** — present for research or demonstration and not an
  operational integration.
- **External—not integrated** — documented work exists outside the connected
  application path.
- **Planned** — not implemented in this repository.

## POC 0: Existing Cesium decision-support viewer

**Implemented prototype**

- Original Vite/CesiumJS facility viewer concept.
- Controlled boundary, measurement points, belief logic, and side-panel
  behavior.

## POC 1: Config-driven React/TypeScript Cesium viewer

**Implemented prototype**

- React and TypeScript application shell.
- Project configuration loaded from `public/project_config.json` for the
  controlled-facility demo.
- Cesium rendering isolated behind `ViewerAdapter`.
- Domain logic separated from rendering.
- Provider interfaces established for future external integrations.

## POC 2: Image intake and agent boundary

### Browser image-readiness review

**Implemented prototype**

- Select local images without uploading them.
- Inspect dimensions, file size, and GPS/EXIF availability in the browser.
- Apply deterministic readiness rules.
- Display guidance through the current mock assistant boundary.

### Real agent and backend intake

**Planned**

- Connect a backend API for controlled uploads and persisted project state.
- Implement a real `AgentProvider` behind the existing interface.
- Add provider-backed completeness checks without moving deterministic rules
  into an LLM.

## POC 3: Reconstruction integration

### Current repository capabilities

- **Implemented prototype:** Render local GLB model assets from project
  configuration.
- **Implemented prototype:** Add model-local inspection annotations using ENU
  coordinates and link them to measurement points.
- **Mock/experimental:** Simulate reconstruction job states and hand off the
  bundled sample GLB.
- **Implemented documentation:** Define reconstruction request, status, error,
  and output contracts.
- **Implemented documentation:** Record the external JPG-to-PLY pipeline and
  PLY output expectations.
- **Mock/experimental:** Provide a local Blender PLY-to-GLB conversion spike;
  sample and generated user assets remain local-only.

### External and future reconstruction work

- **External—not integrated:** Real COLMAP/JPG-to-PLY reconstruction work.
- **Planned:** Backend reconstruction job orchestration.
- **Planned:** A real `ReconstructionProvider` implementation.
- **Planned:** Stable PLY-to-GLB or PLY-to-3D-Tiles processing.
- **Planned:** Provenance and persisted audit history for returned models.

## POC 4: Research extension demos

These modes reuse the viewer boundary while retaining independent domain
contracts.

- **Mock/experimental:** Modular-housing proposal demo with typed factory,
  logistics, construction, status, camera, and event data.
- **Mock/experimental:** Property-specific disaster-resilience demo with
  fictional properties, mock flood depth, route, shelter, and decision-support
  information. It is not emergency guidance.
- **Implemented research prototype:** Urban-resilience demo using real public
  OSM geometry, available FEMA NFHL polygons, and a small USGS 3DEP elevation
  sample for Grand Isle, Port Fourchon, and selected LA-1 study areas.
- **Mock/experimental:** ArcGIS SceneView portability client consuming selected
  committed urban GeoJSON without recomputing classifications.

The optional LA-1 experiment reports mapped FEMA relationships and coverage
status only. Its OSM way geometry is real public data, but it does not report
current flooding, closure, passability, safe travel, or evacuation suitability.
Unavailable Port Fourchon FEMA evidence remains `Unknown`.

See the [modular-housing guardrails](docs/decisions/005-modular-housing-demo-guardrails.md)
and [urban-resilience guardrails](docs/decisions/006-urban-resilience-real-data-guardrails.md).

## Open-source release readiness

### Implemented

- Apache License 2.0 and neutral project stewardship record.
- Centralized third-party software, data, service, and asset notices.
- Contributor, conduct, and security policies.
- One-command local validation and pull-request/main GitHub Actions checks.
- Public landing-page, architecture, and roadmap status alignment.
- Minimum open-source release audit and advisor handoff (Issue #77).
- Scholarly citation metadata and the archived `v0.1.0` release (Issue #79).
- A live, credential-free Vercel deployment (Issue #78) — see the README's
  "Live research demo" section.

### Tracked follow-up work

- Add focused scientific-geometry unit tests.
- Add screenshots and a reproducible demonstration walkthrough.
- Publish a longer NSF-oriented architecture and use-case brief.
- Improve dependency, code-security, accessibility, and release automation.
- Add contributor-friendly issue/pull-request templates and a generated-data
  reproducibility manifest.

Current status of each item lives under the
[`OSR 3 — Independent Bonus Achievements`](https://github.com/vijaybkhot/urban-digital-twin-interoperability/milestone/12)
milestone; see the [Open-Source Ecosystem Readiness tracker](https://github.com/vijaybkhot/urban-digital-twin-interoperability/issues/89)
for the full history.

## Longer-term research directions

- Provider-backed agent assistance that outputs validated structured state.
- Real reconstruction-provider integration and durable project provenance.
- More rigorous building/FEMA spatial-association comparisons.
- Broader verified FEMA coverage along selected LA-1 study corridors.
- Portable scenario and data contracts for additional viewer clients.
- Secure, auditable interaction among multiple digital twins.
