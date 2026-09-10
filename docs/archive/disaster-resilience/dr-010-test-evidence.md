# DR-010 Test Evidence — Fictional Shelter and Mock Response Route

## Test context

- Date: 2026-08-05
- Baseline commit: `9e173b8`
- Branch: `agent/dr-010-shelter-response-route`
- Automated browser: Google Chrome 150.0.7871.187, headless with software WebGL
- Tester: Codex automated validation; repository-owner manual approval pending

## Visual and data contract

| Item | Scenario value | Rendered result |
| --- | --- | --- |
| Shelter | `Cypress Community Safe Point (fictional)` | One cyan point and label |
| Route | `Mock neighborhood response route` | One purple line with a white outline |
| Route status | `at-risk` | `At Risk` in the map and panel |
| Route positions | Four local coordinates | Four matching Cartesian positions |
| Route height | Illustrative display setting | 4 m above the ellipsoid |

The route terminates at the fictional safe-point coordinate. Both entities use
stable disaster-specific metadata and are owned by the existing disaster-layer
lifecycle collection.

## Automated and static results

| Check | Result |
| --- | --- |
| `npm run validate:disaster-data` | Pass |
| `npm run build` | Pass |
| `git diff --check` | Pass |
| Entity counts | Pass: one shelter, one route, and one flood entity |
| Shelter contract | Pass: ID, metadata, label, and coordinate match the scenario |
| Route contract | Pass: ID, metadata, status, label, endpoints, and four positions match |
| Route visibility | Pass: every route position uses the 4 m illustrative height |
| Click isolation | Pass: shelter and three route-segment clicks emitted no selection |
| Overall framing | Pass: shelter and complete route were visible after `Overall view` |
| Viewer lifecycle | Pass: ten entry/exit cycles retained three disaster entities only while active |
| Four-mode regression | Pass: one viewer and three active disaster entities on re-entry |
| Browser exceptions | Pass: no application exception or unhandled rejection |

The browser test used actual Cesium screen-space clicks against the shelter and
three separated route locations. The existing property-selection callback did
not receive an event from any of those response entities.

## Visual inspection

- The cyan safe-point marker and fictional label were readable in the Overall
  view.
- The purple route and white outline remained distinct over imagery, property
  structures, and the translucent flood layer.
- The `Mock route status: At Risk` label was readable without being mistaken
  for a property label.
- The route endpoint visibly met the fictional safe-point marker.
- Temporary Overall and response-detail screenshots were inspected and are not
  committed.

## Safety-language review

- The global disclaimer remains: `Demonstration only. Not for real emergency use.`
- The safe point is explicitly described as fictional and not a real shelter or
  emergency destination.
- The route is explicitly described as illustrative, non-operational, and not
  an evacuation route, recommendation, or real guidance.
- No runtime copy claims live conditions, validation, prediction, or operational
  availability.

## Scope verification

- No live shelter, traffic, road-closure, weather, or emergency data was added.
- No routing engine or real evacuation logic was added.
- No response-entity selection or new dashboard was added.
- No dependency or lockfile changed.

## Known pre-existing warnings

- Local Node 20.17.0 is below Vite's recommended Node 20.19+ or 22.12+ runtime.
- The production build reports the existing protobuf direct-eval warning.
- The production build reports the existing large-bundle advisory.
- The controlled-facility regression can report the existing terrain-outline
  warning.
- External imagery may report DNS/network errors when its tile service is
  temporarily unreachable.

These warnings did not fail the build and were not introduced by DR-010.

## Manual approval

Status: Pending repository-owner walkthrough.

The repository owner should inspect the safe point and complete route from the
Overall view, compare the `At Risk` status on the map and panel, click the safe
point and several route segments to confirm selection isolation, repeat mode
entry/exit, smoke-test existing modes, and inspect the browser console before
merging.
