# DR-004 Test Evidence

This record covers the hidden disaster GeoJSON lifecycle introduced by DR-004.
Property styling, extrusion, labels, and selection remain deferred to DR-005.

## Environment and revision

- Date: 2026-08-03
- Tester: Codex, on behalf of the repository owner
- Browser: Google Chrome 150.0.7871.187, headless with SwiftShader WebGL
- Revision: DR-004 branch working tree; exact commits are recorded in the PR
- Viewport: 1440×900

## Automated checks

- `npm run validate:disaster-data`: passed with six fictional properties
- `npm run build`: passed TypeScript and Vite production compilation
- `git diff --check`: passed
- Existing four-mode Chrome regression: passed three complete cycles

The build retained the existing Node 20.17/Vite version recommendation,
protobuf direct-eval warning, and large-bundle warning. The existing Cesium
terrain-outline warning also remained. No new normal-operation error or warning
was introduced.

## Disaster lifecycle test

A temporary Chrome/CDP harness instrumented the adapter at runtime without
adding a production diagnostics API. It verified:

- One hidden `GeoJsonDataSource` loaded in disaster mode.
- The source contained exactly six property entities and `show` was `false`.
- Ten disaster entry/exit cycles each returned to zero owned data sources.
- Exactly one Cesium container remained throughout the cycles.
- A delayed GeoJSON response completed after mode exit without attaching to the
  destroyed/replaced viewer.
- One malformed-GeoJSON response produced one handled adapter warning, zero
  unhandled rejections, and no retry.
- Reloading and re-entering disaster mode created one clean hidden source.
- Fourteen scripted property requests covered normal loads, ten cycles, delayed
  completion, handled failure, and reload; no automatic retry occurred.
- No application console error or unhandled exception occurred.

The failure test used an HTTP 200 response with truncated JSON so it exercised
the loader's parsing failure without manufacturing a browser-level 404 error.
The warning was expected only in that targeted test.

A temporary disaster-mode screenshot confirmed that no unfinished default
property polygons were visible. The harness and screenshot are not committed.

## Manual approval gate

Repository-owner manual testing is pending. The DR-004 PR must not merge until
the owner completes the PR walkthrough and explicitly approves the result.
