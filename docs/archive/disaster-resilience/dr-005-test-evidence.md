# DR-005 Test Evidence

This record covers the visible risk-styled, extruded fictional properties added
by DR-005. Property selection and the resident dashboard remain deferred.

## Environment and revision

- Date: 2026-08-04
- Tester: Codex, on behalf of the repository owner
- Browser: Google Chrome 150.0.7871.187, headless with SwiftShader WebGL
- Viewport: 1440×900
- Revision: DR-005 branch working tree; exact commits are recorded in the PR

## Automated checks

- `npm run validate:disaster-data`: passed with six fictional properties
- `npm run build`: passed TypeScript and Vite production compilation
- `git diff --check`: passed
- Existing four-mode Chrome regression: passed three complete cycles

The build retained the existing Node 20.17/Vite version recommendation,
protobuf direct-eval warning, and large-bundle warning. The existing Cesium
terrain-outline warning appeared during the modular regression. No new
normal-operation application warning or error was introduced.

## Property rendering assertions

A temporary Chrome/CDP harness inspected the Cesium entities and confirmed:

- One visible GeoJSON data source contained exactly six unique properties.
- Every `extrudedHeight` exactly matched the source `building_height_m`.
- Every roof label position was 1.5 m above its source building height.
- Every entity retained `property_id` and added matching
  `entityType: disasterProperty` and `disasterPropertyId` metadata.
- PROP-001/PROP-004 used Low green `#22c55e`.
- PROP-002/PROP-006 used Moderate amber `#f59e0b`.
- PROP-003/PROP-005 used High red `#ef4444`.
- All property materials used alpha `0.82` and labels included textual risk.
- A synthetic unsupported risk used neutral slate `#64748b`, displayed
  `Unclassified risk`, and an invalid height used the 6 m fallback.

The same harness completed ten entry/exit cycles with zero retained sources,
confirmed delayed-load cancellation, handled one malformed-GeoJSON response
without retry, and reloaded cleanly.

## Visual evidence

Temporary overhead and 38-degree oblique screenshots were captured. The
overhead view showed the six green/amber/red footprints without long-range
label clutter. The oblique view showed roofs, walls, white outlines, and all six
fictional name-plus-risk labels. No obvious sinking, floating, or overlap was
visible. Screenshots and machine-specific harness code are not committed.

## Manual approval gate

Manual review correctly noted that the synthetic footprints do not align with
the real-world features visible in configured base imagery. The panel now
states prominently that the demonstration footprints are not aligned with real
parcels, buildings, roads, or addresses. This avoids associating fictional risk
values with the real properties beneath the visualization.

Repository-owner manual testing is pending. The DR-005 PR must not merge until
the owner completes the PR walkthrough and explicitly approves the result.
