# DR-007 Test Evidence — Disaster Property Selection

## Test context

- Date: 2026-08-05
- Baseline commit: `0cddfbc`
- Branch: `agent/dr-007-disaster-property-selection`
- Automated browser: Google Chrome 150.0.7871.187, headless with software WebGL
- Tester: Codex automated validation; repository-owner manual approval pending

## Automated and static results

| Check | Result |
| --- | --- |
| `npm run validate:disaster-data` | Pass: six properties; four inside and two outside the mock flood extent |
| `npm run build` | Pass |
| `git diff --check` | Pass |
| Six property roof/wall picks | Pass: each emitted its matching `PROP-001` through `PROP-006` ID |
| React selection panel | Pass: updated to the latest selected property ID |
| Deterministic highlight | Pass: exactly one property displayed the selected visual state |
| Rapid selection | Pass: the final click won |
| Empty-terrain click | Pass: emitted no selection |
| Mode cleanup | Pass: selection was absent after leaving and re-entering disaster mode |
| Viewer lifecycle | Pass: one Cesium viewer remained after the navigation cycle |
| Browser errors | Pass: no application console errors or unhandled exceptions |

The browser harness was temporary and was not added to the repository. Temporary
diagnostic references used to inspect Cesium entity ownership were removed before
the final source review.

## Selection behavior reviewed

- Only entities carrying `entityType: "disasterProperty"` and a string
  `disasterPropertyId` emit the new viewer selection.
- Cesium property labels are deliberately ignored as selection targets.
- The mock flood layer, empty terrain, and entities from other demo modes do not
  emit disaster-property selections.
- React owns the selected property ID and passes it back through the existing
  selected-entity update path; changing selection does not recreate the viewer.
- Entering workflow, controlled-facility, modular-housing, or a fresh disaster
  session clears disaster-property selection.

## Visual behavior

The selected property retains its risk hue and gains an opaque material, pale
yellow outline and label, `Selected` label prefix, slightly larger label, and dark
label background. Every other property is restored to its normal risk styling.

## Known pre-existing warnings

- Local Node 20.17.0 is below Vite's recommended Node 20.19+ or 22.12+ runtime.
- The production build reports the existing protobuf direct-eval warning.
- The production build reports the existing large-bundle advisory.

These warnings did not fail the build and were not introduced by DR-007.

## Manual approval

Status: Pending repository-owner walkthrough.

The repository owner should verify roof/wall picking, latest-click behavior,
non-property click isolation, highlight clarity, mode-exit cleanup, existing-mode
regression behavior, and a clean browser console before merging.
