# Handoff Acceptance Test

This test checks whether the handoff documentation works for someone other
than its author. It is the closing gate of the September 2026 research handoff
(#121, HO-24).

"The docs exist" is not the bar. The bar is that the continuing researcher can
set up, run, understand, regenerate, change, and extend this prototype using
**only the committed documentation**.

Record the results in
[`acceptance-test-evidence.md`](acceptance-test-evidence.md).

## Ground rules

- **The continuing researcher drives**, on their own machine, from a fresh
  clone. **The project author only observes.**
- **The author does not answer questions, hint, or point at the screen.** The
  point of the test is to find what the documentation is missing. A coached
  pass hides exactly the gaps this test exists to find.
- **Every question asked aloud is a documentation defect.** The observer writes
  it down word for word in the evidence file, with the task number. The
  researcher may still ask; the observer replies "noted, use the docs" and
  moves on. If the researcher is fully blocked, the observer may unblock them
  after logging the question, and marks that task **partial**.
- **Record failures honestly.** A partial pass with filed issues is a
  legitimate, useful result. Do not change a pass condition to match what
  happened.
- **Do not commit regenerated data.** Task 6 regenerates one dataset in a
  separate scratch clone. That output is compared and then thrown away (see
  [`docs/data/regeneration.md`](../data/regeneration.md), "If you are
  regenerating data for real").
- Feature ideas that come up during the test become issues, not changes made
  during the session.

## Before the session

The observer:

1. Notes the commit SHA of `main` that the test will use.
2. Confirms the researcher has write access to the GitHub repository, or
   agrees that task 9's PR comes from a fork and the author merges it. Either
   way, the researcher does the work.
3. Opens a copy of
   [`acceptance-test-evidence.md`](acceptance-test-evidence.md) and fills in
   the session details.
4. Hands the researcher this file and the repository URL, and nothing else:
   `https://github.com/vijaybkhot/urban-digital-twin-interoperability`

Allow about half a day. Tasks 6 and 9 take the longest.

## The tasks

Each task lists where to start and what counts as a pass. The researcher may
use any committed document. "Unaided" means without asking the observer.

### Task 1 — Clone and set up

- **Start from:** `README.md` and
  [`docs/handoff/onboarding.md`](onboarding.md).
- **Do:** clone the repository, install the right Node version, run `npm ci`.
- **Pass:**
  - `npm ci` succeeds.
  - The researcher identifies the Node requirement without asking: version
    `20.19.0` or newer, with `22.12.0` pinned in `.nvmrc`. On Windows,
    `nvm use` doesn't read `.nvmrc`, so it's `nvm use 22.12.0`.
- **If it fails:** [`troubleshooting.md`](troubleshooting.md) covers the
  PowerShell execution policy, nvm on Windows, and the `engines` floor.
  Finding the fix there counts as unaided.

### Task 2 — Launch the app

- **Start from:** the onboarding guide's "15-minute path".
- **Do:** run `npm run dev` and open the app, then open the ArcGIS experiment
  at `/experiments/arcgis-urban-resilience/`.
- **Pass:**
  - The app opens in the urban resilience demo. It shows the "Grand Isle &
    Port Fourchon Coastal Resilience" panel on the left and the mode switcher
    in the bottom-right corner.
  - The ArcGIS page loads.
  - The researcher can say whether a Cesium ion token is needed. **It is not
    needed** to run the app or any data step. Without it, the base map shows
    as a flat green field at this zoom level (see "The globe renders as a
    flat, solid green field" in [`troubleshooting.md`](troubleshooting.md)).
  - The researcher knows where a token would go: `.env.local`, copied from
    `.env.example`, and never committed.

### Task 3 — Run validation

- **Do:** run `npm run validate`.
- **Pass:**
  - It passes.
  - The researcher can say what it checks: 5 data validators, the TypeScript
    check (`tsc`), and the production build. All run offline, against
    committed data.
  - They can also say what it does **not** do: there are no unit or UI tests,
    no linter, and it never re-downloads data from the public sources.

### Task 4 — Identify the modes and layers

- **Start from:** the onboarding guide, and
  [`docs/data/urban-resilience-layers.md`](../data/urban-resilience-layers.md).
- **Do:** use the mode switcher to visit all five modes, and open each of the
  six sections of the urban panel.
- **Pass, unaided:**
  - Names all five modes and states that the **urban resilience demo is the
    Sea Grant deliverable**.
  - Classifies each mode:

    | Mode | Classification |
    | --- | --- |
    | Urban resilience demo | Implemented, real data |
    | New project workflow | Mock |
    | Existing demo | Mock / legacy |
    | Modular housing demo | Mock |
    | Disaster resilience demo | Mock / fictional |

  - Lists the urban layers and says which are experimental:
    - **core:** buildings/properties; FEMA flood hazard; response routes and
      staging references;
    - **experimental:** community/public-safety facilities; the LA-1/FEMA
      segments; the ground-elevation sample (shown in the inspector, not as a
      map layer);
    - **optional:** the Cesium OSM Buildings 3D context, turned on by an
      environment variable.

### Task 5 — Locate the data sources

- **Start from:** [`docs/data/data-register.md`](../data/data-register.md)
  only.
- **Do:** for each dataset below, find four things: the organization behind
  it, the endpoint it comes from, the script that generates it, and the
  committed file it produces.
  - buildings
  - FEMA flood zones
  - facilities
  - ground elevation
  - LA-1 segments
- **Pass:** all five datasets are answered correctly from the register alone.

### Task 6 — Explain and reproduce a workflow

- **Start from:** the data register and
  [`docs/data/regeneration.md`](../data/regeneration.md).
- **Do, part 1 (explain):** describe in your own words how the OpenStreetMap,
  FEMA, and USGS data each get from a public service into a committed GeoJSON
  file (fetch → cache → build → validate).
- **Do, part 2 (reproduce):** regenerate the **facility experiment**, the
  smallest dataset (4 features), **in a separate scratch clone, not the main
  working copy**:
  1. Clone the repository into a temporary folder and run `npm ci` there.
  2. Run the facility fetch, build, and validate commands in the order
     `regeneration.md` gives.
  3. Compare the result with the committed file, for example with
     `git diff --stat public/`.
  4. Explain any difference, then delete the scratch clone. **Commit nothing.**
- **Pass:**
  - The three workflows are explained correctly.
  - The regeneration runs.
  - The researcher identifies on their own that the fetch must come before
    the build.
  - They know the ground-elevation sample reads the committed facility output,
    so order matters when regenerating more than one dataset.
  - Any difference from the committed file is explained, not committed.
- **Bonus:** explains the pinned-manifest hazard: why a re-fetch can renumber
  IDs and break validation, and the migration procedure in `regeneration.md`.
- **Note:** this task makes live requests to the OpenStreetMap Overpass API.
  If Overpass is rate-limiting or down, record that as an environment issue,
  not a documentation failure ([`troubleshooting.md`](troubleshooting.md)
  covers the retry behavior).

### Task 7 — Distinguish real from mock

- **Pass, unaided:** correctly labels each of these as mock, fictional, or
  unused:
  - the reconstruction workflow (simulated; no real photogrammetry);
  - the Baton Rouge disaster demo (fictional);
  - the modular housing demo (mock);
  - `MockAgentProvider` (not imported anywhere; a placeholder, not a
    capability).
- The researcher also states two interpretation rules:
  - **FEMA zone → risk tier is a documented proxy**, not a computed risk
    score.
  - **Port Fourchon showing "Unknown" is a coverage gap** in the FEMA data,
    not a low-risk finding.

### Task 8 — State the limitations

- **Pass:** names at least these, unaided:
  - it is not an operational or emergency system;
  - there is no backend, authentication, or database;
  - there is no hazard prediction or forecast;
  - the ArcGIS page proves the same data can be *displayed* in another
    viewer, not full system interoperability;
  - an OpenStreetMap query that returns nothing is not evidence that nothing
    exists there.

### Task 9 — Make one small, documented change

- **Start from:** the onboarding guide's "Make one small, real change".
- **Do:** create a branch, make a small change (for example, a register field
  or a legend label), run `npm run validate`, open a PR, and get it merged.
  - If the change is visible in the panel, also run the relevant part of
    [`docs/urban-resilience-panel-regression-checklist.md`](../urban-resilience-panel-regression-checklist.md).
- **Pass:** the PR passes CI and is merged. The researcher does all the work;
  the author may press merge if the researcher lacks write access.

### Task 10 — Locate an extension point

- **Start from:** [`docs/handoff/extending.md`](extending.md) and
  [`docs/research/scenario-mapping.md`](../research/scenario-mapping.md).
- **Do:** the observer poses two hypotheticals.
  - *A storm-surge layer from a new public source:* name every file you would
    touch.
  - *Taking Scenario A1 toward implementation:* name the data still missing
    and the steps before any code.
- **Pass, substantively correct:**
  - **The storm-surge file list** matches the extension guide's "Checklist:
    every file a new layer touches".
  - **The A1 answer** reflects the scenario-mapping document's open checks.
  - The guardrails are named:
    - only `src/cesium/` and the viewer adapter import Cesium;
    - scientific processing stays in `scripts/`;
    - every new dataset gets a provenance entry and conservative wording;
    - a new research direction gets an ADR before code;
    - no new hazard scores or predictions.

### Task 11 — Find the remaining work

- **Do:** locate the continuation roadmap (linked from `ROADMAP.md`).
- **Pass, unaided:**
  - Names three next priorities, with issue numbers where they exist.
  - States the author's recommended next step: research Scenario A, gather
    its data, and build a demo.
  - Identifies **#67** as the live research thread on LA-1 segments.

## Overall result

- **Pass:**
  - Tasks 1–8 and 11 are completed unaided.
  - Task 9 produces a merged PR.
  - Task 10 is substantively correct.
- **Partial pass:** any task needed the observer to unblock it. This is a
  legitimate outcome when every logged question has been fixed or filed.

## After the session

1. For every logged question: fix the document it exposed, or file an issue,
   and link the fix or issue in the evidence file.
2. Re-test each fixed step, ideally with the researcher again, and record the
   re-test result.
3. List anything unresolved under "Unresolved items" rather than leaving it
   out.
4. Commit the completed evidence file. Issue #121 is closed only then.
