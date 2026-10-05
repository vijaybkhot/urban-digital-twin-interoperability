# Urban Resilience Panel Regression Checklist

This checklist verifies the urban resilience demo's side panel
(`src/components/UrbanResilienceDemoPanel/`). The repo has no UI test runner, so
this checklist, run by hand in a browser, is the check for panel changes. Run it
after any change to the panel, its sections, the layer registry, or the safety
wording.

Safety wording is part of what is being tested: a note that is moved is fine, a
note that is reworded or hidden is a failure (see
[ADR 006](decisions/006-urban-resilience-real-data-guardrails.md)).

## Automated Checks

- [ ] Use the Node version in `.nvmrc`. With an older Node, `npm ci` silently
  skips the bundler's native binary and the build fails.
- [ ] Confirm the whitespace check is clean: `git diff --check`
- [ ] Confirm data validators, type check, and build pass: `npm run validate`
  (the protobufjs `eval` warning and the >500 kB chunk warning are expected)
- [ ] Confirm no data files changed: `git status --porcelain public/` is empty
- [ ] Confirm only `src/cesium/` and `src/adapters/viewer/` import `cesium`:
  `grep -rln "from \"cesium\"" src`

## Local Smoke Test

- [ ] Start the dev server: `npm run dev` (read the real port from its output)
- [ ] The app opens directly in the urban resilience demo with no console errors.

## Panel Structure

- [ ] Order is exactly: header, red disclaimer, then **Study area & scenario**,
  **Data layers**, **Selected feature**, **Response context**,
  **Data sources & provenance**, **Research & experimental**.
- [ ] The header and the red disclaimer are always visible and are not inside a
  collapsible section.
- [ ] The first four sections start open; the last two start collapsed.
- [ ] The **Data sources & provenance** summary shows "FEMA NFHL, OpenStreetMap,
  USGS 3DEP" while the section is collapsed.
- [ ] Each section opens and closes by clicking its summary.
- [ ] Each section can be focused with Tab and toggled with Enter or Space; the
  focus ring is visible.
- [ ] Scrolling the panel keeps the current section's title stuck at the top, and
  clicking it collapses that section; the title background hides the content
  scrolling underneath.
- [ ] Opening **Data sources & provenance** closes **Research & experimental**,
  and the reverse. The first four sections are not affected.
- [ ] The panel width, position, and colors are unchanged.
- [ ] Section borders and spacing look right at every seam, including the first
  and last section and with sections open and closed.
- [ ] With the window about 700 px tall, the panel scrolls inside itself and the
  bottom-right mode switcher stays visible and is not overlapped.
- [ ] The panel's own Collapse/Expand button still works, and expanding again
  does not refetch the ground-elevation sample.

## Study Area And Scenario

- [ ] "Scenario" starts collapsed. Opening it (click, or Enter/Space) shows the
  name, area, center, and description unchanged.
- [ ] Overall view and Flood zone view move the camera.
- [ ] Selected property view is disabled until a building is selected.
- [ ] "Current prototype scope" and its note "This is a research classification,
  not an official flood determination, insurance requirement, or evacuation
  order." are visible without opening anything.

## Data Layers

- [ ] The map legend is the first item and has five rows with the experimental
  layers off.
- [ ] Response routes: turning it off hides the purple routes and their legend
  rows; turning it on restores them. (Known: the staging points stay on the map
  while their legend row hides.)
- [ ] Optional facility layer: turning it on shows the facility markers, two
  more legend rows, its safety note, and the "Four reviewed OSM records…"
  coverage note. Turning it off hides all of these.
- [ ] Experimental layer: turning it on shows the LA-1 lines, its safety note, the
  sentence about the purple routes being controlled separately, and the
  three-row line legend. Turning it off hides the lines and the line legend.
- [ ] Routes and the experimental layer can be on together, or each on its own.
- [ ] With the default setup there is no "3D context" block. With
  `VITE_ENABLE_URBAN_OSM_BUILDINGS=true` it shows "Additional 3D context: On",
  or "…is unavailable" when no ion token is set, plus its sentence.

## Selected Feature

- [ ] With nothing selected, only the building prompt is shown. The facility
  prompt appears only with facilities on; the LA-1 prompt only with the
  experimental layer on.
- [ ] Clicking a building shows one property dashboard and one ground-elevation
  block, and no second copy of the red disclaimer.
- [ ] Clicking a facility marker replaces the property dashboard; one elevation
  block is shown.
- [ ] Clicking an LA-1 line shows only the LA-1 inspector (no elevation block).
- [ ] Clicking empty map clears the selection back to the single empty state.
- [ ] With the elevation sample GeoJSON blocked in DevTools and the page
  reloaded, "The local ground-elevation sample is unavailable." appears once
  and the rest of the panel works.
- [ ] "Missing elevation is represented as unavailable, never as zero." is
  present whenever an elevation block is shown.

## Response Context And Provenance

- [ ] Response context lists the routes, then "Regional staging references (3)"
  collapsed, followed by its note "Illustrative research context only…", which
  is visible while the staging list is closed.
- [ ] Clicking or pressing Enter/Space on "Regional staging references (3)"
  shows the three entries with their wording unchanged.
- [ ] Opening **Data sources & provenance** shows the attribution links
  (OpenStreetMap, FEMA NFHL, USGS 3DEP) and the provenance feed with its note
  "…This is not live monitoring."
- [ ] Opening **Research & experimental** shows the link to the ArcGIS
  experiment, and it loads at `/experiments/arcgis-urban-resilience/`.

## Safety Wording

- [ ] The red disclaimer is shown once in the panel.
- [ ] Every `role="note"` that was visible before the change is still visible
  whenever the content it qualifies is visible. A note may be inside a
  collapsed section only if the content it qualifies is in that same section.
- [ ] No section containing a note that qualifies always-visible content starts
  collapsed.
- [ ] Unknown never reads as Low; zero OSM results is never described as
  absence.

## Accessibility

- [ ] Every `aria-labelledby` points at an existing id:
  `grep -rhoE 'aria-labelledby="[^"]+"' src/components/UrbanResilienceDemoPanel`
  and confirm each id exists in the same folder.
- [ ] Each section heading is an `h2`; headings inside sections are `h3`.

## Mode Switching

- [ ] Switching to another mode and back restores the registry defaults: routes
  on, experimental layers off, nothing selected.

## Residual Risks

- These checks are manual. Headless-browser checks are only a first pass: they
  freeze Cesium animation and have reported false passes.
- Cesium camera and entity behavior depend on WebGL, so spot-check on the target
  machine.
