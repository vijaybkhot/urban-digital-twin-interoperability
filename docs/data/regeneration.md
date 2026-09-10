# Regenerating the Urban-Resilience Data Pipelines

This document is the missing piece between the [data register](data-register.md)
(what each dataset is) and [`docs/data/urban-resilience-layers.md`](urban-resilience-layers.md)
(how each dataset renders): **the order you must run things in to regenerate
them from scratch, and the one real trap in that order.**

The four public-data pipelines are **not independent**, despite how
`README.md`'s "Public-data processing" section lists them. Two of the four
have dependencies on the others' *committed output*, not just their raw
fetch caches — one of those dependencies is circular in the sense that a
build step consumes what an earlier build step already produced and
committed.

## The complete dependency graph

```text
                    ┌─────────────────────────────────────┐
                    │  fetch:urban-resilience-data          │
                    │  (Overpass buildings + LA-1 route,    │
                    │   FEMA NFHL flood zones)               │
                    └───────────────┬───────────────────────┘
                                    │ writes to scripts/.cache/
                                    ▼
                    ┌─────────────────────────────────────┐
                    │  build:urban-resilience-data          │
                    │  → grand_isle_port_fourchon_          │
                    │    properties.geojson                  │
                    │    flood_zones.geojson                 │
                    │    response.geojson                    │
                    └───────────────┬───────────────────────┘
                                    │ committed to public/data/
                                    │
              ┌─────────────────────┼─────────────────────────────┐
              │                     │                              │
              ▼                     │                              ▼
┌───────────────────────────┐       │        ┌──────────────────────────────┐
│ build:urban-resilience-    │       │        │ fetch:urban-resilience-       │
│ la1-fema-experiment         │       │        │ facility-data                  │
│ (reuses the SAME cache      │       │        │ (separate Overpass query,      │
│  from the base fetch above  │       │        │  separate FEMA query)           │
│  -- NO dedicated fetch      │       │        └───────────────┬─────────────────┘
│  script exists for this)    │       │                        │ writes to scripts/.cache/
└─────────────┬───────────────┘       │                        ▼
              │ committed              │        ┌──────────────────────────────┐
              ▼                        │        │ build:urban-resilience-        │
┌───────────────────────────┐          │        │ facility-data                   │
│ public/data/urban-         │          │        │ → community_public_safety_      │
│ resilience/experiments/    │          │        │   facilities.geojson             │
│ la1_fema_intersections     │          │        └───────────────┬─────────────────┘
│ .geojson                   │          │                        │ committed
└─────────────────────────────┘         │                        ▼
                                        │        ┌──────────────────────────────────┐
                                        └───────▶│ fetch:urban-resilience-            │
                                                 │ elevation-sample                    │
                                                 │                                      │
                                                 │ ⚠️ READS THE COMMITTED OUTPUT of      │
                                                 │ both build:urban-resilience-data      │
                                                 │ AND build:urban-resilience-           │
                                                 │ facility-data (the property and       │
                                                 │ facility GeoJSON files already on     │
                                                 │ disk) to know which 16 representative │
                                                 │ points to query against USGS EPQS.    │
                                                 │ This is not a fresh, independent      │
                                                 │ fetch -- it depends on two earlier    │
                                                 │ pipelines having already been built    │
                                                 │ and committed. This is the circular    │
                                                 │ edge.                                  │
                                                 └───────────────┬──────────────────────┘
                                                                 │ writes to scripts/.cache/
                                                                 ▼
                                                 ┌──────────────────────────────────┐
                                                 │ build:urban-resilience-            │
                                                 │ elevation-sample                    │
                                                 │ → grand_isle_ground_elevation_       │
                                                 │   sample.geojson                    │
                                                 └──────────────────────────────────┘
```

**In plain terms:** you cannot regenerate the elevation sample (or the
facility data it also depends on) in isolation. A true from-scratch rebuild
of every urban-resilience artifact must run in exactly this order:

```bash
# 1. Base dataset: buildings, flood zones, response routes
npm run fetch:urban-resilience-data
npm run build:urban-resilience-data
npm run validate:urban-resilience-data

# 2. LA-1/FEMA experiment (reuses the cache from step 1 -- no separate fetch)
npm run build:urban-resilience-la1-fema-experiment
npm run validate:urban-resilience-la1-fema-experiment

# 3. Facility experiment (independent fetch, but its build/validate must run
#    before step 4, since step 4 reads its committed output)
npm run fetch:urban-resilience-facility-data
npm run build:urban-resilience-facility-data
npm run validate:urban-resilience-facility-data

# 4. Ground-elevation sample (reads the COMMITTED output of steps 1 and 3)
npm run fetch:urban-resilience-elevation-sample
npm run build:urban-resilience-elevation-sample
npm run validate:urban-resilience-elevation-sample
```

**This ordering matters differently depending on what you're doing:**

- **On a normal, unmodified clone**, the property and facility GeoJSON files
  from steps 1 and 3 are already committed to the repository. Running
  `npm run fetch:urban-resilience-elevation-sample` directly, with no other
  steps first, **works fine** — it reads whatever property/facility data is
  currently sitting in `public/data/`, which on a fresh clone is already
  correct.
