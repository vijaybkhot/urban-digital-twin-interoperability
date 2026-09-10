# DR-006 Test Evidence

This record covers the local mock flood-depth volume added by DR-006. It does
not cover property selection, a resident dashboard, shelter or route entities,
or real flood-model processing.

## Environment and revision

- Date: 2026-08-04
- Tester: Codex, on behalf of the repository owner
- Browser: Google Chrome 150.0.7871.187, headless with SwiftShader WebGL
- Viewport: 1440×900
- Revision: DR-006 branch working tree; exact commits are recorded in the PR

## Static and safety checks

- `npm run validate:disaster-data`: passed with six fictional properties,
  four inside and two outside the mock flood boundary
- `npm run build`: passed TypeScript and Vite production compilation
- `git diff --check`: passed
- Runtime safety-copy search: passed; every HEC-RAS reference is explicitly
  mock or states that it is not real output
- Dependency and lockfile changes: none

The build retained the existing Node 20.17/Vite version recommendation,
protobuf direct-eval warning, and large-bundle warning. The existing Cesium
terrain-outline warning appeared during the modular regression. No new
normal-operation application warning or error was introduced.

## Flood rendering assertions

A temporary Chrome/CDP harness inspected the Cesium runtime and confirmed:

- Exactly one disaster-owned flood entity rendered with the expected stable ID
  and `disasterFloodLayer` metadata.
- The entity and panel both used the exact label
  `Mock HEC-RAS-style flood-depth layer.`
- The polygon used blue `#38bdf8` at alpha `0.26` with a visible light outline.
- The base height was `0.15 m` and the visual depth was exactly
  `2.4 × 0.3048 × 3 = 2.19456 m`.
- The four Moderate/High properties were fully inside the boundary; the two
  Low properties were fully outside; no property partially crossed it.
- All six property roofs, risk colors, outlines, and labels remained present.
- A real flood-entity pick returned flood metadata and emitted no viewer
  selection when clicked.

## Lifecycle and regression assertions

- Ten disaster-mode entry/exit cycles retained one flood entity while active
  and zero after exit.
- A delayed property request followed by navigation retained neither a stale
  property source nor a stale flood entity.
- One deliberately malformed property response produced one handled warning,
  did not retry, and left the independent flood layer visible.
- Reload initialized one flood entity and one six-property source cleanly.
- Three complete four-mode cycles passed with one viewer, one mode panel,
  intentional existing-demo requests only, and no application errors.

## Visual evidence

Temporary overhead and 38-degree oblique screenshots were inspected. The blue
extent and its label were visible in both views. The oblique view showed the
illustrative volume below the property roofs, with the two green Low-risk
properties outside the extent. No obvious depth fighting, sinking, floating,
or color masking was visible. Screenshots and the machine-specific harness are
not committed.

## Manual approval gate

Manual review identified ambiguity between the uniform blue visualization and
the property-specific risk colors. The scenario now defines a 1.0 ft mock
display-extent threshold and explicit property-risk thresholds: Low below 1.0
ft, Moderate from 1.0 to below 2.5 ft, and High at or above 2.5 ft. The panel
states that the blue extrusion is not property-level water depth and that the
diagonal property arrangement has no spatial or hydrologic meaning. The data
validator verifies every property risk and boundary placement against these
thresholds.

Repository-owner manual testing is pending. The DR-006 PR must not merge until
the owner completes the PR walkthrough and explicitly approves the result.
