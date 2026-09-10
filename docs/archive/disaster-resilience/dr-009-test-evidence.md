# DR-009 Test Evidence — Disaster Camera Presets

## Test context

- Date: 2026-08-05
- Baseline commit: `3326afb`
- Branch: `agent/dr-009-disaster-camera-presets`
- Automated browser: Google Chrome 150.0.7871.187, headless with software WebGL
- Tester: Codex automated validation; repository-owner manual approval pending
- Optional OSM Buildings: not configured in this POC

## Preset contract

| Preset | Illustrative range | Pitch | Focus content |
| --- | ---: | ---: | --- |
| Overall view | 900 m | −58° | Property footprints, flood boundary, route coordinates, and shelter coordinate |
| Flood layer view | 360 m | −52° | Mock flood boundary and label |
| Selected property view | 95 m | −42° | Latest selected fictional property footprint |

All presets use a fixed heading, pitch, range, and one-second Cesium flight.
The overall range was increased during review so property labels use their
existing distance limit and do not overlap in the presentation overview.

## Automated and static results

| Check | Result |
| --- | --- |
| `npm run validate:disaster-data` | Pass |
| `npm run build` | Pass |
| `git diff --check` | Pass |
| No-selection state | Pass: selected-property button was disabled |
| Overall preset ×5 | Pass: stable world position/direction and above-ground completion |
| Flood preset ×5 | Pass: stable world position/direction and above-ground completion |
| Selected property preset ×5 | Pass for `PROP-001` and `PROP-005` |
| Latest selection | Pass: second property produced a distinct current-property view |
| Arbitrary-view recovery | Pass: flood preset returned to the same final camera state |
| Overall framing | Pass: flood corners, route extent, and shelter coordinate were inside the viewport |
| Viewer lifecycle | Pass: camera requests retained the same Cesium viewer |
| Four-mode regression | Pass: one viewer remained and disaster selection cleared on re-entry |
| Browser exceptions | Pass: no application exception or unhandled rejection |

The automated browser allowed each one-second flight to fully settle before
comparing its final world-space position and direction. It used a sub-meter
position tolerance to exclude software-WebGL interpolation noise while still
detecting visible cumulative drift.

## Visual inspection

- Overall view showed all six properties and the mock flood extent without
  overlapping property labels.
- Flood view clearly framed the translucent flood volume and exact mock-layer
  label.
- Selected-property view showed the current highlighted building at a useful
  oblique angle without ground clipping.
- Screenshots were captured for all three presets, inspected, and removed after
  the temporary browser run; no machine-specific test artifact is committed.

## Optional OSM Buildings

OSM Buildings are not enabled in the current project, so the browser run covered
the supported OSM-off configuration. The preset implementation depends only on
scenario coordinates and owned Cesium entities; it does not inspect, add, hide,
or require an OSM tileset.

## Scope verification

- No shelter or route rendering was added.
- No OSM Buildings or imagery integration was added.
- No live data, real HEC-RAS processing, or emergency guidance was added.
- No dependency or lockfile changed.

## Known pre-existing warnings

- Local Node 20.17.0 is below Vite's recommended Node 20.19+ or 22.12+ runtime.
- The production build reports the existing protobuf direct-eval warning.
- The production build reports the existing large-bundle advisory.
- The controlled-facility regression can report the existing terrain-outline
  warning.
- External imagery may report DNS/network errors when the tile service is
  temporarily unreachable.

These warnings did not fail the build and were not introduced by DR-009.

## Manual approval

Status: Pending repository-owner walkthrough.

The repository owner should exercise the disabled state, run every preset five
times, select two different properties, recover from arbitrary camera angles,
check for clipping or visible drift, smoke-test existing modes, and inspect the
browser console before merging.