- **If you are actually regenerating** — re-fetching because OSM or FEMA
  data may have changed — and you skip re-running steps 1 and 3 first, step
  4 will **not fail**. It will silently succeed using the **stale**,
  previously-committed property/facility data instead of your freshly
  rebuilt data, producing an elevation sample that doesn't correspond to
  whatever new dataset you were trying to create. This is the real trap:
  not a crash, a silent mismatch.
- **Only if the property or facility file is missing entirely** (an unusual
  state — e.g. you deleted `public/data/` by hand) does step 4 fail outright
  with the error messages shown below.

## What each stage actually writes

| Stage | Writes to | Committed to git? |
| --- | --- | --- |
| Every `fetch:*` script | `scripts/.cache/urban-resilience/*.json` | **No** — `scripts/.cache/` is listed in `.gitignore` |
| Every `build:*` script | `public/data/urban-resilience/**/*.geojson` | **Yes** |
| Every `validate:*` script | Nothing — read-only, exits non-zero on failure | n/a |

**`scripts/.cache/` does not exist on a fresh clone.** If you have not run
any `fetch:*` script yet, every `build:*` script will fail immediately with a
"file not found"-shaped error. This is expected, not a broken checkout.

## Reproducing this yourself

If you want to prove the ordering claim above without touching the network
(recommended — see the guardrail at the bottom of this document), run any
`build:*` script against an **empty** `scripts/.cache/urban-resilience/`
directory and read the error it throws. Each one now names its exact
prerequisite command:

```text
$ node scripts/buildUrbanResiliencePropertyData.mjs
Error: ENOENT: no such file or directory, open '.../scripts/.cache/urban-resilience/grand-isle-buildings.json'
```
(This script's error is a raw filesystem error rather than a custom message —
see "Known gap" below.)

```text
$ node scripts/buildUrbanResilienceLa1FemaExperiment.mjs
Error: Unable to read la1-route.json. Run npm run fetch:urban-resilience-data first.
```

```text
$ node scripts/buildUrbanResilienceFacilityExperiment.mjs
Error: Unable to read grand-isle-facilities.json. Run npm run fetch:urban-resilience-facility-data first.
```

```text
$ node scripts/buildUrbanResilienceElevationSample.mjs
Error: Unable to read the existing urban property GeoJSON. Run npm run fetch:urban-resilience-data && npm run build:urban-resilience-data first.
```
(verified by temporarily moving the committed property and facility GeoJSON
files aside, running the build script offline, and restoring them
afterward — `git status --porcelain public/` was empty before and after)

**Known gaps, not fixed here (out of scope for this issue):**
- `buildUrbanResiliencePropertyData.mjs` does not wrap its cache reads in a
  try/catch that names the prerequisite command — it surfaces Node's raw
  `ENOENT` error instead, as shown above.
- `fetchUrbanResilienceElevationSample.mjs` (the *fetch* script, not the
  build script fixed above) has **no error handling at all** around its
  reads of the committed property and facility GeoJSON files — a missing or
  malformed file there surfaces a raw `ENOENT` or `JSON.parse` error with no
  prerequisite hint. This script also makes live network calls to USGS EPQS
  for every representative point once past that read, so testing its
  failure path is not as low-risk as the offline `build:*` scripts above.

Both are straightforward fixes (mirror the pattern the facility and LA-1/FEMA
build scripts already use) but are not part of this documentation pass,
since this issue's acceptance criteria is that the *prerequisite is
discoverable*, which the raw error paths plus this document together already
satisfy. Worth a small follow-up if picked up later.

## The FEMA query truncation limit

Both FEMA fetch scripts request `resultRecordCount: "2000"` with **no
pagination**. If a bounding box were ever widened enough that a single query
window contains more than 2000 matching NFHL polygons, the response would be
silently truncated to the first 2000 — no error, no warning, just fewer
polygons than actually exist in that area. This has not happened with the
current, deliberately narrow study-area windows (`grand_isle_port_fourchon_flood_zones.geojson`
has only 7 features today), but it is a real limit to know about before
widening any bounding box. See [Issue #109 (HO-12)](https://github.com/vijaybkhot/urban-digital-twin-interoperability/issues/109)
for the related work on consolidating those bounding boxes.

## The pinned-manifest hazard, and its migration procedure

`scripts/lib/urbanElevationSample.mjs` does not select "12 buildings and 4
facilities" dynamically — it hardcodes **exactly which** 12 buildings (by
`{propertyId, osmWayId}` pair) and asserts all 4 facilities by their OSM
identity. `scripts/validateUrbanResilienceFacilityExperiment.mjs` similarly
pins all 4 facilities **by name** (`Grand Isle Fire Department`, `Grand Isle
Police Department`, `Town of Grand Isle`, `Grand Isle High School`) and by
exact OSM element type/ID.

