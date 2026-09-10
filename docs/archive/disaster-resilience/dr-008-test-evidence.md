# DR-008 Test Evidence — Selected-Property Dashboard

## Test context

- Date: 2026-08-05
- Baseline commit: `ba286a3`
- Branch: `agent/dr-008-property-dashboard`
- Automated browser: Google Chrome 150.0.7871.187, headless with software WebGL
- Desktop viewport: 1440×900
- Narrow viewport: 390×844
- Tester: Codex automated validation; repository-owner manual approval pending

## Automated and static results

| Check | Result |
| --- | --- |
| `npm run validate:disaster-data` | Pass: six fictional properties remain valid |
| `npm run build` | Pass |
| `git diff --check` | Pass |
| Unselected state | Pass: explains how to select a fictional property |
| Source-to-dashboard comparison | Pass: all required fields matched for all six properties |
| Risk coverage | Pass: Low, Moderate, and High appeared as text and color |
| Numeric formatting | Pass: all estimated depths displayed to one decimal place with `ft` |
| Unsafe output check | Pass: no `undefined`, `NaN`, or `[object Object]` appeared |
| Long-copy handling | Pass: recommendation and confidence text wrapped within the panel |
| Viewer stability | Pass: all six dashboard updates retained the same Cesium viewer instance |
| 390×844 layout | Pass: panel stayed in the viewport, scrolled vertically, and had no horizontal overflow |
| Disclaimer | Pass: exact wording remained prominent and sticky while the panel scrolled |
| Browser errors | Pass: no application console errors or unhandled exceptions |

The automated browser harness and screenshots were temporary and were removed
after inspection. Temporary adapter diagnostics were also removed before the
final source review.

## Source-to-dashboard comparison

| Property | Risk | Expected depth | Dashboard result |
| --- | --- | ---: | --- |
| `PROP-001` | Low | 0.4 ft | Pass |
| `PROP-002` | Moderate | 1.3 ft | Pass |
| `PROP-003` | High | 2.8 ft | Pass |
| `PROP-004` | Low | 0.8 ft | Pass |
| `PROP-005` | High | 3.4 ft | Pass |
| `PROP-006` | Moderate | 2.0 ft | Pass |

For every row, the browser test also compared the fictional property label,
occupancy type, evacuation zone, nearest shelter, recommended action, data
source, confidence note, scenario name, risk text, and disclaimer with the local
scenario and GeoJSON values.

## Runtime safety behavior

- Cesium property values cross into React only after runtime validation.
- An incomplete property, unsupported risk, invalid depth, or invalid building
  height does not emit a selected-property payload.
- The dashboard formatting layer displays `Not available` for an invalid text or
  numeric display value as defense in depth.
- The selected property ID must match the validated GeoJSON `property_id`.
- No additional GeoJSON request was introduced for the dashboard.

## Visual inspection

- The Low-risk dashboard used green styling and visible `Low` text.
- The High-risk dashboard used red styling and visible `High` text.
- The 390×844 dashboard remained readable and scrollable without clipped or
  horizontally overflowing content.
- The emergency-use disclaimer remained visible at the top while scrolling.

## Known pre-existing warnings

- Local Node 20.17.0 is below Vite's recommended Node 20.19+ or 22.12+ runtime.
- The production build reports the existing protobuf direct-eval warning.
- The production build reports the existing large-bundle advisory.

These warnings did not fail the build and were not introduced by DR-008.

## Manual approval

Status: Pending repository-owner walkthrough.

The repository owner should compare one Low-, Moderate-, and High-risk property
with the local GeoJSON, inspect the longest text, test the 390×844 viewport,
confirm the disclaimer remains prominent, smoke-test existing modes, and check
the browser console before merging.
