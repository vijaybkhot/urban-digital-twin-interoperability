# Troubleshooting

Known failure modes and their fixes, gathered from real setup and pipeline
work on this repository. Each entry states the symptom first, then the
cause, then the fix, and says explicitly whether the underlying condition
is benign or something you need to act on.

If you hit something not listed here, that is a documentation gap — see the
acceptance test in `docs/handoff/acceptance-test.md` (#121, HO-24) once it
exists, or file an issue.

## Setup

### `npm` / `npm ci` fails with a PowerShell execution-policy error

**Symptom:** running any `npm` command in Windows PowerShell fails before
it does anything, often mentioning "execution of scripts is disabled on
this system."

**Cause:** PowerShell's default execution policy blocks running the
`npm.ps1` shim script.

**Fix:** allow signed/local scripts for your own user account:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

This is a one-time, per-user setting change, not a project configuration
file — nothing in this repository needs to or does adjust it for you.

### Changing Node version with NVM for Windows requires an elevated terminal

**Symptom:** `nvm use 22.12.0` (or `nvm install`) fails or silently does
nothing in an ordinary PowerShell window.

**Cause:** depending on how NVM for Windows was installed, switching the
active Node version can require Administrator privileges. NVM for Windows
also does not automatically read `.nvmrc` the way Unix `nvm` does — you
must pass the version explicitly (see `README.md` and `CONTRIBUTING.md`
for the exact commands).

**Fix:** run `nvm use 22.12.0` (installing first with `nvm install
22.12.0` if needed) from an Administrator PowerShell session. **Only
switching the Node version itself needs elevation** — every ordinary
`npm`, `npm run dev`, `npm run build`, and `npm run validate` command
afterward runs in a normal, non-elevated terminal.

### `npm ci` fails on an older Node version

**Symptom:** `npm ci` (or `npm install`) fails with an `EBADENGINE` warning
or a version-mismatch error.

**Cause:** `package.json`'s `engines.node` field requires Node `>=20.19.0`.
An older Node install does not meet that floor.

**Fix:** install/switch to a Node version `>=20.19.0` (`.nvmrc` pins the
tested development version, `22.12.0`) and re-run `npm ci`.

## Running the app

### The globe renders as a flat, solid green field with no console errors

**Symptom:** `npm run dev` starts fine, the page loads, there are zero
console errors and zero failed network requests — but the 3D globe shows a
uniform green (or similarly flat-colored) field instead of a map. No
coastline, no roads, no buildings.

**Cause:** no `VITE_CESIUM_ION_ACCESS_TOKEN` is set (or it's invalid). The
app is designed to fall back gracefully to Cesium's bundled `NaturalEarthII`
basemap in this case (see `src/config/cesiumIon.ts`), and that fallback
*does* load correctly — but `NaturalEarthII` only ships 3 zoom levels,
enough for a whole-globe overview and nowhere near enough detail for this
app's default site-level camera distance. At that zoom, there is simply no
tile data to show, so it renders as a solid color. This is not a broken
build or a bug in the token-detection logic — the fallback code path works
exactly as designed; it just isn't usable at this zoom level.

**Fix:** set `VITE_CESIUM_ION_ACCESS_TOKEN` in `.env.local` (copy
`.env.example` and fill it in). This is a viewer-rendering credential only
— no data-fetching pipeline needs it, and the app does not require it to
run `npm run validate` or any `build:*`/`fetch:*` script.

### The ArcGIS experiment (`/experiments/arcgis-urban-resilience/`) shows an OpenStreetMap basemap instead of satellite imagery, with flat ground

**Symptom:** the ArcGIS SceneView experiment loads, but shows an
OpenStreetMap-style basemap and flat terrain instead of ArcGIS satellite
imagery and 3D elevation, and its status readout says "No ArcGIS API key
detected: OpenStreetMap and flat-ground fallback active."

**Cause:** no `VITE_ARCGIS_API_KEY` is set. This is expected, documented
fallback behavior for this experiment — it is designed to still be usable
without the key, just with a lower-fidelity basemap.

**Fix:** set `VITE_ARCGIS_API_KEY` in `.env.local` if you want the
higher-fidelity imagery and elevation. Not required to view or interact
with the experiment otherwise.

### Non-blocking warnings during `npm run build` / `npm run validate`

**Symptom:** the build finishes successfully (exit code 0) but prints two
warnings you did not expect:

- an `[EVAL]` warning pointing at `node_modules/protobufjs/dist/minimal/protobuf.js`, about direct `eval` use
- a `[plugin builtin:vite-reporter]` warning that some chunks are larger than 500 kB after minification

**Cause:** both come from third-party dependencies (`protobufjs`,
transitively via Cesium/ArcGIS tooling, and the size of the vendored
ArcGIS/Cesium bundles), not from this project's own code.

**Fix:** none needed — these are known, documented, non-blocking warnings
(see `README.md` and `CONTRIBUTING.md`). Do not attempt to silence them by
disabling the build's error reporting or suppressing warnings globally; if
a *new* warning appears alongside these two, investigate it on its own
merits rather than assuming it's part of this pair.

## Data pipelines

### A `build:*` script fails with a "file not found" / `ENOENT` error against `scripts/.cache/`

**Symptom:** running a `build:urban-resilience-*` script fails immediately,
often with a raw filesystem error (`ENOENT`) or a message naming a missing
cache file under `scripts/.cache/urban-resilience/`.

**Cause:** the pipelines are not independent — several `build:*` scripts
read from the *committed output* or *raw fetch cache* of an earlier stage,
and `scripts/.cache/` is gitignored and empty on a fresh clone. Running
stages out of order, or running a build without its prerequisite fetch,
fails exactly this way.

**Fix:** see
[`docs/data/regeneration.md`](../data/regeneration.md) (#107, HO-10) for
the complete dependency graph and the exact command order. Each build
script's error message now names its specific missing prerequisite.

### Re-running a `fetch:*` script returns HTML instead of JSON, or the script retries several times before succeeding

**Symptom:** a `fetch:urban-resilience-*` script logs `Attempt N/5 failed
... received non-JSON (likely a busy/error response)` one or more times,
then either succeeds on a later attempt or eventually throws.

**Cause:** the Overpass API (`overpass-api.de`) is a shared public
service and occasionally responds with an HTML error/rate-limit page
instead of JSON under load. The fetch scripts detect this (any response
body starting with `<`) and automatically retry up to 5 times with
increasing backoff (8s, 16s, 24s, ...).

**Fix:** usually none — let it retry; it typically succeeds within a few
attempts. If it exhausts all 5 retries and throws, wait a few minutes and
re-run the script; this is normal behavior for a shared, rate-limited
public API, not a bug in this repository.

### A validator fails after re-running a `fetch:*`/`build:*` pair, citing an unexpected entity/facility/ID

**Symptom:** `npm run validate:urban-resilience-facility-data` or
`npm run validate:urban-resilience-elevation-sample` fails after a fresh
re-fetch, naming an OSM way ID, facility name, or property ID that doesn't
match what the validator expected.

**Cause:** several of these datasets pin specific OSM identities (way IDs,
facility names) at the time they were reviewed and committed. OSM data
changes over time — a re-fetch after upstream edits can return different
IDs for the same real-world features, which is exactly what these pinned
checks are designed to catch rather than silently accept.

**Fix:** do **not** relax or remove the validator's pinned checks to make
the failure go away. See "The pinned-manifest hazard, and its migration
procedure" in
[`docs/data/regeneration.md`](../data/regeneration.md) for the reviewed
re-pinning process — treat any change here as a research decision requiring
a provenance note, not a routine fix.
