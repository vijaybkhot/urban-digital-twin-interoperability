# Minimum Open-Source Release Audit

Audit date: 2026-08-30

Repository: `vijaybkhot/urban-digital-twin-interoperability`

Repository name at the time of this audit: `vijaybkhot/agentic-cesium-digital-twin`
(renamed to `vijaybkhot/urban-digital-twin-interoperability` the following day,
2026-08-31, in commit `5957732`; addendum added 2026-09-09 during the
September 2026 research handoff, see #100).

Audited base commit: `b7e837f`

Release ticket: [Issue #77](https://github.com/vijaybkhot/urban-digital-twin-interoperability/issues/77)

## Outcome

The automated and repository-level portions of the minimum open-source release
audit pass. The repository is public, uses Apache License 2.0 for
project-authored work, documents third-party terms, and builds from committed
data without requiring service credentials.

This remains a **research prototype**. It is not a production digital-twin
platform, official flood determination, live emergency system, real
reconstruction backend, or operational AI agent.

The repository-owner browser walkthrough passed on 2026-08-30 with no new
application errors. The ArcGIS credential-dependent test also passed.

The repository was subsequently renamed before the `v0.1.0` release. Git
history and the audited project remain continuous.

## Repository and governance review

| Check | Result | Evidence |
| --- | --- | --- |
| Repository visibility | Pass | GitHub reports `PUBLIC`. |
| Default branch | Pass | GitHub reports `main`; remote `main` was clean at audited commit `b7e837f`. |
| Project license | Pass | GitHub recognizes Apache License 2.0; `LICENSE`, `NOTICE`, and `package.json` agree. |
| Contributor guidance | Pass | `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md` are present. |
| Third-party attribution | Pass | `THIRD_PARTY_NOTICES.md` documents software, public data, services, and the bundled model. |
| Public positioning | Pass | README and roadmap describe implemented, mock, external-service, and planned boundaries. |
| Repository metadata | Pass | A research-prototype description and relevant geospatial/interoperability topics are set. |
| GitHub validation on `main` | Pass | Workflow run `33339240505` passed for `b7e837f`. |

The repository remains under Vijay Khot's GitHub account with neutral
attribution to the project contributors. This does not claim Louisiana State
University ownership, sponsorship, certification, or endorsement.

## Sensitive-data and tracked-file audit

The audit intentionally reported only filenames, rule categories, and counts;
it did not print candidate credential values.

Checks performed:

- scanned tracked filenames and reachable Git-history filenames for environment
  files, credentials, private keys, raw caches, and local reconstruction output;
- scanned current tracked text and reachable Git history for high-confidence
  private-key, cloud-key, GitHub-token, Google-key, and bearer-token patterns;
- classified values in `.env.example` as empty placeholders or safe example
  switches without displaying local credentials;
- verified ignore rules for `.env.local`, `scripts/.cache/`, `node_modules/`,
  `dist/`, `.DS_Store`, and local PLY/GLB outputs;
- confirmed that `.env.local` is ignored and not tracked;
- confirmed that the committed browser datasets are generated research
  artifacts derived from the public sources documented in
  `THIRD_PARTY_NOTICES.md`.

Results:

- no high-confidence secret indicator was found in the current tracked tree;
- no high-confidence secret indicator was found in reachable Git history;
- no sensitive-looking historical filename was found;
- no ignored raw service cache, local image intake, private research image,
  credential file, or local reconstruction output is tracked;
- `.env.example` contains no usable credential;
- `src/assets/hero.png`, an unused initial-scaffold image with no documented
  provenance, was removed during this audit;
- `public/models/CesiumMilkTruck.glb` remains the only intentionally tracked
  GLB and is attributed to its source and CC BY 4.0 terms in
  `THIRD_PARTY_NOTICES.md`.

This targeted scan reduces release risk but is not a guarantee that every
possible secret format is detectable. GitGuardian also reported no secret in
the preceding minimum-release pull requests.

## Local validation

Environment:

- Node.js `22.12.0`, selected from `.nvmrc`
- npm `10.9.0`
- clean dependency install through `npm ci`

Commands:

```bash
npm ci
npm run validate
git diff --check
```

Results:

| Validation | Result |
| --- | --- |
| USGS ground-elevation sample | Pass: 16 records; coordinates, units, provenance, and interpretation boundaries validated. |
| Urban-resilience data | Pass: 778 properties, 7 FEMA polygons, 2 routes, and 3 response resources. |
| Community/public-safety facilities | Pass: 4 facilities and conservative FEMA relationships; Port Fourchon zero-result case retained without inferring real-world absence. |
| LA-1/FEMA experiment | Pass: 48 original OSM ways and conservative relationship states. |
| Fictional disaster-resilience data | Pass: 6 properties, flood boundary, route, shelter, and 5 event sources. |
| TypeScript and Vite production build | Pass. |
| Whitespace/error-marker check | Pass: `git diff --check` produced no errors. |

Known non-blocking build warnings:

- the bundled `protobufjs` dependency uses direct `eval` internally;
- Vite reports large output chunks, primarily from the geospatial SDKs.

These warnings predate this audit and do not suppress validator, TypeScript, or
build failures.

## Public-claim review

The public README, roadmap, architecture notes, and decision records were
reviewed for unsupported claims about production readiness, current flooding,
road safety or passability, facility operation, emergency guidance, elevation,
reconstruction, and AI behavior.

The documented interpretation boundaries remain:

- FEMA relationships describe mapped geographic relationships, not current
  floodwater, flood depth, official determinations, closures, or safety;
- community/public-safety facilities are OSM records, not verified operational
  facilities, shelters, or service-availability reports;
- sampled USGS values are estimated/interpolated ground elevations, not floor
  elevations, structural elevations, Base Flood Elevations, or inundation;
- disaster-resilience and modular-housing scenarios contain mock or
  illustrative decision-support content;
- image intake and reconstruction use a browser-local mock workflow and a
  bundled sample model;
- the agent interface uses a mock provider and does not call a real LLM.

No unsupported strong claim was identified in the audited public-facing
documents.

## Manual browser walkthrough

Status: **Passed on 2026-08-30**

Browser: Not reported; this omission is retained rather than silently inferring
a browser or version.

Use Node 22 and start the local server:

```bash
nvm use
npm run dev
```

Record the browser, date, and outcome. Test these views without treating
expected external-service limitations as silent passes:

- [x] New-project/image-intake workflow loads; local image selection and mock
  readiness behavior remain clearly local and mock.
- [x] Existing controlled-facility demo loads; measurements, annotations, and
  the bundled sample-model behavior remain selectable.
- [x] Modular-housing demo loads; module selection, camera controls, and mock
  status/event information work.
- [x] Property-specific disaster-resilience demo loads; six fictional
  properties, flood layer, property selection/dashboard, shelter, route,
  camera presets, legend, and disclaimers work.
- [x] Urban-resilience demo loads; Grand Isle/Port Fourchon buildings, FEMA
  polygons, LA-1 experiment toggle, facilities toggle, selection panels, and
  ground-elevation sample fields work.
- [x] ArcGIS experiment at `/experiments/arcgis-urban-resilience/` loads the
  same committed data. If an ArcGIS key is unavailable, record that limitation
  instead of claiming the credential-dependent basemap/elevation test passed.
- [x] Navigation among the five primary modes does not leave duplicate panels,
  stale selections, or a broken viewer.
- [x] Browser console contains no new application error or unhandled promise
  rejection. Record expected third-party/WebGL warnings separately.

Manual result: **Pass.** The repository owner reported no new application
errors, and the ArcGIS test passed.

## Remaining limitations

- No public hosted application is part of the minimum release. (Accurate as
  of this audit; a live, credential-free Vercel deployment was added the
  following day in [PR #98](https://github.com/vijaybkhot/urban-digital-twin-interoperability/pull/98),
  merged 2026-09-01 — see the README's "Live research demo" section. Addendum
  added 2026-09-09 during the September 2026 research handoff, HO-03/#101.)
- External acquisition scripts depend on the availability and current terms of
  OSM/Overpass, FEMA, and USGS services; validation uses committed local data.
- Optional Cesium ion and ArcGIS services require user-supplied credentials.
- OSM coverage is incomplete and is not a parcel, facility-availability, or
  authoritative inventory source.
- FEMA polygons are mapped hazard information, not current or predicted
  floodwater.
- The ArcGIS client is a visualization-portability experiment, not a second
  production application.
- The reconstruction and agent backends remain interfaces with mock local
  implementations.
- Dependency vulnerability remediation and performance/code-splitting work are
  separate follow-up activities; this audit does not change dependencies.
- A tagged release and `CITATION.cff` are tracked separately in Issue #79.

## Advisor handoff draft

**Subject: Open-source urban digital-twin repository ready**

Hi Dr. Yong-Cheol Lee,

The Urban Digital Twin Interoperability repository is publicly available at:

https://github.com/vijaybkhot/urban-digital-twin-interoperability

The minimum open-source release is licensed under Apache License 2.0 and now
includes the React/TypeScript Cesium viewer, five demonstration modes, the
isolated ArcGIS visualization-portability experiment, documented OSM/FEMA/USGS
data-processing and provenance workflows, committed example datasets,
contributor and security guidance, and automated validation on GitHub Actions.

The repository is described accurately as a research prototype. The real
reconstruction backend and real AI agent are not integrated, the resilience
outputs are not live emergency guidance or official FEMA determinations, and
optional external map services require user-supplied credentials.

This repository can serve as the Urban Digital Twin Interoperability component
within the proposed STC-DT umbrella repository. Git history has been preserved.

Best,

Vijay

Do not send this message until the manual browser walkthrough is recorded and
the OSR-006 pull request has merged successfully.
