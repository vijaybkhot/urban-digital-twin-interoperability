# DR-012 Test Evidence — Optional Cesium OSM Buildings

## Test context

- Date: 2026-08-05
- Baseline commit: `b85d38b`
- Branch: `agent/dr-012-optional-osm-buildings`
- Automated browser: Google Chrome 150.0.7871.187, headless with software WebGL
- Tester: Codex automated validation; repository-owner manual approval pending
- Token handling: the existing token remained in ignored `.env.local`; its value
  was never printed, copied into evidence, or committed

## Configuration results

| Configuration | OSM GETs | Retained tilesets | Local disaster result |
| --- | ---: | ---: | --- |
| Blank token | 0 | 0 | Pass: six properties and three standalone layers |
| Deliberately invalid test token | 1 | 0 | Pass: one handled fallback warning; local scene intact |
| Existing valid restricted token | 1 initial | 1 | Pass: Baton Rouge OSM buildings loaded |

The invalid test counted only the actual OSM asset `GET`; its successful CORS
`OPTIONS` preflight was not counted as a retry. Cesium's underlying ion provider
reported the expected 401 diagnostics for the deliberately invalid token. The
application caught the OSM promise rejection, issued one redacted warning, did
not retry, and continued without an unhandled rejection.

## Visual and authority contract

- OSM Buildings use a uniform white style at 55% opacity with outlines disabled.
- The gray context remained visually secondary to local Low/Moderate/High risk
  colors, the selected highlight, flood layer, route, and safe point.
- All six local properties remained selectable with OSM visible. Browser clicks
  used actual projected property positions and the dashboard returned the
  correct property ID each time.
- Click handling drills through overlapping context and prefers a local
  `disasterProperty` entity; OSM features never create property attributes.
- Runtime copy states that OSM is contextual only and that local fictional
  structures remain authoritative.

## Lifecycle results

- Five valid-token exit/re-entry cycles were completed after the initial load.
- Every exit cleared the previous adapter's tracked tileset.
- Every re-entry retained exactly one new OSM tileset and six local properties.
- Six valid OSM endpoint GETs therefore represent one initial load plus five
  intentional re-entry loads, not automatic retries.
- The existing disaster generation guard prevents a late tileset from entering
  a destroyed or replacement viewer.

## Attribution

- Cesium's on-map credit display and `Data attribution` control remained visible
  in the valid-token view.
- The panel explains that Cesium's on-map credit display supplies attribution
  whenever OSM tiles are shown.
- Attribution was not replaced, hidden, or hard-coded by the application.

## Automated and static results

| Check | Result |
| --- | --- |
| `npm run validate:disaster-data` | Pass |
| `npm run build` | Pass |
| `git diff --check` | Pass |
| Blank-token request isolation | Pass: no OSM request or warning |
| Invalid-token fallback | Pass: one GET, one handled warning, no retained tileset |
| Valid-token load | Pass: one styled tileset and visible Baton Rouge coverage |
| Property selection with OSM | Pass: all six local properties |
| Valid lifecycle ×5 | Pass: zero old and one active tileset per cycle |
| Local layer integrity | Pass: properties, flood, shelter, and route retained |
| Browser exceptions | Pass: no application exception or unhandled rejection |

## Visual inspection

- Blank-token screenshot showed the complete local-only scene.
- Invalid-token screenshot showed the complete fallback scene.
- Valid-token screenshot showed distinct OSM building context, readable local
  risk layers, and visible Cesium/data-attribution controls.
- Temporary screenshots were inspected and are not committed.

## Scope verification

- OSM loading occurs only for disaster mode and only when a non-empty ion token
  is configured.
- No OSM feature is copied into React state, the scenario, GeoJSON, or dashboard.
- No token, credential, dependency, or lockfile changed.
- No Google imagery or Google 3D Tiles integration was added.

## Known pre-existing warnings

- Local Node 20.17.0 is below Vite's recommended Node 20.19+ or 22.12+ runtime.
- The production build reports the existing protobuf direct-eval warning.
- The production build reports the existing large-bundle advisory.
- External imagery may report network errors when its service is unavailable.
- The intentionally invalid-token test produces expected Cesium ion 401 provider
  diagnostics; blank-token and valid-token normal operation do not.

## Manual approval

Status: Pending repository-owner walkthrough.

The repository owner should run blank, invalid, and valid configurations; compare
OSM-on and local-only readability; select every property with OSM visible; use
all disaster cameras; repeat mode transitions; verify on-map attribution; smoke
test existing modes; and inspect the console before merging.