**Why this matters for regeneration:** `build:urban-resilience-data` assigns
`property_id` values (`GI-0001`, `GI-0002`, ...) **sequentially, in Overpass
response order**. OpenStreetMap is a live, continuously edited dataset. If
anyone edits a building inside the Grand Isle or Port Fourchon query windows
between now and a future re-fetch — adds one, deletes one, or OSM's internal
element ordering simply shifts — every `property_id` after that point in the
response will shift to point at a **different real building** than it did
before.

**What happens if you re-fetch without accounting for this:**

1. `npm run fetch:urban-resilience-data && npm run build:urban-resilience-data`
   completes successfully — the build script has no way to know IDs shifted.
2. `npm run fetch:urban-resilience-elevation-sample` then fails with an error
   like:
   ```
   Error: GI-0064: expected OSM way 1066811684, received <some other number>.
   ```
   because `scripts/lib/urbanElevationSample.mjs`'s hardcoded manifest no
   longer matches what `property_id: "GI-0064"` actually points to.
3. Separately, if OSM's facility data changed at all,
   `npm run validate:urban-resilience-facility-data` may fail with an
   assertion naming one of the four pinned facilities.

**Migration procedure — do this, never silently re-pin:**

1. **Diff before touching anything.** Compare the newly-built
   `grand_isle_port_fourchon_properties.geojson` against the previously
   committed version (`git diff public/data/urban-resilience/grand_isle_port_fourchon_properties.geojson`).
   Identify exactly which `property_id` values now point at a different
   `osm_way_id`, and whether any of the 12 pinned buildings in
   `scripts/lib/urbanElevationSample.mjs` are affected.
2. **Decide whether re-pinning is appropriate**, and treat it as a reviewed
   research decision, not a mechanical fix. Re-pinning to a different
   building silently changes which 12 (of 778) properties get an elevation
   sample — that is a substantive change to what the experiment covers, and
   should carry its own provenance note (in a commit message and/or a
   `docs/devlog.md` entry) explaining why those specific buildings were
   re-selected.
3. **Update `SAMPLED_GRAND_ISLE_BUILDINGS`** in
   `scripts/lib/urbanElevationSample.mjs` with the new `{propertyId,
   osmWayId}` pairs.
4. **If a facility's identity changed**, update
   `EXPECTED_GRAND_ISLE_FACILITIES` in the same file, **and** the pinned
   `EXPECTED_FACILITIES` map in `scripts/validateUrbanResilienceFacilityExperiment.mjs`
   (name, `type`, geometry kind, OSM element type/ID, and which tag the name
   came from — `name` for three of them, `protection_title` for "Town of
   Grand Isle").
5. **Re-run the full four-pipeline sequence** above in order, and confirm
   `npm run validate` passes end to end before committing.
6. **Never weaken the pinned assertions** to make a failing regeneration
   pass more easily — they exist specifically to catch this class of silent
   drift. If a re-fetch legitimately changes which real-world buildings or
   facilities are being sampled, that is exactly the case they are designed
   to surface for human review.

## CI does not run any `fetch:*` script — this is deliberate

`.github/workflows/validation.yml` runs `npm run validate`, which chains the
5 data validators, `tsc`, and the Vite build — **all against already-committed
data**. It never calls Overpass, FEMA, or USGS. This means:

- CI is deterministic and does not depend on third-party service uptime or
  rate limits.
- **Upstream drift is invisible until someone manually re-runs a `fetch:*`
  script.** If OpenStreetMap or FEMA's NFHL service changes in a way that
  would affect this project's data, nothing in this repository's automation
  will notice. Regeneration — and therefore drift-detection — is a manual,
  occasional research activity, not a continuous one.

This is a reasonable tradeoff for a research prototype with no operational
uptime requirement, but it is worth stating plainly rather than leaving
implicit.

## See also

- [`docs/data/data-register.md`](data-register.md) — what each dataset is,
  its exact study-area bounds, and full per-dataset detail.
- [`docs/data/urban-resilience-layers.md`](urban-resilience-layers.md) — how
  each resulting artifact renders in the running application.
- [Issue #108 (HO-11)](https://github.com/vijaybkhot/urban-digital-twin-interoperability/issues/108) —
  hardens the facility build against unclassified OSM elements, a related
  but separate regeneration risk.
- [Issue #109 (HO-12)](https://github.com/vijaybkhot/urban-digital-twin-interoperability/issues/109) —
  consolidates the three inconsistent Grand Isle bounding-box extents into a
  single source of truth.
- [Issue #87 (BONUS-008)](https://github.com/vijaybkhot/urban-digital-twin-interoperability/issues/87) —
  a machine-readable checksum manifest for generated datasets, tracked
  separately and not implemented here.

## ⚠️ If you are regenerating data for real, not just reading this

**Do not run any `fetch:*` script and commit the result casually.** Doing so
will rewrite ~900 KB of committed artifacts, very likely renumber
`property_id` values, and risk breaking the pinned manifests described above
with no warning until a later validator run. This document explains how
regeneration works and what to watch for — it does not mean regeneration is
routine or low-risk. Follow the migration procedure above if you do it.
