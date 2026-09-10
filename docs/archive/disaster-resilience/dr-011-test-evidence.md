# DR-011 Test Evidence — Multi-Twin Event Feed and Map Legend

## Test context

- Date: 2026-08-05
- Baseline commit: `7385cc7`
- Branch: `agent/dr-011-event-feed-map-legend`
- Automated browser: Google Chrome 150.0.7871.187, headless with software WebGL
- Viewports: 1440×810 desktop and 390×844 narrow/mobile
- Tester: Codex automated validation; repository-owner manual approval pending

## Deterministic event contract

| Order | Source | Stable ID | Timestamp |
| ---: | --- | --- | --- |
| 1 | Weather Twin | `event-weather-001` | `2025-06-01T14:00:00Z` |
| 2 | Flood Model Twin | `event-flood-001` | `2025-06-01T14:01:00Z` |
| 3 | Property Twin | `event-property-001` | `2025-06-01T14:02:00Z` |
| 4 | Response Twin | `event-response-001` | `2025-06-01T14:03:00Z` |
| 5 | AI Assistant | `event-ai-001` | `2025-06-01T14:04:00Z` |

The feed sorts the local scenario events by timestamp and stable ID. A forced
browser reload produced an identical event and legend snapshot. The AI event
contains mock-only wording and displays a separate `Mock output` badge.

## Legend contract

| Legend item | Shared scene color |
| --- | --- |
| Low-risk property | `#22c55e` |
| Moderate-risk property | `#f59e0b` |
| High-risk property | `#ef4444` |
| Selected property outline/label | `#fef08a` |
| Mock flood-depth layer | `#38bdf8` |
| Fictional safe point | `#06b6d4` |
| Mock response route | `#a855f7` |

The React legend and Cesium render helpers import the same pure color-token
object, preventing separate hard-coded values from drifting apart.

## Automated and static results

| Check | Result |
| --- | --- |
| `npm run validate:disaster-data` | Pass |
| `npm run build` | Pass |
| `git diff --check` | Pass |
| Required sources | Pass: all five appear once in the required order |
| Event identity | Pass: five unique IDs and timestamps |
| Timestamp display | Pass: deterministic UTC text and machine-readable `dateTime` |
| Reload determinism | Pass: event and legend snapshot identical after forced reload |
| Event network isolation | Pass: no event/feed/twin fetch or XHR request |
| AI framing | Pass: mock wording and visible `Mock output` badge |
| Legend completeness | Pass: seven required layer/selection items |
| Legend color parity | Pass: all seven tokens match the Cesium scene tokens |
| 390×844 overflow | Pass: no page or panel horizontal overflow |
| Narrow scrolling | Pass: five feed cards and the complete legend remain available |
| Disclaimer access | Pass: disclaimer remains sticky at the panel's padded top edge |
| Mode regression | Pass: workflow, modular, and disaster transitions retain one viewer |
| Browser exceptions | Pass: no application exception or unhandled rejection |

## Visual inspection

- Desktop legend symbols were distinct, readable, and consistent with the map.
- Desktop feed showed stable sequence numbers, UTC timestamps, sources, and
  messages without clipping.
- At 390×844, every event wrapped within the panel and the feed remained
  vertically scrollable without horizontal scrolling.
- The sticky emergency-use disclaimer remained visible while the event feed was
  in view.
- Temporary legend, feed, and narrow-viewport screenshots were inspected and
  are not committed.

At phone width the overlay panel intentionally occupies most of the viewport,
as it did before DR-011. This ticket verifies the feed and legend presentation;
it does not redesign the application into a split-screen mobile map.

## Safety-copy and network review

- The global disclaimer remains: `Demonstration only. Not for real emergency use.`
- The feed identifies itself as fixed local demonstration content and explicitly
  says it is not live monitoring.
- The feed makes no real forecast, prediction, or recommendation claim.
- AI Assistant output is explicitly mock.
- The shelter, route, flood, and property qualifications remain intact.
- Events come directly from the imported local scenario object; no event API,
  polling, subscription, or retry behavior exists.

## Scope verification

- No scenario event values were changed.
- No live data source, timer, polling loop, or network dependency was added.
- No Cesium entity lifecycle or selection behavior was changed.
- No dependency or lockfile changed.

## Known pre-existing warnings

- Local Node 20.17.0 is below Vite's recommended Node 20.19+ or 22.12+ runtime.
- The production build reports the existing protobuf direct-eval warning.
- The production build reports the existing large-bundle advisory.
- External imagery may report DNS/network errors when its tile service is
  temporarily unreachable.

These warnings did not fail the build and were not introduced by DR-011.

## Manual approval

Status: Pending repository-owner walkthrough.

The repository owner should enumerate the five feed sources, reload and compare
their order/content, compare all seven legend symbols to the map, select a
property and verify its yellow selected styling, test the complete panel at
390×844, review safety language, smoke-test existing modes, and inspect the
browser console before merging.
