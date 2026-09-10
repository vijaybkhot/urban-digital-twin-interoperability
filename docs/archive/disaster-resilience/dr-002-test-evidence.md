# DR-002 Test Evidence

This record covers the fictional property and disaster-scenario data introduced by
DR-002. All data is local, synthetic, and unsuitable for real emergency use.

## Automated checks

- Command: `npm run validate:disaster-data`
- Coverage: feature count, required fields, fictional labels, unique IDs, risk
  values, depth and height ranges, closed rings, coordinate ordering, polygon
  non-overlap, mock safety language, scenario linkage, property containment,
  route-to-shelter linkage, and five twin event sources.
- Command: `npm run build`
- Coverage: strict TypeScript compilation and Vite production build.
- Command: `git diff --check`
- Coverage: whitespace errors.

## Browser smoke test

- Date: 2026-08-03
- Tester: Codex, on behalf of the repository owner
- Revision: PR #54 follow-up commit; the exact SHA is recorded in the PR
  validation section after push
- Browser: Google Chrome 150.0.7871.187, headless with SwiftShader WebGL
- Checks: application startup, browser console, existing project demo, modular
  housing demo, and the local GeoJSON response.
- Result: passed. The workflow, controlled-facility demo, modular-housing demo,
  and six-feature GeoJSON loaded without application errors or unhandled
  exceptions. Headless SwiftShader emitted only expected WebGL performance and
  existing terrain-outline warnings.

The disaster-resilience properties are not expected to render yet. Cesium
rendering is intentionally deferred to DR-005.

## Manual reviewer walkthrough

1. Run `npm run validate:disaster-data` and confirm it reports six properties.
2. Run `npm run build` and confirm it exits successfully.
3. Run `npm run dev`, then open the printed URL in a browser.
4. Open the existing controlled-facility demo and check the browser console.
5. Return to the new-project workflow.
6. Open the modular-housing demo and check the browser console.
7. Open `/examples/disaster_resilience_properties.geojson` and confirm the six
   fictional property features are served.
