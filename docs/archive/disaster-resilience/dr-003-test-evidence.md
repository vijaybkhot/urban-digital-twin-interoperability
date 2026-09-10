# DR-003 Test Evidence

This record covers the isolated Disaster Resilience Demo mode introduced by
DR-003. No disaster GeoJSON or Cesium hazard layers are rendered in this issue.

## Automated checks

- Date: 2026-08-03
- Tester: Codex, on behalf of the repository owner
- Revision: DR-003 branch working tree; exact commit recorded in the DR-003 PR
  after push
- `npm run validate:disaster-data`: passed with six fictional properties
- `npm run build`: passed TypeScript and Vite production compilation
- `git diff --check`: passed

The build retained the existing Node 20.17/Vite version recommendation,
protobuf direct-eval warning, and large-bundle warning. No new build error was
introduced.

## Chrome mode-isolation test

- Browser: Google Chrome 150.0.7871.187, headless with SwiftShader WebGL
- Viewports: 1440×900 and 390×844
- Result: passed

The automated browser walkthrough completed three cycles of:

```text
workflow
→ disaster
→ controlled facility
→ disaster
→ modular housing
→ disaster
→ workflow
```

Verified in every cycle:

- One Cesium container and one primary mode panel were present.
- The disaster heading, scenario center, and exact disclaimer were visible.
- Entering disaster mode made no `project_config.json` request.
- Existing-demo entries made four intentional config requests in total,
  including the stale-navigation test.
- Starting an existing-demo load and immediately opening modular housing did
  not allow the older asynchronous navigation to take control.
- Disaster UI was absent from the workflow, controlled-facility, and modular
  modes.
- No application console error or unhandled exception occurred.
- The narrow disaster panel stayed within the viewport without horizontal
  document overflow; its disclaimer remained visible.

Temporary screenshots were captured for the workflow, disaster,
controlled-facility, modular-housing, and narrow disaster views. They are test
artifacts and are not committed to the repository.

Headless SwiftShader may emit WebGL performance messages. The existing Cesium
terrain-outline warning also appeared; neither is caused by DR-003.

## Review correction and regression run

The pull-request review found that a superseded controlled-facility request
could still update hidden project state after navigation to another mode. The
project-state hook now invalidates pending loads when the project is cleared
and ignores stale success, error, and loading updates.

After that correction, the data validation, production build, diff check, and
complete Chrome walkthrough above were repeated successfully. The delayed-load
test again left modular housing active, and no application error or unhandled
exception was reported.

## Manual approval gate

Repository-owner manual testing is pending. The DR-003 PR must not merge until
the owner completes the PR walkthrough and explicitly approves the result.
